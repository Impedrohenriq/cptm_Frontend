import { blobToBase64 } from '@/services/offlineMedia.js'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:5001'
const IS_NGROK_TUNNEL = /ngrok(-free)?\./i.test(BASE)
const ENDPOINT = `${BASE}/api/formularios-efluente`
const HEALTH_ENDPOINT = `${BASE}/health`
const AUTH_ENDPOINT = `${BASE}/api/auth`
const TOKEN_KEY = 'cptm_auth_token'

function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

function headers({ auth = true } = {}) {
  const base = {
    'Content-Type': 'application/json',
    ...(IS_NGROK_TUNNEL ? { 'ngrok-skip-browser-warning': '1' } : {}),
  }

  if (!auth) {
    return base
  }

  const token = getAuthToken()
  return token ? { ...base, Authorization: `Bearer ${token}` } : base
}

function buildApiError({ status, message, body, isNetworkError = false }) {
  const error = new Error(message)
  error.status = status
  error.body = body
  error.isNetworkError = isNetworkError
  return error
}

async function parseErrorBody(res) {
  const text = await res.text().catch(() => '')

  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function checarResposta(res) {
  if (res.ok) {
    return res.status === 204 ? null : res.json()
  }

  const body = await parseErrorBody(res)
  const message = typeof body === 'string'
    ? `[${res.status}] ${body}`
    : `[${res.status}] ${body?.title ?? body?.message ?? res.statusText}`

  throw buildApiError({ status: res.status, message, body })
}

async function fetchJson(url, options = {}) {
  try {
    const response = await fetch(url, options)
    return await checarResposta(response)
  } catch (error) {
    if (error instanceof TypeError) {
      throw buildApiError({
        status: 0,
        message: 'Falha de rede ao acessar a API.',
        isNetworkError: true,
      })
    }

    throw error
  }
}

export function buildChavePrimariaMa(inspecao) {
  const ano = inspecao.dataEmissao
    ? new Date(inspecao.dataEmissao).getFullYear()
    : new Date().getFullYear()

  const linhaNum = (inspecao.linha ?? '').match(/\d+/)?.[0]?.padStart(2, '0') ?? '00'
  const sigla = (inspecao.nomeContratada ?? '')
    .split(' - ')
    .pop()
    ?.replace(/\s/g, '')
    .substring(0, 10) ?? 'CPTM'
  const numero = String(inspecao.numFormulario ?? 1).padStart(6, '0')

  return inspecao.chavePrimariaMa ?? `EEA.EF-A.${ano}-L.${linhaNum}-${sigla}-N.${numero}`
}

function normalizePhotoMime(photo) {
  return photo.type || photo.blob?.type || 'image/jpeg'
}

function normalizeFotoBase64(value) {
  if (typeof value !== 'string') return null

  let normalized = value.trim()
  const commaIndex = normalized.indexOf(',')
  if (normalized.toLowerCase().startsWith('data:') && commaIndex >= 0) {
    normalized = normalized.slice(commaIndex + 1)
  }

  normalized = normalized.replace(/[\r\n\s\t]/g, '')
  return normalized || null
}

async function serializeFoto(photo, index) {
  if (!photo) return null

  const fotoBase64 = photo.blob
    ? await blobToBase64(photo.blob)
    : photo.base64 ?? photo.fotoBase64 ?? null

  return {
    idFoto: photo.idFoto ?? null,
    nrFoto: photo.nrFoto ?? index + 1,
    fotoBase64: normalizeFotoBase64(fotoBase64),
    dsOrientacao: photo.orientacao ?? photo.dsOrientacao ?? 'Paisagem/Horizontal',
    mimeType: normalizePhotoMime(photo),
  }
}

function asNullableString(value) {
  if (value === null || value === undefined) return null

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length ? trimmed : null
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  if (typeof value === 'object') {
    const candidate = value.value ?? value.label ?? value.nome ?? value.name ?? value.text ?? value.descricao
    if (candidate !== undefined) {
      return asNullableString(candidate)
    }

    for (const nested of Object.values(value)) {
      if (nested === null || nested === undefined) continue
      if (typeof nested === 'string' || typeof nested === 'number' || typeof nested === 'boolean') {
        return asNullableString(nested)
      }
    }
  }

  return null
}

function asNullableNumber(value) {
  if (value === null || value === undefined) return null

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.')
    if (!normalized) return null
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0
  }

  if (typeof value === 'object') {
    const candidate = value.value ?? value.numero ?? value.number ?? value.valor ?? value.amount ?? value.quantidade
    if (candidate !== undefined) {
      return asNullableNumber(candidate)
    }

    for (const nested of Object.values(value)) {
      const parsed = asNullableNumber(nested)
      if (parsed !== null) return parsed
    }
  }

  return null
}

export async function paraDto(inspecao) {
  const chavePrimariaMa = asNullableString(inspecao.chavePrimariaMa)
  const isoData = (valor) => valor ? new Date(valor).toISOString() : new Date().toISOString()

  return {
    chavePrimariaMa,
    nrElementoMonit: String(inspecao.emNumero ?? 1).padStart(6, '0'),
    nmElementoMonit: asNullableString(inspecao.emNome),
    nmContratada: asNullableString(inspecao.nomeContratada) ?? '',
    nrContrato: asNullableString(inspecao.numContrato),
    nmLocalEscopo: asNullableString(inspecao.localEscopo),
    nmRepresentante: asNullableString(inspecao.representante),
    sgAreaMeioAmbiente: asNullableString(inspecao.siglaArea),
    dsStatusDesvioAmbiental: asNullableString(inspecao.statusDesvioAmbiental),
    dsStatusRegistroBd: asNullableString(inspecao.statusRegistroBd),
    nmAreaGestoraCptm: asNullableString(inspecao.nomeAreaGestora),
    cdIdentAreaGestora: asNullableString(inspecao.idAreaGestora),
    sgAreaGestoraCptm: asNullableString(inspecao.siglaAreaGestora),
    nmSupervisoraAmbiental: asNullableString(inspecao.nomeSupervisora),
    nmEmpresaExecutora: asNullableString(inspecao.nomeEmpresaExecutora),
    nrContratoSupervisora: asNullableString(inspecao.nrContratoSupervisora),
    nmAutorCadastramento: asNullableString(inspecao.autorCadastro) ?? '',
    nmAutorPjCadastramento: asNullableString(inspecao.autorPjCadastro),
    nmResponsavelTecnico: asNullableString(inspecao.responsavelTecnico) ?? '',
    nrRegistroProfissional: asNullableString(inspecao.registroProfissional),
    dsDocRespTecnica: asNullableString(inspecao.docRT),
    dsNaturezaPga: asNullableString(inspecao.naturezaPGA),
    dsTipoFormulario: 'Formulario de Cadastramento - FDC (FDC-EEA.EF)',
    dtEmissaoFormulario: isoData(inspecao.dataEmissao),
    nrFormulario: String(inspecao.numFormulario ?? 1).padStart(6, '0'),
    nmAutorFormulario: asNullableString(inspecao.autorFormulario),
    nmArquivoFdc: asNullableString(inspecao.nomeArquivoFdc),
    cdArquivoFdc: asNullableString(inspecao.codigoArquivoFdc),
    dtCadastramento: isoData(inspecao.dataCadastramento),
    hrCadastramento: asNullableString(inspecao.horaCadastramento),
    nmMunicipio: asNullableString(inspecao.municipio),
    nmLinhaCptm: asNullableString(inspecao.linha),
    nmEstacaoCptm: asNullableString(inspecao.estacao),
    nrViaLinhaCptm: asNullableString(inspecao.via),
    dsTrechoSentidoCptm: asNullableString(inspecao.trechoSentido),
    nrKmPoste: asNullableString(inspecao.kmPoste),
    nrLatitude: asNullableNumber(inspecao.latitude),
    nrLongitude: asNullableNumber(inspecao.longitude),
    nrLatitudeSirgas2000: asNullableNumber(inspecao.latitudeSirgas2000),
    nrLongitudeSirgas2000: asNullableNumber(inspecao.longitudeSirgas2000),
    dsTipoAtividadeList: asNullableString(inspecao.tipoAtividadeListada),
    dsTipoAtividadeNlist: asNullableString(inspecao.tipoAtividadeNaoListada),
    dsTipoDraList: asNullableString(inspecao.tipoDRAListado),
    dsTipoDraNlist: asNullableString(inspecao.tipoDRANaoListado),
    cdIdentificadorDra: asNullableString(inspecao.codigoDRA),
    dtValidadeDra: inspecao.dataValidadeDRA ? new Date(inspecao.dataValidadeDRA).toISOString() : null,
    dsAnaliseCptmAprovacao: asNullableString(inspecao.analiseCptmAprovacao),
    dsTipoAtividadeCptm: asNullableString(inspecao.tipoAtividadeCPTM),
    nmLocalEdificacao: asNullableString(inspecao.nomeLocal),
    dsLocalComplemento: asNullableString(inspecao.complementoLocal),
    dsOrigemEfluente: asNullableString(inspecao.origemEfluente),
    dsFonteGeradora: asNullableString(inspecao.fonteGeradora),
    nrQuantidadeLitros: asNullableNumber(inspecao.quantidadeLitros),
    dsTipoDestinacao: asNullableString(inspecao.tipoDestinacao),
    dsTipoVeiculo: asNullableString(inspecao.tipoVeiculo),
    cdPlacaVeiculo: asNullableString(inspecao.placaVeiculo),
    cdGuiaRemessa: asNullableString(inspecao.codigoGuiaRemessa),
    nrDistanciaViaM: asNullableNumber(inspecao.distanciaVia),
    dsOfereceRiscoSistemaCptm: asNullableString(inspecao.ofereceRiscoSistemaCptm),
    dsDominioTerritorial: asNullableString(inspecao.dominioTerritorial),
    dsObservacoesCadastro: asNullableString(inspecao.observacoesGerais),
    nmArquivoRvtRelacionado: asNullableString(inspecao.nomeArquivoRvtRelacionado),
    cdElementoMonitorRvt: asNullableString(inspecao.codigoElementoMonitorRvt),
    nmArquivoDacRelacionado: asNullableString(inspecao.nomeArquivoDacRelacionado),
    cdElementoMonitorDac: asNullableString(inspecao.codigoElementoMonitorDac),
    nmArquivoCncRelacionado: asNullableString(inspecao.nomeArquivoCncRelacionado),
    cdElementoMonitorCnc: asNullableString(inspecao.codigoElementoMonitorCnc),
    cdUltimoRra: asNullableString(inspecao.codigoUltimoRra),
    cdCedoc: asNullableString(inspecao.codigoCedoc),
    fotos: (await Promise.all((inspecao.fotos ?? []).map((foto, index) => serializeFoto(foto, index))))
      .filter(Boolean),
  }
}

export function doDto(dto) {
  const dataCadastro = dto.dtCadastramento?.split('T')[0]
  const horaCadastro = dto.hrCadastramento

  let uploadedAt = Date.now()
  if (dataCadastro) {
    const horario = horaCadastro && /^\d{2}:\d{2}$/.test(horaCadastro) ? `${horaCadastro}:00` : '00:00:00'
    const parsed = new Date(`${dataCadastro}T${horario}`)
    if (!Number.isNaN(parsed.getTime())) {
      uploadedAt = parsed.getTime()
    }
  }

  return {
    chavePrimariaMa: dto.chavePrimariaMa,
    nomeContratada: dto.nmContratada,
    numContrato: dto.nrContrato,
    localEscopo: dto.nmLocalEscopo,
    representante: dto.nmRepresentante,
    siglaArea: dto.sgAreaMeioAmbiente,
    statusDesvioAmbiental: dto.dsStatusDesvioAmbiental,
    statusRegistroBd: dto.dsStatusRegistroBd,
    nomeAreaGestora: dto.nmAreaGestoraCptm,
    idAreaGestora: dto.cdIdentAreaGestora,
    siglaAreaGestora: dto.sgAreaGestoraCptm,
    nomeSupervisora: dto.nmSupervisoraAmbiental,
    nomeEmpresaExecutora: dto.nmEmpresaExecutora,
    nrContratoSupervisora: dto.nrContratoSupervisora,
    autorCadastro: dto.nmAutorCadastramento,
    autorPjCadastro: dto.nmAutorPjCadastramento,
    responsavelTecnico: dto.nmResponsavelTecnico,
    registroProfissional: dto.nrRegistroProfissional,
    docRT: dto.dsDocRespTecnica,
    naturezaPGA: dto.dsNaturezaPga,
    dataEmissao: dto.dtEmissaoFormulario?.split('T')[0],
    numFormulario: parseInt(dto.nrFormulario, 10),
    autorFormulario: dto.nmAutorFormulario,
    nomeArquivoFdc: dto.nmArquivoFdc,
    codigoArquivoFdc: dto.cdArquivoFdc,
    dataCadastramento: dataCadastro,
    horaCadastramento: horaCadastro,
    uploadedAt,
    emNumero: parseInt(dto.nrElementoMonit, 10),
    emNome: dto.nmElementoMonit,
    municipio: dto.nmMunicipio,
    linha: dto.nmLinhaCptm,
    estacao: dto.nmEstacaoCptm,
    via: dto.nrViaLinhaCptm,
    trechoSentido: dto.dsTrechoSentidoCptm,
    kmPoste: dto.nrKmPoste,
    latitude: dto.nrLatitude,
    longitude: dto.nrLongitude,
    latitudeSirgas2000: dto.nrLatitudeSirgas2000,
    longitudeSirgas2000: dto.nrLongitudeSirgas2000,
    tipoAtividadeListada: dto.dsTipoAtividadeList,
    tipoAtividadeNaoListada: dto.dsTipoAtividadeNlist,
    tipoDRAListado: dto.dsTipoDraList,
    tipoDRANaoListado: dto.dsTipoDraNlist,
    codigoDRA: dto.cdIdentificadorDra,
    dataValidadeDRA: dto.dtValidadeDra?.split('T')[0],
    analiseCptmAprovacao: dto.dsAnaliseCptmAprovacao,
    tipoAtividadeCPTM: dto.dsTipoAtividadeCptm,
    nomeLocal: dto.nmLocalEdificacao,
    complementoLocal: dto.dsLocalComplemento,
    origemEfluente: dto.dsOrigemEfluente,
    fonteGeradora: dto.dsFonteGeradora,
    quantidadeLitros: dto.nrQuantidadeLitros,
    tipoDestinacao: dto.dsTipoDestinacao,
    tipoVeiculo: dto.dsTipoVeiculo,
    placaVeiculo: dto.cdPlacaVeiculo,
    codigoGuiaRemessa: dto.cdGuiaRemessa,
    distanciaVia: dto.nrDistanciaViaM,
    ofereceRiscoSistemaCptm: dto.dsOfereceRiscoSistemaCptm,
    dominioTerritorial: dto.dsDominioTerritorial,
    observacoesGerais: dto.dsObservacoesCadastro,
    nomeArquivoRvtRelacionado: dto.nmArquivoRvtRelacionado,
    codigoElementoMonitorRvt: dto.cdElementoMonitorRvt,
    nomeArquivoDacRelacionado: dto.nmArquivoDacRelacionado,
    codigoElementoMonitorDac: dto.cdElementoMonitorDac,
    nomeArquivoCncRelacionado: dto.nmArquivoCncRelacionado,
    codigoElementoMonitorCnc: dto.cdElementoMonitorCnc,
    codigoUltimoRra: dto.cdUltimoRra,
    codigoCedoc: dto.cdCedoc,
    fotos: (dto.fotos ?? []).map((foto) => ({
      idFoto: foto.idFoto,
      nrFoto: foto.nrFoto,
      base64: foto.fotoBase64,
      orientacao: foto.dsOrientacao,
      type: foto.mimeType ?? 'image/jpeg',
    })),
    photosHydrated: Array.isArray(dto.fotos),
  }
}

export async function healthCheck() {
  try {
    const response = await fetch(HEALTH_ENDPOINT, {
      cache: 'no-store',
      headers: headers({ auth: false }),
    })

    if (!response.ok) {
      throw buildApiError({
        status: response.status,
        message: `[${response.status}] Health check indisponivel.`,
      })
    }

    return true
  } catch (error) {
    if (error instanceof TypeError) {
      throw buildApiError({
        status: 0,
        message: 'Falha de rede ao consultar o health check da API.',
        isNetworkError: true,
      })
    }

    throw error
  }
}

export async function listar(pagina = 1, tamanho = 50) {
  const data = await fetchJson(`${ENDPOINT}?pagina=${pagina}&tamanho=${tamanho}`, {
    headers: headers({ auth: true }),
  })

  return (data.itens ?? data.Itens ?? []).map(doDto)
}

export async function buscarPorChave(chavePrimariaMa) {
  const data = await fetchJson(`${ENDPOINT}/${encodeURIComponent(chavePrimariaMa)}`, {
    headers: headers({ auth: true }),
  })

  return doDto(data)
}

export async function criar(inspecao) {
  const dto = await paraDto(inspecao)
  const data = await fetchJson(ENDPOINT, {
    method: 'POST',
    headers: headers({ auth: true }),
    body: JSON.stringify(dto),
  })

  return doDto(data)
}

export async function atualizar(inspecao) {
  const dto = await paraDto(inspecao)
  await fetchJson(`${ENDPOINT}/${encodeURIComponent(dto.chavePrimariaMa)}`, {
    method: 'PUT',
    headers: headers({ auth: true }),
    body: JSON.stringify(dto),
  })
}

export async function excluir(chavePrimariaMa) {
  await fetchJson(`${ENDPOINT}/${encodeURIComponent(chavePrimariaMa)}`, {
    method: 'DELETE',
    headers: headers({ auth: true }),
  })
}

export async function registrarUsuario({ fullName, email, password, confirmPassword }) {
  return fetchJson(`${AUTH_ENDPOINT}/register`, {
    method: 'POST',
    headers: headers({ auth: false }),
    body: JSON.stringify({
      fullName,
      email,
      password,
      confirmPassword,
    }),
  })
}

export async function autenticarUsuario({ email, password }) {
  return fetchJson(`${AUTH_ENDPOINT}/login`, {
    method: 'POST',
    headers: headers({ auth: false }),
    body: JSON.stringify({
      email,
      password,
    }),
  })
}

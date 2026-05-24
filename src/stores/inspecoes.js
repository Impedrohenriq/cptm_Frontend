import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as api from '@/services/api.js'
import {
  bulkPutInspectionRecords,
  deleteInspectionRecord,
  deleteQueuedItem,
  findInspectionByChave,
  getInspectionRecord,
  getMetaValue,
  listInspectionRecords,
  listQueuedItems,
  openDb,
  putInspectionRecord,
  putQueuedItem,
  setMetaValue,
} from '@/services/offlineDb.js'
import {
  attachPreviewUrls,
  base64ToBlob,
  normalizePayloadForStorage,
  revokePreviewUrls,
} from '@/services/offlineMedia.js'
import {
  syncInspectionRecord,
  toSyncErrorMessage,
} from '@/services/syncEngine.js'
import { useNotificacoesStore } from '@/stores/notificacoes.js'
import { useAuthStore } from '@/stores/auth.js'

const LEGACY_INSPECOES_KEY = 'cptm_inspecoes'
const MIGRATION_META_KEY = 'legacy-inspections-migrated'

export const SYNC_STATUS = {
  DRAFT: 'rascunho',
  PENDING: 'pendente_sync',
  SYNCING: 'sincronizando',
  SYNCED: 'sincronizado',
  ERROR: 'erro_sync',
}

function gerarLocalId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `local-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
}

function clone(value) {
  return structuredClone(value)
}

function sortByUpdatedAt(items) {
  return [...items].sort((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0))
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function initialsFromName(name) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '??'

  const first = parts[0][0] ?? ''
  const second = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : (parts[0][1] ?? '')
  return `${first}${second}`.toUpperCase() || '??'
}

function withOwnershipFallback(payload) {
  const funcionarioNome = payload.funcionarioNome || payload.autorCadastro || payload.autorFormulario || ''
  const funcionarioInitials = payload.funcionarioInitials || initialsFromName(funcionarioNome)

  return {
    ...payload,
    funcionarioNome,
    funcionarioInitials,
  }
}

function preserveOwnership(serverPayload, localPayload = null) {
  if (!localPayload) {
    return withOwnershipFallback(serverPayload)
  }

  return withOwnershipFallback({
    ...serverPayload,
    funcionarioId: localPayload.funcionarioId || serverPayload.funcionarioId,
    funcionarioNome: localPayload.funcionarioNome || serverPayload.funcionarioNome,
    funcionarioInitials: localPayload.funcionarioInitials || serverPayload.funcionarioInitials,
  })
}

function mapLegacyStatus(status, item) {
  if (status === 'rascunho') return SYNC_STATUS.DRAFT
  if (item?._fromApi) return SYNC_STATUS.SYNCED
  if (item?.chavePrimariaMa) return SYNC_STATUS.ERROR
  if (status === 'enviada' || status === 'analisada') return SYNC_STATUS.PENDING
  return SYNC_STATUS.DRAFT
}

function makeQueueItem(record) {
  return {
    localId: record.localId,
    chavePrimariaMa: record.chavePrimariaMa,
    pendingOperation: record.pendingOperation,
    syncStatus: record.syncStatus,
    queuedAt: record.queueUpdatedAt ?? record.updatedAt,
    retryCount: record.retryCount,
  }
}

function payloadFromItem(item) {
  const {
    id,
    localId,
    syncStatus,
    status,
    retryCount,
    lastError,
    createdAt,
    updatedAt,
    syncedAt,
    serverConfirmed,
    pendingOperation,
    photosHydrated,
    queueUpdatedAt,
    ...payload
  } = item

  return payload
}

function resolveServerTimestamp(payload) {
  if (typeof payload?.uploadedAt === 'number' && Number.isFinite(payload.uploadedAt)) {
    return payload.uploadedAt
  }

  return Date.now()
}

function materializeRecord(record) {
  const payload = withOwnershipFallback(attachPreviewUrls(clone(record.payload)))

  return {
    ...payload,
    id: record.localId,
    localId: record.localId,
    chavePrimariaMa: record.chavePrimariaMa,
    syncStatus: record.syncStatus,
    status: record.syncStatus,
    retryCount: record.retryCount,
    lastError: record.lastError,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    syncedAt: record.syncedAt,
    serverConfirmed: record.serverConfirmed,
    pendingOperation: record.pendingOperation,
    photosHydrated: record.photosHydrated,
  }
}

async function hydrateServerPayload(serverItem) {
  const payload = clone(serverItem)

  if (payload.fotos?.length) {
    payload.fotos = payload.fotos.map((foto) => ({
      ...foto,
      blob: foto.base64 ? base64ToBlob(foto.base64, foto.type) : null,
    }))
  }

  return normalizePayloadForStorage(payload)
}

export const useInspecoesStore = defineStore('inspecoes', () => {
  const notificacoes = useNotificacoesStore()
  const inspecoes = ref([])
  const loading = ref(false)
  const erro = ref(null)
  const initialized = ref(false)
  const syncing = ref(false)
  const apiDisponivel = ref(false)
  const browserOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const filaPendencias = ref([])

  let initPromise = null
  let listenersRegistered = false
  let healthMonitorIntervalId = null

  const total = computed(() => inspecoes.value.length)
  const sincronizadas = computed(() => inspecoes.value.filter((item) => item.syncStatus === SYNC_STATUS.SYNCED).length)
  const enviadas = computed(() => sincronizadas.value)
  const rascunhos = computed(() => inspecoes.value.filter((item) => item.syncStatus === SYNC_STATUS.DRAFT).length)
  const pendentesSync = computed(() => inspecoes.value.filter((item) => [SYNC_STATUS.PENDING, SYNC_STATUS.ERROR, SYNC_STATUS.SYNCING].includes(item.syncStatus)).length)
  const recentes = computed(() => sortByUpdatedAt(inspecoes.value).slice(0, 10))
  const todas = computed(() => sortByUpdatedAt(inspecoes.value))
  const ultimasPorFuncionario = computed(() => {
    const mapa = new Map()

    for (const inspecao of todas.value) {
      const chave = inspecao.funcionarioId || 'desconhecido'
      if (!mapa.has(chave)) {
        mapa.set(chave, inspecao)
      }
    }

    return [...mapa.values()]
  })

  function atualizarLista(records) {
    for (const item of inspecoes.value) {
      revokePreviewUrls(item)
    }

    inspecoes.value = records.map(materializeRecord)
  }

  async function recarregarDoIndexedDb() {
    const [records, queue] = await Promise.all([
      listInspectionRecords(),
      listQueuedItems(),
    ])

    filaPendencias.value = queue
    atualizarLista(records)
    return records
  }

  function criarRegistroBase(payload, overrides = {}, existingRecord = null) {
    const now = Date.now()
    const serverConfirmed = overrides.serverConfirmed ?? existingRecord?.serverConfirmed ?? false

    return {
      localId: existingRecord?.localId ?? overrides.localId ?? gerarLocalId(),
      chavePrimariaMa: payload.chavePrimariaMa,
      payload,
      syncStatus: overrides.syncStatus ?? existingRecord?.syncStatus ?? SYNC_STATUS.DRAFT,
      pendingOperation: overrides.pendingOperation ?? existingRecord?.pendingOperation ?? (serverConfirmed ? 'update' : 'create'),
      retryCount: overrides.retryCount ?? existingRecord?.retryCount ?? 0,
      lastError: overrides.lastError ?? existingRecord?.lastError ?? null,
      createdAt: existingRecord?.createdAt ?? overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
      syncedAt: overrides.syncedAt ?? existingRecord?.syncedAt ?? null,
      serverConfirmed,
      photosHydrated: overrides.photosHydrated ?? existingRecord?.photosHydrated ?? true,
      queueUpdatedAt: overrides.queueUpdatedAt ?? existingRecord?.queueUpdatedAt ?? now,
    }
  }

  async function salvarRegistro(record, { manterNaFila = false, removerDaFila = false } = {}) {
    await putInspectionRecord(record)

    if (removerDaFila) {
      await deleteQueuedItem(record.localId)
    } else if (manterNaFila) {
      await putQueuedItem(makeQueueItem(record))
    }

    await recarregarDoIndexedDb()
    return materializeRecord(record)
  }

  async function marcarApiDisponivel() {
    try {
      await api.healthCheck()
      apiDisponivel.value = true
      return true
    } catch {
      apiDisponivel.value = false
      return false
    }
  }

  function iniciarMonitorApi() {
    if (healthMonitorIntervalId || typeof window === 'undefined') return

    healthMonitorIntervalId = window.setInterval(async () => {
      if (!initialized.value || syncing.value) return

      if (!navigator.onLine) {
        browserOnline.value = false
        apiDisponivel.value = false
        return
      }

      browserOnline.value = true
      const estavaDisponivel = apiDisponivel.value
      const disponivelAgora = await marcarApiDisponivel()

      if (disponivelAgora && (!estavaDisponivel || filaPendencias.value.length > 0)) {
        await sincronizarPendentes({ silencioso: true })
      }
    }, 10000)
  }

  function registrarListeners() {
    if (listenersRegistered || typeof window === 'undefined') return

    const onOnline = async () => {
      browserOnline.value = true
      if (await marcarApiDisponivel()) {
        await sincronizarPendentes({ silencioso: true })
      }
    }

    const onOffline = () => {
      browserOnline.value = false
      apiDisponivel.value = false
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    listenersRegistered = true
  }

  async function migrarLocalStorageLegado() {
    const migrated = await getMetaValue(MIGRATION_META_KEY)
    if (migrated) return

    const legacyRaw = localStorage.getItem(LEGACY_INSPECOES_KEY)
    if (!legacyRaw) {
      await setMetaValue(MIGRATION_META_KEY, true)
      return
    }

    try {
      const legacyItems = JSON.parse(legacyRaw)
      if (!Array.isArray(legacyItems) || legacyItems.length === 0) {
        await setMetaValue(MIGRATION_META_KEY, true)
        return
      }

      const records = []

      for (const legacyItem of legacyItems) {
        const payload = await normalizePayloadForStorage({
          ...payloadFromItem(legacyItem),
          chavePrimariaMa: api.buildChavePrimariaMa(legacyItem),
        })

        const syncStatus = mapLegacyStatus(legacyItem.status, legacyItem)
        const serverConfirmed = syncStatus === SYNC_STATUS.SYNCED

        records.push({
          localId: String(legacyItem.id ?? gerarLocalId()),
          chavePrimariaMa: payload.chavePrimariaMa,
          payload,
          syncStatus,
          pendingOperation: serverConfirmed ? 'update' : 'create',
          retryCount: legacyItem.retryCount ?? 0,
          lastError: serverConfirmed ? null : legacyItem.erroApi ?? null,
          createdAt: legacyItem.createdAt ?? Date.now(),
          updatedAt: legacyItem.updatedAt ?? Date.now(),
          syncedAt: serverConfirmed ? (legacyItem.updatedAt ?? Date.now()) : null,
          serverConfirmed,
          photosHydrated: true,
          queueUpdatedAt: legacyItem.updatedAt ?? Date.now(),
        })
      }

      await bulkPutInspectionRecords(records)

      for (const record of records.filter((item) => item.syncStatus !== SYNC_STATUS.SYNCED)) {
        await putQueuedItem(makeQueueItem(record))
      }

      localStorage.removeItem(LEGACY_INSPECOES_KEY)
    } finally {
      await setMetaValue(MIGRATION_META_KEY, true)
    }
  }

  async function initialize() {
    if (initialized.value) return
    if (initPromise) return initPromise

    initPromise = (async () => {
      await openDb()
      await migrarLocalStorageLegado()
      await recarregarDoIndexedDb()
      browserOnline.value = navigator.onLine
      await marcarApiDisponivel().catch(() => false)
      registrarListeners()
      iniciarMonitorApi()
      initialized.value = true

      if (browserOnline.value && apiDisponivel.value) {
        await sincronizarPendentes({ silencioso: true })
      }
    })()

    try {
      await initPromise
    } finally {
      initPromise = null
    }
  }

  async function persistirItem(item, overrides = {}, options = {}) {
    const existingRecord = item.localId
      ? await getInspectionRecord(item.localId)
      : (item.chavePrimariaMa ? await findInspectionByChave(item.chavePrimariaMa) : null)

    const payload = await normalizePayloadForStorage({
      ...payloadFromItem(item),
      chavePrimariaMa: item.chavePrimariaMa ?? existingRecord?.chavePrimariaMa ?? null,
    })

    const record = criarRegistroBase(payload, overrides, existingRecord)
    return salvarRegistro(record, options)
  }

  async function salvarRascunho(dados) {
    await initialize()
    erro.value = null

    return persistirItem(
      dados,
      {
        syncStatus: SYNC_STATUS.DRAFT,
        lastError: null,
      },
      {
        removerDaFila: true,
      },
    )
  }

  async function enfileirarParaSync(dados) {
    await initialize()
    erro.value = null

    const registro = await persistirItem(
      dados,
      {
        syncStatus: SYNC_STATUS.PENDING,
        lastError: null,
        queueUpdatedAt: Date.now(),
      },
      {
        manterNaFila: true,
      },
    )

    if (!navigator.onLine) {
      apiDisponivel.value = false
      return {
        sucesso: false,
        queued: true,
        local: registro,
        mensagem: 'Inspecao salva no dispositivo e adicionada a fila local.',
      }
    }

    if (!await marcarApiDisponivel()) {
      return {
        sucesso: false,
        queued: true,
        local: registro,
        mensagem: 'API indisponivel. O item ficou pendente de sincronizacao.',
      }
    }

    const syncResult = await retryItem(registro.localId, { silencioso: true })
    return { ...syncResult, local: registro }
  }

  async function hydrateInspection(localId) {
    await initialize()
    const record = await getInspectionRecord(localId)
    if (!record) return null

    if (!record.serverConfirmed || record.photosHydrated || !record.chavePrimariaMa) {
      return materializeRecord(record)
    }

    if (!navigator.onLine || !await marcarApiDisponivel()) {
      return materializeRecord(record)
    }

    const serverItem = await api.buscarPorChave(record.chavePrimariaMa)
    const payload = await hydrateServerPayload({
      ...serverItem,
      funcionarioId: record.payload.funcionarioId,
      funcionarioNome: record.payload.funcionarioNome,
      funcionarioInitials: record.payload.funcionarioInitials,
    })

    const hydratedRecord = criarRegistroBase(payload, {
      syncStatus: record.syncStatus,
      pendingOperation: record.pendingOperation,
      retryCount: record.retryCount,
      lastError: record.lastError,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      syncedAt: record.syncedAt,
      serverConfirmed: true,
      photosHydrated: true,
    }, record)

    await putInspectionRecord(hydratedRecord)
    await recarregarDoIndexedDb()
    return materializeRecord(hydratedRecord)
  }

  async function sincronizarPendentes({ localId = null, silencioso = false } = {}) {
    await initialize()

    if (syncing.value && !localId) {
      return { sucesso: false, mensagem: 'Sincronizacao ja em andamento.' }
    }

    if (!navigator.onLine) {
      apiDisponivel.value = false
      return { sucesso: false, mensagem: 'Sem conectividade com a internet.' }
    }

    if (!await marcarApiDisponivel()) {
      return { sucesso: false, mensagem: 'API indisponivel no momento.' }
    }

    syncing.value = true
    loading.value = !silencioso
    erro.value = null

    try {
      const queue = await listQueuedItems()
      const pendentes = localId ? queue.filter((item) => item.localId === localId) : queue
      const resultados = []

      for (const item of pendentes) {
        const record = await getInspectionRecord(item.localId)
        if (!record) {
          await deleteQueuedItem(item.localId)
          continue
        }

        const syncingRecord = criarRegistroBase(record.payload, {
          syncStatus: SYNC_STATUS.SYNCING,
          lastError: null,
          retryCount: record.retryCount,
          createdAt: record.createdAt,
          updatedAt: Date.now(),
          syncedAt: record.syncedAt,
          serverConfirmed: record.serverConfirmed,
          pendingOperation: record.pendingOperation,
          photosHydrated: record.photosHydrated,
        }, record)

        await salvarRegistro(syncingRecord, { manterNaFila: true })

        try {
          let sourceRecord = syncingRecord

          if (sourceRecord.serverConfirmed && !sourceRecord.photosHydrated && sourceRecord.chavePrimariaMa) {
            const serverItem = await api.buscarPorChave(sourceRecord.chavePrimariaMa)
            const payload = await hydrateServerPayload({
              ...serverItem,
              ...sourceRecord.payload,
              funcionarioId: sourceRecord.payload.funcionarioId,
              funcionarioNome: sourceRecord.payload.funcionarioNome,
              funcionarioInitials: sourceRecord.payload.funcionarioInitials,
              fotos: sourceRecord.payload.fotos?.length ? sourceRecord.payload.fotos : serverItem.fotos,
            })

            sourceRecord = criarRegistroBase(payload, {
              syncStatus: SYNC_STATUS.SYNCING,
              retryCount: sourceRecord.retryCount,
              createdAt: sourceRecord.createdAt,
              updatedAt: sourceRecord.updatedAt,
              syncedAt: sourceRecord.syncedAt,
              serverConfirmed: true,
              pendingOperation: sourceRecord.pendingOperation,
              photosHydrated: true,
            }, sourceRecord)

            await putInspectionRecord(sourceRecord)
          }

          const { syncedPayload, resolvedOperation } = await syncInspectionRecord(materializeRecord(sourceRecord))
          const payload = await hydrateServerPayload({
            ...syncedPayload,
            funcionarioId: sourceRecord.payload.funcionarioId,
            funcionarioNome: sourceRecord.payload.funcionarioNome,
            funcionarioInitials: sourceRecord.payload.funcionarioInitials,
          })

          const syncedRecord = criarRegistroBase(payload, {
            syncStatus: SYNC_STATUS.SYNCED,
            pendingOperation: resolvedOperation,
            retryCount: sourceRecord.retryCount,
            lastError: null,
            createdAt: sourceRecord.createdAt,
            updatedAt: resolveServerTimestamp(payload),
            syncedAt: resolveServerTimestamp(payload),
            serverConfirmed: true,
            photosHydrated: true,
          }, sourceRecord)

          await salvarRegistro(syncedRecord, { removerDaFila: true })

          const contratada = syncedRecord.payload?.nomeContratada || syncedRecord.payload?.nmContratada || 'Inspecao'
          const estacao = syncedRecord.payload?.estacao || syncedRecord.payload?.nmEstacaoCptm || syncedRecord.payload?.nomeLocal || ''
          const resumo = estacao ? `${contratada} - ${estacao}` : contratada

          notificacoes.push({
            type: 'success',
            title: 'Inspecao sincronizada',
            message: `${resumo} enviada com sucesso.`,
            dedupeKey: `sync-success-${syncedRecord.localId}-${syncedRecord.syncedAt ?? syncedRecord.updatedAt}`,
            localId: syncedRecord.localId,
          })

          resultados.push({ localId: syncedRecord.localId, sucesso: true })
        } catch (syncError) {
          if (syncError?.status === 401) {
            const auth = useAuthStore()
            auth.logout({ reason: 'session_expired_sync' })
            apiDisponivel.value = true

            notificacoes.push({
              type: 'warning',
              title: 'Sessao expirada',
              message: 'Faca login novamente para retomar a sincronizacao.',
              dedupeKey: 'session-expired-sync',
            })

            if (typeof window !== 'undefined' && window.location.hash !== '#/login') {
              window.location.hash = '#/login'
            }
          }

          const failedRecord = criarRegistroBase(record.payload, {
            syncStatus: SYNC_STATUS.ERROR,
            pendingOperation: record.pendingOperation,
            retryCount: record.retryCount + 1,
            lastError: toSyncErrorMessage(syncError),
            createdAt: record.createdAt,
            updatedAt: Date.now(),
            syncedAt: record.syncedAt,
            serverConfirmed: record.serverConfirmed,
            photosHydrated: record.photosHydrated,
          }, record)

          await salvarRegistro(failedRecord, { manterNaFila: true })
          resultados.push({ localId: failedRecord.localId, sucesso: false, erro: failedRecord.lastError })
        }
      }

      return { sucesso: resultados.every((item) => item.sucesso), resultados }
    } finally {
      syncing.value = false
      loading.value = false
    }
  }

  async function retryItem(localId, options = {}) {
    return sincronizarPendentes({ localId, ...options })
  }

  async function reconciliarLocalComServidor(itensServidor) {
    await initialize()
    const records = await listInspectionRecords()
    const byChave = new Map(records.filter((item) => item.chavePrimariaMa).map((item) => [item.chavePrimariaMa, item]))
    const serverChaves = new Set(itensServidor.map((item) => item.chavePrimariaMa).filter(Boolean))
    const updates = []

    // Remove itens sincronizados que nao existem mais no servidor.
    for (const localRecord of records) {
      const hasRemoteKey = Boolean(localRecord.chavePrimariaMa)
      const isSynced = localRecord.syncStatus === SYNC_STATUS.SYNCED
      const missingOnServer = hasRemoteKey && !serverChaves.has(localRecord.chavePrimariaMa)

      if (localRecord.serverConfirmed && isSynced && missingOnServer) {
        await deleteInspectionRecord(localRecord.localId)
      }
    }

    for (const serverItem of itensServidor) {
      const payloadServidor = await hydrateServerPayload(serverItem)
      const payload = withOwnershipFallback(payloadServidor)
      const localRecord = byChave.get(payload.chavePrimariaMa)

      if (!localRecord) {
        const serverTimestamp = resolveServerTimestamp(payload)
        updates.push(criarRegistroBase(payload, {
          syncStatus: SYNC_STATUS.SYNCED,
          pendingOperation: 'update',
          retryCount: 0,
          lastError: null,
          createdAt: serverTimestamp,
          updatedAt: serverTimestamp,
          syncedAt: serverTimestamp,
          serverConfirmed: true,
          photosHydrated: payload.fotos?.length > 0,
        }))
        continue
      }

      const possuiMudancaLocal = [SYNC_STATUS.PENDING, SYNC_STATUS.SYNCING, SYNC_STATUS.ERROR].includes(localRecord.syncStatus)

      if (possuiMudancaLocal || localRecord.syncStatus === SYNC_STATUS.DRAFT) {
        updates.push(criarRegistroBase(localRecord.payload, {
          syncStatus: localRecord.syncStatus,
          pendingOperation: localRecord.pendingOperation,
          retryCount: localRecord.retryCount,
          lastError: localRecord.lastError,
          createdAt: localRecord.createdAt,
          updatedAt: localRecord.updatedAt,
          syncedAt: localRecord.syncedAt,
          serverConfirmed: true,
          photosHydrated: localRecord.photosHydrated,
        }, localRecord))
        continue
      }

      const payloadComVinculo = preserveOwnership(payload, localRecord.payload)
      const serverTimestamp = resolveServerTimestamp(payload)
      updates.push(criarRegistroBase(payloadComVinculo, {
        syncStatus: SYNC_STATUS.SYNCED,
        pendingOperation: 'update',
        retryCount: 0,
        lastError: null,
        createdAt: localRecord.createdAt,
        updatedAt: serverTimestamp,
        syncedAt: serverTimestamp,
        serverConfirmed: true,
        photosHydrated: payload.fotos?.length > 0,
      }, localRecord))
    }

    if (updates.length) {
      await bulkPutInspectionRecords(updates)
      await recarregarDoIndexedDb()
    }
  }

  async function carregarDoServidor() {
    await initialize()
    loading.value = true
    erro.value = null

    try {
      const itensServidor = await api.listar()
      apiDisponivel.value = true
      await reconciliarLocalComServidor(itensServidor)
    } catch (error) {
      erro.value = error.message
      apiDisponivel.value = error?.status === 401
    } finally {
      loading.value = false
    }
  }

  async function excluir(localId) {
    await initialize()
    erro.value = null

    const item = inspecoes.value.find((inspecao) => inspecao.localId === localId)
    if (!item) return

    if (item.serverConfirmed && item.chavePrimariaMa && navigator.onLine && await marcarApiDisponivel()) {
      await api.excluir(item.chavePrimariaMa)
    }

    await deleteInspectionRecord(localId)
    await recarregarDoIndexedDb()
  }

  function porFuncionario(funcionarioId, funcionarioNome = null) {
    const id = normalizeText(funcionarioId)
    const nome = normalizeText(funcionarioNome)

    return sortByUpdatedAt(inspecoes.value.filter((item) => {
      const itemId = normalizeText(item.funcionarioId)
      if (id && itemId && itemId === id) {
        return true
      }

      if (!nome) {
        return false
      }

      const candidatoNome = normalizeText(item.funcionarioNome || item.autorCadastro || item.autorFormulario)
      return candidatoNome && candidatoNome === nome
    }))
  }

  async function carregarPorLocalId(localId) {
    const item = inspecoes.value.find((inspecao) => inspecao.localId === localId)
    if (item?.photosHydrated) return item
    return hydrateInspection(localId)
  }

  return {
    inspecoes,
    loading,
    erro,
    initialized,
    syncing,
    apiDisponivel,
    browserOnline,
    filaPendencias,
    total,
    sincronizadas,
    enviadas,
    rascunhos,
    pendentesSync,
    recentes,
    todas,
    ultimasPorFuncionario,
    initialize,
    salvarRascunho,
    enfileirarParaSync,
    sincronizarPendentes,
    retryItem,
    carregarDoServidor,
    reconciliarLocalComServidor,
    carregarPorLocalId,
    excluir,
    porFuncionario,
  }
})
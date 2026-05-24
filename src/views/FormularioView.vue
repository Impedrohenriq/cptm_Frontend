<template>
  <div class="formulario" role="main">

    <!-- ===== HEADER FIXO ===== -->
    <header class="fv-header">
      <div class="fv-header__top">
        <button class="fv-back" @click="handleBack" aria-label="Voltar">
          <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        </button>
        <div class="fv-header__info">
          <p class="fv-titulo">FDC – EEA.EF</p>
          <p class="fv-subtitulo">{{ etapas[etapaAtual].label }}</p>
        </div>
        <div class="fv-autosave" aria-live="polite">
          <Transition name="fade">
            <div v-if="autoSaved" class="fv-autosave__chip">
              <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              Salvo
            </div>
          </Transition>
        </div>
      </div>

      <!-- Steps pill progress -->
      <div class="fv-steps" role="progressbar" :aria-valuenow="etapaAtual+1" :aria-valuemax="totalEtapas">
        <button
          v-for="(e, i) in etapas"
          :key="i"
          class="fv-step"
          :class="{ 'fv-step--done': i < etapaAtual, 'fv-step--active': i === etapaAtual }"
          @click="i < etapaAtual ? irParaEtapa(i) : null"
          :aria-label="`Etapa ${i+1}: ${e.label}`"
          :title="e.label"
        >
          <span class="fv-step__num">
            <svg v-if="i < etapaAtual" viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            <span v-else>{{ i + 1 }}</span>
          </span>
        </button>
        <div class="fv-step__bar">
          <div class="fv-step__fill" :style="{ width: progressPct + '%' }"></div>
        </div>
      </div>
    </header>

    <!-- ===== CORPO ROLÁVEL ===== -->
    <div class="fv-body">
      <Transition :name="transitionDir" mode="out-in">
        <component
          :is="etapas[etapaAtual].component"
          :key="etapaAtual"
          :modelValue="dados"
          @update:modelValue="val => Object.assign(dados, val)"
        />
      </Transition>
    </div>

    <!-- ===== RODAPÉ FIXO ===== -->
    <footer class="fv-footer">
      <button
        class="fv-footer__prev"
        :class="{ invisible: etapaAtual === 0 }"
        aria-label="Etapa anterior"
        @click="goBack"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
      </button>

      <!-- Próxima etapa -->
      <button
        v-if="etapaAtual < totalEtapas - 1"
        class="fv-footer__next"
        :disabled="!etapaValida"
        @click="goNext"
      >
        Próxima Etapa
        <svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
      </button>

      <!-- Última etapa -->
      <div v-else class="fv-footer__final">
        <button class="fv-btn-rascunho" @click="salvarRascunho">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
          Rascunho
        </button>
        <button class="fv-btn-enviar" @click="enviarInspecao">
          <svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          Enviar Inspeção
        </button>
      </div>
    </footer>

    <!-- Modal de status -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="modalState.show" class="fv-modal-overlay" role="dialog" aria-modal="true">
          <div class="fv-modal-card">
            <div class="fv-modal-icon">
              <svg viewBox="0 0 24 24" fill="white" width="40" height="40"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            </div>
            <h2 class="fv-modal-title">{{ modalState.title }}</h2>
            <p class="fv-modal-desc">{{ modalState.desc }}</p>
            <button class="fv-btn-ok" @click="voltarAoDashboard">Voltar ao Painel</button>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, reactive, markRaw, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useInspecoesStore } from '@/stores/inspecoes'
import { useAuthStore } from '@/stores/auth'
import EtapaTipo from '@/components/formulario/EtapaTipo.vue'
import EtapaLocal from '@/components/formulario/EtapaLocal.vue'
import EtapaQuestionario from '@/components/formulario/EtapaQuestionario.vue'
import EtapaEvidencias from '@/components/formulario/EtapaEvidencias.vue'
import EtapaFinalizacao from '@/components/formulario/EtapaFinalizacao.vue'

const router = useRouter()
const route = useRoute()
const store  = useInspecoesStore()
const auth   = useAuthStore()

// markRaw: evita que o Vue tente tornar o componente reativo
const etapas = [
  { component: markRaw(EtapaTipo),         label: 'Premíssas / Cadastrador' },
  { component: markRaw(EtapaLocal),        label: 'Identificação do Formulário' },
  { component: markRaw(EtapaQuestionario), label: 'E.M. e Localização' },
  { component: markRaw(EtapaEvidencias),   label: 'Caracterização' },
  { component: markRaw(EtapaFinalizacao),  label: 'Fotos e Revisão' },
]
const totalEtapas  = etapas.length
const etapaAtual   = ref(0)
const transitionDir = ref('slide-next')
const autoSaved    = ref(false)
const currentLocalId = ref(null)
const carregandoFormulario = ref(true)
const pausandoAutoSave = ref(false)
const modalState = reactive({ show: false, title: '', desc: '' })

const progressPct = computed(() => (etapaAtual.value / (totalEtapas - 1)) * 100)

const etapaValida = computed(() => {
  switch (etapaAtual.value) {
    case 0: return !!(dados.nomeContratada && dados.localEscopo && dados.siglaArea && dados.autorCadastro && dados.responsavelTecnico)
    case 1: return !!(dados.naturezaPGA && dados.dataEmissao && dados.numFormulario && dados.autorFormulario && dados.dataCadastramento && dados.horaCadastramento)
    case 2: return !!(dados.emNumero && dados.emNome && dados.municipio && dados.linha)
    case 3: return !!(dados.tipoAtividadeListada && dados.origemEfluente && dados.fonteGeradora)
    default: return true
  }
})

function criarDadosIniciais() {
  return {
    nomeContratada: '', numContrato: '', localEscopo: '',
    representante: '', siglaArea: '', statusDesvioAmbiental: '', statusRegistroBd: '',
    nomeAreaGestora: '', idAreaGestora: '', siglaAreaGestora: '', nomeSupervisora: '',
    nomeEmpresaExecutora: '', nrContratoSupervisora: '',
    autorCadastro: '', autorPjCadastro: '', responsavelTecnico: '', registroProfissional: '', docRT: '',
    naturezaPGA: '', dataEmissao: '', numFormulario: '', autorFormulario: '', nomeArquivoFdc: '', codigoArquivoFdc: '',
    dataCadastramento: new Date().toISOString().slice(0, 10),
    horaCadastramento: new Date().toTimeString().slice(0, 5),
    emNumero: '', emNome: '',
    municipio: '', linha: '', estacao: '', via: '',
    trechoSentido: '', kmPoste: '', latitude: null, longitude: null, latitudeSirgas2000: null, longitudeSirgas2000: null,
    tipoAtividadeListada: '', tipoAtividadeNaoListada: '',
    tipoDRAListado: '', tipoDRANaoListado: '',
    codigoDRA: '', dataValidadeDRA: '', analiseCptmAprovacao: '',
    tipoAtividadeCPTM: '', nomeLocal: '', complementoLocal: '',
    origemEfluente: '', fonteGeradora: '',
    quantidadeLitros: '', tipoDestinacao: '', tipoVeiculo: '',
    placaVeiculo: '', codigoGuiaRemessa: '',
    distanciaVia: '', ofereceRiscoSistemaCptm: '', dominioTerritorial: '', observacoesGerais: '',
    nomeArquivoRvtRelacionado: '', codigoElementoMonitorRvt: '',
    nomeArquivoDacRelacionado: '', codigoElementoMonitorDac: '',
    nomeArquivoCncRelacionado: '', codigoElementoMonitorCnc: '',
    codigoUltimoRra: '', codigoCedoc: '',
    fotos: [],
  }
}

const dados = reactive(criarDadosIniciais())

const usuarioAtual = computed(() => auth.currentUser?.value ?? auth.currentUser)

function valorTexto(value) {
  return String(value ?? '').trim()
}

function aplicarPrefillUsuarioLogado() {
  const nomeCompleto = valorTexto(usuarioAtual.value?.name)
  if (!nomeCompleto) return

  const updates = {}

  if (!valorTexto(dados.autorCadastro)) {
    updates.autorCadastro = nomeCompleto
  }

  if (!valorTexto(dados.autorFormulario)) {
    updates.autorFormulario = nomeCompleto
  }

  if (!valorTexto(dados.responsavelTecnico)) {
    updates.responsavelTecnico = nomeCompleto
  }

  if (Object.keys(updates).length) {
    Object.assign(dados, updates)
  }
}

function dadosComFuncionario() {
  const u = usuarioAtual.value
  return {
    ...dados,
    localId: currentLocalId.value,
    funcionarioId: u?.id || 'desconhecido',
    funcionarioNome: u?.name || 'Desconhecido',
    funcionarioInitials: u?.initials || '??',
  }
}

function handleBack() { etapaAtual.value === 0 ? router.back() : goBack() }
function goNext()    { transitionDir.value = 'slide-next'; etapaAtual.value++ }
function goBack()    { transitionDir.value = 'slide-prev'; etapaAtual.value-- }
function irParaEtapa(i) { transitionDir.value = i < etapaAtual.value ? 'slide-prev' : 'slide-next'; etapaAtual.value = i }

let autoSaveTimer = null
watch(dados, () => {
  if (carregandoFormulario.value || pausandoAutoSave.value) return
  clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(async () => {
    const salvo = await store.salvarRascunho(dadosComFuncionario())
    currentLocalId.value = salvo.localId
    autoSaved.value = true
    setTimeout(() => { autoSaved.value = false }, 2000)
  }, 1200)
}, { deep: true })

function aplicarDados(item) {
  const defaults = criarDadosIniciais()
  for (const key of Object.keys(defaults)) {
    dados[key] = item?.[key] ?? defaults[key]
  }
}

async function aplicarDadosSemAutoSave(item) {
  pausandoAutoSave.value = true
  clearTimeout(autoSaveTimer)
  aplicarDados(item)
  await nextTick()
  pausandoAutoSave.value = false
}

async function carregarFormularioDaRota() {
  const localId = typeof route.query.localId === 'string' ? route.query.localId : null

  if (!localId) {
    return false
  }

  const item = await store.carregarPorLocalId(localId)
  if (item) {
    currentLocalId.value = item.localId
    await aplicarDadosSemAutoSave(item)
    return true
  }

  return false
}

onMounted(async () => {
  try {
    await store.initialize()
    await carregarFormularioDaRota()
    aplicarPrefillUsuarioLogado()
  } finally {
    carregandoFormulario.value = false
  }
})

watch(usuarioAtual, () => {
  if (currentLocalId.value) return
  aplicarPrefillUsuarioLogado()
})

watch(
  () => route.query.localId,
  async (newLocalId, oldLocalId) => {
    if (!newLocalId || newLocalId === oldLocalId || carregandoFormulario.value) return
    await carregarFormularioDaRota()
    aplicarPrefillUsuarioLogado()
  }
)

async function salvarRascunho() {
  const salvo = await store.salvarRascunho(dadosComFuncionario())
  currentLocalId.value = salvo.localId
  await router.replace({ path: '/formulario', query: { localId: salvo.localId } })
  await router.replace('/dashboard')
}

async function enviarInspecao()  {
  clearTimeout(autoSaveTimer)

  const resultado = await store.enfileirarParaSync(dadosComFuncionario())

  currentLocalId.value = resultado.local?.localId ?? currentLocalId.value
  if (currentLocalId.value && route.query.localId !== currentLocalId.value) {
    await router.replace({ path: '/formulario', query: { localId: currentLocalId.value } })
  }

  if (resultado.sucesso) {
    modalState.title = 'Inspecao sincronizada'
    modalState.desc = 'A API confirmou o recebimento e o item ja foi persistido no backend e no Oracle.'
  } else {
    modalState.title = 'Inspecao na fila local'
    modalState.desc = resultado.mensagem ?? 'Os dados ficaram salvos no dispositivo e serao reenviados automaticamente quando a conectividade voltar.'
  }

  modalState.show = true
}

function voltarAoDashboard() {
  modalState.show = false
  router.replace('/dashboard')
}
</script>

<style scoped>
/* ====================================================
   FormularioView — layout raiz
   ==================================================== */
.formulario {
  min-height: 100dvh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--cptm-cinza-fundo);
  overflow: hidden;
}

/* ====================================================
   HEADER
   ==================================================== */
.fv-header {
  background: linear-gradient(135deg, var(--cptm-vermelho) 0%, var(--cptm-vermelho-escuro) 100%);
  padding-top: calc(14px + var(--safe-top));
  padding-bottom: 0;
  flex-shrink: 0;
  box-shadow: 0 2px 12px rgba(0,0,0,.18);
  z-index: 50;
}

.fv-header__top {
  display: flex;
  align-items: center;
  gap: var(--s-sm);
  padding: 0 var(--s-md) 12px;
}

.fv-back {
  width: 40px; min-width: 40px; height: 40px;
  border: none; background: rgba(255,255,255,.18);
  border-radius: 50%; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: white; flex-shrink: 0;
  transition: background var(--t-fast);
}
.fv-back:hover { background: rgba(255,255,255,.28); }

.fv-header__info { flex: 1; min-width: 0; }
.fv-titulo    { font-size: var(--txt-xs); font-weight: 800; color: rgba(255,255,255,.7); letter-spacing: .08em; text-transform: uppercase; margin: 0; }
.fv-subtitulo { font-size: var(--txt-sm); font-weight: 700; color: white; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.fv-autosave { min-width: 54px; display: flex; justify-content: flex-end; }
.fv-autosave__chip {
  display: flex; align-items: center; gap: 4px;
  background: rgba(255,255,255,.2); color: white;
  font-size: 11px; font-weight: 700; padding: 4px 8px;
  border-radius: var(--r-full);
}

/* Steps progress */
.fv-steps {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px var(--s-md) 14px;
}
.fv-step__bar {
  position: absolute;
  left: var(--s-md); right: var(--s-md); top: 50%;
  height: 3px; background: rgba(255,255,255,.25);
  border-radius: 2px; z-index: 0;
  transform: translateY(-50%);
}
.fv-step__fill {
  height: 100%; background: white;
  border-radius: 2px;
  transition: width .4s ease;
}

.fv-step {
  position: relative; z-index: 1;
  width: 30px; height: 30px;
  border: 2px solid rgba(255,255,255,.4);
  border-radius: 50%;
  background: rgba(255,255,255,.15);
  cursor: default;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: background .2s, border-color .2s, transform .2s;
}
.fv-step--done {
  background: white; border-color: white; cursor: pointer;
}
.fv-step--done:hover { transform: scale(1.1); }
.fv-step--active {
  background: white; border-color: white;
  box-shadow: 0 0 0 4px rgba(255,255,255,.3);
  transform: scale(1.1);
}
.fv-step__num {
  font-size: 11px; font-weight: 800;
  color: var(--cptm-vermelho);
  display: flex; align-items: center; justify-content: center;
  line-height: 1;
}
.fv-step:not(.fv-step--done):not(.fv-step--active) .fv-step__num {
  color: rgba(255,255,255,.8);
}

/* ====================================================
   BODY ROLÁVEL
   ==================================================== */
.fv-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding-bottom: calc(var(--h-btn) + var(--bottom-nav-h) + 44px + var(--safe-bottom));
}
@media (min-width: 600px) {
  .fv-body :deep(.fdc-etapa) {
    max-width: 480px;
    margin: 0 auto;
  }
}

/* ====================================================
   RODAPÉ FIXO
   ==================================================== */
.fv-footer {
  position: fixed;
  bottom: calc(var(--bottom-nav-h) + var(--safe-bottom) + 8px);
  left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 480px;
  background: var(--cptm-branco);
  border-top: 1px solid var(--cptm-cinza-borda);
  padding: var(--s-sm) var(--s-md) calc(var(--s-sm) + var(--safe-bottom));
  display: flex; gap: var(--s-sm);
  z-index: 50;
  box-shadow: 0 -4px 16px rgba(0,0,0,.09);
}
@media (max-width: 480px) {
  .fv-footer { left: 0; transform: none; max-width: 100%; }
}

.fv-footer__prev {
  width: 52px; min-width: 52px; height: var(--h-btn);
  border: 2px solid var(--cptm-cinza-borda);
  border-radius: var(--r-md); background: var(--cptm-branco);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--cptm-cinza-medio);
  transition: background var(--t-fast), border-color var(--t-fast);
  flex-shrink: 0;
}
.fv-footer__prev:hover { background: var(--cptm-cinza-fundo); border-color: var(--cptm-cinza-claro); }
.fv-footer__prev.invisible { visibility: hidden; pointer-events: none; }

.fv-footer__next {
  flex: 1; height: var(--h-btn);
  background: var(--cptm-vermelho);
  color: white; border: none; border-radius: var(--r-md);
  font-size: var(--txt-base); font-weight: 800; font-family: var(--fonte-principal);
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
  box-shadow: 0 4px 12px rgba(200,16,46,.35);
  transition: background var(--t-fast), transform var(--t-fast), box-shadow var(--t-fast);
}
.fv-footer__next:hover    { background: var(--cptm-vermelho-escuro); }
.fv-footer__next:disabled { opacity: .45; cursor: not-allowed; box-shadow: none; transform: none; }
.fv-footer__next:active   { transform: scale(.97); }

.fv-footer__final { display: flex; gap: var(--s-sm); flex: 1; }

.fv-btn-rascunho {
  flex: 1; height: var(--h-btn);
  border: 2px solid var(--cptm-cinza-borda); border-radius: var(--r-md);
  background: var(--cptm-branco); font-size: var(--txt-sm); font-weight: 700;
  font-family: var(--fonte-principal); color: var(--cptm-cinza-medio);
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: background var(--t-fast);
}
.fv-btn-rascunho:hover { background: var(--cptm-cinza-fundo); }

.fv-btn-enviar {
  flex: 2; height: var(--h-btn);
  background: linear-gradient(135deg, var(--verde-principal), var(--verde-hover));
  border: none; border-radius: var(--r-md);
  font-size: var(--txt-base); font-weight: 800; font-family: var(--fonte-principal);
  color: white; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  box-shadow: 0 4px 12px rgba(46,125,50,.35);
  transition: transform var(--t-fast), box-shadow var(--t-fast);
}
.fv-btn-enviar:active { transform: scale(.97); }
.fv-btn-enviar:hover  { box-shadow: 0 6px 18px rgba(46,125,50,.45); }

/* ====================================================
   MODAL SUCESSO
   ==================================================== */
.fv-modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.55);
  display: flex; align-items: flex-end;
  z-index: 200;
  padding: 0;
}
.fv-modal-card {
  width: 100%; max-width: 480px; margin: 0 auto;
  background: var(--cptm-branco);
  border-radius: var(--r-xl) var(--r-xl) 0 0;
  padding: var(--s-xl) var(--s-lg) calc(var(--s-xl) + var(--safe-bottom));
  display: flex; flex-direction: column; align-items: center; gap: var(--s-lg);
  text-align: center;
  animation: slideUpModal .35s ease both;
}
.fv-modal-icon {
  width: 80px; height: 80px; border-radius: 50%;
  background: var(--verde-principal);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 24px rgba(46,125,50,.35);
}
.fv-modal-title { font-size: var(--txt-xl); font-weight: 800; color: var(--cptm-cinza-escuro); margin: 0; }
.fv-modal-desc  { font-size: var(--txt-sm); color: var(--cptm-cinza-medio); line-height: 1.6; margin: 0; max-width: 280px; }
.fv-btn-ok {
  width: 100%; height: var(--h-btn);
  background: var(--verde-principal); color: white;
  border: none; border-radius: var(--r-md);
  font-size: var(--txt-base); font-weight: 800; font-family: var(--fonte-principal);
  cursor: pointer; box-shadow: 0 4px 12px rgba(46,125,50,.35);
  transition: background var(--t-fast);
}
.fv-btn-ok:hover { background: var(--verde-hover); }

/* ====================================================
   TRANSIÇÕES DE ETAPA
   ==================================================== */
.slide-next-enter-active, .slide-next-leave-active,
.slide-prev-enter-active,  .slide-prev-leave-active {
  transition: opacity .2s ease, transform .25s ease;
}
.slide-next-enter-from { opacity: 0; transform: translateX(32px); }
.slide-next-leave-to   { opacity: 0; transform: translateX(-32px); }
.slide-prev-enter-from { opacity: 0; transform: translateX(-32px); }
.slide-prev-leave-to   { opacity: 0; transform: translateX(32px); }

.fade-enter-active, .fade-leave-active { transition: opacity .25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

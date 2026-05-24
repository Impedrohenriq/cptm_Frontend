<template>
  <div class="historico" role="main">
    <header class="historico__header">
      <button class="historico__back" aria-label="Voltar" @click="voltar">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
        </svg>
      </button>
      <div>
        <h1 class="historico__title">Histórico de inspeções</h1>
        <p class="historico__sub">Últimas 10 do seu usuário</p>
      </div>
    </header>

    <section class="historico__content" aria-labelledby="historico-titulo">
      <h2 id="historico-titulo" class="sr-only">Últimas inspeções</h2>

      <div v-if="historico.length === 0" class="lista-vazia">
        <p>Nenhuma inspeção encontrada para este usuário.</p>
      </div>

      <div v-else class="inspection-list" role="list">
        <div
          v-for="ins in historico"
          :key="ins.localId"
          class="card-inspecao-wrap"
          role="listitem"
        >
          <button
            class="card-inspecao"
            :class="`card-inspecao--${ins.status}`"
            :aria-label="`Inspeção ${ins.nomeContratada || 'FDC-EEA.EF'} com status ${ins.status}`"
            @click="abrirInspecao(ins)"
          >
            <div class="card-ins__body">
              <p class="card-ins__title">{{ ins.nomeContratada || 'FDC-EEA.EF' }}</p>
              <p class="card-ins__local">{{ ins.estacao || ins.nomeLocal || '—' }} · {{ ins.linha || '—' }}</p>
              <div class="card-ins__footer">
                <StatusBadge :status="ins.status" />
                <span class="card-ins__date">{{ formatDate(ins.updatedAt) }}</span>
              </div>
            </div>
          </button>

          <button
            v-if="ins.syncStatus === 'erro_sync' || ins.syncStatus === 'pendente_sync'"
            class="card-ins__retry"
            @click="retryInspecao(ins.localId)"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <Transition name="slide-up">
        <div
          v-if="inspecaoSelecionada"
          class="modal-overlay"
          role="dialog"
          aria-modal="true"
          @click.self="fecharResumo"
        >
          <div class="modal-sheet">
            <div class="modal-handle" aria-hidden="true"></div>
            <div class="modal-head">
              <div>
                <h3 class="modal-head__title">Resumo da Inspeção</h3>
                <div class="modal-head__sub">
                  <StatusBadge :status="inspecaoSelecionada.status" />
                  <span class="func-pill" :class="avatarClass(inspecaoSelecionada.funcionarioId)">
                    {{ ownerInitials(inspecaoSelecionada) }}
                  </span>
                </div>
              </div>
              <button class="btn-fechar" @click="fecharResumo" aria-label="Fechar">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <div class="modal-body">
              <div class="resumo-card">
                <div class="resumo-linha--destaque">
                  <div class="resumo-icone" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.79 6 9.14 0 3.63-2.65 6.2-6 6.2z"/></svg>
                  </div>
                  <div>
                    <strong>{{ inspecaoSelecionada.nomeContratada || 'FDC-EEA.EF' }}</strong>
                    <div class="resumo-item__label">{{ inspecaoSelecionada.estacao || inspecaoSelecionada.nomeLocal || 'Local não informado' }}</div>
                  </div>
                </div>

                <div class="resumo-divisor"></div>
                <div class="resumo-grupo">
                  <div class="resumo-item">
                    <span class="resumo-item__label">Linha</span>
                    <span class="resumo-item__valor">{{ inspecaoSelecionada.linha || '—' }}</span>
                  </div>
                  <div class="resumo-item">
                    <span class="resumo-item__label">Status</span>
                    <span class="resumo-item__valor">{{ inspecaoSelecionada.status || '—' }}</span>
                  </div>
                  <div class="resumo-item">
                    <span class="resumo-item__label">Atualizado</span>
                    <span class="resumo-item__valor">{{ formatDate(inspecaoSelecionada.updatedAt) }}</span>
                  </div>
                </div>

                <template v-if="inspecaoSelecionada.observacoesGerais">
                  <div class="resumo-divisor"></div>
                  <div class="resumo-obs">
                    <div class="resumo-item__label">Observações</div>
                    <p>{{ inspecaoSelecionada.observacoesGerais }}</p>
                  </div>
                </template>
              </div>

              <div class="inspetor-card">
                <div class="inspetor-avatar" :class="avatarClass(inspecaoSelecionada.funcionarioId)">
                  {{ ownerInitials(inspecaoSelecionada) }}
                </div>
                <div class="inspetor-info">
                  <span class="inspetor-nome">{{ inspecaoSelecionada.funcionarioNome || inspecaoSelecionada.autorCadastro || user?.name || 'Inspetor' }}</span>
                  <span class="inspetor-label">Responsável pela inspeção</span>
                </div>
              </div>

              <div class="modal-acoes">
                <template v-if="!confirmandoExclusao">
                  <button
                    v-if="!isDraft(inspecaoSelecionada)"
                    class="btn-acao btn-acao--sincronizar"
                    :disabled="inspecaoSelecionada.syncStatus === 'sincronizando'"
                    @click="enviarOuSincronizar(inspecaoSelecionada)"
                  >
                    {{ inspecaoSelecionada.syncStatus === 'sincronizando' ? 'Sincronizando...' : 'Enviar/Sincronizar' }}
                  </button>
                  <button class="btn-acao btn-acao--editar" @click="editarInspecao(inspecaoSelecionada)">
                    {{ isDraft(inspecaoSelecionada) ? 'Continuar editando' : 'Editar Formulário' }}
                  </button>
                  <button class="btn-acao btn-acao--excluir" @click="confirmandoExclusao = true">
                    Excluir Formulário
                  </button>
                </template>

                <template v-else>
                  <p class="confirm-aviso">Excluir esta inspeção permanentemente?</p>
                  <div class="confirm-botoes">
                    <button class="btn-acao btn-acao--cancelar" @click="confirmandoExclusao = false">Cancelar</button>
                    <button class="btn-acao btn-acao--confirmar" @click="excluirInspecao(inspecaoSelecionada.localId)">Sim, excluir</button>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useInspecoesStore } from '@/stores/inspecoes'
import { useNotificacoesStore } from '@/stores/notificacoes'
import StatusBadge from '@/components/StatusBadge.vue'

const router = useRouter()
const auth = useAuthStore()
const store = useInspecoesStore()
const notificacoes = useNotificacoesStore()

const user = computed(() => auth.currentUser?.value ?? auth.currentUser)
const isGestor = computed(() => auth.isGestor?.value ?? auth.isGestor)
const inspecaoSelecionada = ref(null)
const confirmandoExclusao = ref(false)
const AVATAR_CLASSES = ['av-red', 'av-blue', 'av-green', 'av-purple']
const avatarMap = new Map()

const historico = computed(() => {
  const funcionarioId = user.value?.id
  const funcionarioNome = user.value?.name
  if (!funcionarioId) return []
  return store.porFuncionario(funcionarioId, funcionarioNome).slice(0, 10)
})

onMounted(async () => {
  await store.initialize()
  if (store.browserOnline) {
    await store.carregarDoServidor().catch(() => {})
  }
})

function voltar() {
  router.back()
}

function abrirInspecao(inspecao) {
  if (isGestor.value) {
    router.push({ path: '/formulario', query: { localId: inspecao.localId } })
    return
  }

  inspecaoSelecionada.value = inspecao
  confirmandoExclusao.value = false
}

function fecharResumo() {
  inspecaoSelecionada.value = null
  confirmandoExclusao.value = false
}

function editarInspecao(inspecao) {
  fecharResumo()
  router.push({ path: '/formulario', query: { localId: inspecao.localId } })
}

function isDraft(inspecao) {
  return inspecao?.syncStatus === 'rascunho'
}

async function enviarOuSincronizar(inspecao) {
  if (!inspecao || inspecao.syncStatus === 'sincronizando') return

  await store.enfileirarParaSync(inspecao)
  if (store.apiDisponivel) {
    await store.carregarDoServidor()
  }

  fecharResumo()
}

async function excluirInspecao(localId) {
  try {
    await store.excluir(localId)
    notificacoes.push({
      type: 'success',
      title: 'Inspeção excluída',
      message: 'Registro removido com sucesso.',
      dedupeKey: `delete-own-${localId}`,
      localId,
    })
    fecharResumo()
  } catch (error) {
    notificacoes.push({
      type: 'error',
      title: 'Exclusão não permitida',
      message: error?.message || 'Não foi possível excluir esta inspeção.',
      dedupeKey: `delete-own-error-${localId}`,
      localId,
    })
  }
}

async function retryInspecao(localId) {
  await store.retryItem(localId)
  if (store.apiDisponivel) {
    await store.carregarDoServidor()
  }
}

function formatDate(ts) {
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 86400000) {
    return 'Hoje, ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  if (diff < 172800000) return 'Ontem, ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ', ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function ownerInitials(inspecao) {
  if (inspecao?.funcionarioInitials) return String(inspecao.funcionarioInitials).toUpperCase().slice(0, 2)

  const nome = String(inspecao?.funcionarioNome || inspecao?.autorCadastro || user.value?.name || '').trim()
  if (!nome) return '??'

  const partes = nome.split(/\s+/).filter(Boolean)
  const primeira = partes[0]?.[0] ?? ''
  const segunda = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : (partes[0]?.[1] ?? '')
  return `${primeira}${segunda}`.toUpperCase() || '??'
}

function avatarClass(id) {
  const key = String(id || 'desconhecido')
  if (!avatarMap.has(key)) {
    avatarMap.set(key, AVATAR_CLASSES[avatarMap.size % AVATAR_CLASSES.length])
  }

  return avatarMap.get(key)
}
</script>

<style scoped>
.historico {
  min-height: 100dvh;
  background: var(--cptm-cinza-fundo);
  padding-bottom: calc(var(--bottom-nav-h) + var(--safe-bottom) + 20px);
}

.historico__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: calc(16px + var(--safe-top)) var(--s-lg) 14px;
  background: linear-gradient(150deg, #C8102E 0%, #9B0B22 100%);
  color: #fff;
}

.historico__back {
  border: 0;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
}

.historico__back svg {
  width: 20px;
  height: 20px;
}

.historico__title {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 800;
}

.historico__sub {
  margin: 2px 0 0;
  font-size: 0.82rem;
  opacity: 0.9;
}

.historico__content {
  padding: var(--s-lg);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.lista-vazia {
  background: #fff;
  border-radius: 14px;
  padding: 18px;
  text-align: center;
  color: #6b7280;
}

.inspection-list {
  display: grid;
  gap: 12px;
}

.card-inspecao-wrap {
  display: grid;
  gap: 6px;
}

.card-inspecao {
  border: 0;
  border-radius: 14px;
  background: #fff;
  text-align: left;
  width: 100%;
  padding: 14px;
}

.card-ins__title {
  margin: 0;
  font-size: 0.96rem;
  font-weight: 700;
  color: #263238;
}

.card-ins__local {
  margin: 4px 0 0;
  font-size: 0.84rem;
  color: #546e7a;
}

.card-ins__footer {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-ins__date {
  font-size: 0.77rem;
  color: #6b7280;
}

.card-ins__retry {
  border: 0;
  border-radius: 10px;
  background: #fef3c7;
  color: #92400e;
  padding: 8px 10px;
  font-size: 0.8rem;
  font-weight: 700;
}


.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.55);
  z-index: 200;
  display: flex; align-items: flex-end;
  backdrop-filter: blur(2px);
}

.modal-sheet {
  background: var(--cptm-branco);
  border-radius: var(--r-xl) var(--r-xl) 0 0;
  width: 100%;
  max-height: 90dvh;
  overflow-y: auto;
  padding-bottom: var(--safe-bottom);
}

.modal-handle {
  width: 40px; height: 4px;
  background: var(--cptm-cinza-borda);
  border-radius: 99px;
  margin: 12px auto 0;
}

.modal-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: var(--s-md) var(--s-md) var(--s-sm);
  border-bottom: 1px solid var(--cptm-cinza-borda);
}

.modal-head__title { font-size: var(--txt-base); font-weight: 800; color: var(--cptm-cinza-escuro); margin-bottom: 4px; }
.modal-head__sub { display: flex; align-items: center; gap: var(--s-sm); font-size: var(--txt-xs); color: var(--cptm-cinza-claro); }

.func-pill {
  width: 24px; height: 24px;
  border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 0.6rem; font-weight: 800; color: white;
}

.btn-fechar {
  background: var(--cptm-cinza-fundo);
  border: none; border-radius: 50%;
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--cptm-cinza-medio);
  flex-shrink: 0;
}

.modal-body { padding: var(--s-md); display: flex; flex-direction: column; gap: var(--s-md); }

.resumo-card {
  background: var(--cptm-branco);
  border: 1.5px solid var(--cptm-cinza-borda);
  border-radius: var(--r-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.resumo-linha--destaque {
  display: flex; align-items: center; gap: var(--s-md);
  padding: var(--s-md);
  background: var(--cptm-cinza-fundo);
}

.resumo-icone {
  width: 44px; height: 44px;
  border-radius: var(--r-md);
  background: #FFF3E0;
  color: #E65100;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.resumo-divisor { height: 1px; background: var(--cptm-cinza-borda); }
.resumo-grupo { padding: var(--s-md); display: flex; flex-direction: column; gap: var(--s-sm); }
.resumo-item { display: flex; justify-content: space-between; align-items: baseline; gap: var(--s-sm); }

.resumo-item__label {
  font-size: var(--txt-xs); color: var(--cptm-cinza-claro);
  font-weight: 600; text-transform: uppercase; letter-spacing: .04em;
  flex-shrink: 0;
}

.resumo-item__valor {
  font-size: var(--txt-sm); font-weight: 600;
  color: var(--cptm-cinza-escuro); text-align: right;
}

.resumo-obs { padding: var(--s-md); }
.resumo-obs p { font-size: var(--txt-sm); color: var(--cptm-cinza-escuro); margin: 4px 0 0; line-height: 1.5; }

.inspetor-card {
  display: flex; align-items: center; gap: var(--s-md);
  background: var(--cptm-cinza-fundo);
  border: 1.5px solid var(--cptm-cinza-borda);
  border-radius: var(--r-lg);
  padding: var(--s-md);
}

.inspetor-avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: .8rem; font-weight: 800; color: white;
  flex-shrink: 0;
}

.inspetor-info { display: flex; flex-direction: column; gap: 2px; }
.inspetor-nome { font-size: var(--txt-sm); font-weight: 700; color: var(--cptm-cinza-escuro); }
.inspetor-label { font-size: var(--txt-xs); color: var(--cptm-cinza-claro); }

.modal-acoes {
  border-top: 1px solid #eceff1;
  padding: 12px 14px 14px;
  display: grid;
  gap: 10px;
}

.btn-acao {
  width: 100%;
  border: none;
  border-radius: var(--r-md);
  padding: 14px var(--s-md);
  font-weight: 700;
  font-size: var(--txt-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: opacity var(--t-fast), transform var(--t-fast);
  -webkit-tap-highlight-color: transparent;
}

.btn-acao:active { opacity: 0.8; transform: scale(0.98); }

.btn-acao--editar {
  background: var(--cptm-vermelho);
  color: white;
}

.btn-acao--sincronizar {
  background: var(--cptm-vermelho);
  color: white;
}

.btn-acao--excluir {
  background: var(--cptm-cinza-fundo);
  color: #C62828;
  border: 1.5px solid #FFCDD2;
}

.confirm-aviso {
  font-size: var(--txt-sm);
  font-weight: 700;
  color: #C62828;
  text-align: center;
  padding: 4px 0;
}

.confirm-botoes {
  display: flex;
  gap: var(--s-sm);
}

.btn-acao--cancelar {
  flex: 1;
  background: var(--cptm-cinza-fundo);
  color: var(--cptm-cinza-medio);
  border: 1.5px solid var(--cptm-cinza-borda);
}

.btn-acao--confirmar {
  flex: 1;
  background: #C62828;
  color: white;
}

.av-red    { background: linear-gradient(135deg, #C8102E, #E8394F); }
.av-blue   { background: linear-gradient(135deg, #1565C0, #1976D2); }
.av-green  { background: linear-gradient(135deg, #2E7D32, #43A047); }
.av-purple { background: linear-gradient(135deg, #4527A0, #673AB7); }

.slide-up-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.15, 0.64, 1); }
.slide-up-leave-active { transition: all 0.25s ease; }
.slide-up-enter-from  { opacity: 0; }
.slide-up-leave-to    { opacity: 0; }
.slide-up-enter-from .modal-sheet { transform: translateY(100%); }
.slide-up-leave-to   .modal-sheet { transform: translateY(100%); }
.modal-sheet { transition: transform 0.35s cubic-bezier(0.34, 1.15, 0.64, 1); }
</style>

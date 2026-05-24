<template>
  <div class="dashboard" role="main">

    <!-- ---- Header ---- -->
    <header class="dashboard__header">
      <!-- Top row: logo + actions -->
      <div class="dashboard__top">
        <div class="dashboard__logo" aria-label="CPTM Ambiental">
          <span class="dashboard__logo-text">CPTM</span>
          <LogoBadge :size="26" />
        </div>
        <div class="dashboard__actions">
          <!-- Notifications -->
          <div
            class="notif-menu"
            ref="notifMenuRef"
          >
            <button
              class="btn-circle btn-circle--ghost"
              :aria-label="`Notificações (${naoLidasCount} novas)`"
              style="position:relative"
              @click="toggleNotifications"
            >
              <svg viewBox="0 0 24 24" fill="white" aria-hidden="true">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
              <span v-if="naoLidasCount > 0" class="notif-dot" aria-hidden="true">{{ Math.min(naoLidasCount, 9) }}</span>
            </button>

            <Transition name="fade">
              <div
                v-if="notifOpen"
                class="notif-popover"
                role="dialog"
                aria-label="Notificações recentes"
              >
                <div class="notif-popover__head">
                  <strong>Notificações</strong>
                  <button class="notif-popover__clear" @click="limparNotificacoes">Limpar</button>
                </div>

                <div v-if="notificacoesOrdenadas.length === 0" class="notif-popover__empty">
                  Nenhuma notificação no momento.
                </div>

                <ul v-else class="notif-list" role="list">
                  <li
                    v-for="item in notificacoesOrdenadas.slice(0, 6)"
                    :key="item.id"
                    class="notif-item"
                    :class="`notif-item--${item.type}`"
                    role="listitem"
                    @click="marcarComoLida(item.id)"
                  >
                    <p class="notif-item__title">{{ item.title }}</p>
                    <p class="notif-item__message">{{ item.message }}</p>
                    <span class="notif-item__time">{{ formatDate(item.createdAt) }}</span>
                  </li>
                </ul>
              </div>
            </Transition>
          </div>
          <!-- Profile avatar -->
          <div
            class="profile-menu"
            ref="profileMenuRef"
          >
            <button
              class="btn-circle btn-circle--ghost"
              aria-label="Perfil do usuário"
              @click="toggleProfile"
            >
              <span class="avatar-initials" aria-hidden="true">{{ initials }}</span>
            </button>

            <Transition name="fade">
              <div
                v-if="profileOpen"
                class="profile-popover"
                role="dialog"
                aria-label="Dados do usuário"
              >
                <div class="profile-popover__head">
                  <div>
                    <p class="profile-popover__name">{{ user?.name || 'Usuário' }}</p>
                    <p class="profile-popover__role">{{ user?.role || 'Cargo não definido' }}</p>
                  </div>
                  <span class="profile-popover__initials" aria-hidden="true">{{ initials }}</span>
                </div>

                <div class="profile-popover__contact">
                  <p class="profile-popover__label">Contato</p>
                  <p class="profile-popover__email">{{ user?.email || 'E-mail não informado' }}</p>
                </div>

                <button class="profile-popover__logout" @click="logoutUser">
                  Sair da conta
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <!-- Greeting -->
      <div class="dashboard__greeting">
        <p class="dashboard__greeting-text">{{ saudacao }}</p>
        <h1 class="dashboard__user-name">{{ user?.name || 'Inspetor' }}</h1>
        <p class="dashboard__user-role">{{ user?.role }} &bull; {{ user?.line }}</p>
      </div>
    </header>

    <!-- ---- Content ---- -->
    <div class="dashboard__content">

      <!-- Summary cards -->
      <div class="dashboard__summary" role="region" aria-label="Resumo de inspeções">
        <div class="card-resumo card-resumo--total">
          <span class="card-resumo__num">{{ userTotal }}</span>
          <span class="card-resumo__label">Total</span>
        </div>

        <div class="card-resumo card-resumo--enviadas">
          <span class="card-resumo__num">{{ userSincronizadas }}</span>
          <span class="card-resumo__label">Sincronizadas</span>
        </div>

        <div class="card-resumo card-resumo--pendentes" :class="{ 'card-resumo--pendentes-ativo': userPendentes > 0 }">
          <span class="card-resumo__num">{{ userPendentes }}</span>
          <span class="card-resumo__label">Aguardando</span>
        </div>
      </div>

      <div class="dashboard__sync-panel">
        <div>
          <p class="dashboard__sync-title">Fila local</p>
          <p class="dashboard__sync-sub">{{ pendentesSync }} item(ns) aguardando sincronização com a API.</p>
        </div>
        <button class="dashboard__sync-btn" :disabled="pendentesSync === 0 || !store.browserOnline" @click="sincronizarAgora">
          Sincronizar agora
        </button>
      </div>

      <!-- New inspection CTA -->
      <button
        class="dashboard__new-btn"
        aria-label="Iniciar nova inspeção ambiental"
        @click="novaInspecao()"
      >
        <div class="new-btn__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="white"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </div>
        <div class="new-btn__text">
          <span class="new-btn__title">+ Nova Inspeção</span>
          <span class="new-btn__sub">Registrar ocorrência ambiental</span>
        </div>
      </button>

      <!-- Recent inspections list -->
      <section aria-labelledby="titulo-recentes">
        <div class="section-header">
          <h2 id="titulo-recentes" class="section-title">Inspeções Recentes</h2>
          <button class="section-link" aria-label="Ver todas as inspeções" @click="abrirHistorico">Ver todas</button>
        </div>

        <div class="inspection-list" role="list">

          <div v-if="recentesVisiveis.length === 0" class="lista-vazia">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 6h-2.18c.07-.44.18-.88.18-1.33C18 2.97 16.03 1 13.67 1c-1.28 0-2.43.53-3.27 1.39L9 3.8l-1.4-1.41C6.77 1.53 5.62 1 4.33 1 1.97 1 0 2.97 0 5.33c0 1.11.47 2.09 1.2 2.83L9 16l5.14-5.14-1.06-1.06L9 14.17 2.34 7.51c-.45-.45-.67-1.06-.67-1.67C1.67 3.83 2.84 2.67 4.33 2.67c.6 0 1.17.2 1.6.63L9 6.37l3.07-3.07c.43-.43 1-.63 1.6-.63C14.96 2.67 16 3.72 16 5c0 .61-.22 1.18-.6 1.6l-.67.67 5.28 5.27V6z"/></svg>
            <p>Nenhuma inspeção registrada ainda.</p>
          </div>

          <div
            v-for="ins in recentesVisiveis"
            :key="ins.localId"
            class="card-inspecao-wrap"
            role="listitem"
          >
            <button
              class="card-inspecao"
              :class="`card-inspecao--${ins.status}`"
              :aria-label="`FDC-EEA.EF – ${ins.nomeContratada || 'N/I'} em ${ins.estacao || ''}, ${ins.status}`"
              @click="abrirInspecao(ins)"
            >
            <!-- Icon -->
            <div class="card-ins__icon icone-efluente" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.79 6 9.14 0 3.63-2.65 6.2-6 6.2z"/></svg>
            </div>

            <!-- Body -->
            <div class="card-ins__body">
              <div class="card-ins__head">
                <p class="card-ins__title">{{ ins.nomeContratada || 'FDC-EEA.EF' }}</p>
                <span class="card-ins__owner" :title="ins.funcionarioNome || ins.autorCadastro || 'Usuario'">
                  {{ ownerInitials(ins) }}
                </span>
              </div>
              <p class="card-ins__author">{{ ins.funcionarioNome || ins.autorCadastro || user?.name || 'Usuário' }}</p>
              <p class="card-ins__local">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                {{ ins.estacao || ins.nomeLocal || '—' }} · {{ ins.linha || '—' }}
              </p>
              <div class="card-ins__footer">
                <StatusBadge :status="ins.status" />
                <span class="card-ins__date">{{ formatDate(ins.updatedAt) }}</span>
              </div>
              <p v-if="ins.syncStatus !== 'sincronizado'" class="card-ins__sync-hint">{{ getSyncHint(ins.syncStatus) }}</p>
              <p v-if="ins.lastError" class="card-ins__error">{{ ins.lastError }}</p>
            </div>

            <!-- Arrow -->
            <div class="card-ins__arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
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

        </div><!-- /list -->
      </section>
    </div><!-- /content -->

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
                  <div class="resumo-icone icone-efluente" aria-hidden="true">
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
              <template v-if="confirmandoExclusao">
                <p class="confirm-aviso">Excluir esta inspeção permanentemente?</p>
                <div class="confirm-botoes">
                  <button class="btn-acao btn-acao--cancelar" @click="confirmandoExclusao = false">Cancelar</button>
                  <button class="btn-acao btn-acao--confirmar" @click="excluirInspecao(inspecaoSelecionada.localId)">Sim, excluir</button>
                </div>
              </template>

              <template v-else-if="isDraft(inspecaoSelecionada)">
                <button class="btn-acao btn-acao--editar" @click="editarInspecao(inspecaoSelecionada)">
                  Continuar editando
                </button>
                <button class="btn-acao btn-acao--excluir" @click="confirmandoExclusao = true">
                  Excluir
                </button>
              </template>

              <template v-else>
                <button
                  class="btn-acao btn-acao--sincronizar"
                  :disabled="inspecaoSelecionada.syncStatus === 'sincronizando'"
                  @click="enviarOuSincronizar(inspecaoSelecionada)"
                >
                  {{ inspecaoSelecionada.syncStatus === 'sincronizando' ? 'Sincronizando...' : 'Enviar/Sincronizar' }}
                </button>
                <button class="btn-acao btn-acao--editar" @click="editarInspecao(inspecaoSelecionada)">
                  Editar Formulário
                </button>
                <button class="btn-acao btn-acao--excluir" @click="confirmandoExclusao = true">
                  Excluir Formulário
                </button>
              </template>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div><!-- /dashboard -->

</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useInspecoesStore } from '@/stores/inspecoes'
import { useNotificacoesStore } from '@/stores/notificacoes'
import { useSaudacao } from '@/composables/useSaudacao'
import LogoBadge from '@/components/LogoBadge.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const router = useRouter()
const auth = useAuthStore()
const store = useInspecoesStore()
const notificacoes = useNotificacoesStore()
const { saudacao } = useSaudacao()
const notifOpen = ref(false)
const profileOpen = ref(false)
const notifMenuRef = ref(null)
const profileMenuRef = ref(null)
const inspecaoSelecionada = ref(null)
const confirmandoExclusao = ref(false)
const AVATAR_CLASSES = ['av-red', 'av-blue', 'av-green', 'av-purple']
const avatarMap = new Map()

const user    = computed(() => auth.currentUser?.value ?? auth.currentUser)
const initials = computed(() => {
  if (!user.value?.name) return 'U'
  return user.value.name.split(' ').map(w => w[0]).slice(0, 2).join('')
})

const pendentesSync = computed(() => store.pendentesSync)
const isGestor = computed(() => auth.isGestor?.value ?? auth.isGestor)

// Filtragens por usuario (inspetor)
const userRecords = computed(() => {
  const uid = user.value?.id
  const nome = user.value?.name
  if (!uid) return []
  return store.porFuncionario(uid, nome)
})

const userTotal = computed(() => userRecords.value.length)
const userSincronizadas = computed(() => userRecords.value.filter((i) => i.syncStatus === 'sincronizado').length)
const userPendentes = computed(() => userRecords.value.filter((i) => ['pendente_sync', 'erro_sync', 'sincronizando'].includes(i.syncStatus)).length)

const recentesVisiveis = computed(() => {
  return userRecords.value.slice(0, 5)
})
const notificacoesOrdenadas = computed(() => notificacoes.ordenadas)
const naoLidasCount = computed(() => notificacoes.naoLidasCount)

onMounted(async () => {
  await store.initialize()
  if (store.browserOnline) {
    await store.carregarDoServidor().catch(() => {})
  }
  document.addEventListener('pointerdown', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', handleOutsideClick)
})

function handleOutsideClick(event) {
  const target = event.target
  const clickedNotif = notifMenuRef.value?.contains(target)
  const clickedProfile = profileMenuRef.value?.contains(target)

  if (!clickedNotif) {
    notifOpen.value = false
  }

  if (!clickedProfile) {
    profileOpen.value = false
  }
}

function toggleNotifications() {
  profileOpen.value = false
  notifOpen.value = !notifOpen.value
  if (notifOpen.value) {
    notificacoes.marcarTodasComoLidas()
  }
}

function marcarComoLida(id) {
  notificacoes.marcarComoLida(id)
}

function limparNotificacoes() {
  notificacoes.limpar()
}

function toggleProfile() {
  notifOpen.value = false
  profileOpen.value = !profileOpen.value
}

function logoutUser() {
  auth.logout()
  profileOpen.value = false
  router.replace('/login')
}

function abrirInspecao(inspecao) {
  inspecaoSelecionada.value = inspecao
  confirmandoExclusao.value = false
}

function fecharResumo() {
  inspecaoSelecionada.value = null
  confirmandoExclusao.value = false
}

function isDraft(inspecao) {
  return inspecao?.syncStatus === 'rascunho'
}

function editarInspecao(inspecao) {
  fecharResumo()
  router.push({ path: '/formulario', query: { localId: inspecao.localId } })
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
  await store.excluir(localId)
  fecharResumo()
}

function novaInspecao() {
  // Force reload after navigation so FormularioView always starts fresh
  router.push('/formulario').then(() => window.location.reload())
}

function abrirHistorico() {
  router.push('/inspecoes-recentes')
}

async function sincronizarAgora() {
  await store.sincronizarPendentes()
  if (store.apiDisponivel) {
    await store.carregarDoServidor()
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

function getSyncHint(syncStatus) {
  if (syncStatus === 'rascunho') return 'Rascunho salvo localmente.'
  if (syncStatus === 'pendente_sync') return 'Aguardando sincronização automática.'
  if (syncStatus === 'sincronizando') return 'Sincronização em andamento.'
  if (syncStatus === 'erro_sync') return 'Falha no último envio. Toque em Tentar novamente.'
  return ''
}

function ownerInitials(inspecao) {
  if (inspecao.funcionarioInitials) return String(inspecao.funcionarioInitials).toUpperCase().slice(0, 2)

  const nome = String(inspecao.funcionarioNome || inspecao.autorCadastro || user.value?.name || '').trim()
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
.dashboard {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--cptm-cinza-fundo);
  padding-bottom: calc(var(--bottom-nav-h) + var(--safe-bottom) + 16px);
}

/* ---- Header ---- */
.dashboard__header {
  background: linear-gradient(150deg, #C8102E 0%, #9B0B22 100%);
  padding: calc(48px + var(--safe-top)) var(--s-lg) 64px;
  position: relative;
  overflow: visible;
}
@media (max-height: 540px) {
  .dashboard__header {
    padding-top: calc(12px + var(--safe-top));
    padding-bottom: 40px;
  }
}
.dashboard__header::before {
  content: '';
  position: absolute;
  top: -60px; right: -40px;
  width: 220px; height: 220px;
  border-radius: 50%;
  background: rgba(255,255,255,.06);
  pointer-events: none;
}
.dashboard__header::after {
  content: '';
  position: absolute;
  bottom: -40px; left: 0; right: 0;
  height: 80px;
  background: var(--cptm-cinza-fundo);
  border-radius: 50% 50% 0 0 / 100% 100% 0 0;
}

.dashboard__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--s-lg);
  position: relative;
  z-index: 1;
}
.dashboard__logo { display: flex; align-items: center; gap: 8px; }
.dashboard__logo-text {
  font-size: 1.2rem;
  font-weight: 900;
  color: white;
  letter-spacing: 0.1em;
}
.dashboard__actions { display: flex; gap: var(--s-sm); align-items: center; }
.dashboard__actions { transform: translateY(-12px); }

.notif-menu {
  position: relative;
  z-index: 10000;
}

.profile-menu {
  position: relative;
  z-index: 10000;
}

/* Icon buttons in header */
.btn-circle {
  width: 44px; height: 44px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background-color var(--t-fast);
  -webkit-tap-highlight-color: transparent;
}
.btn-circle--ghost {
  background: rgba(255,255,255,.18);
}
.btn-circle--ghost:hover { background: rgba(255,255,255,.28); }
.btn-circle svg { width: 22px; height: 22px; }

.notif-dot {
  position: absolute;
  top: 4px; right: 4px;
  width: 18px; height: 18px;
  background: #FF8F00;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
  color: white;
  display: flex; align-items: center; justify-content: center;
  line-height: 1;
}

.notif-popover {
  position: absolute;
  right: 0;
  top: 52px;
  width: min(320px, calc(100vw - 24px));
  max-height: 320px;
  overflow: auto;
  overscroll-behavior: contain;
  background: white;
  border: 1px solid #e7e8ec;
  border-radius: 12px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
  padding: 10px;
  z-index: 10001;
}

.notif-popover__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f1f5;
  color: var(--cptm-cinza-escuro);
}

.notif-popover__clear {
  border: none;
  background: transparent;
  color: var(--cptm-vermelho);
  font-size: var(--txt-xs);
  font-weight: 700;
  cursor: pointer;
  min-height: auto;
  width: auto;
  padding: 0;
}

.notif-popover__empty {
  color: var(--cptm-cinza-claro);
  font-size: var(--txt-sm);
  padding: 10px 4px;
}

.notif-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.notif-item {
  border: 1px solid #eceef3;
  border-radius: 10px;
  padding: 8px 10px;
  background: #fcfcfd;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.notif-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.notif-item--success { border-left: 4px solid #2e7d32; }
.notif-item--warning { border-left: 4px solid #f57f17; }
.notif-item--error { border-left: 4px solid #c62828; }
.notif-item--info { border-left: 4px solid #1565c0; }

.notif-item__title {
  margin: 0;
  font-size: var(--txt-sm);
  font-weight: 800;
  color: var(--cptm-cinza-escuro);
}

.notif-item__message {
  margin: 3px 0 0;
  font-size: var(--txt-xs);
  color: var(--cptm-cinza-medio);
  line-height: 1.4;
}

.notif-item__time {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: var(--cptm-cinza-claro);
}

.profile-popover {
  position: absolute;
  right: 0;
  top: 52px;
  width: min(290px, calc(100vw - 24px));
  overflow: hidden;
  overscroll-behavior: contain;
  background: white;
  border: 1px solid #e7e8ec;
  border-radius: 12px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
  padding: 12px;
  z-index: 10001;
}

.profile-popover__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f1f5;
}

.profile-popover__name {
  margin: 0;
  font-size: var(--txt-sm);
  font-weight: 800;
  color: var(--cptm-cinza-escuro);
}

.profile-popover__role {
  margin: 3px 0 0;
  font-size: var(--txt-xs);
  color: var(--cptm-cinza-medio);
}

.profile-popover__initials {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f5f6f8;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--txt-xs);
  font-weight: 900;
  color: var(--cptm-cinza-medio);
  text-transform: uppercase;
  flex-shrink: 0;
}

.profile-popover__contact {
  padding: 10px 0;
}

.profile-popover__label {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--cptm-cinza-claro);
}

.profile-popover__email {
  margin: 4px 0 0;
  font-size: var(--txt-sm);
  color: var(--cptm-cinza-escuro);
  word-break: break-word;
}

.profile-popover__logout {
  width: 100%;
  border: 1px solid #c8102e;
  border-radius: 10px;
  background: #fff5f7;
  color: #c8102e;
  font-size: var(--txt-sm);
  font-weight: 800;
  padding: 10px 12px;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.12s ease;
}

.profile-popover__logout:hover {
  background: #ffe9ee;
}

.profile-popover__logout:active {
  transform: scale(0.99);
}

.avatar-initials {
  font-size: 0.875rem;
  font-weight: 900;
  color: white;
  text-transform: uppercase;
}

/* Greeting */
.dashboard__greeting { position: relative; z-index: 1; }
.dashboard__greeting-text {
  font-size: var(--txt-sm);
  color: rgba(255,255,255,.75);
  margin-bottom: 2px;
}
.dashboard__user-name {
  font-size: clamp(1.5rem, 6vw, var(--txt-2xl));
  font-weight: 800;
  color: white;
  line-height: 1.2;
}
.dashboard__user-role {
  font-size: var(--txt-sm);
  color: rgba(255,255,255,.65);
  margin-top: 4px;
}

/* ---- Content ---- */
.dashboard__content {
  flex: 1;
  padding: 0 var(--s-md);
  margin-top: 2px;
  position: relative;
  z-index: 1;
}

/* Summary cards */
.dashboard__summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--s-sm);
  margin-bottom: var(--s-lg);
}
.card-resumo {
  background: var(--cptm-branco);
  border-radius: var(--r-lg);
  padding: var(--s-md) var(--s-sm);
  text-align: center;
  box-shadow: var(--shadow-sm);
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.card-resumo__num {
  font-size: clamp(1.5rem, 6vw, var(--txt-2xl));
  font-weight: 900; line-height: 1;
}
.card-resumo__label {
  font-size: clamp(0.6rem, 2vw, 0.68rem);
  color: var(--cptm-cinza-claro);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1.3;
}
.card-resumo--total    .card-resumo__num { color: var(--cptm-cinza-escuro); }
.card-resumo--enviadas .card-resumo__num { color: var(--status-enviada); }
.card-resumo--rascunhos .card-resumo__num { color: var(--status-rascunho); }
.card-resumo--pendentes .card-resumo__num { color: var(--cptm-cinza-medio, #9e9e9e); }
.card-resumo--pendentes-ativo .card-resumo__num { color: #f59e0b; }

.dashboard__sync-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-md);
  background: var(--cptm-branco);
  border: 1px solid var(--cptm-cinza-borda);
  border-radius: var(--r-lg);
  padding: var(--s-md);
  margin-bottom: var(--s-lg);
}

.dashboard__sync-title {
  font-size: var(--txt-sm);
  font-weight: 800;
  color: var(--cptm-cinza-escuro);
  margin: 0 0 2px;
}

.dashboard__sync-sub {
  font-size: var(--txt-xs);
  color: var(--cptm-cinza-claro);
  margin: 0;
}

.dashboard__sync-btn {
  min-width: 136px;
  height: 42px;
  border: none;
  border-radius: var(--r-md);
  background: var(--cptm-vermelho);
  color: white;
  font-size: var(--txt-sm);
  font-weight: 700;
}

.dashboard__sync-btn:disabled {
  opacity: .45;
}

/* New inspection button */
.dashboard__new-btn {
  background: linear-gradient(135deg, var(--cptm-vermelho) 0%, var(--cptm-vermelho-escuro) 100%);
  border: none;
  border-radius: var(--r-xl);
  padding: var(--s-lg) var(--s-xl);
  width: 100%;
  display: flex; align-items: center; justify-content: center; gap: var(--s-md);
  cursor: pointer;
  box-shadow: var(--shadow-fab);
  transition: transform var(--t-fast), box-shadow var(--t-fast);
  margin-bottom: var(--s-lg);
  -webkit-tap-highlight-color: transparent;
  animation: pulse 2.5s ease-in-out infinite;
}
.dashboard__new-btn:active { transform: scale(0.97); animation: none; }
.dashboard__new-btn:hover  { box-shadow: 0 8px 28px rgba(200,16,46,.50); }

.new-btn__icon {
  width: 52px; height: 52px;
  background: rgba(255,255,255,.20);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.new-btn__icon svg { width: 28px; height: 28px; }
.new-btn__text { display: flex; flex-direction: column; align-items: flex-start; }
.new-btn__title {
  font-size: clamp(1rem, 4vw, var(--txt-lg));
  font-weight: 800; color: white; line-height: 1.2;
}
.new-btn__sub { font-size: var(--txt-xs); color: rgba(255,255,255,.75); }

/* Section header */
.section-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: var(--s-md);
}
.section-title { font-size: var(--txt-base); font-weight: 700; color: var(--cptm-cinza-escuro); }
.section-link {
  font-size: var(--txt-sm); color: var(--cptm-vermelho); font-weight: 600;
  background: none; border: none; cursor: pointer; min-height: auto; width: auto; padding: 0;
}

/* Inspection list */
.inspection-list { display: flex; flex-direction: column; gap: var(--s-sm); }

.card-inspecao-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-inspecao {
  background: var(--cptm-branco);
  border-radius: var(--r-lg);
  padding: var(--s-md);
  box-shadow: var(--shadow-sm);
  display: flex; align-items: flex-start; gap: var(--s-md);
  cursor: pointer;
  transition: transform var(--t-fast), box-shadow var(--t-fast);
  border-left: 4px solid transparent;
  border: none;
  width: 100%;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
}
.card-inspecao:active  { transform: scale(0.98); }
.card-inspecao:hover   { box-shadow: var(--shadow-md); }
.card-inspecao--rascunho { border-left: 4px solid var(--status-rascunho); }
.card-inspecao--pendente_sync { border-left: 4px solid #f57f17; }
.card-inspecao--sincronizando { border-left: 4px solid #1565c0; }
.card-inspecao--sincronizado  { border-left: 4px solid var(--status-enviada); }
.card-inspecao--erro_sync { border-left: 4px solid #c62828; }

.card-ins__icon {
  width: 44px; height: 44px;
  border-radius: var(--r-md);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.card-ins__icon svg { width: 24px; height: 24px; }

.icone-oleo     { background: #FFF3E0; }
.icone-oleo svg { fill: #E65100; }
.icone-descarte      { background: #F3E5F5; }
.icone-descarte svg  { fill: #6A1B9A; }
.icone-fauna     { background: #E8F5E9; }
.icone-fauna svg { fill: #2E7D32; }
.icone-erosao     { background: #FFF8E1; }
.icone-erosao svg { fill: #F57F17; }

.card-ins__body { flex: 1; min-width: 0; }
.card-ins__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-ins__title {
  font-size: var(--txt-base);
  font-weight: 700;
  color: var(--cptm-cinza-escuro);
  margin-bottom: 3px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.card-ins__owner {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #eef2ff;
  border: 1px solid #dbe3ff;
  color: #1e40af;
  font-size: 0.68rem;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  flex-shrink: 0;
}

.card-ins__author {
  margin: 0 0 4px;
  font-size: 0.74rem;
  color: var(--cptm-cinza-medio);
}

.card-ins__local {
  font-size: var(--txt-sm);
  color: var(--cptm-cinza-claro);
  margin-bottom: 6px;
  display: flex; align-items: center; gap: 4px;
}

.card-ins__error {
  margin-top: 6px;
  font-size: var(--txt-xs);
  color: #c62828;
}

.card-ins__sync-hint {
  margin-top: 4px;
  font-size: 0.74rem;
  color: #7a6b2f;
}

.card-ins__retry {
  align-self: flex-end;
  border: 1px solid #c62828;
  border-radius: var(--r-md);
  background: white;
  color: #c62828;
  font-size: var(--txt-xs);
  font-weight: 700;
  padding: 10px 12px;
}
.card-ins__local svg { fill: var(--cptm-cinza-claro); flex-shrink: 0; }
.card-ins__footer {
  display: flex; align-items: center; justify-content: space-between; gap: var(--s-sm);
}
.card-ins__date { font-size: var(--txt-xs); color: var(--cptm-cinza-claro); }

.card-ins__arrow {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: var(--cptm-cinza-fundo);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: var(--cptm-cinza-claro);
}

/* Empty state */
.lista-vazia {
  text-align: center;
  padding: var(--s-2xl) var(--s-lg);
  color: var(--cptm-cinza-claro);
}
.lista-vazia svg { width: 64px; height: 64px; fill: var(--cptm-cinza-borda); margin: 0 auto var(--s-md); }
.lista-vazia p   { font-size: var(--txt-sm); }

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
  display: flex;
  flex-direction: column;
  gap: var(--s-sm);
  padding: var(--s-md);
  border-top: 1px solid var(--cptm-cinza-borda);
}

.btn-acao {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: var(--r-md);
  padding: 14px var(--s-md);
  font-size: var(--txt-sm);
  font-weight: 700;
  cursor: pointer;
  transition: opacity var(--t-fast), transform var(--t-fast);
  -webkit-tap-highlight-color: transparent;
}

.btn-acao:active { opacity: 0.8; transform: scale(0.98); }

.btn-acao:disabled { opacity: .55; }

.btn-acao--sincronizar {
  background: var(--cptm-vermelho);
  color: white;
}

.btn-acao--editar {
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

<template>
  <main class="conta" role="main">
    <header class="conta__header">
      <p class="conta__eyebrow">AREA DA CONTA</p>
      <h1 class="conta__title">Minha Conta</h1>
      <p class="conta__subtitle">Gerencie suas informações de acesso e configurações do aplicativo.</p>
    </header>

    <section class="conta__card conta__card--profile" aria-label="Perfil do usuário">
      <div class="conta__avatar">{{ user?.initials || 'US' }}</div>
      <div class="conta__profile-text">
        <h2>{{ user?.name || 'Usuário' }}</h2>
        <p>{{ user?.email || 'sem-email' }}</p>
        <span class="conta__role">{{ user?.role || 'Colaborador' }}</span>
      </div>
    </section>

    <section class="conta__card" aria-label="Resumo de atividade">
      <h3>Resumo de atividade</h3>
      <div class="conta__stats">
        <div class="stat-box">
          <strong>{{ userTotal }}</strong>
          <span>Inspeções</span>
        </div>
        <div class="stat-box">
          <strong>{{ userSincronizadas }}</strong>
          <span>Sincronizadas</span>
        </div>
        <div class="stat-box">
          <strong>{{ userPendentes }}</strong>
          <span>Pendentes</span>
        </div>
      </div>
    </section>

    <section class="conta__card" aria-label="Preferências e suporte">
      <h3>Preferências e suporte</h3>
      <ul class="conta__list">
        <li>
          <span>Notificações da fila local</span>
          <strong>{{ userPendentes > 0 ? 'Ativas' : 'Normais' }}</strong>
        </li>
        <li>
          <span>Status da conectividade</span>
          <strong>{{ store.browserOnline ? 'Online' : 'Offline' }}</strong>
        </li>
        <li>
          <span>Canal de suporte</span>
          <strong>TI CPTM</strong>
        </li>
      </ul>
    </section>

    <section class="conta__card" aria-label="Segurança">
      <h3>Segurança</h3>
      <p class="conta__text">Sua autenticação é validada com credencial no banco, e a senha é armazenada com hash seguro.</p>
      <button class="conta__logout" @click="handleLogout">Sair da conta</button>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useInspecoesStore } from '@/stores/inspecoes'

const router = useRouter()
const auth = useAuthStore()
const store = useInspecoesStore()

const user = computed(() => auth.currentUser?.value ?? auth.currentUser)
const userRecords = computed(() => {
  const funcionarioId = user.value?.id
  const funcionarioNome = user.value?.name

  if (!funcionarioId) return []
  return store.porFuncionario(funcionarioId, funcionarioNome)
})

const userTotal = computed(() => userRecords.value.length)
const userSincronizadas = computed(() => userRecords.value.filter((item) => item.syncStatus === 'sincronizado').length)
const userPendentes = computed(() => userRecords.value.filter((item) => ['pendente_sync', 'erro_sync', 'sincronizando'].includes(item.syncStatus)).length)

onMounted(async () => {
  await store.initialize()
})

function handleLogout() {
  auth.logout()
  router.replace('/login')
}
</script>

<style scoped>
.conta {
  min-height: 100dvh;
  background: var(--cptm-cinza-fundo);
  padding: calc(var(--s-lg) + var(--safe-top)) var(--s-md) calc(var(--s-2xl) + var(--safe-bottom));
  display: flex;
  flex-direction: column;
  gap: var(--s-md);
}

.conta__header {
  background: linear-gradient(160deg, #C8102E 0%, #9B0B22 100%);
  border-radius: var(--r-lg);
  padding: var(--s-lg);
  color: white;
  box-shadow: var(--shadow-md);
}

.conta__eyebrow {
  font-size: var(--txt-xs);
  letter-spacing: 0.08em;
  opacity: 0.8;
  margin-bottom: 4px;
}

.conta__title {
  font-size: var(--txt-xl);
  font-weight: 800;
}

.conta__subtitle {
  margin-top: 4px;
  font-size: var(--txt-sm);
  opacity: 0.92;
}

.conta__card {
  background: var(--cptm-branco);
  border: 1.5px solid var(--cptm-cinza-borda);
  border-radius: var(--r-lg);
  padding: var(--s-md);
  box-shadow: var(--shadow-sm);
}

.conta__card h3 {
  font-size: var(--txt-sm);
  font-weight: 800;
  color: var(--cptm-cinza-escuro);
  margin-bottom: var(--s-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.conta__card--profile {
  display: flex;
  align-items: center;
  gap: var(--s-md);
}

.conta__avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #C8102E, #E8394F);
  color: white;
  font-size: var(--txt-md);
  font-weight: 800;
}

.conta__profile-text h2 {
  font-size: var(--txt-md);
  font-weight: 800;
  color: var(--cptm-cinza-escuro);
}

.conta__profile-text p {
  font-size: var(--txt-sm);
  color: var(--cptm-cinza-medio);
}

.conta__role {
  display: inline-block;
  margin-top: 6px;
  padding: 4px 10px;
  border-radius: var(--r-full);
  background: #ffe5ea;
  color: var(--cptm-vermelho);
  font-size: var(--txt-xs);
  font-weight: 700;
}

.conta__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--s-sm);
}

.stat-box {
  border-radius: var(--r-md);
  background: var(--cptm-cinza-fundo);
  border: 1px solid var(--cptm-cinza-borda);
  padding: 10px 8px;
  text-align: center;
}

.stat-box strong {
  display: block;
  font-size: var(--txt-lg);
  color: var(--cptm-vermelho);
  line-height: 1;
  font-weight: 800;
}

.stat-box span {
  display: block;
  margin-top: 4px;
  font-size: var(--txt-xs);
  color: var(--cptm-cinza-claro);
}

.conta__list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--s-sm);
}

.conta__list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--s-sm);
  font-size: var(--txt-sm);
  color: var(--cptm-cinza-medio);
  border: 1px solid var(--cptm-cinza-borda);
  border-radius: var(--r-md);
  padding: 10px 12px;
}

.conta__list li strong {
  color: var(--cptm-cinza-escuro);
  font-weight: 700;
}

.conta__text {
  color: var(--cptm-cinza-medio);
  font-size: var(--txt-sm);
  line-height: 1.5;
  margin-bottom: var(--s-md);
}

.conta__logout {
  width: 100%;
  border: none;
  border-radius: var(--r-md);
  padding: 14px var(--s-md);
  background: var(--cptm-vermelho);
  color: white;
  font-size: var(--txt-sm);
  font-weight: 700;
  cursor: pointer;
}

.conta__logout:active {
  transform: scale(0.98);
}

@media (min-width: 600px) {
  .conta {
    max-width: 600px;
    margin: 0 auto;
  }
}
</style>

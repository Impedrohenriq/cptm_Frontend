import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { autenticarUsuario, registrarUsuario } from '@/services/api'

const AUTH_KEY = 'cptm_auth_ok'
const USER_KEY = 'cptm_user'
const ONBOARDING_KEY = 'cptm_onboarding_done'
const TOKEN_KEY = 'cptm_auth_token'
const LOGOUT_NOTICE_KEY = 'cptm_logout_notice'

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function initialsFromName(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'US'
}

function normalizeUser(rawUser) {
  if (!rawUser || typeof rawUser !== 'object') return null

  const id = String(rawUser.id || '').trim()
  const name = String(rawUser.name || '').trim()
  const email = String(rawUser.email || '').trim().toLowerCase()
  const isGestor = rawUser.isGestor === true

  // Aceita apenas estrutura vinda do backend real (id UUID + e-mail válido).
  if (!isUuid(id) || !name || !email.includes('@')) return null

  return {
    id,
    name,
    email,
    role: String(rawUser.role || (isGestor ? 'Gestor Ambiental' : 'Inspetor Ambiental')).trim(),
    line: String(rawUser.line || 'Linha 7 - Rubi').trim(),
    initials: String(rawUser.initials || initialsFromName(name)).trim(),
    isGestor,
  }
}

function readStoredUser() {
  try {
    return normalizeUser(JSON.parse(localStorage.getItem(USER_KEY) || 'null'))
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const storedUser = readStoredUser()
  const hasToken = !!localStorage.getItem(TOKEN_KEY)
  const authenticated = ref(localStorage.getItem(AUTH_KEY) === 'true' && !!storedUser && hasToken)
  const user = ref(storedUser)
  const onboardingDone = ref(localStorage.getItem(ONBOARDING_KEY) === 'true')

  if (!storedUser || !hasToken) {
    localStorage.setItem(AUTH_KEY, 'false')
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(TOKEN_KEY)
  }

  const isAuthenticated = computed(() => authenticated.value)
  const currentUser = computed(() => user.value)
  const isGestor = computed(() => user.value?.isGestor === true)
  const needsOnboarding = computed(() => !onboardingDone.value && !isGestor.value)

  function persistAuth(safeUser, token) {
    authenticated.value = true
    user.value = safeUser
    localStorage.setItem(AUTH_KEY, 'true')
    localStorage.setItem(USER_KEY, JSON.stringify(safeUser))

    if (token && typeof token === 'string') {
      localStorage.setItem(TOKEN_KEY, token)
    }

    localStorage.removeItem(LOGOUT_NOTICE_KEY)
  }

  function setLogoutNotice(reason) {
    if (!reason) return
    localStorage.setItem(LOGOUT_NOTICE_KEY, String(reason))
  }

  function consumeLogoutNotice() {
    const reason = localStorage.getItem(LOGOUT_NOTICE_KEY)
    if (!reason) return ''

    localStorage.removeItem(LOGOUT_NOTICE_KEY)

    if (reason === 'session_expired_sync') {
      return 'Sua sessao expirou durante a sincronizacao. Faca login novamente para continuar.'
    }

    return ''
  }

  function mapUser(apiUser) {
    const isGestor = apiUser.isGestor === true
    const name = String(apiUser.name || '').trim()

    return {
      id: apiUser.id,
      name,
      email: String(apiUser.email || '').trim().toLowerCase(),
      role: String(apiUser.role || (isGestor ? 'Gestor Ambiental' : 'Inspetor Ambiental')).trim(),
      line: String(apiUser.line || 'Linha 7 - Rubi').trim(),
      initials: String(apiUser.initials || initialsFromName(name)).trim(),
      isGestor,
    }
  }

  async function login(credentials) {
    if (!credentials.email || !credentials.password) {
      return { success: false, error: 'Preencha todos os campos.' }
    }

    try {
      const response = await autenticarUsuario({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      })

      if (!response?.success || !response.user) {
        return { success: false, error: response?.error || 'Usuario ou senha invalida.' }
      }

      if (!response?.token) {
        return { success: false, error: 'Sessao invalida: token nao recebido.' }
      }

      persistAuth(mapUser(response.user), response.token)
      return { success: true }
    } catch (error) {
      return { success: false, error: error?.body?.error || error?.body?.Error || error?.message || 'Falha ao autenticar.' }
    }
  }

  async function register({ fullName, email, password, confirmPassword }) {
    if (!fullName || !email || !password || !confirmPassword) {
      return { success: false, error: 'Preencha todos os campos do cadastro.' }
    }

    try {
      const response = await registrarUsuario({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
      })

      if (!response?.success || !response.user) {
        return { success: false, error: response?.error || 'Nao foi possivel criar o usuario.' }
      }

      if (!response?.token) {
        return { success: false, error: 'Sessao invalida: token nao recebido.' }
      }

      persistAuth(mapUser(response.user), response.token)
      return { success: true }
    } catch (error) {
      return { success: false, error: error?.body?.error || error?.body?.Error || error?.message || 'Falha ao criar cadastro.' }
    }
  }

  function logout(options = {}) {
    authenticated.value = false
    user.value = null

    if (options.reason) {
      setLogoutNotice(options.reason)
    }

    localStorage.setItem(AUTH_KEY, 'false')
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(TOKEN_KEY)
  }

  function completeOnboarding() {
    onboardingDone.value = true
    localStorage.setItem(ONBOARDING_KEY, 'true')
  }

  return { isAuthenticated, currentUser, isGestor, needsOnboarding, login, register, logout, completeOnboarding, consumeLogoutNotice }
})

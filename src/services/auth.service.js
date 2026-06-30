// src/services/auth.service.js
// Token NUNCA persiste em localStorage/sessionStorage — apenas memória volátil
import { GOOGLE_CONFIG } from '@/config/google'

let _accessToken = null
let _tokenExpiry = null
let _tokenClient = null
let _userInfo = null

let _currentReject = null

export const AuthService = {
  /**
   * Inicializa o cliente GIS (Google Identity Services).
   * Deve ser chamado UMA vez após o script do Google carregar.
   */
  initialize() {
    return new Promise((resolve, reject) => {
      const deadline = Date.now() + 10_000 // timeout de 10s
      const tryInit = () => {
        if (!window.google?.accounts?.oauth2) {
          if (Date.now() > deadline) {
            reject(new Error('Não foi possível carregar o Google Identity Services. Verifique sua conexão e recarregue a página.'))
            return
          }
          setTimeout(tryInit, 100)
          return
        }
        try {
          _tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CONFIG.clientId,
            scope: GOOGLE_CONFIG.scopes,
            callback: () => {}, // substituído em requestToken()
            error_callback: (err) => {
              if (_currentReject) {
                _currentReject(new Error(err.type || 'Erro na autenticação (popup bloqueado)'))
                _currentReject = null
              }
            }
          })
          resolve()
        } catch (err) {
          reject(err)
        }
      }
      tryInit()
    })
  },

  /**
   * Solicita um token de acesso via popup OAuth.
   * Retorna o access_token ou lança erro.
   */
  requestToken(prompt = '') {
    return new Promise((resolve, reject) => {
      if (!_tokenClient) {
        reject(new Error('AuthService não foi inicializado. Chame initialize() primeiro.'))
        return
      }

      _currentReject = reject

      _tokenClient.callback = (response) => {
        _currentReject = null
        if (response.error) {
          reject(new Error(`OAuth error: ${response.error} — ${response.error_description || ''}`))
          return
        }
        _accessToken = response.access_token
        _tokenExpiry = Date.now() + response.expires_in * 1000
        resolve(_accessToken)
      }

      _tokenClient.requestAccessToken({ prompt })
    })
  },

  /**
   * Retorna o token atual se válido (com margem de 60s), ou null.
   */
  getToken() {
    if (!_accessToken) return null
    if (Date.now() >= _tokenExpiry - 60_000) {
      _accessToken = null
      _tokenExpiry = null
      return null
    }
    return _accessToken
  },

  /**
   * Garante que há um token válido — renova silenciosamente se expirado.
   */
  async ensureToken() {
    const token = this.getToken()
    if (token) return token
    // Tenta renovar sem prompt (silent refresh)
    try {
      return await this.requestToken('')
    } catch {
      // Silent falhou — exige interação do usuário
      return await this.requestToken('consent')
    }
  },

  /**
   * Busca informações do usuário autenticado via userinfo endpoint.
   */
  async fetchUserInfo() {
    if (_userInfo) return _userInfo
    const token = await this.ensureToken()
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Falha ao buscar informações do usuário')
    _userInfo = await res.json()
    return _userInfo
  },

  /**
   * Revoga o token e limpa todo o estado em memória.
   */
  signOut() {
    if (_accessToken && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(_accessToken, () => {})
    }
    _accessToken = null
    _tokenExpiry = null
    _userInfo = null
  },

  isAuthenticated() {
    return this.getToken() !== null
  },
}

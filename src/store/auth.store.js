// src/store/auth.store.js
import { create } from 'zustand'
import { AuthService } from '@/services/auth.service'
import { ConfigService } from '@/services/config.service'

export const useAuthStore = create((set, get) => ({
  // Estado
  status: 'idle', // 'idle' | 'loading' | 'authenticated' | 'error'
  user: null,
  error: null,

  // Ações
  signIn: async (keepLoggedIn = false) => {
    set({ status: 'loading', error: null })
    try {
      await AuthService.initialize()
      await AuthService.requestToken('select_account')
      const userInfo = await AuthService.fetchUserInfo()
      
      if (keepLoggedIn) {
        localStorage.setItem('ufudrive_keep_logged_in', 'true')
      } else {
        localStorage.removeItem('ufudrive_keep_logged_in')
      }

      set({ user: userInfo })

      // Bootstrap do Drive
      const { config, configFileId, appFolderId } = await ConfigService.bootstrap(userInfo)

      const { useConfigStore } = await import('./config.store')
      useConfigStore.getState().setConfig(config, configFileId, appFolderId)

      set({ status: 'authenticated' })
    } catch (err) {
      set({ status: 'error', error: err.message })
    }
  },

  attemptSilentLogin: async () => {
    const keep = localStorage.getItem('ufudrive_keep_logged_in') === 'true'
    if (!keep) return false

    set({ status: 'loading', error: null })
    try {
      await AuthService.initialize()
      // Tenta renovar sem consentimento
      await AuthService.requestToken('')
      const userInfo = await AuthService.fetchUserInfo()
      set({ user: userInfo })

      const { config, configFileId, appFolderId } = await ConfigService.bootstrap(userInfo)
      const { useConfigStore } = await import('./config.store')
      useConfigStore.getState().setConfig(config, configFileId, appFolderId)

      set({ status: 'authenticated' })
      return true
    } catch (err) {
      // Falhou o login silencioso
      set({ status: 'idle', error: null })
      localStorage.removeItem('ufudrive_keep_logged_in')
      return false
    }
  },

  signOut: () => {
    AuthService.signOut()
    localStorage.removeItem('ufudrive_keep_logged_in')
    import('./config.store').then(({ useConfigStore }) => {
      useConfigStore.getState().reset()
    })
    set({ status: 'idle', user: null, error: null })
  },

  clearError: () => set({ error: null }),
}))

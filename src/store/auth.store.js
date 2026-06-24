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
  signIn: async () => {
    set({ status: 'loading', error: null })
    try {
      await AuthService.initialize()
      await AuthService.requestToken('select_account')
      const userInfo = await AuthService.fetchUserInfo()
      set({ user: userInfo })

      // Bootstrap do Drive (pasta raiz + config.json)
      // Feito aqui para centralizar o fluxo de inicialização
      const { config, configFileId, appFolderId } =
        await ConfigService.bootstrap(userInfo)

      // Injeta no config store (importado dinamicamente para evitar circular dep)
      const { useConfigStore } = await import('./config.store')
      useConfigStore.getState().setConfig(config, configFileId, appFolderId)

      set({ status: 'authenticated' })
    } catch (err) {
      set({ status: 'error', error: err.message })
    }
  },

  signOut: () => {
    AuthService.signOut()
    // Limpa config store também
    import('./config.store').then(({ useConfigStore }) => {
      useConfigStore.getState().reset()
    })
    set({ status: 'idle', user: null, error: null })
  },

  clearError: () => set({ error: null }),
}))

// src/store/config.store.js
import { create } from 'zustand'
import { ConfigService } from '@/services/config.service'

export const useConfigStore = create((set, get) => ({
  // Estado
  config: null,
  configFileId: null,
  appFolderId: null,
  saving: false,
  lastSaved: null,

  // Setado pelo auth.store após bootstrap
  setConfig: (config, configFileId, appFolderId) =>
    set({ config, configFileId, appFolderId }),

  // Persiste o config atual no Drive
  saveConfig: async () => {
    const { config, configFileId } = get()
    if (!config || !configFileId) return
    set({ saving: true })
    try {
      const updated = await ConfigService.save(config, configFileId)
      set({ config: updated, saving: false, lastSaved: new Date() })
    } catch (err) {
      set({ saving: false })
      throw err
    }
  },

  // Atualiza uma parte do config e salva
  updateConfig: async (patch) => {
    const { config } = get()
    const updated = { ...config, ...patch }
    set({ config: updated })
    await get().saveConfig()
  },

  // Adiciona uma disciplina ao config
  addSubject: async (subject) => {
    const { config } = get()
    const updated = {
      ...config,
      subjects: [...(config.subjects || []), subject],
    }
    set({ config: updated })
    await get().saveConfig()
  },

  // Atualiza uma disciplina existente
  updateSubject: async (subjectId, patch) => {
    const { config } = get()
    const subjects = config.subjects.map((s) =>
      s.id === subjectId ? { ...s, ...patch } : s
    )
    set({ config: { ...config, subjects } })
    await get().saveConfig()
  },

  reset: () =>
    set({ config: null, configFileId: null, appFolderId: null, saving: false, lastSaved: null }),
}))

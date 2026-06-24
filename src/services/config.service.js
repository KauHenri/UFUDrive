// src/services/config.service.js
import { DriveService } from './drive.service'
import { APP, DEFAULT_MODULES } from '@/config/constants'

/**
 * Gera a estrutura inicial do config.json para um novo usuário.
 */
function buildInitialConfig(userInfo, appFolderId) {
  return {
    version: APP.version,
    metadata: {
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      appFolderId,
      userEmail: userInfo.email,
      userName: userInfo.name,
    },
    academicProfile: {
      institution: 'Universidade Federal de Uberlândia',
      course: '',
      department: 'FEELT',
      currentSemester: '',
      targetGPA: 7.0,
      gradeScale: {
        type: 'decimal',
        min: 0,
        max: 100,
        passingGrade: 60,
      },
    },
    semesters: [],
    subjects: [],
    globalSettings: {
      theme: 'dark',
      language: 'pt-BR',
      defaultModules: DEFAULT_MODULES,
      notifications: {
        deadlineWarningDays: 3,
        enabled: true,
      },
    },
  }
}

export const ConfigService = {
  /**
   * Bootstrap completo:
   * 1. Garante pasta raiz UFUDrive no Drive
   * 2. Busca config.json existente ou cria um novo
   * Retorna { config, configFileId, appFolderId }
   */
  async bootstrap(userInfo) {
    // 1. Pasta raiz
    const appFolderId = await DriveService.ensureAppRootFolder()

    // 2. Busca config existente
    let configFile = await DriveService.findConfigFile(appFolderId)

    if (configFile) {
      const config = await DriveService.readJSON(configFile.id)
      return { config, configFileId: configFile.id, appFolderId }
    }

    // 3. Primeiro acesso — cria config novo
    const initialConfig = buildInitialConfig(userInfo, appFolderId)
    const saved = await DriveService.saveJSON(initialConfig, {
      fileName: APP.configFileName,
      parentId: appFolderId,
    })

    return { config: initialConfig, configFileId: saved.id, appFolderId }
  },

  /**
   * Persiste o estado atual do config no Drive.
   */
  async save(config, configFileId) {
    const updated = {
      ...config,
      metadata: {
        ...config.metadata,
        lastModified: new Date().toISOString(),
      },
    }
    await DriveService.saveJSON(updated, { fileId: configFileId })
    return updated
  },
}

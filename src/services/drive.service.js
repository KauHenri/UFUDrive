// src/services/drive.service.js
import { AuthService } from './auth.service'
import { DRIVE_API } from '@/config/google'
import { APP, DEFAULT_FOLDER_STRUCTURE } from '@/config/constants'

async function apiFetch(path, options = {}, useUploadUrl = false) {
  const token = await AuthService.ensureToken()
  const base = useUploadUrl ? DRIVE_API.uploadUrl : DRIVE_API.baseUrl

  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    let errMsg = `Drive API ${res.status}`
    try {
      const body = await res.json()
      errMsg = body.error?.message || errMsg
    } catch {}
    throw new Error(errMsg)
  }

  // 204 No Content (ex: delete)
  if (res.status === 204) return null
  return res.json()
}

export const DriveService = {
  // ─── Pastas ────────────────────────────────────────────────────────────────

  async createFolder(name, parentId = null) {
    const meta = {
      name,
      mimeType: DRIVE_API.mimeTypes.folder,
      ...(parentId ? { parents: [parentId] } : {}),
    }
    const res = await apiFetch('/files', {
      method: 'POST',
      body: JSON.stringify(meta),
    })
    return res.id
  },

  async findFolder(name, parentId = null) {
    const parentQuery = parentId ? `'${parentId}' in parents and ` : ''
    const query = `${parentQuery}name='${name}' and mimeType='${DRIVE_API.mimeTypes.folder}' and trashed=false`
    const res = await apiFetch(`/files?q=${encodeURIComponent(query)}&fields=files(id,name)`)
    return res.files?.[0] || null
  },

  /**
   * Garante que a pasta raiz do UFUDrive existe no Drive do usuário.
   * Cria se não existir.
   */
  async ensureAppRootFolder() {
    let folder = await this.findFolder(APP.rootFolderName)
    if (!folder) {
      const id = await this.createFolder(APP.rootFolderName)
      return id
    }
    return folder.id
  },

  /**
   * Garante que a pasta do semestre existe dentro da raiz.
   */
  async ensureSemesterFolder(semesterLabel, rootFolderId) {
    let folder = await this.findFolder(semesterLabel, rootFolderId)
    if (!folder) {
      const id = await this.createFolder(semesterLabel, rootFolderId)
      return id
    }
    return folder.id
  },

  /**
   * Cria toda a estrutura de pastas de uma disciplina:
   * Semestre/NomeDaDisciplina/{Anotações, Slides, Atividades, Código, Flashcards}
   *
   * Retorna { rootFolderId, folders: { notes, slides, ... } }
   */
  async createSubjectStructure(semesterFolderId, subjectName) {
    const rootId = await this.createFolder(subjectName, semesterFolderId)

    const ids = await Promise.all(
      DEFAULT_FOLDER_STRUCTURE.map(({ label }) => this.createFolder(label, rootId))
    )

    const folders = Object.fromEntries(
      DEFAULT_FOLDER_STRUCTURE.map(({ key }, i) => [key, ids[i]])
    )

    return { rootFolderId: rootId, folders }
  },

  // ─── Arquivos ──────────────────────────────────────────────────────────────

  async listFiles(parentId, mimeTypeFilter = null) {
    let query = `'${parentId}' in parents and trashed=false`
    if (mimeTypeFilter) query += ` and mimeType='${mimeTypeFilter}'`
    const res = await apiFetch(
      `/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,modifiedTime,thumbnailLink)&orderBy=name`
    )
    return res.files || []
  },

  async readFile(fileId) {
    const token = await AuthService.ensureToken()
    const res = await fetch(`${DRIVE_API.baseUrl}/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`Falha ao ler arquivo: ${res.status}`)
    return res
  },

  async readJSON(fileId) {
    const res = await this.readFile(fileId)
    return res.json()
  },

  /**
   * Salva um arquivo JSON no Drive.
   * Se fileId for fornecido, atualiza (PATCH). Caso contrário, cria (POST).
   */
  async saveJSON(content, { fileId = null, fileName = 'data.json', parentId = null } = {}) {
    const blob = new Blob([JSON.stringify(content, null, 2)], {
      type: DRIVE_API.mimeTypes.json,
    })

    const meta = {
      name: fileName,
      mimeType: DRIVE_API.mimeTypes.json,
      ...(!fileId && parentId ? { parents: [parentId] } : {}),
    }

    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }))
    form.append('file', blob)

    const token = await AuthService.ensureToken()
    const method = fileId ? 'PATCH' : 'POST'
    const url = fileId
      ? `${DRIVE_API.uploadUrl}/files/${fileId}?uploadType=multipart`
      : `${DRIVE_API.uploadUrl}/files?uploadType=multipart`

    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })

    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.error?.message || `Upload falhou: ${res.status}`)
    }
    return res.json()
  },

  /**
   * Busca o config.json na pasta raiz do app.
   */
  async findConfigFile(appFolderId) {
    const query = `'${appFolderId}' in parents and name='${APP.configFileName}' and trashed=false`
    const res = await apiFetch(
      `/files?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime)`
    )
    return res.files?.[0] || null
  },

  /**
   * Gera uma URL temporária para visualizar um arquivo do Drive inline.
   * Válida apenas enquanto o token de acesso for válido.
   */
  async getMediaUrl(fileId) {
    const token = await AuthService.ensureToken()
    // Retorna uma URL autenticada que o browser pode usar em src/href
    return `${DRIVE_API.baseUrl}/files/${fileId}?alt=media&access_token=${token}`
  },

  async deleteFile(fileId) {
    await apiFetch(`/files/${fileId}`, { method: 'DELETE' })
  },
}

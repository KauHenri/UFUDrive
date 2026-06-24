// src/config/google.js
export const GOOGLE_CONFIG = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  scopes: [
    'https://www.googleapis.com/auth/drive.file',
    'openid',
    'email',
    'profile',
  ].join(' '),
}

export const DRIVE_API = {
  baseUrl: 'https://www.googleapis.com/drive/v3',
  uploadUrl: 'https://www.googleapis.com/upload/drive/v3',
  mimeTypes: {
    folder: 'application/vnd.google-apps.folder',
    json: 'application/json',
    markdown: 'text/markdown',
  },
}

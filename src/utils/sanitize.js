// src/utils/sanitize.js
import DOMPurify from 'dompurify'

/** Remove toda tag HTML — para campos de texto puro */
export const sanitizeText = (input) =>
  DOMPurify.sanitize(String(input ?? ''), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })

/** Sanitiza HTML gerado (ex: preview Markdown) — permite subset seguro */
export const sanitizeHTML = (html) =>
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'strong', 'em', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'code', 'pre', 'blockquote', 'a', 'br',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img', 'span', 'div', 'hr',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: true,
  })

/** Valida URL para uso em iFrames — rejeita javascript: e data: */
export const sanitizeFrameURL = (url) => {
  try {
    const parsed = new URL(url)
    const allowed = ['http:', 'https:']
    if (!allowed.includes(parsed.protocol)) return null
    return url
  } catch {
    return null
  }
}

/** Remove caracteres que poderiam quebrar queries na Drive API */
export const sanitizeFileName = (name) =>
  name.replace(/[\\/:*?"<>|]/g, '_').trim().slice(0, 200)

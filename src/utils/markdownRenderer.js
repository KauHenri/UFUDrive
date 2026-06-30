// src/utils/markdownRenderer.js
// Renderiza Markdown com suporte a LaTeX inline ($...$) e bloco ($$...$$)
import { marked } from 'marked'
import katex from 'katex'
import DOMPurify from 'dompurify'

// Configura o marked para saída segura
marked.setOptions({ breaks: true, gfm: true })

/**
 * Processa LaTeX ANTES do Markdown para evitar conflitos com o parser.
 * Substitui blocos LaTeX por placeholders, renderiza o MD, depois reinsere.
 */
export function renderMarkdownWithLatex(raw) {
  if (!raw) return ''

  const blocks = []

  // 1. Extrai blocos $$...$$ (display)
  let processed = raw.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
    const idx = blocks.length
    try {
      blocks.push(katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false }))
    } catch {
      blocks.push(`<span class="katex-error">$$${tex}$$</span>`)
    }
    return `%%KATEX_BLOCK_${idx}%%`
  })

  // 2. Extrai inline $...$
  processed = processed.replace(/\$([^$\n]+?)\$/g, (_, tex) => {
    const idx = blocks.length
    try {
      blocks.push(katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false }))
    } catch {
      blocks.push(`<span class="katex-error">$${tex}$</span>`)
    }
    return `%%KATEX_BLOCK_${idx}%%`
  })

  // 3. Renderiza Markdown
  let html = marked.parse(processed)

  // 4. Reinsere blocos LaTeX
  html = html.replace(/%%KATEX_BLOCK_(\d+)%%/g, (_, i) => blocks[parseInt(i)] || '')

  // 5. Sanitiza (permite elementos KaTeX + padrão)
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p','strong','em','u','s','ul','ol','li','h1','h2','h3','h4','h5','h6',
      'code','pre','blockquote','a','br','table','thead','tbody','tr','th','td',
      'img','span','div','hr','math','annotation','semantics','mrow','mi','mn',
      'mo','msup','msub','mfrac','msqrt','mover','munder','mtext','svg','path',
      'line','rect','circle','use','g','defs',
    ],
    ALLOWED_ATTR: [
      'href','src','alt','class','style','target','rel','id',
      'viewBox','xmlns','width','height','d','fill','stroke',
      'stroke-width','x','y','x1','y1','x2','y2','cx','cy','r',
      'aria-hidden','focusable','data-*',
    ],
    ALLOW_DATA_ATTR: true,
    FORCE_BODY: true,
  })
}

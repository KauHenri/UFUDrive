// src/config/constants.js
export const APP = {
  name: 'UFUDrive',
  version: '1.0.0',
  rootFolderName: 'UFUDrive',
  configFileName: 'config.json',
}

export const DEFAULT_FOLDER_STRUCTURE = [
  { key: 'notes',       label: 'Anotações'  },
  { key: 'slides',      label: 'Slides'     },
  { key: 'assignments', label: 'Atividades' },
  { key: 'code',        label: 'Código'     },
  { key: 'flashcards',  label: 'Flashcards' },
]

export const ALL_MODULES = [
  { key: 'notes',           label: 'Editor de Anotações', icon: '📝', description: 'Markdown + LaTeX'          },
  { key: 'media',           label: 'Visualizador de Mídia', icon: '📄', description: 'PDFs e imagens do Drive' },
  { key: 'flashcards',      label: 'Flashcards',           icon: '🃏', description: 'Repetição espaçada SM-2'  },
  { key: 'codeEditor',      label: 'Editor de Código',     icon: '💻', description: 'Monaco Editor embutido'   },
  { key: 'kanban',          label: 'Quadro Kanban',        icon: '📋', description: 'Gestão de tarefas'        },
  { key: 'gradeCalculator', label: 'Calculadora de Notas', icon: '📊', description: 'Predição de média'        },
  { key: 'externalFrame',   label: 'Janela Externa',       icon: '🌐', description: 'iFrame para URLs externas'},
]

export const DEFAULT_MODULES = {
  notes: true,
  media: true,
  flashcards: false,
  codeEditor: false,
  kanban: false,
  gradeCalculator: true,
  externalFrame: false,
}

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
  { key: 'notes',           label: 'Editor de Anotações',  icon: '📝', description: 'Markdown + LaTeX'               },
  { key: 'media',           label: 'Visualizador de Mídia', icon: '📄', description: 'PDFs e imagens do Drive'        },
  { key: 'gradeCalculator', label: 'Calculadora de Notas', icon: '📊', description: 'Predição de média'              },
  { key: 'attendance',      label: 'Controle de Faltas',   icon: '📅', description: 'Frequência com alerta de limite' },
  { key: 'kanban',          label: 'Quadro Kanban',        icon: '📋', description: 'Gestão de tarefas'              },
  { key: 'flashcards',      label: 'Flashcards',           icon: '🃏', description: 'Repetição espaçada SM-2'        },
  { key: 'codeEditor',      label: 'Editor de Código',     icon: '💻', description: 'Editor com syntax highlight'    },
  { key: 'quickLinks',      label: 'Links Rápidos',        icon: '🔗', description: 'Moodle, professor, grupos'       },
]

export const DEFAULT_MODULES = {
  notes: true,
  media: true,
  gradeCalculator: true,
  attendance: true,
  kanban: false,
  flashcards: false,
  codeEditor: false,
  quickLinks: false,
}

// Dias da semana
export const WEEK_DAYS = [
  { id: 'MON', label: 'Seg' },
  { id: 'TUE', label: 'Ter' },
  { id: 'WED', label: 'Qua' },
  { id: 'THU', label: 'Qui' },
  { id: 'FRI', label: 'Sex' },
  { id: 'SAT', label: 'Sáb' },
]

// Horários padrão de aula (formato HH:MM)
export const TIME_SLOTS = [
  '07:00','07:50','08:00','08:50','09:00','09:50',
  '10:00','10:50','11:00','11:50',
  '13:00','13:50','14:00','14:50','15:00','15:50',
  '16:00','16:50','17:00','17:50',
  '18:00','18:50','19:00','19:50','20:00','20:50','21:00','21:50',
]

// src/App.jsx
import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { SubjectsPage } from '@/pages/SubjectsPage'
import { NewSubjectPage } from '@/pages/NewSubjectPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SubjectPage } from '@/pages/SubjectPage'
import { GradeCalculator } from '@/modules/grade-calculator/GradeCalculator'
import { KanbanBoard } from '@/modules/kanban/KanbanBoard'
import { ModulePlaceholder } from '@/modules/ModulePlaceholder'
import { EditSubjectPage } from '@/pages/EditSubjectPage'
import { NotesEditor } from '@/modules/notes/NotesEditor'
import { MediaViewer } from '@/modules/media/MediaViewer'
import { FlashcardsModule } from '@/modules/flashcards/FlashcardsModule'
const CodeEditorModule = lazy(() =>
  import('@/modules/code-editor/CodeEditorModule').then((m) => ({ default: m.CodeEditorModule }))
)


export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="subjects" element={<SubjectsPage />} />
            <Route path="subjects/new" element={<NewSubjectPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="subjects/:id/edit" element={<EditSubjectPage />} />

            {/* ── Disciplina com abas ──────────────────────────────── */}
            <Route path="subjects/:id" element={<SubjectPage />}>
              <Route path="notes" element={<NotesEditor />} />
              <Route path="media" element={<MediaViewer />} />
              <Route path="grades" element={<GradeCalculator />} />
              <Route path="kanban" element={<KanbanBoard />} />
              <Route path="flashcards" element={<FlashcardsModule />} />
              <Route
                path="code"
                element={
                  <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}>
                    <CodeEditorModule />
                  </Suspense>
                }
              />
              <Route
                path="external"
                element={
                  <ModulePlaceholder
                    icon="🌐"
                    title="Janela Externa"
                    description="Abra qualquer URL em um iFrame seguro dentro da disciplina."
                    sprint="Sprint 5"
                  />
                }
              />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  )
}

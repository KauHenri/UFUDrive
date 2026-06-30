// src/App.jsx
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

            {/* ── Disciplina com abas ──────────────────────────────── */}
            <Route path="subjects/:id" element={<SubjectPage />}>
              <Route
                path="notes"
                element={
                  <ModulePlaceholder
                    icon="📝"
                    title="Editor de Anotações"
                    description="Editor Markdown + LaTeX com sincronização automática no Drive."
                    sprint="Sprint 3"
                  />
                }
              />
              <Route
                path="media"
                element={
                  <ModulePlaceholder
                    icon="📄"
                    title="Visualizador de Slides"
                    description="Visualize PDFs e imagens diretamente do Drive sem precisar baixar."
                    sprint="Sprint 3"
                  />
                }
              />
              <Route path="grades" element={<GradeCalculator />} />
              <Route path="kanban" element={<KanbanBoard />} />
              <Route
                path="flashcards"
                element={
                  <ModulePlaceholder
                    icon="🃏"
                    title="Flashcards"
                    description="Revisão com repetição espaçada usando o algoritmo SM-2."
                    sprint="Sprint 4"
                  />
                }
              />
              <Route
                path="code"
                element={
                  <ModulePlaceholder
                    icon="💻"
                    title="Editor de Código"
                    description="Monaco Editor com suporte a Python, JavaScript, Verilog e mais."
                    sprint="Sprint 4"
                  />
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

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'

import { Students } from '@/pages/Students'
import { StudentDetail } from '@/pages/StudentDetail'
import { SmsTemplates } from '@/pages/messages/SmsTemplates'
import { SmsLogs } from '@/pages/messages/SmsLogs'
import { DocTemplates } from '@/pages/documents/DocTemplates'
import { DocGenerate } from '@/pages/documents/DocGenerate'
import { Journals } from '@/pages/Journals'
import { Settings } from '@/pages/Settings'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="students/:id" element={<StudentDetail />} />
            <Route path="messages/templates" element={<SmsTemplates />} />
            <Route path="messages/logs" element={<SmsLogs />} />
            <Route path="documents/templates" element={<DocTemplates />} />
            <Route path="documents/generate" element={<DocGenerate />} />
            <Route path="journals" element={<Journals />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout/Layout'
import LoadingSpinner from './components/UI/LoadingSpinner'

// Lazy loading des pages pour optimiser les performances
const Login = React.lazy(() => import('./pages/Auth/Login'))
const Dashboard = React.lazy(() => import('./pages/Dashboard/Dashboard'))
const Students = React.lazy(() => import('./pages/Students/Students'))
const StudentDetail = React.lazy(() => import('./pages/Students/StudentDetail'))
const Grades = React.lazy(() => import('./pages/Grades/Grades'))
const GradeDetail = React.lazy(() => import('./pages/Grades/GradeDetail'))
const Bulletin = React.lazy(() => import('./pages/Grades/Bulletin'))
const Absences = React.lazy(() => import('./pages/Absences/Absences'))
const AbsenceDetail = React.lazy(() => import('./pages/Absences/AbsenceDetail'))
const Messages = React.lazy(() => import('./pages/Messages/Messages'))
const MessageDetail = React.lazy(() => import('./pages/Messages/MessageDetail'))
const NewMessage = React.lazy(() => import('./pages/Messages/NewMessage'))
const Notifications = React.lazy(() => import('./pages/Notifications/Notifications'))
const Profile = React.lazy(() => import('./pages/Profile/Profile'))
const NotFound = React.lazy(() => import('./pages/NotFound/NotFound'))

// Composant de protection des routes
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

// Composant de redirection pour les utilisateurs connectés
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Route publique - Login */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          
          {/* Routes protégées */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Redirection par défaut vers le dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Dashboard */}
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Gestion des élèves */}
            <Route path="students" element={<Students />} />
            <Route path="students/:studentId" element={<StudentDetail />} />
            
            {/* Notes et bulletins */}
            <Route path="grades" element={<Grades />} />
            <Route path="grades/:studentId" element={<GradeDetail />} />
            <Route path="grades/:studentId/bulletin/:trimestre" element={<Bulletin />} />
            
            {/* Absences */}
            <Route path="absences" element={<Absences />} />
            <Route path="absences/:studentId" element={<AbsenceDetail />} />
            
            {/* Messages */}
            <Route path="messages" element={<Messages />} />
            <Route path="messages/:messageId" element={<MessageDetail />} />
            <Route path="messages/new" element={<NewMessage />} />
            
            {/* Notifications */}
            <Route path="notifications" element={<Notifications />} />
            
            {/* Profil */}
            <Route path="profile" element={<Profile />} />
          </Route>
          
          {/* Page 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default App
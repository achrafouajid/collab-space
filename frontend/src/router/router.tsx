import { Routes, Route, Navigate } from 'react-router-dom'
import SimpleDashboard from '../components/dashboard/SimpleDashboard'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import UsersPage from '../pages/User/UsersPage'

// Simple Home Page
const HomePage = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to PERN Stack</h1>
      <p className="text-lg text-gray-600 mb-8">
        A modern full-stack application with PostgreSQL, Express.js, React, and Node.js
      </p>
      <div className="space-y-4">
        <div className="space-x-4">
          <a 
            href="/login" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            Login
          </a>
          <a 
            href="/register" 
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            Register
          </a>
        </div>
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3">Or preview the dashboard:</p>
          <a 
            href="/demo" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 00-2 2h-2a2 2 0 00-2 2v6a2 2 0 01-2 2H9z" />
            </svg>
            View Demo Dashboard
          </a>
        </div>
      </div>
    </div>
  </div>
)

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // In a real app, you would check actual authentication state
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

// Main App Router
const AppRouter = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Demo routes - no authentication required for testing */}
      <Route path="/demo" element={<SimpleDashboard />} />
      <Route path="/demo/users" element={<UsersPage />} />
      
      {/* Protected routes - require authentication */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <SimpleDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/users" 
        element={
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRouter 
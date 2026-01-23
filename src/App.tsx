import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState<string>('')
  const [authToken, setAuthToken] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const savedEmail = localStorage.getItem('ptconduct_user_email')
    const savedToken = localStorage.getItem('ptconduct_auth_token')
    const savedAuth = localStorage.getItem('ptconduct_authenticated')
    
    if (savedEmail && savedToken && savedAuth === 'true') {
      setUserEmail(savedEmail)
      setAuthToken(savedToken)
      setIsAuthenticated(true)
    } else {
      // Clear invalid data
      localStorage.removeItem('ptconduct_user_email')
      localStorage.removeItem('ptconduct_auth_token')
      localStorage.removeItem('ptconduct_authenticated')
    }
    setIsLoading(false)
  }, [])

  const handleLogin = (email: string, token: string) => {
    // Save to localStorage
    localStorage.setItem('ptconduct_user_email', email)
    localStorage.setItem('ptconduct_auth_token', token)
    localStorage.setItem('ptconduct_authenticated', 'true')
    
    setUserEmail(email)
    setAuthToken(token)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('ptconduct_user_email')
    localStorage.removeItem('ptconduct_auth_token')
    localStorage.removeItem('ptconduct_authenticated')
    
    setUserEmail('')
    setAuthToken('')
    setIsAuthenticated(false)
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  // Show dashboard if authenticated
  return <Dashboard onLogout={handleLogout} userEmail={userEmail} authToken={authToken} />
}

export default App

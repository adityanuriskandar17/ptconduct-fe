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
    const checkAuthentication = async () => {
      const savedEmail = localStorage.getItem('ptconduct_user_email')
      const savedToken = localStorage.getItem('ptconduct_auth_token')
      const savedAuth = localStorage.getItem('ptconduct_authenticated')
      
      // If no saved data, user must login
      if (!savedEmail || !savedToken || savedAuth !== 'true') {
        // Clear any invalid data
        localStorage.removeItem('ptconduct_user_email')
        localStorage.removeItem('ptconduct_auth_token')
        localStorage.removeItem('ptconduct_authenticated')
        setIsAuthenticated(false)
        setIsLoading(false)
        return
      }

      // Optional: Validate token with API (uncomment if you want to verify token is still valid)
      // try {
      //   const apiUrl = import.meta.env.VITE_API_PTCONDUCT || 'http://127.0.0.1:8088';
      //   const response = await fetch(`${apiUrl}/api/ptconduct/validate-token`, {
      //     method: 'GET',
      //     headers: {
      //       'Authorization': `Bearer ${savedToken}`,
      //     },
      //   });
      //   
      //   if (!response.ok) {
      //     throw new Error('Token invalid');
      //   }
      // } catch (error) {
      //   // Token invalid, clear and require login
      //   localStorage.removeItem('ptconduct_user_email')
      //   localStorage.removeItem('ptconduct_auth_token')
      //   localStorage.removeItem('ptconduct_authenticated')
      //   setIsAuthenticated(false)
      //   setIsLoading(false)
      //   return
      // }

      // Token exists and is valid (or validation skipped), restore session
      setUserEmail(savedEmail)
      setAuthToken(savedToken)
      setIsAuthenticated(true)
      setIsLoading(false)
    }

    checkAuthentication()
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

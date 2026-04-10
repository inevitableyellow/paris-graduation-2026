import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

// The site password — change this to whatever you want
const SITE_PASSWORD = 'paris2026'
// Admin password for the admin panel
const ADMIN_PASSWORD = 'admin2026'

export function AuthProvider({ children }) {
  const [guest, setGuest] = useState(null) // { name, isAdmin }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('grad_guest')
    if (saved) {
      try {
        setGuest(JSON.parse(saved))
      } catch {
        localStorage.removeItem('grad_guest')
      }
    }
    setLoading(false)
  }, [])

  const login = (name, password) => {
    if (password === ADMIN_PASSWORD) {
      const guestData = { name, isAdmin: true }
      setGuest(guestData)
      localStorage.setItem('grad_guest', JSON.stringify(guestData))
      return { success: true }
    }
    if (password === SITE_PASSWORD) {
      const guestData = { name, isAdmin: false }
      setGuest(guestData)
      localStorage.setItem('grad_guest', JSON.stringify(guestData))
      return { success: true }
    }
    return { success: false, error: 'Wrong password — check with Paris!' }
  }

  const logout = () => {
    setGuest(null)
    localStorage.removeItem('grad_guest')
  }

  return (
    <AuthContext.Provider value={{ guest, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

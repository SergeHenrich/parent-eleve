import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('edusmart_token'))

  // Vérifier le token au chargement de l'application
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('edusmart_token')

      if (savedToken) {
        try {
          // Vérifier la validité du token
          const response = await authAPI.verifyToken()

          if (response.data.valid) {
            setUser(response.data.user)
            setToken(savedToken)
          } else {
            // Token invalide, nettoyer le localStorage
            localStorage.removeItem('edusmart_token')
            setToken(null)
          }
        } catch (error) {
          console.error('Erreur vérification token:', error)
          // Token invalide ou expiré
          localStorage.removeItem('edusmart_token')
          setToken(null)
        }
      }

      setLoading(false)
    }

    initAuth()
  }, [])

  // Fonction de connexion
  const login = async (email, password) => {
    try {
      setLoading(true)

      const response = await authAPI.login({ email, password })

      if (response.data.success) {
        const { token: newToken, user: userData } = response.data

        // Sauvegarder le token
        localStorage.setItem('edusmart_token', newToken)
        setToken(newToken)
        setUser(userData)

        return { success: true, user: userData }
      } else {
        throw new Error(response.data.error || 'Erreur de connexion')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Erreur de connexion'
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Fonction de déconnexion
  const logout = async () => {
    try {
      // Appeler l'API de déconnexion (optionnel)
      if (token) {
        await authAPI.logout()
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    } finally {
      // Nettoyer les données locales
      localStorage.removeItem('edusmart_token')
      setToken(null)
      setUser(null)
      toast.success('Déconnexion réussie')
    }
  }

  // Fonction pour changer le mot de passe
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await authAPI.changePassword({
        currentPassword,
        newPassword
      })

      if (response.data.success) {
        toast.success('Mot de passe modifié avec succès')
        return { success: true }
      } else {
        throw new Error(response.data.error || 'Erreur lors du changement de mot de passe')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Fonction pour rafraîchir les données utilisateur
  const refreshUser = async () => {
    try {
      if (token) {
        const response = await authAPI.verifyToken()
        if (response.data.valid) {
          setUser(response.data.user)
          return response.data.user
        }
      }
    } catch (error) {
      console.error('Erreur rafraîchissement utilisateur:', error)
    }
    return null
  }

  // Fonction pour vérifier si l'utilisateur a un rôle spécifique
  const hasRole = (role) => {
    return user?.role === role
  }

  // Fonction pour vérifier si l'utilisateur est un parent
  const isParent = () => hasRole('parent')

  // Fonction pour vérifier si l'utilisateur est un élève
  const isStudent = () => hasRole('eleve')

  // Fonction pour obtenir l'élève actuel (pour les élèves connectés)
  const getCurrentStudent = () => {
    if (isStudent() && user?.eleves?.length > 0) {
      return user.eleves[0]
    }
    return null
  }

  // Fonction pour obtenir tous les élèves (pour les parents)
  const getStudents = () => {
    return user?.eleves || []
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    changePassword,
    refreshUser,
    hasRole,
    isParent,
    isStudent,
    getCurrentStudent,
    getStudents,
    // Informations utiles
    isAuthenticated: !!user,
    userRole: user?.role,
    userName: user ? `${user.prenom} ${user.nom}` : null
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import FormInput from '../../components/UI/FormInput'
import Alert from '../../components/UI/Alert'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { useAuth } from '../../contexts/AuthContext'
import { usersAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { User } from 'lucide-react'

export default function Profile() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
    telephone: user?.telephone || ''
  })
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}
    
    if (!profile.nom.trim()) newErrors.nom = 'Nom requis'
    if (!profile.prenom.trim()) newErrors.prenom = 'Prénom requis'
    if (!profile.email.trim()) newErrors.email = 'Email requis'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      newErrors.email = 'Email invalide'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      await usersAPI.updateProfile(profile)
      toast.success('Profil mis à jour avec succès')
      setEditing(false)
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du profil')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleChangePassword = () => {
    navigate('/profile/change-password')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <User className="w-8 h-8 text-blue-600" />
          Mon Profil
        </h1>
        <p className="text-gray-600 mt-2">Gérez vos informations personnelles</p>
      </div>

      {/* Informations de profil */}
      <Card>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Informations personnelles</h2>
            <p className="text-sm text-gray-600 mt-1">Rôle: {user?.role === 'parent' ? 'Parent' : 'Élève'}</p>
          </div>
          {!editing && (
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setEditing(true)}
            >
              Modifier
            </Button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Nom"
                value={profile.nom}
                onChange={(e) => setProfile({...profile, nom: e.target.value})}
                error={errors.nom}
                required
              />
              <FormInput
                label="Prénom"
                value={profile.prenom}
                onChange={(e) => setProfile({...profile, prenom: e.target.value})}
                error={errors.prenom}
                required
              />
            </div>

            <FormInput
              label="Email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({...profile, email: e.target.value})}
              error={errors.email}
              required
            />

            <FormInput
              label="Téléphone"
              value={profile.telephone}
              onChange={(e) => setProfile({...profile, telephone: e.target.value})}
            />

            <div className="flex gap-3">
              <Button 
                variant="primary"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
              <Button 
                variant="secondary"
                onClick={() => setEditing(false)}
              >
                Annuler
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="border-b pb-3">
              <p className="text-sm text-gray-600">Nom complet</p>
              <p className="font-medium text-gray-900">{profile.nom} {profile.prenom}</p>
            </div>
            <div className="border-b pb-3">
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-900">{profile.email}</p>
            </div>
            {profile.telephone && (
              <div className="border-b pb-3">
                <p className="text-sm text-gray-600">Téléphone</p>
                <p className="font-medium text-gray-900">{profile.telephone}</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Actions de sécurité */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Sécurité</h2>
        <div className="space-y-3">
          <Button 
            variant="secondary"
            className="w-full text-left"
            onClick={handleChangePassword}
          >
            Modifier le mot de passe
          </Button>
        </div>
      </Card>

      {/* Actions */}
      <Card className="bg-gray-50">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
        <Button 
          variant="danger"
          onClick={handleLogout}
          className="w-full"
        >
          Se déconnecter
        </Button>
      </Card>
    </div>
  )
}

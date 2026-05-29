import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import FormInput from '../../components/UI/FormInput'
import Alert from '../../components/UI/Alert'
import { useAuth } from '../../contexts/AuthContext'
import { usersAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { User, Lock, LogOut } from 'lucide-react'

export default function Profile() {
  const navigate = useNavigate()
  const { user, logout, changePassword } = useAuth()
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
    telephone: user?.telephone || ''
  })
  const [errors, setErrors] = useState({})
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: ''
  })

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
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error('Tous les champs sont requis')
      return
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Le nouveau mot de passe doit faire au moins 6 caractères')
      return
    }
    const result = await changePassword(passwordData.currentPassword, passwordData.newPassword)
    if (result.success) {
      setShowPasswordForm(false)
      setPasswordData({ currentPassword: '', newPassword: '' })
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
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

      <Card>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Informations personnelles</h2>
            <p className="text-sm text-gray-600 mt-1">Rôle: {user?.role === 'parent' ? 'Parent' : 'Élève'}</p>
          </div>
          {!editing && (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
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
                onChange={(e) => setProfile({ ...profile, nom: e.target.value })}
                error={errors.nom}
                required
              />
              <FormInput
                label="Prénom"
                value={profile.prenom}
                onChange={(e) => setProfile({ ...profile, prenom: e.target.value })}
                error={errors.prenom}
                required
              />
            </div>
            <FormInput
              label="Email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              error={errors.email}
              required
            />
            <FormInput
              label="Téléphone"
              value={profile.telephone}
              onChange={(e) => setProfile({ ...profile, telephone: e.target.value })}
            />
            <div className="flex gap-3">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
              <Button variant="secondary" onClick={() => setEditing(false)}>
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

      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-gray-600" /> Sécurité
        </h2>
        {!showPasswordForm ? (
          <Button
            variant="secondary"
            className="w-full text-left"
            onClick={() => setShowPasswordForm(true)}
          >
            Modifier le mot de passe
          </Button>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <FormInput
              label="Mot de passe actuel"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              required
            />
            <FormInput
              label="Nouveau mot de passe"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              required
              placeholder="Min 6 caractères"
            />
            <div className="flex gap-3">
              <Button variant="primary" type="submit">Changer le mot de passe</Button>
              <Button variant="secondary" onClick={() => setShowPasswordForm(false)}>Annuler</Button>
            </div>
          </form>
        )}
      </Card>

      <Card className="bg-gray-50">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
        <Button variant="danger" onClick={handleLogout} className="w-full">
          <LogOut className="w-4 h-4 inline mr-2" /> Se déconnecter
        </Button>
      </Card>
    </div>
  )
}

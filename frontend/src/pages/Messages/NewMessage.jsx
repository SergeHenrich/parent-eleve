import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import FormInput from '../../components/UI/FormInput'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import Alert from '../../components/UI/Alert'
import { messagesAPI, studentsAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { Send, ArrowLeft } from 'lucide-react'

export default function NewMessage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [contacts, setContacts] = useState([])
  const [eleves, setEleves] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    destinataire_id: '',
    sujet: '',
    contenu: '',
    eleve_concerne_id: ''
  })
  const [sending, setSending] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    // Remplir depuis l'état passé par MessageDetail (Répondre)
    if (location.state?.destinataire_id) {
      setFormData(prev => ({
        ...prev,
        destinataire_id: String(location.state.destinataire_id),
        sujet: location.state.sujet || ''
      }))
    }
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [contactsRes, studentsRes] = await Promise.all([
        messagesAPI.getContacts(),
        studentsAPI.getStudents()
      ])
      setContacts(contactsRes.data.contacts || [])
      setEleves(studentsRes.data.eleves || [])
    } catch (error) {
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  // Regrouper les contacts par rôle
  const groupedContacts = contacts.reduce((acc, c) => {
    const role = c.role === 'admin' ? 'Administration'
      : c.role === 'enseignant' ? 'Enseignants'
      : c.role === 'parent' ? 'Parents'
      : 'Élèves'
    if (!acc[role]) acc[role] = []
    acc[role].push(c)
    return acc
  }, {})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.destinataire_id) newErrors.destinataire_id = 'Destinataire requis'
    if (!formData.sujet.trim()) newErrors.sujet = 'Sujet requis'
    else if (formData.sujet.length > 200) newErrors.sujet = 'Max 200 caractères'
    if (!formData.contenu.trim()) newErrors.contenu = 'Message requis'
    else if (formData.contenu.length > 5000) newErrors.contenu = 'Max 5000 caractères'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSending(true)
    try {
      await messagesAPI.send({
        ...formData,
        destinataire_id: parseInt(formData.destinataire_id),
        eleve_concerne_id: formData.eleve_concerne_id ? parseInt(formData.eleve_concerne_id) : undefined
      })
      toast.success('Message envoyé avec succès')
      navigate('/messages')
    } catch (error) {
      const msg = error.response?.data?.error || 'Erreur lors de l\'envoi'
      toast.error(msg)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/messages')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Send className="w-8 h-8 text-blue-600" />
            Nouveau message
          </h1>
          <p className="text-gray-600 mt-1">Envoyez un message à l'administration ou aux enseignants</p>
        </div>
      </div>

      {contacts.length === 0 && (
        <Alert type="warning" message="Aucun contact disponible pour le moment" />
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destinataire <span className="text-red-500">*</span>
            </label>
            <select
              name="destinataire_id"
              value={formData.destinataire_id}
              onChange={(e) => setFormData(prev => ({ ...prev, destinataire_id: e.target.value }))}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.destinataire_id ? 'border-red-500' : 'border-gray-300'}`}
              required
            >
              <option value="">-- Sélectionner un destinataire --</option>
              {Object.entries(groupedContacts).map(([roleLabel, roleContacts]) => (
                <optgroup key={roleLabel} label={roleLabel}>
                  {roleContacts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nom_complet}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {errors.destinataire_id && (
              <p className="text-red-500 text-sm mt-1">{errors.destinataire_id}</p>
            )}
          </div>

          <FormInput
            label="Sujet"
            name="sujet"
            value={formData.sujet}
            onChange={handleChange}
            error={errors.sujet}
            required
            placeholder="Objet de votre message"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              name="contenu"
              value={formData.contenu}
              onChange={handleChange}
              rows="6"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.contenu ? 'border-red-500' : 'border-gray-300'}`}
              required
              placeholder="Écrivez votre message ici..."
            />
            {errors.contenu && (
              <p className="text-red-500 text-sm mt-1">{errors.contenu}</p>
            )}
          </div>

          {eleves.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Élève concerné (optionnel)
              </label>
              <select
                name="eleve_concerne_id"
                value={formData.eleve_concerne_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Non spécifié --</option>
                {eleves.map(el => (
                  <option key={el.id} value={el.id}>
                    {el.nom} {el.prenom} ({el.classe})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="primary" type="submit" disabled={sending}>
              {sending ? 'Envoi en cours...' : 'Envoyer le message'}
            </Button>
            <Button variant="secondary" type="button" onClick={() => navigate('/messages')}>
              Annuler
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

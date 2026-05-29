import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../../components/UI/Card'
import Badge from '../../components/UI/Badge'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import Alert from '../../components/UI/Alert'
import Button from '../../components/UI/Button'
import { studentsAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, BookOpen, Clock, TrendingUp, Mail, Phone } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function StudentDetail() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const [eleve, setEleve] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStudent()
  }, [studentId])

  const loadStudent = async () => {
    try {
      const response = await studentsAPI.getById(studentId)
      setEleve(response.data.eleve)
    } catch (error) {
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!eleve) {
    return <Alert type="error" message="Élève non trouvé" />
  }

  const stats = [
    { label: 'Notes', value: eleve.statistiques?.total_notes || 0, icon: BookOpen, color: 'text-blue-600 bg-blue-100' },
    { label: 'Moyenne générale', value: eleve.statistiques?.moyenne_generale || 'N/A', icon: TrendingUp, color: 'text-green-600 bg-green-100' },
    { label: 'Absences', value: eleve.statistiques?.total_absences || 0, icon: Clock, color: 'text-orange-600 bg-orange-100' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/students')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{eleve.prenom} {eleve.nom}</h1>
          <p className="text-gray-600">{eleve.classe} - {eleve.etablissement}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon
          return (
            <Card key={idx}>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${s.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{s.value}{s.label === 'Moyenne générale' ? '/20' : ''}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Informations</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Matricule</span>
              <span className="font-medium">{eleve.matricule}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Classe</span>
              <span className="font-medium">{eleve.classe}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Niveau</span>
              <span className="font-medium">{eleve.niveau}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Année scolaire</span>
              <span className="font-medium">{eleve.annee_scolaire}</span>
            </div>
          </div>
        </Card>

        {eleve.parent && (
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contact parent</h2>
            <div className="space-y-3">
              <p className="font-medium">{eleve.parent.prenom} {eleve.parent.nom}</p>
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" /> {eleve.parent.email}
              </div>
              {eleve.parent.telephone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" /> {eleve.parent.telephone}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="primary" onClick={() => navigate(`/grades/${studentId}`)}>
          <BookOpen className="w-4 h-4 inline mr-2" /> Voir les notes
        </Button>
        <Button variant="secondary" onClick={() => navigate(`/absences/${studentId}`)}>
          <Clock className="w-4 h-4 inline mr-2" /> Voir les absences
        </Button>
      </div>

      {eleve.dernieres_notes?.length > 0 && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Dernières notes</h2>
          <div className="space-y-2">
            {eleve.dernieres_notes.map((n, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{n.matiere}</p>
                  <p className="text-sm text-gray-500">{n.type_evaluation} - {format(new Date(n.date_evaluation), 'dd/MM/yyyy')}</p>
                </div>
                <Badge variant={n.note >= 10 ? 'success' : 'error'}>{n.note}/20</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {eleve.dernieres_absences?.length > 0 && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Dernières absences</h2>
          <div className="space-y-2">
            {eleve.dernieres_absences.map((a, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{format(new Date(a.date_absence), 'dd/MM/yyyy')}</p>
                  <p className="text-sm text-gray-500">{a.motif || 'Sans motif'}</p>
                </div>
                <Badge variant={a.justifiee ? 'success' : 'error'}>
                  {a.justifiee ? 'Justifiée' : 'Non justifiée'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

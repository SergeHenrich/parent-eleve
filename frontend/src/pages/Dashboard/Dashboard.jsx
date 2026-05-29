import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/UI/Card'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import Alert from '../../components/UI/Alert'
import Badge from '../../components/UI/Badge'
import {
  TrendingUp,
  Users,
  AlertCircle,
  MessageSquare,
  ArrowRight
} from 'lucide-react'
import { studentsAPI, gradesAPI, absencesAPI, messagesAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    eleves: [],
    recentGrades: [],
    recentAbsences: [],
    unreadMessages: 0,
    averageGrade: null
  })

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)

        const elevesResponse = await studentsAPI.getStudents()
        const eleves = elevesResponse.data.eleves || []

        let recentGrades = []
        let averageGrade = null
        if (eleves.length > 0) {
          try {
            const gradesResponse = await gradesAPI.getGrades(eleves[0].id, { trimestre: 1 })
            const notesGrouped = gradesResponse.data.notes || {}
            const moyennes = gradesResponse.data.moyennes || {}
            const trim1 = moyennes[1]
            if (trim1 && trim1.moyenne_generale) {
              averageGrade = trim1.moyenne_generale
            }
            const allNotes = []
            Object.values(notesGrouped).forEach(trim => {
              Object.values(trim).forEach(matiere => {
                (matiere.notes || []).forEach(n => {
                  allNotes.push({ ...n, matiere: matiere.matiere_info.nom })
                })
              })
            })
            recentGrades = allNotes.sort((a, b) => new Date(b.date_evaluation) - new Date(a.date_evaluation)).slice(0, 5)
          } catch (e) {
            console.log('Erreur chargement notes:', e.message)
          }
        }

        let recentAbsences = []
        if (eleves.length > 0) {
          try {
            const absencesResponse = await absencesAPI.getAbsences(eleves[0].id)
            recentAbsences = (absencesResponse.data.absences || []).slice(0, 5)
          } catch (e) {
            console.log('Erreur chargement absences:', e.message)
          }
        }

        let unreadMessages = 0
        try {
          const messagesResponse = await messagesAPI.getMessages({ lu: 'false' })
          unreadMessages = messagesResponse.data.statistiques?.messages_non_lus || 0
        } catch (e) {
          console.log('Erreur chargement messages:', e.message)
        }

        setData({
          eleves,
          recentGrades,
          recentAbsences,
          unreadMessages,
          averageGrade
        })
      } catch (error) {
        console.error('Erreur dashboard:', error)
        toast.error('Erreur lors du chargement du tableau de bord')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  const stats = [
    {
      title: 'Élèves',
      value: data.eleves.length,
      icon: Users,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: 'Moyenne générale',
      value: data.averageGrade ? `${data.averageGrade}/20` : 'N/A',
      icon: TrendingUp,
      color: 'text-green-600 bg-green-100'
    },
    {
      title: 'Absences injustifiées',
      value: data.recentAbsences.filter(a => !a.justifiee).length,
      icon: AlertCircle,
      color: 'text-red-600 bg-red-100'
    },
    {
      title: 'Messages non lus',
      value: data.unreadMessages,
      icon: MessageSquare,
      color: 'text-purple-600 bg-purple-100'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenue, {user?.prenom}!
        </h1>
        <p className="text-gray-600 mt-2">
          {user?.role === 'parent'
            ? 'Suivi du parcours scolaire de vos enfants'
            : 'Consulter vos résultats et votre parcours'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={idx}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Notes récentes</h2>
            <button
              onClick={() => navigate('/grades')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              Voir tout <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {data.recentGrades.length > 0 ? (
            <div className="space-y-3">
              {data.recentGrades.map((grade, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">{grade.matiere}</p>
                    <p className="text-sm text-gray-500">{grade.type_evaluation}</p>
                  </div>
                  <Badge variant={grade.note >= 12 ? 'success' : grade.note >= 10 ? 'warning' : 'error'}>
                    {grade.note}/20
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <Alert type="info" message="Aucune note disponible pour le moment" />
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Absences récentes</h2>
            <button
              onClick={() => navigate('/absences')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              Voir tout <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {data.recentAbsences.length > 0 ? (
            <div className="space-y-3">
              {data.recentAbsences.map((absence, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">
                      {format(new Date(absence.date_absence), 'dd/MM/yyyy')}
                    </p>
                    <p className="text-sm text-gray-500">{absence.motif || 'Sans motif'}</p>
                  </div>
                  <Badge variant={absence.justifiee ? 'success' : 'error'}>
                    {absence.justifiee ? 'Justifiée' : 'Non justifiée'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <Alert type="success" message="Aucune absence enregistrée" />
          )}
        </Card>
      </div>
    </div>
  )
}

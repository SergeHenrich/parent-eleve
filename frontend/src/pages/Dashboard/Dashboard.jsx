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
  Clock,
  MessageSquare,
  AlertCircle,
  ArrowRight
} from 'lucide-react'
import { api, studentsAPI, gradesAPI, absencesAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
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
    stats: {
      totalStudents: 0,
      averageGrade: 0,
      unexcusedAbsences: 0
    }
  })

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)

        // Récupérer les élèves
        const elevesResponse = await studentsAPI.getStudents()
        const eleves = elevesResponse.data.eleves || []

        // Récupérer les notes récentes
        let recentGrades = []
        if (eleves.length > 0) {
          try {
            const gradesResponse = await gradesAPI.getGrades(eleves[0].id)
            recentGrades = (gradesResponse.data.notes || []).slice(0, 5)
          } catch (e) {
            console.log('Erreur chargement notes:', e.message)
          }
        }

        // Récupérer les absences récentes
        let recentAbsences = []
        if (eleves.length > 0) {
          try {
            const absencesResponse = await absencesAPI.getAbsences(eleves[0].id)
            recentAbsences = (absencesResponse.data.absences || []).slice(0, 5)
          } catch (e) {
            console.log('Erreur chargement absences:', e.message)
          }
        }

        setData({
          eleves,
          recentGrades,
          recentAbsences,
          stats: {
            totalStudents: eleves.length,
            averageGrade: calculateAverage(recentGrades),
            unexcusedAbsences: recentAbsences.filter(a => !a.justifiee).length
          }
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

  const calculateAverage = (grades) => {
    if (grades.length === 0) return 0
    const sum = grades.reduce((acc, g) => acc + (g.note || 0), 0)
    return (sum / grades.length).toFixed(2)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const stats = [
    {
      title: 'Élèves',
      value: data.stats.totalStudents,
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Moyenne générale',
      value: `${data.stats.averageGrade}/20`,
      icon: TrendingUp,
      color: 'green'
    },
    {
      title: 'Absences injustifiées',
      value: data.stats.unexcusedAbsences,
      icon: AlertCircle,
      color: 'red'
    },
    {
      title: 'Messages non lus',
      value: data.unreadMessages,
      icon: MessageSquare,
      color: 'purple'
    }
  ]

  const iconColors = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    red: 'text-red-600 bg-red-100',
    purple: 'text-purple-600 bg-purple-100'
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
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

      {/* Statistiques */}
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
                <div className={`p-3 rounded-lg ${iconColors[stat.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notes récentes */}
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
                    <p className="font-medium text-gray-900">{grade.matiere || 'Matière'}</p>
                    <p className="text-sm text-gray-600">{grade.type_evaluation || 'Évaluation'}</p>
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

        {/* Absences récentes */}
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
                    <p className="font-medium text-gray-900">{absence.date_absence}</p>
                    <p className="text-sm text-gray-600">{absence.motif || 'Sans motif'}</p>
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

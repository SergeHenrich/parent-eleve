import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../../components/UI/Card'
import Badge from '../../components/UI/Badge'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import Alert from '../../components/UI/Alert'
import { absencesAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Clock, Calendar, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function AbsenceDetail() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const [absences, setAbsences] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadAbsences()
  }, [studentId, filter])

  const loadAbsences = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filter === 'justifiee') params.justifiee = 'true'
      if (filter === 'non_justifiee') params.justifiee = 'false'
      const response = await absencesAPI.getAbsences(studentId, params)
      setAbsences(response.data.absences || [])
      setStats(response.data.statistiques || null)
    } catch (error) {
      toast.error('Erreur lors du chargement des absences')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/absences')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-8 h-8 text-blue-600" />
            Suivi des absences
          </h1>
          <p className="text-gray-600">Élève #{studentId}</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <p className="text-gray-500 text-sm">Total</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total_absences}</p>
          </Card>
          <Card>
            <p className="text-gray-500 text-sm">Justifiées</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{stats.absences_justifiees}</p>
          </Card>
          <Card>
            <p className="text-gray-500 text-sm">Non justifiées</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{stats.absences_non_justifiees}</p>
          </Card>
          <Card>
            <p className="text-gray-500 text-sm">Taux justification</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{stats.taux_justification}%</p>
          </Card>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Filter className="w-5 h-5 text-gray-500" />
        {['all', 'non_justifiee', 'justifiee'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            {f === 'all' ? 'Toutes' : f === 'justifiee' ? 'Justifiées' : 'Non justifiées'}
          </button>
        ))}
      </div>

      {absences.length > 0 ? (
        <div className="space-y-3">
          {absences.map((absence, idx) => (
            <Card key={idx} className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${absence.justifiee ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Calendar className={`w-5 h-5 ${absence.justifiee ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className="font-bold text-gray-900">
                    {format(new Date(absence.date_absence), 'EEEE dd MMMM yyyy', { locale: fr })}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {absence.heure_debut && absence.heure_fin
                      ? `${absence.heure_debut.slice(0, 5)} - ${absence.heure_fin.slice(0, 5)}`
                      : 'Journée complète'}
                  </p>
                  {absence.motif && (
                    <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                      Motif: {absence.motif}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant={absence.justifiee ? 'success' : 'error'}>
                {absence.justifiee ? 'Justifiée' : 'Non justifiée'}
              </Badge>
            </Card>
          ))}
        </div>
      ) : (
        <Alert type="success" message="Aucune absence à afficher pour ce filtre" />
      )}
    </div>
  )
}

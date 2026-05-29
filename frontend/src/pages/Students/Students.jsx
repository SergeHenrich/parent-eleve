import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/UI/Card'
import Badge from '../../components/UI/Badge'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import Alert from '../../components/UI/Alert'
import { studentsAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { GraduationCap, ChevronRight, BookOpen, Clock } from 'lucide-react'

export default function Students() {
  const navigate = useNavigate()
  const [eleves, setEleves] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      const response = await studentsAPI.getStudents()
      setEleves(response.data.eleves || [])
    } catch (error) {
      toast.error('Erreur lors du chargement des élèves')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <GraduationCap className="w-8 h-8 text-blue-600" />
          Mes élèves
        </h1>
        <p className="text-gray-600 mt-2">Consultez les informations et le suivi de vos enfants</p>
      </div>

      {eleves.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {eleves.map(eleve => (
            <Card
              key={eleve.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/students/${eleve.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{eleve.prenom} {eleve.nom}</h2>
                  <p className="text-sm text-gray-500">{eleve.classe} - {eleve.niveau}</p>
                  <p className="text-sm text-gray-500">{eleve.etablissement}</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <GraduationCap className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="text-xl font-bold text-gray-900">{eleve.statistiques?.total_notes || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Absences</p>
                    <p className="text-xl font-bold text-gray-900">{eleve.statistiques?.total_absences || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Non justifiées</p>
                    <p className="text-xl font-bold text-red-600">{eleve.statistiques?.absences_non_justifiees || 0}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/grades/${eleve.id}`) }}
                  className="flex-1 flex items-center justify-center gap-1 text-sm bg-blue-50 text-blue-700 py-2 rounded-lg hover:bg-blue-100"
                >
                  <BookOpen className="w-4 h-4" /> Notes
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/absences/${eleve.id}`) }}
                  className="flex-1 flex items-center justify-center gap-1 text-sm bg-orange-50 text-orange-700 py-2 rounded-lg hover:bg-orange-100"
                >
                  <Clock className="w-4 h-4" /> Absences
                </button>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/students/${eleve.id}`) }}
                className="mt-3 w-full flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                Voir les détails <ChevronRight className="w-4 h-4" />
              </button>
            </Card>
          ))}
        </div>
      ) : (
        <Alert type="info" message="Aucun élève trouvé" />
      )}
    </div>
  )
}

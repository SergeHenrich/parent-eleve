import React, { useState, useEffect } from 'react'
import Card from '../../components/UI/Card'
import Badge from '../../components/UI/Badge'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import Alert from '../../components/UI/Alert'
import { gradesAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { BookOpen, TrendingUp } from 'lucide-react'

export default function Grades() {
  const [eleves, setEleves] = useState([])
  const [selectedEleve, setSelectedEleve] = useState(null)
  const [selectedTrimestre, setSelectedTrimestre] = useState(1)
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGrades()
  }, [selectedEleve, selectedTrimestre])

  const loadGrades = async () => {
    if (!selectedEleve) return

    try {
      setLoading(true)
      const response = await gradesAPI.getGrades(selectedEleve.id, {
        trimestre: selectedTrimestre
      })
      setGrades(response.data.notes || [])
    } catch (error) {
      toast.error('Erreur lors du chargement des notes')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-blue-600" />
          Résultats et notes
        </h1>
        <p className="text-gray-600 mt-2">Consultez les notes par matière et trimestre</p>
      </div>

      {/* Filtres */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner un élève
            </label>
            <select
              value={selectedEleve?.id || ''}
              onChange={(e) => {
                const eleve = eleves.find(el => el.id === parseInt(e.target.value))
                setSelectedEleve(eleve)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choisir un élève --</option>
              {eleves.map(el => (
                <option key={el.id} value={el.id}>
                  {el.nom} {el.prenom} ({el.classe})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trimestre
            </label>
            <select
              value={selectedTrimestre}
              onChange={(e) => setSelectedTrimestre(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1er Trimestre</option>
              <option value={2}>2ème Trimestre</option>
              <option value={3}>3ème Trimestre</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Contenu */}
      {!selectedEleve ? (
        <Alert type="info" message="Sélectionnez un élève pour voir ses notes" />
      ) : loading ? (
        <LoadingSpinner />
      ) : (
        <div>
          {grades.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {grades.map((grade, idx) => (
                <Card key={idx}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {grade.matiere}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Coefficient: {grade.coefficient}
                      </p>
                    </div>
                    <Badge variant={grade.note >= 12 ? 'success' : 'warning'}>
                      {grade.note}/20
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <strong>Type:</strong> {grade.type_evaluation}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Date:</strong> {grade.date_evaluation}
                    </p>
                    {grade.commentaire && (
                      <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        {grade.commentaire}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Alert type="info" message="Aucune note disponible pour ce trimestre" />
          )}
        </div>
      )}
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/UI/Card'
import Badge from '../../components/UI/Badge'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import Alert from '../../components/UI/Alert'
import { gradesAPI, studentsAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { BookOpen, TrendingUp, Eye } from 'lucide-react'

export default function Grades() {
  const navigate = useNavigate()
  const [eleves, setEleves] = useState([])
  const [selectedEleve, setSelectedEleve] = useState(null)
  const [selectedTrimestre, setSelectedTrimestre] = useState(1)
  const [gradesData, setGradesData] = useState({ notes: {}, moyennes: {} })
  const [loading, setLoading] = useState(true)
  const [loadingGrades, setLoadingGrades] = useState(false)

  useEffect(() => {
    loadStudents()
  }, [])

  useEffect(() => {
    if (selectedEleve) {
      loadGrades()
    }
  }, [selectedEleve, selectedTrimestre])

  const loadStudents = async () => {
    try {
      const response = await studentsAPI.getStudents()
      setEleves(response.data.eleves || [])
      if (response.data.eleves?.length > 0) {
        setSelectedEleve(response.data.eleves[0])
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des élèves')
    } finally {
      setLoading(false)
    }
  }

  const loadGrades = async () => {
    try {
      setLoadingGrades(true)
      const response = await gradesAPI.getGrades(selectedEleve.id, {
        trimestre: selectedTrimestre
      })
      setGradesData({
        notes: response.data.notes || {},
        moyennes: response.data.moyennes || {}
      })
    } catch (error) {
      toast.error('Erreur lors du chargement des notes')
    } finally {
      setLoadingGrades(false)
    }
  }

  const getGradeColor = (note) => {
    if (note >= 16) return 'success'
    if (note >= 12) return 'success'
    if (note >= 10) return 'warning'
    return 'error'
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const notes = gradesData.notes[selectedTrimestre] || {}
  const moyennes = gradesData.moyennes[selectedTrimestre] || {}
  const matieres = Object.keys(notes)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-blue-600" />
          Résultats et notes
        </h1>
        <p className="text-gray-600 mt-2">Consultez les notes par matière et trimestre</p>
      </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-2">Trimestre</label>
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

      {moyennes.moyenne_generale && (
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center gap-4">
            <TrendingUp className="w-10 h-10" />
            <div>
              <p className="text-blue-100 text-sm">Moyenne générale T{selectedTrimestre}</p>
              <p className="text-4xl font-bold">{moyennes.moyenne_generale}/20</p>
            </div>
          </div>
        </Card>
      )}

      {!selectedEleve ? (
        <Alert type="info" message="Sélectionnez un élève pour voir ses notes" />
      ) : loadingGrades ? (
        <LoadingSpinner />
      ) : matieres.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matieres.map((matiere) => {
            const matiereData = notes[matiere]
            const moyenneMatiere = moyennes[matiere]
            const allNotes = matiereData.notes || []

            return (
              <Card key={matiere}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{matiere}</h3>
                    <p className="text-sm text-gray-500">
                      Coefficient: {matiereData.matiere_info.coefficient}
                    </p>
                  </div>
                  {moyenneMatiere && (
                    <Badge variant={moyenneMatiere.moyenne >= 10 ? 'success' : 'error'}>
                      {moyenneMatiere.moyenne}/20
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  {allNotes.map((n) => (
                    <div key={n.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{n.type_evaluation}</p>
                        <p className="text-sm text-gray-500">{n.date_evaluation}</p>
                        {n.commentaire && (
                          <p className="text-xs text-gray-500 mt-1">{n.commentaire}</p>
                        )}
                      </div>
                      <Badge variant={getGradeColor(n.note)}>
                        {n.note}/20
                      </Badge>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate(`/grades/${selectedEleve.id}/bulletin/${selectedTrimestre}`)}
                  className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 py-2 border border-blue-200 rounded-lg hover:bg-blue-50"
                >
                  <Eye className="w-4 h-4" /> Voir le bulletin
                </button>
              </Card>
            )
          })}
        </div>
      ) : (
        <Alert type="info" message="Aucune note disponible pour ce trimestre" />
      )}
    </div>
  )
}

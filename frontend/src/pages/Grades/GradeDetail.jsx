import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../../components/UI/Card'
import Badge from '../../components/UI/Badge'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import Alert from '../../components/UI/Alert'
import { gradesAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, TrendingUp, BookOpen } from 'lucide-react'

export default function GradeDetail() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const [selectedTrimestre, setSelectedTrimestre] = useState(1)
  const [gradesData, setGradesData] = useState({ notes: {}, moyennes: {} })
  const [eleveInfo, setEleveInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGrades()
  }, [studentId, selectedTrimestre])

  const loadGrades = async () => {
    try {
      setLoading(true)
      const response = await gradesAPI.getGrades(studentId, { trimestre: selectedTrimestre })
      setGradesData({
        notes: response.data.notes || {},
        moyennes: response.data.moyennes || {}
      })
      if (response.data.statistiques) {
        setEleveInfo({ trimestres: response.data.statistiques.trimestres, matieres: response.data.statistiques.matieres })
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des notes')
    } finally {
      setLoading(false)
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
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/grades')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-blue-600" />
            Détail des notes
          </h1>
          <p className="text-gray-600">Élève #{studentId}</p>
        </div>
      </div>

      <Card>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Trimestre:</label>
          <div className="flex gap-2">
            {[1, 2, 3].map(t => (
              <button
                key={t}
                onClick={() => setSelectedTrimestre(t)}
                className={`px-4 py-2 rounded-lg text-sm ${selectedTrimestre === t ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                T{t}
              </button>
            ))}
          </div>
          {moyennes.moyenne_generale && (
            <div className="ml-auto flex items-center gap-2 text-green-600">
              <TrendingUp className="w-5 h-5" />
              <span className="font-bold text-lg">Moy: {moyennes.moyenne_generale}/20</span>
            </div>
          )}
        </div>
      </Card>

      {matieres.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {matieres.map((matiere) => {
            const matiereData = notes[matiere]
            const moyenneMatiere = moyennes[matiere]
            const allNotes = matiereData.notes || []

            return (
              <Card key={matiere}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{matiere}</h3>
                    <p className="text-sm text-gray-500">Coefficient: {matiereData.matiere_info.coefficient}</p>
                  </div>
                  {moyenneMatiere && (
                    <Badge variant={moyenneMatiere.moyenne >= 10 ? 'success' : 'error'}>
                      Moy: {moyenneMatiere.moyenne}/20
                    </Badge>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left p-3">Type</th>
                        <th className="text-left p-3">Date</th>
                        <th className="text-center p-3">Note</th>
                        <th className="text-left p-3">Commentaire</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allNotes.map((n) => (
                        <tr key={n.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{n.type_evaluation}</td>
                          <td className="p-3 text-gray-600">{n.date_evaluation}</td>
                          <td className="p-3 text-center">
                            <Badge variant={getGradeColor(n.note)}>{n.note}/20</Badge>
                          </td>
                          <td className="p-3 text-gray-500">{n.commentaire || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Alert type="info" message="Aucune note pour ce trimestre" />
      )}
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../../components/UI/Card'
import Badge from '../../components/UI/Badge'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import Alert from '../../components/UI/Alert'
import Button from '../../components/UI/Button'
import { gradesAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Download, Printer } from 'lucide-react'

export default function Bulletin() {
  const { studentId, trimestre } = useParams()
  const navigate = useNavigate()
  const [bulletin, setBulletin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBulletin()
  }, [studentId, trimestre])

  const loadBulletin = async () => {
    try {
      const response = await gradesAPI.getBulletin(studentId, trimestre)
      setBulletin(response.data.bulletin)
    } catch (error) {
      toast.error('Erreur lors du chargement du bulletin')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!bulletin) {
    return <Alert type="error" message="Bulletin non trouvé" />
  }

  const trimestres = ['1er', '2ème', '3ème']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/grades')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bulletin {trimestres[trimestre - 1]} Trimestre
            </h1>
            <p className="text-gray-600">{bulletin.eleve.prenom} {bulletin.eleve.nom} - {bulletin.eleve.classe}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="w-4 h-4 inline mr-2" /> Imprimer
          </Button>
        </div>
      </div>

      <Card className="print-break">
        <div className="text-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-900">MINISTÈRE DES ENSEIGNEMENTS SECONDAIRES</h2>
          <h3 className="text-xl text-blue-600 mt-1">EDUSMART-CM</h3>
          <p className="text-gray-500 mt-1">BULLETIN TRIMESTRIEL</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
          <div>
            <p className="text-gray-500">Élève</p>
            <p className="font-bold">{bulletin.eleve.prenom} {bulletin.eleve.nom}</p>
          </div>
          <div>
            <p className="text-gray-500">Matricule</p>
            <p className="font-bold">{bulletin.eleve.matricule}</p>
          </div>
          <div>
            <p className="text-gray-500">Classe</p>
            <p className="font-bold">{bulletin.eleve.classe}</p>
          </div>
          <div>
            <p className="text-gray-500">Trimestre</p>
            <p className="font-bold">{trimestres[trimestre - 1]}</p>
          </div>
          <div>
            <p className="text-gray-500">Niveau</p>
            <p className="font-bold">{bulletin.eleve.niveau}</p>
          </div>
          <div>
            <p className="text-gray-500">Établissement</p>
            <p className="font-bold">{bulletin.eleve.etablissement}</p>
          </div>
          <div>
            <p className="text-gray-500">Année scolaire</p>
            <p className="font-bold">{bulletin.eleve.annee_scolaire}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-3 font-semibold text-gray-700">Matière</th>
                <th className="text-center p-3 font-semibold text-gray-700">Coefficient</th>
                <th className="text-center p-3 font-semibold text-gray-700">Moyenne</th>
                <th className="text-center p-3 font-semibold text-gray-700">Appréciation</th>
              </tr>
            </thead>
            <tbody>
              {(bulletin.matieres || []).map((m, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{m.matiere}</td>
                  <td className="p-3 text-center">{m.coefficient}</td>
                  <td className="p-3 text-center">
                    <Badge variant={parseFloat(m.moyenne) >= 10 ? 'success' : 'error'}>
                      {m.moyenne}/20
                    </Badge>
                  </td>
                  <td className="p-3 text-center text-gray-600">{m.appreciation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">Moyenne Générale</p>
              {bulletin.appreciation_generale && (
                <p className="text-sm text-gray-600 mt-1">{bulletin.appreciation_generale}</p>
              )}
            </div>
            <span className="text-3xl font-bold text-blue-600">
              {bulletin.moyenne_generale || 'N/A'}/20
            </span>
          </div>
        </div>

        {bulletin.absences && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="font-bold text-gray-900 mb-2">Absences du trimestre</p>
            <div className="flex gap-6 text-sm">
              <span>Total: <strong>{bulletin.absences.total}</strong></span>
              <span className="text-green-600">Justifiées: <strong>{bulletin.absences.total - bulletin.absences.non_justifiees}</strong></span>
              <span className="text-red-600">Non justifiées: <strong>{bulletin.absences.non_justifiees}</strong></span>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t text-center text-xs text-gray-500">
          <p>Généré le {new Date(bulletin.date_generation).toLocaleDateString('fr-FR')}</p>
          <p className="mt-1">EDUSMART-CM &copy; {new Date().getFullYear()} - MINESEC</p>
        </div>
      </Card>
    </div>
  )
}

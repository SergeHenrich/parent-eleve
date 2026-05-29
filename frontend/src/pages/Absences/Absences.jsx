import React, { useState, useEffect } from 'react'
import Card from '../../components/UI/Card'
import Badge from '../../components/UI/Badge'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import Alert from '../../components/UI/Alert'
import { absencesAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { Clock } from 'lucide-react'

export default function Absences() {
    const [eleves, setEleves] = useState([])
    const [selectedEleve, setSelectedEleve] = useState(null)
    const [absences, setAbsences] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (selectedEleve) {
            loadAbsences()
        }
    }, [selectedEleve])

    const loadAbsences = async () => {
        try {
            setLoading(true)
            const response = await absencesAPI.getAbsences(selectedEleve.id)
            setAbsences(response.data.absences || [])
        } catch (error) {
            toast.error('Erreur lors du chargement des absences')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const excusedCount = absences.filter(a => a.justifiee).length
    const unexcusedCount = absences.filter(a => !a.justifiee).length

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="w-8 h-8 text-blue-600" />
                    Suivi des absences
                </h1>
                <p className="text-gray-600 mt-2">Consultez l'historique des absences</p>
            </div>

            {/* Sélection élève */}
            <Card>
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
            </Card>

            {!selectedEleve ? (
                <Alert type="info" message="Sélectionnez un élève pour voir ses absences" />
            ) : loading ? (
                <LoadingSpinner />
            ) : (
                <>
                    {/* Statistiques */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <p className="text-gray-600 text-sm font-medium">Total absences</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{absences.length}</p>
                        </Card>
                        <Card>
                            <p className="text-gray-600 text-sm font-medium">Justifiées</p>
                            <p className="text-3xl font-bold text-green-600 mt-2">{excusedCount}</p>
                        </Card>
                        <Card>
                            <p className="text-gray-600 text-sm font-medium">Non justifiées</p>
                            <p className="text-3xl font-bold text-red-600 mt-2">{unexcusedCount}</p>
                        </Card>
                    </div>

                    {/* Liste des absences */}
                    {absences.length > 0 ? (
                        <div className="space-y-3">
                            {absences.map((absence, idx) => (
                                <Card key={idx} className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900">{absence.date_absence}</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {absence.heure_debut && absence.heure_fin
                                                ? `${absence.heure_debut} - ${absence.heure_fin}`
                                                : 'Journée complète'
                                            }
                                        </p>
                                        {absence.motif && (
                                            <p className="text-sm text-gray-700 mt-2">Motif: {absence.motif}</p>
                                        )}
                                    </div>
                                    <Badge variant={absence.justifiee ? 'success' : 'error'}>
                                        {absence.justifiee ? 'Justifiée' : 'Non justifiée'}
                                    </Badge>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Alert type="success" message="Aucune absence enregistrée" />
                    )}
                </>
            )}
        </div>
    )
}

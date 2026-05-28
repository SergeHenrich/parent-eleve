import React from 'react'
import { useParams } from 'react-router-dom'

export default function AbsenceDetail() {
  const { studentId } = useParams()
  return <div className="p-6">Détails absences - Élève {studentId}</div>
}

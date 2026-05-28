import React from 'react'
import { useParams } from 'react-router-dom'

export default function StudentDetail() {
  const { studentId } = useParams()
  return <div className="p-6">Détails élève {studentId}</div>
}

import React from 'react'
import { useParams } from 'react-router-dom'

export default function GradeDetail() {
  const { studentId } = useParams()
  return <div className="p-6">Détails des notes - Élève {studentId}</div>
}

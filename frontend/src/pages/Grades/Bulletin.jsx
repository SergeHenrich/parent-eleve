import React from 'react'
import { useParams } from 'react-router-dom'

export default function Bulletin() {
  const { studentId, trimestre } = useParams()
  return <div className="p-6">Bulletin T{trimestre} - Élève {studentId}</div>
}

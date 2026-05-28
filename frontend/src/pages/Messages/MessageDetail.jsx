import React from 'react'
import { useParams } from 'react-router-dom'

export default function MessageDetail() {
  const { messageId } = useParams()
  return <div className="p-6">Détails message {messageId}</div>
}

import React from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/UI/Button'
import { AlertTriangle } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="text-center">
                <AlertTriangle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
                <p className="text-xl text-gray-600 mb-6">Page non trouvée</p>
                <p className="text-gray-600 mb-8">La page que vous recherchez n'existe pas ou a été supprimée.</p>
                <Link to="/dashboard">
                    <Button variant="primary">Retour au tableau de bord</Button>
                </Link>
            </div>
        </div>
    )
}

import React from 'react'

export default function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center">
                <div className="inline-block">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                <p className="mt-4 text-gray-600 font-medium">Chargement...</p>
            </div>
        </div>
    )
}

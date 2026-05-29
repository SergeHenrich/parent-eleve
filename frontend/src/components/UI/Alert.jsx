import React from 'react'
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react'

export default function Alert({ type = 'info', title, message, onClose }) {
    const variants = {
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        success: 'bg-green-50 border-green-200 text-green-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        error: 'bg-red-50 border-red-200 text-red-800'
    }

    const icons = {
        info: <Info className="w-5 h-5" />,
        success: <CheckCircle className="w-5 h-5" />,
        warning: <AlertTriangle className="w-5 h-5" />,
        error: <AlertCircle className="w-5 h-5" />
    }

    return (
        <div className={`border rounded-lg p-4 flex items-start gap-3 ${variants[type]}`}>
            <div className="flex-shrink-0 mt-0.5">
                {icons[type]}
            </div>
            <div className="flex-1">
                {title && <h3 className="font-medium">{title}</h3>}
                {message && <p className="text-sm mt-1">{message}</p>}
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                    ×
                </button>
            )}
        </div>
    )
}

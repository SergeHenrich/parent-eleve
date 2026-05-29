import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../../components/UI/Button'
import FormInput from '../../components/UI/FormInput'
import Alert from '../../components/UI/Alert'
import { Lock, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
    const navigate = useNavigate()
    const location = useLocation()
    const { login } = useAuth()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [demoMode, setDemoMode] = useState(false)

    const validateForm = () => {
        const newErrors = {}

        if (!email) {
            newErrors.email = 'Email requis'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Email invalide'
        }

        if (!password) {
            newErrors.password = 'Mot de passe requis'
        } else if (password.length < 6) {
            newErrors.password = 'Au moins 6 caractères'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) return

        setLoading(true)
        try {
            await login(email, password)
            toast.success('Connexion réussie!')
            const from = location.state?.from?.pathname || '/dashboard'
            navigate(from)
        } catch (error) {
            toast.error(error.message || 'Erreur de connexion')
            setErrors({ submit: error.message })
        } finally {
            setLoading(false)
        }
    }

    const useDemoAccount = async (role) => {
        const demoCredentials = {
            parent: { email: 'parent@edusmart.cm', password: 'parent123' },
            eleve: { email: 'eleve@edusmart.cm', password: 'eleve123' }
        }

        const { email: demoEmail, password: demoPassword } = demoCredentials[role]
        setEmail(demoEmail)
        setPassword(demoPassword)
        setDemoMode(true)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo et titre */}
                <div className="text-center mb-8">
                    <div className="inline-block bg-white rounded-full p-4 mb-4">
                        <Lock className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">EduSmart</h1>
                    <p className="text-blue-100">Portail Parent/Élève</p>
                </div>

                {/* Carte de connexion */}
                <div className="bg-white rounded-lg shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Connexion</h2>

                    {errors.submit && (
                        <Alert
                            type="error"
                            message={errors.submit}
                            onClose={() => setErrors({ ...errors, submit: null })}
                            className="mb-6"
                        />
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <FormInput
                            label="Adresse email"
                            type="email"
                            placeholder="exemple@edusmart.cm"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            error={errors.email}
                            required
                        />

                        <FormInput
                            label="Mot de passe"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            error={errors.password}
                            required
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? 'Connexion en cours...' : 'Se connecter'}
                        </Button>
                    </form>

                    {/* Comptes démo */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-3 font-medium">Comptes de démonstration:</p>
                        <div className="space-y-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full text-left"
                                onClick={() => useDemoAccount('parent')}
                            >
                                👨‍👩‍👧 Parent (parent@edusmart.cm)
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full text-left"
                                onClick={() => useDemoAccount('eleve')}
                            >
                                👦 Élève (eleve@edusmart.cm)
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Mot de passe: parent123 / eleve123</p>
                    </div>

                    {demoMode && (
                        <Alert
                            type="info"
                            message="Mode démo activé. Cliquez sur 'Se connecter' pour continuer."
                            className="mt-4"
                        />
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-blue-100 text-sm mt-6">
                    © 2026 EDUSMART-CM - MINESEC
                </p>
            </div>
        </div>
    )
}

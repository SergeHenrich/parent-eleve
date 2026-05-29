import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
    Home,
    BookOpen,
    Clock,
    MessageSquare,
    Bell,
    User,
    GraduationCap
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const Sidebar = ({ isOpen, onClose, isMobile = false }) => {
    const location = useLocation()
    const { user } = useAuth()
    const isActive = (path) => location.pathname.startsWith(path)

    const menuItems = [
        { path: '/dashboard', label: 'Tableau de bord', icon: Home },
        { path: '/students', label: 'Élèves', icon: GraduationCap, role: ['parent'] },
        { path: '/grades', label: 'Résultats', icon: BookOpen },
        { path: '/absences', label: 'Absences', icon: Clock },
        { path: '/messages', label: 'Messages', icon: MessageSquare },
        { path: '/notifications', label: 'Notifications', icon: Bell },
        { path: '/profile', label: 'Profil', icon: User }
    ]

    const filteredMenuItems = menuItems.filter(item => {
        if (!item.role) return true
        return item.role.includes(user?.role)
    })

    const menuItemClasses = (path) => `
    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200
    ${isActive(path)
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }
  `

    const content = (
        <div className="h-full flex flex-col">
            <div className="p-6 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-blue-600">EduSmart</h1>
                <p className="text-xs text-gray-600 mt-1">Portail Parent/Élève</p>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3">
                <ul className="space-y-2">
                    {filteredMenuItems.map((item) => {
                        const Icon = item.icon
                        return (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    onClick={isMobile ? onClose : undefined}
                                    className={menuItemClasses(item.path)}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        )
                    })}
                </ul>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase mb-3">
                        {user?.role === 'parent' ? 'Compte Parent' : 'Compte Élève'}
                    </h3>
                    <p className="px-4 text-sm text-gray-700">{user?.nom} {user?.prenom}</p>
                </div>
            </nav>
        </div>
    )

    if (isMobile) {
        return content
    }

    return (
        <aside className={`
      fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white shadow-lg
      transform transition-transform duration-300
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:translate-x-0 md:relative md:top-0 md:h-auto
      overflow-y-auto
    `}>
            {content}
        </aside>
    )
}

export default Sidebar

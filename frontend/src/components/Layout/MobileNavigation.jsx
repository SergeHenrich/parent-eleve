import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
    Home,
    BookOpen,
    Clock,
    MessageSquare,
    Bell,
    User
} from 'lucide-react'

const MobileNavigation = () => {
    const location = useLocation()

    const isActive = (path) => location.pathname.startsWith(path)

    const navItems = [
        { path: '/dashboard', label: 'Accueil', icon: Home },
        { path: '/grades', label: 'Notes', icon: BookOpen },
        { path: '/absences', label: 'Absences', icon: Clock },
        { path: '/messages', label: 'Messages', icon: MessageSquare },
        { path: '/profile', label: 'Profil', icon: User }
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
            <div className="flex justify-around">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.path)

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`
                flex flex-col items-center gap-1 px-4 py-3 flex-1 transition-colors
                ${active ? 'text-blue-600' : 'text-gray-600'}
              `}
                        >
                            <Icon className="w-6 h-6" />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}

export default MobileNavigation

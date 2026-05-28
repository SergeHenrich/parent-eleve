import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import MobileNavigation from './MobileNavigation'
import { useAuth } from '../../contexts/AuthContext'

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { user } = useAuth()

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      // Fermer la sidebar sur mobile par défaut
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        onToggleSidebar={toggleSidebar}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex">
        {/* Sidebar pour desktop */}
        {!isMobile && (
          <Sidebar 
            isOpen={sidebarOpen}
            onClose={closeSidebar}
          />
        )}

        {/* Overlay pour mobile */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar mobile */}
        {isMobile && (
          <div className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:hidden
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <Sidebar 
              isOpen={sidebarOpen}
              onClose={closeSidebar}
              isMobile={true}
            />
          </div>
        )}

        {/* Contenu principal */}
        <main className={`
          flex-1 transition-all duration-300 ease-in-out
          ${!isMobile && sidebarOpen ? 'ml-64' : 'ml-0'}
          ${isMobile ? 'pb-16' : 'pb-0'}
        `}>
          <div className="pt-16"> {/* Espace pour le header fixe */}
            <div className="container mx-auto px-4 py-6 max-w-7xl">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Navigation mobile en bas */}
      {isMobile && <MobileNavigation />}
    </div>
  )
}

export default Layout
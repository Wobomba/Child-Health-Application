import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { User, LogOut, Settings, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const UserProfileMenu = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
          {user?.full_name ? getInitials(user.full_name) : 'U'}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-900">{user?.full_name || 'User'}</div>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                {user?.full_name ? getInitials(user.full_name) : 'U'}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{user?.full_name || 'User'}</div>
                <div className="text-xs text-gray-500">{user?.email || user?.username || ''}</div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => {
              setIsOpen(false)
              navigate('/profile')
            }}
            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <User className="h-4 w-4 mr-3" />
            View Profile
          </button>
          
          <button
            onClick={() => {
              setIsOpen(false)
              navigate('/profile?edit=true')
            }}
            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Settings className="h-4 w-4 mr-3" />
            Edit Profile
          </button>
          
          <div className="border-t border-gray-200 my-1"></div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

export default UserProfileMenu


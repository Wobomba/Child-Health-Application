import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { User, Mail, MapPin, Building, Save, X, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'

interface UserProfile {
  id: number
  username: string
  email: string
  full_name: string
  role: string
  district?: string
  village?: string
  phone?: string
  created_at: string
}

const ProfilePage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEditMode = searchParams.get('edit') === 'true'
  const [editMode, setEditMode] = useState(isEditMode)
  const queryClient = useQueryClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const response = await api.get('/auth/me')
      return response.data
    },
    enabled: !!user,
  })

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    district: profile?.district || '',
    village: profile?.village || '',
  })

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        district: profile.district || '',
        village: profile.village || '',
      })
    }
  }, [profile])

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const response = await api.put('/auth/me', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      toast.success('Profile updated successfully!')
      setEditMode(false)
      navigate('/profile')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to update profile'
      toast.error(errorMessage)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your account information</p>
        </div>
        {!editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="btn btn-primary flex items-center"
          >
            <Edit2 className="h-5 w-5 mr-2" />
            Edit Profile
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-8">
          {editMode ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    id="district"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label htmlFor="village" className="block text-sm font-medium text-gray-700 mb-1">
                    Village
                  </label>
                  <input
                    type="text"
                    id="village"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false)
                    navigate('/profile')
                  }}
                  className="btn btn-secondary"
                  disabled={updateMutation.isPending}
                >
                  <X className="h-5 w-5 mr-2" />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updateMutation.isPending}
                >
                  <Save className="h-5 w-5 mr-2" />
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full bg-primary-600 flex items-center justify-center text-white text-2xl font-medium">
                  {profile?.full_name
                    ? profile.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .substring(0, 2)
                    : 'U'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{profile?.full_name || 'User'}</h2>
                  <p className="text-sm text-gray-500 capitalize">{profile?.role || 'user'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-base text-gray-900">{profile?.email || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Username</p>
                    <p className="text-base text-gray-900">{profile?.username || 'Not provided'}</p>
                  </div>
                </div>

                {profile?.phone && (
                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="text-base text-gray-900">{profile.phone}</p>
                    </div>
                  </div>
                )}

                {profile?.district && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">District</p>
                      <p className="text-base text-gray-900">{profile.district}</p>
                    </div>
                  </div>
                )}

                {profile?.village && (
                  <div className="flex items-start space-x-3">
                    <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Village</p>
                      <p className="text-base text-gray-900">{profile.village}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Note: Password changes are not available through this interface. Please contact your administrator for password reset.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage


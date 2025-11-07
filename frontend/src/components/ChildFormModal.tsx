import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { childService, ChildCreate } from '../services/childService'
import { X, User, Calendar, MapPin, Phone, Home, Weight, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface ChildFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (childId: number) => void
}

const ChildFormModal = ({ isOpen, onClose, onSuccess }: ChildFormModalProps) => {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<ChildCreate>({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'male',
    parent_name: '',
    village: '',
    district: '',
    parent_phone: '',
    parent_address: '',
    birth_weight: undefined,
    has_disabilities: false,
    disability_details: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createMutation = useMutation({
    mutationFn: (data: ChildCreate) => childService.create(data),
    onSuccess: (newChild) => {
      // Invalidate all related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['children'] })
      queryClient.invalidateQueries({ queryKey: ['children', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['photos'] })
      queryClient.invalidateQueries({ queryKey: ['photos', 'stats'] })
      toast.success('Child registered successfully!')
      onSuccess?.(newChild.id)
      handleClose()
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to create child'
      toast.error(errorMessage)
      if (error.response?.data?.detail) {
        setErrors({ general: errorMessage })
      }
    },
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required'
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required'
    }
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required'
    } else {
      const birthDate = new Date(formData.date_of_birth)
      const today = new Date()
      if (birthDate > today) {
        newErrors.date_of_birth = 'Date of birth cannot be in the future'
      }
    }
    if (!formData.parent_name.trim()) {
      newErrors.parent_name = 'Parent/Guardian name is required'
    }
    if (!formData.village.trim()) {
      newErrors.village = 'Village is required'
    }
    if (!formData.district.trim()) {
      newErrors.district = 'District is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    if (validateForm()) {
      createMutation.mutate(formData)
    }
  }

  const handleClose = () => {
    setFormData({
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: 'male',
      parent_name: '',
      village: '',
      district: '',
      parent_phone: '',
      parent_address: '',
      birth_weight: undefined,
      has_disabilities: false,
      disability_details: '',
    })
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Register New Child</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-danger-600 mr-2" />
                <p className="text-sm text-danger-700">{errors.general}</p>
              </div>
            </div>
          )}

          {/* Child Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-primary-600" />
              Child Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  id="first_name"
                  type="text"
                  required
                  className={`input ${errors.first_name ? 'border-danger-500' : ''}`}
                  value={formData.first_name}
                  onChange={(e) => {
                    setFormData({ ...formData, first_name: e.target.value })
                    setErrors({ ...errors, first_name: '' })
                  }}
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-danger-600">{errors.first_name}</p>
                )}
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  id="last_name"
                  type="text"
                  required
                  className={`input ${errors.last_name ? 'border-danger-500' : ''}`}
                  value={formData.last_name}
                  onChange={(e) => {
                    setFormData({ ...formData, last_name: e.target.value })
                    setErrors({ ...errors, last_name: '' })
                  }}
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-danger-600">{errors.last_name}</p>
                )}
              </div>

              <div>
                <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Date of Birth *
                </label>
                <input
                  id="date_of_birth"
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className={`input ${errors.date_of_birth ? 'border-danger-500' : ''}`}
                  value={formData.date_of_birth}
                  onChange={(e) => {
                    setFormData({ ...formData, date_of_birth: e.target.value })
                    setErrors({ ...errors, date_of_birth: '' })
                  }}
                />
                {errors.date_of_birth && (
                  <p className="mt-1 text-sm text-danger-600">{errors.date_of_birth}</p>
                )}
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                  Gender *
                </label>
                <select
                  id="gender"
                  required
                  className="input"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label htmlFor="birth_weight" className="block text-sm font-medium text-gray-700 mb-1">
                  <Weight className="h-4 w-4 inline mr-1" />
                  Birth Weight (kg)
                </label>
                <input
                  id="birth_weight"
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="10"
                  className="input"
                  placeholder="e.g., 3.2"
                  value={formData.birth_weight || ''}
                  onChange={(e) => setFormData({ ...formData, birth_weight: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>
            </div>
          </div>

          {/* Parent/Guardian Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-primary-600" />
              Parent/Guardian Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="parent_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Parent/Guardian Name *
                </label>
                <input
                  id="parent_name"
                  type="text"
                  required
                  className={`input ${errors.parent_name ? 'border-danger-500' : ''}`}
                  value={formData.parent_name}
                  onChange={(e) => {
                    setFormData({ ...formData, parent_name: e.target.value })
                    setErrors({ ...errors, parent_name: '' })
                  }}
                />
                {errors.parent_name && (
                  <p className="mt-1 text-sm text-danger-600">{errors.parent_name}</p>
                )}
              </div>

              <div>
                <label htmlFor="parent_phone" className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Phone Number
                </label>
                <input
                  id="parent_phone"
                  type="tel"
                  className="input"
                  placeholder="+256..."
                  value={formData.parent_phone || ''}
                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="parent_address" className="block text-sm font-medium text-gray-700 mb-1">
                  <Home className="h-4 w-4 inline mr-1" />
                  Address
                </label>
                <input
                  id="parent_address"
                  type="text"
                  className="input"
                  placeholder="Home address"
                  value={formData.parent_address || ''}
                  onChange={(e) => setFormData({ ...formData, parent_address: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-primary-600" />
              Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="village" className="block text-sm font-medium text-gray-700 mb-1">
                  Village *
                </label>
                <input
                  id="village"
                  type="text"
                  required
                  className={`input ${errors.village ? 'border-danger-500' : ''}`}
                  value={formData.village}
                  onChange={(e) => {
                    setFormData({ ...formData, village: e.target.value })
                    setErrors({ ...errors, village: '' })
                  }}
                />
                {errors.village && (
                  <p className="mt-1 text-sm text-danger-600">{errors.village}</p>
                )}
              </div>

              <div>
                <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
                  District *
                </label>
                <input
                  id="district"
                  type="text"
                  required
                  className={`input ${errors.district ? 'border-danger-500' : ''}`}
                  value={formData.district}
                  onChange={(e) => {
                    setFormData({ ...formData, district: e.target.value })
                    setErrors({ ...errors, district: '' })
                  }}
                />
                {errors.district && (
                  <p className="mt-1 text-sm text-danger-600">{errors.district}</p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <input
                id="has_disabilities"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                checked={formData.has_disabilities}
                onChange={(e) => setFormData({ ...formData, has_disabilities: e.target.checked })}
              />
              <label htmlFor="has_disabilities" className="text-sm font-medium text-gray-700">
                Child has disabilities
              </label>
            </div>
            {formData.has_disabilities && (
              <div>
                <label htmlFor="disability_details" className="block text-sm font-medium text-gray-700 mb-1">
                  Disability Details
                </label>
                <textarea
                  id="disability_details"
                  rows={3}
                  className="input"
                  placeholder="Describe any disabilities..."
                  value={formData.disability_details || ''}
                  onChange={(e) => setFormData({ ...formData, disability_details: e.target.value })}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
              disabled={createMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Registering...
                </>
              ) : (
                <>
                  <User className="h-5 w-5 mr-2" />
                  Register Child
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChildFormModal


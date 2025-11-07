import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { growthService, GrowthRecordCreate } from '../services/growthService'
import { X, Calendar, Weight, Ruler, Save, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface GrowthRecordFormProps {
  isOpen: boolean
  onClose: () => void
  childId: number
  childName?: string
  onSuccess?: () => void
}

const GrowthRecordForm = ({ isOpen, onClose, childId, childName, onSuccess }: GrowthRecordFormProps) => {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<GrowthRecordCreate>({
    child_id: childId,
    measurement_date: new Date().toISOString().split('T')[0],
    weight: 0,
    height: undefined,
    head_circumference: undefined,
    mid_upper_arm_circumference: undefined,
    notes: '',
    measured_by: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      setFormData({
        child_id: childId,
        measurement_date: new Date().toISOString().split('T')[0],
        weight: 0,
        height: undefined,
        head_circumference: undefined,
        mid_upper_arm_circumference: undefined,
        notes: '',
        measured_by: '',
      })
      setErrors({})
    }
  }, [isOpen, childId])

  const createMutation = useMutation({
    mutationFn: (data: GrowthRecordCreate) => growthService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['growth', childId] })
      queryClient.invalidateQueries({ queryKey: ['growth'] })
      toast.success('Growth record added successfully!')
      onSuccess?.()
      handleClose()
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to create growth record'
      toast.error(errorMessage)
      if (error.response?.data?.detail) {
        setErrors({ general: errorMessage })
      }
    },
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.measurement_date) {
      newErrors.measurement_date = 'Measurement date is required'
    }
    
    if (!formData.weight || formData.weight <= 0) {
      newErrors.weight = 'Weight is required and must be greater than 0'
    } else if (formData.weight > 200) {
      newErrors.weight = 'Weight must be less than 200 kg'
    }
    
    if (formData.height !== undefined && formData.height !== null && formData.height !== '') {
      if (formData.height <= 0) {
        newErrors.height = 'Height must be greater than 0'
      } else if (formData.height > 250) {
        newErrors.height = 'Height must be less than 250 cm'
      }
    }
    
    if (formData.head_circumference !== undefined && formData.head_circumference !== null && formData.head_circumference !== '') {
      if (formData.head_circumference <= 0) {
        newErrors.head_circumference = 'Head circumference must be greater than 0'
      } else if (formData.head_circumference > 80) {
        newErrors.head_circumference = 'Head circumference must be less than 80 cm'
      }
    }
    
    if (formData.mid_upper_arm_circumference !== undefined && formData.mid_upper_arm_circumference !== null && formData.mid_upper_arm_circumference !== '') {
      if (formData.mid_upper_arm_circumference <= 0) {
        newErrors.mid_upper_arm_circumference = 'MUAC must be greater than 0'
      } else if (formData.mid_upper_arm_circumference > 50) {
        newErrors.mid_upper_arm_circumference = 'MUAC must be less than 50 cm'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' && value !== '' ? parseFloat(value) : value === '' ? undefined : value,
    }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      // Clean up undefined values
      const submitData: GrowthRecordCreate = {
        child_id: formData.child_id,
        measurement_date: formData.measurement_date,
        weight: formData.weight,
        ...(formData.height !== undefined && formData.height !== null && formData.height !== '' ? { height: formData.height } : {}),
        ...(formData.head_circumference !== undefined && formData.head_circumference !== null && formData.head_circumference !== '' ? { head_circumference: formData.head_circumference } : {}),
        ...(formData.mid_upper_arm_circumference !== undefined && formData.mid_upper_arm_circumference !== null && formData.mid_upper_arm_circumference !== '' ? { mid_upper_arm_circumference: formData.mid_upper_arm_circumference } : {}),
        ...(formData.notes ? { notes: formData.notes } : {}),
        ...(formData.measured_by ? { measured_by: formData.measured_by } : {}),
      }
      createMutation.mutate(submitData)
    }
  }

  const handleClose = () => {
    setFormData({
      child_id: childId,
      measurement_date: new Date().toISOString().split('T')[0],
      weight: 0,
      height: undefined,
      head_circumference: undefined,
      mid_upper_arm_circumference: undefined,
      notes: '',
      measured_by: '',
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
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Growth Record</h2>
            {childName && (
              <p className="text-sm text-gray-600 mt-1">For: {childName}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {errors.general}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Measurement Date */}
            <div>
              <label htmlFor="measurement_date" className="block text-sm font-medium text-gray-700 mb-1">
                Measurement Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  id="measurement_date"
                  name="measurement_date"
                  value={formData.measurement_date}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className={`input pl-10 ${errors.measurement_date ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.measurement_date && <p className="mt-1 text-sm text-red-600">{errors.measurement_date}</p>}
            </div>

            {/* Weight */}
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                Weight (kg) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.weight || ''}
                  onChange={handleChange}
                  step="0.1"
                  min="0"
                  max="200"
                  className={`input pl-10 ${errors.weight ? 'border-red-500' : ''}`}
                  placeholder="e.g., 12.5"
                  required
                />
              </div>
              {errors.weight && <p className="mt-1 text-sm text-red-600">{errors.weight}</p>}
            </div>

            {/* Height */}
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
                Height (cm)
              </label>
              <div className="relative">
                <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={formData.height || ''}
                  onChange={handleChange}
                  step="0.1"
                  min="0"
                  max="250"
                  className={`input pl-10 ${errors.height ? 'border-red-500' : ''}`}
                  placeholder="e.g., 85.0"
                />
              </div>
              {errors.height && <p className="mt-1 text-sm text-red-600">{errors.height}</p>}
            </div>

            {/* Head Circumference */}
            <div>
              <label htmlFor="head_circumference" className="block text-sm font-medium text-gray-700 mb-1">
                Head Circumference (cm)
              </label>
              <div className="relative">
                <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  id="head_circumference"
                  name="head_circumference"
                  value={formData.head_circumference || ''}
                  onChange={handleChange}
                  step="0.1"
                  min="0"
                  max="80"
                  className={`input pl-10 ${errors.head_circumference ? 'border-red-500' : ''}`}
                  placeholder="e.g., 45.0"
                />
              </div>
              {errors.head_circumference && <p className="mt-1 text-sm text-red-600">{errors.head_circumference}</p>}
            </div>

            {/* Mid-Upper Arm Circumference */}
            <div>
              <label htmlFor="mid_upper_arm_circumference" className="block text-sm font-medium text-gray-700 mb-1">
                Mid-Upper Arm Circumference (cm)
              </label>
              <div className="relative">
                <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  id="mid_upper_arm_circumference"
                  name="mid_upper_arm_circumference"
                  value={formData.mid_upper_arm_circumference || ''}
                  onChange={handleChange}
                  step="0.1"
                  min="0"
                  max="50"
                  className={`input pl-10 ${errors.mid_upper_arm_circumference ? 'border-red-500' : ''}`}
                  placeholder="e.g., 15.0"
                />
              </div>
              {errors.mid_upper_arm_circumference && <p className="mt-1 text-sm text-red-600">{errors.mid_upper_arm_circumference}</p>}
            </div>

            {/* Measured By */}
            <div>
              <label htmlFor="measured_by" className="block text-sm font-medium text-gray-700 mb-1">
                Measured By
              </label>
              <input
                type="text"
                id="measured_by"
                name="measured_by"
                value={formData.measured_by || ''}
                onChange={handleChange}
                className="input"
                placeholder="e.g., Nurse Jane"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes || ''}
              onChange={handleChange}
              className="input"
              placeholder="Additional notes about this measurement..."
            />
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
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GrowthRecordForm


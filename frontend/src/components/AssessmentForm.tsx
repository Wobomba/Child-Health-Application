import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { assessmentService, AssessmentCreate, AssessmentUpdate, Assessment } from '../services/assessmentService'
import { X, Save, Calendar, Activity, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface AssessmentFormProps {
  isOpen: boolean
  onClose: () => void
  childId: number
  childName?: string
  assessment?: Assessment
}

const AssessmentForm = ({ isOpen, onClose, childId, childName, assessment }: AssessmentFormProps) => {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<AssessmentCreate | AssessmentUpdate>({
    child_id: childId,
    assessment_type: 'routine',
    assessment_date: new Date().toISOString().split('T')[0],
    referral_required: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeSection, setActiveSection] = useState<'basic' | 'vitals' | 'examination' | 'history' | 'diagnosis'>('basic')

  useEffect(() => {
    if (assessment) {
      setFormData({
        child_id: assessment.child_id,
        assessment_type: assessment.assessment_type,
        assessment_date: assessment.assessment_date.split('T')[0],
        weight_kg: assessment.weight_kg,
        height_cm: assessment.height_cm,
        head_circumference_cm: assessment.head_circumference_cm,
        muac_cm: assessment.muac_cm,
        temperature_celsius: assessment.temperature_celsius,
        blood_pressure_systolic: assessment.blood_pressure_systolic,
        blood_pressure_diastolic: assessment.blood_pressure_diastolic,
        heart_rate_bpm: assessment.heart_rate_bpm,
        respiratory_rate: assessment.respiratory_rate,
        oxygen_saturation: assessment.oxygen_saturation,
        general_appearance: assessment.general_appearance,
        skin_condition: assessment.skin_condition,
        eye_condition: assessment.eye_condition,
        ear_condition: assessment.ear_condition,
        nose_condition: assessment.nose_condition,
        throat_condition: assessment.throat_condition,
        chest_condition: assessment.chest_condition,
        abdomen_condition: assessment.abdomen_condition,
        neurological_condition: assessment.neurological_condition,
        musculoskeletal_condition: assessment.musculoskeletal_condition,
        developmental_milestones: assessment.developmental_milestones,
        immunization_status: assessment.immunization_status,
        feeding_history: assessment.feeding_history,
        sleep_patterns: assessment.sleep_patterns,
        behavioral_notes: assessment.behavioral_notes,
        family_history: assessment.family_history,
        social_history: assessment.social_history,
        environmental_factors: assessment.environmental_factors,
        chief_complaint: assessment.chief_complaint,
        history_present_illness: assessment.history_present_illness,
        review_of_systems: assessment.review_of_systems,
        physical_examination: assessment.physical_examination,
        assessment_notes: assessment.assessment_notes,
        diagnosis: assessment.diagnosis,
        treatment_plan: assessment.treatment_plan,
        follow_up_instructions: assessment.follow_up_instructions,
        referral_required: assessment.referral_required,
        referral_details: assessment.referral_details,
        risk_level: assessment.risk_level,
      })
    } else {
      setFormData({
        child_id: childId,
        assessment_type: 'routine',
        assessment_date: new Date().toISOString().split('T')[0],
        referral_required: false,
      })
    }
  }, [assessment, childId])

  const createMutation = useMutation({
    mutationFn: (data: AssessmentCreate) => assessmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] })
      queryClient.invalidateQueries({ queryKey: ['assessments', 'child', childId] })
      toast.success('Assessment created successfully!')
      onClose()
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to create assessment'
      toast.error(errorMessage)
      setErrors({ general: errorMessage })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AssessmentUpdate }) => assessmentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] })
      queryClient.invalidateQueries({ queryKey: ['assessments', assessment?.id] })
      queryClient.invalidateQueries({ queryKey: ['assessments', 'child', childId] })
      toast.success('Assessment updated successfully!')
      onClose()
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to update assessment'
      toast.error(errorMessage)
      setErrors({ general: errorMessage })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (assessment) {
      updateMutation.mutate({ id: assessment.id, data: formData as AssessmentUpdate })
    } else {
      createMutation.mutate(formData as AssessmentCreate)
    }
  }

  if (!isOpen) return null

  const sections = [
    { id: 'basic', name: 'Basic Info', icon: Calendar },
    { id: 'vitals', name: 'Vital Signs', icon: Activity },
    { id: 'examination', name: 'Examination', icon: Activity },
    { id: 'history', name: 'History', icon: Activity },
    { id: 'diagnosis', name: 'Diagnosis', icon: AlertCircle },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {assessment ? 'Edit Assessment' : 'New Health Assessment'}
            </h2>
            {childName && (
              <p className="text-sm text-gray-600 mt-1">For: {childName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {errors.general && (
            <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg">
              <p className="text-sm text-danger-700">{errors.general}</p>
            </div>
          )}

          {/* Section Navigation */}
          <div className="mb-6 flex space-x-2 overflow-x-auto pb-2">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id as any)}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    activeSection === section.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {section.name}
                </button>
              )
            })}
          </div>

          {/* Basic Info Section */}
          {activeSection === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assessment Type *
                  </label>
                  <select
                    required
                    className="input"
                    value={formData.assessment_type}
                    onChange={(e) => setFormData({ ...formData, assessment_type: e.target.value as any })}
                  >
                    <option value="routine">Routine</option>
                    <option value="follow_up">Follow-up</option>
                    <option value="emergency">Emergency</option>
                    <option value="screening">Screening</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assessment Date *
                  </label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={formData.assessment_date}
                    onChange={(e) => setFormData({ ...formData, assessment_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Risk Level
                </label>
                <select
                  className="input"
                  value={formData.risk_level || ''}
                  onChange={(e) => setFormData({ ...formData, risk_level: e.target.value as any || undefined })}
                >
                  <option value="">Select risk level</option>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
          )}

          {/* Vital Signs Section */}
          {activeSection === 'vitals' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    value={formData.weight_kg || ''}
                    onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    value={formData.height_cm || ''}
                    onChange={(e) => setFormData({ ...formData, height_cm: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    MUAC (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    value={formData.muac_cm || ''}
                    onChange={(e) => setFormData({ ...formData, muac_cm: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Head Circumference (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    value={formData.head_circumference_cm || ''}
                    onChange={(e) => setFormData({ ...formData, head_circumference_cm: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    value={formData.temperature_celsius || ''}
                    onChange={(e) => setFormData({ ...formData, temperature_celsius: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heart Rate (bpm)
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={formData.heart_rate_bpm || ''}
                    onChange={(e) => setFormData({ ...formData, heart_rate_bpm: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Respiratory Rate
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={formData.respiratory_rate || ''}
                    onChange={(e) => setFormData({ ...formData, respiratory_rate: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Oxygen Saturation (%)
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={formData.oxygen_saturation || ''}
                    onChange={(e) => setFormData({ ...formData, oxygen_saturation: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blood Pressure (Systolic)
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={formData.blood_pressure_systolic || ''}
                    onChange={(e) => setFormData({ ...formData, blood_pressure_systolic: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blood Pressure (Diastolic)
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={formData.blood_pressure_diastolic || ''}
                    onChange={(e) => setFormData({ ...formData, blood_pressure_diastolic: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Examination Section */}
          {activeSection === 'examination' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  General Appearance
                </label>
                <textarea
                  rows={3}
                  className="input"
                  value={formData.general_appearance || ''}
                  onChange={(e) => setFormData({ ...formData, general_appearance: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skin Condition
                  </label>
                  <textarea
                    rows={2}
                    className="input"
                    value={formData.skin_condition || ''}
                    onChange={(e) => setFormData({ ...formData, skin_condition: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Eye Condition
                  </label>
                  <textarea
                    rows={2}
                    className="input"
                    value={formData.eye_condition || ''}
                    onChange={(e) => setFormData({ ...formData, eye_condition: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chest Condition
                  </label>
                  <textarea
                    rows={2}
                    className="input"
                    value={formData.chest_condition || ''}
                    onChange={(e) => setFormData({ ...formData, chest_condition: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Abdomen Condition
                  </label>
                  <textarea
                    rows={2}
                    className="input"
                    value={formData.abdomen_condition || ''}
                    onChange={(e) => setFormData({ ...formData, abdomen_condition: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Physical Examination Notes
                </label>
                <textarea
                  rows={4}
                  className="input"
                  value={formData.physical_examination || ''}
                  onChange={(e) => setFormData({ ...formData, physical_examination: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* History Section */}
          {activeSection === 'history' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chief Complaint
                </label>
                <textarea
                  rows={2}
                  className="input"
                  value={formData.chief_complaint || ''}
                  onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  History of Present Illness
                </label>
                <textarea
                  rows={3}
                  className="input"
                  value={formData.history_present_illness || ''}
                  onChange={(e) => setFormData({ ...formData, history_present_illness: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Feeding History
                  </label>
                  <textarea
                    rows={3}
                    className="input"
                    value={formData.feeding_history || ''}
                    onChange={(e) => setFormData({ ...formData, feeding_history: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Family History
                  </label>
                  <textarea
                    rows={3}
                    className="input"
                    value={formData.family_history || ''}
                    onChange={(e) => setFormData({ ...formData, family_history: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Immunization Status
                </label>
                <textarea
                  rows={2}
                  className="input"
                  value={formData.immunization_status || ''}
                  onChange={(e) => setFormData({ ...formData, immunization_status: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Diagnosis Section */}
          {activeSection === 'diagnosis' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnosis
                </label>
                <textarea
                  rows={3}
                  className="input"
                  value={formData.diagnosis || ''}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Treatment Plan
                </label>
                <textarea
                  rows={4}
                  className="input"
                  value={formData.treatment_plan || ''}
                  onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Follow-up Instructions
                </label>
                <textarea
                  rows={3}
                  className="input"
                  value={formData.follow_up_instructions || ''}
                  onChange={(e) => setFormData({ ...formData, follow_up_instructions: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="referral_required"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={formData.referral_required || false}
                  onChange={(e) => setFormData({ ...formData, referral_required: e.target.checked })}
                />
                <label htmlFor="referral_required" className="text-sm font-medium text-gray-700">
                  Referral Required
                </label>
              </div>
              {formData.referral_required && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referral Details
                  </label>
                  <textarea
                    rows={3}
                    className="input"
                    value={formData.referral_details || ''}
                    onChange={(e) => setFormData({ ...formData, referral_details: e.target.value })}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assessment Notes
                </label>
                <textarea
                  rows={4}
                  className="input"
                  value={formData.assessment_notes || ''}
                  onChange={(e) => setFormData({ ...formData, assessment_notes: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  {assessment ? 'Update Assessment' : 'Create Assessment'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AssessmentForm


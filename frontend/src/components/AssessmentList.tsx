import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { assessmentService, Assessment } from '../services/assessmentService'
import { Calendar, Activity, AlertCircle, Eye, Edit, Trash2, Plus } from 'lucide-react'
import StatusBadge from './StatusBadge'
import RiskIndicator from './RiskIndicator'
import AssessmentForm from './AssessmentForm'
import toast from 'react-hot-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface AssessmentListProps {
  childId: number
  childName?: string
}

const AssessmentList = ({ childId, childName }: AssessmentListProps) => {
  const [showForm, setShowForm] = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null)
  const [viewingAssessment, setViewingAssessment] = useState<Assessment | null>(null)
  const queryClient = useQueryClient()

  const { data: assessments, isLoading } = useQuery({
    queryKey: ['assessments', 'child', childId],
    queryFn: () => assessmentService.getAll({ child_id: childId }),
    enabled: !!childId,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => assessmentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] })
      queryClient.invalidateQueries({ queryKey: ['assessments', 'child', childId] })
      toast.success('Assessment deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete assessment')
    },
  })

  const handleEdit = (assessment: Assessment) => {
    setSelectedAssessment(assessment)
    setShowForm(true)
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this assessment?')) {
      deleteMutation.mutate(id)
    }
  }

  const getAssessmentTypeColor = (type: string) => {
    switch (type) {
      case 'emergency':
        return 'bg-red-100 text-red-800'
      case 'follow_up':
        return 'bg-yellow-100 text-yellow-800'
      case 'screening':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assessments...</p>
        </div>
      </div>
    )
  }

  if (!assessments || assessments.items.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 mb-4">No health assessments recorded yet</p>
        <button
          onClick={() => {
            setSelectedAssessment(null)
            setShowForm(true)
          }}
          className="btn btn-primary"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create First Assessment
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Health Assessments</h3>
          <p className="text-sm text-gray-500 mt-1">
            {assessments.items.length} assessment{assessments.items.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedAssessment(null)
            setShowForm(true)
          }}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Assessment
        </button>
      </div>

      <div className="space-y-4">
        {assessments.items.map((assessment) => (
          <div
            key={assessment.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getAssessmentTypeColor(
                      assessment.assessment_type
                    )}`}
                  >
                    {assessment.assessment_type.replace('_', ' ').toUpperCase()}
                  </span>
                  {assessment.risk_level && (
                    <RiskIndicator riskLevel={assessment.risk_level} size="sm" />
                  )}
                  <StatusBadge
                    status={
                      assessment.status === 'completed'
                        ? 'low'
                        : assessment.status === 'in_progress'
                        ? 'medium'
                        : 'high'
                    }
                    size="sm"
                  />
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(assessment.assessment_date).toLocaleDateString()}
                  </div>
                  {assessment.temperature_celsius && (
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 mr-1" />
                      Temp: {assessment.temperature_celsius}°C
                    </div>
                  )}
                  {assessment.weight_kg && (
                    <div>Weight: {assessment.weight_kg} kg</div>
                  )}
                  {assessment.height_cm && (
                    <div>Height: {assessment.height_cm} cm</div>
                  )}
                </div>

                {assessment.chief_complaint && (
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Chief Complaint:</span> {assessment.chief_complaint}
                  </p>
                )}

                {assessment.diagnosis && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Diagnosis:</span> {assessment.diagnosis}
                  </p>
                )}

                {assessment.referral_required && (
                  <div className="mt-3 flex items-center text-sm text-orange-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Referral Required
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => setViewingAssessment(assessment)}
                  className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title="View Details"
                >
                  <Eye className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleEdit(assessment)}
                  className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(assessment.id)}
                  className="p-2 text-gray-600 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                  title="Delete"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Assessment Form Modal */}
      <AssessmentForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setSelectedAssessment(null)
        }}
        childId={childId}
        childName={childName}
        assessment={selectedAssessment || undefined}
      />

      {/* Assessment Detail View */}
      {viewingAssessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Assessment Details</h2>
              <button
                onClick={() => setViewingAssessment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Assessment Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Assessment Type</p>
                  <p className="font-medium">{viewingAssessment.assessment_type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">
                    {new Date(viewingAssessment.assessment_date).toLocaleDateString()}
                  </p>
                </div>
                {viewingAssessment.risk_level && (
                  <div>
                    <p className="text-sm text-gray-500">Risk Level</p>
                    <RiskIndicator riskLevel={viewingAssessment.risk_level} size="sm" />
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <StatusBadge
                    status={
                      viewingAssessment.status === 'completed'
                        ? 'low'
                        : viewingAssessment.status === 'in_progress'
                        ? 'medium'
                        : 'high'
                    }
                    size="sm"
                  />
                </div>
              </div>

              {/* Vital Signs */}
              {(viewingAssessment.weight_kg ||
                viewingAssessment.height_cm ||
                viewingAssessment.temperature_celsius) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Vital Signs</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {viewingAssessment.weight_kg && (
                      <div>
                        <p className="text-sm text-gray-500">Weight</p>
                        <p className="font-medium">{viewingAssessment.weight_kg} kg</p>
                      </div>
                    )}
                    {viewingAssessment.height_cm && (
                      <div>
                        <p className="text-sm text-gray-500">Height</p>
                        <p className="font-medium">{viewingAssessment.height_cm} cm</p>
                      </div>
                    )}
                    {viewingAssessment.temperature_celsius && (
                      <div>
                        <p className="text-sm text-gray-500">Temperature</p>
                        <p className="font-medium">{viewingAssessment.temperature_celsius}°C</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Chief Complaint */}
              {viewingAssessment.chief_complaint && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Chief Complaint</h3>
                  <p className="text-gray-700">{viewingAssessment.chief_complaint}</p>
                </div>
              )}

              {/* Diagnosis */}
              {viewingAssessment.diagnosis && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Diagnosis</h3>
                  <p className="text-gray-700">{viewingAssessment.diagnosis}</p>
                </div>
              )}

              {/* Treatment Plan */}
              {viewingAssessment.treatment_plan && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Treatment Plan</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{viewingAssessment.treatment_plan}</p>
                </div>
              )}

              {/* Assessment Notes */}
              {viewingAssessment.assessment_notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{viewingAssessment.assessment_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssessmentList


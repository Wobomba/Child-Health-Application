import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Calendar, Camera, BarChart3, Activity, Clock } from 'lucide-react'
import { photoService } from '../services/photoService'
import { growthService } from '../services/growthService'
import { assessmentService } from '../services/assessmentService'

interface ChildHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  childId: number
  childName: string
}

interface HistoryItem {
  id: string
  type: 'photo' | 'growth' | 'assessment'
  date: string
  title: string
  description: string
  icon: typeof Camera
}

const ChildHistoryModal = ({ isOpen, onClose, childId, childName }: ChildHistoryModalProps) => {
  const [filter, setFilter] = useState<'all' | 'photo' | 'growth' | 'assessment'>('all')

  const { data: photos } = useQuery({
    queryKey: ['photos', 'child', childId],
    queryFn: () => photoService.getAll({ child_id: childId }),
    enabled: isOpen && childId > 0,
  })

  const { data: growthRecords } = useQuery({
    queryKey: ['growth', 'child', childId],
    queryFn: () => growthService.getByChildId(childId, { per_page: 100 }),
    enabled: isOpen && childId > 0,
  })

  const { data: assessments } = useQuery({
    queryKey: ['assessments', 'child', childId],
    queryFn: () => assessmentService.getAll({ child_id: childId }),
    enabled: isOpen && childId > 0,
  })

  if (!isOpen) return null

  // Combine all history items
  const historyItems: HistoryItem[] = []

  // Add photos
  photos?.items?.forEach((photo) => {
    historyItems.push({
      id: `photo-${photo.id}`,
      type: 'photo',
      date: photo.created_at,
      title: 'Photo Uploaded',
      description: photo.malnutrition_score !== null 
        ? `Malnutrition Score: ${Math.round(photo.malnutrition_score * 100)}%`
        : 'Analysis pending',
      icon: Camera,
    })
  })

  // Add growth records
  growthRecords?.records?.forEach((record) => {
    historyItems.push({
      id: `growth-${record.id}`,
      type: 'growth',
      date: record.measurement_date,
      title: 'Growth Measurement',
      description: `Weight: ${record.weight}kg${record.height ? `, Height: ${record.height}cm` : ''}${record.bmi ? `, BMI: ${record.bmi.toFixed(2)}` : ''}`,
      icon: BarChart3,
    })
  })

  // Add assessments
  assessments?.items?.forEach((assessment) => {
    historyItems.push({
      id: `assessment-${assessment.id}`,
      type: 'assessment',
      date: assessment.assessment_date,
      title: `${assessment.assessment_type?.replace('_', ' ').toUpperCase() || 'Health'} Assessment`,
      description: assessment.diagnosis || assessment.chief_complaint || 'Health assessment completed',
      icon: Activity,
    })
  })

  // Sort by date (newest first)
  historyItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Filter items
  const filteredItems = filter === 'all' 
    ? historyItems 
    : historyItems.filter(item => item.type === filter)

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'photo':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'growth':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'assessment':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Activity History</h2>
            <p className="text-sm text-gray-500 mt-1">{childName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex space-x-2">
            {(['all', 'photo', 'growth', 'assessment'] as const).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterType
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {filterType === 'all' ? 'All' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No history found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.id}
                    className={`flex items-start space-x-4 p-4 rounded-lg border-2 ${getTypeColor(item.type)}`}
                  >
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(item.type)}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-900">{item.title}</h4>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(item.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Total: {filteredItems.length} {filter === 'all' ? 'items' : filter + 's'}</span>
            <button
              onClick={onClose}
              className="btn btn-primary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChildHistoryModal


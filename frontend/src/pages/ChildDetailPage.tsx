import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { childService } from '../services/childService'
import { photoService } from '../services/photoService'
import { ArrowLeft, Camera, User, Calendar, MapPin, Users, Activity, BarChart3, Weight, Ruler, Utensils, AlertCircle } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import RiskIndicator from '../components/RiskIndicator'
import PhotoUploadModal from '../components/PhotoUploadModal'
import PhotoLightbox from '../components/PhotoLightbox'
import GrowthChart from '../components/GrowthChart'
import GrowthRecordForm from '../components/GrowthRecordForm'
import AssessmentList from '../components/AssessmentList'
import ChildHistoryModal from '../components/ChildHistoryModal'
import { growthService } from '../services/growthService'

const ChildDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'growth' | 'assessments'>('overview')
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [showGrowthForm, setShowGrowthForm] = useState(false)
  const [showAssessmentForm, setShowAssessmentForm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const { data: child, isLoading } = useQuery({
    queryKey: ['child', id],
    queryFn: () => childService.getById(Number(id)),
    enabled: !!id,
  })

  const { data: photos } = useQuery({
    queryKey: ['photos', 'child', id],
    queryFn: () => photoService.getAll({ child_id: Number(id) }),
    enabled: !!id,
  })

  const { data: growthRecords } = useQuery({
    queryKey: ['growth', 'child', id],
    queryFn: () => growthService.getByChildId(Number(id), { per_page: 100 }),
    enabled: !!id,
  })

  // Calculate overall risk from latest photo
  const latestPhoto = photos?.items?.[0]
  const overallRisk = latestPhoto?.malnutrition_score || null
  const riskLevel = overallRisk !== null
    ? (overallRisk > 0.6 ? 'high' : overallRisk > 0.3 ? 'medium' : 'low')
    : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading child information...</p>
        </div>
      </div>
    )
  }

  if (!child) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Child not found</p>
        <button
          onClick={() => navigate('/children')}
          className="mt-4 btn btn-secondary"
        >
          Back to Children
        </button>
      </div>
    )
  }

  const tabs = [
    { id: 'overview' as const, name: 'Overview', icon: User },
    { id: 'photos' as const, name: 'Photos', icon: Camera },
    { id: 'growth' as const, name: 'Growth', icon: BarChart3 },
    { id: 'assessments' as const, name: 'Assessments', icon: Activity },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/children')}
          className="mb-4 text-primary-600 hover:text-primary-800 flex items-center text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Children
        </button>

        {/* Child Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {child.first_name} {child.last_name}
                </h1>
                <p className="mt-1 text-sm text-gray-500">ID: {child.unique_id}</p>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(child.date_of_birth).toLocaleDateString()}
                  </span>
                  <span className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {child.village}, {child.district}
                  </span>
                </div>
              </div>
            </div>
            {riskLevel && (
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-2">Current Risk Level</p>
                <StatusBadge status={riskLevel} size="lg" />
                {overallRisk !== null && (
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {Math.round(overallRisk * 100)}%
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${isActive
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Child Information */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2 text-primary-600" />
                    Personal Information
                  </h3>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                      <dd className="mt-1 text-base text-gray-900">
                        {new Date(child.date_of_birth).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Gender</dt>
                      <dd className="mt-1 text-base text-gray-900 capitalize">{child.gender}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Parent/Guardian</dt>
                      <dd className="mt-1 text-base text-gray-900">{child.parent_name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Location</dt>
                      <dd className="mt-1 text-base text-gray-900 flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                        {child.village}, {child.district}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Health Summary */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-primary-600" />
                    Health Summary
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Total Photos</p>
                      <p className="text-2xl font-bold text-gray-900">{photos?.items?.length || 0}</p>
                    </div>
                    {latestPhoto && latestPhoto.malnutrition_score !== null && (
                      <div>
                        <RiskIndicator score={latestPhoto.malnutrition_score} />
                      </div>
                    )}
                    {!latestPhoto && (
                      <p className="text-sm text-gray-500">No analysis data available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Nutrition Recommendations - Prominently Displayed */}
              {latestPhoto && (latestPhoto.nutrition_tips || latestPhoto.recommendations) && (
                <div className="bg-gradient-to-r from-primary-50 to-pink-50 rounded-lg border-2 border-primary-200 p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Utensils className="h-6 w-6 text-primary-600" />
                    <h3 className="text-lg font-semibold text-gray-900">🍽️ Nutrition & Meal Recommendations</h3>
                  </div>
                  
                  {latestPhoto.nutrition_tips && Array.isArray(latestPhoto.nutrition_tips) && latestPhoto.nutrition_tips.length > 0 && (
                    <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                      {latestPhoto.nutrition_tips.map((tip: string, index: number) => (
                        <div
                          key={index}
                          className={`text-sm ${
                            tip.startsWith('For') || tip.startsWith('URGENT') || tip.startsWith('⚠️') || tip.startsWith('🍽️')
                              ? 'font-semibold text-primary-800 bg-white px-3 py-2 rounded border-l-4 border-primary-500'
                              : tip.startsWith('•')
                              ? 'text-gray-700 ml-4 pl-2'
                              : tip.startsWith('📋')
                              ? 'font-semibold text-gray-800 mt-2'
                              : 'text-gray-600'
                          }`}
                        >
                          {tip}
                        </div>
                      ))}
                    </div>
                  )}

                  {latestPhoto.recommendations && Array.isArray(latestPhoto.recommendations) && latestPhoto.recommendations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-primary-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Medical Recommendations:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {latestPhoto.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="text-sm text-gray-700">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-primary-200">
                    <p className="text-xs text-gray-600">
                      💡 Click on a photo to view detailed analysis including detected diseases and potential consequences
                    </p>
                  </div>
                </div>
              )}

              {/* Detected Diseases Summary */}
              {latestPhoto && latestPhoto.detected_diseases && Array.isArray(latestPhoto.detected_diseases) && latestPhoto.detected_diseases.length > 0 && (
                <div className="bg-warning-50 rounded-lg border border-warning-200 p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <AlertCircle className="h-6 w-6 text-warning-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Detected Conditions</h3>
                  </div>
                  <div className="space-y-3">
                    {latestPhoto.detected_diseases.map((disease: any, index: number) => (
                      <div key={index} className="bg-white rounded-lg p-3 border-l-4 border-warning-500">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-gray-900 capitalize">
                            {typeof disease === 'string' ? disease : disease.disease?.replace(/_/g, ' ')}
                          </span>
                          {typeof disease === 'object' && disease.confidence && (
                            <span className="text-xs bg-warning-100 text-warning-800 px-2 py-1 rounded">
                              {Math.round(disease.confidence * 100)}% confidence
                            </span>
                          )}
                        </div>
                        {typeof disease === 'object' && disease.description && (
                          <p className="text-xs text-gray-600 mt-1">{disease.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Photo Analysis</h3>
                  <p className="text-sm text-gray-500 mt-1">View and analyze child photos</p>
                </div>
                <button 
                  onClick={() => setShowPhotoUpload(true)}
                  className="btn btn-primary flex items-center"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  <span>Upload Photo</span>
                </button>
              </div>
              {photos?.items?.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">No photos uploaded yet</p>
                  <button 
                    onClick={() => setShowPhotoUpload(true)}
                    className="btn btn-primary flex items-center"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    <span>Upload First Photo</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {photos?.items?.map((photo: any, index: number) => {
                      const photoRisk = photo.malnutrition_score !== null
                        ? (photo.malnutrition_score > 0.6 ? 'high' : photo.malnutrition_score > 0.3 ? 'medium' : 'low')
                        : null
                      return (
                        <div
                          key={photo.id}
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                          onClick={() => {
                            setLightboxIndex(index)
                            setLightboxOpen(true)
                          }}
                        >
                          <div className="relative overflow-hidden">
                            <img
                              src={photoService.getPhotoUrl(photo)}
                              alt={photo.filename || photo.file_name || 'Photo'}
                              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                              <Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            {photoRisk && (
                              <div className="absolute top-2 right-2">
                                <StatusBadge status={photoRisk} size="sm" />
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <p className="text-sm font-medium text-gray-900 truncate mb-1">{photo.filename || photo.file_name || 'Photo'}</p>
                            <p className="text-xs text-gray-500 mb-3 capitalize">
                              {photo.analysis_status === 'completed' ? 'Analysis Complete' : 'Pending'}
                            </p>
                            {photo.malnutrition_score !== null && (
                              <RiskIndicator score={photo.malnutrition_score} showLabel={false} />
                            )}
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(photo.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {photos?.items && photos.items.length > 0 && (
                    <PhotoLightbox
                      photos={photos.items}
                      currentIndex={lightboxIndex}
                      isOpen={lightboxOpen}
                      onClose={() => setLightboxOpen(false)}
                      getPhotoUrl={(photo) => photoService.getPhotoUrl(photo)}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'growth' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Growth Tracking</h3>
                  <p className="text-sm text-gray-500 mt-1">Monitor weight, height, and BMI trends over time</p>
                </div>
                <button
                  onClick={() => setShowGrowthForm(true)}
                  className="btn btn-primary flex items-center"
                >
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Add Growth Record
                </button>
              </div>
              
              {child && (
                <>
                  {/* Growth Charts */}
                  <div className="space-y-6">
                    <GrowthChart childId={child.id} type="weight" />
                    <GrowthChart childId={child.id} type="height" />
                    <GrowthChart childId={child.id} type="bmi" />
                  </div>

                  {/* Growth Records Table */}
                  {growthRecords && growthRecords.records.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
                      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-900">Growth Records History</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight (kg)</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Height (cm)</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">BMI</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Measured By</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {growthRecords.records.map((record: any) => (
                              <tr key={record.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {new Date(record.measurement_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div className="flex items-center">
                                    <Weight className="h-4 w-4 mr-1 text-gray-400" />
                                    {record.weight.toFixed(2)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {record.height ? (
                                    <div className="flex items-center">
                                      <Ruler className="h-4 w-4 mr-1 text-gray-400" />
                                      {record.height.toFixed(1)}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {record.bmi ? record.bmi.toFixed(2) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {record.overall_status && (
                                    <StatusBadge
                                      status={
                                        record.overall_status === 'malnourished' ? 'high' :
                                        record.overall_status === 'normal' ? 'low' : 'medium'
                                      }
                                      size="sm"
                                    />
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {record.measured_by || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'assessments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Health Assessments</h3>
                  <p className="text-sm text-gray-500 mt-1">Comprehensive health evaluations and clinical assessments</p>
                </div>
              </div>
              {child && (
                <AssessmentList
                  childId={child.id}
                  childName={`${child.first_name} ${child.last_name}`}
                  openFormOnMount={showAssessmentForm}
                  onFormClose={() => setShowAssessmentForm(false)}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Sidebar - Always Visible */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2 text-primary-600" />
          Quick Actions
        </h3>
        <div className="space-y-3">
          <button 
            onClick={() => setShowGrowthForm(true)}
            className="btn btn-primary w-full justify-center"
          >
            Record Growth
          </button>
          <button 
            onClick={() => {
              setActiveTab('assessments')
              setShowAssessmentForm(true)
            }}
            className="btn btn-secondary w-full justify-center"
          >
            Add Assessment
          </button>
          <button 
            onClick={() => setShowHistory(true)}
            className="btn btn-secondary w-full justify-center"
          >
            View History
          </button>
        </div>
      </div>

      {/* Photo Upload Modal */}
      {child && (
        <PhotoUploadModal
          isOpen={showPhotoUpload}
          onClose={() => setShowPhotoUpload(false)}
          childId={child.id}
          childName={`${child.first_name} ${child.last_name}`}
        />
      )}

      {/* Growth Record Form Modal */}
      {child && (
        <GrowthRecordForm
          isOpen={showGrowthForm}
          onClose={() => setShowGrowthForm(false)}
          childId={child.id}
          childName={`${child.first_name} ${child.last_name}`}
        />
      )}

      {/* History Modal */}
      {child && (
        <ChildHistoryModal
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          childId={child.id}
          childName={`${child.first_name} ${child.last_name}`}
        />
      )}
    </div>
  )
}

export default ChildDetailPage


import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { photoService, Photo } from '../services/photoService'
import { childService } from '../services/childService'
import { Upload, Search, RefreshCw, Filter, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import StatusBadge from '../components/StatusBadge'
import RiskIndicator from '../components/RiskIndicator'
import { useNavigate } from 'react-router-dom'
import { exportPhotos } from '../utils/exportUtils'
import LoadingSkeleton from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'

const PhotosPage = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRisk, setFilterRisk] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['photos', searchTerm],
    queryFn: () => photoService.getAll({ limit: 50 }),
  })

  const { data: childrenData } = useQuery({
    queryKey: ['children', 'all'],
    queryFn: () => childService.getAll({ limit: 1000 }),
  })

  const [analyzingPhotoId, setAnalyzingPhotoId] = useState<number | null>(null)

  const analyzeMutation = useMutation({
    mutationFn: (id: number) => {
      setAnalyzingPhotoId(id)
      return photoService.analyze(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] })
      toast.success('Analysis started')
      setAnalyzingPhotoId(null)
    },
    onError: () => {
      toast.error('Failed to analyze photo')
      setAnalyzingPhotoId(null)
    },
  })

  // Filter photos by risk level
  const filteredPhotos = data?.items?.filter((photo: Photo) => {
    if (filterRisk === 'all') return true
    if (photo.malnutrition_score === null) return false
    const riskLevel = photo.malnutrition_score > 0.6 ? 'high' : photo.malnutrition_score > 0.3 ? 'medium' : 'low'
    return riskLevel === filterRisk
  }) || []

  // Calculate statistics
  const stats = {
    total: data?.total || 0,
    highRisk: data?.items?.filter((p: Photo) => p.malnutrition_score && p.malnutrition_score > 0.6).length || 0,
    mediumRisk: data?.items?.filter((p: Photo) => p.malnutrition_score && p.malnutrition_score > 0.3 && p.malnutrition_score <= 0.6).length || 0,
    lowRisk: data?.items?.filter((p: Photo) => p.malnutrition_score && p.malnutrition_score <= 0.3).length || 0,
    pending: data?.items?.filter((p: Photo) => p.analysis_status !== 'completed').length || 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Photo Analysis</h1>
          <p className="mt-2 text-base text-gray-600">
            Upload and analyze child photos to assess nutritional status
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {data?.items && data.items.length > 0 && (
            <button
              onClick={() => {
                exportPhotos(data.items, childrenData?.items || [])
                toast.success('Photos data exported successfully!')
              }}
              className="btn btn-secondary flex items-center"
            >
              <Download className="h-5 w-5 mr-2" />
              <span>Export</span>
            </button>
          )}
          <button 
            onClick={() => {
              toast.error('Please select a child first. Go to Children page to add a child, then upload their photo.')
              navigate('/children')
            }}
            className="btn btn-primary flex items-center"
          >
            <Upload className="h-5 w-5 mr-2" />
            <span>Upload Photo</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Photos</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-danger-50 rounded-lg border border-danger-200 p-4">
          <p className="text-sm text-danger-700 mb-1">High Risk</p>
          <p className="text-2xl font-bold text-danger-700">{stats.highRisk}</p>
        </div>
        <div className="bg-warning-50 rounded-lg border border-warning-200 p-4">
          <p className="text-sm text-warning-700 mb-1">Medium Risk</p>
          <p className="text-2xl font-bold text-warning-700">{stats.mediumRisk}</p>
        </div>
        <div className="bg-success-50 rounded-lg border border-success-200 p-4">
          <p className="text-sm text-success-700 mb-1">Low Risk</p>
          <p className="text-2xl font-bold text-success-700">{stats.lowRisk}</p>
        </div>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search photos by filename..."
              className="input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value as any)}
              className="input"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Photos Grid */}
      {isLoading ? (
        <LoadingSkeleton type="card" count={6} />
      ) : filteredPhotos.length === 0 ? (
        <EmptyState
          icon={Upload}
          title="No photos found"
          description={
            filterRisk !== 'all' 
              ? `No photos with ${filterRisk} risk level found. Try adjusting your filters.`
              : 'Upload your first photo to get started with AI-powered malnutrition detection.'
          }
          action={
            filterRisk === 'all' && (
              <button
                onClick={() => navigate('/children')}
                className="btn btn-primary"
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload Photo
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo: Photo) => {
            const riskLevel = photo.malnutrition_score !== null
              ? (photo.malnutrition_score > 0.6 ? 'high' : photo.malnutrition_score > 0.3 ? 'medium' : 'low')
              : null
            
            // Find child info for this photo
            const child = childrenData?.items?.find((c: any) => c.id === photo.child_id)
            const childName = child ? `${child.first_name} ${child.last_name}` : 'Unknown Child'
            
            return (
              <div 
                key={photo.id} 
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
                onClick={() => navigate(`/children/${photo.child_id}`)}
              >
                <div className="relative">
                  <img
                    src={photoService.getPhotoUrl(photo)}
                    alt={childName}
                    className="w-full h-56 object-cover"
                    onError={(e) => {
                      // Fallback if image fails to load
                      const target = e.target as HTMLImageElement
                      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16" fill="%239ca3af"%3EImage not available%3C/text%3E%3C/svg%3E'
                    }}
                  />
                  {riskLevel && (
                    <div className="absolute top-3 right-3">
                      <StatusBadge 
                        status={riskLevel} 
                        label={riskLevel === 'high' ? 'High Risk' : riskLevel === 'medium' ? 'Medium' : 'Normal'}
                        size="sm"
                      />
                    </div>
                  )}
                  {photo.analysis_status !== 'completed' && (
                    <div className="absolute top-3 left-3">
                      <StatusBadge status="warning" label="Pending" size="sm" />
                    </div>
                  )}
                </div>
                
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 truncate mb-1">{childName}</h3>
                  <p className="text-xs text-gray-500 truncate mb-2">{photo.filename || photo.file_name || 'Photo'}</p>
                  
                  {photo.analysis_status === 'completed' && photo.malnutrition_score !== null ? (
                    <div className="space-y-3">
                      <RiskIndicator score={photo.malnutrition_score} />
                      {photo.confidence_level && (
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>AI Confidence</span>
                            <span className="font-medium">{Math.round(photo.confidence_level * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div
                              className="bg-primary-500 h-1.5 rounded-full"
                              style={{ width: `${photo.confidence_level * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-500">
                        {photo.analysis_status === 'pending' ? 'Analysis pending...' : 'Ready for analysis'}
                      </p>
                      <button
                        onClick={() => analyzeMutation.mutate(photo.id)}
                        disabled={analyzingPhotoId !== null}
                        className="btn btn-primary w-full text-sm"
                      >
                        {analyzingPhotoId === photo.id ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Start Analysis
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PhotosPage


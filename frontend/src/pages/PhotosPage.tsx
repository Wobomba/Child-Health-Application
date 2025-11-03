import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { photoService, Photo } from '../services/photoService'
import { Upload, Search, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const PhotosPage = () => {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['photos', searchTerm],
    queryFn: () => photoService.getAll({ limit: 50 }),
  })

  const analyzeMutation = useMutation({
    mutationFn: (id: number) => photoService.analyze(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] })
      toast.success('Analysis started')
    },
    onError: () => {
      toast.error('Failed to analyze photo')
    },
  })

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Photos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload and analyze child photos for malnutrition detection
          </p>
        </div>
        <button className="btn btn-primary">
          <Upload className="h-5 w-5 mr-2" />
          Upload Photo
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search photos..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Photos Grid */}
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : data?.items?.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No photos found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.items?.map((photo: Photo) => (
            <div key={photo.id} className="card">
              <div className="aspect-w-16 aspect-h-9 mb-4">
                <img
                  src={photoService.getPhotoUrl(photo)}
                  alt={photo.file_name}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              <div>
                <h3 className="font-medium text-sm truncate">{photo.file_name}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Status: <span className="capitalize">{photo.analysis_status}</span>
                </p>
                
                {photo.analysis_status === 'completed' && (
                  <div className="mt-4 space-y-2">
                    {photo.malnutrition_score !== null && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Malnutrition Score:</span>
                          <span className={`font-medium ${
                            photo.malnutrition_score > 0.6 ? 'text-red-600' :
                            photo.malnutrition_score > 0.3 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {(photo.malnutrition_score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              photo.malnutrition_score > 0.6 ? 'bg-red-600' :
                              photo.malnutrition_score > 0.3 ? 'bg-yellow-600' : 'bg-green-600'
                            }`}
                            style={{ width: `${photo.malnutrition_score * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {photo.confidence_level && (
                      <p className="text-xs text-gray-500">
                        Confidence: {(photo.confidence_level * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4 flex space-x-2">
                  {photo.analysis_status !== 'completed' && (
                    <button
                      onClick={() => analyzeMutation.mutate(photo.id)}
                      disabled={analyzeMutation.isPending}
                      className="btn btn-secondary flex-1 text-sm"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Analyze
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PhotosPage


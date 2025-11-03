import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { childService } from '../services/childService'
import { photoService } from '../services/photoService'
import { ArrowLeft, Camera, Calendar } from 'lucide-react'

const ChildDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

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

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!child) {
    return <div className="text-center py-8">Child not found</div>
  }

  return (
    <div>
      <button
        onClick={() => navigate('/children')}
        className="mb-4 text-primary-600 hover:text-primary-800 flex items-center"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Children
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {child.first_name} {child.last_name}
        </h1>
        <p className="mt-1 text-sm text-gray-500">ID: {child.unique_id}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Child Information */}
        <div className="lg:col-span-2">
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">Child Information</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(child.date_of_birth).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Gender</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{child.gender}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Parent/Guardian</dt>
                <dd className="mt-1 text-sm text-gray-900">{child.parent_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Village</dt>
                <dd className="mt-1 text-sm text-gray-900">{child.village}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">District</dt>
                <dd className="mt-1 text-sm text-gray-900">{child.district}</dd>
              </div>
            </dl>
          </div>

          {/* Photos */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Photos</h2>
              <button className="btn btn-primary">
                <Camera className="h-5 w-5 mr-2" />
                Upload Photo
              </button>
            </div>
            {photos?.items?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No photos uploaded yet</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos?.items?.map((photo: any) => (
                  <div key={photo.id} className="border rounded-lg overflow-hidden">
                    <img
                      src={photoService.getPhotoUrl(photo)}
                      alt={photo.file_name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-3">
                      <p className="text-sm font-medium truncate">{photo.file_name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Status: {photo.analysis_status}
                      </p>
                      {photo.malnutrition_score !== null && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs">
                            <span>Risk Score:</span>
                            <span className={`font-medium ${
                              photo.malnutrition_score > 0.6 ? 'text-red-600' :
                              photo.malnutrition_score > 0.3 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {(photo.malnutrition_score * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="btn btn-primary w-full">Record Growth</button>
              <button className="btn btn-secondary w-full">Add Assessment</button>
              <button className="btn btn-secondary w-full">View History</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChildDetailPage


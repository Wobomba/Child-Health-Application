import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { childService, Child } from '../services/childService'
import { Plus, Search, Edit, Trash2, Eye, Camera, Download, CheckSquare, Square, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import ChildFormModal from '../components/ChildFormModal'
import PhotoUploadModal from '../components/PhotoUploadModal'
import { exportChildren } from '../utils/exportUtils'
import LoadingSkeleton from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'
import BulkActions from '../components/BulkActions'

const ChildrenPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null)
  const [selectedChildName, setSelectedChildName] = useState<string>('')
  const [selectedChildren, setSelectedChildren] = useState<number[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ['children', searchTerm],
    queryFn: () => childService.getAll({ search: searchTerm || undefined }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => childService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] })
      toast.success('Child deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete child')
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map(id => childService.delete(id)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] })
      setSelectedChildren([])
    },
  })

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Children</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage child records and view their nutritional status
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {data?.items && data.items.length > 0 && (
            <button
              onClick={() => {
                exportChildren(data.items)
                toast.success('Children data exported successfully!')
              }}
              className="btn btn-secondary flex items-center"
            >
              <Download className="h-5 w-5 mr-2" />
              <span>Export</span>
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            <span>Add Child</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search children..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {data?.items && data.items.length > 0 && (
        <BulkActions
          items={data.items}
          selectedItems={selectedChildren}
          onSelectionChange={setSelectedChildren}
          onBulkDelete={bulkDeleteMutation.mutateAsync}
          onBulkExport={(items) => {
            exportChildren(items)
            toast.success('Selected children exported!')
          }}
          getItemId={(child) => child.id}
          itemName="children"
        />
      )}

      {/* Table */}
      <div className="card">
        {isLoading ? (
          <LoadingSkeleton type="table" count={5} />
        ) : data?.items?.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No children found"
            description={searchTerm ? "Try adjusting your search criteria" : "Get started by adding your first child"}
            action={
              !searchTerm && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add First Child
                </button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <button
                      onClick={() => {
                        if (selectedChildren.length === data?.items?.length) {
                          setSelectedChildren([])
                        } else {
                          setSelectedChildren(data?.items?.map(c => c.id) || [])
                        }
                      }}
                      className="flex items-center"
                    >
                      {selectedChildren.length === data?.items?.length && data?.items?.length > 0 ? (
                        <CheckSquare className="h-5 w-5 text-primary-600" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Child ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Village
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    District
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.items?.map((child: Child) => (
                  <tr key={child.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          if (selectedChildren.includes(child.id)) {
                            setSelectedChildren(selectedChildren.filter(id => id !== child.id))
                          } else {
                            setSelectedChildren([...selectedChildren, child.id])
                          }
                        }}
                      >
                        {selectedChildren.includes(child.id) ? (
                          <CheckSquare className="h-5 w-5 text-primary-600" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {child.unique_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {child.first_name} {child.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {child.gender}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {child.village}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {child.district}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/children/${child.id}`)}
                          className="text-primary-600 hover:text-primary-900"
                          title="View"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => navigate(`/children/${child.id}`)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this child?')) {
                              deleteMutation.mutate(child.id)
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Child Modal */}
      <ChildFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(childId) => {
          // Fetch child details to get name
          childService.getById(childId).then((child) => {
            setSelectedChildId(childId)
            setSelectedChildName(`${child.first_name} ${child.last_name}`)
            setShowCreateModal(false)
            setShowPhotoUpload(true)
            toast.success('Child registered! Now upload a photo for AI analysis.')
          }).catch(() => {
            setSelectedChildId(childId)
            setSelectedChildName('')
            setShowCreateModal(false)
            setShowPhotoUpload(true)
            toast.success('Child registered! Now upload a photo for AI analysis.')
          })
        }}
      />

      {/* Photo Upload Modal */}
      {selectedChildId && (
        <PhotoUploadModal
          isOpen={showPhotoUpload}
          onClose={() => {
            setShowPhotoUpload(false)
            // Don't clear selectedChildId so user can upload more photos
            // setSelectedChildId(null)
            // setSelectedChildName('')
          }}
          childId={selectedChildId}
          childName={selectedChildName}
        />
      )}
    </div>
  )
}

export default ChildrenPage


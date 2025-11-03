import { useQuery } from '@tanstack/react-query'
import { childService } from '../services/childService'
import { photoService } from '../services/photoService'
import { Users, Camera, TrendingUp, AlertTriangle } from 'lucide-react'

const DashboardPage = () => {
  const { data: childrenData } = useQuery({
    queryKey: ['children', 'stats'],
    queryFn: () => childService.getAll({ limit: 0 }),
  })

  const { data: photosData } = useQuery({
    queryKey: ['photos', 'stats'],
    queryFn: () => photoService.getAll({ limit: 0 }),
  })

  const stats = [
    {
      name: 'Total Children',
      value: childrenData?.total || 0,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'Photos Analyzed',
      value: photosData?.total || 0,
      icon: Camera,
      color: 'bg-green-500',
    },
    {
      name: 'At Risk',
      value: photosData?.items?.filter((p: any) => p.malnutrition_score && p.malnutrition_score > 0.6).length || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
    {
      name: 'Normal Cases',
      value: photosData?.items?.filter((p: any) => p.malnutrition_score && p.malnutrition_score <= 0.3).length || 0,
      icon: TrendingUp,
      color: 'bg-yellow-500',
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your child health monitoring system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Recent Children</h2>
          {childrenData?.items?.slice(0, 5).map((child: any) => (
            <div key={child.id} className="border-b border-gray-200 py-3 last:border-0">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{child.first_name} {child.last_name}</p>
                  <p className="text-sm text-gray-500">{child.unique_id}</p>
                </div>
                <span className="text-sm text-gray-500">{child.village}</span>
              </div>
            </div>
          )) || <p className="text-gray-500">No children registered yet</p>}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Recent Photos</h2>
          {photosData?.items?.slice(0, 5).map((photo: any) => (
            <div key={photo.id} className="border-b border-gray-200 py-3 last:border-0">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{photo.file_name}</p>
                  <p className="text-xs text-gray-500">
                    Status: {photo.analysis_status}
                  </p>
                </div>
                {photo.malnutrition_score !== null && (
                  <span className={`text-sm font-medium ${
                    photo.malnutrition_score > 0.6 ? 'text-red-600' :
                    photo.malnutrition_score > 0.3 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {(photo.malnutrition_score * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          )) || <p className="text-gray-500">No photos uploaded yet</p>}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage


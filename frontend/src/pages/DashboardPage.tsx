import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { childService } from '../services/childService'
import { photoService } from '../services/photoService'
import { Users, Camera, TrendingUp, AlertTriangle, Activity, Heart, BarChart3 } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from 'recharts'
import StatusBadge from '../components/StatusBadge'
import NotificationBanner from '../components/NotificationBanner'

const DashboardPage = () => {
  const navigate = useNavigate()
  
  const { data: childrenData } = useQuery({
    queryKey: ['children', 'stats'],
    queryFn: () => childService.getAll({ limit: 0 }),
  })

  const { data: photosData } = useQuery({
    queryKey: ['photos', 'stats'],
    queryFn: () => photoService.getAll({ limit: 0 }),
  })

  const atRiskCount = photosData?.items?.filter((p: any) => p.malnutrition_score && p.malnutrition_score > 0.6).length || 0
  const normalCount = photosData?.items?.filter((p: any) => p.malnutrition_score && p.malnutrition_score <= 0.3).length || 0
  const warningCount = photosData?.items?.filter((p: any) => p.malnutrition_score && p.malnutrition_score > 0.3 && p.malnutrition_score <= 0.6).length || 0

  // Prepare chart data
  const riskDistributionData = [
    { name: 'Normal', value: normalCount, color: '#10b981' },
    { name: 'Medium Risk', value: warningCount, color: '#f59e0b' },
    { name: 'High Risk', value: atRiskCount, color: '#ef4444' },
  ].filter(item => item.value > 0)

  // Prepare trend data (last 7 days)
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    
    const dayPhotos = photosData?.items?.filter((p: any) => {
      const photoDate = new Date(p.created_at)
      return photoDate.toDateString() === date.toDateString()
    }) || []
    
    return {
      date: dateStr,
      photos: dayPhotos.length,
      analyzed: dayPhotos.filter((p: any) => p.analysis_status === 'completed').length,
      atRisk: dayPhotos.filter((p: any) => p.malnutrition_score && p.malnutrition_score > 0.6).length,
    }
  })

  const stats = [
    {
      name: 'Total Children',
      value: childrenData?.total || 0,
      icon: Users,
      color: 'bg-primary-500',
      bgColor: 'bg-primary-50',
      textColor: 'text-primary-700',
      change: '+12%',
      changeType: 'positive',
    },
    {
      name: 'Photos Analyzed',
      value: photosData?.total || 0,
      icon: Camera,
      color: 'bg-primary-600',
      bgColor: 'bg-primary-50',
      textColor: 'text-primary-700',
      change: '+8',
      changeType: 'positive',
    },
    {
      name: 'At Risk',
      value: atRiskCount,
      icon: AlertTriangle,
      color: 'bg-danger-500',
      bgColor: 'bg-danger-50',
      textColor: 'text-danger-700',
      change: atRiskCount > 0 ? 'Action Needed' : 'None',
      changeType: atRiskCount > 0 ? 'negative' : 'neutral',
    },
    {
      name: 'Normal Cases',
      value: normalCount,
      icon: Heart,
      color: 'bg-success-500',
      bgColor: 'bg-success-50',
      textColor: 'text-success-700',
      change: `${normalCount > 0 ? Math.round((normalCount / (photosData?.total || 1)) * 100) : 0}%`,
      changeType: 'positive',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">PostPart Dashboard</h1>
        <p className="mt-2 text-base text-gray-600">
          Monitor your child's nutritional status and ensure they receive proper nutrition at school. Parents and schools can track nutritional needs together.
        </p>
      </div>

      {/* Notification Banner for High-Risk Cases */}
      <NotificationBanner />

      {/* Stats Grid - Enhanced with Healthcare Design */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div 
              key={stat.name} 
              className="relative overflow-hidden bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`flex-shrink-0 ${stat.bgColor} rounded-lg p-3`}>
                    <Icon className={`h-6 w-6 ${stat.textColor}`} />
                  </div>
                  {stat.changeType === 'negative' && stat.value > 0 && (
                    <StatusBadge status="high" size="sm" />
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                  <div className="mt-2 flex items-center">
                    <span className={`text-xs font-medium ${
                      stat.changeType === 'positive' ? 'text-success-600' :
                      stat.changeType === 'negative' ? 'text-danger-600' : 'text-gray-500'
                    }`}>
                      {stat.change}
                    </span>
                    {stat.changeType === 'positive' && (
                      <TrendingUp className="ml-1 h-3 w-3 text-success-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Health Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Children */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Children</h2>
              <button
                onClick={() => navigate('/children')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View All
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {childrenData?.items?.slice(0, 5).map((child: any) => (
              <div 
                key={child.id} 
                className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/children/${child.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{child.first_name} {child.last_name}</p>
                      <p className="text-sm text-gray-500">{child.unique_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{child.village}</p>
                    <p className="text-xs text-gray-500">{child.district}</p>
                  </div>
                </div>
              </div>
            )) || (
              <div className="px-6 py-8 text-center text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No children registered yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Photos with Risk Indicators */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Analysis</h2>
              <button
                onClick={() => navigate('/photos')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View All
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {photosData?.items?.slice(0, 5).map((photo: any) => {
              const riskLevel = photo.malnutrition_score !== null 
                ? (photo.malnutrition_score > 0.6 ? 'high' : photo.malnutrition_score > 0.3 ? 'medium' : 'low')
                : null
              
              // Find child info for this photo
              const child = childrenData?.items?.find((c: any) => c.id === photo.child_id)
              const childName = child ? `${child.first_name} ${child.last_name}` : 'Unknown Child'
              
              return (
                <div 
                  key={photo.id} 
                  className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/children/${photo.child_id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 relative">
                        <img
                          src={photoService.getPhotoUrl(photo)}
                          alt={childName}
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                          onError={(e) => {
                            // Fallback to icon if image fails to load
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML = `<div class="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center"><Activity class="h-6 w-6 text-primary-600" /></div>`
                            }
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{childName}</p>
                        <p className="text-xs text-gray-500 capitalize">
                          {photo.analysis_status === 'completed' ? 'Analysis Complete' : 'Pending Analysis'}
                        </p>
                      </div>
                    </div>
                    {riskLevel && (
                      <StatusBadge 
                        status={riskLevel} 
                        label={riskLevel === 'high' ? 'High Risk' : riskLevel === 'medium' ? 'Medium' : 'Normal'}
                        size="sm"
                      />
                    )}
                  </div>
                  {photo.malnutrition_score !== null && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Risk Score</span>
                        <span className="font-semibold">{Math.round(photo.malnutrition_score * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            riskLevel === 'high' ? 'bg-danger-500' :
                            riskLevel === 'medium' ? 'bg-warning-500' : 'bg-success-500'
                          }`}
                          style={{ width: `${Math.min(photo.malnutrition_score * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            }) || (
              <div className="px-6 py-8 text-center text-gray-500">
                <Camera className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No photos uploaded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Chart */}
        {riskDistributionData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">Risk Distribution</h2>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Activity Trends Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">7-Day Activity Trends</h2>
            </div>
            <p className="text-sm text-gray-500 ml-7">
              Track daily photo uploads, analysis completion, and high-risk cases over the past week
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280" 
                style={{ fontSize: '12px' }}
                label={{ value: 'Date', position: 'insideBottom', offset: -5, style: { fontSize: '12px', fill: '#6b7280' } }}
              />
              <YAxis 
                stroke="#6b7280" 
                style={{ fontSize: '12px' }}
                label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#6b7280' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px 12px',
                }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    photos: 'Photos Uploaded',
                    analyzed: 'Photos Analyzed',
                    atRisk: 'High Risk Cases'
                  }
                  return [value, labels[name] || name]
                }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value: string) => {
                  const labels: Record<string, string> = {
                    photos: 'Photos Uploaded',
                    analyzed: 'Photos Analyzed',
                    atRisk: 'High Risk Cases'
                  }
                  return labels[value] || value
                }}
              />
              <Line
                type="monotone"
                dataKey="photos"
                stroke="#3b82f6"
                strokeWidth={2}
                name="photos"
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="analyzed"
                stroke="#10b981"
                strokeWidth={2}
                name="analyzed"
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="atRisk"
                stroke="#ef4444"
                strokeWidth={2}
                name="atRisk"
                dot={{ fill: '#ef4444', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          {/* Chart Legend Explanation */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-600">Photos Uploaded: Total photos added each day</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-600">Photos Analyzed: Completed AI analysis count</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-600">High Risk Cases: Children with risk score &gt;60%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/children')}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-primary-50 hover:bg-primary-100 rounded-lg border border-primary-200 transition-all hover:shadow-md"
          >
            <Users className="h-5 w-5 text-primary-600 flex-shrink-0" />
            <span className="font-medium text-primary-700">Add Child</span>
          </button>
          <button
            onClick={() => navigate('/photos')}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-success-50 hover:bg-success-100 rounded-lg border border-success-200 transition-all hover:shadow-md"
          >
            <Camera className="h-5 w-5 text-success-600 flex-shrink-0" />
            <span className="font-medium text-success-700">Upload Photo</span>
          </button>
          <button
            onClick={() => navigate('/photos')}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-warning-50 hover:bg-warning-100 rounded-lg border border-warning-200 transition-all hover:shadow-md"
          >
            <Activity className="h-5 w-5 text-warning-600 flex-shrink-0" />
            <span className="font-medium text-warning-700">View Reports</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage


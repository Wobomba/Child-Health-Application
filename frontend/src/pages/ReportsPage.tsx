import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Download, Calendar, Filter, TrendingUp, AlertTriangle, Users, Camera } from 'lucide-react'
import { childService } from '../services/childService'
import { photoService } from '../services/photoService'
import { exportChildren, exportPhotos } from '../utils/exportUtils'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'

const ReportsPage = () => {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [reportType, setReportType] = useState<'summary' | 'children' | 'photos' | 'risk'>('summary')

  const { data: childrenData, isLoading: childrenLoading } = useQuery({
    queryKey: ['children', 'reports'],
    queryFn: () => childService.getAll({ limit: 0 }),
  })

  const { data: photosData, isLoading: photosLoading } = useQuery({
    queryKey: ['photos', 'reports'],
    queryFn: () => photoService.getAll({ limit: 0 }),
  })

  const isLoading = childrenLoading || photosLoading

  // Filter data by date range
  const filterByDate = (items: any[]) => {
    if (!dateFrom && !dateTo) return items
    
    return items.filter((item: any) => {
      const itemDate = new Date(item.created_at)
      if (dateFrom && itemDate < new Date(dateFrom)) return false
      if (dateTo && itemDate > new Date(dateTo)) return false
      return true
    })
  }

  const filteredChildren = filterByDate(childrenData?.items || [])
  const filteredPhotos = filterByDate(photosData?.items || [])

  // Calculate statistics
  const stats = {
    totalChildren: filteredChildren.length,
    totalPhotos: filteredPhotos.length,
    analyzedPhotos: filteredPhotos.filter((p: any) => p.analysis_status === 'completed').length,
    highRisk: filteredPhotos.filter((p: any) => p.malnutrition_score && p.malnutrition_score > 0.6).length,
    mediumRisk: filteredPhotos.filter((p: any) => p.malnutrition_score && p.malnutrition_score > 0.3 && p.malnutrition_score <= 0.6).length,
    lowRisk: filteredPhotos.filter((p: any) => p.malnutrition_score && p.malnutrition_score <= 0.3).length,
  }

  // Risk distribution by location
  const riskByLocation = () => {
    const locationMap: Record<string, { high: number; medium: number; low: number }> = {}
    
    filteredPhotos.forEach((photo: any) => {
      const child = filteredChildren.find((c: any) => c.id === photo.child_id)
      const location = child ? `${child.village}, ${child.district}` : 'Unknown'
      
      if (!locationMap[location]) {
        locationMap[location] = { high: 0, medium: 0, low: 0 }
      }
      
      if (photo.malnutrition_score !== null) {
        if (photo.malnutrition_score > 0.6) {
          locationMap[location].high++
        } else if (photo.malnutrition_score > 0.3) {
          locationMap[location].medium++
        } else {
          locationMap[location].low++
        }
      }
    })
    
    return Object.entries(locationMap).map(([location, risks]) => ({
      location,
      ...risks
    }))
  }

  const handleExport = () => {
    if (reportType === 'children') {
      exportChildren(filteredChildren)
      toast.success('Children report exported!')
    } else if (reportType === 'photos') {
      exportPhotos(filteredPhotos, filteredChildren)
      toast.success('Photos report exported!')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-2 text-base text-gray-600">
            Generate comprehensive reports and analyze data trends
          </p>
        </div>
        <button
          onClick={handleExport}
          className="btn btn-primary flex items-center"
        >
          <Download className="h-5 w-5 mr-2" />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="input"
            >
              <option value="summary">Summary Report</option>
              <option value="children">Children Report</option>
              <option value="photos">Photos Report</option>
              <option value="risk">Risk Analysis</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setDateFrom('')
                setDateTo('')
              }}
              className="btn btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report data...</p>
        </div>
      ) : (
        <>
          {/* Summary Statistics */}
          {reportType === 'summary' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Children</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalChildren}</p>
                  </div>
                  <Users className="h-12 w-12 text-primary-600 opacity-20" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Photos</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalPhotos}</p>
                  </div>
                  <Camera className="h-12 w-12 text-primary-600 opacity-20" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">High Risk Cases</p>
                    <p className="text-3xl font-bold text-red-600">{stats.highRisk}</p>
                  </div>
                  <AlertTriangle className="h-12 w-12 text-red-600 opacity-20" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Analyzed Photos</p>
                    <p className="text-3xl font-bold text-green-600">{stats.analyzedPhotos}</p>
                  </div>
                  <TrendingUp className="h-12 w-12 text-green-600 opacity-20" />
                </div>
              </div>
            </div>
          )}

          {/* Risk Analysis Chart */}
          {reportType === 'risk' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Risk Distribution by Location</h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={riskByLocation()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="high" stackId="a" fill="#ef4444" name="High Risk" />
                  <Bar dataKey="medium" stackId="a" fill="#f59e0b" name="Medium Risk" />
                  <Bar dataKey="low" stackId="a" fill="#10b981" name="Low Risk" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Risk Distribution Pie Chart */}
          {(reportType === 'summary' || reportType === 'risk') && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Overall Risk Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'High Risk', value: stats.highRisk, color: '#ef4444' },
                  { name: 'Medium Risk', value: stats.mediumRisk, color: '#f59e0b' },
                  { name: 'Low Risk', value: stats.lowRisk, color: '#10b981' },
                ]}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ReportsPage


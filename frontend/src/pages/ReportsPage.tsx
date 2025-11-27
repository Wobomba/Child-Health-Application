import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Download, Calendar, Filter, TrendingUp, AlertTriangle, Users, Camera, Search, X } from 'lucide-react'
import { childService } from '../services/childService'
import { photoService } from '../services/photoService'
import { exportChildren, exportPhotos, exportSummaryReport, exportRiskReport, exportReportToPDF } from '../utils/exportUtils'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'

const ReportsPage = () => {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [reportType, setReportType] = useState<'summary' | 'children' | 'photos' | 'risk'>('summary')
  const [searchQuery, setSearchQuery] = useState('')

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
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999) // Include the entire end date
        if (itemDate > toDate) return false
      }
      return true
    })
  }

  // Search filter function
  const filterBySearch = (items: any[], searchFields: string[]) => {
    if (!searchQuery.trim()) return items
    
    const query = searchQuery.toLowerCase().trim()
    return items.filter((item: any) => {
      return searchFields.some(field => {
        const value = item[field]
        if (value === null || value === undefined) return false
        return String(value).toLowerCase().includes(query)
      })
    })
  }

  const dateFilteredChildren = useMemo(() => {
    return filterByDate(childrenData?.items || [])
  }, [childrenData?.items, dateFrom, dateTo])

  const dateFilteredPhotos = useMemo(() => {
    return filterByDate(photosData?.items || [])
  }, [photosData?.items, dateFrom, dateTo])

  // Apply search filter
  const filteredChildren = useMemo(() => {
    return filterBySearch(dateFilteredChildren, [
      'first_name', 'last_name', 'unique_id', 'village', 'district', 
      'parent_name', 'parent_phone', 'parent_address'
    ])
  }, [dateFilteredChildren, searchQuery])

  const filteredPhotos = useMemo(() => {
    const photosWithChildNames = dateFilteredPhotos.map((photo: any) => {
      const child = dateFilteredChildren.find((c: any) => c.id === photo.child_id)
      return {
        ...photo,
        child_name: child ? `${child.first_name} ${child.last_name}` : 'Unknown',
        child_village: child?.village || '',
        child_district: child?.district || ''
      }
    })
    return filterBySearch(photosWithChildNames, [
      'child_name', 'filename', 'file_name', 'analysis_status', 
      'child_village', 'child_district', 'notes'
    ])
  }, [dateFilteredPhotos, dateFilteredChildren, searchQuery])

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

  const handleExport = async () => {
    try {
      if (reportType === 'summary') {
        await exportSummaryReport({
          title: 'Summary Report',
          type: 'summary',
          dateFrom,
          dateTo,
          stats,
          children: filteredChildren,
          photos: filteredPhotos
        })
        toast.success('Summary report exported!')
      } else if (reportType === 'children') {
        await exportReportToPDF({
          title: 'Children Report',
          type: 'children',
          dateFrom,
          dateTo,
          children: filteredChildren
        })
        toast.success('Children report exported!')
      } else if (reportType === 'photos') {
        await exportReportToPDF({
          title: 'Photos & Analysis Report',
          type: 'photos',
          dateFrom,
          dateTo,
          photos: filteredPhotos.map((photo: any) => {
            const child = filteredChildren.find((c: any) => c.id === photo.child_id)
            return {
              ...photo,
              child_name: child ? `${child.first_name} ${child.last_name}` : 'Unknown'
            }
          })
        })
        toast.success('Photos report exported!')
      } else if (reportType === 'risk') {
        const riskData = riskByLocation()
        await exportRiskReport({
          title: 'Risk Analysis Report',
          type: 'risk',
          dateFrom,
          dateTo,
          stats,
          riskData
        })
        toast.success('Risk analysis report exported!')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export report. Please try again.')
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
          <h2 className="text-lg font-semibold text-gray-900">Filters & Search</h2>
        </div>
        
        {/* Search Bar */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID, location, phone, or other fields..."
              className="input pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
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
                setSearchQuery('')
              }}
              className="btn btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results count */}
        {(searchQuery || dateFrom || dateTo) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {reportType === 'children' ? filteredChildren.length : filteredPhotos.length} result(s)
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>
        )}
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


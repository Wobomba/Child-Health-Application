import { useState } from 'react'
import { Search, Filter, X } from 'lucide-react'

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void
  onReset: () => void
  placeholder?: string
}

export interface SearchFilters {
  search?: string
  riskLevel?: 'all' | 'high' | 'medium' | 'low'
  dateFrom?: string
  dateTo?: string
  location?: string
  status?: 'all' | 'completed' | 'pending' | 'processing'
}

const AdvancedSearch = ({ onSearch, onReset, placeholder = "Search..." }: AdvancedSearchProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    riskLevel: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    location: '',
  })

  const handleChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSearch = () => {
    onSearch(filters)
  }

  const handleReset = () => {
    const emptyFilters: SearchFilters = {
      search: '',
      riskLevel: 'all',
      status: 'all',
      dateFrom: '',
      dateTo: '',
      location: '',
    }
    setFilters(emptyFilters)
    onReset()
  }

  const hasActiveFilters = filters.search || 
    filters.riskLevel !== 'all' || 
    filters.status !== 'all' || 
    filters.dateFrom || 
    filters.dateTo || 
    filters.location

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      {/* Basic Search */}
      <div className="flex items-center space-x-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={placeholder}
            className="input pl-10 w-full"
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`btn btn-secondary flex items-center ${isExpanded ? 'bg-primary-100 text-primary-700' : ''}`}
        >
          <Filter className="h-5 w-5 mr-2" />
          Filters
        </button>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="btn btn-secondary flex items-center"
          >
            <X className="h-5 w-5 mr-2" />
            Clear
          </button>
        )}
        <button
          onClick={handleSearch}
          className="btn btn-primary"
        >
          Search
        </button>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          {/* Risk Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Risk Level
            </label>
            <select
              value={filters.riskLevel || 'all'}
              onChange={(e) => handleChange('riskLevel', e.target.value)}
              className="input"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Analysis Status
            </label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => handleChange('status', e.target.value)}
              className="input"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleChange('dateFrom', e.target.value)}
              className="input"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date To
            </label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => handleChange('dateTo', e.target.value)}
              className="input"
            />
          </div>

          {/* Location Filter */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location (Village/District)
            </label>
            <input
              type="text"
              placeholder="Enter village or district"
              value={filters.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
              className="input w-full"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedSearch


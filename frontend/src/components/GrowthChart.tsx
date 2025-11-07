import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Weight, Ruler, TrendingUp } from 'lucide-react'
import api from '../services/api'

interface GrowthRecord {
  id: number
  measurement_date: string
  weight: number
  height: number | null
  bmi: number | null
  weight_for_age_zscore: number | null
  height_for_age_zscore: number | null
  overall_status: string | null
}

interface GrowthChartProps {
  childId: number
  type: 'weight' | 'height' | 'bmi'
}

const GrowthChart = ({ childId, type }: GrowthChartProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['growth', childId],
    queryFn: async () => {
      const response = await api.get(`/growth`, {
        params: { child_id: childId, per_page: 100 }
      })
      return response.data.records || []
    },
    enabled: !!childId,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Weight className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No growth records available</p>
        <p className="text-sm text-gray-400 mt-2">Add growth measurements to see trends</p>
      </div>
    )
  }

  // Prepare chart data
  const chartData = data
    .map((record: GrowthRecord) => ({
      date: new Date(record.measurement_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: record.measurement_date,
      weight: record.weight,
      height: record.height,
      bmi: record.bmi,
      status: record.overall_status,
    }))
    .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())

  const getChartConfig = () => {
    switch (type) {
      case 'weight':
        return {
          dataKey: 'weight',
          label: 'Weight (kg)',
          color: '#3b82f6',
          icon: Weight,
        }
      case 'height':
        return {
          dataKey: 'height',
          label: 'Height (cm)',
          color: '#10b981',
          icon: Ruler,
        }
      case 'bmi':
        return {
          dataKey: 'bmi',
          label: 'BMI',
          color: '#f59e0b',
          icon: TrendingUp,
        }
      default:
        return {
          dataKey: 'weight',
          label: 'Weight (kg)',
          color: '#3b82f6',
          icon: Weight,
        }
    }
  }

  const config = getChartConfig()
  const Icon = config.icon

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Icon className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">{config.label} Over Time</h3>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: config.label, angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px',
            }}
            formatter={(value: number) => {
              if (type === 'weight') return [`${value.toFixed(2)} kg`, config.label]
              if (type === 'height') return [`${value.toFixed(1)} cm`, config.label]
              return [`${value.toFixed(2)}`, config.label]
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey={config.dataKey}
            stroke={config.color}
            strokeWidth={2}
            dot={{ fill: config.color, r: 4 }}
            activeDot={{ r: 6 }}
            name={config.label}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      {chartData.length > 1 && (
        <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-500 mb-1">First Record</p>
            <p className="text-lg font-semibold text-gray-900">
              {type === 'weight' && `${chartData[0].weight.toFixed(2)} kg`}
              {type === 'height' && chartData[0].height && `${chartData[0].height.toFixed(1)} cm`}
              {type === 'bmi' && chartData[0].bmi && chartData[0].bmi.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Latest Record</p>
            <p className="text-lg font-semibold text-gray-900">
              {type === 'weight' && `${chartData[chartData.length - 1].weight.toFixed(2)} kg`}
              {type === 'height' && chartData[chartData.length - 1].height && `${chartData[chartData.length - 1].height.toFixed(1)} cm`}
              {type === 'bmi' && chartData[chartData.length - 1].bmi && chartData[chartData.length - 1].bmi.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Change</p>
            <p className={`text-lg font-semibold ${
              type === 'weight' && (chartData[chartData.length - 1].weight - chartData[0].weight) >= 0 ? 'text-success-600' : 'text-danger-600'
            }`}>
              {type === 'weight' && (
                <>
                  {(chartData[chartData.length - 1].weight - chartData[0].weight) >= 0 ? '+' : ''}
                  {(chartData[chartData.length - 1].weight - chartData[0].weight).toFixed(2)} kg
                </>
              )}
              {type === 'height' && chartData[0].height && chartData[chartData.length - 1].height && (
                <>
                  {(chartData[chartData.length - 1].height - chartData[0].height) >= 0 ? '+' : ''}
                  {(chartData[chartData.length - 1].height - chartData[0].height).toFixed(1)} cm
                </>
              )}
              {type === 'bmi' && chartData[0].bmi && chartData[chartData.length - 1].bmi && (
                <>
                  {(chartData[chartData.length - 1].bmi - chartData[0].bmi) >= 0 ? '+' : ''}
                  {(chartData[chartData.length - 1].bmi - chartData[0].bmi).toFixed(2)}
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default GrowthChart


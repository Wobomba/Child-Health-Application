interface RiskIndicatorProps {
  score: number
  showLabel?: boolean
  showPercentage?: boolean
}

const RiskIndicator = ({ score, showLabel = true, showPercentage = true }: RiskIndicatorProps) => {
  const getRiskLevel = () => {
    if (score <= 0.3) return { level: 'low', color: 'success', label: 'Low Risk' }
    if (score <= 0.6) return { level: 'medium', color: 'warning', label: 'Medium Risk' }
    return { level: 'high', color: 'danger', label: 'High Risk' }
  }

  const { level, color, label } = getRiskLevel()

  const colorClasses = {
    success: {
      bg: 'bg-success-500',
      text: 'text-success-700',
      light: 'bg-success-100',
    },
    warning: {
      bg: 'bg-warning-500',
      text: 'text-warning-700',
      light: 'bg-warning-100',
    },
    danger: {
      bg: 'bg-danger-500',
      text: 'text-danger-700',
      light: 'bg-danger-100',
    },
  }

  const colors = colorClasses[color as keyof typeof colorClasses]

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium text-gray-700">Risk Level</span>
          <span className={`font-semibold ${colors.text}`}>{label}</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colors.bg}`}
          style={{ width: `${Math.min(score * 100, 100)}%` }}
        />
      </div>
      {showPercentage && (
        <div className="flex justify-between text-xs text-gray-600">
          <span>0%</span>
          <span className="font-medium">{Math.round(score * 100)}%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  )
}

export default RiskIndicator


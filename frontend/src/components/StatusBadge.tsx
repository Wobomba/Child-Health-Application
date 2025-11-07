import { CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react'

interface StatusBadgeProps {
  status: 'low' | 'medium' | 'high' | 'normal' | 'warning' | 'critical'
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

const StatusBadge = ({ status, label, size = 'md' }: StatusBadgeProps) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'low':
      case 'normal':
        return {
          bg: 'bg-success-100',
          text: 'text-success-700',
          border: 'border-success-300',
          icon: CheckCircle,
          defaultLabel: 'Normal',
        }
      case 'medium':
      case 'warning':
        return {
          bg: 'bg-warning-100',
          text: 'text-warning-700',
          border: 'border-warning-300',
          icon: AlertCircle,
          defaultLabel: 'Warning',
        }
      case 'high':
      case 'critical':
        return {
          bg: 'bg-danger-100',
          text: 'text-danger-700',
          border: 'border-danger-300',
          icon: AlertTriangle,
          defaultLabel: 'Critical',
        }
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          border: 'border-gray-300',
          icon: AlertCircle,
          defaultLabel: 'Unknown',
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]} font-medium`}
    >
      <Icon className={iconSizes[size]} />
      {label || config.defaultLabel}
    </span>
  )
}

export default StatusBadge


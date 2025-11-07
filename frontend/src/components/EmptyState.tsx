import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => {
  return (
    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 mb-6 max-w-md">{description}</p>
        )}
        {action && (
          <div className="mt-4">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}

export default EmptyState


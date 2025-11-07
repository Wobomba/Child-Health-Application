import { useState, useEffect } from 'react'
import { AlertTriangle, X, Bell } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { photoService } from '../services/photoService'
import { useNavigate } from 'react-router-dom'

const NotificationBanner = () => {
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)

  const { data: photosData } = useQuery({
    queryKey: ['photos', 'alerts'],
    queryFn: () => photoService.getAll({ limit: 100 }),
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Find high-risk photos (score > 0.6)
  const highRiskPhotos = photosData?.items?.filter((p: any) => 
    p.malnutrition_score && p.malnutrition_score > 0.6
  ) || []

  // Find recent high-risk (last 7 days)
  const recentHighRisk = highRiskPhotos.filter((p: any) => {
    const photoDate = new Date(p.created_at)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return photoDate >= sevenDaysAgo
  })

  useEffect(() => {
    // Reset dismissed state when new high-risk cases appear
    if (recentHighRisk.length > 0) {
      setDismissed(false)
    }
  }, [recentHighRisk.length])

  if (dismissed || recentHighRisk.length === 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-lg shadow-md mb-6">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
                <Bell className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h3 className="text-lg font-semibold text-red-900">
                  {recentHighRisk.length} High-Risk {recentHighRisk.length === 1 ? 'Case' : 'Cases'} Detected
                </h3>
              </div>
              <p className="text-sm text-red-700 mb-2">
                {recentHighRisk.length === 1 
                  ? 'A child has been identified with high malnutrition risk in the past 7 days. Immediate attention recommended.'
                  : `${recentHighRisk.length} children have been identified with high malnutrition risk in the past 7 days. Immediate attention recommended.`
                }
              </p>
              <button
                onClick={() => navigate('/photos?filterRisk=high')}
                className="text-sm font-medium text-red-700 hover:text-red-900 underline"
              >
                View High-Risk Cases →
              </button>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors ml-4"
            aria-label="Dismiss notification"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotificationBanner


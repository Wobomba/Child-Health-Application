import { AlertTriangle, Heart, Utensils, Info } from 'lucide-react'
import StatusBadge from './StatusBadge'

interface PhotoAnalysisDetailsProps {
  photo: {
    malnutrition_score?: number | null
    detected_diseases?: Array<{
      disease: string
      confidence: number
      description: string
      symptoms_detected: string[]
    }> | null
    disaster_predictions?: string[] | null
    nutrition_tips?: string[] | null
    recommendations?: string[] | null
  }
}

const PhotoAnalysisDetails = ({ photo }: PhotoAnalysisDetailsProps) => {
  const hasDiseases = photo.detected_diseases && photo.detected_diseases.length > 0
  const hasPredictions = photo.disaster_predictions && photo.disaster_predictions.length > 0
  const hasTips = photo.nutrition_tips && photo.nutrition_tips.length > 0

  if (!hasDiseases && !hasPredictions && !hasTips) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Detected Diseases */}
      {hasDiseases && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-warning-600" />
            <h4 className="text-sm font-semibold text-gray-900">Detected Conditions</h4>
          </div>
          <div className="space-y-3">
            {photo.detected_diseases!.map((disease, index) => (
              <div key={index} className="border-l-4 border-warning-500 pl-3 py-2 bg-warning-50 rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-gray-900 capitalize">
                    {disease.disease}
                  </span>
                  <span className="text-xs text-gray-600">
                    {Math.round(disease.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{disease.description}</p>
                {disease.symptoms_detected && disease.symptoms_detected.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-700 mb-1">Symptoms detected:</p>
                    <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                      {disease.symptoms_detected.map((symptom, i) => (
                        <li key={i}>{symptom}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disaster Predictions */}
      {hasPredictions && (
        <div className="bg-white rounded-lg border border-danger-200 p-4 bg-danger-50">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-danger-600" />
            <h4 className="text-sm font-semibold text-gray-900">Potential Consequences</h4>
          </div>
          <div className="space-y-2">
            {photo.disaster_predictions!.map((prediction, index) => (
              <p
                key={index}
                className={`text-sm ${
                  prediction.startsWith('CRITICAL') || prediction.startsWith('WARNING')
                    ? 'font-semibold text-danger-700'
                    : prediction.startsWith('CAUTION')
                    ? 'font-medium text-warning-700'
                    : 'text-gray-700'
                }`}
              >
                {prediction}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Nutrition Tips */}
      {hasTips && (
        <div className="bg-white rounded-lg border border-primary-200 p-4 bg-primary-50">
          <div className="flex items-center space-x-2 mb-3">
            <Utensils className="h-5 w-5 text-primary-600" />
            <h4 className="text-sm font-semibold text-gray-900">Nutrition Recommendations</h4>
          </div>
          <div className="space-y-2">
            {photo.nutrition_tips!.map((tip, index) => (
              <p
                key={index}
                className={`text-sm ${
                  tip.startsWith('For') || tip.startsWith('URGENT')
                    ? 'font-semibold text-primary-700'
                    : tip.startsWith('•')
                    ? 'text-gray-700 ml-4'
                    : 'text-gray-600'
                }`}
              >
                {tip}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {photo.recommendations && 
       (Array.isArray(photo.recommendations) ? photo.recommendations.length > 0 : true) && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Info className="h-5 w-5 text-primary-600" />
            <h4 className="text-sm font-semibold text-gray-900">Medical Recommendations</h4>
          </div>
          {Array.isArray(photo.recommendations) ? (
            <ul className="list-disc list-inside space-y-1">
              {photo.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-gray-700">
                  {rec}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-700">{photo.recommendations}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default PhotoAnalysisDetails


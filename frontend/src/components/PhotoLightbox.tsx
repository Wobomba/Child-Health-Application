import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Info } from 'lucide-react'
import { Photo } from '../services/photoService'
import PhotoAnalysisDetails from './PhotoAnalysisDetails'

interface PhotoLightboxProps {
  photos: Photo[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  getPhotoUrl: (photo: Photo) => string
}

const PhotoLightbox = ({ photos, currentIndex, isOpen, onClose, getPhotoUrl }: PhotoLightboxProps) => {
  const [index, setIndex] = useState(currentIndex)
  const [zoom, setZoom] = useState(1)
  const [showAnalysis, setShowAnalysis] = useState(false)

  useEffect(() => {
    setIndex(currentIndex)
    setZoom(1)
  }, [currentIndex, isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, index])

  if (!isOpen || photos.length === 0) return null

  const currentPhoto = photos[index]
  const hasPrevious = index > 0
  const hasNext = index < photos.length - 1

  const handlePrevious = () => {
    if (hasPrevious) {
      setIndex(index - 1)
      setZoom(1)
    }
  }

  const handleNext = () => {
    if (hasNext) {
      setIndex(index + 1)
      setZoom(1)
    }
  }

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 0.25, 0.5))
  }

  const riskLevel = currentPhoto?.malnutrition_score !== null && currentPhoto?.malnutrition_score !== undefined
    ? (currentPhoto.malnutrition_score > 0.6 ? 'high' : currentPhoto.malnutrition_score > 0.3 ? 'medium' : 'low')
    : null

  if (!currentPhoto) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
        aria-label="Close"
      >
        <X className="h-8 w-8" />
      </button>

      {/* Navigation Buttons */}
      {hasPrevious && (
        <button
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-3"
          aria-label="Previous photo"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-3"
          aria-label="Next photo"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Zoom Controls */}
      <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black bg-opacity-50 rounded-lg p-2 z-10">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          className="text-white hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <span className="text-white text-sm px-2">{Math.round(zoom * 100)}%</span>
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 3}
          className="text-white hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
      </div>

      {/* Analysis Toggle Button */}
      {(currentPhoto.detected_diseases || currentPhoto.disaster_predictions || currentPhoto.nutrition_tips) && (
        <button
          onClick={() => setShowAnalysis(!showAnalysis)}
          className="absolute top-20 left-4 flex items-center space-x-2 bg-black bg-opacity-50 rounded-lg p-2 text-white hover:bg-opacity-70 transition-colors z-10"
          aria-label="Toggle analysis details"
        >
          <Info className="h-5 w-5" />
          <span className="text-sm">Analysis</span>
        </button>
      )}

      {/* Photo Info */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 rounded-lg p-4 text-white text-center z-10 max-w-md">
        <p className="font-medium mb-1">{currentPhoto.filename || currentPhoto.file_name || 'Photo'}</p>
        <p className="text-sm text-gray-300">
          {currentPhoto.created_at && new Date(currentPhoto.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
        {currentPhoto.malnutrition_score !== null && currentPhoto.malnutrition_score !== undefined && (
          <div className="mt-2 flex items-center justify-center space-x-2">
            <span className="text-sm">Risk Score:</span>
            <span className={`font-bold ${
              riskLevel === 'high' ? 'text-red-400' :
              riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {Math.round(currentPhoto.malnutrition_score * 100)}%
            </span>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {index + 1} of {photos.length}
        </p>
      </div>

      {/* Analysis Details Sidebar */}
      {showAnalysis && (
        <div className="absolute right-0 top-0 h-full w-96 bg-white overflow-y-auto z-20 shadow-2xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Analysis Details</h3>
              <button
                onClick={() => setShowAnalysis(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <PhotoAnalysisDetails photo={currentPhoto} />
          </div>
        </div>
      )}

      {/* Photo */}
      <div className="w-full h-full flex items-center justify-center p-4">
        <img
          src={getPhotoUrl(currentPhoto)}
          alt={currentPhoto.filename || currentPhoto.file_name || 'Photo'}
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
          draggable={false}
        />
      </div>
    </div>
  )
}

export default PhotoLightbox


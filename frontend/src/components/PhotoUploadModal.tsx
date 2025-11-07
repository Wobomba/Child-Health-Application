import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { photoService, PhotoUpload } from '../services/photoService'
import { X, Camera, Upload, Image as ImageIcon, Video } from 'lucide-react'
import toast from 'react-hot-toast'

interface PhotoUploadModalProps {
  isOpen: boolean
  onClose: () => void
  childId: number
  childName?: string
}

const PhotoUploadModal = ({ isOpen, onClose, childId, childName }: PhotoUploadModalProps) => {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [notes, setNotes] = useState('')

  const uploadMutation = useMutation({
    mutationFn: (data: PhotoUpload) => photoService.upload(data),
    onSuccess: () => {
      // Invalidate all related queries to ensure UI updates immediately
      queryClient.invalidateQueries({ queryKey: ['photos'] })
      queryClient.invalidateQueries({ queryKey: ['photos', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['photos', 'child', childId] })
      queryClient.invalidateQueries({ queryKey: ['children'] })
      queryClient.invalidateQueries({ queryKey: ['children', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['children', childId] })
      toast.success('Photo uploaded successfully! AI analysis will begin automatically.')
      // Reset form but keep modal open for multiple uploads
      setSelectedFile(null)
      setPreview(null)
      setNotes('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to upload photo'
      toast.error(errorMessage)
    },
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCameraClick = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' } // Front camera for selfies
      })
      setStream(mediaStream)
      setIsCameraOpen(true)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast.error('Unable to access camera. Please check permissions.')
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
            setSelectedFile(file)
            setPreview(canvas.toDataURL())
            stopCamera()
          }
        }, 'image/jpeg', 0.9)
      }
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsCameraOpen(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      toast.error('Please select or capture a photo')
      return
    }

    uploadMutation.mutate({
      child_id: childId,
      file: selectedFile,
      notes: notes || undefined,
    })
  }

  const handleClose = () => {
    stopCamera()
    setSelectedFile(null)
    setPreview(null)
    setNotes('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Upload Photo</h2>
            {childName && (
              <p className="text-sm text-gray-600 mt-1">For: {childName}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Camera Preview */}
          {isCameraOpen && (
            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-auto max-h-96 object-contain"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="bg-white rounded-full p-4 hover:bg-gray-100 transition-colors"
                >
                  <Camera className="h-8 w-8 text-gray-900" />
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="bg-red-600 text-white rounded-full p-4 hover:bg-red-700 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
          )}

          {/* Image Preview */}
          {preview && !isCameraOpen && (
            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-auto max-h-96 object-contain mx-auto"
              />
              <button
                type="button"
                onClick={() => {
                  setPreview(null)
                  setSelectedFile(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Upload Options */}
          {!preview && !isCameraOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handleCameraClick}
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <Camera className="h-12 w-12 text-gray-400 mb-3" />
                <span className="text-sm font-medium text-gray-700">Take Photo</span>
                <span className="text-xs text-gray-500 mt-1">Use camera</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <Upload className="h-12 w-12 text-gray-400 mb-3" />
                <span className="text-sm font-medium text-gray-700">Upload Photo</span>
                <span className="text-xs text-gray-500 mt-1">From device</span>
              </button>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Notes */}
          {preview && (
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                className="input"
                placeholder="Add any notes about this photo..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">
                AI analysis will run automatically after upload
              </p>
            </div>
          )}

          {/* Actions */}
          {preview && (
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-secondary"
                disabled={uploadMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    Upload & Analyze
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default PhotoUploadModal


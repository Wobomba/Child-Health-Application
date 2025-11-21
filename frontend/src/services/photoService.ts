import api from './api'

export interface Photo {
  id: number
  child_id: number
  file_path: string
  filename: string  // Backend uses 'filename'
  file_name?: string  // Alias for compatibility
  file_size: number
  mime_type: string
  analysis_status: string
  malnutrition_score: number | null
  confidence_level: number | null
  recommendations: string[] | null
  detected_diseases?: Array<{
    disease: string
    confidence: number
    description: string
    symptoms_detected: string[]
  }> | null
  disaster_predictions?: string[] | null
  nutrition_tips?: string[] | null
  notes: string | null
  created_at: string
  analyzed_at: string | null
}

export interface PhotoUpload {
  child_id: number
  file: File
  notes?: string
}

export const photoService = {
  async upload(data: PhotoUpload): Promise<Photo> {
    const formData = new FormData()
    formData.append('file', data.file)
    formData.append('child_id', data.child_id.toString())
    formData.append('auto_analyze', 'true') // Automatically trigger AI analysis
    if (data.notes) {
      formData.append('notes', data.notes)
    }

    const response = await api.post('/photos/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async getAll(params?: {
    skip?: number
    limit?: number
    child_id?: number
  }): Promise<{ items: Photo[]; total: number }> {
    const response = await api.get('/photos/', { params })
    // Backend returns { photos, total, page, per_page, total_pages }
    // Convert to { items, total } for frontend compatibility
    return {
      items: response.data.photos || [],
      total: response.data.total || 0
    }
  },

  async getById(id: number): Promise<Photo> {
    const response = await api.get(`/photos/${id}`)
    return response.data
  },

  async analyze(id: number): Promise<Photo> {
    const response = await api.post(`/photos/${id}/analyze`)
    return response.data
  },

  async update(id: number, data: { notes?: string }): Promise<Photo> {
    const response = await api.put(`/photos/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/photos/${id}`)
  },

  getPhotoUrl(photo: Photo): string {
    // Include auth token in URL for image loading
    const token = localStorage.getItem('access_token')
    const baseUrl = api.defaults.baseURL?.replace('/api/v1', '') || 'http://localhost:8000'
    if (token) {
      return `${baseUrl}/api/v1/photos/${photo.id}/download?token=${encodeURIComponent(token)}`
    }
    return `${baseUrl}/api/v1/photos/${photo.id}/download`
  },
}


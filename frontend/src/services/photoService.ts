import api from './api'

export interface Photo {
  id: number
  child_id: number
  file_path: string
  file_name: string
  file_size: number
  mime_type: string
  analysis_status: string
  malnutrition_score: number | null
  confidence_level: number | null
  recommendations: string | null
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
    return response.data
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
    return `${api.defaults.baseURL?.replace('/api/v1', '')}/photos/${photo.id}/file`
  },
}


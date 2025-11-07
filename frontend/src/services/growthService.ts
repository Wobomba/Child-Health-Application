import api from './api'

export interface GrowthRecord {
  id: number
  child_id: number
  measurement_date: string
  weight: number
  height: number | null
  head_circumference: number | null
  mid_upper_arm_circumference: number | null
  weight_for_age_zscore: number | null
  height_for_age_zscore: number | null
  weight_for_height_zscore: number | null
  bmi: number | null
  weight_status: string | null
  height_status: string | null
  overall_status: string | null
  notes: string | null
  measured_by: string | null
  created_at: string
  updated_at: string | null
}

export interface GrowthRecordCreate {
  child_id: number
  measurement_date: string
  weight: number
  height?: number
  head_circumference?: number
  mid_upper_arm_circumference?: number
  notes?: string
  measured_by?: string
}

export interface GrowthRecordUpdate extends Partial<GrowthRecordCreate> {}

export interface GrowthSearchParams {
  child_id?: number
  date_from?: string
  date_to?: string
  weight_min?: number
  weight_max?: number
  height_min?: number
  height_max?: number
  overall_status?: string
  measured_by?: string
  page?: number
  per_page?: number
}

export const growthService = {
  async create(data: GrowthRecordCreate): Promise<GrowthRecord> {
    const response = await api.post('/growth', data)
    return response.data
  },

  async getAll(params?: GrowthSearchParams): Promise<{ records: GrowthRecord[]; total: number }> {
    const response = await api.get('/growth', { params })
    return {
      records: response.data.records || [],
      total: response.data.total || 0
    }
  },

  async getById(id: number): Promise<GrowthRecord> {
    const response = await api.get(`/growth/${id}`)
    return response.data
  },

  async getByChildId(childId: number, params?: { page?: number; per_page?: number }): Promise<{ records: GrowthRecord[]; total: number }> {
    const response = await api.get(`/children/${childId}/growth`, { params })
    return {
      records: response.data.records || [],
      total: response.data.total || 0
    }
  },

  async update(id: number, data: GrowthRecordUpdate): Promise<GrowthRecord> {
    const response = await api.put(`/growth/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/growth/${id}`)
  },

  async getTrend(childId: number, months?: number): Promise<any> {
    const response = await api.get(`/children/${childId}/growth/trend`, {
      params: { months }
    })
    return response.data
  },

  async getStats(childId: number): Promise<any> {
    const response = await api.get(`/children/${childId}/growth/stats`)
    return response.data
  },
}


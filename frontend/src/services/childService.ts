import api from './api'

export interface Child {
  id: number
  unique_id: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: 'male' | 'female'
  parent_name: string
  village: string
  district: string
  created_at: string
  updated_at: string
}

export interface ChildCreate {
  first_name: string
  last_name: string
  date_of_birth: string
  gender: 'male' | 'female'
  parent_name: string
  village: string
  district: string
}

export interface ChildUpdate extends Partial<ChildCreate> {}

export const childService = {
  async getAll(params?: {
    skip?: number
    limit?: number
    search?: string
    village?: string
    district?: string
  }): Promise<{ items: Child[]; total: number }> {
    const response = await api.get('/children/', { params })
    return response.data
  },

  async getById(id: number): Promise<Child> {
    const response = await api.get(`/children/${id}`)
    return response.data
  },

  async getByUniqueId(uniqueId: string): Promise<Child> {
    const response = await api.get(`/children/unique/${uniqueId}`)
    return response.data
  },

  async create(data: ChildCreate): Promise<Child> {
    const response = await api.post('/children/', data)
    return response.data
  },

  async update(id: number, data: ChildUpdate): Promise<Child> {
    const response = await api.put(`/children/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/children/${id}`)
  },
}


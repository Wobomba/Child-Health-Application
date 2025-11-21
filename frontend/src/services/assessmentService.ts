import api from './api'

export interface Assessment {
  id: number
  child_id: number
  vht_user_id: number
  assessment_type: 'routine' | 'follow_up' | 'emergency' | 'screening'
  assessment_date: string
  weight_kg?: number
  height_cm?: number
  head_circumference_cm?: number
  muac_cm?: number
  temperature_celsius?: number
  blood_pressure_systolic?: number
  blood_pressure_diastolic?: number
  heart_rate_bpm?: number
  respiratory_rate?: number
  oxygen_saturation?: number
  general_appearance?: string
  skin_condition?: string
  eye_condition?: string
  ear_condition?: string
  nose_condition?: string
  throat_condition?: string
  chest_condition?: string
  abdomen_condition?: string
  neurological_condition?: string
  musculoskeletal_condition?: string
  developmental_milestones?: string
  immunization_status?: string
  feeding_history?: string
  sleep_patterns?: string
  behavioral_notes?: string
  family_history?: string
  social_history?: string
  environmental_factors?: string
  chief_complaint?: string
  history_present_illness?: string
  review_of_systems?: string
  physical_examination?: string
  assessment_notes?: string
  diagnosis?: string
  treatment_plan?: string
  follow_up_instructions?: string
  referral_required: boolean
  referral_details?: string
  risk_level?: 'low' | 'moderate' | 'high' | 'critical'
  priority_score?: number
  ai_analysis_id?: number
  ai_confidence_score?: number
  ai_risk_indicators?: Record<string, any>
  ai_recommendations?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface AssessmentCreate {
  child_id: number
  assessment_type: 'routine' | 'follow_up' | 'emergency' | 'screening'
  assessment_date: string
  weight_kg?: number
  height_cm?: number
  head_circumference_cm?: number
  muac_cm?: number
  temperature_celsius?: number
  blood_pressure_systolic?: number
  blood_pressure_diastolic?: number
  heart_rate_bpm?: number
  respiratory_rate?: number
  oxygen_saturation?: number
  general_appearance?: string
  skin_condition?: string
  eye_condition?: string
  ear_condition?: string
  nose_condition?: string
  throat_condition?: string
  chest_condition?: string
  abdomen_condition?: string
  neurological_condition?: string
  musculoskeletal_condition?: string
  developmental_milestones?: string
  immunization_status?: string
  feeding_history?: string
  sleep_patterns?: string
  behavioral_notes?: string
  family_history?: string
  social_history?: string
  environmental_factors?: string
  chief_complaint?: string
  history_present_illness?: string
  review_of_systems?: string
  physical_examination?: string
  assessment_notes?: string
  diagnosis?: string
  treatment_plan?: string
  follow_up_instructions?: string
  referral_required?: boolean
  referral_details?: string
  risk_level?: 'low' | 'moderate' | 'high' | 'critical'
}

export interface AssessmentUpdate extends Partial<AssessmentCreate> {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
}

export interface AssessmentListResponse {
  items: Assessment[]
  total: number
}

export const assessmentService = {
  async getAll(params?: {
    child_id?: number
    status?: string
    risk_level?: string
    skip?: number
    limit?: number
  }): Promise<AssessmentListResponse> {
    const response = await api.get('/assessments/', { params })
    return {
      items: response.data,
      total: response.data.length,
    }
  },

  async getById(id: number): Promise<Assessment> {
    const response = await api.get(`/assessments/${id}`)
    return response.data
  },

  async create(data: AssessmentCreate): Promise<Assessment> {
    const response = await api.post('/assessments/', data)
    return response.data
  },

  async update(id: number, data: AssessmentUpdate): Promise<Assessment> {
    const response = await api.put(`/assessments/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/assessments/${id}`)
  },
}


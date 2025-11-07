import api from './api'

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  full_name: string
  role?: string
}

export interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: string
  is_active: boolean
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials)
    const data = response.data
    
    // Store token and user
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    
    return data
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/auth/register/public', data)
    return response.data
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me')
    return response.data
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },

  getToken(): string | null {
    return localStorage.getItem('access_token')
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token')
  },
}


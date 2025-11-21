import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useMutation } from '@tanstack/react-query'
import { User, Lock, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'

const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const loginMutation = useMutation({
    mutationFn: () => login(formData.username, formData.password),
    onSuccess: (data: any) => {
      // Show welcome message based on first-time login
      if (data?.is_first_login) {
        toast.success(`Welcome! We're glad to have you here. Let's get started!`, {
          duration: 5000,
        })
      } else {
        toast.success('Welcome back!', {
          duration: 3000,
        })
      }
      navigate('/dashboard')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Login failed'
      toast.error(errorMessage)
      setErrors({ general: errorMessage })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    if (!formData.username.trim()) {
      setErrors({ username: 'Username is required' })
      return
    }
    if (!formData.password) {
      setErrors({ password: 'Password is required' })
      return
    }
    
    loginMutation.mutate()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img 
              src="/logo.png" 
              alt="PostPart Logo" 
              className="h-24 w-auto object-contain"
            />
          </div>
          <p className="text-lg text-gray-600">Child Health Monitoring</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to access your child health monitoring dashboard
            </p>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg">
              <p className="text-sm text-danger-700">{errors.general}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className={`input pl-10 ${errors.username ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value })
                    setErrors({ ...errors, username: '' })
                  }}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-danger-600">{errors.username}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className={`input pl-10 ${errors.password ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    setErrors({ ...errors, password: '' })
                  }}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-danger-600">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="btn btn-primary w-full flex items-center justify-center"
              >
                {loginMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign In
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Register and Forgot Password Links */}
          <div className="mt-6 space-y-3 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700">
                Create an account
              </Link>
            </p>
            <p className="text-sm">
              <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-700">
                Forgot your password?
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Secure access to your child health data
        </p>
      </div>
    </div>
  )
}

export default LoginPage


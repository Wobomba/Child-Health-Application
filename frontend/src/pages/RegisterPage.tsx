import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authService } from '../services/authService'
import { Heart, User, Lock, Mail, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

const RegisterPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const registerMutation = useMutation({
    mutationFn: () => authService.register({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      full_name: formData.full_name,
    }),
    onSuccess: () => {
      toast.success('Account created successfully! Please login.')
      navigate('/login')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Registration failed'
      toast.error(errorMessage)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      registerMutation.mutate()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">PostPart</h1>
          <p className="text-lg text-gray-600">Child Health Monitoring</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
            <p className="mt-2 text-sm text-gray-600">
              Register to start monitoring child health and nutrition
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  className={`input pl-10 ${errors.full_name ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  placeholder="Enter your full name"
                  value={formData.full_name}
                  onChange={(e) => {
                    setFormData({ ...formData, full_name: e.target.value })
                    setErrors({ ...errors, full_name: '' })
                  }}
                />
              </div>
              {errors.full_name && (
                <p className="mt-1 text-sm text-danger-600">{errors.full_name}</p>
              )}
            </div>

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
                  placeholder="Choose a username"
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

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={`input pl-10 ${errors.email ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    setErrors({ ...errors, email: '' })
                  }}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-danger-600">{errors.email}</p>
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
                  placeholder="Create a password"
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className={`input pl-10 ${errors.confirmPassword ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value })
                    setErrors({ ...errors, confirmPassword: '' })
                  }}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-danger-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="btn btn-primary w-full flex items-center justify-center"
              >
                {registerMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Create Account
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500">
          By registering, you agree to our terms of service and privacy policy
        </p>
      </div>
    </div>
  )
}

export default RegisterPage


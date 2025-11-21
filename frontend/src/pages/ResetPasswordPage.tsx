import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'

const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tokenFromUrl = searchParams.get('token')
  
  const [formData, setFormData] = useState({
    token: tokenFromUrl || '',
    new_password: '',
    confirm_password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (tokenFromUrl) {
      setFormData(prev => ({ ...prev, token: tokenFromUrl }))
    }
  }, [tokenFromUrl])

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; new_password: string }) => {
      const response = await api.post('/auth/reset-password/confirm', {
        token: data.token,
        new_password: data.new_password,
      })
      return response.data
    },
    onSuccess: () => {
      setSuccess(true)
      toast.success('Password has been reset successfully!')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to reset password'
      toast.error(errorMessage)
      setErrors({ general: errorMessage })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    if (!formData.token.trim()) {
      setErrors({ token: 'Reset token is required' })
      return
    }
    
    if (!formData.new_password) {
      setErrors({ new_password: 'New password is required' })
      return
    }
    
    if (formData.new_password.length < 6) {
      setErrors({ new_password: 'Password must be at least 6 characters long' })
      return
    }
    
    if (formData.new_password !== formData.confirm_password) {
      setErrors({ confirm_password: 'Passwords do not match' })
      return
    }
    
    resetPasswordMutation.mutate({
      token: formData.token,
      new_password: formData.new_password,
    })
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
            <CheckCircle className="h-16 w-16 text-success-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your password has been reset. You can now login with your new password.
            </p>
            <Link to="/login" className="btn btn-primary w-full">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
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

        {/* Reset Password Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Set New Password</h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your reset token and choose a new password
            </p>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg">
              <p className="text-sm text-danger-700">{errors.general}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Reset Token */}
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
                Reset Token
              </label>
              <input
                id="token"
                name="token"
                type="text"
                required
                className={`input ${errors.token ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                placeholder="Enter your reset token"
                value={formData.token}
                onChange={(e) => {
                  setFormData({ ...formData, token: e.target.value })
                  setErrors({ ...errors, token: '' })
                }}
              />
              {errors.token && (
                <p className="mt-1 text-sm text-danger-600">{errors.token}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="new_password"
                  name="new_password"
                  type="password"
                  required
                  className={`input pl-10 ${errors.new_password ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  placeholder="Enter new password (min. 6 characters)"
                  value={formData.new_password}
                  onChange={(e) => {
                    setFormData({ ...formData, new_password: e.target.value })
                    setErrors({ ...errors, new_password: '' })
                  }}
                />
              </div>
              {errors.new_password && (
                <p className="mt-1 text-sm text-danger-600">{errors.new_password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  required
                  className={`input pl-10 ${errors.confirm_password ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  placeholder="Confirm new password"
                  value={formData.confirm_password}
                  onChange={(e) => {
                    setFormData({ ...formData, confirm_password: e.target.value })
                    setErrors({ ...errors, confirm_password: '' })
                  }}
                />
              </div>
              {errors.confirm_password && (
                <p className="mt-1 text-sm text-danger-600">{errors.confirm_password}</p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="btn btn-primary w-full flex items-center justify-center"
              >
                {resetPasswordMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Resetting...
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5 mr-2" />
                    Reset Password
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage


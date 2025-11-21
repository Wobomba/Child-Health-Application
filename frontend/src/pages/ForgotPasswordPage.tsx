import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Mail, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'

const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [resetToken, setResetToken] = useState<string | null>(null)

  const resetRequestMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await api.post('/auth/reset-password', { email })
      return response.data
    },
    onSuccess: (data) => {
      // In development, show the token. In production, this would be sent via email
      if (data.reset_token) {
        setResetToken(data.reset_token)
        toast.success('Password reset token generated. Check the response for your token (development mode).')
      } else {
        toast.success('If the email exists, a password reset link has been sent.')
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to request password reset'
      toast.error(errorMessage)
      setErrors({ general: errorMessage })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    if (!email.trim()) {
      setErrors({ email: 'Email is required' })
      return
    }
    
    if (!email.includes('@')) {
      setErrors({ email: 'Please enter a valid email address' })
      return
    }
    
    resetRequestMutation.mutate(email)
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
            <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email address and we'll send you a password reset token
            </p>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg">
              <p className="text-sm text-danger-700">{errors.general}</p>
            </div>
          )}

          {resetToken ? (
            <div className="space-y-4">
              <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <p className="text-sm font-medium text-primary-900 mb-2">
                  Development Mode: Your reset token
                </p>
                <p className="text-xs text-primary-700 break-all font-mono bg-white p-2 rounded border">
                  {resetToken}
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  Copy this token and use it on the reset password page
                </p>
              </div>
              <button
                onClick={() => navigate(`/reset-password?token=${resetToken}`)}
                className="btn btn-primary w-full"
              >
                Continue to Reset Password
              </button>
              <button
                onClick={() => {
                  setResetToken(null)
                  setEmail('')
                }}
                className="btn btn-secondary w-full"
              >
                Request Another Token
              </button>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
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
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setErrors({ ...errors, email: '' })
                    }}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-danger-600">{errors.email}</p>
                )}
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={resetRequestMutation.isPending}
                  className="btn btn-primary w-full flex items-center justify-center"
                >
                  {resetRequestMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-5 w-5 mr-2" />
                      Send Reset Token
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

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

export default ForgotPasswordPage


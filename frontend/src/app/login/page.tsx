'use client'

import { useState, FormEvent } from 'react'
import { login } from '@/services/auth'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [rememberMe, setRememberMe] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await login({ email, password })
      console.log('Giriş başarılı:', response)
      // Başarılı girişten sonra ana sayfaya yönlendir
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.error || 'Giriş yapılırken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-green-600 to-gray-700">
      <div className="bg-white/10 p-6 w-80 rounded-2xl shadow-lg backdrop-blur-sm">
        <div className="flex justify-center items-center bg-green-600 w-16 h-16 mx-auto mb-5 rounded-full text-white text-3xl">
          👤
        </div>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-sm">
              {error}
            </div>
          )}
          <input
            type="email"
            placeholder="Email Adresiniz:"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 mb-3 border border-white/30 rounded-md bg-white/20 text-white placeholder-white/70 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Şifre"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 mb-3 border border-white/30 rounded-md bg-white/20 text-white placeholder-white/70 focus:outline-none"
          />
          <div className="flex justify-between items-center text-sm text-white/70 mb-3">
            <label className="flex items-center">
              <input 
                type="checkbox"
                className="mr-1"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Beni Hatırla
            </label>
            <a href="#" className="hover:underline">
              Şifremi Unuttum
            </a>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full p-2 bg-green-600 text-white rounded-md hover:bg-green-500 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Giriş yapılıyor...' : 'LOGIN'}
          </button>
        </form>
      </div>
    </div>
  )
}

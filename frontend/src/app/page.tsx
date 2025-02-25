'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim(), 
          password: password.trim() 
        }),
        credentials: 'omit'
      });

      const data = await response.json();
      console.log('Login response:', response.status, data);

      if (response.ok) {
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          router.push('/dashboard');
        } else {
          setError('Giriş başarılı fakat token alınamadı');
        }
      } else {
        if (data.detail) {
          setError(data.detail);
        } else if (data.error) {
          setError(data.error);
        } else if (data.non_field_errors) {
          setError(data.non_field_errors[0]);
        } else {
          setError('Giriş yapılırken bir hata oluştu');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError('Sunucuya bağlanırken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 p-4">
      <div className="bg-white/10 p-8 rounded-lg shadow-lg w-full max-w-md backdrop-blur-sm">
        <h1 className="text-2xl font-bold mb-6 text-white text-center">Restoran Takip</h1>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded p-3 mb-4 text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-white/20 border border-white/10 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Email adresiniz"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
              Şifre
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white/20 border border-white/10 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Şifreniz"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}

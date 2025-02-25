'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Branch, getBranches, checkBranchStatus } from '@/services/restaurants'

const AUTO_CHECK_INTERVAL = 600 * 1000; // 600 saniye = 10 dakika

export default function RestaurantsPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(false)
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null)
  const router = useRouter()

  // Token kontrolü
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
    }
  }, [router])

  // Şubeleri getir
  const fetchBranches = async () => {
    try {
      const data = await getBranches()
      setBranches(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Şubeler alınamadı')
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/')
      }
    } finally {
      setLoading(false)
    }
  }

  // Tüm şubelerin durumunu kontrol et
  const checkAllBranches = useCallback(async () => {
    try {
      setLastCheckTime(new Date())
      for (const branch of branches) {
        await checkBranchStatus(branch.id)
      }
      // Şubeleri yenile
      await fetchBranches()
    } catch (err: any) {
      setError(err.message || 'Durum kontrolü başarısız')
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/')
      }
    }
  }, [branches, router])

  // Otomatik kontrol
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (autoCheckEnabled) {
      // İlk kontrolü yap
      checkAllBranches();
      
      // Periyodik kontrol başlat
      interval = setInterval(checkAllBranches, AUTO_CHECK_INTERVAL);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoCheckEnabled, checkAllBranches]);

  // Component yüklendiğinde şubeleri getir
  useEffect(() => {
    fetchBranches()
  }, [])

  // Çıkış yap
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const onlineBranches = branches.filter(b => b.is_online).length
  const offlineBranches = branches.filter(b => !b.is_online).length
  const totalBranches = branches.length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center">
        <div className="text-white">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center py-4 border-b border-white/10">
          <h1 className="text-2xl font-bold text-white">Restoran Durum Takibi</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => router.push('/restaurants/add')}
              className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-400 transition-colors"
            >
              Restoran Ekle
            </button>
            <button 
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition-colors"
            >
              Çıkış Yap
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded p-2 mt-4 text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
          {/* Genel Durum */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h2 className="text-xl font-semibold text-white mb-4">Genel Durum</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-white">Toplam Restoran:</span>
                <span className="text-white font-bold">{totalBranches}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white">Online:</span>
                <span className="text-green-400 font-bold">{onlineBranches}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white">Offline:</span>
                <span className="text-red-400 font-bold">{offlineBranches}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-white">Otomatik Kontrol:</span>
                  <button
                    onClick={() => setAutoCheckEnabled(!autoCheckEnabled)}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      autoCheckEnabled 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-gray-500 hover:bg-gray-600'
                    }`}
                  >
                    {autoCheckEnabled ? 'Aktif' : 'Pasif'}
                  </button>
                </div>
                {lastCheckTime && (
                  <div className="text-white/70 text-xs mt-2">
                    Son Kontrol: {lastCheckTime.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Şube Listesi */}
          <div className="lg:col-span-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h2 className="text-xl font-semibold text-white mb-4">Şube Listesi</h2>
            <div className="flex mb-4">
              <input
                type="text"
                placeholder="Ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 p-2 rounded-l-lg bg-white/20 text-white placeholder-white/70 focus:outline-none"
              />
              <button className="px-4 py-2 bg-green-500 text-white rounded-r-lg hover:bg-green-400 transition-colors">
                Ara
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-white">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="text-left py-2">Şube Adı</th>
                    <th className="text-left py-2">Adres</th>
                    <th className="text-left py-2">Yemeksepeti</th>
                    <th className="text-left py-2">Trendyol</th>
                    <th className="text-left py-2">Getir</th>
                    <th className="text-left py-2">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBranches.map(branch => (
                    <tr key={branch.id} className="border-b border-white/5">
                      <td className="py-2">{branch.name}</td>
                      <td className="py-2">{branch.address}</td>
                      <td className={`py-2 ${
                        branch.platform_statuses.yemeksepeti.status === 'Online' 
                          ? 'text-green-400' 
                          : branch.platform_statuses.yemeksepeti.status === 'Offline'
                          ? 'text-red-400'
                          : 'text-gray-400'
                      }`}>
                        {branch.platform_statuses.yemeksepeti.status}
                      </td>
                      <td className={`py-2 ${
                        branch.platform_statuses.trendyol.status === 'Online' 
                          ? 'text-green-400' 
                          : branch.platform_statuses.trendyol.status === 'Offline'
                          ? 'text-red-400'
                          : 'text-gray-400'
                      }`}>
                        {branch.platform_statuses.trendyol.status}
                      </td>
                      <td className={`py-2 ${
                        branch.platform_statuses.getir.status === 'Online' 
                          ? 'text-green-400' 
                          : branch.platform_statuses.getir.status === 'Offline'
                          ? 'text-red-400'
                          : 'text-gray-400'
                      }`}>
                        {branch.platform_statuses.getir.status}
                      </td>
                      <td className="py-2">
                        <button
                          onClick={() => checkBranchStatus(branch.id)}
                          className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-400 transition-colors"
                        >
                          Kontrol Et
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grafikler */}
          <div className="lg:col-span-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h2 className="text-xl font-semibold text-white mb-4">Grafikler</h2>
            <div className="flex justify-center items-center h-40 bg-white/5 rounded-lg">
              <p className="text-white/70">Grafikler Buraya Gelecek</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getRestaurants, getBranches, checkBranchStatus, deleteRestaurant, Restaurant, Branch } from '@/services/restaurants'

export default function Dashboard() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nextCheckSeconds, setNextCheckSeconds] = useState(() => {
    // Son kontrol zamanını localStorage'dan al
    const lastCheck = localStorage.getItem('lastCheckTime')
    if (!lastCheck) {
      // İlk yüklemede şu anı kaydet ve 5 dakikadan başla
      localStorage.setItem('lastCheckTime', Date.now().toString())
      return 300
    }
    
    // Geçen süreyi hesapla
    const elapsed = Math.floor((Date.now() - parseInt(lastCheck)) / 1000)
    const remaining = 300 - elapsed
    
    // Eğer süre dolmuşsa 5 dakika başlat
    return remaining > 0 ? remaining : 300
  })
  const router = useRouter()

  // Token kontrolü
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
    }
  }, [router])

  // Restoranları getir
  const fetchRestaurants = async () => {
    try {
      const data = await getRestaurants()
      setRestaurants(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Restoranlar alınamadı')
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/')
      }
    }
  }

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

  // Şube durumunu kontrol et
  const handleCheckStatus = async (branchId: number) => {
    try {
      await checkBranchStatus(branchId)
      // Şubeleri yenile
      fetchBranches()
    } catch (err: any) {
      setError(err.message || 'Durum kontrolü başarısız')
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/')
      }
    }
  }

  // Restoran sil
  const handleDeleteRestaurant = async (restaurantId: number) => {
    if (window.confirm('Bu restoranı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        await deleteRestaurant(restaurantId)
        // Restoranları yenile
        fetchRestaurants()
        // Şubeleri yenile
        fetchBranches()
      } catch (err: any) {
        setError(err.message || 'Restoran silinirken bir hata oluştu')
        if (err.response?.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/')
        }
      }
    }
  }

  // Tüm şubeleri kontrol et
  const checkAllBranches = async () => {
    try {
      // Son kontrol zamanını kaydet
      localStorage.setItem('lastCheckTime', Date.now().toString())
      setNextCheckSeconds(300) // Sayacı resetle
      
      // Tüm şubeleri al
      const branches = await getBranches()
      
      // Her şube için durumu kontrol et
      for (const branch of branches) {
        await checkBranchStatus(branch.id)
      }
      
      // Şubeleri yenile
      fetchBranches()
    } catch (err: any) {
      console.error('Otomatik kontrol hatası:', err)
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/')
      }
    }
  }

  // Component yüklendiğinde verileri getir
  useEffect(() => {
    fetchRestaurants()
    fetchBranches()

    // İlk yüklemede son kontrol zamanı yoksa şu anı kaydet
    if (!localStorage.getItem('lastCheckTime')) {
      localStorage.setItem('lastCheckTime', Date.now().toString())
    }

    // Her 5 dakikada bir tüm şubelerin durumunu kontrol et
    const autoCheckInterval = setInterval(checkAllBranches, 5 * 60 * 1000)

    // Her saniye sayacı güncelle
    const countdownInterval = setInterval(() => {
      setNextCheckSeconds(prev => {
        if (prev <= 0) {
          // Süre dolduğunda kontrol yap
          checkAllBranches()
          return 300 // 5 dakika
        }
        return prev - 1
      })
    }, 1000)

    // Component unmount olduğunda interval'leri temizle
    return () => {
      clearInterval(autoCheckInterval)
      clearInterval(countdownInterval)
    }
  }, [])

  // Çıkış yap
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

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
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <span className="text-sm text-white/70">
              Sonraki kontrol: {Math.floor(nextCheckSeconds / 60)}:{(nextCheckSeconds % 60).toString().padStart(2, '0')}
            </span>
          </div>
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
                <span className="text-white font-bold">{restaurants.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white">Toplam Şube:</span>
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
            </div>
          </div>

          {/* Restoran Listesi */}
          <div className="lg:col-span-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h2 className="text-xl font-semibold text-white mb-4">Restoran Listesi</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-white">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="text-left py-2">Restoran Adı</th>
                    <th className="text-center py-2">Toplam Şube</th>
                    <th className="text-center py-2">Online</th>
                    <th className="text-center py-2">Offline</th>
                    <th className="text-center py-2">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {restaurants.map(restaurant => (
                    <tr key={restaurant.id} className="border-b border-white/5">
                      <td className="py-2">{restaurant.name}</td>
                      <td className="text-center py-2">{restaurant.total_branches}</td>
                      <td className="text-center py-2 text-green-400">{restaurant.online_branches}</td>
                      <td className="text-center py-2 text-red-400">{restaurant.offline_branches}</td>
                      <td className="text-center py-2">
                        <button
                          onClick={() => handleDeleteRestaurant(restaurant.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition-colors"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Şube Listesi */}
          <div className="lg:col-span-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h2 className="text-xl font-semibold text-white mb-4">Şube Listesi</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-white">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="text-left py-2">Şube Adı</th>
                    <th className="text-left py-2">Adres</th>
                    <th className="text-left py-2">Yemeksepeti</th>
                    <th className="text-left py-2">Migros</th>
                    <th className="text-left py-2">Getir</th>
                    <th className="text-left py-2">Trendyol</th>
                    <th className="text-left py-2">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map(branch => (
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
                        branch.platform_statuses.migros.status === 'Online' 
                          ? 'text-green-400' 
                          : branch.platform_statuses.migros.status === 'Offline'
                          ? 'text-red-400'
                          : 'text-gray-400'
                      }`}>
                        {branch.platform_statuses.migros.status}
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
                      <td className={`py-2 ${
                        branch.platform_statuses.trendyol.status === 'Online' 
                          ? 'text-green-400' 
                          : branch.platform_statuses.trendyol.status === 'Offline'
                          ? 'text-red-400'
                          : 'text-gray-400'
                      }`}>
                        {branch.platform_statuses.trendyol.status}
                      </td>
                      <td className="py-2">
                        <button
                          onClick={() => handleCheckStatus(branch.id)}
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

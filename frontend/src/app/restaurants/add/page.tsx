'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createRestaurant, createBranch } from '@/services/restaurants'

interface FormData {
  restaurantName: string;
  branchName: string;
  address: string;
  notification_email: string;
  telegram_username: string;
  yemeksepeti: string;
  getir: string;
  migros_api_key: string;
  migros_restaurant_id: string;
  trendyol_supplier_id: string;
  trendyol_api_key: string;
  trendyol_api_secret: string;
}

export default function AddRestaurantPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<FormData>({
    restaurantName: '',
    branchName: '',
    address: '',
    notification_email: '',
    telegram_username: '',
    yemeksepeti: '',
    getir: '',
    migros_api_key: '',
    migros_restaurant_id: '',
    trendyol_supplier_id: '',
    trendyol_api_key: '',
    trendyol_api_secret: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Önce restoranı oluştur
      const restaurant = await createRestaurant({
        name: formData.restaurantName
      })

      // Sonra şubeyi oluştur
      await createBranch({
        restaurant: restaurant.id,
        name: formData.branchName,
        address: formData.address,
        notification_email: formData.notification_email,
        telegram_username: formData.telegram_username,
        yemeksepeti_url: formData.yemeksepeti || '',
        getir_url: formData.getir || '',
        migros_api_key: formData.migros_api_key || '',
        migros_restaurant_id: formData.migros_restaurant_id || '',
        trendyol_supplier_id: formData.trendyol_supplier_id || '',
        trendyol_api_key: formData.trendyol_api_key || '',
        trendyol_api_secret: formData.trendyol_api_secret || ''
      })

      // Başarılı kayıttan sonra dashboard'a yönlendir
      router.push('/dashboard')
      router.refresh() // Dashboard'ı yenile
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.error || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-gray-700 p-4 text-white">
      <header className="flex justify-between items-center py-4 border-b border-white/10">
        <h1 className="text-2xl font-bold">Restoran ve Şube Ekle</h1>
        <button 
          onClick={() => router.push('/dashboard')}
          className="bg-green-600 px-4 py-2 rounded-lg text-sm hover:bg-green-500"
        >
          Dashboard'a Dön
        </button>
      </header>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-300">
          {error}
        </div>
      )}

      <main className="max-w-2xl mx-auto mt-8">
        <div className="bg-white/10 rounded-lg p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label htmlFor="restaurantName" className="mb-1 text-white">Restoran İsmi:</label>
                <input
                  type="text"
                  id="restaurantName"
                  name="restaurantName"
                  value={formData.restaurantName}
                  onChange={handleChange}
                  required
                  className="w-full p-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="Restoran Adını Girin"
                />
              </div>
              
              <div className="flex flex-col">
                <label htmlFor="branchName" className="mb-1 text-white">Şube:</label>
                <input
                  type="text"
                  id="branchName"
                  name="branchName"
                  value={formData.branchName}
                  onChange={handleChange}
                  required
                  className="w-full p-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="Şube Adını Girin"
                />
              </div>

              <div className="flex flex-col md:col-span-2">
                <label htmlFor="address" className="mb-1 text-white">Adres:</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full p-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="Şube Adresini Girin"
                />
              </div>

              <div className="flex flex-col md:col-span-2">
                <label htmlFor="notification_email" className="mb-1 text-white">Bildirim E-posta Adresi:</label>
                <input
                  type="email"
                  id="notification_email"
                  name="notification_email"
                  value={formData.notification_email}
                  onChange={handleChange}
                  required
                  placeholder="Durum değişikliği bildirimlerini alacağınız e-posta"
                  className="w-full p-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                />
              </div>

              <div className="flex flex-col md:col-span-2">
                <label htmlFor="telegram_username" className="mb-1 text-white">Telegram Kullanıcı Adı:</label>
                <input
                  type="text"
                  id="telegram_username"
                  name="telegram_username"
                  value={formData.telegram_username}
                  onChange={handleChange}
                  placeholder="@username (opsiyonel)"
                  className="w-full p-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Yemeksepeti Linki
                </label>
                <input
                  type="text"
                  name="yemeksepeti"
                  value={formData.yemeksepeti}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="Yemeksepeti Linkini Girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Getir Link
                </label>
                <input
                  type="text"
                  name="getir"
                  value={formData.getir}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="Getir URL'sini Girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Migros API Key
                </label>
                <input
                  type="text"
                  name="migros_api_key"
                  value={formData.migros_api_key}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="Migros API Key'i Girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Migros Restaurant ID
                </label>
                <input
                  type="text"
                  name="migros_restaurant_id"
                  value={formData.migros_restaurant_id}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="Migros Restoran ID'sini Girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Trendyol Supplier ID
                </label>
                <input
                  type="text"
                  name="trendyol_supplier_id"
                  value={formData.trendyol_supplier_id}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="Trendyol Supplier ID'sini Girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Trendyol API Key
                </label>
                <input
                  type="text"
                  name="trendyol_api_key"
                  value={formData.trendyol_api_key}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="Trendyol API Key'i Girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Trendyol API Secret
                </label>
                <input
                  type="text"
                  name="trendyol_api_secret"
                  value={formData.trendyol_api_secret}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="Trendyol API Secret'ı Girin"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

import requests
import time

def get_updates(bot_token):
    url = f'https://api.telegram.org/bot{bot_token}/getUpdates'
    response = requests.get(url)
    print("Updates:", response.json())
    return response.json()

def send_test_message():
    bot_token = '7878470743:AAFBCdZ_aYR-tUqrq3tVdT-1t-oc7G44hs4'
    
    # Bot güncellemelerini al
    updates = get_updates(bot_token)
    if not updates.get('ok'):
        print("Güncellemeler alınamadı!")
        return
        
    # En son mesajı gönderen kullanıcının chat_id'sini al
    results = updates.get('result', [])
    if not results:
        print("Hiç güncelleme yok! Lütfen bot'a /start komutu gönderin.")
        return
        
    last_update = results[-1]
    chat_id = last_update['message']['chat']['id']
    print(f"Chat ID: {chat_id}")
    
    message = """
🔔 <b>Test Mesajı</b>

Bu bir test mesajıdır. Bot başarıyla çalışıyor!

Restoran durumu değiştiğinde benzer bir bildirim alacaksınız.
"""
    
    url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    data = {
        'chat_id': chat_id,
        'text': message,
        'parse_mode': 'HTML'
    }
    
    try:
        response = requests.post(url, json=data)
        print("Response:", response.text)
        response.raise_for_status()
        print("✅ Mesaj başarıyla gönderildi!")
    except Exception as e:
        print(f"❌ Hata: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            print("Hata Detayı:", e.response.text)

if __name__ == '__main__':
    send_test_message()

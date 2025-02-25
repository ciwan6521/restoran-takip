from telegram_bot import TelegramBot

def test_telegram_message(username: str):
    """
    Test amaçlı Telegram mesajı gönder
    Args:
        username: Telegram kullanıcı adı (@username)
    """
    bot = TelegramBot()
    
    # Bot bilgilerini kontrol et
    bot_info = bot.get_bot_info()
    if not bot_info:
        print("❌ Bot bilgileri alınamadı! Token'ı kontrol edin.")
        return
    
    print(f"✅ Bot bulundu: @{bot_info['username']}")
    
    # Test mesajı
    message = """
🔔 <b>Test Mesajı</b>

Bu bir test mesajıdır. Bot başarıyla çalışıyor!

Restoran durumu değiştiğinde benzer bir bildirim alacaksınız.
"""
    
    # username'den @ işaretini kaldır
    username = username.lstrip('@')
    
    # Mesajı gönder
    success = bot.send_message(f"@{username}", message)
    
    if success:
        print(f"✅ Test mesajı @{username} kullanıcısına gönderildi!")
    else:
        print(f"❌ Mesaj gönderilemedi! Kullanıcı adını kontrol edin.")

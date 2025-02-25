import requests
import logging
from django.conf import settings
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class TelegramBot:
    def __init__(self):
        self.token = settings.TELEGRAM_BOT_TOKEN
        self.bot_username = settings.TELEGRAM_BOT_USERNAME
        self.api_url = f'https://api.telegram.org/bot{self.token}'

    def get_bot_info(self) -> Optional[Dict[str, Any]]:
        """Bot bilgilerini al"""
        try:
            response = requests.get(f'{self.api_url}/getMe')
            response.raise_for_status()
            return response.json().get('result')
        except Exception as e:
            logger.error(f"Error getting bot info: {str(e)}")
            return None

    def get_chat_id(self, username: str) -> Optional[str]:
        """
        Kullanıcı adından chat ID'sini al.
        Not: Bu fonksiyon çalışmayabilir çünkü Telegram API'si doğrudan
        username'den chat ID almaya izin vermiyor. Alternatif çözüm:
        1. Kullanıcı bot'a /start komutu gönderir
        2. Bot kullanıcının chat ID'sini kaydeder
        """
        try:
            # Bu endpoint gerçekte yok, sadece örnek
            response = requests.get(f'{self.api_url}/getChatId', 
                                 params={'username': username})
            response.raise_for_status()
            return response.json().get('result', {}).get('chat_id')
        except Exception as e:
            logger.error(f"Error getting chat ID for @{username}: {str(e)}")
            return None

    def send_message(self, chat_id: str, message: str) -> bool:
        """Mesaj gönder"""
        try:
            # Kullanıcı adından @ işaretini kaldır
            if isinstance(chat_id, str) and chat_id.startswith('@'):
                chat_id = chat_id.lstrip('@')

            response = requests.post(
                f'{self.api_url}/sendMessage',
                json={
                    'chat_id': chat_id,  # Direkt chat_id kullan
                    'text': message,
                    'parse_mode': 'HTML'
                }
            )
            response.raise_for_status()
            logger.info(f"Message sent to chat_id {chat_id}")
            return True
        except Exception as e:
            logger.error(f"Error sending message to {chat_id}: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Error details: {e.response.text}")
            return False

def send_status_change_notification(branch, platform: str, old_status: bool, new_status: bool) -> bool:
    """
    Platform durumu değiştiğinde Telegram bildirimi gönder
    """
    if not branch.telegram_username:
        return False

    if not settings.TELEGRAM_BOT_TOKEN:
        logger.warning("Telegram bot token not configured")
        return False

    if old_status and not new_status:  # Online'dan offline'a geçiş
        bot = TelegramBot()
        
        # Bot'un çalışıp çalışmadığını kontrol et
        bot_info = bot.get_bot_info()
        if not bot_info:
            logger.error("Could not get bot info. Check your bot token.")
            return False

        message = f"""
⚠️ <b>Platform Durumu Değişti</b>

Restoran: <b>{branch.restaurant.name}</b>
Şube: <b>{branch.name}</b>
Platform: <b>{platform}</b>
Durum: <b>Online ➡️ Offline</b>

Lütfen kontrol ediniz!
"""
        # Telegram kullanıcı adını kullan
        return bot.send_message(branch.telegram_username, message)

    return False

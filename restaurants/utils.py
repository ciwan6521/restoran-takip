from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def send_status_change_notification(branch, platform, old_status, new_status):
    """
    Platform durumu değiştiğinde (online -> offline) email bildirimi gönder
    """
    if old_status and not new_status and branch.notification_email:  # Online'dan offline'a geçiş
        subject = f"[Önemli] {branch.name} - {platform} Durumu Değişti"
        message = f"""
        Merhaba,
        
        {branch.name} şubenizin {platform} platformundaki durumu Online'dan Offline'a değişti.
        
        Şube Bilgileri:
        - Adres: {branch.address}
        - Değişim Zamanı: {branch.last_status_change}
        
        Lütfen kontrol ediniz.
        """
        
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[branch.notification_email],
                fail_silently=False,
            )
            logger.info(f"Status change notification sent for {branch.name} - {platform}")
        except Exception as e:
            logger.error(f"Error sending notification for {branch.name} - {platform}: {str(e)}")

import asyncio
from django.core.management.base import BaseCommand
from scraper.services import check_all_branches

class Command(BaseCommand):
    help = 'Tüm şubelerin platform durumlarını kontrol et'

    def handle(self, *args, **options):
        self.stdout.write('Şube durumları kontrol ediliyor...')
        
        # Event loop oluştur ve çalıştır
        loop = asyncio.get_event_loop()
        results = loop.run_until_complete(check_all_branches())
        
        # Sonuçları göster
        for i, branch_results in enumerate(results):
            self.stdout.write(f'\nŞube {i+1} sonuçları:')
            for platform, status in branch_results.items():
                status_text = 'Online' if status else 'Offline'
                self.stdout.write(f'  {platform}: {status_text}')

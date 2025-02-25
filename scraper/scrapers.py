import asyncio
from bs4 import BeautifulSoup
from typing import Dict, Optional, List
from datetime import datetime, timedelta
import abc
import re
import random
from playwright.async_api import async_playwright
import logging
import aiohttp
import base64
import requests

# Logging ayarları
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

MOBILE_USER_AGENTS = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36'
]

class StatusCache:
    """Cache for platform status checks"""
    def __init__(self, ttl_seconds: int = 60):
        self.cache = {}
        self.ttl = ttl_seconds

    def get(self, url: str) -> Optional[bool]:
        if url in self.cache:
            timestamp, status = self.cache[url]
            if datetime.now() - timestamp < timedelta(seconds=self.ttl):
                return status
            del self.cache[url]
        return None

    def set(self, url: str, status: bool):
        self.cache[url] = (datetime.now(), status)

class PlatformScraper(abc.ABC):
    """Platform scraper base class"""
    def __init__(self):
        self._status_cache = StatusCache()
        self._wait_timeout = 60  # saniye

    async def _get_page_content(self, url: str, wait_for_selector: str = None) -> Optional[str]:
        """Get page content using browser with retries"""
        try:
            async with async_playwright() as p:
                # Browser'ı başlat
                browser = await p.webkit.launch(headless=False)  # headless=False ile görünür pencerede aç
                
                try:
                    # iPhone 12 ayarlarını al ve user agent'ı güncelle
                    iphone = p.devices['iPhone 12']
                    device_settings = {**iphone}
                    device_settings['user_agent'] = random.choice(MOBILE_USER_AGENTS)
                    
                    # Yeni context oluştur
                    context = await browser.new_context(
                        **device_settings,
                        locale='tr-TR',
                        timezone_id='Europe/Istanbul',
                        geolocation={'latitude': 41.0082, 'longitude': 28.9784},
                        permissions=['geolocation']
                    )
                    
                    # Stealth mode
                    await context.add_init_script("""
                        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
                        Object.defineProperty(navigator, 'languages', { get: () => ['tr-TR', 'tr', 'en-US', 'en'] });
                    """)
                    
                    # Yeni sayfa aç
                    page = await context.new_page()
                    
                    try:
                        logger.info(f"Navigating to {url}")
                        await page.goto(url, wait_until='networkidle', timeout=60000)
                        
                        logger.info("Waiting for content to load...")
                        await page.wait_for_load_state('domcontentloaded', timeout=60000)
                        await page.wait_for_load_state('networkidle', timeout=60000)
                        
                        # JavaScript'in çalışması için bekle
                        logger.info("Waiting for JavaScript execution...")
                        await page.wait_for_timeout(5000)
                        
                        # Selector varsa bekle
                        if wait_for_selector:
                            await page.wait_for_selector(wait_for_selector, timeout=10000)
                        
                        logger.info("Getting page content...")
                        content = await page.content()
                        
                        # Sayfayı manuel olarak kapatmak için bekle
                        logger.info("Waiting before closing page...")
                        await asyncio.sleep(5)  # 5 saniye bekle
                        
                        return content
                        
                    finally:
                        await page.close()
                        
                finally:
                    await context.close()
                    await browser.close()
                    
        except Exception as e:
            logger.error(f"Error getting page content: {str(e)}", exc_info=True)
            return None

    async def _check_status_with_cache(self, url: str) -> bool:
        """Check status with caching"""
        cached_status = self._status_cache.get(url)
        if cached_status is not None:
            logger.info(f"Using cached status for {url}: {cached_status}")
            return cached_status

        status = await self.check_status(url)
        self._status_cache.set(url, status)
        return status

    @abc.abstractmethod
    async def check_status(self, url: str) -> bool:
        """Check if the restaurant is online on the platform"""
        pass

    def extract_restaurant_id(self, url: str) -> Optional[str]:
        """Extract restaurant ID from URL"""
        return None

class GetirScraper(PlatformScraper):
    async def check_status(self, branch):
        """Getir Yemek için restaurant durumunu kontrol et"""
        logger.info("="*50)
        logger.info(f"[Getir] Checking URL: {branch.getir_url}")
        logger.info("="*50)
        
        if not branch.getir_url:
            logger.warning("[Getir] URL not found")
            return {"status": "URL Yok"}
        
        try:
            # Her istekten önce 5-10 saniye arası rastgele bekle
            wait_time = random.uniform(5, 10)
            logger.info(f"[Getir] Waiting {wait_time:.1f} seconds before request...")
            await asyncio.sleep(wait_time)
            
            # Sayfa içeriğini al
            html = await self._get_page_content(branch.getir_url)
            if not html:
                logger.warning("[Getir] Failed to get page content")
                return {"status": "Offline"}
                
            soup = BeautifulSoup(html, 'html.parser')
            
            # Belirtilen class'a sahip elementi bul
            status_element = soup.find(class_="style__LabelWrapper-sc-__sc-9sluxo-2 bTBhBW")
            
            if not status_element:
                logger.warning("[Getir] Status element not found")
                return {"status": "Online"}
                
            status_text = status_element.get_text(strip=True).lower()
            logger.info(f"[Getir] Found status text: {status_text}")
            
            # "kapalı" kelimesi varsa offline
            is_offline = "kapalı" in status_text
            
            if is_offline:
                logger.info("[Getir] Status: OFFLINE (Found 'kapalı')")
                return {"status": "Offline"}
            else:
                logger.info("[Getir] Status: ONLINE (No 'kapalı' found)")
                return {"status": "Online"}

        except Exception as e:
            logger.error(f"[Getir] Error in check_status: {str(e)}")
            return {"status": "Error"}

class YemeksepetiScraper(PlatformScraper):
    def __init__(self):
        super().__init__()
        self.browser = None
        self.playwright = None
        self.context = None

    async def init_browser(self):
        try:
            if not self.browser:
                logger.info("[Yemeksepeti] Initializing browser...")
                self.playwright = await async_playwright().start()
                logger.info("[Yemeksepeti] Playwright started")
                self.browser = await self.playwright.webkit.launch(
                    headless=False,
                )
                logger.info("[Yemeksepeti] Browser launched")
                
                # Context'i burada oluştur
                self.context = await self.browser.new_context(
                    viewport={'width': 390, 'height': 844},  # iPhone 12 ekran boyutu
                    user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'  # iPhone Safari user-agent
                )
                logger.info("[Yemeksepeti] Context created with iPhone 12 settings")
        except Exception as e:
            logger.error(f"[Yemeksepeti] Error initializing browser: {str(e)}")
            await self.cleanup()
            raise e

    async def cleanup(self):
        try:
            if self.context:
                logger.info("[Yemeksepeti] Closing context...")
                await self.context.close()
                self.context = None
            if self.browser:
                logger.info("[Yemeksepeti] Closing browser...")
                await self.browser.close()
                self.browser = None
            if self.playwright:
                logger.info("[Yemeksepeti] Stopping playwright...")
                await self.playwright.stop()
                self.playwright = None
        except Exception as e:
            logger.error(f"[Yemeksepeti] Error in cleanup: {str(e)}")

    async def check_status(self, branch):
        if not branch.yemeksepeti_url:
            logger.warning("[Yemeksepeti] URL not found")
            return {"status": "URL Yok"}
            
        page = None
        try:
            logger.info(f"[Yemeksepeti] Checking status for URL: {branch.yemeksepeti_url}")
            await self.init_browser()
            
            # İlk bekleme
            await asyncio.sleep(2)
            
            logger.info("[Yemeksepeti] Creating new page...")
            page = await self.context.new_page()
            
            # Sayfa oluşturma sonrası bekleme
            await asyncio.sleep(2)
            
            # Sayfaya git ve yüklenmeyi bekle
            logger.info("[Yemeksepeti] Navigating to URL...")
            try:
                response = await page.goto(
                    branch.yemeksepeti_url, 
                    wait_until='networkidle',
                    timeout=90000  # 90 saniye timeout
                )
                
                if not response:
                    logger.error("[Yemeksepeti] Failed to get response from page")
                    return {"status": "Online"}
                    
                if response.status != 200:
                    logger.error(f"[Yemeksepeti] Got status code {response.status}")
                    return {"status": "Online"}
                
                logger.info("[Yemeksepeti] Page loaded")
            except Exception as e:
                logger.error(f"[Yemeksepeti] Error loading page: {str(e)}")
                return {"status": "Online"}
            
            # Sayfa yüklenmesi için ekstra bekleme
            await asyncio.sleep(10)
            
            try:
                # Önce sayfanın hazır olmasını bekle
                await page.wait_for_load_state('networkidle', timeout=30000)
                await page.wait_for_load_state('domcontentloaded', timeout=30000)
                
                # data-testid="cart-expedition-delivery-btn" elementini bekle
                logger.info("[Yemeksepeti] Waiting for delivery button...")
                delivery_button = await page.wait_for_selector(
                    '[data-testid="cart-expedition-delivery-btn"]',
                    state='visible',
                    timeout=30000
                )
                
                if not delivery_button:
                    logger.warning("[Yemeksepeti] Delivery button not found")
                    return {"status": "Online"}
                
                logger.info("[Yemeksepeti] Delivery button found")
                
                # Element görünür olana kadar ekstra bekleme
                await asyncio.sleep(5)
                
                # Sayfanın screenshot'ını al (debug için)
                await page.screenshot(path='yemeksepeti_debug.png')
                
                # Elementin içeriğini kontrol et
                button_text = await delivery_button.text_content()
                logger.info(f"[Yemeksepeti] Button text: {button_text}")
                
                if not button_text:
                    logger.warning("[Yemeksepeti] Button text is empty")
                    return {"status": "Online"}
                
                # "Mevcut değil" kontrolü
                is_online = "Mevcut değil" not in button_text
                logger.info(f"[Yemeksepeti] Restaurant is {'ONLINE' if is_online else 'OFFLINE'}")
                
                # Son bir bekleme
                await asyncio.sleep(2)
                
                return {"status": "Online" if is_online else "Offline"}
                
            except Exception as e:
                # Element bulunamazsa veya timeout olursa restoran online kabul edilir
                logger.warning(f"[Yemeksepeti] Element not found or timeout, assuming restaurant is online: {str(e)}")
                return {"status": "Online"}
                
        except Exception as e:
            logger.error(f"[Yemeksepeti] Error in check_status: {str(e)}")
            return {"status": "Error"}
            
        finally:
            try:
                if page:
                    logger.info("[Yemeksepeti] Closing page...")
                    await page.close()
                await self.cleanup()
            except Exception as e:
                logger.error(f"[Yemeksepeti] Error in cleanup: {str(e)}")

class MigrosApiScraper(PlatformScraper):
    def prepare_headers(self):
        return {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    async def check_status(self, branch):
        try:
            logger.info(f"[Migros] Checking status for restaurant ID: {branch.migros_restaurant_id}")
            url = f"https://gourmet.migrosonline.com/Store/GetStoreDetail?storeId={branch.migros_restaurant_id}"
            logger.info(f"[Migros] API URL: {url}")
            
            headers = self.prepare_headers()
            if branch.migros_api_key:
                headers["XApiKey"] = branch.migros_api_key
            logger.info("[Migros] Headers prepared")
            
            logger.info("[Migros] Sending API request...")
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    logger.info(f"[Migros] Response status: {response.status}")
                    response_data = await response.json()
                    logger.info(f"[Migros] Response data: {response_data}")
                    
                    # Hata kontrolü ekle
                    if response.status != 200 or response_data.get('status') == 'Error':
                        logger.error(f"[Migros] API error response: {response_data}")
                        return False
                    
                    # Migros API'den gelen active değerini boolean'a çevir
                    data = response_data.get('data', {})
                    is_active = bool(data.get('active', False))
                    logger.info(f"[Migros] Restaurant is {'ONLINE' if is_active else 'OFFLINE'} (is_active={is_active})")
                    
                    return is_active
                    
        except Exception as e:
            logger.error(f"[Migros] Error in check_status: {str(e)}")
            return False

    def extract_restaurant_id(self, url: str) -> Optional[str]:
        """Migros URL'inden restoran ID'sini çıkar"""
        match = re.search(r'/([^/]+)(?:/[^/]+)?$', url)
        return match.group(1) if match else None

class TrendyolApiScraper(PlatformScraper):
    BASE_URL = "https://api.tgoapis.com/integrator/store/meal/suppliers/{supplierid}/stores"

    async def check_status(self, branch):
        try:
            logger.info("[Trendyol] Checking status...")
            if not branch.trendyol_supplier_id or not branch.trendyol_api_key or not branch.trendyol_api_secret:
                logger.warning("[Trendyol] Missing API credentials")
                return {"status": "Bilgi Yok"}

            # URL'yi oluştur
            url = self.BASE_URL.replace("{supplierid}", str(branch.trendyol_supplier_id))
            logger.info(f"[Trendyol] API URL: {url}")

            # Basic Authentication için şifreleme
            credentials = f"{branch.trendyol_api_key}:{branch.trendyol_api_secret}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()

            # Header bilgileri
            headers = {
                "Authorization": f"Basic {encoded_credentials}",
                "User-Agent": f"{branch.trendyol_supplier_id} - SelfIntegration",
                "Content-Type": "application/json"
            }

            # API isteği
            logger.info("[Trendyol] Sending API request...")
            response = requests.get(url, headers=headers)
            logger.info(f"[Trendyol] Response status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                restaurants = data.get("restaurants", [])
                
                # Restoranın durumunu kontrol et
                for restaurant in restaurants:
                    status = restaurant.get("workingStatus", "UNKNOWN")
                    logger.info(f"[Trendyol] Restaurant status: {status}")
                    
                    # Duruma göre status değerini belirle
                    if status == "OPEN":
                        return {"status": "Online"}
                    elif status in ["CLOSED", "HOLIDAY", "BUSY"]:
                        return {"status": "Offline"}
                    else:
                        return {"status": "Error"}

                logger.warning("[Trendyol] No restaurant found in response")
                return {"status": "Offline"}

            elif response.status_code == 401:
                logger.error("[Trendyol] Authentication failed! Wrong API Key or Secret")
                return {"status": "Auth Error"}
            elif response.status_code == 403:
                logger.error("[Trendyol] Missing or wrong User-Agent")
                return {"status": "Auth Error"}
            elif response.status_code == 429:
                logger.error("[Trendyol] Too many requests")
                return {"status": "Rate Limited"}
            else:
                logger.error(f"[Trendyol] API Error: {response.status_code} - {response.text}")
                return {"status": "API Error"}

        except Exception as e:
            logger.error(f"[Trendyol] Error in check_status: {str(e)}")
            return {"status": "Error"}

# Platform scraper mapping
PLATFORM_SCRAPERS = {
    'yemeksepeti': YemeksepetiScraper(),
    'getir': GetirScraper(),
    'migros': MigrosApiScraper(),
    'trendyol': TrendyolApiScraper()
}

async def check_branch_status(branch) -> Dict[str, Dict[str, str]]:
    """
    Şubenin tüm platformlardaki durumunu kontrol et
    """
    results = {}
    tasks = []
    
    # Yemeksepeti durumu
    if branch.yemeksepeti_url:
        logger.info(f"Checking Yemeksepeti status for branch: {branch.name}")
        scraper = PLATFORM_SCRAPERS['yemeksepeti']
        tasks.append(('yemeksepeti', scraper.check_status(branch)))
    else:
        results['yemeksepeti'] = {"status": "URL Yok"}
    
    # Getir durumu
    if branch.getir_url:
        logger.info(f"Checking Getir status for branch: {branch.name}")
        scraper = PLATFORM_SCRAPERS['getir']
        tasks.append(('getir', scraper.check_status(branch)))
    else:
        results['getir'] = {"status": "URL Yok"}
    
    # Migros durumu
    if branch.migros_api_key and branch.migros_restaurant_id:
        logger.info(f"Checking Migros status for branch: {branch.name}")
        scraper = PLATFORM_SCRAPERS['migros']
        tasks.append(('migros', scraper.check_status(branch)))
    else:
        results['migros'] = {"status": "Bilgi Yok"}
    
    # Trendyol durumu
    if branch.trendyol_supplier_id and branch.trendyol_api_key and branch.trendyol_api_secret:
        logger.info(f"Checking Trendyol status for branch: {branch.name}")
        scraper = PLATFORM_SCRAPERS['trendyol']
        tasks.append(('trendyol', scraper.check_status(branch)))
    else:
        results['trendyol'] = {"status": "Bilgi Yok"}
    
    # Tüm kontrolleri paralel çalıştır
    if tasks:
        task_results = await asyncio.gather(*[task[1] for task in tasks], return_exceptions=True)
        for (platform, _), result in zip(tasks, task_results):
            if isinstance(result, Exception):
                logger.error(f"Error checking {platform} status: {str(result)}")
                results[platform] = {"status": "Error"}
            else:
                if platform == 'migros':
                    results[platform] = {"status": "Online" if result else "Offline"}
                else:
                    results[platform] = result
    
    return results

from django.db import models
from django.conf import settings

# Create your models here.

class Restaurant(models.Model):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    @property
    def total_branches(self):
        return self.branches.count()

    @property
    def online_branches(self):
        return self.branches.filter(is_online=True).count()

    @property
    def offline_branches(self):
        return self.branches.filter(is_online=False).count()

class Branch(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='branches')
    name = models.CharField(max_length=100)
    manager = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='managed_branches')
    address = models.TextField()
    is_online = models.BooleanField(default=False)
    last_status_change = models.DateTimeField(auto_now=True)
    notification_email = models.EmailField(blank=True)  # Bildirim için email
    telegram_username = models.CharField(max_length=100, blank=True, help_text="Telegram kullanıcı adı (@username)")
    # Platform URLs ve API Keys
    yemeksepeti_url = models.URLField(max_length=500, blank=True)
    getir_url = models.URLField(max_length=500, blank=True)
    migros_api_key = models.CharField(max_length=100, blank=True)
    migros_restaurant_id = models.CharField(max_length=100, blank=True)
    trendyol_supplier_id = models.CharField(max_length=100, blank=True)
    trendyol_api_key = models.CharField(max_length=100, blank=True)
    trendyol_api_secret = models.CharField(max_length=100, blank=True)
    
    # Platform statuses
    yemeksepeti_status = models.BooleanField(default=False)
    getir_status = models.BooleanField(default=False)
    migros_status = models.BooleanField(default=False)
    trendyol_status = models.BooleanField(default=False)
    
    # Previous platform statuses
    previous_yemeksepeti_status = models.BooleanField(default=False)
    previous_getir_status = models.BooleanField(default=False)
    previous_migros_status = models.BooleanField(default=False)
    previous_trendyol_status = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.restaurant.name} - {self.name}"

    def toggle_status(self):
        self.is_online = not self.is_online
        self.save()

    def save(self, *args, **kwargs):
        # Herhangi bir platformda online ise şube online kabul edilir
        self.is_online = any([
            self.yemeksepeti_status,
            self.getir_status,
            self.migros_status,
            self.trendyol_status
        ])
        super().save(*args, **kwargs)

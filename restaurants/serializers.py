from rest_framework import serializers
from .models import Restaurant, Branch

class BranchSerializer(serializers.ModelSerializer):
    platform_statuses = serializers.SerializerMethodField()
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    manager_name = serializers.CharField(source='manager.username', read_only=True)

    class Meta:
        model = Branch
        fields = [
            'id', 'restaurant', 'restaurant_name', 'name', 'manager',
            'manager_name', 'address', 'is_online', 'last_status_change',
            'yemeksepeti_url', 'yemeksepeti_status',
            'getir_url', 'getir_status',
            'migros_api_key', 'migros_restaurant_id', 'migros_status',
            'trendyol_supplier_id', 'trendyol_api_key', 'trendyol_api_secret', 'trendyol_status',
            'created_at', 'updated_at', 'platform_statuses'
        ]
        read_only_fields = ['is_online', 'last_status_change']

    def get_platform_statuses(self, obj):
        return {
            'yemeksepeti': {
                'url': obj.yemeksepeti_url or None,
                'status': 'Online' if obj.yemeksepeti_status else 'Offline' if obj.yemeksepeti_url else 'URL Yok'
            },
            'migros': {
                'api_key': obj.migros_api_key or None,
                'restaurant_id': obj.migros_restaurant_id or None,
                'status': 'Online' if obj.migros_status else 'Offline' if obj.migros_api_key and obj.migros_restaurant_id else 'Bilgi Yok'
            },
            'getir': {
                'url': obj.getir_url or None,
                'status': 'Online' if obj.getir_status else 'Offline' if obj.getir_url else 'URL Yok'
            },
            'trendyol': {
                'supplier_id': obj.trendyol_supplier_id or None,
                'api_key': obj.trendyol_api_key or None,
                'api_secret': obj.trendyol_api_secret or None,
                'status': 'Online' if obj.trendyol_status else 'Offline' if obj.trendyol_supplier_id and obj.trendyol_api_key and obj.trendyol_api_secret else 'Bilgi Yok'
            }
        }

class RestaurantSerializer(serializers.ModelSerializer):
    branches = BranchSerializer(many=True, read_only=True)
    total_branches = serializers.IntegerField(read_only=True)
    online_branches = serializers.IntegerField(read_only=True)
    offline_branches = serializers.IntegerField(read_only=True)

    class Meta:
        model = Restaurant
        fields = ['id', 'name', 'branches', 'total_branches', 'online_branches', 'offline_branches']

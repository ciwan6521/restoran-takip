from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RestaurantViewSet, BranchViewSet

router = DefaultRouter()
router.register(r'restaurants', RestaurantViewSet, basename='restaurant')
router.register(r'branches', BranchViewSet, basename='branch')

# Özel URL pattern'leri ekle
branch_check_status = BranchViewSet.as_view({
    'post': 'check_status',
})

urlpatterns = [
    # DRF router URL'leri
    path('', include(router.urls)),
    
    # Özel URL pattern'i
    path('branches/<int:pk>/check_status/', branch_check_status, name='branch-check-status'),
]

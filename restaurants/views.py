from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Restaurant, Branch
from .serializers import RestaurantSerializer, BranchSerializer
from scraper.scrapers import check_branch_status
from .telegram_bot import send_status_change_notification
import asyncio
import logging

logger = logging.getLogger(__name__)

# Create your views here.

class RestaurantViewSet(viewsets.ModelViewSet):
    serializer_class = RestaurantSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Restaurant.objects.all()

class BranchViewSet(viewsets.ModelViewSet):
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Branch.objects.all()

    @action(detail=True, methods=['post'])
    def check_status(self, request, pk=None):
        try:
            branch = self.get_object()
            
            # Önceki durumları kaydet
            old_statuses = {
                'yemeksepeti': branch.yemeksepeti_status,
                'getir': branch.getir_status,
                'migros': branch.migros_status,
                'trendyol': branch.trendyol_status
            }
            
            # Asenkron fonksiyonu çalıştır
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                statuses = loop.run_until_complete(check_branch_status(branch))
                loop.close()
                
                # Yeni durumları belirle
                new_statuses = {
                    'yemeksepeti': statuses.get('yemeksepeti', {}).get('status') == 'Online',
                    'getir': statuses.get('getir', {}).get('status') == 'Online',
                    'migros': statuses.get('migros', {}).get('status') == 'Online',
                    'trendyol': statuses.get('trendyol', {}).get('status') == 'Online'
                }
                
                # Her platform için durum değişikliğini kontrol et ve bildirim gönder
                for platform, new_status in new_statuses.items():
                    old_status = old_statuses[platform]
                    if old_status and not new_status:  # Online'dan offline'a geçiş
                        # Telegram bildirimi gönder
                        send_status_change_notification(branch, platform, old_status, new_status)
                
                # Şube durumlarını güncelle
                branch.previous_yemeksepeti_status = branch.yemeksepeti_status
                branch.previous_getir_status = branch.getir_status
                branch.previous_migros_status = branch.migros_status
                branch.previous_trendyol_status = branch.trendyol_status
                
                branch.yemeksepeti_status = new_statuses['yemeksepeti']
                branch.getir_status = new_statuses['getir']
                branch.migros_status = new_statuses['migros']
                branch.trendyol_status = new_statuses['trendyol']
                branch.save()
                
                return Response(statuses)
                
            except Exception as e:
                loop.close()
                logger.error(f"Error checking status: {str(e)}")
                raise Exception(f"Error checking status: {str(e)}")
            
        except Exception as e:
            import traceback
            print(f"Error in check_status: {str(e)}")
            print(traceback.format_exc())
            return Response({
                'status': 'error',
                'message': str(e),
                'traceback': traceback.format_exc()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, *args, **kwargs):
        try:
            branch = self.get_object()
            branch.delete()
            return Response({
                'status': 'success',
                'message': 'Şube başarıyla silindi'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

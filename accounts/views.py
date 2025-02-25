from django.shortcuts import render
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate, login, logout
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, LoginSerializer

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer

class LoginView(APIView):
    permission_classes = (AllowAny,)
    serializer_class = LoginSerializer

    def post(self, request):
        try:
            serializer = self.serializer_class(data=request.data)
            if serializer.is_valid():
                email = serializer.validated_data['email']
                password = serializer.validated_data['password']
                
                try:
                    user = User.objects.get(email=email)
                except User.DoesNotExist:
                    return Response(
                        {'detail': 'Bu email adresi ile kayıtlı kullanıcı bulunamadı'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                if not user.check_password(password):
                    return Response(
                        {'detail': 'Şifre hatalı'},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                
                if not user.is_active:
                    return Response(
                        {'detail': 'Kullanıcı hesabı aktif değil'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                login(request, user)
                token, _ = Token.objects.get_or_create(user=user)
                
                return Response({
                    'token': token.key,
                    'user': {
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'role': user.role
                    }
                })
            
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class LogoutView(APIView):
    def post(self, request):
        try:
            if request.auth:
                request.auth.delete()
            logout(request)
            return Response({'message': 'Başarıyla çıkış yapıldı'})
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

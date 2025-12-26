from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, RegisterSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['email'] = user.email
        token['name'] = f"{user.first_name} {user.last_name}".strip()
        return token

    def validate(self, attrs):
        # Allow using email to obtain a token by mapping it to the username field
        username_field = self.username_field
        if 'email' in attrs and username_field not in attrs:
            email = attrs.pop('email')
            try:
                u = User.objects.get(email__iexact=email)
                attrs[username_field] = getattr(u, username_field)
            except User.DoesNotExist:
                # leave attrs as-is; serializer will handle invalid credentials
                pass
        return super().validate(attrs)


from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        username = request.data.get('username')
        password = request.data.get('password')

        if email and not username:
            try:
                u = User.objects.get(email__iexact=email)
                username = u.username
            except User.DoesNotExist:
                return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        if not username or not password:
            return Response({'detail': 'Missing credentials'}, status=status.HTTP_400_BAD_REQUEST)

        # Authenticate using Django backends (this will trigger legacy bcrypt backend if needed)
        from django.contrib.auth import authenticate
        user = authenticate(request, username=username, password=password)
        if not user:
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        data = {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }
        return Response(data)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({'ok': True, 'user': UserSerializer(user).data}, status=status.HTTP_201_CREATED)
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({'ok': True, 'user': UserSerializer(user).data})


class SetRoleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != 'super':
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        userId = request.data.get('userId')
        email = request.data.get('email')
        role = request.data.get('role')
        if not role:
            return Response({'error': 'Missing role'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            if userId:
                user = User.objects.get(id=userId)
            else:
                user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        user.role = role
        user.save()
        return Response({'ok': True})

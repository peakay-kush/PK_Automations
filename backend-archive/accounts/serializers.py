from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'date_joined']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    name = serializers.CharField(write_only=True, required=False)
    username = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'name']

    def create(self, validated_data):
        password = validated_data.pop('password')
        name = validated_data.pop('name', '')
        email = validated_data.get('email')
        # Use email as username to ensure uniqueness
        username = email
        first_name = ''
        last_name = ''
        if name:
            parts = name.split(None, 1)
            first_name = parts[0]
            if len(parts) > 1:
                last_name = parts[1]

        user = User(username=username, email=email, first_name=first_name, last_name=last_name)
        user.set_password(password)
        # First user becomes super by default
        if User.objects.count() == 0:
            user.role = 'super'
        user.save()
        return user

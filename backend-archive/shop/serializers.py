from rest_framework import serializers
from .models import Product, Tutorial, Service


class ProductSerializer(serializers.ModelSerializer):
    related = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'category', 'image_url', 'description', 'specifications', 'related']


class TutorialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tutorial
        fields = ['id', 'title', 'excerpt', 'category', 'thumbnail', 'content']


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'title', 'description', 'icon', 'price']

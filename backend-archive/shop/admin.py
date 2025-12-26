from django.contrib import admin
from .models import Product, Tutorial, Service


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'price')
    search_fields = ('name', 'category')


@admin.register(Tutorial)
class TutorialAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'category')
    search_fields = ('title', 'category')


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'price')
    search_fields = ('title',)

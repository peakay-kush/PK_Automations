from django.urls import path
from .views import (
    ProductListCreateView, ProductDetailView,
    TutorialListCreateView, TutorialDetailView,
    ServiceListCreateView, ServiceDetailView,
)

urlpatterns = [
    path('products/', ProductListCreateView.as_view(), name='products'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product_detail'),
    path('tutorials/', TutorialListCreateView.as_view(), name='tutorials'),
    path('tutorials/<int:pk>/', TutorialDetailView.as_view(), name='tutorial_detail'),
    path('services/', ServiceListCreateView.as_view(), name='services'),
    path('services/<int:pk>/', ServiceDetailView.as_view(), name='service_detail'),
]

from rest_framework import generics, permissions
from .models import Product, Tutorial, Service
from .serializers import ProductSerializer, TutorialSerializer, ServiceSerializer


class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAdminUser | permissions.IsAuthenticated]


class TutorialListCreateView(generics.ListCreateAPIView):
    queryset = Tutorial.objects.all()
    serializer_class = TutorialSerializer
    permission_classes = [permissions.AllowAny]


class TutorialDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Tutorial.objects.all()
    serializer_class = TutorialSerializer
    permission_classes = [permissions.IsAdminUser | permissions.IsAuthenticated]


class ServiceListCreateView(generics.ListCreateAPIView):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.AllowAny]


class ServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAdminUser | permissions.IsAuthenticated]

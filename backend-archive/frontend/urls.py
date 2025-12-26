from django.urls import path
from . import views

app_name = 'frontend'

urlpatterns = [
    path('', views.index, name='index'),
    path('shop/', views.shop, name='shop'),
    path('product/<int:pk>/', views.product_detail, name='product_detail'),
    path('tutorials/', views.tutorials, name='tutorials'),
    path('tutorial/<int:pk>/', views.tutorial_detail, name='tutorial_detail'),
    path('student-hub/', views.student_hub, name='student_hub'),
    path('cart/', views.cart, name='cart'),
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
]

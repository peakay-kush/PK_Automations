import os
import sys
from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views
import importlib.util
import os

# Ensure backend directory is on sys.path so we can load view modules by file path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load frontend views directly from backend/frontend/views.py (avoids package import issues)
frontend_views_path = os.path.join(BASE_DIR, 'frontend', 'views.py')
frontend_spec = importlib.util.spec_from_file_location('frontend_views', frontend_views_path)
frontend_views = importlib.util.module_from_spec(frontend_spec)
frontend_spec.loader.exec_module(frontend_views)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('shop.urls')),
    path('logout/', auth_views.LogoutView.as_view(next_page='/'), name='logout'),

    # Frontend routes
    path('', frontend_views.index, name='index'),
    path('shop/', frontend_views.shop, name='shop'),
    path('product/<int:pk>/', frontend_views.product_detail, name='product_detail'),
    path('tutorials/', frontend_views.tutorials, name='tutorials'),
    path('tutorial/<int:pk>/', frontend_views.tutorial_detail, name='tutorial_detail'),
    path('student-hub/', frontend_views.student_hub, name='student_hub'),
    path('cart/', frontend_views.cart, name='cart'),
    path('login/', frontend_views.login_view, name='login'),
    path('register/', frontend_views.register_view, name='register'),
]

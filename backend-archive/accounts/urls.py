from django.urls import path
from .views import RegisterView, LoginView, ProfileView, SetRoleView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='token_obtain_pair'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('set-role/', SetRoleView.as_view(), name='set_role'),
]

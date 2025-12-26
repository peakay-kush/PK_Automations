from django.shortcuts import render, get_object_or_404, redirect
from shop.models import Product, Tutorial
from django.contrib.auth import authenticate, login
from accounts.models import User


def index(request):
    products = Product.objects.all()[:6]
    return render(request, 'frontend/index.html', {'products': products})


def shop(request):
    products = Product.objects.all()
    return render(request, 'frontend/shop.html', {'products': products})


def product_detail(request, pk):
    product = get_object_or_404(Product, pk=pk)
    return render(request, 'frontend/product_detail.html', {'product': product})


def tutorials(request):
    tutorials = Tutorial.objects.all()
    return render(request, 'frontend/tutorials.html', {'tutorials': tutorials})


def tutorial_detail(request, pk):
    tutorial = get_object_or_404(Tutorial, pk=pk)
    return render(request, 'frontend/tutorial_detail.html', {
        'tutorial': tutorial
    })


def student_hub(request):
    # Server-side protection for student hub — redirect unauthenticated users to login with redirect back
    if not request.user.is_authenticated:
        return redirect(f'/login/?redirect=/student-hub')
    return render(request, 'frontend/student_hub.html')


def cart(request):
    return render(request, 'frontend/cart.html')


def login_view(request):
    redirect_to = request.GET.get('redirect') or request.POST.get('redirect') or '/'
    error = None
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        user = authenticate(request, username=email, password=password)
        if user:
            login(request, user)
            return redirect(redirect_to)
        else:
            error = 'Invalid credentials'
    return render(request, 'frontend/login.html', {'redirect': redirect_to, 'error': error})


def register_view(request):
    redirect_to = request.GET.get('redirect') or request.POST.get('redirect') or '/'
    error = None
    if request.method == 'POST':
        name = request.POST.get('name')
        email = request.POST.get('email')
        password = request.POST.get('password')
        if not email or not password:
            error = 'Email and password are required.'
        else:
            # Check for duplicate email and show a clear error message (Option A)
            if User.objects.filter(email=email).exists():
                error = 'Email already registered'
            else:
                try:
                    user = User.objects.create_user(email=email, username=email, password=password, first_name=name)
                    login(request, user)
                    return redirect(redirect_to)
                except Exception:
                    error = 'Registration failed. Please try again.'
    return render(request, 'frontend/register.html', {'redirect': redirect_to, 'error': error})

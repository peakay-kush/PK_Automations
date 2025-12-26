import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.test import Client
c = Client()
res = c.get('/api/products/')
print('STATUS', res.status_code)
print(res.content.decode())

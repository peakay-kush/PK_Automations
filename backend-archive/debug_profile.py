import os
import django
import json
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.test import Client
c=Client()
login = c.post('/api/auth/login/', json.dumps({'email':'test@example.com','password':'pass1234'}), content_type='application/json')
print('LOGIN', login.status_code, login.content.decode())
access = json.loads(login.content.decode()).get('access')
res = c.get('/api/auth/profile/', HTTP_AUTHORIZATION=f'Bearer {access}')
print('PROFILE', res.status_code)
print(res.content.decode())

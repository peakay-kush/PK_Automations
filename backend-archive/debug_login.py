import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client

c = Client()
res = c.post('/api/auth/login/', json.dumps({'email':'test@example.com','password':'pass1234'}), content_type='application/json')
print('STATUS', res.status_code)
print(res.content.decode())

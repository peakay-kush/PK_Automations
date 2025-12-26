from django.test import Client, TestCase
from django.urls import reverse
from accounts.models import User
from django.conf import settings
import os


class RegisterAndStaticTests(TestCase):
    def setUp(self):
        self.client = Client()
        # Ensure static dir exists (sanity check for test environment)
        static_css = os.path.join(settings.BASE_DIR, 'frontend', 'static', 'frontend', 'css', 'globals.css')
        static_js = os.path.join(settings.BASE_DIR, 'frontend', 'static', 'frontend', 'js', 'site.js')
        self.assertTrue(os.path.exists(static_css), f"Missing compiled css: {static_css}")
        self.assertTrue(os.path.exists(static_js), f"Missing js: {static_js}")

    def test_register_duplicate_email_shows_error(self):
        # Create existing user
        User.objects.create_user(email='exist@example.com', username='exist@example.com', password='secret')
        resp = self.client.post(reverse('register'), {
            'name': 'Test',
            'email': 'exist@example.com',
            'password': 'newpass123'
        })
        self.assertContains(resp, 'Email already registered')

    def test_static_files_served(self):
        # Request CSS and JS via test client
        css_resp = self.client.get('/static/frontend/css/globals.css')
        self.assertEqual(css_resp.status_code, 200)
        self.assertIn('text/css', css_resp['Content-Type'])
        js_resp = self.client.get('/static/frontend/js/site.js')
        self.assertEqual(js_resp.status_code, 200)
        # Accept either 'application/javascript' or 'text/javascript' depending on platform
        self.assertIn('javascript', js_resp['Content-Type'].lower())

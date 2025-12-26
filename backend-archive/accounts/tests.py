from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
import bcrypt

User = get_user_model()


class LegacyAuthTests(TestCase):
    def setUp(self):
        # create a user with a legacy bcrypt hash
        self.email = 'legacy@example.com'
        self.password = 'SecretPass123'
        hashed = bcrypt.hashpw(self.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        self.user = User.objects.create(username=self.email, email=self.email, legacy_password=hashed)

    def test_legacy_login_migrates_password(self):
        # authenticate using TokenObtainPair endpoint
        url = reverse('token_obtain_pair')
        res = self.client.post(url, {'email': self.email, 'password': self.password}, content_type='application/json')
        self.assertEqual(res.status_code, 200)
        self.user.refresh_from_db()
        # legacy_password should be cleared after successful login
        self.assertFalse(self.user.legacy_password)
        # now user should be able to login using Django password
        self.assertTrue(self.user.check_password(self.password))

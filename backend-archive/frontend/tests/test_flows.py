from django.test import Client, TestCase
from accounts.models import User
from shop.models import Product
from django.urls import reverse


class FlowTests(TestCase):
    def setUp(self):
        self.client = Client()
        # create a user for login tests
        self.user = User.objects.create_user(email='qa@login.test', username='qa@login.test', password='pass123')
        # create a product so index/shop show at least one item with add-to-cart
        Product.objects.create(name='Test Product', price='100.00', category='DIY Kits', image_url='https://via.placeholder.com/200')

    def test_student_hub_requires_login(self):
        resp = self.client.get(reverse('student_hub'))
        self.assertEqual(resp.status_code, 302)
        self.assertIn('/login/', resp['Location'])

    def test_login_with_redirect(self):
        resp = self.client.post(reverse('login') + '?redirect=/student-hub', {
            'email': self.user.email,
            'password': 'pass123'
        }, follow=True)
        # final destination should be student hub (accept trailing slash)
        self.assertEqual(resp.request['PATH_INFO'].rstrip('/'), '/student-hub')
        self.assertContains(resp, 'Student Hub')

    def test_index_contains_cart_and_sitejs(self):
        resp = self.client.get(reverse('index'))
        self.assertEqual(resp.status_code, 200)
        # check header includes site.js and an add-to-cart button on the index
        body = resp.content.decode()
        self.assertIn('frontend/js/site.js', body)
        self.assertIn('add-to-cart', body)

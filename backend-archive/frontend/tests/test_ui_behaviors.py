from django.test import Client, TestCase
from shop.models import Product
from django.conf import settings
import os


class UIBehaviorTests(TestCase):
    def setUp(self):
        self.client = Client()
        # Ensure static file exists
        self.site_js = os.path.join(settings.BASE_DIR, 'frontend', 'static', 'frontend', 'js', 'site.js')
        self.assertTrue(os.path.exists(self.site_js), f"Missing site.js: {self.site_js}")
        Product.objects.create(name='UI Product', price='10.00', category='DIY Kits', image_url='https://via.placeholder.com/100')

    def test_shop_and_product_pages_have_add_to_cart(self):
        shop_resp = self.client.get('/shop/')
        self.assertEqual(shop_resp.status_code, 200)
        self.assertIn('add-to-cart', shop_resp.content.decode())

        # product detail (use id 1)
        prod_resp = self.client.get('/product/1/')
        self.assertEqual(prod_resp.status_code, 200)
        self.assertIn('add-to-cart', prod_resp.content.decode())
        self.assertIn('data-id="1"', prod_resp.content.decode())

    def test_cart_page_structure(self):
        resp = self.client.get('/cart/')
        self.assertEqual(resp.status_code, 200)
        body = resp.content.decode()
        self.assertIn('id="cart-items"', body)
        self.assertIn('id="clear-cart"', body)

    def test_dark_toggle_exists_and_sitejs_contains_behaviors(self):
        resp = self.client.get('/')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('id="dark-toggle"', resp.content.decode())

        # Check site.js content for expected strings
        with open(self.site_js, 'r', encoding='utf-8') as fh:
            src = fh.read()
        self.assertIn('localStorage.getItem', src)
        self.assertIn('pkat_token', src)
        self.assertIn('add-to-cart', src)
        self.assertIn('renderCartPage', src)

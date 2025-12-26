import os
from django.core.management.base import BaseCommand
from django.conf import settings
from shop.models import Product, Tutorial, Service

# Note: js2py can have compatibility issues on some Python versions.
# Import it inside the command and handle ImportError to avoid crashing Django at import time.


class Command(BaseCommand):
    help = 'Import products/tutorials/services from src/data/products.js'

    def add_arguments(self, parser):
        parser.add_argument('--source', type=str, default=os.path.join(settings.BASE_DIR, '..', 'src', 'data', 'products.js'))

    def handle(self, *args, **options):
        src = options['source']
        if not os.path.exists(src):
            self.stderr.write(self.style.ERROR(f"Source file not found: {src}"))
            return

        with open(src, 'r', encoding='utf-8') as f:
            js_code = f.read()

        # Try to import js2py at runtime; if unavailable or incompatible, fall back to a JSON source.
        data = None
        try:
            import js2py
            # Create an export object for easy retrieval
            wrapper = js_code + '\nvar __EXPORT__ = { products: products, tutorials: tutorials, services: services }; __EXPORT__'
            try:
                res = js2py.eval_js(wrapper)
                # Convert to Python-friendly structures
                products = res['products'].to_list() if 'products' in res else []
                tutorials = res['tutorials'].to_list() if 'tutorials' in res else []
                services = res['services'].to_list() if 'services' in res else []
            except Exception as e:
                self.stderr.write(self.style.WARNING(f"Failed to parse JS file with js2py: {e}. Trying JSON fallback."))
                products = tutorials = services = None
        except Exception as e:
            self.stderr.write(self.style.WARNING(f"js2py is not available or failed to import: {e}. Trying JSON fallback."))
            products = tutorials = services = None

        # If js2py path didn't produce results, attempt to load a JSON fallback
        if products is None or tutorials is None or services is None:
            import json
            json_path = os.path.splitext(src)[0] + '.json'
            if not os.path.exists(json_path):
                json_path = os.path.join(settings.BASE_DIR, '..', 'src', 'data', 'products.json')

            if not os.path.exists(json_path):
                self.stderr.write(self.style.ERROR(f"Neither js2py parsing nor JSON fallback found a data source (tried {json_path}). Skipping import."))
                return

            with open(json_path, 'r', encoding='utf-8') as jf:
                try:
                    data = json.load(jf)
                except Exception as e:
                    self.stderr.write(self.style.ERROR(f"Failed to parse JSON file {json_path}: {e}."))
                    return

            products = data.get('products', [])
            tutorials = data.get('tutorials', [])
            services = data.get('services', [])

        self.stdout.write(self.style.SUCCESS(f"Importing {len(products)} products, {len(tutorials)} tutorials, {len(services)} services"))

        # Create/update products
        id_map = {}
        for p in products:
            # p may be a dict (JSON) or js2py object — normalize to plain dict
            if isinstance(p, dict):
                pd = p
            else:
                try:
                    pd = {k: p[k].to_python() for k in p.keys()}
                except Exception:
                    pd = dict(p)

            prod, created = Product.objects.update_or_create(
                name=pd.get('name', '')[:255],
                defaults={
                    'price': float(pd.get('price', 0)),
                    'category': pd.get('category', ''),
                    'image_url': pd.get('image', ''),
                    'description': pd.get('description', ''),
                    'specifications': pd.get('specifications', ''),
                }
            )
            id_map[int(pd.get('id'))] = prod

        # Second pass to handle related links
        for p in products:
            if isinstance(p, dict):
                pd = p
            else:
                try:
                    pd = {k: p[k].to_python() for k in p.keys()}
                except Exception:
                    pd = dict(p)

            prod = id_map.get(int(pd.get('id')))
            related_ids = pd.get('related', []) or []
            prod.related.clear()
            for rid in related_ids:
                if int(rid) in id_map:
                    prod.related.add(id_map[int(rid)])

        # Tutorials
        for t in tutorials:
            if isinstance(t, dict):
                td = t
            else:
                try:
                    td = {k: t[k].to_python() for k in t.keys()}
                except Exception:
                    td = dict(t)

            Tutorial.objects.update_or_create(
                title=td.get('title', '')[:255],
                defaults={
                    'excerpt': td.get('excerpt', ''),
                    'category': td.get('category', ''),
                    'thumbnail': td.get('thumbnail', ''),
                    'content': td.get('content', ''),
                }
            )

        # Services
        for s in services:
            if isinstance(s, dict):
                sd = s
            else:
                try:
                    sd = {k: s[k].to_python() for k in s.keys()}
                except Exception:
                    sd = dict(s)

            Service.objects.update_or_create(
                title=sd.get('title', '')[:255],
                defaults={
                    'description': sd.get('description', ''),
                    'icon': sd.get('icon', ''),
                    'price': sd.get('price', ''),
                }
            )

        self.stdout.write(self.style.SUCCESS('Import complete.'))

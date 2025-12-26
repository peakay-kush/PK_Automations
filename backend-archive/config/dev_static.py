from django.conf import settings
from django.http import HttpResponse, Http404
from django.contrib.staticfiles import finders
import mimetypes


class DevStaticMiddleware:
    """A tiny middleware to serve static files in DEBUG/test environments.

    This is intentionally minimal and only used when DEBUG=True. It uses
    Django's staticfiles finders to locate files and returns them with
    the appropriate Content-Type. It helps the Django test Client and CI
    fetch /static/... URLs without requiring a separate static server.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Serve static files when DEBUG is True or when running tests
        if (settings.DEBUG or getattr(settings, 'TESTING', False)) and request.path.startswith(settings.STATIC_URL):
            rel_path = request.path[len(settings.STATIC_URL):].lstrip('/')
            file_path = finders.find(rel_path)
            if file_path:
                content_type, _ = mimetypes.guess_type(file_path)
                content_type = content_type or 'application/octet-stream'
                try:
                    with open(file_path, 'rb') as fh:
                        return HttpResponse(fh.read(), content_type=content_type)
                except FileNotFoundError:
                    raise Http404
        return self.get_response(request)

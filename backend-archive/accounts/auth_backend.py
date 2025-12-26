import bcrypt
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

UserModel = get_user_model()


class LegacyBcryptBackend(ModelBackend):
    """Authentication backend that falls back to verifying legacy bcrypt hashes stored in `legacy_password`.

    If the Django authentication (password) fails and the user has a `legacy_password`, this backend will
    verify the given password with bcrypt and, on success, migrate the user to Django's password hashing
    by calling `set_password` and clearing `legacy_password`.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(UserModel.USERNAME_FIELD)
        try:
            user = UserModel.objects.get(email__iexact=username)
        except UserModel.DoesNotExist:
            try:
                # fallback to username lookup
                user = UserModel.objects.get(username__iexact=username)
            except UserModel.DoesNotExist:
                return None

        # First try normal Django check
        if user.check_password(password):
            return user

        # If there's a legacy bcrypt hash, verify it
        legacy = getattr(user, 'legacy_password', None)
        if legacy:
            try:
                # legacy may be text like bcrypt hash string
                if isinstance(legacy, str):
                    legacy_bytes = legacy.encode('utf-8')
                else:
                    legacy_bytes = legacy
                ok = bcrypt.checkpw(password.encode('utf-8'), legacy_bytes)
                if ok:
                    # migrate password to Django format and clear legacy
                    user.set_password(password)
                    user.legacy_password = None
                    user.save()
                    return user
            except Exception:
                return None

        return None

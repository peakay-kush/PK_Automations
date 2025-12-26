from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLE_USER = 'user'
    ROLE_SUPER = 'super'
    ROLE_CHOICES = [
        (ROLE_USER, 'User'),
        (ROLE_SUPER, 'Super'),
    ]

    # Make email unique for importing and identification
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=ROLE_USER)

    # Preserve legacy bcrypt hashes during migration. These are not used by Django auth
    # but allow a later transition strategy (or verification backend) if desired.
    legacy_password = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.username or self.email

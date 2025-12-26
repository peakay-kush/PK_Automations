import os
import sqlite3
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils.dateparse import parse_datetime
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = 'Import users from SQL.js SQLite file (data/users.db) preserving bcrypt hashes in legacy_password'

    def add_arguments(self, parser):
        parser.add_argument('--source', type=str, default=os.path.join(settings.BASE_DIR, '..', 'data', 'users.db'))
        parser.add_argument('--force-reset', action='store_true', help='Set unusable password for all imported users (recommended)')

    def handle(self, *args, **options):
        src = options['source']
        force_reset = options['force_reset']
        if not os.path.exists(src):
            self.stderr.write(self.style.ERROR(f"Source DB not found: {src}"))
            return

        conn = sqlite3.connect(src)
        cursor = conn.cursor()

        try:
            cursor.execute('SELECT id, name, email, password, createdAt, role FROM users')
        except sqlite3.OperationalError as e:
            self.stderr.write(self.style.ERROR(f"Failed to read users table: {e}"))
            return

        rows = cursor.fetchall()
        total = len(rows)
        self.stdout.write(self.style.SUCCESS(f"Found {total} users in source DB"))

        User = get_user_model()
        created_count = 0
        updated_count = 0

        for row in rows:
            uid, name, email, pw_hash, createdAt, role = row
            if not email:
                self.stderr.write(self.style.WARNING(f"Skipping user with id {uid} (missing email)"))
                continue

            email = email.lower()
            username = email
            first_name = ''
            last_name = ''
            if name:
                parts = name.split(None, 1)
                first_name = parts[0]
                if len(parts) > 1:
                    last_name = parts[1]

            try:
                user = User.objects.get(email=email)
                updated = True
            except User.DoesNotExist:
                user = User(username=username, email=email)
                updated = False

            user.first_name = first_name
            user.last_name = last_name
            user.role = role or user.role
            # store legacy bcrypt hash for migration/verification later
            user.legacy_password = pw_hash if pw_hash else None

            # set date_joined if valid
            if createdAt:
                try:
                    dt = parse_datetime(createdAt)
                    if dt:
                        user.date_joined = dt
                except Exception:
                    pass

            # Do not set a usable password by default (security). If the option --force-reset is not given,
            # and the pw_hash is present, keep unusable password but retain legacy_password to allow later transition.
            user.set_unusable_password()
            user.save()

            if updated:
                updated_count += 1
            else:
                created_count += 1

        conn.close()
        self.stdout.write(self.style.SUCCESS(f"Import complete. Created: {created_count}, Updated: {updated_count}."))
        self.stdout.write(self.style.WARNING('Passwords are not migrated to Django. legacy bcrypt hashes are stored in `legacy_password`.'))
        self.stdout.write(self.style.WARNING('Recommend asking users to reset passwords or add a login backend to validate bcrypt hashes during transition.'))

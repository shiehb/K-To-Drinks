from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

class Command(BaseCommand):
    help = 'Migrates users from email-based authentication to username-based authentication'

    def handle(self, *args, **options):
        self.stdout.write('Starting migration from email-based to username-based authentication...')
        
        # Get all users
        users = User.objects.all()
        
        with transaction.atomic():
            for user in users:
                # Skip users who already have a username
                if user.username and user.username != user.email:
                    self.stdout.write(f'User {user.id} already has username: {user.username}')
                    continue
                
                # Generate username from email if username is empty or same as email
                if not user.username or user.username == user.email:
                    # Use the part before @ in email as username
                    username_base = user.email.split('@')[0]
                    
                    # Check if username already exists
                    username = username_base
                    counter = 1
                    
                    while User.objects.filter(username=username).exclude(id=user.id).exists():
                        username = f"{username_base}{counter}"
                        counter += 1
                    
                    # Update username
                    user.username = username
                    user.save(update_fields=['username'])
                    
                    self.stdout.write(f'Updated user {user.id}: {user.email} -> {user.username}')
        
        self.stdout.write(self.style.SUCCESS('Successfully migrated users to username-based authentication'))


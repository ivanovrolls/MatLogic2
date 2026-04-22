import base64
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Generate VAPID keys for Web Push notifications'

    def handle(self, *args, **options):
        try:
            from cryptography.hazmat.primitives.asymmetric import ec
            from cryptography.hazmat.primitives.serialization import (
                Encoding, PublicFormat, PrivateFormat, NoEncryption,
            )
        except ImportError:
            self.stderr.write('cryptography package not available.')
            return

        private_key = ec.generate_private_key(ec.SECP256R1())

        # PEM private key — stored as single line with literal \n for env vars
        private_pem = private_key.private_bytes(
            Encoding.PEM, PrivateFormat.TraditionalOpenSSL, NoEncryption()
        ).decode().strip().replace('\n', '\\n')

        # Uncompressed EC point, base64url — used by the browser PushManager
        public_bytes = private_key.public_key().public_bytes(
            Encoding.X962, PublicFormat.UncompressedPoint
        )
        public_b64 = base64.urlsafe_b64encode(public_bytes).rstrip(b'=').decode()

        self.stdout.write(self.style.SUCCESS('\n=== VAPID Keys Generated ===\n'))
        self.stdout.write('Add to backend .env / Render / Railway environment:\n')
        self.stdout.write(f'  VAPID_PRIVATE_KEY={private_pem}')
        self.stdout.write(f'  VAPID_PUBLIC_KEY={public_b64}')
        self.stdout.write(f'  VAPID_CLAIMS_EMAIL=your@email.com\n')
        self.stdout.write('Add to frontend .env.local / Vercel environment:')
        self.stdout.write(f'  NEXT_PUBLIC_VAPID_PUBLIC_KEY={public_b64}\n')

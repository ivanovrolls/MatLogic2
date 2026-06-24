import json
import logging

logger = logging.getLogger(__name__)


def send_web_push(user, payload_str, vapid_private_key, claims_email):
    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        logger.warning('pywebpush not installed — web push disabled')
        return

    for sub in user.push_subscriptions.all():
        try:
            webpush(
                subscription_info={
                    'endpoint': sub.endpoint,
                    'keys': {'p256dh': sub.p256dh, 'auth': sub.auth},
                },
                data=payload_str,
                vapid_private_key=vapid_private_key,
                vapid_claims={'sub': f'mailto:{claims_email}'},
            )
        except WebPushException as exc:
            if exc.response is not None and exc.response.status_code == 410:
                sub.delete()
            else:
                logger.warning('Web push failed for %s: %s', user.username, exc)
        except Exception as exc:
            logger.warning('Web push error for %s: %s', user.username, exc)


def send_fcm_push(user, title, body, url):
    from django.conf import settings

    cred_path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', '')
    if not cred_path:
        return

    try:
        import firebase_admin
        from firebase_admin import credentials, messaging

        if not firebase_admin._apps:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)

        tokens = list(user.native_push_tokens.values_list('token', flat=True))
        if not tokens:
            return

        message = messaging.MulticastMessage(
            notification=messaging.Notification(title=title, body=body),
            data={'url': url},
            tokens=tokens,
        )
        response = messaging.send_each_for_multicast(message)

        # Remove stale tokens
        if response.failure_count:
            from .models import NativePushToken
            for idx, result in enumerate(response.responses):
                if not result.success:
                    NativePushToken.objects.filter(token=tokens[idx]).delete()

    except ImportError:
        logger.warning('firebase-admin not installed — native push disabled')
    except Exception as exc:
        logger.warning('FCM push error for %s: %s', user.username, exc)


def send_push(user, title, body, url='/dashboard'):
    """Send push to all of a user's devices (web + native)."""
    from django.conf import settings

    vapid_key = getattr(settings, 'VAPID_PRIVATE_KEY', '')
    claims_email = getattr(settings, 'VAPID_CLAIMS_EMAIL', '')

    if vapid_key:
        payload = json.dumps({'title': title, 'body': body, 'url': url})
        send_web_push(user, payload, vapid_key, claims_email)

    send_fcm_push(user, title, body, url)

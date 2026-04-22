import json
import logging

logger = logging.getLogger(__name__)


def send_push(user, title, body, url='/dashboard'):
    """Fire-and-forget push to all of a user's subscribed devices."""
    from django.conf import settings

    private_key = getattr(settings, 'VAPID_PRIVATE_KEY', '')
    claims_email = getattr(settings, 'VAPID_CLAIMS_EMAIL', '')
    if not private_key:
        return

    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        logger.warning('pywebpush not installed — push notifications disabled')
        return

    payload = json.dumps({'title': title, 'body': body, 'url': url})

    for sub in user.push_subscriptions.all():
        try:
            webpush(
                subscription_info={
                    'endpoint': sub.endpoint,
                    'keys': {'p256dh': sub.p256dh, 'auth': sub.auth},
                },
                data=payload,
                vapid_private_key=private_key,
                vapid_claims={'sub': f'mailto:{claims_email}'},
            )
        except WebPushException as exc:
            if exc.response is not None and exc.response.status_code == 410:
                sub.delete()  # subscription expired
            else:
                logger.warning('Push failed for %s: %s', user.username, exc)
        except Exception as exc:
            logger.warning('Push error for %s: %s', user.username, exc)

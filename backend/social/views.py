from datetime import date, timedelta
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Q
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Challenge
from .serializers import PublicUserSerializer

User = get_user_model()

CHALLENGE_TYPE_LABELS = {
    'sessions': 'Training Sessions',
    'hours': 'Mat Hours',
    'win_rate': 'Win Rate',
}
CHALLENGE_UNITS = {
    'sessions': ' sessions',
    'hours': 'h',
    'win_rate': '%',
}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _compute_streaks(member_ids):
    from training.models import TrainingSession
    today = date.today()
    rows = (
        TrainingSession.objects
        .filter(user_id__in=member_ids)
        .values_list('user_id', 'date')
        .distinct()
    )
    dates_by_user: dict = {}
    for uid, d in rows:
        dates_by_user.setdefault(uid, set()).add(d)

    result = {}
    for uid in member_ids:
        session_dates = dates_by_user.get(uid, set())
        streak = 0
        check = today
        if check not in session_dates:
            check = today - timedelta(days=1)
        while check in session_dates:
            streak += 1
            check -= timedelta(days=1)
        result[uid] = streak
    return result


def _challenge_stat(challenge, user):
    """Return the current metric value for a user in a challenge. Returns None if insufficient data."""
    from training.models import TrainingSession
    from sparring.models import SparringRound
    start = challenge.starts_at.date()
    today = date.today()

    if challenge.challenge_type == 'sessions':
        val = TrainingSession.objects.filter(user=user, date__gte=start, date__lte=today).count()
        return val

    if challenge.challenge_type == 'hours':
        mins = (
            TrainingSession.objects
            .filter(user=user, date__gte=start, date__lte=today)
            .aggregate(t=Sum('duration'))['t'] or 0
        )
        return round(mins / 60, 1)

    if challenge.challenge_type == 'win_rate':
        rounds = SparringRound.objects.filter(user=user, date__gte=start, date__lte=today)
        total = rounds.count()
        if total < 3:
            return None  # insufficient rounds
        wins = rounds.filter(outcome='win').count()
        return round(wins / total * 100)

    return 0


def _resolve_challenge(challenge):
    """Compute and save the winner for a completed challenge."""
    my_val = _challenge_stat(challenge, challenge.challenger)
    their_val = _challenge_stat(challenge, challenge.challenged)

    # win_rate requires min 3 rounds; treat None as loss
    if my_val is None and their_val is None:
        winner = None  # draw — no data
    elif my_val is None:
        winner = challenge.challenged
    elif their_val is None:
        winner = challenge.challenger
    elif my_val > their_val:
        winner = challenge.challenger
    elif their_val > my_val:
        winner = challenge.challenged
    else:
        winner = None  # exact tie

    challenge.winner = winner
    challenge.status = 'completed'
    challenge.save(update_fields=['winner', 'status'])

    from notifications.push import send_push
    type_label = CHALLENGE_TYPE_LABELS.get(challenge.challenge_type, 'challenge')
    if winner:
        loser = challenge.challenged if winner == challenge.challenger else challenge.challenger
        send_push(winner, 'Challenge Complete — Victory!',
                  f'You won the {type_label} challenge!')
        send_push(loser, 'Challenge Complete',
                  f'The {type_label} challenge has ended. Better luck next time.')
    else:
        send_push(challenge.challenger, 'Challenge Complete — Draw!',
                  f'The {type_label} challenge ended in a draw.')
        send_push(challenge.challenged, 'Challenge Complete — Draw!',
                  f'The {type_label} challenge ended in a draw.')

    return challenge


def _mini_user(u):
    return {
        'id': u.id,
        'username': u.username,
        'belt': u.belt,
        'stripes': u.stripes,
        'display_belt': u.display_belt,
        'avatar': u.avatar.url if u.avatar else None,
    }


def _serialize_challenge(c, viewer):
    """Serialize a challenge from the viewer's perspective."""
    is_challenger = c.challenger_id == viewer.id
    opponent = c.challenged if is_challenger else c.challenger
    base = {
        'id': c.id,
        'challenge_type': c.challenge_type,
        'challenge_type_display': CHALLENGE_TYPE_LABELS.get(c.challenge_type, c.challenge_type),
        'unit': CHALLENGE_UNITS.get(c.challenge_type, ''),
        'duration_days': c.duration_days,
        'message': c.message,
        'status': c.status,
        'is_challenger': is_challenger,
        'opponent': _mini_user(opponent),
        'challenger': _mini_user(c.challenger),
        'challenged': _mini_user(c.challenged),
        'created_at': c.created_at.isoformat(),
    }

    if c.status in ('active', 'completed'):
        my_val = _challenge_stat(c, viewer)
        their_val = _challenge_stat(c, opponent)
        base['my_value'] = my_val
        base['their_value'] = their_val
        base['ends_at'] = c.ends_at.isoformat() if c.ends_at else None
        if c.ends_at:
            delta = c.ends_at.date() - date.today()
            base['days_left'] = max(0, delta.days)
        if my_val is not None and their_val is not None:
            base['leading'] = my_val >= their_val
        else:
            base['leading'] = my_val is not None

    if c.status == 'completed':
        base['winner'] = _mini_user(c.winner) if c.winner else None
        base['won'] = c.winner_id == viewer.id if c.winner else None

    return base


# ─── Dojo / Gym Room ──────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def gym_room(request):
    gym = (request.user.gym or '').strip()
    if not gym:
        return Response({'detail': 'no_gym'})

    today = date.today()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    members = (
        User.objects
        .filter(Q(gym__iexact=gym, is_public=True) | Q(id=request.user.id))
        .distinct()
        .annotate(
            sessions_week=Count(
                'training_sessions',
                filter=Q(training_sessions__date__gte=week_ago),
                distinct=True,
            ),
            minutes_month=Coalesce(
                Sum('training_sessions__duration', filter=Q(training_sessions__date__gte=month_ago)),
                0,
            ),
            total_sparring=Count('sparring_rounds', distinct=True),
            won_sparring=Count('sparring_rounds', filter=Q(sparring_rounds__outcome='win'), distinct=True),
        )
    )

    member_list = list(members)
    streaks = _compute_streaks([m.id for m in member_list])

    data = []
    for m in member_list:
        win_rate = (
            round(m.won_sparring / m.total_sparring * 100)
            if m.total_sparring > 0 else None
        )
        data.append({
            'id': m.id,
            'username': m.username,
            'belt': m.belt,
            'stripes': m.stripes,
            'display_belt': m.display_belt,
            'avatar': m.avatar.url if m.avatar else None,
            'sessions_week': m.sessions_week,
            'hours_month': round(m.minutes_month / 60, 1),
            'streak': streaks.get(m.id, 0),
            'win_rate': win_rate,
            'is_me': m.id == request.user.id,
        })

    return Response({'gym': gym, 'members': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_rivals(request):
    from sparring.models import SparringRound
    partner_names = (
        SparringRound.objects
        .filter(user=request.user)
        .exclude(partner_name='')
        .values_list('partner_name', flat=True)
        .distinct()
    )
    name_lower = [n.strip().lower() for n in partner_names if n.strip()]
    rival_users = User.objects.filter(
        username__in=name_lower,
        is_public=True,
    ).exclude(id=request.user.id)

    my_rounds = SparringRound.objects.filter(user=request.user)
    result = []
    for rival in rival_users:
        rounds_vs = my_rounds.filter(partner_name__iexact=rival.username)
        wins = rounds_vs.filter(outcome='win').count()
        losses = rounds_vs.filter(outcome='loss').count()
        draws = rounds_vs.filter(outcome='draw').count()
        total = wins + losses + draws
        result.append({
            'user': _mini_user(rival),
            'wins': wins,
            'losses': losses,
            'draws': draws,
            'total': total,
            'win_rate': round(wins / total * 100) if total else None,
        })

    result.sort(key=lambda x: -x['total'])
    return Response(result)


# ─── Public Profiles / Search ─────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def public_profile(request, username):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    if not user.is_public and (
        not request.user.is_authenticated or request.user.id != user.id
    ):
        return Response({'detail': 'This profile is private.'}, status=status.HTTP_403_FORBIDDEN)
    return Response(PublicUserSerializer(user, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    q = request.query_params.get('q', '').strip()
    if not q:
        return Response([])
    users = (
        User.objects
        .filter(Q(username__icontains=q) | Q(gym__icontains=q), is_public=True)
        .exclude(id=request.user.id)[:20]
    )
    return Response(PublicUserSerializer(users, many=True, context={'request': request}).data)


# ─── Challenges ───────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_challenge(request, username):
    try:
        target = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    if target == request.user:
        return Response({'detail': 'Cannot challenge yourself.'}, status=status.HTTP_400_BAD_REQUEST)
    if not target.is_public:
        return Response({'detail': 'This profile is private.'}, status=status.HTTP_403_FORBIDDEN)

    challenge_type = request.data.get('challenge_type', 'sessions')
    duration_days = int(request.data.get('duration_days', 7))
    message = (request.data.get('message') or '').strip()[:200]

    if challenge_type not in ('sessions', 'hours', 'win_rate'):
        return Response({'detail': 'Invalid challenge type.'}, status=status.HTTP_400_BAD_REQUEST)
    if duration_days not in (3, 7, 14, 30):
        return Response({'detail': 'Invalid duration.'}, status=status.HTTP_400_BAD_REQUEST)

    # Only one active/pending challenge between two users at a time
    existing = Challenge.objects.filter(
        Q(challenger=request.user, challenged=target) |
        Q(challenger=target, challenged=request.user),
        status__in=('pending', 'active'),
    ).exists()
    if existing:
        return Response({'detail': 'A challenge already exists between you two.'}, status=status.HTTP_400_BAD_REQUEST)

    challenge = Challenge.objects.create(
        challenger=request.user,
        challenged=target,
        challenge_type=challenge_type,
        duration_days=duration_days,
        message=message,
    )

    from notifications.push import send_push
    type_label = CHALLENGE_TYPE_LABELS.get(challenge_type, challenge_type)
    send_push(
        target,
        f'{request.user.username} challenged you!',
        f'Compete in {type_label} over {duration_days} days. Accept from the dashboard.',
    )

    return Response(_serialize_challenge(challenge, request.user), status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_challenge(request, challenge_id):
    try:
        challenge = Challenge.objects.get(id=challenge_id, challenged=request.user, status='pending')
    except Challenge.DoesNotExist:
        return Response({'detail': 'Challenge not found.'}, status=status.HTTP_404_NOT_FOUND)

    action = request.data.get('action')
    from notifications.push import send_push
    type_label = CHALLENGE_TYPE_LABELS.get(challenge.challenge_type, 'challenge')

    if action == 'accept':
        now = timezone.now()
        challenge.status = 'active'
        challenge.starts_at = now
        challenge.ends_at = now + timedelta(days=challenge.duration_days)
        challenge.save()
        send_push(
            challenge.challenger,
            f'{request.user.username} accepted your challenge!',
            f"The {type_label} contest has started. {challenge.duration_days} days on the clock.",
        )
    elif action == 'decline':
        challenge.status = 'declined'
        challenge.save()
        send_push(
            challenge.challenger,
            f'{request.user.username} declined your challenge',
            'Head to the Dojo to challenge someone else.',
            '/dojo',
        )
    else:
        return Response({'detail': 'action must be accept or decline.'}, status=status.HTTP_400_BAD_REQUEST)

    return Response(_serialize_challenge(challenge, request.user))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_challenges(request):
    viewer = request.user
    all_challenges = (
        Challenge.objects
        .filter(Q(challenger=viewer) | Q(challenged=viewer))
        .select_related('challenger', 'challenged', 'winner')
        .exclude(status='declined')
    )

    # Auto-resolve expired active challenges
    now = timezone.now()
    for c in all_challenges:
        if c.status == 'active' and c.ends_at and c.ends_at <= now:
            _resolve_challenge(c)

    # Re-fetch after resolution
    all_challenges = (
        Challenge.objects
        .filter(Q(challenger=viewer) | Q(challenged=viewer))
        .select_related('challenger', 'challenged', 'winner')
        .exclude(status='declined')
    )

    pending_received = []
    pending_sent = []
    active = []
    completed = []

    for c in all_challenges:
        if c.status == 'pending':
            if c.challenged_id == viewer.id:
                pending_received.append(_serialize_challenge(c, viewer))
            else:
                pending_sent.append(_serialize_challenge(c, viewer))
        elif c.status == 'active':
            active.append(_serialize_challenge(c, viewer))
        elif c.status == 'completed':
            completed.append(_serialize_challenge(c, viewer))

    return Response({
        'pending_received': pending_received,
        'pending_sent': pending_sent,
        'active': active,
        'completed': completed[:5],
    })

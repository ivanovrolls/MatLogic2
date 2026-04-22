from datetime import date, timedelta
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Q
from django.db.models.functions import Coalesce
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .serializers import PublicUserSerializer

User = get_user_model()


def _compute_streaks(member_ids):
    """Return {user_id: streak_days} in a single query."""
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def gym_room(request):
    gym = (request.user.gym or '').strip()
    if not gym:
        return Response({'detail': 'no_gym'})

    today = date.today()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    # Include the requesting user always; other members must be public
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
                Sum(
                    'training_sessions__duration',
                    filter=Q(training_sessions__date__gte=month_ago),
                ),
                0,
            ),
            total_sparring=Count('sparring_rounds', distinct=True),
            won_sparring=Count(
                'sparring_rounds',
                filter=Q(sparring_rounds__outcome='win'),
                distinct=True,
            ),
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
    """Auto-detect rivals: public MatLogic users the requester has named in sparring logs."""
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
            'user': {
                'id': rival.id,
                'username': rival.username,
                'belt': rival.belt,
                'stripes': rival.stripes,
                'display_belt': rival.display_belt,
                'avatar': rival.avatar.url if rival.avatar else None,
            },
            'wins': wins,
            'losses': losses,
            'draws': draws,
            'total': total,
            'win_rate': round(wins / total * 100) if total else None,
        })

    result.sort(key=lambda x: -x['total'])
    return Response(result)


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

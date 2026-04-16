from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Avg, Sum
from datetime import date, timedelta
from collections import Counter, defaultdict


def get_date_range(period):
    today = date.today()
    if period == '30d':
        return today - timedelta(days=30)
    elif period == '90d':
        return today - timedelta(days=90)
    elif period == '6m':
        return today - timedelta(days=182)
    elif period == '1y':
        return today - timedelta(days=365)
    return today - timedelta(days=90)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def overview(request):
    user = request.user
    period = request.query_params.get('period', '90d')
    since = get_date_range(period)

    sessions = user.training_sessions.filter(date__gte=since)
    rounds = user.sparring_rounds.filter(date__gte=since)

    total_sessions = sessions.count()
    total_minutes = sessions.aggregate(t=Sum('duration'))['t'] or 0
    total_rounds = rounds.count()
    wins = rounds.filter(outcome='win').count()
    losses = rounds.filter(outcome='loss').count()

    return Response({
        'period': period,
        'total_sessions': total_sessions,
        'total_hours': round(total_minutes / 60, 1),
        'total_rounds': total_rounds,
        'wins': wins,
        'losses': losses,
        'draws': rounds.filter(outcome='draw').count(),
        'win_rate': round((wins / total_rounds * 100), 1) if total_rounds > 0 else 0,
        'avg_sessions_per_week': round(total_sessions / max((date.today() - since).days / 7, 1), 1),
        'avg_performance': sessions.aggregate(a=Avg('performance_rating'))['a'],
        'techniques_in_db': user.techniques.filter(is_active=True).count(),
        'competitions': user.competitions.count(),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def training_trends(request):
    user = request.user
    period = request.query_params.get('period', '90d')
    since = get_date_range(period)

    sessions = user.training_sessions.filter(date__gte=since).order_by('date')

    # Group sessions by week
    weekly_data = defaultdict(lambda: {'sessions': 0, 'minutes': 0, 'avg_performance': []})
    for session in sessions:
        week_start = session.date - timedelta(days=session.date.weekday())
        week_key = week_start.isoformat()
        weekly_data[week_key]['sessions'] += 1
        weekly_data[week_key]['minutes'] += session.duration
        if session.performance_rating:
            weekly_data[week_key]['avg_performance'].append(session.performance_rating)

    result = []
    for week, data in sorted(weekly_data.items()):
        perfs = data['avg_performance']
        result.append({
            'week': week,
            'sessions': data['sessions'],
            'hours': round(data['minutes'] / 60, 1),
            'avg_performance': round(sum(perfs) / len(perfs), 1) if perfs else None,
        })

    # Session type breakdown
    type_counts = sessions.values('session_type').annotate(count=Count('id'))
    type_breakdown = {item['session_type']: item['count'] for item in type_counts}

    return Response({
        'weekly_trend': result,
        'session_type_breakdown': type_breakdown,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sparring_stats(request):
    user = request.user
    period = request.query_params.get('period', '90d')
    since = get_date_range(period)

    rounds = user.sparring_rounds.filter(date__gte=since)
    total = rounds.count()

    if total == 0:
        return Response({'message': 'No sparring data for this period.'})

    wins = rounds.filter(outcome='win').count()
    losses = rounds.filter(outcome='loss').count()

    # Aggregate submissions conceded/attempted
    all_conceded = []
    all_attempted = []
    all_dominant = []
    all_conceded_pos = []

    for r in rounds:
        all_conceded.extend(r.submissions_conceded)
        all_attempted.extend(r.submissions_attempted)
        all_dominant.extend(r.dominant_positions)
        all_conceded_pos.extend(r.positions_conceded)

    # Monthly win rate trend
    monthly = defaultdict(lambda: {'wins': 0, 'losses': 0, 'draws': 0})
    for r in rounds:
        key = r.date.strftime('%Y-%m')
        monthly[key][r.outcome + 's' if r.outcome != 'draw' else 'draws'] += 1

    monthly_trend = []
    for month, data in sorted(monthly.items()):
        total_m = data['wins'] + data['losses'] + data['draws']
        monthly_trend.append({
            'month': month,
            'wins': data['wins'],
            'losses': data['losses'],
            'draws': data['draws'],
            'win_rate': round(data['wins'] / total_m * 100, 1) if total_m > 0 else 0,
        })

    # Belt matchup stats
    belt_stats = {}
    for r in rounds:
        belt = r.partner_belt
        if belt not in belt_stats:
            belt_stats[belt] = {'wins': 0, 'losses': 0, 'draws': 0}
        belt_stats[belt][r.outcome + 's' if r.outcome != 'draw' else 'draws'] += 1

    return Response({
        'total_rounds': total,
        'wins': wins,
        'losses': losses,
        'draws': rounds.filter(outcome='draw').count(),
        'win_rate': round(wins / total * 100, 1),
        'top_submissions_conceded': Counter(all_conceded).most_common(8),
        'top_submissions_attempted': Counter(all_attempted).most_common(8),
        'top_dominant_positions': Counter(all_dominant).most_common(6),
        'top_conceded_positions': Counter(all_conceded_pos).most_common(6),
        'monthly_trend': monthly_trend,
        'belt_matchup_stats': belt_stats,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def technique_analysis(request):
    user = request.user
    period = request.query_params.get('period', '90d')
    since = get_date_range(period)

    techniques = user.techniques.filter(is_active=True)
    sessions = user.training_sessions.filter(date__gte=since)

    # Most drilled techniques
    most_drilled = techniques.order_by('-times_drilled')[:10]

    # Technique usage in sessions (from M2M)
    from techniques.models import Technique
    from django.db.models import Count as DjCount
    session_technique_counts = (
        Technique.objects.filter(user=user, training_sessions__date__gte=since)
        .annotate(session_count=DjCount('training_sessions'))
        .order_by('-session_count')[:10]
    )

    # Position coverage
    position_counts = techniques.values('position').annotate(count=DjCount('id'))

    # Type coverage
    type_counts = techniques.values('technique_type').annotate(count=DjCount('id'))

    return Response({
        'total_techniques': techniques.count(),
        'most_drilled': [
            {'id': t.id, 'name': t.name, 'position': t.position, 'times_drilled': t.times_drilled}
            for t in most_drilled
        ],
        'most_used_in_sessions': [
            {'id': t.id, 'name': t.name, 'position': t.position, 'session_count': t.session_count}
            for t in session_technique_counts
        ],
        'position_coverage': {item['position']: item['count'] for item in position_counts},
        'type_coverage': {item['technique_type']: item['count'] for item in type_counts},
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def insights(request):
    """Generate text-based insights from user's training data."""
    user = request.user
    insights_list = []
    warnings = []
    highlights = []

    # Training frequency
    last_30 = user.training_sessions.filter(
        date__gte=date.today() - timedelta(days=30)
    ).count()

    if last_30 == 0:
        warnings.append({
            'type': 'inactivity',
            'title': 'No sessions logged in 30 days',
            'detail': 'Get back on the mats. Even one session a week builds retention.',
            'severity': 'high'
        })
    elif last_30 < 4:
        warnings.append({
            'type': 'low_frequency',
            'title': 'Low training frequency',
            'detail': f'Only {last_30} sessions in the last 30 days. Aim for 3+ sessions per week for consistent improvement.',
            'severity': 'medium'
        })
    elif last_30 >= 12:
        highlights.append({
            'type': 'high_frequency',
            'title': 'Strong training consistency',
            'detail': f'{last_30} sessions in the last 30 days. Excellent dedication.',
        })

    # Sparring win rate
    recent_rounds = user.sparring_rounds.filter(
        date__gte=date.today() - timedelta(days=60)
    )
    total_rounds = recent_rounds.count()
    if total_rounds >= 10:
        win_rate = recent_rounds.filter(outcome='win').count() / total_rounds * 100
        if win_rate < 30:
            warnings.append({
                'type': 'low_win_rate',
                'title': 'Win rate below 30%',
                'detail': 'Focus on defense and survival first. Identify the positions you keep getting caught in.',
                'severity': 'medium'
            })
        elif win_rate > 70:
            highlights.append({
                'type': 'high_win_rate',
                'title': f'Strong win rate: {win_rate:.0f}%',
                'detail': 'You\'re performing well. Consider seeking out tougher training partners to accelerate growth.',
            })

        # Most conceded submission
        all_conceded = []
        for r in recent_rounds:
            all_conceded.extend(r.submissions_conceded)
        if all_conceded:
            top_loss = Counter(all_conceded).most_common(1)[0]
            insights_list.append({
                'type': 'submission_weakness',
                'title': f'Most common tap: {top_loss[0]}',
                'detail': f'You\'ve been caught with {top_loss[0]} {top_loss[1]} time(s) recently. Drill the escape specifically.',
                'action': f'Add "{top_loss[0]} escape" to your technique database and weekly plan.',
            })

    # Technique database gaps
    techniques = user.techniques.filter(is_active=True)
    if techniques.count() < 10:
        insights_list.append({
            'type': 'technique_gap',
            'title': 'Build out your technique database',
            'detail': f'You have {techniques.count()} techniques logged. A richer database helps you spot patterns.',
            'action': 'Add at least 3 techniques per position you train regularly.',
        })

    # Planning usage
    has_plan = user.weekly_plans.filter(
        week_start__gte=date.today() - timedelta(days=7)
    ).exists()
    if not has_plan:
        insights_list.append({
            'type': 'no_plan',
            'title': 'No weekly plan set',
            'detail': 'Deliberate practice beats random drilling. Set a focus for this week.',
            'action': 'Create a weekly plan with 2-3 techniques to focus on.',
        })

    return Response({
        'insights': insights_list,
        'warnings': warnings,
        'highlights': highlights,
    })

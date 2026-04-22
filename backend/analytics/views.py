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
        all_conceded.extend(_norm_sub(s) for s in r.submissions_conceded)
        all_attempted.extend(_norm_sub(s) for s in r.submissions_attempted)
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


BELT_ORDER = ['white', 'blue', 'purple', 'brown', 'black']


def _norm_sub(name: str) -> str:
    """Normalize a submission name: lowercase, strip apostrophes/special chars, collapse spaces."""
    import re
    return re.sub(r'\s+', ' ', re.sub(r"[^a-z0-9 ]", '', name.lower())).strip()


def _belt_idx(belt):
    try:
        return BELT_ORDER.index(belt or 'white')
    except ValueError:
        return 0


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def insights(request):
    """Generate text-based insights from user's training data."""
    user = request.user
    insights_list = []
    warnings = []
    highlights = []

    # ── Training frequency ────────────────────────────────────────────────────
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

    # ── Sparring analysis ─────────────────────────────────────────────────────
    # Determine context: prefer equal/higher belt rounds for meaningful comparisons
    user_belt_idx = _belt_idx(user.belt)
    equal_or_higher = BELT_ORDER[user_belt_idx:]

    all_rounds = list(user.sparring_rounds.all())
    peer_rounds = [r for r in all_rounds if r.partner_belt in equal_or_higher]

    # Use peer rounds if enough data, fall back to all rounds
    if len(peer_rounds) >= 4:
        analysis_rounds = peer_rounds
        belt_context = f"against {user.belt} belt and above partners"
    else:
        analysis_rounds = all_rounds
        belt_context = "across all sparring rounds"

    total_analysis = len(analysis_rounds)
    early_data = total_analysis < 5  # flag for honest caveats in insight text
    recent_rounds = [r for r in all_rounds if r.date >= date.today() - timedelta(days=60)]
    total_recent = len(recent_rounds)

    # Overall win rate (recent 60 days)
    if total_recent >= 3:
        win_rate = sum(1 for r in recent_rounds if r.outcome == 'win') / total_recent * 100
        early_wr = total_recent < 8
        if win_rate < 30:
            warnings.append({
                'type': 'low_win_rate',
                'title': 'Win rate below 30%' + (' (early data)' if early_wr else ''),
                'detail': ('Early rounds suggest you\'re struggling — focus on defense and survival first.' if early_wr
                           else 'Focus on defense and survival first. Identify the positions you keep getting caught in.'),
                'severity': 'medium'
            })
        elif win_rate > 70:
            highlights.append({
                'type': 'high_win_rate',
                'title': f'{"Early lead" if early_wr else "Strong win rate"}: {win_rate:.0f}%',
                'detail': ('Off to a great start. Keep logging rounds to confirm this trend.' if early_wr
                           else 'You\'re performing well. Consider seeking out tougher training partners to accelerate growth.'),
            })

    # ── Submission concession analysis ────────────────────────────────────────
    if total_analysis >= 2:
        all_conceded = []
        for r in analysis_rounds:
            all_conceded.extend(_norm_sub(s) for s in r.submissions_conceded)

        if all_conceded:
            conceded_counts = Counter(all_conceded)
            shown_concession = 0
            for sub, count in conceded_counts.most_common(3):
                if count < 2 or shown_concession >= 2:
                    break
                rate = round(count / total_analysis * 100)
                early_note = ' (early data — keep logging)' if early_data else ''
                if rate >= 40:
                    warnings.append({
                        'type': 'submission_concession',
                        'title': f'Defensive gap: {sub}',
                        'detail': f'You\'ve tapped to {sub} {count} time{"s" if count > 1 else ""} — {rate}% of your rounds {belt_context}{early_note}. Worth addressing.',
                        'severity': 'medium',
                        'action': f'Drill {sub} defense and escapes. Add it to your technique database.',
                    })
                else:
                    insights_list.append({
                        'type': 'submission_concession',
                        'title': f'Most conceded: {sub}',
                        'detail': f'You\'ve tapped to {sub} {count} time{"s" if count > 1 else ""} ({rate}% of rounds {belt_context}{early_note}). Worth shoring up.',
                        'action': f'Drill {sub} defense. Add the escape to your technique database.',
                    })
                shown_concession += 1

    # ── Offensive weapon analysis ─────────────────────────────────────────────
    if total_analysis >= 2:
        sub_stats = {}  # sub -> {'attempts': 0, 'win_rounds': 0}
        for r in analysis_rounds:
            for sub in (_norm_sub(s) for s in r.submissions_attempted):
                if sub not in sub_stats:
                    sub_stats[sub] = {'attempts': 0, 'win_rounds': 0}
                sub_stats[sub]['attempts'] += 1
                if r.outcome == 'win':
                    sub_stats[sub]['win_rounds'] += 1

        # Find weapons: 2+ attempts, sort by win-rate-when-used
        candidates = [
            (sub, d['attempts'], round(d['win_rounds'] / d['attempts'] * 100))
            for sub, d in sub_stats.items()
            if d['attempts'] >= 2
        ]
        candidates.sort(key=lambda x: x[2], reverse=True)

        if candidates:
            best_sub, attempts, wr = candidates[0]
            early_note = ' — log more rounds to confirm' if early_data else ''
            if wr >= 65:
                highlights.append({
                    'type': 'submission_weapon',
                    'title': f'Your {best_sub} is{"looking like" if early_data else ""} a weapon',
                    'detail': f'You win {wr}% of rounds where you go for a {best_sub} ({attempts} attempt{"s" if attempts > 1 else ""} {belt_context}{early_note}). Keep hunting it.',
                })
            elif wr >= 45:
                insights_list.append({
                    'type': 'submission_potential',
                    'title': f'Developing weapon: {best_sub}',
                    'detail': f'You attempt {best_sub} regularly ({attempts} time{"s" if attempts > 1 else ""} {belt_context}) with a {wr}% win rate when you use it{early_note}. Refine the entries.',
                    'action': f'Drill {best_sub} setups from your most common entry positions.',
                })

        # Check for high-volume attempts with low win rate — may signal telegraphing
        for sub, attempts, wr in candidates:
            if attempts >= 3 and wr < 30:
                insights_list.append({
                    'type': 'submission_overuse',
                    'title': f'{sub}: attempts not converting',
                    'detail': f'You\'ve gone for {sub} {attempts} time{"s" if attempts > 1 else ""} {belt_context} but only win {wr}% of those rounds. Try varying your setups.',
                    'action': f'Work on {sub} setups and combination attacks to disguise the attempt.',
                })
                break

    # ── Positional vulnerability analysis ────────────────────────────────────
    if total_analysis >= 3:
        all_conceded_pos = []
        for r in analysis_rounds:
            all_conceded_pos.extend(r.positions_conceded)

        if all_conceded_pos:
            top_pos, top_pos_count = Counter(all_conceded_pos).most_common(1)[0]
            pos_rate = round(top_pos_count / total_analysis * 100)
            early_note = ' (early data)' if early_data else ''
            if pos_rate >= 35:
                insights_list.append({
                    'type': 'position_weakness',
                    'title': f'Positional gap: {top_pos.replace("_", " ")}',
                    'detail': f'Your partner ends up in {top_pos.replace("_", " ")} in {pos_rate}% of your rounds {belt_context}{early_note}.',
                    'action': f'Focus a training block on preventing and escaping {top_pos.replace("_", " ")}.',
                })

    # ── Technique database gaps ───────────────────────────────────────────────
    techniques = user.techniques.filter(is_active=True)
    if techniques.count() < 10:
        insights_list.append({
            'type': 'technique_gap',
            'title': 'Build out your technique database',
            'detail': f'You have {techniques.count()} techniques logged. A richer database helps you spot patterns.',
            'action': 'Add at least 3 techniques per position you train regularly.',
        })

    # ── Planning usage ────────────────────────────────────────────────────────
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

from datetime import date


CHOKE_KEYWORDS = ['choke', 'triangle', 'guillotine', 'loop', 'bow', "d'arce", 'darce', 'anaconda', 'rear naked', 'brabo']
JOINT_LOCK_KEYWORDS = ['armbar', 'kimura', 'americana', 'heel hook', 'kneebar', 'toe hold', 'wristlock', 'omoplata', 'straight ankle', 'calf slicer']
GUARD_POSITIONS = ['closed_guard', 'open_guard', 'half_guard', 'de_la_riva', 'spider_guard', 'lasso_guard', 'x_guard', 'butterfly']

TITLE_DEFINITIONS = [
    {'slug': 'fresh_white_belt', 'name': 'Fresh White Belt', 'description': 'Default title unlocked upon creating an account'},
    {'slug': 'mat_newcomer', 'name': 'Mat Newcomer', 'description': 'Default title unlocked upon first login'},
    {'slug': 'tap_snapper', 'name': 'Tap Snapper', 'description': 'Log your first training session'},
    {'slug': 'grip_reaper', 'name': 'Grip Reaper', 'description': 'Log 50 total hours of training'},
    {'slug': 'mat_rat', 'name': 'Mat Rat', 'description': 'Log sessions on 15 consecutive days'},
    {'slug': 'tap_machine', 'name': 'Tap Machine', 'description': 'Record 25 submissions in your logs'},
    {'slug': 'choke_artist', 'name': 'Choke Artist', 'description': 'Log 12 finishes via choke techniques'},
    {'slug': 'joint_venture', 'name': 'Joint Venture', 'description': 'Log 12 joint lock submissions'},
    {'slug': 'breakfall_beginner', 'name': 'Breakfall Beginner', 'description': 'Record 50 total takedowns or falls'},
    {'slug': 'guard_whisperer', 'name': 'Guard Whisperer', 'description': 'Log 100 successful guard plays'},
    {'slug': 'sweep_dreams', 'name': 'Sweep Dreams', 'description': 'Record 35 sweeps in sessions'},
    {'slug': 'scramble_gambler', 'name': 'Scramble Gambler', 'description': 'Log 50 total sparring rounds'},
    {'slug': 'coachs_pet', 'name': "Coach's Pet", 'description': 'Receive 25 pieces of coach feedback'},
    {'slug': 'feedback_fiend', 'name': 'Feedback Fiend', 'description': 'Receive feedback across 10 different sessions'},
    {'slug': 'injury_time', 'name': 'Injury Time', 'description': 'Log 3 separate injury recoveries'},
    {'slug': 'iron_neck', 'name': 'Iron Neck', 'description': 'Return from injury and log 10 sessions post-recovery'},
    {'slug': 'comp_curious', 'name': 'Comp Curious', 'description': 'Log 5 competitions'},
    {'slug': 'podium_predator', 'name': 'Podium Predator', 'description': 'Record 2 medal finishes in competitions'},
    {'slug': 'white_belt_wizard', 'name': 'White Belt Wizard', 'description': 'Log 50 techniques'},
    {'slug': 'blue_belt_blues', 'name': 'Blue Belt Blues', 'description': 'Log 100 hours of training at blue belt or above'},
    {'slug': 'technique_collector', 'name': 'Technique Collector', 'description': 'Log 75 unique techniques'},
    {'slug': 'drill_sergeant', 'name': 'Drill Sergeant', 'description': 'Log 25 drilling-focused sessions'},
    {'slug': 'flow_state', 'name': 'Flow State', 'description': 'Log 12 open mat sessions'},
    {'slug': 'submission_scholar', 'name': 'Submission Scholar', 'description': 'Log entries from 25 different submission types'},
    {'slug': 'escape_artist', 'name': 'Escape Artist', 'description': 'Win 50 rounds after conceding a position'},
    {'slug': 'backpack_bandit', 'name': 'Backpack Bandit', 'description': 'Log 15 back takes'},
    {'slug': 'mount_explorer', 'name': 'Mount Explorer', 'description': 'Hold mount across 25 rounds'},
    {'slug': 'half_guard_hero', 'name': 'Half Guard Hero', 'description': 'Log 50 half guard entries'},
    {'slug': 'no_gi_ninja', 'name': 'No-Gi Ninja', 'description': 'Log 25 no-gi sessions'},
    {'slug': 'gi_joe', 'name': 'Gi Joe', 'description': 'Log 25 gi sessions'},
    {'slug': 'consistency_king', 'name': 'Consistency King', 'description': 'Train at least 3 times per week for 4 consecutive weeks'},
    {'slug': 'rolling_thunder', 'name': 'Rolling Thunder', 'description': 'Log 100 rounds of sparring'},
]

TITLE_MAP = {t['slug']: t for t in TITLE_DEFINITIONS}


def _total_hours(user):
    from django.db.models import Sum
    result = user.training_sessions.aggregate(total=Sum('duration'))['total'] or 0
    return result / 60.0


def _max_consecutive_days(user):
    dates = sorted(set(user.training_sessions.values_list('date', flat=True)))
    if not dates:
        return 0
    max_streak = streak = 1
    for i in range(1, len(dates)):
        if (dates[i] - dates[i - 1]).days == 1:
            streak += 1
            max_streak = max(max_streak, streak)
        else:
            streak = 1
    return max_streak


def _weeks_with_n_sessions(user, min_sessions, consecutive_weeks):
    from collections import defaultdict
    sessions = list(user.training_sessions.values_list('date', flat=True))
    week_counts = defaultdict(int)
    for d in sessions:
        week_counts[d.isocalendar()[:2]] += 1
    qualifying = sorted(k for k, v in week_counts.items() if v >= min_sessions)
    if not qualifying:
        return False
    max_consec = consec = 1
    for i in range(1, len(qualifying)):
        y1, w1 = qualifying[i - 1]
        y2, w2 = qualifying[i]
        d1 = date.fromisocalendar(y1, w1, 1)
        d2 = date.fromisocalendar(y2, w2, 1)
        if (d2 - d1).days == 7:
            consec += 1
            max_consec = max(max_consec, consec)
        else:
            consec = 1
    return max_consec >= consecutive_weeks


def _count_submission_type(rounds, keywords):
    count = 0
    for r in rounds:
        for sub in r.submissions_hit:
            if any(kw in sub.lower() for kw in keywords):
                count += 1
    return count


def check_title(slug, user):
    sessions = user.training_sessions
    rounds = list(user.sparring_rounds.all())

    if slug in ('fresh_white_belt', 'mat_newcomer'):
        return True
    if slug == 'tap_snapper':
        return sessions.exists()
    if slug == 'grip_reaper':
        return _total_hours(user) >= 50
    if slug == 'mat_rat':
        return _max_consecutive_days(user) >= 15
    if slug == 'tap_machine':
        return sum(len(r.submissions_hit) for r in rounds) >= 25
    if slug == 'choke_artist':
        return _count_submission_type(rounds, CHOKE_KEYWORDS) >= 12
    if slug == 'joint_venture':
        return _count_submission_type(rounds, JOINT_LOCK_KEYWORDS) >= 12
    if slug == 'breakfall_beginner':
        return sum(r.takedowns_completed for r in rounds) >= 50
    if slug == 'guard_whisperer':
        return sum(1 for r in rounds if any(p in r.dominant_positions for p in GUARD_POSITIONS)) >= 100
    if slug == 'sweep_dreams':
        return sum(r.sweeps_completed for r in rounds) >= 35
    if slug == 'scramble_gambler':
        return len(rounds) >= 50
    if slug == 'coachs_pet':
        from coaching.models import CoachSessionNote, CoachRoundFeedback
        notes = CoachSessionNote.objects.filter(student=user).count()
        feedback = CoachRoundFeedback.objects.filter(student=user).count()
        return notes + feedback >= 25
    if slug == 'feedback_fiend':
        from coaching.models import CoachSessionNote
        return CoachSessionNote.objects.filter(student=user).values('session').distinct().count() >= 10
    if slug == 'injury_time':
        from injuries.models import InjuryLog
        return InjuryLog.objects.filter(user=user, status='resolved').count() >= 3
    if slug == 'iron_neck':
        from injuries.models import InjuryLog
        resolved = InjuryLog.objects.filter(user=user, status='resolved', date_resolved__isnull=False).order_by('date_resolved').first()
        if not resolved:
            return False
        return sessions.filter(date__gte=resolved.date_resolved).count() >= 10
    if slug == 'comp_curious':
        from competition.models import Competition
        return Competition.objects.filter(user=user).count() >= 5
    if slug == 'podium_predator':
        from competition.models import Competition
        return Competition.objects.filter(user=user, result__in=['gold', 'silver', 'bronze']).count() >= 2
    if slug == 'white_belt_wizard':
        return user.techniques.count() >= 50
    if slug == 'blue_belt_blues':
        return user.belt in ('blue', 'purple', 'brown', 'black') and _total_hours(user) >= 100
    if slug == 'technique_collector':
        return user.techniques.count() >= 75
    if slug == 'drill_sergeant':
        return sessions.filter(session_type='drilling').count() >= 25
    if slug == 'flow_state':
        return sessions.filter(session_type='open_mat').count() >= 12
    if slug == 'submission_scholar':
        all_subs = {s.lower().strip() for r in rounds for s in r.submissions_hit}
        return len(all_subs) >= 25
    if slug == 'escape_artist':
        return sum(1 for r in rounds if r.positions_conceded and r.outcome == 'win') >= 50
    if slug == 'backpack_bandit':
        return sum(1 for r in rounds if 'back' in r.dominant_positions) >= 15
    if slug == 'mount_explorer':
        return sum(1 for r in rounds if 'mount' in r.dominant_positions) >= 25
    if slug == 'half_guard_hero':
        return sum(1 for r in rounds if 'half_guard' in r.dominant_positions) >= 50
    if slug == 'no_gi_ninja':
        return sessions.filter(session_type='nogi').count() >= 25
    if slug == 'gi_joe':
        return sessions.filter(session_type='gi').count() >= 25
    if slug == 'consistency_king':
        return _weeks_with_n_sessions(user, 3, 4)
    if slug == 'rolling_thunder':
        return len(rounds) >= 100
    return False


def check_and_award_titles(user):
    """Check all titles and award newly unlocked ones. Returns list of newly awarded slugs."""
    from .models import UserTitle
    from notifications.models import InAppNotification

    already_unlocked = set(UserTitle.objects.filter(user=user).values_list('slug', flat=True))
    newly_awarded = []

    for title_def in TITLE_DEFINITIONS:
        slug = title_def['slug']
        if slug in already_unlocked:
            continue
        try:
            if check_title(slug, user):
                UserTitle.objects.create(user=user, slug=slug)
                InAppNotification.objects.create(
                    user=user,
                    type='achievement',
                    title=f'Title Unlocked: {title_def["name"]}',
                    message=title_def['description'],
                    link='/my-profile',
                )
                newly_awarded.append(slug)
        except Exception:
            pass

    return newly_awarded


def award_default_titles(user):
    """Award the two default titles to a new user."""
    from .models import UserTitle

    for i, slug in enumerate(['fresh_white_belt', 'mat_newcomer']):
        if not UserTitle.objects.filter(user=user, slug=slug).exists():
            UserTitle.objects.create(user=user, slug=slug, is_equipped=(i == 0))

"""
Insight tests — verify every insight fires (or stays silent) at its exact threshold.

All time-sensitive insights use `date.today()` internally. We patch it so tests
are deterministic and can simulate any training history without waiting for real
time to pass.
"""

from datetime import date, timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from sparring.models import SparringRound
from training.models import TrainingSession

User = get_user_model()

TODAY = date(2026, 4, 28)
PATCH_TARGET = "analytics.views.date"


def _today(**offsets):
    """Return a date relative to the frozen TODAY."""
    return TODAY - timedelta(**offsets)


class InsightTestCase(TestCase):
    """Base: one fresh user, DRF APIClient with force_authenticate, date frozen to TODAY."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="tester", email="t@t.com", password="pw"
        )
        self.user.belt = "blue"
        self.user.save()
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def _get(self):
        """Call the insights endpoint with a frozen date, return parsed JSON."""
        with patch(PATCH_TARGET) as mock_date:
            mock_date.today.return_value = TODAY
            resp = self.client.get(reverse("analytics-insights"))
        self.assertEqual(resp.status_code, 200)
        return resp.json()

    def _session(self, days_ago=1, session_type="gi"):
        return TrainingSession.objects.create(
            user=self.user,
            date=_today(days=days_ago),
            session_type=session_type,
            duration=90,
        )

    def _round(self, days_ago=1, outcome="win", belt="blue",
                subs_conceded=None, subs_attempted=None,
                dominant_positions=None, positions_conceded=None):
        return SparringRound.objects.create(
            user=self.user,
            date=_today(days=days_ago),
            partner_name="Partner",
            partner_belt=belt,
            duration_minutes=5,
            outcome=outcome,
            is_gi=True,
            submissions_conceded=subs_conceded or [],
            submissions_attempted=subs_attempted or [],
            dominant_positions=dominant_positions or [],
            positions_conceded=positions_conceded or [],
            sweeps_completed=0,
            takedowns_completed=0,
        )

    def _all_types(self, data):
        return {
            i["type"] for group in ("insights", "warnings", "highlights")
            for i in data[group]
        }


# ── Frequency insights ────────────────────────────────────────────────────────

class FrequencyTests(InsightTestCase):

    def test_inactivity_warning_when_no_sessions_in_30_days(self):
        """Zero sessions in last 30 days → 'inactivity' warning."""
        data = self._get()
        self.assertIn("inactivity", self._all_types(data))

    def test_inactivity_suppressed_when_session_today(self):
        """A session logged today suppresses the inactivity warning."""
        self._session(days_ago=0)
        data = self._get()
        self.assertNotIn("inactivity", self._all_types(data))

    def test_inactivity_fires_when_last_session_31_days_ago(self):
        """Session 31 days ago is outside the 30-day window — inactivity fires."""
        self._session(days_ago=31)
        data = self._get()
        self.assertIn("inactivity", self._all_types(data))

    def test_inactivity_suppressed_when_session_30_days_ago(self):
        """Session exactly 30 days ago is still inside the window."""
        self._session(days_ago=30)
        data = self._get()
        self.assertNotIn("inactivity", self._all_types(data))

    def test_low_frequency_with_3_sessions(self):
        """3 sessions in 30 days is below the 4-session threshold → low_frequency."""
        for d in [1, 8, 15]:
            self._session(days_ago=d)
        data = self._get()
        self.assertIn("low_frequency", self._all_types(data))

    def test_low_frequency_suppressed_at_4_sessions(self):
        """4 sessions in 30 days clears the low_frequency warning."""
        for d in [1, 8, 15, 22]:
            self._session(days_ago=d)
        data = self._get()
        self.assertNotIn("low_frequency", self._all_types(data))

    def test_high_frequency_highlight_at_12_sessions(self):
        """12+ sessions in 30 days → 'high_frequency' highlight."""
        for d in range(1, 13):
            self._session(days_ago=d * 2)
        data = self._get()
        self.assertIn("high_frequency", self._all_types(data))

    def test_high_frequency_not_fired_at_11_sessions(self):
        """11 sessions — just under the highlight threshold."""
        for d in range(1, 12):
            self._session(days_ago=d * 2)
        data = self._get()
        self.assertNotIn("high_frequency", self._all_types(data))

    def test_only_sessions_within_30_days_counted(self):
        """Sessions older than 30 days must not count toward frequency."""
        # 2 recent + 10 old — still low_frequency territory
        self._session(days_ago=5)
        self._session(days_ago=10)
        for d in range(35, 90, 5):
            self._session(days_ago=d)
        data = self._get()
        types = self._all_types(data)
        self.assertIn("low_frequency", types)
        self.assertNotIn("high_frequency", types)


# ── Win rate insights ─────────────────────────────────────────────────────────

class WinRateTests(InsightTestCase):

    def test_low_win_rate_warning_below_30_percent(self):
        """< 30 % win rate in last 60 days → low_win_rate warning."""
        for i in range(7):
            self._round(days_ago=i + 1, outcome="loss")
        self._round(days_ago=8, outcome="win")
        # 1 win / 8 rounds = 12.5 %
        data = self._get()
        self.assertIn("low_win_rate", self._all_types(data))

    def test_low_win_rate_suppressed_at_30_percent(self):
        """Exactly 30 % (3/10) — threshold not crossed."""
        for i in range(7):
            self._round(days_ago=i + 1, outcome="loss")
        for i in range(3):
            self._round(days_ago=i + 8, outcome="win")
        data = self._get()
        self.assertNotIn("low_win_rate", self._all_types(data))

    def test_high_win_rate_highlight_above_70_percent(self):
        """Win rate > 70 % → high_win_rate highlight."""
        for i in range(8):
            self._round(days_ago=i + 1, outcome="win")
        self._round(days_ago=9, outcome="loss")
        # 8 wins / 9 rounds = 88.9 %
        data = self._get()
        self.assertIn("high_win_rate", self._all_types(data))

    def test_win_rate_requires_at_least_3_rounds(self):
        """Win rate insight suppressed when < 3 recent rounds."""
        self._round(days_ago=1, outcome="loss")
        self._round(days_ago=2, outcome="loss")
        data = self._get()
        self.assertNotIn("low_win_rate", self._all_types(data))

    def test_rounds_older_than_60_days_excluded(self):
        """Rounds outside the 60-day window must not affect win rate."""
        # Only old losses — they should not trigger low_win_rate
        for d in range(61, 120):
            self._round(days_ago=d, outcome="loss")
        data = self._get()
        self.assertNotIn("low_win_rate", self._all_types(data))


# ── Submission concession insights ────────────────────────────────────────────

class SubmissionConcessionTests(InsightTestCase):

    def test_submission_concession_insight_fires(self):
        """Conceding the same sub in 2+ rounds surfaces a concession insight."""
        self._round(subs_conceded=["armbar"])
        self._round(subs_conceded=["armbar"])
        data = self._get()
        types = self._all_types(data)
        self.assertTrue(
            "submission_concession" in types,
            "Expected submission_concession insight"
        )

    def test_submission_concession_warning_at_high_rate(self):
        """≥ 40 % concession rate → warning severity (not just insight)."""
        # 3 armbar concessions out of 5 rounds = 60 %
        for _ in range(3):
            self._round(subs_conceded=["armbar"])
        for _ in range(2):
            self._round(subs_conceded=[])
        data = self._get()
        warning_types = {i["type"] for i in data["warnings"]}
        self.assertIn("submission_concession", warning_types)

    def test_single_concession_does_not_fire(self):
        """A submission conceded only once is not highlighted."""
        self._round(subs_conceded=["armbar"])
        data = self._get()
        # Might fire for other reasons — check armbar specifically not in titles
        concession_insights = [
            i for group in ("insights", "warnings")
            for i in data[group]
            if i["type"] == "submission_concession" and "armbar" in i["title"].lower()
        ]
        self.assertEqual(len(concession_insights), 0)

    def test_normalization_treats_case_and_punctuation_variations_as_same(self):
        """'Triangle Choke' and 'triangle choke' normalize to the same key."""
        self._round(subs_conceded=["Triangle Choke"])
        self._round(subs_conceded=["triangle choke"])
        data = self._get()
        self.assertIn("submission_concession", self._all_types(data))


# ── Submission weapon insights ────────────────────────────────────────────────

class SubmissionWeaponTests(InsightTestCase):

    def test_weapon_highlight_fires_at_high_win_rate(self):
        """Attempting the same sub 2+ times with ≥ 65 % win rate → highlight."""
        for _ in range(3):
            self._round(outcome="win", subs_attempted=["triangle"])
        self._round(outcome="loss", subs_attempted=["triangle"])
        # 3 wins / 4 attempts = 75 %
        data = self._get()
        self.assertIn("submission_weapon", self._all_types(data))

    def test_developing_weapon_insight_at_mid_win_rate(self):
        """45–64 % win rate → submission_potential insight."""
        self._round(outcome="win", subs_attempted=["kimura"])
        self._round(outcome="win", subs_attempted=["kimura"])
        self._round(outcome="loss", subs_attempted=["kimura"])
        self._round(outcome="loss", subs_attempted=["kimura"])
        # 50 % → potential
        data = self._get()
        self.assertIn("submission_potential", self._all_types(data))

    def test_overuse_insight_fires_when_not_converting(self):
        """3+ attempts with < 30 % win rate → submission_overuse insight."""
        self._round(outcome="loss", subs_attempted=["guillotine"])
        self._round(outcome="loss", subs_attempted=["guillotine"])
        self._round(outcome="loss", subs_attempted=["guillotine"])
        self._round(outcome="loss", subs_attempted=["guillotine"])
        # 0 / 4 = 0 %
        data = self._get()
        self.assertIn("submission_overuse", self._all_types(data))

    def test_weapon_requires_at_least_2_attempts(self):
        """A submission tried only once never fires a weapon insight."""
        self._round(outcome="win", subs_attempted=["ankle_lock"])
        data = self._get()
        self.assertNotIn("submission_weapon", self._all_types(data))


# ── Positional insights ───────────────────────────────────────────────────────

class PositionalTests(InsightTestCase):

    def test_position_weakness_fires_above_35_percent(self):
        """Position conceded in > 35 % of rounds → position_weakness insight."""
        # 4 mounts conceded out of 5 rounds = 80 %
        for _ in range(4):
            self._round(positions_conceded=["mount"])
        self._round(positions_conceded=[])
        data = self._get()
        self.assertIn("position_weakness", self._all_types(data))

    def test_position_weakness_requires_at_least_3_rounds(self):
        """Below 3 rounds → positional weakness suppressed."""
        self._round(positions_conceded=["mount"])
        self._round(positions_conceded=["mount"])
        data = self._get()
        self.assertNotIn("position_weakness", self._all_types(data))

    def test_strongest_position_highlight(self):
        """Controlling a position in 2+ rounds with ≥ 65 % win rate → highlight."""
        self._round(outcome="win", dominant_positions=["back"])
        self._round(outcome="win", dominant_positions=["back"])
        self._round(outcome="loss", dominant_positions=["back"])
        # 2/3 = 67 % — above threshold, needs 4 analysis rounds minimum
        self._round(outcome="win", dominant_positions=[])
        data = self._get()
        self.assertIn("position_win_rate", self._all_types(data))


# ── Technique gap insight ─────────────────────────────────────────────────────

class TechniqueGapTests(InsightTestCase):

    def test_technique_gap_fires_below_3_techniques(self):
        """< 3 active techniques → technique_gap insight."""
        data = self._get()
        self.assertIn("technique_gap", self._all_types(data))

    def test_technique_gap_suppressed_at_3_techniques(self):
        """Exactly 3 techniques clears the gap insight."""
        from techniques.models import Technique
        for i in range(3):
            Technique.objects.create(
                user=self.user,
                name=f"Technique {i}",
                position="mount",
                technique_type="submission",
                is_active=True,
            )
        data = self._get()
        self.assertNotIn("technique_gap", self._all_types(data))

    def test_technique_gap_ignores_inactive_techniques(self):
        """Inactive techniques don't count toward the gap threshold."""
        from techniques.models import Technique
        for i in range(5):
            Technique.objects.create(
                user=self.user,
                name=f"Old Technique {i}",
                position="mount",
                technique_type="submission",
                is_active=False,
            )
        data = self._get()
        self.assertIn("technique_gap", self._all_types(data))


# ── Planning insight ──────────────────────────────────────────────────────────

class PlanningTests(InsightTestCase):

    def test_no_plan_insight_fires_when_no_recent_plan(self):
        """No weekly plan in the last 7 days → no_plan insight."""
        data = self._get()
        self.assertIn("no_plan", self._all_types(data))

    def test_no_plan_suppressed_when_recent_plan_exists(self):
        """A weekly plan created this week clears the no_plan insight."""
        from planning.models import WeeklyPlan
        WeeklyPlan.objects.create(
            user=self.user,
            week_start=_today(days=0),
            title="Test week",
        )
        data = self._get()
        self.assertNotIn("no_plan", self._all_types(data))

    def test_plan_older_than_7_days_does_not_suppress_insight(self):
        """A plan from 8+ days ago is stale — no_plan fires again."""
        from planning.models import WeeklyPlan
        WeeklyPlan.objects.create(
            user=self.user,
            week_start=_today(days=8),
            title="Old week",
        )
        data = self._get()
        self.assertIn("no_plan", self._all_types(data))


# ── Peer belt filtering ───────────────────────────────────────────────────────

class PeerBeltFilteringTests(InsightTestCase):
    """Verify that peer-belt filtering works: when enough peer rounds exist,
    analysis should focus on equal/higher belt partners."""

    def test_peer_belt_rounds_used_when_sufficient(self):
        """With 4+ equal-belt rounds available, peer rounds are used for analysis.
        A submission pattern visible only in peer rounds should still surface."""
        # 4 blue-belt rounds (peers for our blue user), all conceding armbar
        for _ in range(4):
            self._round(belt="blue", subs_conceded=["armbar"])
        data = self._get()
        self.assertIn("submission_concession", self._all_types(data))

    def test_lower_belt_rounds_included_when_peers_insufficient(self):
        """With < 4 peer rounds, all rounds are used for analysis."""
        # 3 peer rounds + several white-belt concessions
        for _ in range(3):
            self._round(belt="blue")
        for _ in range(3):
            self._round(belt="white", subs_conceded=["armbar"])
        # armbar concession should show because we fall back to all rounds
        data = self._get()
        self.assertIn("submission_concession", self._all_types(data))


# ── Injury scenario (as reported by the user) ────────────────────────────────

class InjuryScenarioTests(InsightTestCase):
    """Simulate what the user actually experiences: injured, not training.
    The app should surface the right warnings without crashing."""

    def test_injured_user_with_no_recent_data(self):
        """Zero recent sessions, no rounds, no plan — only expected warnings."""
        data = self._get()
        types = self._all_types(data)
        # Must warn about inactivity and missing plan
        self.assertIn("inactivity", types)
        self.assertIn("no_plan", types)
        # Must NOT crash or raise unhandled assertions
        self.assertIn("insights", data)
        self.assertIn("warnings", data)
        self.assertIn("highlights", data)

    def test_returning_after_long_gap(self):
        """User logs one session after a 45-day gap — inactivity clears,
        low_frequency appears (1 session is still below 4-per-month target)."""
        # Old history
        for d in range(46, 90, 5):
            self._session(days_ago=d)
        # One comeback session
        self._session(days_ago=1)
        data = self._get()
        types = self._all_types(data)
        self.assertNotIn("inactivity", types)
        self.assertIn("low_frequency", types)

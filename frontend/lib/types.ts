// ---- Auth ----
export interface Gym {
  id: number
  name: string
  aliases: string
  member_count: number
}

export interface User {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  belt: Belt
  stripes: number
  gym: string
  gym_ref_id: number | null
  start_date: string | null
  bio: string
  is_premium: boolean
  avatar: string | null
  weight_class: string
  gender: string
  height_cm: number | null
  weight_kg: number | null
  display_belt: string
  is_public: boolean
  total_sessions: number
  total_rounds: number
  date_joined: string
}

export type Belt = 'white' | 'blue' | 'purple' | 'brown' | 'black'

// ---- Training Sessions ----
export type SessionType = 'gi' | 'nogi' | 'open_mat' | 'competition' | 'drilling' | 'wrestling' | 'fundamentals'

export type BlockType = 'warmup' | 'drilling' | 'technique' | 'sparring' | 'conditioning' | 'cool_down'

export interface SessionBlock {
  id: string
  block_type: BlockType
  duration_minutes: number
}

export interface SessionTemplate {
  id: number
  title: string
  session_type: SessionType
  session_type_display: string
  duration: number
  notes: string
  instructor: string
  gym_location: string
  techniques: TechniqueMinimal[]
  created_at: string
  updated_at: string
}

export interface TrainingSession {
  id: number
  date: string
  session_type: SessionType
  session_type_display: string
  duration: number
  title: string
  notes: string
  performance_rating: number | null
  energy_level: number | null
  techniques_worked: TechniqueMinimal[]
  instructor: string
  gym_location: string
  round_count: number
  technique_count?: number
  session_blocks?: SessionBlock[]
  created_at: string
  updated_at: string
}

// ---- Techniques ----
export type Position =
  | 'closed_guard' | 'half_guard' | 'open_guard' | 'de_la_riva'
  | 'spider_guard' | 'lasso_guard' | 'x_guard' | 'butterfly'
  | 'mount' | 'back' | 'side_control' | 'turtle' | 'standing'
  | 'north_south' | 'knee_on_belly' | 'leg_entanglement' | 'other'

export type TechniqueType =
  | 'submission' | 'sweep' | 'pass' | 'takedown' | 'escape'
  | 'guard_retention' | 'transition' | 'control' | 'setup' | 'counter'

export interface Technique {
  id: number
  name: string
  position: Position
  position_display: string
  technique_type: TechniqueType
  type_display: string
  description: string
  notes: string
  difficulty: number
  video_url: string
  tags: string[]
  is_active: boolean
  times_drilled: number
  coach_assigned_by_username: string | null
  coach_assignment_pending: boolean
  created_at: string
  updated_at: string
}

export interface TechniqueMinimal {
  id: number
  name: string
  position: Position
  technique_type: TechniqueType
}

export interface ChainEntry {
  id: number
  technique: TechniqueMinimal
  order: number
  notes: string
}

export interface TechniqueChain {
  id: number
  name: string
  description: string
  entries: ChainEntry[]
  technique_count: number
  created_at: string
  updated_at: string
}

// ---- Sparring ----
export type Outcome = 'win' | 'loss' | 'draw'
export type PartnerBelt = 'white' | 'blue' | 'purple' | 'brown' | 'black' | 'unknown'

// ---- Coaching ----
export interface CoachRelationship {
  id: number
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  coach_username: string
  coach_avatar: string | null
  coach_belt: Belt
  student_username: string
  student_avatar: string | null
  student_belt: Belt
  student_id: number
}

export interface StudentSummary {
  id: number
  username: string
  belt: Belt
  stripes: number
  avatar: string | null
  gym: string
  display_belt: string
  total_sessions: number
  total_techniques: number
  last_session: string | null
  pending_techniques: number
}

export interface CoachDrill {
  name: string
  reps: number
}

export interface CoachDrillingPlan {
  id: number
  coach_username: string
  week_start: string
  title: string
  notes: string
  drills: CoachDrill[]
  drill_completions: Record<string, boolean>
  student_feedback: string
  created_at: string
  updated_at: string
}

export interface CoachSessionNote {
  id: number
  coach_username: string
  session: number
  note: string
  created_at: string
  updated_at: string
}

export interface SparringRound {
  id: number
  session: number | null
  session_date: string | null
  date: string
  partner_name: string
  partner_username: string
  partner_belt: PartnerBelt
  partner_belt_display: string
  duration_minutes: number
  outcome: Outcome
  outcome_display: string
  is_gi: boolean
  dominant_positions: string[]
  positions_conceded: string[]
  submissions_attempted: string[]
  submissions_hit: string[]
  submissions_conceded: string[]
  sweeps_completed: number
  takedowns_completed: number
  notes: string
  created_at: string
  updated_at: string
}

// ---- Planning ----
export interface DrillItem {
  technique_id: number
  technique_name: string
  reps: number
}

export interface WeeklyPlanTemplate {
  id: number
  title: string
  plan_title: string
  goals: string
  sessions_planned: number
  focus_techniques: TechniqueMinimal[]
  drill_mode: 'weekly' | 'daily'
  weekly_drills: DrillItem[]
  created_at: string
  updated_at: string
}

export interface ChecklistItem {
  id: string
  technique_id: number | null
  text: string
  sets?: number
  reps?: number
  completed: boolean
}

export interface SessionChecklist {
  id: number
  plan: number
  title: string
  date: string
  items: ChecklistItem[]
  created_at: string
  updated_at: string
}

export interface WeeklyPlan {
  id: number
  week_start: string
  week_end: string
  title: string
  goals: string
  focus_techniques: TechniqueMinimal[]
  notes: string
  sessions_planned: number
  drill_mode: 'weekly' | 'daily'
  weekly_drills: DrillItem[]
  checklists: SessionChecklist[]
  created_at: string
  updated_at: string
}

// ---- Competition ----
export type CompetitionResult = 'gold' | 'silver' | 'bronze' | 'participated' | 'withdrew'
export type MatchResult = 'win' | 'loss'
export type MatchMethod = 'submission' | 'points' | 'advantages' | 'penalty' | 'referee' | 'dq' | 'walkover'

export interface CompetitionMatch {
  id: number
  competition: number
  round_number: number
  round_label: string
  opponent_name: string
  opponent_gym: string
  result: MatchResult
  result_display: string
  method: MatchMethod
  method_display: string
  duration_seconds: number | null
  submission_type: string
  my_points: number
  opponent_points: number
  notes: string
  created_at: string
}

export interface GamePlan {
  id: number
  competition: number | null
  title: string
  primary_techniques: TechniqueMinimal[]
  backup_techniques: TechniqueMinimal[]
  goals: string
  strengths_to_use: string
  weaknesses_to_hide: string
  notes: string
  created_at: string
  updated_at: string
}

export interface Competition {
  id: number
  name: string
  date: string
  location: string
  organization: string
  weight_class: string
  belt_division: string
  is_gi: boolean
  result: CompetitionResult | ''
  result_display: string
  notes: string
  matches: CompetitionMatch[]
  game_plans: GamePlan[]
  win_count: number
  loss_count: number
  created_at: string
  updated_at: string
}

// ---- Injuries ----
export type InjurySeverity = 'mild' | 'moderate' | 'severe'
export type InjuryStatus = 'active' | 'recovering' | 'resolved'

export interface InjuryLog {
  id: number
  body_part: string
  body_part_display: string
  custom_body_part: string
  severity: InjurySeverity
  severity_display: string
  status: InjuryStatus
  status_display: string
  date_occurred: string
  date_resolved: string | null
  affected_training: boolean
  notes: string
  created_at: string
  updated_at: string
}

// ---- Analytics ----
export interface AnalyticsOverview {
  period: string
  total_sessions: number
  total_hours: number
  total_rounds: number
  wins: number
  losses: number
  draws: number
  win_rate: number
  avg_sessions_per_week: number
  avg_performance: number | null
  techniques_in_db: number
  competitions: number
}

export interface TrainingTrend {
  week: string
  sessions: number
  hours: number
  avg_performance: number | null
}

export interface Insight {
  type: string
  title: string
  detail: string
  action?: string
  severity?: 'high' | 'medium' | 'low'
}

export interface InsightsData {
  insights: Insight[]
  warnings: Insight[]
  highlights: Insight[]
}

// ---- Social ----
export interface PublicUser {
  id: number
  username: string
  belt: Belt
  stripes: number
  display_belt: string
  gym: string
  bio: string
  avatar: string | null
  total_sessions: number
  total_rounds: number
  win_rate: number | null
}

export interface DojoMember {
  id: number
  username: string
  belt: Belt
  stripes: number
  display_belt: string
  avatar: string | null
  sessions_week: number
  hours_month: number
  streak: number
  win_rate: number | null
  is_me: boolean
}

export interface DojoRoom {
  gym: string
  members: DojoMember[]
}

export interface RivalUser {
  id: number
  username: string
  belt: Belt
  stripes: number
  display_belt: string
  avatar: string | null
}

export interface Rival {
  user: RivalUser
  wins: number
  losses: number
  draws: number
  total: number
  win_rate: number | null
}

export type ChallengeType = 'sessions' | 'hours' | 'win_rate'
export type ChallengeStatus = 'pending' | 'active' | 'completed' | 'declined'

export interface ChallengeUser {
  id: number
  username: string
  belt: Belt
  stripes: number
  display_belt: string
  avatar: string | null
}

export interface ChallengeData {
  id: number
  challenge_type: ChallengeType
  challenge_type_display: string
  unit: string
  duration_days: number
  message: string
  status: ChallengeStatus
  is_challenger: boolean
  opponent: ChallengeUser
  challenger: ChallengeUser
  challenged: ChallengeUser
  created_at: string
  // active / completed fields
  my_value?: number | null
  their_value?: number | null
  ends_at?: string
  days_left?: number
  leading?: boolean
  winner?: ChallengeUser | null
  won?: boolean | null
}

export interface MyChallenges {
  pending_received: ChallengeData[]
  pending_sent: ChallengeData[]
  active: ChallengeData[]
  completed: ChallengeData[]
}

// ---- Mat Wall posts ----
export interface MatPost {
  id: number
  caption: string
  image: string | null
  tags: string[]
  created_at: string
}

// ---- Weight tracking ----
export interface WeightEntry {
  id: number
  weight_kg: number
  date: string
  notes: string
  created_at: string
}

// ---- Pagination ----
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

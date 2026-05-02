export interface TitleDef {
  slug: string
  name: string
  description: string
}

export const ALL_TITLES: TitleDef[] = [
  { slug: 'fresh_white_belt', name: 'Fresh White Belt', description: 'Default title unlocked upon creating an account' },
  { slug: 'mat_newcomer', name: 'Mat Newcomer', description: 'Default title unlocked upon first login' },
  { slug: 'tap_snapper', name: 'Tap Snapper', description: 'Log your first training session' },
  { slug: 'grip_reaper', name: 'Grip Reaper', description: 'Log 50 total hours of training' },
  { slug: 'mat_rat', name: 'Mat Rat', description: 'Log sessions on 15 consecutive days' },
  { slug: 'tap_machine', name: 'Tap Machine', description: 'Record 25 submissions in your logs' },
  { slug: 'choke_artist', name: 'Choke Artist', description: 'Log 12 finishes via choke techniques' },
  { slug: 'joint_venture', name: 'Joint Venture', description: 'Log 12 joint lock submissions' },
  { slug: 'breakfall_beginner', name: 'Breakfall Beginner', description: 'Record 50 total takedowns or falls' },
  { slug: 'guard_whisperer', name: 'Guard Whisperer', description: 'Log 100 successful guard plays' },
  { slug: 'sweep_dreams', name: 'Sweep Dreams', description: 'Record 35 sweeps in sessions' },
  { slug: 'scramble_gambler', name: 'Scramble Gambler', description: 'Log 50 total sparring rounds' },
  { slug: 'coachs_pet', name: "Coach's Pet", description: 'Receive 25 pieces of coach feedback' },
  { slug: 'feedback_fiend', name: 'Feedback Fiend', description: 'Receive feedback across 10 different sessions' },
  { slug: 'injury_time', name: 'Injury Time', description: 'Log 3 separate injury recoveries' },
  { slug: 'iron_neck', name: 'Iron Neck', description: 'Return from injury and log 10 sessions post-recovery' },
  { slug: 'comp_curious', name: 'Comp Curious', description: 'Log 5 competitions' },
  { slug: 'podium_predator', name: 'Podium Predator', description: 'Record 2 medal finishes in competitions' },
  { slug: 'white_belt_wizard', name: 'White Belt Wizard', description: 'Log 50 techniques' },
  { slug: 'blue_belt_blues', name: 'Blue Belt Blues', description: 'Log 100 hours of training at blue belt or above' },
  { slug: 'technique_collector', name: 'Technique Collector', description: 'Log 75 unique techniques' },
  { slug: 'drill_sergeant', name: 'Drill Sergeant', description: 'Log 25 drilling-focused sessions' },
  { slug: 'flow_state', name: 'Flow State', description: 'Log 12 open mat sessions' },
  { slug: 'submission_scholar', name: 'Submission Scholar', description: 'Log entries from 25 different submission types' },
  { slug: 'escape_artist', name: 'Escape Artist', description: 'Win 50 rounds after conceding a position' },
  { slug: 'backpack_bandit', name: 'Backpack Bandit', description: 'Log 15 back takes' },
  { slug: 'mount_explorer', name: 'Mount Explorer', description: 'Hold mount across 25 rounds' },
  { slug: 'half_guard_hero', name: 'Half Guard Hero', description: 'Log 50 half guard entries' },
  { slug: 'no_gi_ninja', name: 'No-Gi Ninja', description: 'Log 25 no-gi sessions' },
  { slug: 'gi_joe', name: 'Gi Joe', description: 'Log 25 gi sessions' },
  { slug: 'consistency_king', name: 'Consistency King', description: 'Train at least 3 times per week for 4 consecutive weeks' },
  { slug: 'rolling_thunder', name: 'Rolling Thunder', description: 'Log 100 rounds of sparring' },
]

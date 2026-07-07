-- Account-level home for one-time CTA/nudge dismissal flags that previously
-- lived only in localStorage (snooze tooltip, life-event nudge, trickle
-- rotation, weekly check-in nudge). Without this, signing in from a new
-- browser replayed every dismissed prompt at once since each device tracked
-- its own copy.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ui_state JSONB NOT NULL DEFAULT '{}'::jsonb;

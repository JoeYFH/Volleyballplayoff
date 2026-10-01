-- ========================================
-- Volleyball Pickup Sign-up — Supabase Schema
-- 在 Supabase Dashboard > SQL Editor 執行此檔案
-- ========================================

-- 1. Sessions 場次表
CREATE TABLE IF NOT EXISTS sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text,
  date text NOT NULL,
  time text,
  location text,
  venue text,
  type text DEFAULT '',          -- '', 'mixed', 'male', 'female'
  limit_total integer DEFAULT 0,
  male_limit integer DEFAULT 0,
  female_limit integer DEFAULT 0,
  equipment text[] DEFAULT '{}',
  note text,
  is_open boolean DEFAULT true,
  is_private boolean DEFAULT false,
  cancelled boolean DEFAULT false,
  open_at timestamptz,
  close_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  creator_name text,
  creator_photo text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Signups 報名表
CREATE TABLE IF NOT EXISTS signups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  uid uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  is_late boolean DEFAULT false,
  late_minutes integer,
  is_friend boolean DEFAULT false,
  friend_name text,
  pair text,
  bring_equip text[] DEFAULT '{}',
  gender text DEFAULT '',         -- 'male', 'female', ''
  friend_gender text DEFAULT '',
  force_confirmed boolean DEFAULT false,
  force_waitlisted boolean DEFAULT false,
  signed_at timestamptz DEFAULT now()
);

-- 3. Templates 範本表
CREATE TABLE IF NOT EXISTS templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- 4. Feedback 意見回饋表
CREATE TABLE IF NOT EXISTS feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text,
  type text,
  urgency text,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ========================================
-- RLS 安全規則
-- ========================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Sessions: 所有人可讀，登入者可建立，建立者/管理員可修改
CREATE POLICY "sessions_select" ON sessions FOR SELECT USING (true);
CREATE POLICY "sessions_insert" ON sessions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "sessions_update" ON sessions FOR UPDATE USING (
  auth.uid() = created_by
  OR auth.email() IN ('abc8038570@gmail.com', 'joehuangyf@gmail.com')
);
CREATE POLICY "sessions_delete" ON sessions FOR DELETE USING (
  auth.uid() = created_by
  OR auth.email() IN ('abc8038570@gmail.com', 'joehuangyf@gmail.com')
);

-- Signups: 所有人可讀，登入者可建立，本人可修改/刪除
CREATE POLICY "signups_select" ON signups FOR SELECT USING (true);
CREATE POLICY "signups_insert" ON signups FOR INSERT WITH CHECK (true);
CREATE POLICY "signups_update" ON signups FOR UPDATE USING (
  auth.uid() = uid
  OR auth.uid() IN (SELECT created_by FROM sessions WHERE id = session_id)
  OR auth.email() IN ('abc8038570@gmail.com', 'joehuangyf@gmail.com')
);
CREATE POLICY "signups_delete" ON signups FOR DELETE USING (
  auth.uid() = uid
  OR auth.uid() IN (SELECT created_by FROM sessions WHERE id = session_id)
  OR auth.email() IN ('abc8038570@gmail.com', 'joehuangyf@gmail.com')
);

-- Templates: 只有本人能操作
CREATE POLICY "templates_all" ON templates USING (auth.uid() = user_id);

-- Feedback: 所有人可新增，管理員可讀取
CREATE POLICY "feedback_insert" ON feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "feedback_select_admin" ON feedback FOR SELECT USING (
  auth.email() IN ('abc8038570@gmail.com', 'joehuangyf@gmail.com')
);

-- ========================================
-- 啟用 Realtime 訂閱
-- ========================================
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE signups;

-- UPDATE 事件需要 REPLICA IDENTITY FULL 才能通過 filter 正確觸發
ALTER TABLE sessions REPLICA IDENTITY FULL;
ALTER TABLE signups REPLICA IDENTITY FULL;

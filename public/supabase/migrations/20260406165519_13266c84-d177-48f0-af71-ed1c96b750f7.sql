-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can read own roles" ON public.user_roles
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all roles" ON public.user_roles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Eco Reports table
CREATE TABLE public.eco_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  description TEXT NOT NULL,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_name TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  points_awarded INTEGER DEFAULT 0,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.eco_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own reports" ON public.eco_reports
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and admins can read reports" ON public.eco_reports
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports" ON public.eco_reports
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Plant Challenges table
CREATE TABLE public.plant_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plant_name TEXT NOT NULL,
  plant_type TEXT NOT NULL,
  eco_impact_level TEXT NOT NULL DEFAULT 'medium',
  target_days INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'active',
  points_per_update INTEGER NOT NULL DEFAULT 15,
  total_points_earned INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plant_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own plant challenges" ON public.plant_challenges
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and admins can read plant challenges" ON public.plant_challenges
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users and admins can update plant challenges" ON public.plant_challenges
FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Plant Updates table (weekly)
CREATE TABLE public.plant_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.plant_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  image_url TEXT,
  video_url TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  points_awarded INTEGER DEFAULT 0,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plant_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own plant updates" ON public.plant_updates
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and admins can read plant updates" ON public.plant_updates
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update plant updates" ON public.plant_updates
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Badges table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  required_count INTEGER NOT NULL DEFAULT 1,
  points_reward INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read badges" ON public.badges
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can insert badges" ON public.badges
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update badges" ON public.badges
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete badges" ON public.badges
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- User Badges table
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own badges" ON public.user_badges
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can claim badges" ON public.user_badges
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all user badges" ON public.user_badges
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add verification fields to scan_history
ALTER TABLE public.scan_history ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.scan_history ADD COLUMN admin_notes TEXT;
ALTER TABLE public.scan_history ADD COLUMN verified_at TIMESTAMPTZ;
ALTER TABLE public.scan_history ADD COLUMN verified_by UUID;

-- Update handle_new_user to also assign user role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'EcoUser'));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;

-- Insert default badges
INSERT INTO public.badges (name, description, icon, category, required_count, points_reward) VALUES
('First Scan', 'Complete your first waste scan', '📸', 'scanning', 1, 50),
('Scan Master', 'Complete 25 waste scans', '🔍', 'scanning', 25, 200),
('Scan Legend', 'Complete 100 waste scans', '⭐', 'scanning', 100, 500),
('Eco Disposer', 'Get 5 disposals verified by admin', '✅', 'disposal', 5, 150),
('Disposal Pro', 'Get 25 disposals verified', '🏅', 'disposal', 25, 400),
('First Report', 'Submit your first eco-report', '📋', 'reporting', 1, 75),
('Reporter', 'Submit 10 eco-reports', '📰', 'reporting', 10, 300),
('Green Thumb', 'Complete your first plant challenge', '🌱', 'planting', 1, 100),
('Plant Parent', 'Complete 5 plant challenges', '🌳', 'planting', 5, 350),
('Week Warrior', 'Maintain a 7-day streak', '🔥', 'streak', 7, 150),
('Month Champion', 'Maintain a 30-day streak', '💪', 'streak', 30, 500);

-- Allow admins to read all scan_history
CREATE POLICY "Admins can read all scans"
ON public.scan_history
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update all scan_history
CREATE POLICY "Admins can update all scans"
ON public.scan_history
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all profiles
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update all profiles (for awarding points)
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add streak tracking columns to profiles
ALTER TABLE public.profiles
ADD COLUMN current_streak_day integer NOT NULL DEFAULT 0,
ADD COLUMN last_streak_claim date,
ADD COLUMN streak_points_earned integer NOT NULL DEFAULT 0;

-- Waitlist signup for the welcome page (join_waitlist RPC).

CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT waitlist_email_unique UNIQUE (email)
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.waitlist FROM anon;
REVOKE ALL ON TABLE public.waitlist FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.join_waitlist(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.waitlist (email)
  VALUES (lower(trim(p_email)))
  ON CONFLICT (email) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.join_waitlist(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_waitlist(text) TO anon;
GRANT EXECUTE ON FUNCTION public.join_waitlist(text) TO authenticated;

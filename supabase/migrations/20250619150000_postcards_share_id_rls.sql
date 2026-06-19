-- Postcards: public access via short_code (no direct table access for anon).

ALTER TABLE public.postcards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.postcards;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.postcards;
DROP POLICY IF EXISTS "Allow public read" ON public.postcards;
DROP POLICY IF EXISTS "Allow public insert" ON public.postcards;
DROP POLICY IF EXISTS "anon_select_postcards" ON public.postcards;
DROP POLICY IF EXISTS "anon_insert_postcards" ON public.postcards;
DROP POLICY IF EXISTS "anon_select_by_share_id" ON public.postcards;

CREATE OR REPLACE FUNCTION public.create_postcard(p_content jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_short_code text;
BEGIN
  INSERT INTO public.postcards (content)
  VALUES (p_content)
  RETURNING short_code INTO v_short_code;
  RETURN v_short_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_postcard_by_share_id(p_short_code text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT content
  FROM public.postcards
  WHERE short_code = p_short_code
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.create_postcard(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_postcard_by_share_id(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_postcard(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.get_postcard_by_share_id(text) TO anon;
GRANT EXECUTE ON FUNCTION public.create_postcard(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_postcard_by_share_id(text) TO authenticated;

REVOKE ALL ON TABLE public.postcards FROM anon;
REVOKE ALL ON TABLE public.postcards FROM PUBLIC;

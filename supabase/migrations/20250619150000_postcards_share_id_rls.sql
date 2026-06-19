-- Postcards: public access only via share_id (no table enumeration for anon).

ALTER TABLE public.postcards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.postcards;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.postcards;
DROP POLICY IF EXISTS "Allow public read" ON public.postcards;
DROP POLICY IF EXISTS "Allow public insert" ON public.postcards;
DROP POLICY IF EXISTS "anon_select_postcards" ON public.postcards;
DROP POLICY IF EXISTS "anon_insert_postcards" ON public.postcards;
DROP POLICY IF EXISTS "anon_select_by_share_id" ON public.postcards;

CREATE OR REPLACE FUNCTION public.create_postcard(p_content jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share_id uuid;
BEGIN
  INSERT INTO public.postcards (content)
  VALUES (p_content)
  RETURNING share_id INTO v_share_id;
  RETURN v_share_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_postcard_by_share_id(p_share_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT content
  FROM public.postcards
  WHERE share_id = p_share_id
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.create_postcard(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_postcard_by_share_id(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_postcard(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.get_postcard_by_share_id(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.create_postcard(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_postcard_by_share_id(uuid) TO authenticated;

REVOKE ALL ON TABLE public.postcards FROM anon;
REVOKE ALL ON TABLE public.postcards FROM PUBLIC;

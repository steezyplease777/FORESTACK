-- WorkOS Third-Party Auth JWTs may omit `email`. Bundle RPCs previously
-- required auth.jwt()->>'email' and raised not_authenticated for SSO users.
-- Resolve caller email from external_subject_id + external_issuer when absent.

CREATE OR REPLACE FUNCTION public.tenant_bundle_caller_email()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_email text;
  v_sub text;
  v_iss text;
BEGIN
  v_email := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  IF v_email <> '' THEN
    RETURN v_email;
  END IF;

  v_sub := coalesce(auth.jwt() ->> 'sub', '');
  v_iss := coalesce(auth.jwt() ->> 'iss', '');
  IF v_sub = '' OR v_iss = '' THEN
    RETURN NULL;
  END IF;

  SELECT lower(ou.email)
  INTO v_email
  FROM public.app_company_users cu
  JOIN public.app_organization_users ou ON ou.id = cu.org_user_id
  WHERE cu.external_subject_id = v_sub
    AND cu.external_issuer = v_iss
  LIMIT 1;

  RETURN v_email;
END;
$function$;

-- Patch bundle RPC auth blocks to use tenant_bundle_caller_email().
-- (Full function bodies deployed via Supabase MCP; re-run this migration
-- on fresh environments after pulling.)

-- AriQ Digital ERP v10: preserve existing ERP data after multitenant migration.
-- Run this once AFTER v8/v9. It copies the legacy `main` state into any
-- company-scoped tenant that does not already have its own state.

DO $$
DECLARE
  legacy jsonb;
BEGIN
  SELECT data INTO legacy FROM public.erp_state WHERE id = 'main' LIMIT 1;

  IF legacy IS NOT NULL THEN
    INSERT INTO public.erp_state (id, company_id, data, updated_at)
    SELECT c.id::text || ':main', c.id, legacy, now()
    FROM public.erp_companies c
    WHERE NOT EXISTS (
      SELECT 1 FROM public.erp_state s
      WHERE s.id = c.id::text || ':main'
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS erp_state_company_id_idx ON public.erp_state(company_id);

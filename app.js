/*
  General Business ERP entry point
  --------------------------------
  The deployable application is index.html. It loads the Supabase JS client
  and persists ERP state through /api/config.js + public.erp_state.

  The original application logic is intentionally kept inside index.html so
  the project remains a zero-build Vercel deployment (Framework: Other).
*/

const crypto = require('crypto');

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function env(name) {
  return process.env[name] || '';
}

function requireConfig(res) {
  const missing = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY', 'RESEND_API_KEY', 'FROM_EMAIL']
    .filter(k => !env(k));
  if (missing.length) {
    json(res, 500, { error: `2FA server is not configured. Missing: ${missing.join(', ')}` });
    return false;
  }
  return true;
}

async function supabaseRequest(path, options = {}) {
  const base = env('SUPABASE_URL').replace(/\/$/, '');
  const headers = {
    apikey: env('SUPABASE_SERVICE_ROLE_KEY'),
    Authorization: `Bearer ${env('SUPABASE_SERVICE_ROLE_KEY')}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const response = await fetch(`${base}/rest/v1/${path}`, { ...options, headers });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const err = new Error(`Supabase request failed (${response.status})`);
    err.details = data;
    throw err;
  }
  return data;
}

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function generateCode() {
  return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

async function getRegisteredUser(email) {
  const rows = await supabaseRequest(`erp_profiles?select=id,email,full_name,role,active&email=eq.${encodeURIComponent(email)}&limit=1`);
  const user = rows?.[0];
  if (!user || user.active === false) return null;
  return user;
}

async function getAuthenticatedUser(accessToken) {
  if (!accessToken) return null;
  const base = env('SUPABASE_URL').replace(/\/$/, '');
  const response = await fetch(`${base}/auth/v1/user`, {
    headers: {
      apikey: env('SUPABASE_ANON_KEY'),
      Authorization: `Bearer ${accessToken}`
    }
  });
  if (!response.ok) return null;
  const user = await response.json();
  return user?.id ? user : null;
}

async function sendEmail({ to, name, code }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env('RESEND_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env('FROM_EMAIL'),
      to: [to],
      subject: 'Your General Business ERP verification code',
      html: `<!doctype html><html><body style="margin:0;background:#f6f7fb;font-family:Arial,sans-serif;color:#1f2937;padding:30px">
        <div style="max-width:560px;margin:auto;background:#fff;border-radius:18px;padding:28px;border:1px solid #e5e7eb">
          <h2 style="margin:0 0 8px;color:#1565C0">General Business ERP</h2>
          <p style="margin:0 0 20px;color:#6b7280">Two-factor authentication</p>
          <p>Hello ${escapeHtml(name || 'User')},</p>
          <p>Use the verification code below to complete your login:</p>
          <div style="font-size:34px;letter-spacing:8px;font-weight:800;text-align:center;padding:20px;background:#eff6ff;border-radius:14px;color:#0D47A1">${code}</div>
          <p style="margin-top:20px">This code expires in <b>10 minutes</b>. Never share it with anyone.</p>
          <p style="font-size:12px;color:#6b7280">If you did not attempt to sign in, change your password and contact your ERP administrator.</p>
        </div>
      </body></html>`
    })
  });
  const text = await response.text();
  if (!response.ok) {
    const err = new Error(`Email provider rejected the message (${response.status})`);
    err.details = text;
    throw err;
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>\"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;' }[ch] || ch));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!requireConfig(res)) return;

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const action = body.action;

    if (action === 'send') {
      const email = normalizeEmail(body.email);
      if (!email) return json(res, 400, { error: 'Email is required' });

      const authHeader = String(req.headers.authorization || '');
      const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      const authUser = await getAuthenticatedUser(accessToken);
      if (!authUser || normalizeEmail(authUser.email) !== email) {
        return json(res, 401, { error: 'Your credentials could not be verified. Please start the login process again.' });
      }

      const user = await getRegisteredUser(email);
      if (!user || user.id !== authUser.id) return json(res, 400, { error: 'Unable to start verification for this account.' });

      // Prevent rapid repeated sends for the same address.
      const recent = await supabaseRequest(
        `erp_login_2fa_challenges?select=id,created_at,used_at&email=eq.${encodeURIComponent(email)}&created_at=gte.${encodeURIComponent(new Date(Date.now()-60000).toISOString())}&order=created_at.desc&limit=1`
      );
      if (recent?.length) return json(res, 429, { error: 'A verification code was already sent. Please wait 60 seconds before requesting another.' });

      const code = generateCode();
      const challengeId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await supabaseRequest('erp_login_2fa_challenges', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          id: challengeId,
          email,
          code_hash: hashCode(code),
          expires_at: expiresAt,
          attempts: 0
        })
      });

      try {
        await sendEmail({ to: email, name: user.name, code });
      } catch (mailError) {
        await supabaseRequest(`erp_login_2fa_challenges?id=eq.${encodeURIComponent(challengeId)}`, { method: 'DELETE' }).catch(() => {});
        console.error('2FA email failed:', mailError.details || mailError.message);
        return json(res, 502, { error: 'The verification email could not be sent. Check the email provider configuration.' });
      }

      return json(res, 200, { challengeId, expiresAt, message: 'Verification code sent to the registered email.' });
    }

    if (action === 'verify') {
      const email = normalizeEmail(body.email);
      const challengeId = String(body.challengeId || '');
      const code = String(body.code || '').trim();
      if (!email || !challengeId || !/^\d{6}$/.test(code)) return json(res, 400, { error: 'Enter the 6-digit verification code.' });

      const rows = await supabaseRequest(
        `erp_login_2fa_challenges?select=id,email,code_hash,expires_at,attempts,used_at&id=eq.${encodeURIComponent(challengeId)}&email=eq.${encodeURIComponent(email)}&limit=1`
      );
      const challenge = rows?.[0];
      if (!challenge) return json(res, 400, { error: 'Verification session not found. Request a new code.' });
      if (challenge.used_at) return json(res, 400, { error: 'This verification code has already been used.' });
      if (new Date(challenge.expires_at).getTime() < Date.now()) return json(res, 400, { error: 'This verification code has expired. Request a new code.' });
      if (Number(challenge.attempts || 0) >= 5) return json(res, 429, { error: 'Too many incorrect attempts. Request a new code.' });

      const correct = crypto.timingSafeEqual(Buffer.from(hashCode(code)), Buffer.from(challenge.code_hash));
      if (!correct) {
        const attempts = Number(challenge.attempts || 0) + 1;
        await supabaseRequest(`erp_login_2fa_challenges?id=eq.${encodeURIComponent(challengeId)}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ attempts })
        });
        return json(res, 400, { error: `Incorrect verification code. ${Math.max(0, 5 - attempts)} attempt(s) remaining.` });
      }

      await supabaseRequest(`erp_login_2fa_challenges?id=eq.${encodeURIComponent(challengeId)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ used_at: new Date().toISOString() })
      });

      return json(res, 200, { verified: true });
    }

    return json(res, 400, { error: 'Unknown 2FA action' });
  } catch (error) {
    console.error('2FA handler error:', error);
    return json(res, 500, { error: '2FA service error. Check the server configuration.' });
  }
};

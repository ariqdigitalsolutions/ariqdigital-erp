const crypto = require('crypto');

function env(name){ return process.env[name] || ''; }
function json(res,status,body){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json');
  res.setHeader('Cache-Control','no-store');
  res.end(JSON.stringify(body));
}
function requireConfig(res){
  const missing=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_ANON_KEY'].filter(k=>!env(k));
  if(missing.length){ json(res,500,{error:`User management is not configured. Missing: ${missing.join(', ')}`}); return false; }
  return true;
}
function base(){ return env('SUPABASE_URL').replace(/\/$/,''); }
async function adminRequest(path,options={}){
  const headers={
    apikey:env('SUPABASE_SERVICE_ROLE_KEY'),
    Authorization:`Bearer ${env('SUPABASE_SERVICE_ROLE_KEY')}`,
    'Content-Type':'application/json',
    ...(options.headers||{})
  };
  const r=await fetch(`${base()}${path}`,{...options,headers});
  const text=await r.text();
  let data=null; try{data=text?JSON.parse(text):null;}catch{data=text;}
  if(!r.ok){const e=new Error(`Supabase request failed (${r.status})`);e.details=data;throw e;}
  return data;
}
async function authenticatedUser(token){
  if(!token) return null;
  const r=await fetch(`${base()}/auth/v1/user`,{
    headers:{apikey:env('SUPABASE_ANON_KEY'),Authorization:`Bearer ${token}`}
  });
  if(!r.ok) return null;
  const u=await r.json();
  return u?.id?u:null;
}
async function profile(id){
  const rows=await adminRequest(`/rest/v1/erp_profiles?select=id,email,full_name,role,active&id=eq.${encodeURIComponent(id)}&limit=1`);
  return rows?.[0]||null;
}
async function requireAdmin(req,res){
  const h=String(req.headers.authorization||'');
  const token=h.startsWith('Bearer ')?h.slice(7).trim():'';
  const user=await authenticatedUser(token);
  if(!user) return null;
  const p=await profile(user.id);
  if(!p || p.active===false || p.role!=='Admin / Owner') return null;
  return {user,profile:p};
}
function validEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim()); }
function passwordOk(v){ return typeof v==='string' && v.length>=8; }
function cleanRole(v){
  const allowed=['Admin / Owner','Accountant','Supervisor','Cashier / Sales Clerk'];
  return allowed.includes(v)?v:null;
}
async function upsertProfile(id,email,fullName,roleName,active=true){
  return adminRequest(`/rest/v1/erp_profiles?on_conflict=id`,{
    method:'POST',
    headers:{Prefer:'resolution=merge-duplicates,return=representation'},
    body:JSON.stringify([{id,email:email.toLowerCase(),full_name:fullName||'',role:roleName,active}])
  });
}
module.exports=async function handler(req,res){
  if(req.method!=='POST') return json(res,405,{error:'Method not allowed'});
  if(!requireConfig(res)) return;
  try{
    const admin=await requireAdmin(req,res);
    if(!admin) return json(res,403,{error:'Administrator access required.'});
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const action=body.action;

    if(action==='list'){
      const profiles=await adminRequest('/rest/v1/erp_profiles?select=id,email,full_name,role,active,created_at,updated_at&order=created_at.desc');
      const authUsers=await adminRequest('/auth/v1/admin/users?per_page=1000&page=1');
      const byId=new Map((authUsers?.users||[]).map(u=>[u.id,u]));
      return json(res,200,{users:(profiles||[]).map(p=>({
        ...p,
        lastSignIn:byId.get(p.id)?.last_sign_in_at||null,
        emailConfirmed:!!byId.get(p.id)?.email_confirmed_at
      }))});
    }

    if(action==='create'){
      const email=String(body.email||'').trim().toLowerCase();
      const fullName=String(body.fullName||'').trim();
      const roleName=cleanRole(body.role);
      const password=String(body.password||'');
      if(!validEmail(email)) return json(res,400,{error:'Enter a valid email address.'});
      if(!fullName) return json(res,400,{error:'Full name is required.'});
      if(!roleName) return json(res,400,{error:'Select a valid role.'});
      if(!passwordOk(password)) return json(res,400,{error:'Password must be at least 8 characters.'});

      const created=await adminRequest('/auth/v1/admin/users',{
        method:'POST',
        body:JSON.stringify({
          email,password,email_confirm:true,
          user_metadata:{full_name:fullName},
          app_metadata:{erp_role:roleName}
        })
      });
      await upsertProfile(created.id,email,fullName,roleName,true);
      return json(res,200,{user:{id:created.id,email,full_name:fullName,role:roleName,active:true}});
    }

    if(action==='update'){
      const id=String(body.id||'');
      if(!id) return json(res,400,{error:'User ID is required.'});
      const target=await profile(id);
      if(!target) return json(res,404,{error:'User profile not found.'});
      const email=String(body.email??target.email).trim().toLowerCase();
      const fullName=String(body.fullName??target.full_name??'').trim();
      const roleName=cleanRole(body.role??target.role);
      if(!validEmail(email)) return json(res,400,{error:'Enter a valid email address.'});
      if(!fullName) return json(res,400,{error:'Full name is required.'});
      if(!roleName) return json(res,400,{error:'Select a valid role.'});

      const authPayload={email,user_metadata:{full_name:fullName},app_metadata:{erp_role:roleName}};
      if(body.password){
        if(!passwordOk(String(body.password))) return json(res,400,{error:'Password must be at least 8 characters.'});
        authPayload.password=String(body.password);
      }
      if(id===admin.user.id && roleName!=='Admin / Owner') return json(res,400,{error:'You cannot remove your own administrator role.'});
      await adminRequest(`/auth/v1/admin/users/${encodeURIComponent(id)}`,{method:'PUT',body:JSON.stringify(authPayload)});
      await upsertProfile(id,email,fullName,roleName,target.active!==false);
      return json(res,200,{success:true});
    }

    if(action==='setStatus'){
      const id=String(body.id||'');
      const active=body.active===true;
      if(!id) return json(res,400,{error:'User ID is required.'});
      if(id===admin.user.id && !active) return json(res,400,{error:'You cannot disable your own administrator account.'});
      const target=await profile(id);
      if(!target) return json(res,404,{error:'User profile not found.'});
      await adminRequest(`/auth/v1/admin/users/${encodeURIComponent(id)}`,{
        method:'PUT',
        body:JSON.stringify({ban_duration:active?'none':'876000h'})
      });
      await adminRequest(`/rest/v1/erp_profiles?id=eq.${encodeURIComponent(id)}`,{
        method:'PATCH',
        headers:{Prefer:'return=minimal'},
        body:JSON.stringify({active,updated_at:new Date().toISOString()})
      });
      return json(res,200,{success:true,active});
    }

    if(action==='resetPassword'){
      const id=String(body.id||'');
      const password=String(body.password||'');
      if(!id) return json(res,400,{error:'User ID is required.'});
      if(!passwordOk(password)) return json(res,400,{error:'Password must be at least 8 characters.'});
      const target=await profile(id);
      if(!target) return json(res,404,{error:'User profile not found.'});
      await adminRequest(`/auth/v1/admin/users/${encodeURIComponent(id)}`,{
        method:'PUT',
        body:JSON.stringify({password,email_confirm:true})
      });
      return json(res,200,{success:true});
    }

    return json(res,400,{error:'Unknown action.'});
  }catch(err){
    console.error(err);
    const details=err?.details?.msg||err?.details?.message||err?.message||'Unexpected error';
    return json(res,500,{error:details});
  }
};

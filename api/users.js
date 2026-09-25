const crypto = require('crypto');
function env(name){return process.env[name]||'';}
function json(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));}
function base(){return env('SUPABASE_URL').replace(/\/$/,'');}
async function adminRequest(path,options={}){const r=await fetch(`${base()}${path}`,{...options,headers:{apikey:env('SUPABASE_SERVICE_ROLE_KEY'),Authorization:`Bearer ${env('SUPABASE_SERVICE_ROLE_KEY')}`,'Content-Type':'application/json',...(options.headers||{})}});const text=await r.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text;}if(!r.ok){const detail=data&&typeof data==='object'?(data.message||data.msg||data.error_description||data.error||data.hint||''):'';const e=new Error(detail||`Supabase request failed (${r.status})`);e.status=r.status;e.details=data;throw e;}return data;}
async function authenticatedUser(token){if(!token)return null;const r=await fetch(`${base()}/auth/v1/user`,{headers:{apikey:env('SUPABASE_ANON_KEY'),Authorization:`Bearer ${token}`}});if(!r.ok)return null;const u=await r.json();return u?.id?u:null;}
async function profile(id){const rows=await adminRequest(`/rest/v1/erp_profiles?select=id,email,username,full_name,role,active,force_password_change,company_id&id=eq.${encodeURIComponent(id)}&limit=1`);return rows?.[0]||null;}
async function requireAdmin(req,res){const h=String(req.headers.authorization||'');const token=h.startsWith('Bearer ')?h.slice(7).trim():'';const user=await authenticatedUser(token);if(!user)return null;const p=await profile(user.id);if(!p||p.active===false||p.role!=='Admin / Owner')return null;return {user,profile:p};}
function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim());}
function passwordOk(v){return typeof v==='string'&&v.length>=8;}
function cleanRole(v){const allowed=['Admin / Owner','Accountant','Supervisor','Cashier / Sales Clerk'];return allowed.includes(v)?v:null;}
function cleanUsername(v){const s=String(v||'').trim(); if(!s) return null; if(/^[A-Za-z0-9._-]{3,40}$/.test(s)) return s; if(validEmail(s)) return s.toLowerCase(); return null;}
function usernameBaseFromName(name){
 const words=String(name||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(Boolean);
 if(!words.length) return 'user';
 if(words.length===1) return words[0].slice(0,40) || 'user';
 const initial=words[0].charAt(0);
 const surname=words[words.length-1];
 return `${initial}${surname}`.slice(0,40) || 'user';
}
async function generateUniqueUsername(fullName){
 const base=usernameBaseFromName(fullName);
 let candidate=base;
 for(let i=0;i<1000;i++){
  const rows=await adminRequest(`/rest/v1/erp_profiles?select=id&username=eq.${encodeURIComponent(candidate)}&limit=1`);
  if(!rows?.length) return candidate;
  const suffix=String(i+2);
  candidate=(base.slice(0,40-suffix.length)+suffix).slice(0,40);
 }
 throw new Error('Could not generate a unique username. Please try again.');
}
function tempPassword(){return crypto.randomBytes(9).toString('base64url')+'A1!';}
function esc(v){return String(v||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;','\\':'&#39;'}[c]));}
async function sendTempEmail({to,name,username,password}){
 if(!env('RESEND_API_KEY')||!env('FROM_EMAIL')) throw new Error('Email service is not configured. Add RESEND_API_KEY and FROM_EMAIL in Vercel.');
 const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env('RESEND_API_KEY')}`,'Content-Type':'application/json'},body:JSON.stringify({from:env('FROM_EMAIL'),to:[to],subject:'AriQ Digital ERP account',html:`<!doctype html><html><body style="font-family:Arial,sans-serif"><h2>AriQ Digital ERP</h2><p>Your account has been created or reset.</p><p><b>Username:</b> ${esc(username)}<br><b>Temporary password:</b> ${esc(password)}</p><p>Sign in and change the temporary password when prompted.</p></body></html>`})});
 if(!r.ok){const t=await r.text();throw new Error(`Email provider rejected the message (${r.status}): ${t}`);}
}
async function ensureCompany(admin){
 if(admin.profile.company_id)return admin.profile.company_id;
 const companyId=crypto.randomUUID();
 await adminRequest('/rest/v1/erp_companies',{method:'POST',body:JSON.stringify({id:companyId,company_name:'',created_by:admin.user.id})});
 await adminRequest(`/rest/v1/erp_profiles?id=eq.${encodeURIComponent(admin.user.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({company_id:companyId,updated_at:new Date().toISOString()})});
 return companyId;
}
async function upsertProfile(id,email,username,fullName,roleName,active=true,companyId=null,forcePasswordChange=false){return adminRequest(`/rest/v1/erp_profiles?on_conflict=id`,{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify([{id,email:email.toLowerCase(),username,full_name:fullName||'',role:roleName,active,company_id:companyId,force_password_change:forcePasswordChange,updated_at:new Date().toISOString()}])});}
module.exports=async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  const admin=await requireAdmin(req,res);if(!admin)return json(res,403,{error:'Administrator access required.'});
  const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});const action=body.action;const companyId=await ensureCompany(admin);
  if(action==='list'){const profiles=await adminRequest('/rest/v1/erp_profiles?select=id,email,username,full_name,role,active,force_password_change,created_at,updated_at&order=created_at.desc');const authUsers=await adminRequest('/auth/v1/admin/users?per_page=1000&page=1');const byId=new Map((authUsers?.users||[]).map(u=>[u.id,u]));return json(res,200,{users:(profiles||[]).filter(p=>p.company_id===companyId).map(p=>({...p,lastSignIn:byId.get(p.id)?.last_sign_in_at||null,emailConfirmed:!!byId.get(p.id)?.email_confirmed_at}))});}
  if(action==='create'){
   const email=String(body.email||'').trim().toLowerCase(),fullName=String(body.fullName||'').trim(),roleName=cleanRole(body.role);
   if(!validEmail(email))return json(res,400,{error:'Enter a valid email address.'});if(!fullName)return json(res,400,{error:'Full name is required.'});if(!roleName)return json(res,400,{error:'Select a valid role.'});
   const username=await generateUniqueUsername(fullName);
   const password=tempPassword();
   let created;
   try{
    created=await adminRequest('/auth/v1/admin/users',{method:'POST',body:JSON.stringify({email,password,email_confirm:true,user_metadata:{full_name:fullName},app_metadata:{erp_role:roleName}})});
   }catch(err){
    if(err.status===422 || err.status===409) return json(res,409,{error:err.message||'An account with this email may already exist. Use a different email address.'});
    throw err;
   }
   try{
    await upsertProfile(created.id,email,username,fullName,roleName,true,companyId,true);
   }catch(err){
    try{await adminRequest(`/auth/v1/admin/users/${encodeURIComponent(created.id)}`,{method:'DELETE'});}catch(cleanupError){console.error('Could not roll back Auth user:',cleanupError);}
    return json(res,422,{error:err.message||'The user account was created but its ERP profile could not be saved. Run the latest database migration and try again.'});
   }
   let emailSent=false;try{await sendTempEmail({to:email,name:fullName,username,password});emailSent=true;}catch(mailError){console.warn('Temporary password email was not sent:',mailError?.message||mailError);}
   return json(res,200,{user:{id:created.id,username,email,full_name:fullName,role:roleName,active:true},temporaryPassword:password,emailSent,message:emailSent?'User created. A temporary password was sent to the registered email.':'User created. The temporary password is ready to copy and share manually.'});
  }
  if(action==='update'){
   const id=String(body.id||'');const target=await profile(id);if(!target||target.company_id!==companyId)return json(res,404,{error:'User profile not found.'});
   const email=String(body.email??target.email).trim().toLowerCase(),fullName=String(body.fullName??target.full_name??'').trim(),roleName=cleanRole(body.role??target.role),username=cleanUsername(body.username??target.username);
   if(!username)return json(res,400,{error:'Enter a valid username.'});if(!validEmail(email))return json(res,400,{error:'Enter a valid email address.'});if(!fullName)return json(res,400,{error:'Full name is required.'});if(!roleName)return json(res,400,{error:'Select a valid role.'});
   if(id===admin.user.id&&roleName!=='Admin / Owner')return json(res,400,{error:'You cannot remove your own administrator role.'});
   const dup=await adminRequest(`/rest/v1/erp_profiles?select=id&username=eq.${encodeURIComponent(username)}&id=neq.${encodeURIComponent(id)}&limit=1`);if(dup?.length)return json(res,409,{error:'Username already exists.'});
   const authPayload={email,user_metadata:{full_name:fullName},app_metadata:{erp_role:roleName}};if(body.password){if(!passwordOk(String(body.password)))return json(res,400,{error:'Password must be at least 8 characters.'});authPayload.password=String(body.password);}
   await adminRequest(`/auth/v1/admin/users/${encodeURIComponent(id)}`,{method:'PUT',body:JSON.stringify(authPayload)});await upsertProfile(id,email,username,fullName,roleName,target.active!==false,companyId,body.password?true:target.force_password_change===true);return json(res,200,{success:true});
  }
  if(action==='resetPassword'){
   const id=String(body.id||'');const target=await profile(id);if(!target||target.company_id!==companyId)return json(res,404,{error:'User profile not found.'});const password=tempPassword();
   await adminRequest(`/auth/v1/admin/users/${encodeURIComponent(id)}`,{method:'PUT',body:JSON.stringify({password,email_confirm:true})});
   await adminRequest(`/rest/v1/erp_profiles?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({force_password_change:true,updated_at:new Date().toISOString()})});
   let emailSent=false;try{await sendTempEmail({to:target.email,name:target.full_name,username:target.username,password});emailSent=true;}catch(mailError){console.warn('Temporary password email was not sent:',mailError?.message||mailError);}
   return json(res,200,{success:true,temporaryPassword:password,username:target.username,emailSent,message:emailSent?'Temporary password generated and emailed to the registered email.':'Temporary password generated. Copy it and share it manually.'});
  }
  if(action==='clearForcePassword'){
   const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');const authUser=await authenticatedUser(token);if(!authUser||authUser.id!==admin.user.id)return json(res,403,{error:'Not authorised.'});
   await adminRequest(`/rest/v1/erp_profiles?id=eq.${encodeURIComponent(authUser.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({force_password_change:false,updated_at:new Date().toISOString()})});return json(res,200,{success:true});
  }
  if(action==='setStatus'){const id=String(body.id||''),active=body.active===true;if(!id)return json(res,400,{error:'User ID is required.'});if(id===admin.user.id&&!active)return json(res,400,{error:'You cannot disable your own administrator account.'});const target=await profile(id);if(!target||target.company_id!==companyId)return json(res,404,{error:'User profile not found.'});await adminRequest(`/auth/v1/admin/users/${encodeURIComponent(id)}`,{method:'PUT',body:JSON.stringify({ban_duration:active?'none':'876000h'})});await adminRequest(`/rest/v1/erp_profiles?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({active,updated_at:new Date().toISOString()})});return json(res,200,{success:true,active});}
  return json(res,400,{error:'Unknown action.'});
 }catch(err){console.error(err);return json(res,500,{error:err?.message||'Unexpected error'});}
};

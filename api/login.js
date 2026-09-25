function env(name){ return process.env[name] || ''; }
function json(res,status,body){ res.statusCode=status; res.setHeader('Content-Type','application/json'); res.setHeader('Cache-Control','no-store'); res.end(JSON.stringify(body)); }
function base(){ return env('SUPABASE_URL').replace(/\/$/,''); }
async function adminRequest(path,options={}){
 const r=await fetch(`${base()}${path}`,{...options,headers:{apikey:env('SUPABASE_SERVICE_ROLE_KEY'),Authorization:`Bearer ${env('SUPABASE_SERVICE_ROLE_KEY')}`,'Content-Type':'application/json',...(options.headers||{})}});
 const text=await r.text(); let data=null; try{data=text?JSON.parse(text):null;}catch{data=text;} if(!r.ok){const e=new Error('Request failed');e.details=data;throw e;} return data;
}
module.exports=async function(req,res){
 if(req.method!=='POST') return json(res,405,{error:'Method not allowed'});
 try{
  const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
  const username=String(body.username||'').trim(); const password=String(body.password||'');
  if(!username||!password) return json(res,400,{error:'Username and password are required.'});
  if(!env('SUPABASE_URL')||!env('SUPABASE_ANON_KEY')||!env('SUPABASE_SERVICE_ROLE_KEY')) return json(res,500,{error:'Authentication is not configured.'});
  const lookup=encodeURIComponent(username);
  const rows=await adminRequest(`/rest/v1/erp_profiles?select=id,email,username,full_name,role,active,force_password_change,company_id&or=(username.eq.${lookup},email.eq.${lookup})&limit=1`);
  const profile=rows?.[0];
  if(!profile || profile.active===false) return json(res,401,{error:'Invalid username or password.'});
  const r=await fetch(`${base()}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:env('SUPABASE_ANON_KEY'),'Content-Type':'application/json'},body:JSON.stringify({email:profile.email,password})});
  const text=await r.text(); let data=null; try{data=text?JSON.parse(text):null;}catch{data={};}
  if(!r.ok || !data?.access_token) return json(res,401,{error:'Invalid username or password.'});
  return json(res,200,{session:{access_token:data.access_token,refresh_token:data.refresh_token},user:{id:profile.id,email:profile.email,user_metadata:{full_name:profile.full_name}},forcePasswordChange:!!profile.force_password_change});
 }catch(e){ console.error(e); return json(res,500,{error:'Login service error.'}); }
};

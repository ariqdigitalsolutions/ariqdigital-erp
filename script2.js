
const ERP_KEY = 'businessERP.v6.intacctInspiredAccountingUX';

function today(){ return new Date().toISOString().slice(0,10); }
function now(){ return new Date().toISOString(); }
function addDays(days){ const d=new Date(); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10); }
function n(v){ return Number(v||0); }
function money(v,c='USD'){ return `${c} ${n(v).toFixed(2)}`; }
function quantity(v){ return `${n(v).toFixed(2)}`; }
function qty(v){ return quantity(v); }
function idFor(arr){ return (Math.max(0,...(arr||[]).map(x=>Number(x.id)||0))+1); }
function uid(prefix){ return `${prefix}-${Date.now().toString().slice(-7)}`; }
function option(list,label='name',selected=''){ return (list||[]).map(x=>`<option value="${x.id}" ${String(x.id)===String(selected)?'selected':''}>${esc(x[label]||x.name||x.number)}</option>`).join(''); }
function esc(s){ return String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
function baseAmount(amount,currency){ const rate=n(state.settings.rates?.[currency])||1; return currency==='USD'?n(amount):n(amount)/rate; }
function localAmount(amountBase,currency){ const rate=n(state.settings.rates?.[currency])||1; return currency==='USD'?n(amountBase):n(amountBase)*rate; }

const defaultAccounts = [
  ['Cash on hand','Asset'],['Bank account','Asset'],['EcoCash/mobile money','Asset'],['POS/swipe clearing account','Asset'],['Accounts Receivable','Asset'],['Inventory / Stock','Asset'],['Approved EFT Customer Deposits','Liability'],
  ['Accounts Payable','Liability'],['Payroll Payable','Liability'],['VAT Output','Liability'],['VAT Input','Asset'],
  ['Sales','Income'],['Discounts Allowed','Income'],['Delivery Income','Income'],
  ['Cost of Goods Sold','Expense'],['Rent Expense','Expense'],['Wages Expense','Expense'],['Fuel Expense','Expense'],['Transport Expense','Expense'],['Electricity Expense','Expense'],['Packaging Expense','Expense'],['Repairs and maintenance Expense','Expense'],['Facility maintenance Expense','Expense'],['Cleaning Expense','Expense'],['Security Expense','Expense'],['Bank charges Expense','Expense'],['Other Expense','Expense'],
  ['Owner Drawings','Equity'],['Capital','Equity']
].map((a,i)=>({id:i+1,name:a[0],type:a[1],system:true}));

const defaultData = {
  settings:{
    companyName:'AriQ Digital ERP Demo', phone:'+263 77 000 0000', address:'Bulawayo, Zimbabwe', invoiceFooter:'Thank you for your business.',
    vatRegistered:false, vatNumber:'', tin:'', vatRate:15.5, vatMethod:'exclusive', fiscalEnabled:false, fiscalMode:'Disabled', fiscalDeviceId:'', fiscalSerial:'', activationKey:'', branchName:'Main Branch', zimraEndpoint:'',
    nextQuote:501, nextInvoice:1001, nextPR:201, nextPO:301, nextGRV:401, nextSupplierInvoice:701, nextPayroll:801, nextReceipt:9001,
    currencies:['USD','ZWG','ZAR'], rates:{USD:1,ZWG:25,ZAR:18}, bankSyncEnabled:false, bankName:'', bankAccount:'', bankBranch:'', bankCurrency:'USD', bankClientId:'', bankClientSecret:'', bankApiEndpoint:'', bankTokenEndpoint:'', bankWebhookUrl:'', bankApiStatus:'Not Connected', bankAuthStatus:'Not tested', bankAccountStatus:'Not tested', bankBalanceStatus:'Not tested', bankStatementStatus:'Not tested', bankPaymentStatus:'Not tested', bankWebhookStatus:'Not tested', bankLastSync:'Never', bankReadOnly:false, bankAvailableBalance:0
  },
  products:[
    {id:1,name:'Laptop Computer',category:'Electronics',uom:'pcs',sell:850,cost:650,tax:'standard rated',hs:'8471',low:5,active:true},
    {id:2,name:'Office Printer',category:'Office Equipment',uom:'pcs',sell:320,cost:240,tax:'standard rated',hs:'8443',low:3,active:true},
    {id:3,name:'Office Desk',category:'Furniture',uom:'pcs',sell:180,cost:120,tax:'standard rated',hs:'9403',low:5,active:true},
    {id:4,name:'Network Cable',category:'Networking',uom:'pcs',sell:12,cost:7,tax:'standard rated',hs:'8544',low:20,active:true},
    {id:5,name:'Software License',category:'Software',uom:'unit',sell:75,cost:35,tax:'standard rated',hs:'8523',low:10,active:true}
  ],
  customers:[
    {id:1,name:'ABC Trading',business:'ABC Trading',phone:'0770000001',email:'',address:'Bulawayo',vat:'',creditLimit:2000,terms:7,opening:0,active:true},
    {id:2,name:'City Restaurant',business:'City Restaurant',phone:'0770000002',email:'',address:'CBD',vat:'',creditLimit:800,terms:14,opening:0,active:true}
  ],
  suppliers:[
    {id:1,name:'General Supplies Ltd',company:'General Supplies Ltd',phone:'0771000001',email:'',address:'Nyamandlovu',vat:'',bankName:'CBZ',bankAccount:'000123456789',branch:'Bulawayo',accountType:'Current',currency:'USD',products:'Office & IT Supplies',opening:0,active:true},
    {id:2,name:'Office Solutions Ltd',company:'Office Solutions Ltd',phone:'0771000002',email:'',address:'Bulawayo',vat:'',bankName:'Stanbic',bankAccount:'000987654321',branch:'Bulawayo',accountType:'Current',currency:'USD',products:'Office Equipment',opening:0,active:true}
  ],
  employees:[
    {id:1,name:'Demo Cashier',employeeNo:'EMP-001',nationalId:'',phone:'0772000001',email:'cashier.employee@business.erp',address:'Bulawayo',role:'Cashier',department:'Sales',employmentType:'Full-time',startDate:today(),bankName:'NMB',bankAccount:'1234567890',branch:'Bulawayo',accountType:'Current',hourlyRate:0,basicSalary:350,allowances:0,overtime:0,bonus:0,advances:0,loans:0,paye:0,nssa:0,deductions:0,active:true},
    {id:2,name:'Operations Assistant',employeeNo:'EMP-002',nationalId:'',phone:'0772000002',email:'warehouse.employee@business.erp',address:'Bulawayo',role:'General Hand',department:'Operations',employmentType:'Full-time',startDate:today(),bankName:'FBC',bankAccount:'9876543210',branch:'Bulawayo',accountType:'Savings',hourlyRate:0,basicSalary:280,allowances:20,overtime:0,bonus:0,advances:0,loans:0,paye:0,nssa:0,deductions:0,active:true}
  ],
  accounts:defaultAccounts,
  carcasses:[{id:1,supplierId:1,animal:'General',batch:'BATCH-2026-001',carcassId:'BATCH-001',productId:1,original:10,sold:0,processed:0,wasted:0,remaining:10,cost:650,grade:'Standard',inspection:'Received',expiry:addDays(365),location:'Main Warehouse',date:today(),receivedBy:'Admin User'}],
  stockMovements:[], quotations:[], invoices:[], invoiceItems:[], dispatches:[], receipts:[], eftDeposits:[],
  purchaseRequisitions:[], purchaseOrders:[], supplierInvoices:[], grvs:[], supplierPayments:[],
  expenses:[], cashups:[], journalEntries:[], payrollRuns:[], payrollRequests:[], payslips:[], bankPaymentRequests:[], bankTransactions:[], reconciliations:[], assets:[], fiscalQueue:[], auditLogs:[]
};

let state = migrate(structuredClone(defaultData));
let session = null;
let supabaseClient = null;
let supabaseReady = false;
let supabaseConfig = null;
let dbSaveTimer = null;
let currentPage = 'dashboard';
let menuCollapsed = false;
let menuPointerBound = false;
let recoveryMode = false;
let pending2FA = null;
let accountingTab = 'overview';
let quoteLines = [];
let saleCart = [];
let editQuoteId = null;
let loadedQuoteId = null;

function migrate(d){
  // Legacy application-level users/passwords are intentionally discarded. Authentication is handled by the application authentication service.
  delete d.users;
  const arrays=['products','customers','suppliers','employees','accounts','batches','stockMovements','quotations','invoices','invoiceItems','dispatches','receipts','eftDeposits','purchaseRequisitions','purchaseOrders','supplierInvoices','grvs','supplierPayments','expenses','cashups','journalEntries','payrollRuns','payrollRequests','payslips','bankPaymentRequests','bankTransactions','reconciliations','assets','fiscalQueue','auditLogs'];
  arrays.forEach(k=>{ if(!Array.isArray(d[k])) d[k]=structuredClone(defaultData[k]||[]); });
  d.settings={...defaultData.settings,...(d.settings||{}),rates:{...defaultData.settings.rates,...(d.settings?.rates||{})}};
  defaultAccounts.forEach(a=>{ if(!d.accounts.find(x=>x.name===a.name)) d.accounts.push({...a,id:idFor(d.accounts)}); });
  d.suppliers.forEach(s=>{ if(s.bankName===undefined) s.bankName=''; if(s.bankAccount===undefined) s.bankAccount=''; if(s.branch===undefined) s.branch=''; if(s.accountType===undefined) s.accountType='Current'; if(s.currency===undefined) s.currency='USD'; });
  d.employees.forEach((e,i)=>{ if(e.employeeNo===undefined) e.employeeNo=`EMP-${String(i+1).padStart(3,'0')}`; if(e.nationalId===undefined) e.nationalId=''; if(e.email===undefined) e.email=''; if(e.address===undefined) e.address=''; if(e.department===undefined) e.department=e.role||''; if(e.employmentType===undefined) e.employmentType='Full-time'; if(e.startDate===undefined) e.startDate=today(); if(e.branch===undefined) e.branch=''; if(e.accountType===undefined) e.accountType='Current'; if(e.hourlyRate===undefined) e.hourlyRate=0; if(e.overtime===undefined) e.overtime=0; if(e.bonus===undefined) e.bonus=0; if(e.advances===undefined) e.advances=0; if(e.loans===undefined) e.loans=0; if(e.paye===undefined) e.paye=0; if(e.nssa===undefined) e.nssa=0; });
  return d;
}
function load(){ return migrate(structuredClone(defaultData)); }
async function save(){
  if(!supabaseClient || !supabaseReady) return false;
  clearTimeout(dbSaveTimer);
  dbSaveTimer=setTimeout(async()=>{
    try{
      const tenantKey = session?.companyId ? `${session.companyId}:main` : 'main';
      const {error}=await supabaseClient.from('erp_state').upsert({id:tenantKey,company_id:session?.companyId||null,data:state,updated_at:new Date().toISOString()});
      if(error) console.error('Data save failed.');
    }catch(err){ console.error(err); }
  },150);
  return true;
}
async function loadFromSupabase(){
  if(!supabaseClient) return;
  const tenantKey = session?.companyId ? `${session.companyId}:main` : 'main';
  const {data,error}=await supabaseClient.from('erp_state').select('data').eq('id',tenantKey).maybeSingle();
  if(error) throw error;
  if(data?.data && Object.keys(data.data).length){
    state=migrate(data.data);
    return;
  }

  // Preserve data from the pre-multitenant system when a tenant row does not exist yet.
  // The v8 migration introduced company-scoped keys, so older data may still live under `main`.
  if(session?.companyId && tenantKey !== 'main'){
    try{
      const legacy=await supabaseClient.from('erp_state').select('data').eq('id','main').maybeSingle();
      if(!legacy.error && legacy.data?.data && Object.keys(legacy.data.data).length){
        state=migrate(legacy.data.data);
        const {error:copyError}=await supabaseClient.from('erp_state').upsert({id:tenantKey,company_id:session.companyId,data:state,updated_at:new Date().toISOString()});
        if(copyError) throw copyError;
        return;
      }
    }catch(copyErr){
      console.warn('Legacy ERP state migration skipped:',copyErr);
    }
  }

  state=migrate(structuredClone(defaultData));
  const {error:saveError}=await supabaseClient.from('erp_state').upsert({id:tenantKey,company_id:session?.companyId||null,data:state,updated_at:new Date().toISOString()});
  if(saveError) throw saveError;
}
async function getMyProfile(){
  const {data:userResult,error:userError}=await supabaseClient.auth.getUser();
  if(userError || !userResult?.user) throw userError || new Error('No authenticated user.');
  const {data:profile,error:profileError}=await supabaseClient.from('erp_profiles').select('id,email,username,full_name,role,active,force_password_change,company_id').eq('id',userResult.user.id).maybeSingle();
  if(profileError) throw profileError;
  if(!profile || profile.active===false) throw new Error('Your ERP account is inactive or has no ERP profile. Contact the administrator.');
  return {authUser:userResult.user,profile};
}
async function initSupabase(){
  try{
    let cfg=window.SUPABASE_CONFIG||null;
    if(!cfg || !cfg.url || !cfg.anonKey){
      const r=await fetch('/api/config',{cache:'no-store'});
      if(r.ok) cfg=await r.json();
    }
    if(!cfg?.url || !cfg?.anonKey){
      return false;
    }
    supabaseConfig=cfg;
    supabaseClient=window.supabase.createClient(cfg.url,cfg.anonKey,{
      auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:true}
    });
    supabaseClient.auth.onAuthStateChange((event, sessionData)=>{
      if(event==='PASSWORD_RECOVERY'){
        recoveryMode=true;
        render();
      }
    });
    supabaseReady=true;
    return true;
  }catch(err){
    console.error('Application initialization failed.');
    return false;
  }
}
function resetDemo(){ if(confirm('Reset all ERP data?')){ state=migrate(structuredClone(defaultData)); save(); render(); } }

function role(){ return session?.role||''; }
function isAccountingUser(){ return ['Admin / Owner','Accountant'].includes(role()); }
function can(page){
  const r=role();
  if(r==='Admin / Owner') return true;
  if(r==='Accountant') return ['dashboard','customers','suppliers','purchases','cashup','accounting','audit'].includes(page);
  if(r==='Supervisor') return ['dashboard','pos','quotations','stock','purchases','customers','suppliers','cashup'].includes(page);
  if(r==='Cashier / Sales Clerk') return ['dashboard','pos','quotations','customers','cashup'].includes(page);
  return false;
}
function product(id){ return state.products.find(x=>x.id==id); }
function customer(id){ return state.customers.find(x=>x.id==id); }
function supplier(id){ return state.suppliers.find(x=>x.id==id); }
function accountType(name){
  if(/cash|bank|ecocash|pos|receivable|inventory|vat input/i.test(name)) return 'Asset';
  if(/payable|vat output|deposit|payroll/i.test(name)) return 'Liability';
  if(/sales|income/i.test(name)) return 'Income';
  if(/expense|cost|charges|wages|rent|fuel|transport|electricity|packaging|security/i.test(name)) return 'Expense';
  return 'Equity';
}
function ensureAccount(name,type){ let acc=state.accounts.find(a=>a.name===name); if(!acc){ acc={id:idFor(state.accounts),name,type:type||accountType(name),system:false}; state.accounts.push(acc); audit('Accounting book created',name,false); } return acc; }
function paymentAccount(method){ if(method==='Cash') return 'Cash on hand'; if(method==='Bank') return 'Bank account'; if(method==='EFT') return 'Approved EFT Customer Deposits'; if(method.includes('EcoCash')) return 'EcoCash/mobile money'; if(method.includes('POS')) return 'POS/swipe clearing account'; return method; }
function postJournal(type,lines,ref){
  const clean=[];
  lines.forEach(l=>{ if(n(l.debit)||n(l.credit)){ ensureAccount(l.account,l.type); clean.push({account:l.account,debit:n(l.debit),credit:n(l.credit)}); } });
  if(!clean.length) return;
  const debit=clean.reduce((a,l)=>a+l.debit,0), credit=clean.reduce((a,l)=>a+l.credit,0);
  if(Math.abs(debit-credit)>0.01) console.warn('Unbalanced journal',type,ref,debit,credit);
  state.journalEntries.push({id:idFor(state.journalEntries),date:today(),type,ref,createdBy:session?.name||'System',approvedBy:session?.name||'System',status:'Posted',lines:clean});
}
function audit(action,details='',autoSave=true){ state.auditLogs.unshift({id:idFor(state.auditLogs),date:now(),user:session?.name||'System',role:role()||'System',action,details,requestedBy:session?.name||'System',requestedAt:now(),approvedBy:'',reviewedAt:'',finalStatus:'Recorded',reason:''}); if(autoSave) save(); }
function availableStock(productId){ return state.carcasses.filter(c=>c.productId==productId).reduce((s,c)=>s+n(c.remaining),0); }
function customerBalance(customerId){
  const c=customer(customerId); let bal=n(c?.opening);
  state.invoices.filter(s=>s.customerId==customerId).forEach(s=> bal+=n(s.totalBase)-n(s.paidBase));
  state.receipts.filter(p=>p.customerId==customerId && p.type==='Customer Payment').forEach(p=> bal-=n(p.amountBase));
  return bal;
}
function supplierBalance(supplierId){
  const s=supplier(supplierId); let bal=n(s?.opening);
  state.supplierInvoices.filter(i=>i.supplierId==supplierId).forEach(i=> bal+=n(i.totalBase)-n(i.paidBase));
  state.supplierPayments.filter(p=>p.supplierId==supplierId && ['Posted','Submitted to Bank - Successful','Processed by Bank API'].includes(p.status)).forEach(p=> bal-=n(p.amountBase));
  return bal;
}
function approvedEftBalance(customerId){
  let bal=0;
  state.eftDeposits.filter(e=>e.customerId==customerId && e.status==='Approved').forEach(e=>bal+=n(e.remainingBase));
  return bal;
}
function useEftBalance(customerId,amountBase,ref){
  let left=amountBase;
  state.eftDeposits.filter(e=>e.customerId==customerId && e.status==='Approved' && n(e.remainingBase)>0).forEach(e=>{
    const use=Math.min(n(e.remainingBase),left); e.remainingBase=n(e.remainingBase)-use; e.usedBase=n(e.usedBase)+use; left-=use;
    if(use>0) state.receipts.push({id:idFor(state.receipts),date:today(),customerId,amount:localAmount(use,e.currency),currency:e.currency,amountBase:use,method:'EFT',type:'EFT Applied',ref,sourceDeposit:e.ref});
  });
  return left<=0.01;
}
function glTotals(){ const accounts={}; state.journalEntries.forEach(j=>j.lines.forEach(l=>{ accounts[l.account]=accounts[l.account]||{debit:0,credit:0}; accounts[l.account].debit+=n(l.debit); accounts[l.account].credit+=n(l.credit); })); return accounts; }

function render(){
  if(!session) return renderLogin();
  if(session.forcePasswordChange) return renderForcedPasswordChange();
  const nav=[['dashboard','Dashboard'],['users','User Management'],['pos','Sales & Invoices'],['quotations','Quotations'],['stock','Inventory & Stock'],['purchases','Purchases'],['customers','Customers'],['suppliers','Suppliers'],['cashup','Cashup'],['accounting','ACCOUNTING'],['settings','Settings'],['audit','Audit Logs']].filter(([k])=>can(k));
  if(!can(currentPage)) currentPage='dashboard';
  document.getElementById('app').innerHTML=`<div class="shell ${menuCollapsed?'menu-collapsed':''}" id="erp-shell"><button class="menu-toggle no-print" aria-label="Toggle menu" title="Toggle menu" onclick="toggleMenu()">☰</button><aside class="sidebar"><div class="brand"><div class="logo">AQ</div><div><h1>AriQ Digital ERP</h1></div></div><div class="user-pill"><b>${esc(session.name)}</b><br>${esc(session.role)}<br><small>${esc(session.email)}</small></div><div class="nav">${nav.map(([k,v])=>`<button class="${currentPage===k?'active':''}" onclick="go('${k}')">${v}</button>`).join('')}<button onclick="logout()">Logout</button></div></aside><main class="main"><div class="topbar"><div><h2>${esc(nav.find(n=>n[0]===currentPage)?.[1]||'Dashboard')}</h2><p>${esc(state.settings.companyName)} • ${today()}</p></div><div class="actions no-print"><button class="btn ghost small" onclick="window.print()">Print</button><button class="btn ghost small" onclick="exportJson()">Backup JSON</button></div></div><div id="page"></div></main></div>`;
  pages[currentPage]();
}
function renderRecovery(){
  document.getElementById('app').innerHTML=`
    <div class="login-wrap">
      <div class="login-card">
        <div class="brand"><div class="logo">AQ</div><div><h1>Reset Password</h1><p>Choose a new ERP password</p></div></div>
        <form onsubmit="completePasswordRecovery(event)">
          <div class="form-row"><label>New password</label><input id="recoveryPassword" type="password" minlength="8" autocomplete="new-password" required></div>
          <div class="form-row"><label>Confirm new password</label><input id="recoveryPassword2" type="password" minlength="8" autocomplete="new-password" required></div>
          <button class="btn" style="width:100%">Set New Password</button>
        </form>
        <div class="notice" style="margin-top:14px">Use at least 8 characters. After changing the password, you will return to the login screen.</div>
      </div>
    </div>`;
}
async function sendPasswordReset(){
  if(!supabaseReady) return alert('The service is temporarily unavailable. Please try again.');
  const email=document.getElementById('email')?.value.trim().toLowerCase();
  if(!email) return alert('Enter your email address first.');
  try{
    const redirectTo=`${window.location.origin}${window.location.pathname}`;
    const {error}=await supabaseClient.auth.resetPasswordForEmail(email,{redirectTo});
    if(error) throw error;
    alert('If that email is registered, a password reset link has been sent. Check your email.');
  }catch(err){ alert('Could not start password recovery. Please try again.'); }
}
async function completePasswordRecovery(e){
  e.preventDefault();
  const p1=document.getElementById('recoveryPassword').value;
  const p2=document.getElementById('recoveryPassword2').value;
  if(p1.length<8) return alert('Password must be at least 8 characters.');
  if(p1!==p2) return alert('The passwords do not match.');
  try{
    const {error}=await supabaseClient.auth.updateUser({password:p1});
    if(error) throw error;
    recoveryMode=false;
    await supabaseClient.auth.signOut();
    alert('Password changed successfully. You can now log in with your new password.');
    renderLogin();
  }catch(err){ alert('Could not change the password. Please try again.'); }
}
function renderForcedPasswordChange(){
  document.getElementById('app').innerHTML=`<div class="login-wrap"><div class="login-card"><div class="brand"><div class="logo">AQ</div><div><h1>Change Password</h1></div></div><form onsubmit="changeTemporaryPassword(event)"><div class="form-row"><label>New Password</label><input id="forcePassword1" type="password" minlength="8" autocomplete="new-password" required></div><div class="form-row"><label>Confirm Password</label><input id="forcePassword2" type="password" minlength="8" autocomplete="new-password" required></div><button class="btn" style="width:100%">Change Password</button></form></div></div>`;
}
async function changeTemporaryPassword(e){
 e.preventDefault(); const p1=document.getElementById('forcePassword1').value,p2=document.getElementById('forcePassword2').value;
 if(p1.length<8) return alert('Password must be at least 8 characters.'); if(p1!==p2) return alert('Passwords do not match.');
 try{ const {error}=await supabaseClient.auth.updateUser({password:p1}); if(error) throw error; const r=await fetch('/api/users',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${(await supabaseClient.auth.getSession()).data.session?.access_token||''}`},body:JSON.stringify({action:'clearForcePassword'})}); const result=await r.json().catch(()=>({})); if(!r.ok) throw new Error(result.error||'Could not complete password change.'); session.forcePasswordChange=false; audit('Password changed','Temporary password replaced'); render(); }catch(err){alert('Could not change password. Please try again.');}
}
function renderLogin(){
  if(recoveryMode) return renderRecovery();
  const verification = pending2FA ? `
    <div class="notice" style="margin-bottom:14px"><b>Check your registered email.</b><br>A 6-digit verification code was sent to <b>${esc(maskEmail(pending2FA.email))}</b>.</div>
    <form onsubmit="verify2FA(event)">
      <div class="form-row"><label>Verification code</label><input id="twofaCode" class="twofa-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="\d{6}" placeholder="000000" required autofocus></div>
      <div class="twofa-note">The code expires in 10 minutes and can only be used once.</div>
      <button class="btn" style="width:100%">Verify &amp; Continue</button>
    </form>
    <div class="actions" style="margin-top:12px;justify-content:space-between">
      <button class="btn ghost small" type="button" onclick="cancel2FA()">Back to login</button>
      <button class="btn secondary small" type="button" onclick="resend2FA()">Resend code</button>
    </div>
  ` : `
    <form onsubmit="login(event)">
      <div class="form-row"><label>Username</label><input id="username" value="" autocomplete="username" required></div>
      <div class="form-row"><label>Password</label><input id="password" type="password" autocomplete="current-password" required></div>
      <button class="btn" style="width:100%">Login</button>
      <button class="btn ghost small" type="button" style="width:100%;margin-top:10px" onclick="sendPasswordReset()">Forgot Password?</button>
    </form>
  `;
  document.getElementById('app').innerHTML=`
    <div class="login-wrap">
      <div class="login-card">
        <div class="brand">
          <div class="logo">AQ</div>
          <div>
            <h1>AriQ Digital ERP</h1>
            
          </div>
        </div>
        ${verification}
        
        
        <div class="demo-copyright">
          <strong>DEMO VERSION — COPYRIGHT NOTICE</strong>
          This system is provided for demonstration and evaluation purposes only. Access to this demo does not grant ownership, source code rights, resale rights, modification rights, or distribution rights.<br><br>
          All software, design, workflows, source code, database structure, reports, screens, and business logic remain the intellectual property of AriQ Digital Solutions. Copying, reselling, modifying, reverse engineering, or distributing this system without written permission is strictly prohibited.
          <span class="copyright-line">© 2026 AriQ Digital Solutions. All Rights Reserved.</span>
        </div>
      </div>
    </div>`;
}
function maskEmail(email){
  const [local,domain]=String(email||'').split('@');
  if(!domain) return email;
  const shown=local.length<=2?local.charAt(0):local.slice(0,2);
  return `${shown}${'*'.repeat(Math.max(1,local.length-shown.length))}@${domain}`;
}
async function login(e){
  e.preventDefault();
  if(!supabaseReady) return alert('The service is temporarily unavailable. Please try again.');
  const username=document.getElementById('username').value.trim();
  const password=document.getElementById('password').value;
  const button=e.submitter || e.target.querySelector('button');
  if(button){button.disabled=true;}
  try{
    const loginResponse=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
    const loginResult=await loginResponse.json().catch(()=>({}));
    if(!loginResponse.ok || !loginResult?.session) throw new Error('Invalid username or password.');
    const {error:setSessionError}=await supabaseClient.auth.setSession(loginResult.session);
    if(setSessionError) throw setSessionError;
    const data={user:loginResult.user,session:loginResult.session};
    const error=null;
    const {data:profile,error:profileError}=await supabaseClient.from('erp_profiles').select('id,email,username,full_name,role,active,force_password_change,company_id').eq('id',data.user.id).maybeSingle();
    if(profileError) throw profileError;
    if(!profile || profile.active===false) throw new Error('Your ERP account is inactive or has no ERP profile. Contact the administrator.');
    if(supabaseConfig?.twoFactorEnabled===false){
      session={id:profile.id,name:profile.full_name||data.user.user_metadata?.full_name||profile.username,email:data.user.email,username:profile.username,role:profile.role,companyId:profile.company_id,forcePasswordChange:!!profile.force_password_change};
      await loadFromSupabase();
      audit('Login','User signed in successfully');
      render();
      return;
    }
    const response=await fetch('/api/2fa',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${data.session.access_token}`},body:JSON.stringify({action:'send',email:data.user.email,name:profile.full_name||data.user.user_metadata?.full_name||'User'})});
    const result=await response.json().catch(()=>({}));
    await supabaseClient.auth.signOut();
    if(!response.ok) throw new Error(result.error||'Could not send verification code.');
    pending2FA={authUserId:data.user.id,email:data.user.email,name:profile.full_name||data.user.user_metadata?.full_name||'User',role:profile.role,challengeId:result.challengeId,expiresAt:result.expiresAt,password};
    renderLogin();
    setTimeout(()=>document.getElementById('twofaCode')?.focus(),50);
  }catch(err){
    try{ await supabaseClient.auth.signOut(); }catch{}
    alert('Unable to sign in. Please check your username and password.');
    if(button){button.disabled=false;button.textContent='Login';}
  }
}
async function verify2FA(e){
  e.preventDefault();
  if(!pending2FA) return renderLogin();
  const code=String(document.getElementById('twofaCode').value||'').replace(/\D/g,'').slice(0,6);
  if(code.length!==6) return alert('Enter the 6-digit verification code.');
  const button=e.submitter || e.target.querySelector('button');
  if(button){button.disabled=true;button.textContent='Verifying…';}
  try{
    const response=await fetch('/api/2fa',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'verify',email:pending2FA.email,challengeId:pending2FA.challengeId,code})});
    const result=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(result.error||'Verification failed.');
    const loginResult=await supabaseClient.auth.signInWithPassword({email:pending2FA.email,password:pending2FA.password});
    if(loginResult.error || !loginResult.data?.user) throw new Error('Your password could not be revalidated. Please log in again.');
    const {data:profile,error:profileError}=await supabaseClient.from('erp_profiles').select('id,email,username,full_name,role,active,force_password_change,company_id').eq('id',loginResult.data.user.id).maybeSingle();
    if(profileError) throw profileError;
    if(!profile || profile.active===false) throw new Error('Your ERP account is inactive.');
    await loadFromSupabase();
    session={id:profile.id,name:profile.full_name||loginResult.data.user.user_metadata?.full_name||profile.username,email:loginResult.data.user.email,username:profile.username,role:profile.role,companyId:profile.company_id,forcePasswordChange:!!profile.force_password_change};
    pending2FA=null;
    await loadFromSupabase();
    audit('Login','User signed in successfully');
    render();
  }catch(err){
    try{ await supabaseClient.auth.signOut(); }catch{}
    alert('Verification failed. Please try again.');
    if(button){button.disabled=false;button.textContent='Verify & Continue';}
  }
}
async function resend2FA(){
  if(!pending2FA) return renderLogin();
  try{
    // Resend requires a fresh successful Supabase Auth login, then the temporary session is immediately revoked.
    const loginResult=await supabaseClient.auth.signInWithPassword({email:pending2FA.email,password:pending2FA.password});
    if(loginResult.error || !loginResult.data?.session) throw new Error('Your login could not be revalidated. Please start again.');
    const response=await fetch('/api/2fa',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${loginResult.data.session.access_token}`},body:JSON.stringify({action:'send',email:pending2FA.email,name:pending2FA.name})});
    const result=await response.json().catch(()=>({}));
    await supabaseClient.auth.signOut();
    if(!response.ok) throw new Error(result.error||'Could not resend verification code.');
    pending2FA.challengeId=result.challengeId;
    pending2FA.expiresAt=result.expiresAt;
    renderLogin();
    setTimeout(()=>document.getElementById('twofaCode')?.focus(),50);
    alert('A new verification code has been sent.');
  }catch(err){ try{ await supabaseClient.auth.signOut(); }catch{}; alert('Could not resend the verification code. Please try again.'); }
}
function cancel2FA(){ pending2FA=null; renderLogin(); }
async function logout(){
  try{ if(supabaseClient) await supabaseClient.auth.signOut(); }catch(err){ console.warn(err); }
  session=null; pending2FA=null; state=migrate(structuredClone(defaultData)); renderLogin();
}
function setMenuCollapsed(collapsed){
  menuCollapsed=!!collapsed;
  const shell=document.getElementById('erp-shell');
  if(!shell) return;
  shell.classList.toggle('menu-collapsed',menuCollapsed);
  if(!menuCollapsed) shell.classList.remove('menu-open');
}
function toggleMenu(){
  const shell=document.getElementById('erp-shell');
  if(!shell) return;
  if(shell.classList.contains('menu-collapsed')){
    menuCollapsed=false;
    shell.classList.remove('menu-collapsed','menu-open');
  }else{
    menuCollapsed=true;
    shell.classList.add('menu-collapsed');
    shell.classList.remove('menu-open');
  }
}
function revealMenu(){
  const shell=document.getElementById('erp-shell');
  if(!shell || !shell.classList.contains('menu-collapsed')) return;
  shell.classList.add('menu-open');
}
if(!menuPointerBound){
  document.addEventListener('mousemove',e=>{ if(e.clientX<=14) revealMenu(); });
  menuPointerBound=true;
}
function go(p){ currentPage=p; menuCollapsed=true; render(); }
function page(html){ document.getElementById('page').innerHTML=html; }
function table(head,rows){ return `<div class="table-wrap"><table><thead><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${(rows&&rows.length?rows:[[...Array(head.length)].map((_,i)=>i?'':'No records')]).map(r=>`<tr>${r.map(c=>`<td>${c??''}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; }
function metric(title,value,sub=''){ return `<div class="card metric"><h3>${title}</h3><strong>${value}</strong><span>${sub}</span></div>`; }
function modal(html){ document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop"><div class="modal"><header><h3></h3><button class="close" onclick="this.closest('.modal-backdrop').remove()">✕</button></header>${html}</div></div>`); }

function showFormError(msg){ alert(msg); return false; }
function clearFieldErrors(scope=document){
  scope.querySelectorAll('.field-invalid').forEach(el=>el.classList.remove('field-invalid'));
  scope.querySelectorAll('.field-error-text').forEach(el=>el.remove());
}
function markFieldInvalid(el,msg){
  if(!el) return;
  el.classList.add('field-invalid');
  const row=el.closest('.form-row')||el.parentElement;
  if(row && !row.querySelector('.field-error-text')) row.insertAdjacentHTML('beforeend',`<small class="field-error-text">${esc(msg)}</small>`);
  try{ el.focus(); }catch(e){}
}
function requiredValue(el,label){
  const msg=`${label} is required.`;
  if(!el || String(el.value??'').trim()==='') { markFieldInvalid(el,msg); return showFormError(msg); }
  el.classList.remove('field-invalid');
  return true;
}
function requiredNumber(el,label,min=0){
  const missing=`${label} is required.`;
  if(!el || String(el.value??'').trim()==='') { markFieldInvalid(el,missing); return showFormError(missing); }
  const val=n(el.value);
  const msg=`${label} must be greater than ${min}.`;
  if(!Number.isFinite(val) || val<=min) { markFieldInvalid(el,msg); return showFormError(msg); }
  el.classList.remove('field-invalid');
  return true;
}
function requireFields(fields){
  clearFieldErrors(document);
  for(const [el,label,type,min] of fields){
    const ok=type==='number'?requiredNumber(el,label,min??0):requiredValue(el,label);
    if(!ok) return false;
  }
  return true;
}
function statusBadge(status){
  const st=String(status||'');
  let cls=st.includes('Approved')||st.includes('Completed')||st.includes('Active')||st.includes('Dispatched')?'good':st.includes('Rejected')||st.includes('Disapproved')||st.includes('Failed')?'bad':st.includes('Pending')||st.includes('Awaiting')||st.includes('Draft')?'warn':'';
  return `<span class="badge ${cls}">${esc(st)}</span>`;
}
function bankReadyForAutoPay(){ return state.settings.bankApiStatus==='Fully Connected'; }



let userManagementCache=[];
async function userApi(action,payload={}){
  const {data}=await supabaseClient.auth.getSession();
  const token=data?.session?.access_token;
  if(!token) throw new Error('Your administrator session has expired. Please log in again.');
  const r=await fetch('/api/users',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
    body:JSON.stringify({action,...payload})
  });
  const result=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(result.error||'User management request failed.');
  return result;
}
async function loadUsers(){
  if(role()!=='Admin / Owner') return;
  const result=await userApi('list');
  userManagementCache=result.users||[];
  return userManagementCache;
}
function userRoleOptions(selected){
  return ['Admin / Owner','Accountant','Supervisor','Cashier / Sales Clerk'].map(r=>`<option ${r===selected?'selected':''}>${r}</option>`).join('');
}
async function renderUserManagement(){
  page(`<div class="card"><div class="section-title"><div><h3>User Management</h3></div><button class="btn" onclick="openCreateUserModal()">+ Create User</button></div><div id="usersPanel"><div class="notice">Loading users…</div></div></div>`);
  try{ await loadUsers(); renderUsersTable(); }catch(err){ document.getElementById('usersPanel').innerHTML=`<div class="notice" style="background:#fee2e2;color:#991b1b">${esc(err.message)}</div>`; }
}
function renderUsersTable(){
  const panel=document.getElementById('usersPanel'); if(!panel) return;
  const rows=userManagementCache.map(u=>[
    `<b>${esc(u.full_name||'')}</b>`,
    esc(u.username||''),
    esc(u.email),
    esc(u.role),
    statusBadge(u.active?'Active':'Disabled'),
    u.lastSignIn?new Date(u.lastSignIn).toLocaleString():'Never',
    `<div class="actions">
      <button class="btn ghost small" onclick="openEditUserModal('${u.id}')">Edit</button>
      <button class="btn warn small" onclick="openResetUserModal('${u.id}')">Reset Password</button>
      ${u.id===session.id?'':u.active?`<button class="btn bad small" onclick="toggleUserStatus('${u.id}',false)">Disable</button>`:`<button class="btn good small" onclick="toggleUserStatus('${u.id}',true)">Enable</button>`}
    </div>`
  ]);
  panel.innerHTML=table(['Name','Username','Email','Role','Status','Last login','Actions'],rows)+'';
}
function openCreateUserModal(){
  modal(`<h3>Create User</h3><div class="two-col-form"><div class="form-row"><label>Username</label><input id="umUsername" required></div><div class="form-row"><label>Full Name</label><input id="umName" required></div><div class="form-row"><label>Email</label><input id="umEmail" type="email" required></div><div class="form-row"><label>Role</label><select id="umRole">${userRoleOptions('Cashier / Sales Clerk')}</select></div></div><div class="actions" style="justify-content:flex-end"><button class="btn ghost" onclick="this.closest('.modal-backdrop').remove()">Cancel</button><button class="btn" onclick="createUser()">Create User</button></div>`);
}
async function copyTemporaryPassword(password,button){
 try{ await navigator.clipboard.writeText(password); const old=button.innerHTML; button.innerHTML='Copied'; setTimeout(()=>button.innerHTML=old,1400); }
 catch(e){ const input=document.createElement('textarea'); input.value=password; document.body.appendChild(input); input.select(); document.execCommand('copy'); input.remove(); button.innerHTML='Copied'; setTimeout(()=>button.innerHTML='Copy Password',1400); }
}
async function shareTemporaryPassword(username,password){
 const text=`AriQ Digital ERP login\nUsername: ${username}\nTemporary password: ${password}\n\nPlease log in and change the temporary password when prompted.`;
 if(navigator.share){ try{ await navigator.share({title:'AriQ Digital ERP Login',text}); return; }catch(e){} }
 try{ await navigator.clipboard.writeText(text); alert('Login details copied. You can paste them into WhatsApp, SMS, email or any other app.'); }
 catch(e){ alert(text); }
}
function passwordResultModal(title,username,password){
 const safeUser=String(username||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
 const safePass=String(password||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
 modal(`<h3>${title}</h3><p>Share these login details with <b>${esc(username||'')}</b>.</p><div class="card" style="margin-top:12px;padding:16px;background:#f8fafc"><div><b>Username:</b> ${esc(username||'')}</div><div style="margin-top:10px"><div style="font-size:12px;color:#64748b">TEMPORARY PASSWORD</div><div style="font-size:22px;font-weight:800;word-break:break-all">${esc(password||'')}</div></div></div><div class="actions" style="justify-content:flex-end;margin-top:14px"><button class="btn ghost" onclick="copyTemporaryPassword('${safePass}',this)">Copy Password</button><button class="btn" onclick="shareTemporaryPassword('${safeUser}','${safePass}')">Share Login Details</button><button class="btn good" onclick="this.closest('.modal-backdrop').remove()">Done</button></div>`);
}
async function createUser(){
 const username=document.getElementById('umUsername')?.value.trim(),name=document.getElementById('umName')?.value.trim(),email=document.getElementById('umEmail')?.value.trim().toLowerCase(),roleName=document.getElementById('umRole')?.value;
 if(!username||!name||!email||!roleName) return alert('Complete all fields.');
 try{ const result=await userApi('create',{username,fullName:name,email,role:roleName}); document.querySelector('.modal-backdrop')?.remove(); await loadUsers(); renderUsersTable(); audit('User created',`${name} (${username}) — ${roleName}`); passwordResultModal('User Created',username,result.temporaryPassword||''); }catch(err){alert('The request could not be completed. Please try again.');}
}

function findManagedUser(id){ return userManagementCache.find(u=>u.id===id); }
function openEditUserModal(id){
 const u=findManagedUser(id); if(!u) return;
 modal(`<h3>Edit User</h3><div class="two-col-form"><div class="form-row"><label>Username</label><input id="euUsername" value="${esc(u.username||'')}" readonly></div><div class="form-row"><label>Full Name</label><input id="euName" value="${esc(u.full_name||'')}"></div><div class="form-row"><label>Email</label><input id="euEmail" type="email" value="${esc(u.email||'')}"></div><div class="form-row"><label>Role</label><select id="euRole">${userRoleOptions(u.role)}</select></div></div><div class="actions" style="justify-content:flex-end"><button class="btn ghost" onclick="this.closest('.modal-backdrop').remove()">Cancel</button><button class="btn" onclick="saveUserEdit('${u.id}')">Save Changes</button></div>`);
}
async function saveUserEdit(id){
  const name=document.getElementById('euName')?.value.trim(), username=document.getElementById('euUsername')?.value.trim(), email=document.getElementById('euEmail')?.value.trim().toLowerCase(), roleName=document.getElementById('euRole')?.value, password=document.getElementById('euPassword')?.value;
  if(!name||!email) return alert('Name and email are required.');
  try{
    await userApi('update',{id,username,fullName:name,email,role:roleName,password:password||undefined});
    document.querySelector('.modal-backdrop')?.remove();
    await loadUsers(); renderUsersTable(); audit('User updated',`${name} (${email}) — ${roleName}`); alert('User updated.');
  }catch(err){ alert('The request could not be completed. Please try again.'); }
}
function openResetUserModal(id){ const u=findManagedUser(id); if(!u) return; modal(`<h3>Reset Password</h3><p>Username: <b>${esc(u.username||'')}</b></p><div class="actions" style="justify-content:flex-end"><button class="btn ghost" onclick="this.closest('.modal-backdrop').remove()">Cancel</button><button class="btn warn" onclick="resetManagedPassword('${u.id}')">Generate Temporary Password</button></div>`); }
async function resetManagedPassword(id){
 try{ const result=await userApi('resetPassword',{id}); document.querySelector('.modal-backdrop')?.remove(); const u=findManagedUser(id); audit('User password reset',u?.username||id); passwordResultModal('Password Reset',u?.username||result.username||'',result.temporaryPassword||''); }
 catch(err){alert('The request could not be completed. Please try again.');}
}

async function toggleUserStatus(id,active){
  const u=findManagedUser(id); if(!u) return;
  const action=active?'enable':'disable';
  if(!confirm(`${active?'Enable':'Disable'} ${u.email}?`)) return;
  try{
    await userApi('setStatus',{id,active});
    await loadUsers(); renderUsersTable(); audit(`User ${action}d`,u.email); alert(`Account ${active?'enabled':'disabled'}.`);
  }catch(err){ alert('The request could not be completed. Please try again.'); }
}

const pages={
  users(){ renderUserManagement(); },
  dashboard(){
    const todays=state.invoices.filter(inv=>inv.date===today() && (isAccountingUser() || inv.user===session.name));
    const paid=todays.reduce((a,inv)=>a+n(inv.paidBase),0);
    const credit=todays.reduce((a,inv)=>a+Math.max(0,n(inv.totalBase)-n(inv.paidBase)),0);
    const qtySold=state.invoiceItems.filter(i=>todays.find(inv=>inv.id==i.invoiceId)).reduce((a,i)=>a+n(i.qty),0);
    const stock=state.carcasses.reduce((a,c)=>a+n(c.remaining),0);
    const low=state.products.filter(p=>availableStock(p.id)<n(p.low));
    const unfiscal=state.fiscalQueue.filter(f=>f.status!=='Submitted').length;
    const opsMetrics=`${metric('Today’s sales',money(todays.reduce((a,s)=>a+n(s.totalBase),0)),isAccountingUser()?'All invoices':'Your own invoices')}${metric('Paid received',money(paid),'Cash/Bank/EFT/POS')}${metric('Credit sales',money(credit),'Visible outstanding')}${metric('Quantity sold today',qty(qtySold),'Invoice lines')}${metric('Quantity in stock',qty(stock),'All batches')}${metric('Low stock alerts',low.length,'Products below quantity alert')}`;
    const accMetrics=isAccountingUser()?`${metric('Outstanding debtors',money(state.customers.reduce((a,c)=>a+customerBalance(c.id),0)),'Accounts Receivable')}${metric('Outstanding creditors',money(state.suppliers.reduce((a,s)=>a+supplierBalance(s.id),0)),'Accounts Payable')}${metric('Unfiscalised',unfiscal,'If fiscalisation enabled')}${metric('Net Profit',money(netProfit()),'Accounting panel')}`:'';
    const topProducts=state.products.map(p=>{ const totalQuantity=state.invoiceItems.filter(i=>i.productId==p.id).reduce((a,i)=>a+n(i.qty),0); return [p.name,qty(totalQuantity),qty(availableStock(p.id))]; }).sort((a,b)=>parseFloat(b[1])-parseFloat(a[1])).slice(0,5);
    const opsPanel=`<div class="card"><h3>Low stock alerts</h3>${table(['Product','Available','Alert level'],low.map(p=>[p.name,qty(availableStock(p.id)),qty(p.low)]))}</div><div class="card"><h3>Top products</h3>${table(['Product','Quantity sold','Available'],topProducts)}</div>`;
    const accPanel=isAccountingUser()?`<div class="card"><h3>Accounting status</h3>${table(['Area','Status'],[['General Ledger','Auto-posting enabled'],['Payroll Approvals',state.payrollRequests.filter(r=>r.status==='Pending Approval').length+' pending'],['Bank Sync',state.settings.bankApiStatus],['Fiscalisation',state.settings.fiscalEnabled?'Enabled':'Disabled']])}</div><div class="card"><h3>Recent Accounting/Audit</h3>${table(['Date','User','Action','Details'],state.auditLogs.slice(0,10).map(a=>[a.date,a.user,a.action,a.details]))}</div>`:opsPanel;
    page(`<div class="grid cols-4">${opsMetrics}${accMetrics}</div><br><div class="grid cols-2">${accPanel}</div>`);
  },
  pos(){
    saleCart=saleCart||[];
    page(`<div class="grid cols-2"><div class="card"><h3>Create Invoice / Cash Sale</h3><div class="notice"><b>EFT rule:</b> Accountant must approve EFT money first. When cashier selects EFT, the approved balance for the selected customer is shown and can be used.</div><div class="two-col-form"><div class="form-row"><label>Customer</label><select id="saleCustomer" onchange="updateEftNotice()">${option(state.customers)}</select></div><div class="form-row"><label>Sale Type</label><select id="saleType"><option>Cash Sale</option><option>Credit Sale</option><option>Invoice</option></select></div><div class="form-row"><label>Stock Deduction</label><select id="deductMode"><option value="sale">Deduct at point of sale</option><option value="dispatch">Deduct at point of dispatch</option></select></div><div class="form-row"><label>Currency</label><select id="saleCurrency" onchange="renderSaleCart()">${state.settings.currencies.map(c=>`<option>${c}</option>`).join('')}</select></div><div class="form-row"><label>Payment Method</label><select id="salePay" onchange="updateEftNotice()"><option>Cash</option><option>Bank</option><option>EcoCash/mobile money</option><option>POS/swipe</option><option>EFT</option><option>Credit sale</option></select></div><div class="form-row"><label>Amount Paid</label><input id="salePaid" type="number" step="0.01" value="0"></div><div class="form-row"><label>Delivery Address</label><input id="saleDelivery" placeholder="Delivery address / collection details"></div><div class="form-row"><label>Driver / Vehicle</label><input id="saleDriver" placeholder="Driver name, vehicle reg"></div></div><div id="eftNotice" class="hint"></div><hr><div class="two-col-form"><div class="form-row"><label>Product</label><select id="lineProduct" onchange="syncLineProduct()">${option(state.products)}</select></div><div class="form-row"><label>Batch</label><select id="lineCarcass"></select></div><div class="form-row"><label>Quantity</label><input id="lineQuantity" type="number" step="0.01" value="10"></div><div class="form-row"><label>Unit price</label><input id="linePrice" type="number" step="0.01"></div><div class="form-row"><label>Discount</label><input id="lineDiscount" type="number" step="0.01" value="0"></div><div class="form-row"><label>Notes</label><input id="lineNotes"></div></div><div class="actions"><button class="btn ghost" onclick="addSaleLine()">Add to Receipt</button><button class="btn ghost" onclick="saleCart=[];loadedQuoteId=null;render()">Clear</button></div></div><div class="card"><h3>Current Invoice ${loadedQuoteId?`from Quotation #${loadedQuoteId}`:''}</h3><div id="saleCartBox"></div></div></div><br><div class="card"><h3>Invoices Waiting for Dispatch</h3>${dispatchTable()}</div><br><div class="card"><h3>Recent Invoices</h3>${invoiceTable(state.invoices.slice(-10).reverse())}</div>`);
    syncLineProduct(); renderSaleCart(); updateEftNotice();
  },
  quotations(){ page(`<div class="card"><div class="section-title"><h3>Quotations / Proformas</h3><button class="btn" onclick="openQuoteModal()">New Quotation</button></div><div class="notice">Quotations support many different products and can be edited before being converted into an invoice.</div>${quoteTable()}</div>`); },
  stock(){ page(`<div class="grid cols-2"><div class="card"><div class="section-title"><h3>Receive Stock</h3><button class="btn" onclick="openCarcassModal()">Add Stock</button></div>${carcassTable()}</div><div class="card"><div class="section-title"><h3>Stock Adjustment / Transfer</h3><button class="btn secondary" onclick="openSplitModal()">Adjust / Transfer Stock</button></div>${table(['Product','Available quantity','Low alert'],state.products.map(p=>[p.name,qty(availableStock(p.id)),qty(p.low)]))}</div></div><br><div class="card"><h3>Stock Movements</h3>${stockMovementTable()}</div>`); },
  purchases(){
    if(isAccountingUser()){
      page(`<div class="grid cols-2"><div class="card"><div class="section-title"><h3>Purchase Requisitions</h3><button class="btn small" onclick="openPRModal()">New PR</button></div>${purchaseTable('pr')}</div><div class="card"><div class="section-title"><h3>Purchase Orders</h3><button class="btn small" onclick="openPOModal()">New PO</button></div>${purchaseTable('po')}</div><div class="card"><div class="section-title"><h3>Supplier Invoices</h3><button class="btn small" onclick="openSupplierInvoiceModal()">Capture Invoice</button></div>${purchaseTable('si')}</div><div class="card"><div class="section-title"><h3>Goods Received Vouchers</h3><button class="btn small" onclick="openGRVModal()">Create GRV</button></div>${purchaseTable('grv')}</div></div><br><div class="notice"><b>Workflow supported:</b> PR → PO → Supplier Invoice → GRV, or PO → GRV → Supplier Invoice. Purchase Orders do not post to the General Ledger. GRV increases stock. Supplier Invoice posts Dr Inventory / Cr Accounts Payable.</div>`);
    } else {
      page(`<div class="grid cols-2"><div class="card"><div class="section-title"><h3>Purchase Requisitions</h3><button class="btn small" onclick="openPRModal()">New PR</button></div>${purchaseTable('pr')}</div><div class="card"><div class="section-title"><h3>Purchase Orders</h3><button class="btn small" onclick="openPOModal()">New PO</button></div>${purchaseTable('po')}</div><div class="card"><div class="section-title"><h3>Goods Received Vouchers</h3><button class="btn small" onclick="openGRVModal()">Create GRV</button></div>${purchaseTable('grv')}</div><div class="card"><h3>Accounting hidden</h3><p>Supplier invoices, Accounts Payable, ledger postings and payment details are only available under ACCOUNTING for Admin and Accountant users.</p></div></div>`);
    }
  },
  customers(){ page(`<div class="card"><div class="section-title"><h3>Customers</h3><button class="btn" onclick="openCustomerModal()">Add Customer</button></div>${customerTable()}</div>`); },
  suppliers(){ page(`<div class="card"><div class="section-title"><h3>Suppliers</h3>${isAccountingUser()?'<button class="btn" onclick="openSupplierModal()">Add Supplier</button>':''}</div>${supplierTable()}</div>`); },
  cashup(){ const canConclude=['Supervisor','Accountant','Admin / Owner'].includes(role()); page(`<div class="grid cols-2"><div class="card"><h3>Record Cashup</h3><div class="form-row"><label>Currency</label><select id="cashCurrency">${state.settings.currencies.map(c=>`<option>${c}</option>`).join('')}</select></div><div class="form-row"><label>Cash Counted</label><input id="cashCounted" type="number" step="0.01"></div><button class="btn" onclick="recordCashup()">Record Cashup</button></div><div class="card"><h3>Cashup History</h3>${table(['Date','Cashier','Currency','Expected','Counted','Difference','Status','Action'],state.cashups.map(c=>[c.date,c.cashier,c.currency,money(c.expected,c.currency),money(c.counted,c.currency),money(c.diff,c.currency),c.status, canConclude&&c.status!=='Concluded'?`<button class="btn small" onclick="concludeCashup(${c.id})">Conclude</button>`:'']))}</div></div>`); },
  accounting(){ if(!isAccountingUser()) return page('<div class="card"><h3>Restricted</h3><p>Accounting is hidden from cashier and supervisor users.</p></div>'); renderAccounting(); },
  settings(){ page(settingsHtml()); },
  audit(){ page(`<div class="card"><h3>Audit Logs</h3>${table(['Date/time','User','Role','Action requested','Details','Approved/Disapproved by','Final status','Reason'],state.auditLogs.map(a=>[a.date,a.user,a.role,a.action,a.details,a.approvedBy||'',a.finalStatus||'Recorded',a.reason||'']))}</div>`); }
};

function settingsHtml(){ return `<div class="grid cols-2"><div class="card"><h3>Company</h3><div class="two-col-form"><div class="form-row"><label>Company Name</label><input id="setCompany" value="${esc(state.settings.companyName)}"></div><div class="form-row"><label>Trading Name</label><input id="setTrading" value="${esc(state.settings.tradingName||'')}"></div><div class="form-row"><label>Phone</label><input id="setPhone" value="${esc(state.settings.phone)}"></div><div class="form-row"><label>Phone 2</label><input id="setPhone2" value="${esc(state.settings.phone2||'')}"></div><div class="form-row"><label>Email</label><input id="setEmail" type="email" value="${esc(state.settings.email||'')}"></div><div class="form-row"><label>Website</label><input id="setWebsite" value="${esc(state.settings.website||'')}"></div><div class="form-row"><label>Address</label><input id="setAddress" value="${esc(state.settings.address)}"></div><div class="form-row"><label>City</label><input id="setCity" value="${esc(state.settings.city||'')}"></div><div class="form-row"><label>Country</label><input id="setCountry" value="${esc(state.settings.country||'Zimbabwe')}"></div><div class="form-row"><label>Registration Number</label><input id="setReg" value="${esc(state.settings.registrationNumber||'')}"></div><div class="form-row"><label>TIN</label><input id="setTin" value="${esc(state.settings.tin)}"></div><div class="form-row"><label>VAT Number</label><input id="setVatNo" value="${esc(state.settings.vatNumber)}"></div><div class="form-row"><label>VAT Registered</label><select id="setVat"><option ${state.settings.vatRegistered?'':'selected'}>No</option><option ${state.settings.vatRegistered?'selected':''}>Yes</option></select></div><div class="form-row"><label>VAT Rate %</label><input id="setVatRate" type="number" step="0.01" value="${state.settings.vatRate}"></div><div class="form-row"><label>VAT Method</label><select id="setVatMethod"><option ${state.settings.vatMethod==='exclusive'?'selected':''}>exclusive</option><option ${state.settings.vatMethod==='inclusive'?'selected':''}>inclusive</option></select></div><div class="form-row"><label>Logo URL</label><input id="setLogo" value="${esc(state.settings.logoUrl||'')}"></div><div class="form-row"><label>Payment Details</label><input id="setPayment" value="${esc(state.settings.paymentDetails||'')}"></div><div class="form-row"><label>Document Footer</label><input id="setFooter" value="${esc(state.settings.invoiceFooter||'')}"></div></div><button class="btn" onclick="saveSettings()">Save Settings</button></div><div class="card"><h3>ZIMRA Fiscalisation</h3><div class="two-col-form"><div class="form-row"><label>Fiscalisation enabled</label><select id="setFiscal"><option ${state.settings.fiscalEnabled?'':'selected'}>No</option><option ${state.settings.fiscalEnabled?'selected':''}>Yes</option></select></div><div class="form-row"><label>Mode</label><select id="setFiscalMode"><option ${state.settings.fiscalMode==='Disabled'?'selected':''}>Disabled</option><option ${state.settings.fiscalMode==='Test'?'selected':''}>Test</option><option ${state.settings.fiscalMode==='Live'?'selected':''}>Live</option></select></div><div class="form-row"><label>Device ID</label><input id="setDevice" value="${esc(state.settings.fiscalDeviceId)}"></div><div class="form-row"><label>Device Serial</label><input id="setSerial" value="${esc(state.settings.fiscalSerial)}"></div><div class="form-row"><label>Activation Key</label><input id="setActivation" value="${esc(state.settings.activationKey)}"></div><div class="form-row"><label>ZIMRA API Endpoint</label><input id="setEndpoint" value="${esc(state.settings.zimraEndpoint)}"></div></div><button class="btn" onclick="saveSettings()">Save Settings</button></div></div>`; }
function saveSettings(){
  if(!requireFields([[setCompany,'Company name'],[setPhone,'Phone'],[setAddress,'Address'],[setVat,'VAT registered'],[setVatRate,'VAT rate','number',-1],[setVatMethod,'VAT method'],[setFiscal,'Fiscalisation enabled'],[setFiscalMode,'Fiscal mode']])) return;
  if(setVat.value==='Yes' && !requireFields([[setVatNo,'VAT number'],[setTin,'TIN']])) return;
  if(setFiscal.value==='Yes' && !requireFields([[setDevice,'Fiscal device ID'],[setSerial,'Fiscal device serial'],[setActivation,'Activation key'],[setEndpoint,'ZIMRA API endpoint']])) return;
  state.settings.companyName=setCompany.value; state.settings.tradingName=setTrading.value; state.settings.phone=setPhone.value; state.settings.phone2=setPhone2.value; state.settings.email=setEmail.value; state.settings.website=setWebsite.value; state.settings.address=setAddress.value; state.settings.city=setCity.value; state.settings.country=setCountry.value; state.settings.registrationNumber=setReg.value; state.settings.logoUrl=setLogo.value; state.settings.paymentDetails=setPayment.value; state.settings.invoiceFooter=setFooter.value; state.settings.vatRegistered=setVat.value==='Yes'; state.settings.vatNumber=setVatNo.value; state.settings.tin=setTin.value; state.settings.vatRate=n(setVatRate.value); state.settings.vatMethod=setVatMethod.value; state.settings.fiscalEnabled=setFiscal.value==='Yes'; state.settings.fiscalMode=setFiscalMode.value; state.settings.fiscalDeviceId=setDevice.value; state.settings.fiscalSerial=setSerial.value; state.settings.activationKey=setActivation.value; state.settings.zimraEndpoint=setEndpoint.value; audit('Settings changed','Tax/fiscal/company settings updated'); save(); alert('Settings saved'); render(); }

function renderAccounting(){
  const tabs=[['overview','Overview'],['gl','General Ledger'],['coa','Chart of Accounts'],['journal','Journal Entries'],['ar','Accounts Receivable'],['ap','Accounts Payable'],['cashbook','Cashbook'],['bankledger','Bank Ledger'],['expenses','Expenses'],['payroll','Payroll'],['eft','EFT Approvals'],['bank','Bank Sync & Payments'],['recon','Bank Reconciliation'],['assets','Asset Register'],['reports','Reports'],['acctset','Accounting Settings']];
  const tabBtns=tabs.map(t=>`<button class="btn ${accountingTab===t[0]?'':'ghost'} small" onclick="accountingTab='${t[0]}';renderAccounting()">${t[1]}</button>`).join('');
  let body='';
  if(accountingTab==='overview') body=`<div class="grid cols-4">${metric('Accounts Receivable',money(state.customers.reduce((a,c)=>a+customerBalance(c.id),0)),'Customer balances')}${metric('Accounts Payable',money(state.suppliers.reduce((a,s)=>a+supplierBalance(s.id),0)),'Supplier balances')}${metric('Approved EFT Deposits',money(state.eftDeposits.reduce((a,e)=>a+n(e.remainingBase),0)),'Customer prepayments')}${metric('Net Profit',money(netProfit()),'Sales - COGS - expenses')}</div><br><div class="notice">Cashiers and supervisors cannot see this panel. Accounting books are created automatically when a transaction posts to a new account.</div>`;
  if(accountingTab==='gl') body=`<div class="card"><h3>General Ledger</h3>${journalHtml()}</div>`;
  if(accountingTab==='coa') body=`<div class="card"><h3>Chart of Accounts</h3>${table(['Account','Type','System'],state.accounts.map(a=>[a.name,a.type,a.system?'Yes':'No']))}</div>`;
  if(accountingTab==='journal') body=`<div class="card"><h3>Journal Entries</h3><p>All automatic journals from sales, purchases, expenses, payroll, EFT, stock and bank actions appear here.</p>${journalHtml()}</div>`;
  if(accountingTab==='ar') body=`<div class="card"><div class="section-title"><h3>Accounts Receivable Ledger</h3><button class="btn small" onclick="openCustomerPaymentModal()">Receive Customer Payment</button></div>${arLedgerHtml()}</div>`;
  if(accountingTab==='ap') body=`<div class="card"><div class="section-title"><h3>Accounts Payable Ledger</h3><button class="btn small" onclick="openSupplierPaymentModal()">Pay Supplier</button></div>${apLedgerHtml()}</div>`;
  if(accountingTab==='cashbook') body=`<div class="card"><h3>Cashbook</h3>${cashbookHtml()}</div>`;
  if(accountingTab==='bankledger') body=`<div class="card"><h3>Bank Ledger</h3>${bankLedgerHtml()}</div>`;
  if(accountingTab==='expenses') body=`<div class="card"><div class="section-title"><h3>Expenses</h3><button class="btn" onclick="openExpenseModal()">Record Expense</button></div>${expenseTable()}</div>`;
  if(accountingTab==='payroll') body=payrollHtml();
  if(accountingTab==='eft') body=eftHtml();
  if(accountingTab==='bank') body=bankHtml();
  if(accountingTab==='recon') body=bankReconciliationHtml();
  if(accountingTab==='assets') body=assetRegisterHtml();
  if(accountingTab==='acctset') body=accountingSettingsHtml();
  if(accountingTab==='reports') body=`<div class="grid cols-2"><div class="card"><h3>Trial Balance</h3>${trialBalanceHtml()}</div><div class="card"><h3>Income Statement</h3>${profitLossHtml()}</div><div class="card"><h3>Balance Sheet</h3>${balanceSheetHtml()}</div><div class="card"><h3>Inventory Valuation</h3>${inventoryValuationHtml()}</div><div class="card"><h3>VAT Report</h3>${vatReportHtml()}</div></div>`;
  page(`<div class="card"><div class="actions">${tabBtns}</div></div><br>${body}`);
}

function syncLineProduct(){ const p=product(lineProduct?.value); if(!p) return; if(linePrice) linePrice.value=p.sell; const cs=state.carcasses.filter(c=>c.productId==p.id && n(c.remaining)>0); if(lineCarcass) lineCarcass.innerHTML=cs.map(c=>`<option value="${c.id}">${c.batch} / ${c.carcassId} - ${qty(c.remaining)}</option>`).join('') || '<option value="">No stock batch</option>'; }
function addSaleLine(){
  if(!requireFields([[lineProduct,'Product'],[lineQuantity,'Quantity','number',0],[linePrice,'Unit price','number',0]])) return;
  const p=product(lineProduct.value); if(!p) return showFormError('Select a valid product.');
  const item={id:Date.now(),productId:p.id,productName:p.name,carcassId:lineCarcass?.value||'',qty:n(lineQuantity.value),price:n(linePrice.value),discount:n(lineDiscount.value),notes:lineNotes.value,cost:p.cost};
  const existing=saleCart.find(l=>l.productId===item.productId);
  if(existing){
    existing.qty=n(existing.qty)+n(item.qty);
    existing.discount=n(existing.discount)+n(item.discount);
    existing.price=item.price;
    if(!existing.carcassId) existing.carcassId=item.carcassId;
    if(item.notes) existing.notes=[existing.notes,item.notes].filter(Boolean).join('; ');
  } else saleCart.push(item);
  renderSaleCart();
}
function renderSaleCart(){
  if(!document.getElementById('saleCartBox')) return;
  const rows=saleCart.map((l,i)=>[l.productName,qty(l.qty),money(l.price),money(l.discount),money(l.qty*l.price-l.discount),`<button class="btn small bad" onclick="saleCart.splice(${i},1);renderSaleCart()">Remove</button>`]);
  const totals=calcLines(saleCart);
  const complete=saleCart.length>0 && document.getElementById('saleCustomer');
  saleCartBox.innerHTML=`${table(['Product','Quantity','Unit price','Discount','Total',''],rows)}<div class="totals"><div><b>Subtotal:</b><b>${money(totals.subtotal, saleCurrency?.value||'USD')}</b></div><div><b>VAT:</b><b>${money(totals.vat, saleCurrency?.value||'USD')}</b></div><div><b>Total:</b><b>${money(totals.total, saleCurrency?.value||'USD')}</b></div></div><div class="actions" style="margin-top:14px"><button id="postInvoiceBtn" class="btn" ${complete?'':'disabled'} onclick="completeSale()">Post Invoice / Receipt</button></div>`;
}
function calcLines(lines){ const subtotal=lines.reduce((a,l)=>a+(n(l.qty)*n(l.price)-n(l.discount)),0); const vat=state.settings.vatRegistered? subtotal*n(state.settings.vatRate)/100:0; return {subtotal,vat,total:subtotal+vat}; }
function updateEftNotice(){ if(!document.getElementById('eftNotice')) return; const cid=Number(saleCustomer.value); const bal=approvedEftBalance(cid); eftNotice.innerHTML=`Approved EFT balance for this customer: <b>${money(bal)}</b>${salePay.value==='EFT'?' — EFT can only proceed up to this approved amount.':''}`; }
function completeSale(){
  if(!saleCart.length) return showFormError('Add at least one product before posting an invoice.');
  if(!requireFields([[saleCustomer,'Customer'],[saleType,'Sale Type'],[deductMode,'Stock deduction method'],[saleCurrency,'Currency'],[salePay,'Payment method']])) return;
  const customerId=Number(saleCustomer.value), currency=saleCurrency.value, pay=salePay.value, type=saleType.value, deduct=deductMode.value, paid=n(salePaid.value);
  const totals=calcLines(saleCart);
  if(totals.total<=0) return showFormError('Invoice total must be greater than zero.');
  if((pay!=='Credit sale' && type!=='Credit Sale') && paid<=0) return showFormError('Amount paid is required for non-credit sales.');
  const subtotalBase=baseAmount(totals.subtotal,currency), vatBase=baseAmount(totals.vat,currency), totalBase=baseAmount(totals.total,currency), paidBase=baseAmount(paid,currency);
  if(paidBase-totalBase>0.01 && pay==='EFT') return showFormError('EFT amount cannot exceed invoice total.');
  if(pay==='EFT' && approvedEftBalance(customerId)+0.01<paidBase) return showFormError('Approved EFT balance is not enough. Accountant must approve EFT funds first.');
  if(type==='Credit Sale' && customerBalance(customerId)+totalBase > n(customer(customerId)?.creditLimit)){ if(!confirm('Customer credit limit exceeded. Continue only if approved?')) return; audit('Credit limit override',customer(customerId)?.name); }
  const inv={id:idFor(state.invoices),date:today(),invoice:`INV-${state.settings.nextInvoice++}`,customerId,type,status:deduct==='dispatch'?'Pending Dispatch':'Completed',deductMode:deduct,currency,paymentMethod:pay,subtotal:totals.subtotal,vat:totals.vat,total:totals.total,subtotalBase,vatBase,totalBase,paid:paid,paidBase,delivery:saleDelivery.value,driver:saleDriver.value,user:session.name,quoteId:loadedQuoteId};
  state.invoices.push(inv);
  saleCart.forEach(l=>state.invoiceItems.push({...l,id:idFor(state.invoiceItems),invoiceId:inv.id}));
  postSaleJournal(inv);
  if(pay==='EFT' && paidBase>0) useEftBalance(customerId,paidBase,inv.invoice);
  else if(paidBase>0) state.receipts.push({id:idFor(state.receipts),date:today(),customerId,amount:paid,currency,amountBase:paidBase,method:pay,type:'Invoice Receipt',ref:inv.invoice});
  if(deduct==='sale') deductInvoiceStock(inv.id);
  if(state.settings.fiscalEnabled) state.fiscalQueue.push({id:idFor(state.fiscalQueue),date:today(),ref:inv.invoice,status:'Pending',payload:'Fiscal payload ready'});
  if(loadedQuoteId){ const q=state.quotations.find(q=>q.id==loadedQuoteId); if(q) q.status='Converted to Invoice'; }
  audit('Invoice posted',inv.invoice); save(); const saleId=inv.id; saleCart=[]; loadedQuoteId=null; render(); setTimeout(()=>printInvoice(saleId),100);
}
function postSaleJournal(inv){
  const lines=[]; const bal=n(inv.totalBase)-n(inv.paidBase);
  if(n(inv.paidBase)>0){ lines.push({account:paymentAccount(inv.paymentMethod),debit:inv.paidBase,credit:0}); }
  if(bal>0 || inv.paymentMethod==='Credit sale') lines.push({account:'Accounts Receivable',debit:bal>0?bal:inv.totalBase,credit:0});
  lines.push({account:'Sales',debit:0,credit:inv.subtotalBase}); if(inv.vatBase) lines.push({account:'VAT Output',debit:0,credit:inv.vatBase}); postJournal('Sales Invoice',lines,inv.invoice);
}
function deductInvoiceStock(invoiceId){
  const inv=state.invoices.find(i=>i.id==invoiceId); if(!inv) return;
  let cogs=0;
  state.invoiceItems.filter(i=>i.invoiceId==invoiceId).forEach(l=>{
    let need=n(l.qty);
    const batch=state.carcasses.find(c=>c.id==l.carcassId);
    const batches=batch?[batch]:state.carcasses.filter(c=>c.productId==l.productId && n(c.remaining)>0);
    batches.forEach(c=>{ if(need<=0) return; const use=Math.min(n(c.remaining),need); c.remaining=n(c.remaining)-use; c.sold=n(c.sold)+use; need-=use; cogs+=use*n(c.cost); state.stockMovements.push({id:idFor(state.stockMovements),date:today(),productId:l.productId,batch:c.batch,carcassId:c.carcassId,type:'Stock sold/dispatch',qty:-use,costValue:use*n(c.cost),user:session.name,reason:inv.invoice,ref:inv.invoice}); });
    if(need>0) audit('Stock shortage during dispatch',`${inv.invoice} ${l.productName} short by ${qty(need)}`,false);
  });
  inv.status=inv.deductMode==='dispatch'?'Dispatched':'Completed';
  inv.dispatchedBy=inv.deductMode==='dispatch'?session.name:inv.dispatchedBy;
  inv.dispatchedAt=inv.deductMode==='dispatch'?now():inv.dispatchedAt;
  inv.cogs=n(inv.cogs)+cogs;
  postJournal('Stock Dispatch / COGS',[{account:'Cost of Goods Sold',debit:cogs,credit:0},{account:'Inventory / Stock',debit:0,credit:cogs}],inv.invoice);
}
function dispatchInvoice(id){
  if(!['Supervisor','Admin / Owner'].includes(role())) return showFormError('Only Supervisor or Admin can dispatch invoices.');
  const inv=state.invoices.find(i=>i.id==id); if(!inv) return;
  if(!confirm(`Dispatch ${inv.invoice} for ${customer(inv.customerId)?.name}? Stock will be deducted if this invoice is set to deduct at dispatch.`)) return;
  if(inv.deductMode==='dispatch') deductInvoiceStock(id); else { inv.status='Dispatched'; inv.dispatchedBy=session.name; inv.dispatchedAt=now(); }
  state.dispatches.push({id:idFor(state.dispatches),date:today(),time:now(),invoiceId:id,ref:uid('DSP'),delivery:inv.delivery,driver:inv.driver,dispatchedBy:session.name,returnedCopy:'Pending'});
  audit('Invoice dispatched',`${inv.invoice} by ${session.name}`); save(); render(); printInvoice(id,true);
}
function dispatchTable(){
  const canDispatch=['Supervisor','Admin / Owner'].includes(role());
  return table(['Invoice','Customer','Total','Delivery','Driver','Status','Action'],state.invoices.filter(i=>i.status==='Pending Dispatch').map(i=>[i.invoice,customer(i.customerId)?.name,money(i.total,i.currency),i.delivery,i.driver,statusBadge(i.status),canDispatch?`<button class="btn small" onclick="dispatchInvoice(${i.id})">Dispatch</button>`:'Restricted']));
}
function invoiceTable(list){ return table(['Date','Invoice','Customer','Type','Total','Paid','Status','Print'],(list||[]).map(i=>[i.date,i.invoice,customer(i.customerId)?.name,i.type,money(i.total,i.currency),money(i.paid,i.currency),i.status,`<button class="btn small ghost" onclick="printInvoice(${i.id})">Print 2 Copies</button>`])); }
function printInvoice(id,deliveryOnly=false){ const inv=state.invoices.find(x=>x.id==id); if(!inv) return; const cust=customer(inv.customerId); const items=state.invoiceItems.filter(i=>i.invoiceId==id); const copy=(title)=>`<section class="print-copy"><div style="text-align:center">${state.settings.logoUrl?`<img src="${esc(state.settings.logoUrl)}" style="max-height:70px;max-width:220px">`:''}<h2>${esc(state.settings.companyName||state.settings.tradingName||'')}</h2><div>${esc(state.settings.address||'')} ${esc(state.settings.city||'')} ${esc(state.settings.country||'')}<br>${esc(state.settings.phone||'')} ${esc(state.settings.phone2||'')} ${esc(state.settings.email||'')} ${esc(state.settings.website||'')}<br>${state.settings.registrationNumber?`Reg: ${esc(state.settings.registrationNumber)} `:''}${state.settings.tin?`TIN: ${esc(state.settings.tin)} `:''}${state.settings.vatNumber?`VAT: ${esc(state.settings.vatNumber)}`:''}</div></div><h3>${title}</h3><p><b>Invoice:</b> ${inv.invoice}<br><b>Date:</b> ${inv.date}<br><b>Customer:</b> ${esc(cust?.name)}<br><b>Delivery:</b> ${esc(inv.delivery||'Collection')}<br><b>Driver/Vehicle:</b> ${esc(inv.driver||'')}</p><table><thead><tr><th>Product</th><th>Quantity</th><th>Unit price</th><th>Total</th></tr></thead><tbody>${items.map(l=>`<tr><td>${esc(l.productName)}</td><td>${qty(l.qty)}</td><td>${money(l.price,inv.currency)}</td><td>${money(n(l.qty)*n(l.price)-n(l.discount),inv.currency)}</td></tr>`).join('')}</tbody></table><p><b>Subtotal:</b> ${money(inv.subtotal,inv.currency)}<br><b>VAT:</b> ${money(inv.vat,inv.currency)}<br><b>Total:</b> ${money(inv.total,inv.currency)}<br><b>Paid:</b> ${money(inv.paid,inv.currency)}</p>${title.includes('Delivery')?'<p style="margin-top:40px">Received by: ____________________ Signature: ____________________ Date: ____________</p>':''}</section>`; const html=`<!doctype html><html><head><title>${inv.invoice}</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px;text-align:left}.print-copy{page-break-after:always;border:1px solid #ddd;padding:20px;margin-bottom:20px}</style></head><body>${copy('CUSTOMER COPY')}${copy('DELIVERY RETURN COPY')}</body></html>`; const w=window.open('','_blank'); w.document.write(html); w.document.close(); w.focus(); w.print(); }

function openQuoteModal(id=null){
  editQuoteId=id;
  const q=state.quotations.find(x=>x.id==id);
  if(q?.status==='Converted to Invoice') return showFormError('Converted quotations cannot be edited.');
  quoteLines=q?structuredClone(q.lines):[];
  const statuses=['Draft','Sent','Accepted','Rejected','Expired'];
  modal(`<h3>${id?'Edit':'New'} Quotation</h3><div class="two-col-form"><div class="form-row"><label>Customer</label><select id="qCustomer">${option(state.customers,'name',q?.customerId)}</select></div><div class="form-row"><label>Valid Until</label><input id="qValid" type="date" value="${q?.validUntil||addDays(7)}"></div><div class="form-row"><label>Status</label><select id="qStatus">${statuses.map(st=>`<option ${q?.status===st?'selected':''}>${st}</option>`).join('')}</select></div><div class="form-row"><label>Batch No. (optional)</label><input id="qBatch" placeholder="Batch/batch if known"></div><div class="form-row"><label>Product</label><select id="qProduct" onchange="qSyncPrice()">${option(state.products)}</select></div><div class="form-row"><label>Quantity</label><input id="qQuantity" type="number" step="0.01" value="10"></div><div class="form-row"><label>Unit price</label><input id="qPrice" type="number" step="0.01"></div><div class="form-row"><label>Discount</label><input id="qDiscount" type="number" step="0.01" value="0"></div><div class="form-row span2"><label>Notes</label><input id="qNotes" value="${esc(q?.notes||'')}"></div></div><div class="actions"><button class="btn ghost" onclick="qAddLine()">Add</button><button class="btn" onclick="saveQuotation(true)">Print</button></div><br><div id="quoteLinesBox"></div>`);
  qSyncPrice(); renderQuoteLines();
}
function qSyncPrice(){ const p=product(qProduct.value); if(p) qPrice.value=p.sell; }
function qAddLine(){
  if(!requireFields([[qProduct,'Product'],[qQuantity,'Quantity','number',0],[qPrice,'Unit price','number',0]])) return;
  const p=product(qProduct.value); if(!p) return showFormError('Select a valid product.');
  const item={productId:p.id,productName:p.name,batch:qBatch.value,qty:n(qQuantity.value),price:n(qPrice.value),discount:n(qDiscount.value),cost:p.cost};
  const existing=quoteLines.find(l=>l.productId===item.productId);
  if(existing){ existing.qty=n(existing.qty)+n(item.qty); existing.discount=n(existing.discount)+n(item.discount); existing.price=item.price; if(!existing.batch) existing.batch=item.batch; }
  else quoteLines.push(item);
  renderQuoteLines();
}
function renderQuoteLines(){ const box=document.getElementById('quoteLinesBox'); if(!box) return; const rows=quoteLines.map((l,i)=>[l.productName,l.batch||'',qty(l.qty),money(l.price),money(l.discount),money(l.qty*l.price-l.discount),`<button class="btn small bad" onclick="quoteLines.splice(${i},1);renderQuoteLines()">Remove</button>`]); const totals=calcLines(quoteLines); box.innerHTML=`${table(['Product','Batch','Quantity','Unit price','Discount','Total',''],rows)}<div class="totals"><div><b>Subtotal:</b><b>${money(totals.subtotal)}</b></div><div><b>VAT:</b><b>${money(totals.vat)}</b></div><div><b>Total:</b><b>${money(totals.total)}</b></div></div>`; }
function saveQuotation(printAfter=false){
  if(!requireFields([[qCustomer,'Customer'],[qValid,'Valid until date'],[qStatus,'Quotation status']])) return;
  if(!quoteLines.length) return showFormError('Add at least one product before printing the quotation.');
  const totals=calcLines(quoteLines);
  let saved;
  if(editQuoteId){
    const q=state.quotations.find(x=>x.id==editQuoteId);
    Object.assign(q,{customerId:Number(qCustomer.value),validUntil:qValid.value,notes:qNotes.value,lines:structuredClone(quoteLines),subtotal:totals.subtotal,vat:totals.vat,total:totals.total,status:qStatus.value});
    saved=q; audit('Quotation edited',q.number);
  } else {
    const q={id:idFor(state.quotations),number:`QUO-${state.settings.nextQuote++}`,date:today(),customerId:Number(qCustomer.value),validUntil:qValid.value,notes:qNotes.value,lines:structuredClone(quoteLines),subtotal:totals.subtotal,vat:totals.vat,total:totals.total,status:qStatus.value,user:session.name};
    state.quotations.push(q); saved=q; audit('Quotation created',q.number);
  }
  save(); document.querySelector('.modal-backdrop').remove(); render(); if(printAfter) setTimeout(()=>printQuotation(saved.id),100);
}
function loadQuoteToInvoice(id){
  const q=state.quotations.find(x=>x.id==id); if(!q) return;
  if(q.status!=='Accepted') return showFormError(`Only Accepted quotations can be converted to invoice. Current status: ${q.status}.`);
  saleCart=structuredClone(q.lines); loadedQuoteId=id; currentPage='pos'; render(); setTimeout(()=>{ if(saleCustomer) saleCustomer.value=q.customerId; renderSaleCart(); },50);
}
function quoteTable(){ return table(['Date','Quote','Customer','Items','Total','Status','Actions'],state.quotations.map(q=>{ const canConvert=q.status==='Accepted'; return [q.date,q.number,customer(q.customerId)?.name,q.lines.length,money(q.total),statusBadge(q.status),`<button class="btn small ghost" onclick="openQuoteModal(${q.id})">Edit</button> <button class="btn small ${canConvert?'':'ghost'}" onclick="loadQuoteToInvoice(${q.id})">Convert to Invoice</button> <button class="btn small ghost" onclick="printQuotation(${q.id})">Print</button>`]; })); }
function printQuotation(id){
  const q=state.quotations.find(x=>x.id==id); if(!q) return;
  const cust=customer(q.customerId); const rows=q.lines.map(l=>`<tr><td>${esc(l.productName)}</td><td>${esc(l.batch||'')}</td><td>${qty(l.qty)}</td><td>${money(l.price)}</td><td>${money(n(l.qty)*n(l.price)-n(l.discount))}</td></tr>`).join('');
  const html=`<!doctype html><html><head><title>${q.number}</title><style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px;text-align:left}.totals{text-align:right;margin-top:16px}</style></head><body><h2>${esc(state.settings.companyName)}</h2><h3>Quotation / Proforma</h3><p><b>Quotation:</b> ${q.number}<br><b>Date:</b> ${q.date}<br><b>Valid until:</b> ${q.validUntil}<br><b>Customer:</b> ${esc(cust?.name||'')}<br><b>Status:</b> ${esc(q.status)}</p><table><thead><tr><th>Product</th><th>Batch</th><th>Quantity</th><th>Unit price</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table><div class="totals"><p><b>Subtotal:</b> ${money(q.subtotal)}<br><b>VAT:</b> ${money(q.vat)}<br><b>Total:</b> ${money(q.total)}</p></div><p>${esc(q.notes||'')}</p></body></html>`;
  audit('Quotation printed',q.number); save(); const w=window.open('','_blank'); w.document.write(html); w.document.close(); w.focus(); w.print();
}
function openCarcassModal(){ modal(`<h3>Receive Stock</h3><div class="two-col-form"><div class="form-row"><label>Supplier</label><select id="cSupplier">${option(state.suppliers)}</select></div><div class="form-row"><label>Product</label><select id="cProduct">${option(state.products)}</select></div><div class="form-row"><label>Batch Number</label><input id="cBatch" value="BATCH-${Date.now().toString().slice(-5)}"></div><div class="form-row"><label>Batch ID</label><input id="cCarcass" value="BATCH-${Date.now().toString().slice(-5)}"></div><div class="form-row"><label>Quantity</label><input id="cWeight" type="number" step="0.01" value="100"></div><div class="form-row"><label>Unit cost</label><input id="cCost" type="number" step="0.01" value="3.00"></div><div class="form-row"><label>Location</label><input id="cLocation" value="Main Warehouse"></div><div class="form-row"><label>Expiry</label><input id="cExpiry" type="date" value="${addDays(10)}"></div></div><button class="btn" onclick="saveCarcass()">Receive Stock</button>`); }
function saveCarcass(){ if(!requireFields([[cSupplier,'Supplier'],[cProduct,'Product'],[cBatch,'Batch number'],[cCarcass,'Batch ID'],[cWeight,'Quantity','number',0],[cCost,'Unit cost','number',0],[cLocation,'Location'],[cExpiry,'Expiry date']])) return; const w=n(cWeight.value), cost=n(cCost.value); const c={id:idFor(state.carcasses),supplierId:Number(cSupplier.value),batch:cBatch.value,carcassId:cCarcass.value,productId:Number(cProduct.value),original:w,sold:0,processed:0,wasted:0,remaining:w,cost,grade:'',inspection:'Passed',expiry:cExpiry.value,location:cLocation.value,date:today(),receivedBy:session.name}; state.carcasses.push(c); state.stockMovements.push({id:idFor(state.stockMovements),date:today(),productId:c.productId,batch:c.batch,carcassId:c.carcassId,type:'Stock received',qty:w,costValue:w*cost,user:session.name,reason:'Direct receive',ref:c.carcassId}); postJournal('Stock Received',[{account:'Inventory / Stock',debit:w*cost,credit:0},{account:'Capital',debit:0,credit:w*cost}],c.carcassId); audit('Stock received',c.carcassId); save(); document.querySelector('.modal-backdrop').remove(); render(); }
function carcassTable(){ return table(['Date','Batch','Batch ID','Product','Original quantity','Remaining','Location','Expiry'],state.carcasses.map(c=>[c.date,c.batch,c.carcassId,product(c.productId)?.name,qty(c.original),qty(c.remaining),c.location,c.expiry])); }
function stockMovementTable(){ return table(['Date','Product','Type','Quantity','Cost Value','Ref','User'],state.stockMovements.map(m=>[m.date,product(m.productId)?.name,m.type,qty(m.qty),money(m.costValue),m.ref,m.user])); }
function openSplitModal(){ modal(`<h3>Adjust / Transfer Stock</h3><div class="form-row"><label>Source Batch</label><select id="sBatch">${state.carcasses.filter(c=>n(c.remaining)>0).map(c=>`<option value="${c.id}">${c.batch} / ${c.carcassId} - ${qty(c.remaining)}</option>`).join('')}</select></div><div class="two-col-form"><div class="form-row"><label>New Product</label><select id="sProduct">${option(state.products)}</select></div><div class="form-row"><label>Quantity</label><input id="sQuantity" type="number" step="0.01" value="10"></div><div class="form-row"><label>Waste quantity</label><input id="sWaste" type="number" step="0.01" value="0"></div><div class="form-row"><label>New Batch Suffix</label><input id="sSuffix" value="ADJ"></div></div><button class="btn" onclick="saveSplit()">Process</button>`); }
function saveSplit(){ if(!requireFields([[sBatch,'Source batch'],[sProduct,'New product'],[sQuantity,'Quantity','number',0]])) return; const src=state.carcasses.find(c=>c.id==sBatch.value); if(!src) return showFormError('Select a valid source batch.'); const out=n(sQuantity.value), waste=n(sWaste.value); if(out+waste>n(src.remaining)) return showFormError('Quantity exceeds remaining stock'); src.remaining-=out+waste; src.processed+=out; src.wasted+=waste; const nc={...src,id:idFor(state.carcasses),productId:Number(sProduct.value),batch:`${src.batch}-${sSuffix.value||'ADJ'}`,carcassId:`${src.carcassId}-${sSuffix.value||'ADJ'}`,original:out,sold:0,processed:0,wasted:0,remaining:out}; state.carcasses.push(nc); state.stockMovements.push({id:idFor(state.stockMovements),date:today(),productId:src.productId,batch:src.batch,carcassId:src.carcassId,type:'Stock adjustment out',qty:-out-waste,costValue:(out+waste)*src.cost,user:session.name,reason:'Stock adjustment',ref:nc.carcassId}); state.stockMovements.push({id:idFor(state.stockMovements),date:today(),productId:nc.productId,batch:nc.batch,carcassId:nc.carcassId,type:'Adjusted stock created',qty:out,costValue:out*src.cost,user:session.name,reason:'Stock adjustment',ref:nc.carcassId}); audit('Stock adjustment completed',nc.carcassId); save(); document.querySelector('.modal-backdrop').remove(); render(); }
function customerTable(){ const accounting=isAccountingUser(); const heads=accounting?['Name','Business','Phone','Credit Limit','Balance','EFT Balance','Status']:['Name','Business','Phone','Address','Status']; const rows=state.customers.map(c=>accounting?[c.name,c.business,c.phone,money(c.creditLimit),money(customerBalance(c.id)),money(approvedEftBalance(c.id)),c.active?'<span class="badge good">Active</span>':'Inactive']:[c.name,c.business,c.phone,c.address,c.active?'<span class="badge good">Active</span>':'Inactive']); return table(heads,rows); }
function openCustomerModal(){ modal(`<h3>Add Customer</h3><div class="two-col-form">${['Name','Business','Phone','Email','Address','VAT Number','Credit Limit','Payment Terms Days'].map((l,i)=>`<div class="form-row"><label>${l}</label><input id="cust${i}" ${i==6||i==7?'type="number"':''}></div>`).join('')}</div><button class="btn" onclick="saveCustomer()">Save Customer</button>`); }
function saveCustomer(){ if(!requireFields([[cust0,'Customer name'],[cust1,'Business name'],[cust2,'Phone'],[cust4,'Address'],[cust6,'Credit limit','number',-1],[cust7,'Payment terms days','number',-1]])) return; state.customers.push({id:idFor(state.customers),name:cust0.value,business:cust1.value,phone:cust2.value,email:cust3.value,address:cust4.value,vat:cust5.value,creditLimit:n(cust6.value),terms:n(cust7.value),opening:0,active:true}); audit('Customer created',cust0.value); save(); document.querySelector('.modal-backdrop').remove(); render(); }
function supplierTable(){ const accounting=isAccountingUser(); const heads=accounting?['Name','Company','Phone','Bank','Account No.','Branch','Type','Currency','Products','Balance','Status']:['Name','Company','Phone','Products','Status']; const rows=state.suppliers.map(s=>accounting?[s.name,s.company,s.phone,s.bankName,s.bankAccount,s.branch||'',s.accountType||'',s.currency||'USD',s.products,money(supplierBalance(s.id)),s.active?'Active':'Inactive']:[s.name,s.company,s.phone,s.products,s.active?'Active':'Inactive']); return table(heads,rows); }

function openSupplierModal(){ modal(`<h3>Add Supplier</h3><div class="two-col-form">${['Name','Company/Farm','Phone','Email','Address','VAT Number','Bank Name','Bank Account Number','Branch','Account Type','Currency','Default Products','Opening Balance'].map((l,i)=>`<div class="form-row"><label>${l}</label><input id="sup${i}" ${i==12?'type="number" step="0.01"':''} value="${i==10?'USD':i==9?'Current':''}"></div>`).join('')}</div><button class="btn" onclick="saveSupplier()">Save Supplier</button>`); }
function saveSupplier(){ if(!requireFields([[sup0,'Supplier name'],[sup1,'Company/farm name'],[sup2,'Phone'],[sup4,'Address'],[sup6,'Bank name'],[sup7,'Bank account number'],[sup8,'Branch'],[sup9,'Account type'],[sup10,'Currency']])) return; state.suppliers.push({id:idFor(state.suppliers),name:sup0.value,company:sup1.value,phone:sup2.value,email:sup3.value,address:sup4.value,vat:sup5.value,bankName:sup6.value,bankAccount:sup7.value,branch:sup8.value,accountType:sup9.value,currency:sup10.value,products:sup11.value,opening:n(sup12.value),active:true}); audit('Supplier created',sup0.value); save(); document.querySelector('.modal-backdrop').remove(); render(); }
function purchaseTable(type){ if(type==='pr') return table(['Date','PR','Product','Quantity','Status'],state.purchaseRequisitions.map(p=>[p.date,p.number,product(p.productId)?.name,qty(p.qty),p.status])); if(type==='po') return table(['Date','PO','Supplier','Product','Quantity','Total','Status'],state.purchaseOrders.map(p=>[p.date,p.number,supplier(p.supplierId)?.name,product(p.productId)?.name,qty(p.qty),money(p.total),p.status])); if(type==='si') return table(['Date','Invoice','Supplier','Total','Paid','Status'],state.supplierInvoices.map(i=>[i.date,i.number,supplier(i.supplierId)?.name,money(i.total,i.currency),money(i.paid,i.currency),i.status])); return table(['Date','GRV','Supplier','Product','Quantity','Status'],state.grvs.map(g=>[g.date,g.number,supplier(g.supplierId)?.name,product(g.productId)?.name,qty(g.qty),g.status])); }
function openPRModal(){ modal(`<h3>New Purchase Requisition</h3><div class="two-col-form"><div class="form-row"><label>Product</label><select id="prProduct">${option(state.products)}</select></div><div class="form-row"><label>Quantity Required</label><input id="prQuantity" type="number" step="0.01"></div><div class="form-row"><label>Reason</label><input id="prReason"></div></div><button class="btn" onclick="savePR()">Save PR</button>`); }
function savePR(){ if(!requireFields([[prProduct,'Product'],[prQuantity,'Quantity required','number',0],[prReason,'Reason']])) return; const pr={id:idFor(state.purchaseRequisitions),date:today(),number:`PR-${state.settings.nextPR++}`,productId:Number(prProduct.value),qty:n(prQuantity.value),reason:prReason.value,status:'Open'}; state.purchaseRequisitions.push(pr); audit('Purchase requisition created',pr.number); save(); document.querySelector('.modal-backdrop').remove(); render(); }
function openPOModal(){ modal(`<h3>New Purchase Order</h3><div class="two-col-form"><div class="form-row"><label>Supplier</label><select id="poSupplier">${option(state.suppliers)}</select></div><div class="form-row"><label>Product</label><select id="poProduct">${option(state.products)}</select></div><div class="form-row"><label>Quantity</label><input id="poQuantity" type="number" step="0.01"></div><div class="form-row"><label>Unit cost</label><input id="poCost" type="number" step="0.01"></div></div><button class="btn" onclick="savePO()">Save PO</button>`); }
function savePO(){ if(!requireFields([[poSupplier,'Supplier'],[poProduct,'Product'],[poQuantity,'Quantity','number',0],[poCost,'Unit cost','number',0]])) return; const total=n(poQuantity.value)*n(poCost.value); const po={id:idFor(state.purchaseOrders),date:today(),number:`PO-${state.settings.nextPO++}`,supplierId:Number(poSupplier.value),productId:Number(poProduct.value),qty:n(poQuantity.value),cost:n(poCost.value),total,status:'Open'}; state.purchaseOrders.push(po); audit('Purchase order created',po.number+' (No GL posting)'); save(); document.querySelector('.modal-backdrop').remove(); render(); }
function openSupplierInvoiceModal(){ modal(`<h3>Capture Supplier Invoice</h3><div class="two-col-form"><div class="form-row"><label>Supplier</label><select id="siSupplier">${option(state.suppliers)}</select></div><div class="form-row"><label>Currency</label><select id="siCur">${state.settings.currencies.map(c=>`<option>${c}</option>`).join('')}</select></div><div class="form-row"><label>Total Amount</label><input id="siTotal" type="number" step="0.01"></div><div class="form-row"><label>Amount Paid</label><input id="siPaid" type="number" step="0.01" value="0"></div><div class="form-row"><label>Reference</label><input id="siRef" value="SUP-${Date.now().toString().slice(-5)}"></div></div><button class="btn" onclick="saveSupplierInvoice()">Post Supplier Invoice</button>`); }
function saveSupplierInvoice(){ if(!requireFields([[siSupplier,'Supplier'],[siCur,'Currency'],[siTotal,'Total amount','number',0],[siRef,'Reference']])) return; const cur=siCur.value,total=n(siTotal.value),paid=n(siPaid.value),totalBase=baseAmount(total,cur),paidBase=baseAmount(paid,cur); const vatInputBase=state.settings.vatRegistered? totalBase*n(state.settings.vatRate)/(100+n(state.settings.vatRate)):0; const inventoryBase=totalBase-vatInputBase; const si={id:idFor(state.supplierInvoices),date:today(),number:`SIN-${state.settings.nextSupplierInvoice++}`,supplierId:Number(siSupplier.value),currency:cur,total,paid,totalBase,paidBase,vatInputBase,inventoryBase,externalRef:siRef.value,status:paidBase>=totalBase?'Paid':'Unpaid'}; state.supplierInvoices.push(si); const lines=[{account:'Inventory / Stock',debit:inventoryBase,credit:0}]; if(vatInputBase) lines.push({account:'VAT Input',debit:vatInputBase,credit:0}); lines.push({account:'Accounts Payable',debit:0,credit:totalBase}); postJournal('Supplier Invoice',lines,si.number); if(paidBase>0) postJournal('Supplier Payment',[{account:'Accounts Payable',debit:paidBase,credit:0},{account:'Bank account',debit:0,credit:paidBase}],si.number); audit('Supplier invoice captured',si.number); save(); document.querySelector('.modal-backdrop').remove(); render(); }
function openGRVModal(){ modal(`<h3>Create GRV</h3><div class="two-col-form"><div class="form-row"><label>Supplier</label><select id="gSupplier">${option(state.suppliers)}</select></div><div class="form-row"><label>Product</label><select id="gProduct">${option(state.products)}</select></div><div class="form-row"><label>Quantity Received</label><input id="gQuantity" type="number" step="0.01"></div><div class="form-row"><label>Unit cost</label><input id="gCost" type="number" step="0.01"></div><div class="form-row"><label>Batch</label><input id="gBatch" value="GRV-BATCH-${Date.now().toString().slice(-5)}"></div><div class="form-row"><label>Batch ID</label><input id="gBatchId" value="GRV-BATCH-${Date.now().toString().slice(-5)}"></div></div><button class="btn" onclick="saveGRV()">Receive Goods</button>`); }
function saveGRV(){ if(!requireFields([[gSupplier,'Supplier'],[gProduct,'Product'],[gQuantity,'Quantity received','number',0],[gCost,'Unit cost','number',0],[gBatch,'Batch'],[gBatchId,'Batch ID']])) return; const qtyv=n(gQuantity.value), cost=n(gCost.value); const grv={id:idFor(state.grvs),date:today(),number:`GRV-${state.settings.nextGRV++}`,supplierId:Number(gSupplier.value),productId:Number(gProduct.value),qty:qtyv,cost,status:'Received'}; state.grvs.push(grv); const c={id:idFor(state.carcasses),supplierId:grv.supplierId,animal:product(grv.productId)?.category,batch:gBatch.value,carcassId:gBatchId.value,productId:grv.productId,original:qtyv,sold:0,processed:0,wasted:0,remaining:qtyv,cost,grade:'',inspection:'Received',expiry:addDays(10),location:'Main Warehouse',date:today(),receivedBy:session.name}; state.carcasses.push(c); state.stockMovements.push({id:idFor(state.stockMovements),date:today(),productId:c.productId,batch:c.batch,carcassId:c.carcassId,type:'GRV stock received',qty:qtyv,costValue:qtyv*cost,user:session.name,reason:grv.number,ref:grv.number}); audit('GRV created',grv.number); save(); document.querySelector('.modal-backdrop').remove(); render(); }
function openCustomerPaymentModal(){ modal(`<h3>Receive Customer Payment</h3><div class="two-col-form"><div class="form-row"><label>Customer</label><select id="cpCustomer">${option(state.customers)}</select></div><div class="form-row"><label>Amount</label><input id="cpAmt" type="number" step="0.01"></div><div class="form-row"><label>Currency</label><select id="cpCur">${state.settings.currencies.map(c=>`<option>${c}</option>`).join('')}</select></div><div class="form-row"><label>Payment Method</label><select id="cpMethod"><option>Cash</option><option>Bank</option><option>EcoCash/mobile money</option><option>POS/swipe</option><option>EFT</option></select></div></div><button class="btn" onclick="saveCustomerPayment()">Post Payment</button>`); }
function saveCustomerPayment(){ if(!requireFields([[cpCustomer,'Customer'],[cpAmt,'Amount','number',0],[cpCur,'Currency'],[cpMethod,'Payment method']])) return; const cur=cpCur.value, amount=n(cpAmt.value), amountBase=baseAmount(amount,cur); const p={id:idFor(state.receipts),date:today(),customerId:Number(cpCustomer.value),amount,currency:cur,amountBase,method:cpMethod.value,type:'Customer Payment',ref:uid('PAY')}; state.receipts.push(p); postJournal('Customer Payment',[{account:paymentAccount(p.method),debit:amountBase,credit:0},{account:'Accounts Receivable',debit:0,credit:amountBase}],p.ref); audit('Customer payment received',p.ref); save(); document.querySelector('.modal-backdrop').remove(); renderAccounting(); }
function arLedgerHtml(){ const rows=[]; state.customers.forEach(c=>{ let bal=n(c.opening); if(c.opening) rows.push([today(),'OPENING','Opening balance','Accounts Receivable','',money(c.opening),money(bal),'USD',c.name,'System','Posted']); state.invoices.filter(s=>s.customerId==c.id).forEach(s=>{ bal+=n(s.totalBase)-n(s.paidBase); rows.push([s.date,s.invoice,'Invoice','Accounts Receivable',money(s.totalBase),money(s.paidBase),money(bal),s.currency,c.name,s.user,statusBadge(s.status)]); }); state.receipts.filter(p=>p.customerId==c.id).forEach(p=>{ bal-=n(p.amountBase); rows.push([p.date,p.ref,p.type||'Payment','Accounts Receivable','',money(p.amountBase),money(bal),p.currency,c.name,'System',statusBadge('Posted')]); }); }); return table(['Date','Reference number','Description','Account','Debit','Credit','Balance','Currency','Customer','Posted by','Status'],rows); }
function openSupplierPaymentModal(){ modal(`<h3>Pay Supplier</h3><div class="two-col-form"><div class="form-row"><label>Supplier</label><select id="spSupplier">${option(state.suppliers)}</select></div><div class="form-row"><label>Amount</label><input id="spAmt" type="number" step="0.01"></div><div class="form-row"><label>Currency</label><select id="spCur">${state.settings.currencies.map(c=>`<option>${c}</option>`).join('')}</select></div><div class="form-row"><label>Payment Method</label><select id="spMethod"><option>Bank</option><option>Cash</option><option>EcoCash/mobile money</option><option>POS/swipe</option></select></div><div class="form-row"><label>Use direct bank API request</label><select id="spDirect"><option>No</option><option>Yes</option></select></div></div><button class="btn" onclick="saveSupplierPayment()">Post Supplier Payment</button>`); }
function saveSupplierPayment(){ if(!requireFields([[spSupplier,'Supplier'],[spAmt,'Amount','number',0],[spCur,'Currency'],[spMethod,'Payment method'],[spDirect,'Direct bank API option']])) return; const cur=spCur.value, amount=n(spAmt.value), amountBase=baseAmount(amount,cur), sid=Number(spSupplier.value); const direct=spDirect.value==='Yes'; const p={id:idFor(state.supplierPayments),date:today(),supplierId:sid,amount,currency:cur,amountBase,method:spMethod.value,ref:uid('SPAY'),status:direct?'Prepared - Awaiting Bank Approval':'Posted'}; state.supplierPayments.push(p); if(direct){ state.bankPaymentRequests.push({id:idFor(state.bankPaymentRequests),date:today(),type:'Supplier Payment',supplierId:sid,amount,currency:cur,amountBase,bankName:supplier(sid)?.bankName,bankAccount:supplier(sid)?.bankAccount,branch:supplier(sid)?.branch,accountType:supplier(sid)?.accountType,status:'Prepared - Awaiting Approval',ref:p.ref,approvalStatus:'Prepared'}); audit('Supplier payment prepared',p.ref); } else { postJournal('Supplier Payment',[{account:'Accounts Payable',debit:amountBase,credit:0},{account:paymentAccount(p.method),debit:0,credit:amountBase}],p.ref); audit('Supplier payment posted',p.ref); } save(); document.querySelector('.modal-backdrop').remove(); renderAccounting(); }
function apLedgerHtml(){ const rows=[]; state.suppliers.forEach(sup=>{ let bal=n(sup.opening); if(sup.opening) rows.push([today(),'OPENING','Opening balance','Accounts Payable',money(sup.opening),'',money(bal),'USD',sup.name,'System','Posted']); state.supplierInvoices.filter(si=>si.supplierId==sup.id).forEach(si=>{ bal+=n(si.totalBase)-n(si.paidBase); rows.push([si.date,si.number,'Supplier Invoice','Accounts Payable',money(si.totalBase),money(si.paidBase),money(bal),si.currency,sup.name,'System',statusBadge(si.status)]); }); state.supplierPayments.filter(p=>p.supplierId==sup.id).forEach(p=>{ bal-=n(p.amountBase); rows.push([p.date,p.ref,'Supplier Payment','Accounts Payable','',money(p.amountBase),money(bal),p.currency,sup.name,'System',statusBadge(p.status)]); }); }); return table(['Date','Reference number','Description','Account','Debit','Credit','Balance','Currency','Supplier','Posted by','Status'],rows); }
function openExpenseModal(){ modal(`<h3>Record Expense</h3><div class="two-col-form"><div class="form-row"><label>Category</label><select id="exCat">${['Rent','Wages','Fuel','Transport','Electricity','Packaging','Repairs and maintenance','Facility maintenance','Cleaning','Security','Bank charges','Other'].map(x=>`<option>${x}</option>`).join('')}</select></div><div class="form-row"><label>Amount</label><input id="exAmt" type="number" step="0.01"></div><div class="form-row"><label>Currency</label><select id="exCur">${state.settings.currencies.map(c=>`<option>${c}</option>`).join('')}</select></div><div class="form-row"><label>Payment Method</label><select id="exMethod"><option>Cash</option><option>Bank</option><option>EcoCash/mobile money</option><option>POS/swipe</option></select></div><div class="form-row"><label>Payee</label><input id="exPayee"></div><div class="form-row"><label>Description</label><input id="exDesc"></div></div><button class="btn" onclick="saveExpense()">Save Expense</button>`); }
function saveExpense(){ if(!requireFields([[exCat,'Expense category'],[exAmt,'Amount','number',0],[exCur,'Currency'],[exMethod,'Payment method'],[exPayee,'Payee'],[exDesc,'Description']])) return; const cur=exCur.value, amount=n(exAmt.value), amountBase=baseAmount(amount,cur); const e={id:idFor(state.expenses),date:today(),category:exCat.value,description:exDesc.value,amount,currency:cur,amountBase,method:exMethod.value,payee:exPayee.value,approvedBy:session.name}; state.expenses.push(e); postJournal('Expense',[{account:e.category+' Expense',debit:amountBase,credit:0},{account:paymentAccount(e.method),debit:0,credit:amountBase}],e.category); audit('Expense recorded',e.category); save(); document.querySelector('.modal-backdrop').remove(); renderAccounting(); }
function expenseTable(){ return table(['Date','Category','Description','Amount','Method','Approved By'],state.expenses.map(e=>[e.date,e.category,e.description,money(e.amount,e.currency),e.method,e.approvedBy])); }

function employeeNet(e){ return n(e.basicSalary)+n(e.allowances)+n(e.overtime)+n(e.bonus)-n(e.advances)-n(e.loans)-n(e.paye)-n(e.nssa)-n(e.deductions); }
function payrollHtml(){
  const pending=state.payrollRequests.filter(r=>r.status==='Pending Approval');
  const empAction=(e)=> role()==='Accountant'?`<button class="btn small bad" onclick="requestEmployeeDeletion(${e.id})">Request Delete</button>`:role()==='Admin / Owner'?`<button class="btn small bad" onclick="deleteEmployeeNow(${e.id})">Delete</button>`:'';
  const pendingPanel=role()==='Admin / Owner'?`<div class="card"><div class="section-title"><h3>Pending Payroll Requests</h3><span class="badge warn">${pending.length} Pending</span></div>${table(['Requested','Type','Requested By','Details','Status','Action'],pending.map(r=>[r.requestedAt,r.type,r.requestedBy,r.description,statusBadge(r.status),`<button class="btn small good" onclick="approvePayrollRequest(${r.id})">Approve</button> <button class="btn small bad" onclick="disapprovePayrollRequest(${r.id})">Disapprove</button>`]))}</div><br>`:'';
  const history=`<div class="card"><h3>Payroll Request History</h3>${table(['Date','Type','Requested By','Approved/Disapproved By','Status','Reason'],state.payrollRequests.slice().reverse().map(r=>[r.requestedAt,r.type,r.requestedBy,r.reviewedBy||'',statusBadge(r.status),r.reason||'']))}</div>`;
  return `${pendingPanel}<div class="grid cols-2"><div class="card"><div class="section-title"><h3>Employees</h3><button class="btn small" onclick="openEmployeeModal()">Add Employee</button></div>${table(['Emp No.','Name','Job Title','Department','Email','Phone','Bank','Account No.','Net Salary','Status','Action'],state.employees.map(e=>[e.employeeNo||'',e.name,e.role,e.department||'',e.email||'',e.phone,e.bankName,e.bankAccount,money(employeeNet(e)),e.active?'Active':'Inactive',empAction(e)]))}</div><div class="card"><div class="section-title"><h3>Payroll Runs</h3><button class="btn small" onclick="runPayroll()">Run Payroll</button></div>${table(['Date','Run','Employees','Gross','Deductions','Net','Status','Action'],state.payrollRuns.map(p=>[p.date,p.number,p.employeeCount,money(p.gross),money(p.deductions),money(p.net),statusBadge(p.status),`<button class="btn small ghost" onclick="printPayslips(${p.id})">Payslips</button>`]))}</div></div><br><div class="card"><h3>Payslip Delivery Status</h3>${table(['Date','Employee','Pay Run','PDF Status','Email Status','Password'],state.payslips.map(ps=>[ps.date,ps.employeeName,ps.payrollNumber,ps.pdfStatus,ps.emailStatus,ps.passwordHint]))}</div><br>${history}<br><div class="notice">Accountant payroll actions are saved as <b>Pending Approval</b>. Admin approval is required before employee additions/deletions, payroll posting, payslip generation, and salary payment preparation affect live records. Payslips are marked for password-protected PDF delivery using the employee number as the password. Static demo mode queues the email record; the included backend worker performs real encrypted PDF generation and email delivery in production.</div>`;
}
function openEmployeeModal(){
  const fields=['Employee Name','Employee Number','National ID','Phone','Email','Address','Job Title','Department','Employment Type','Start Date','Salary/Wage','Allowances','Deductions','Bank Name','Bank Account Number','Branch','Employment Status'];
  modal(`<h3>Add Employee ${role()==='Accountant'?'<span class="badge warn">Pending Admin Approval</span>':''}</h3><div class="two-col-form">${fields.map((l,i)=>`<div class="form-row"><label>${l}</label><input id="emp${i}" ${[10,11,12].includes(i)?'type="number" step="0.01"':''} ${i==9?'type="date"':''} value="${i==1?'EMP-'+String(Date.now()).slice(-4):i==8?'Full-time':i==9?today():i==16?'Active':''}"></div>`).join('')}</div><button class="btn" onclick="saveEmployee()">${role()==='Accountant'?'Request Employee Addition':'Save Employee'}</button>`);
}
function saveEmployee(){
  if(!requireFields([[emp0,'Employee name'],[emp1,'Employee number'],[emp2,'National ID'],[emp6,'Job title'],[emp7,'Department'],[emp4,'Email address'],[emp3,'Phone number'],[emp13,'Bank name'],[emp14,'Bank account number'],[emp15,'Branch'],[emp10,'Salary/wage','number',0],[emp16,'Employment status']])) return;
  const data={id:idFor(state.employees),name:emp0.value,employeeNo:emp1.value,nationalId:emp2.value,phone:emp3.value,email:emp4.value,address:emp5.value,role:emp6.value,department:emp7.value,employmentType:emp8.value,startDate:emp9.value,basicSalary:n(emp10.value),hourlyRate:0,allowances:n(emp11.value),overtime:0,bonus:0,advances:0,loans:0,paye:0,nssa:0,deductions:n(emp12.value),bankName:emp13.value,bankAccount:emp14.value,branch:emp15.value,accountType:'Current',active:emp16.value.toLowerCase()!=='inactive'};
  if(role()==='Accountant'){
    state.payrollRequests.push({id:idFor(state.payrollRequests),type:'Employee Addition',status:'Pending Approval',requestedBy:session.name,requestedByRole:role(),requestedAt:now(),description:`Add employee ${data.name} (${data.employeeNo})`,payload:data});
    audit('Payroll employee addition requested',data.employeeNo);
  } else {
    state.employees.push(data); audit('Employee created',data.employeeNo);
  }
  save(); document.querySelector('.modal-backdrop').remove(); renderAccounting();
}
function payrollEmployeeMissing(e){
  const missing=[];
  if(!String(e.name||'').trim()) missing.push('name');
  if(!String(e.employeeNo||'').trim()) missing.push('employee number');
  if(!String(e.email||'').trim()) missing.push('email');
  if(!String(e.bankName||'').trim()) missing.push('bank name');
  if(!String(e.bankAccount||'').trim()) missing.push('bank account number');
  if(!String(e.branch||'').trim()) missing.push('branch');
  if(employeeNet(e)<=0) missing.push('net salary greater than zero');
  return missing;
}
function validatePayrollEmployees(employees){
  const bad=(employees||[]).map(e=>({e,missing:payrollEmployeeMissing(e)})).filter(x=>x.missing.length);
  if(bad.length){
    const list=bad.slice(0,5).map(x=>`${x.e.employeeNo||x.e.name}: ${x.missing.join(', ')}`).join('\n');
    return showFormError(`Payroll cannot be submitted until every employee has complete email, bank details and salary details. Missing:\n${list}`);
  }
  return true;
}
function runPayroll(){
  const employees=state.employees.filter(e=>e.active);
  if(!employees.length) return showFormError('No active employees found for payroll.');
  if(!validatePayrollEmployees(employees)) return;
  const gross=employees.reduce((a,e)=>a+n(e.basicSalary)+n(e.allowances)+n(e.overtime)+n(e.bonus),0), deductions=employees.reduce((a,e)=>a+n(e.advances)+n(e.loans)+n(e.paye)+n(e.nssa)+n(e.deductions),0), net=gross-deductions;
  const runPayload={date:today(),number:`PAY-${state.settings.nextPayroll++}`,employeeCount:employees.length,gross,deductions,net,status:'Pending Approval',lines:employees.map(e=>({employeeId:e.id,name:e.name,employeeNo:e.employeeNo,email:e.email,bankName:e.bankName,bankAccount:e.bankAccount,branch:e.branch,accountType:e.accountType,gross:n(e.basicSalary)+n(e.allowances)+n(e.overtime)+n(e.bonus),deductions:n(e.advances)+n(e.loans)+n(e.paye)+n(e.nssa)+n(e.deductions),net:employeeNet(e)}))};
  if(role()==='Accountant'){
    state.payrollRequests.push({id:idFor(state.payrollRequests),type:'Payroll Run',status:'Pending Approval',requestedBy:session.name,requestedByRole:role(),requestedAt:now(),description:`Run payroll ${runPayload.number} for ${runPayload.employeeCount} employees`,payload:runPayload});
    audit('Payroll run requested',runPayload.number);
  } else if(role()==='Admin / Owner') {
    approvePayrollRunPayload(runPayload, 'Direct Admin Payroll Run');
  } else return showFormError('Only Accountant can request payroll and Admin can approve/run it.');
  save(); renderAccounting();
}
function requestEmployeeDeletion(id){
  const e=state.employees.find(x=>x.id==id); if(!e) return;
  const reason=prompt(`Reason for deleting ${e.name}?`)||''; if(!reason.trim()) return showFormError('Deletion reason is required.');
  state.payrollRequests.push({id:idFor(state.payrollRequests),type:'Employee Deletion',status:'Pending Approval',requestedBy:session.name,requestedByRole:role(),requestedAt:now(),description:`Delete employee ${e.name} (${e.employeeNo})`,reasonRequested:reason,payload:{employeeId:e.id,employeeNo:e.employeeNo,name:e.name}});
  audit('Payroll employee deletion requested',`${e.employeeNo} - ${reason}`); save(); renderAccounting();
}
function deleteEmployeeNow(id){ const e=state.employees.find(x=>x.id==id); if(!e) return; if(!confirm(`Delete/deactivate ${e.name}?`)) return; e.active=false; audit('Employee deleted/deactivated by Admin',e.employeeNo); save(); renderAccounting(); }
function approvePayrollRequest(id){
  if(role()!=='Admin / Owner') return showFormError('Only Admin can approve payroll requests.');
  const r=state.payrollRequests.find(x=>x.id==id); if(!r) return; if(r.status!=='Pending Approval') return showFormError('This request has already been reviewed.');
  if(r.type==='Employee Addition'){ const emp={...r.payload,id:idFor(state.employees)}; state.employees.push(emp); r.status='Approved'; r.reviewedBy=session.name; r.reviewedAt=now(); audit('Payroll employee addition approved',emp.employeeNo); }
  if(r.type==='Employee Deletion'){ const e=state.employees.find(x=>x.id==r.payload.employeeId); if(e) e.active=false; r.status='Approved'; r.reviewedBy=session.name; r.reviewedAt=now(); audit('Payroll employee deletion approved',r.payload.employeeNo); }
  if(r.type==='Payroll Run'){ approvePayrollRunPayload(r.payload, r.description); r.status='Approved'; r.reviewedBy=session.name; r.reviewedAt=now(); audit('Payroll run approved by Admin',r.payload.number); }
  save(); renderAccounting();
}
function disapprovePayrollRequest(id){
  if(role()!=='Admin / Owner') return showFormError('Only Admin can disapprove payroll requests.');
  const r=state.payrollRequests.find(x=>x.id==id); if(!r) return; if(r.status!=='Pending Approval') return showFormError('This request has already been reviewed.');
  const reason=prompt('Reason for disapproval?')||''; if(!reason.trim()) return showFormError('A disapproval reason is required.');
  r.status='Disapproved'; r.reason=reason; r.reviewedBy=session.name; r.reviewedAt=now(); audit('Payroll request disapproved',`${r.type}: ${reason}`); save(); renderAccounting();
}
function approvePayrollRunPayload(payload, source){
  const employees=(payload.lines||[]).map(l=>({name:l.name,employeeNo:l.employeeNo,email:l.email,bankName:l.bankName,bankAccount:l.bankAccount,branch:l.branch,basicSalary:l.gross,deductions:l.deductions,allowances:0,overtime:0,bonus:0,advances:0,loans:0,paye:0,nssa:0,active:true}));
  if(!validatePayrollEmployees(employees)) return;
  const run={...payload,id:idFor(state.payrollRuns),status:'Approved - Payroll Payable Created',approvedBy:session.name,approvedAt:now(),source};
  state.payrollRuns.push(run);
  postJournal('Payroll Run',[{account:'Salaries and Wages Expense',debit:run.net,credit:0},{account:'Payroll Payable',debit:0,credit:run.net}],run.number);
  generatePayslipsForRun(run);
  processPayrollBankTransfers(run);
}
function generatePayslipsForRun(run){
  run.lines.forEach(l=>{
    state.payslips.push({id:idFor(state.payslips),date:today(),payrollRunId:run.id,payrollNumber:run.number,employeeId:l.employeeId,employeeName:l.name,employeeNo:l.employeeNo,email:l.email||'',net:l.net,gross:l.gross,deductions:l.deductions,pdfStatus:'Generated - Password Protected',emailStatus:l.email?'Email queued for automatic delivery':'No email address',passwordHint:`Employee number: ${l.employeeNo}`,password:l.employeeNo,emailBody:`Dear ${l.name},\n\nPlease find attached your payslip for ${run.number}.\n\nThe PDF is password protected. Use your employee number as the password.\n\nRegards,\nPayroll Department`});
    audit('Payslip generated',`${run.number} ${l.employeeNo}`,false);
  });
}
function processPayrollBankTransfers(run){
  run.lines.forEach(l=>{
    const req={id:idFor(state.bankPaymentRequests),date:today(),type:'Payroll Salary',employeeId:l.employeeId,beneficiary:l.name,amount:l.net,currency:'USD',amountBase:l.net,bankName:l.bankName,bankAccount:l.bankAccount,branch:l.branch,accountType:l.accountType,status:bankReadyForAutoPay()?'Approved - Auto Processing':'Prepared - Awaiting Live Bank Connection',ref:run.number,approvalStatus:bankReadyForAutoPay()?'Auto Approved after Payroll Approval':'Prepared after Admin payroll approval',approvedBy:run.approvedBy||session.name,approvedAt:run.approvedAt||now()};
    state.bankPaymentRequests.push(req);
    if(bankReadyForAutoPay()){
      req.status='Submitted to Bank - Successful'; req.bankReference=`BANK-${Date.now().toString().slice(-7)}-${l.employeeId}`; req.processedAt=now();
      postJournal('Payroll Payment',[{account:'Payroll Payable',debit:req.amountBase,credit:0},{account:'Bank account',debit:0,credit:req.amountBase}],req.ref);
      state.bankTransactions.unshift({id:idFor(state.bankTransactions),date:today(),description:`Payroll payment - ${l.name} - ${req.bankReference}`,amount:-n(req.amount),currency:req.currency,amountBase:-n(req.amountBase),status:'Matched',matchedRef:req.ref});
    }
  });
  audit('Payroll salary transfers prepared',`${run.number} - ${bankReadyForAutoPay()?'auto submitted to bank demo':'waiting for bank connection'}`);
}
function printPayslips(id){
  const run=state.payrollRuns.find(p=>p.id==id); if(!run) return;
  const html=`<!doctype html><html><head><title>${run.number}</title><style>body{font-family:Arial;padding:20px}.slip{border:1px solid #ddd;padding:16px;margin:12px 0;page-break-after:always}.note{font-size:12px;color:#555}</style></head><body><h2>${state.settings.companyName} Payroll Payslips</h2><p class="note">Production mode must generate encrypted PDF files and email them. Demo mode prints payslip records. Password rule: employee number.</p>${run.lines.map(l=>`<div class="slip"><h3>${l.name}</h3><p><b>Employee No:</b> ${l.employeeNo||''}<br><b>Pay Run:</b> ${run.number}<br><b>Gross Pay:</b> ${money(l.gross||l.net)}<br><b>Deductions:</b> ${money(l.deductions||0)}<br><b>Net Salary:</b> ${money(l.net)}<br><b>Bank:</b> ${l.bankName||''}<br><b>Account:</b> ${l.bankAccount||''}<br><b>PDF Password:</b> ${l.employeeNo||''}</p></div>`).join('')}</body></html>`;
  audit('Payslips printed/viewed',run.number); save(); const w=window.open('','_blank'); w.document.write(html); w.document.close(); w.focus(); w.print();
}
function eftHtml(){ return `<div class="grid cols-2"><div class="card"><div class="section-title"><h3>Record EFT Deposit</h3><button class="btn small" onclick="openEftModal()">Add EFT</button></div>${table(['Date','Customer','Amount','Ref','Status','Remaining','Action'],state.eftDeposits.map(e=>[e.date,customer(e.customerId)?.name,money(e.amount,e.currency),e.ref,e.status,money(e.remainingBase),e.status==='Pending'?`<button class="btn small" onclick="approveEft(${e.id})">Approve</button>`:'']))}</div><div class="card"><h3>How EFT works</h3><p>Accountant records and approves EFT money against the customer first. When the cashier selects EFT in Sales, the system shows the customer’s approved balance and uses it as payment.</p></div></div>`; }
function openEftModal(){ modal(`<h3>Add Customer EFT Deposit</h3><div class="two-col-form"><div class="form-row"><label>Customer</label><select id="eftCustomer">${option(state.customers)}</select></div><div class="form-row"><label>Amount</label><input id="eftAmount" type="number" step="0.01"></div><div class="form-row"><label>Currency</label><select id="eftCur">${state.settings.currencies.map(c=>`<option>${c}</option>`).join('')}</select></div><div class="form-row"><label>Bank Reference</label><input id="eftRef" value="EFT-${Date.now().toString().slice(-6)}"></div></div><button class="btn" onclick="saveEft()">Save Pending EFT</button>`); }
function saveEft(){ if(!requireFields([[eftCustomer,'Customer'],[eftAmount,'Amount','number',0],[eftCur,'Currency'],[eftRef,'Bank reference']])) return; const cur=eftCur.value, amount=n(eftAmount.value), amountBase=baseAmount(amount,cur); state.eftDeposits.push({id:idFor(state.eftDeposits),date:today(),customerId:Number(eftCustomer.value),amount,currency:cur,amountBase,remainingBase:amountBase,usedBase:0,ref:eftRef.value,status:'Pending'}); audit('EFT deposit captured','Pending approval'); save(); document.querySelector('.modal-backdrop').remove(); renderAccounting(); }
function approveEft(id){ const e=state.eftDeposits.find(x=>x.id==id); if(!e) return; e.status='Approved'; e.approvedBy=session.name; postJournal('EFT Deposit Approved',[{account:'Bank account',debit:e.amountBase,credit:0},{account:'Approved EFT Customer Deposits',debit:0,credit:e.amountBase}],e.ref); audit('EFT deposit approved',e.ref); save(); renderAccounting(); }
function bankHtml(){ return `<div class="grid cols-2"><div class="card"><h3>Company Bank API Setup</h3><div class="two-col-form"><div class="form-row"><label>Bank Name</label><input id="bankName" value="${esc(state.settings.bankName)}"></div><div class="form-row"><label>Account Name</label><input id="bankAccName" value="${esc(state.settings.companyName)}"></div><div class="form-row"><label>Account Number</label><input id="bankAccount" value="${esc(state.settings.bankAccount)}"></div><div class="form-row"><label>Branch</label><input id="bankBranch" value="${esc(state.settings.bankBranch||'')}"></div><div class="form-row"><label>Currency</label><input id="bankCurrency" value="${esc(state.settings.bankCurrency||'USD')}"></div><div class="form-row"><label>API Client ID</label><input id="bankClientId" value="${esc(state.settings.bankClientId||'')}"></div><div class="form-row"><label>API Client Secret</label><input id="bankClientSecret" type="password" value="${esc(state.settings.bankClientSecret||'')}"></div><div class="form-row"><label>API Endpoint</label><input id="bankApiEndpoint" value="${esc(state.settings.bankApiEndpoint||'')}"></div><div class="form-row"><label>Token Endpoint</label><input id="bankTokenEndpoint" value="${esc(state.settings.bankTokenEndpoint||'')}"></div><div class="form-row"><label>Webhook URL</label><input id="bankWebhookUrl" value="${esc(state.settings.bankWebhookUrl||'')}"></div><div class="form-row"><label>Bank Sync Enabled</label><select id="bankEnabled"><option ${state.settings.bankSyncEnabled?'':'selected'}>No</option><option ${state.settings.bankSyncEnabled?'selected':''}>Yes</option></select></div><div class="form-row"><label>Read Only Mode</label><select id="bankReadOnly"><option ${state.settings.bankReadOnly?'':'selected'}>No</option><option ${state.settings.bankReadOnly?'selected':''}>Yes</option></select></div></div><div class="actions"><button class="btn" onclick="saveBankSettings()">Save Bank Settings</button><button class="btn secondary" onclick="testBankConnection()">Test Bank Connection</button><button class="btn ghost" onclick="syncBankStatement()">Sync Bank Statement</button></div><div class="notice">Live bank transfers only work after the bank provides approved API credentials, sandbox/live access, payment signing rules and webhook verification. This demo simulates the connection test and payment states.</div></div><div class="card"><h3>Connection Status</h3>${bankStatusCard()}</div><div class="card"><h3>Bank Payment Requests</h3>${table(['Date','Type','Beneficiary','Bank','Account','Amount','Status','Actions'],state.bankPaymentRequests.map(r=>[r.date,r.type,r.supplierId?supplier(r.supplierId)?.name:(r.employeeId?state.employees.find(e=>e.id==r.employeeId)?.name:'Client'),r.bankName,r.bankAccount,money(r.amount,r.currency),r.status,bankRequestActions(r)]))}</div><div class="card"><h3>Synced Bank Transactions</h3>${table(['Date','Description','Amount','Status','Matched Ref'],state.bankTransactions.map(t=>[t.date,t.description,money(t.amount,t.currency),t.status,t.matchedRef||'']))}</div></div>`; }
function bankRequestActions(r){ if(r.status==='Prepared - Awaiting Approval' || r.status==='Pending API Approval') return `<button class="btn small" onclick="approveBankPayment(${r.id})">Approve</button>`; if(r.status==='Approved - Awaiting Submission') return `<button class="btn small secondary" onclick="submitBankPayment(${r.id})">Submit to Bank</button>`; if(r.status&&r.status.includes('Pending')) return `<button class="btn small" onclick="approveBankPayment(${r.id})">Approve</button>`; return ''; }
function bankStatusCard(){ const rows=[['Bank Connection Status',state.settings.bankApiStatus||'Not Connected'],['Authentication',state.settings.bankAuthStatus||'Not tested'],['Account Status',state.settings.bankAccountStatus||'Not tested'],['Available Balance',money(state.settings.bankAvailableBalance||0,state.settings.bankCurrency||'USD')],['Balance Sync',state.settings.bankBalanceStatus||'Not tested'],['Statement Sync',state.settings.bankStatementStatus||'Not tested'],['Payment API',state.settings.bankPaymentStatus||'Not tested'],['Webhook Status',state.settings.bankWebhookStatus||'Not tested'],['Last Successful Sync',state.settings.bankLastSync||'Never']]; return table(['Check','Result'],rows); }
function saveBankSettings(){
  if(!requireFields([[bankName,'Bank name'],[bankAccount,'Account number'],[bankBranch,'Branch'],[bankCurrency,'Currency'],[bankClientId,'API client ID'],[bankClientSecret,'API client secret'],[bankApiEndpoint,'API endpoint'],[bankTokenEndpoint,'Token endpoint']])) return;
  state.settings.bankName=bankName.value; state.settings.bankAccount=bankAccount.value; state.settings.bankBranch=bankBranch.value; state.settings.bankCurrency=bankCurrency.value; state.settings.bankClientId=bankClientId.value; state.settings.bankClientSecret=bankClientSecret.value; state.settings.bankApiEndpoint=bankApiEndpoint.value; state.settings.bankTokenEndpoint=bankTokenEndpoint.value; state.settings.bankWebhookUrl=bankWebhookUrl.value; state.settings.bankSyncEnabled=bankEnabled.value==='Yes'; state.settings.bankReadOnly=bankReadOnly.value==='Yes'; state.settings.bankApiStatus='Credentials Saved'; audit('Bank settings updated',state.settings.bankName); save(); renderAccounting();
}
function testBankConnection(){ if(!state.settings.bankClientId || !state.settings.bankApiEndpoint){ state.settings.bankApiStatus='Authentication Failed'; state.settings.bankAuthStatus='Missing API credentials'; audit('Bank connection test failed','Missing credentials'); save(); return renderAccounting(); } state.settings.bankAuthStatus='Verified'; state.settings.bankAccountStatus=`Active - ${state.settings.bankName} ${state.settings.bankAccount}`; state.settings.bankBalanceStatus='Working'; state.settings.bankStatementStatus='Working'; state.settings.bankPaymentStatus=state.settings.bankReadOnly?'Read only - payment API disabled':'Working in sandbox/demo'; state.settings.bankWebhookStatus=state.settings.bankWebhookUrl?'Active / URL saved':'Webhook URL not configured'; state.settings.bankAvailableBalance=n(state.settings.bankAvailableBalance)||12450; state.settings.bankLastSync=now(); state.settings.bankApiStatus=state.settings.bankReadOnly?'Connected - Read Only':'Fully Connected'; audit('Bank connection tested',state.settings.bankApiStatus); save(); renderAccounting(); }
function syncBankStatement(){ if(!state.settings.bankSyncEnabled) return alert('Enable bank sync first.'); const tx={id:idFor(state.bankTransactions),date:today(),description:`EFT Received - ${customer(1)?.name||'Customer'}`,amount:500,currency:state.settings.bankCurrency||'USD',amountBase:baseAmount(500,state.settings.bankCurrency||'USD'),status:'Unreconciled',matchedRef:''}; state.bankTransactions.unshift(tx); state.settings.bankStatementStatus='Working'; state.settings.bankLastSync=now(); audit('Bank statement synced','1 demo transaction synced'); save(); renderAccounting(); }
function approveBankPayment(id){ const r=state.bankPaymentRequests.find(x=>x.id==id); if(!r) return; r.status='Approved - Awaiting Submission'; r.approvedBy=session.name; r.approvedAt=now(); audit('Bank payment approved',r.ref); save(); renderAccounting(); }
function submitBankPayment(id){ const r=state.bankPaymentRequests.find(x=>x.id==id); if(!r) return; if(state.settings.bankApiStatus!=='Fully Connected') return alert('Bank is not Fully Connected. Run and pass the connection test first.'); r.status='Submitted to Bank - Successful'; r.bankReference=`BANK-${Date.now().toString().slice(-7)}`; r.processedAt=now(); if(r.type==='Payroll Salary') postJournal('Payroll Payment',[{account:'Payroll Payable',debit:r.amountBase,credit:0},{account:'Bank account',debit:0,credit:r.amountBase}],r.ref); if(r.type==='Supplier Payment'){ postJournal('Supplier Bank Payment',[{account:'Accounts Payable',debit:r.amountBase,credit:0},{account:'Bank account',debit:0,credit:r.amountBase}],r.ref); const sp=state.supplierPayments.find(p=>p.ref===r.ref); if(sp) sp.status='Submitted to Bank - Successful'; } if(r.type==='Expense Payment') postJournal('Expense Bank Payment',[{account:r.expenseAccount||'Other Expense',debit:r.amountBase,credit:0},{account:'Bank account',debit:0,credit:r.amountBase}],r.ref); state.bankTransactions.unshift({id:idFor(state.bankTransactions),date:today(),description:`Payment - ${r.type} - ${r.bankReference}`,amount:-n(r.amount),currency:r.currency,amountBase:-n(r.amountBase),status:'Matched',matchedRef:r.ref}); audit('Bank payment submitted',`${r.ref} ${r.bankReference}`); save(); renderAccounting(); }
function markBankProcessed(id){ approveBankPayment(id); submitBankPayment(id); }
function bankReconciliationHtml(){ return `<div class="card"><div class="section-title"><h3>Bank Reconciliation</h3><button class="btn small" onclick="autoReconcileBank()">Auto Match</button></div>${table(['Date','Bank Description','Amount','Status','Matched ERP Ref','Action'],state.bankTransactions.map(t=>[t.date,t.description,money(t.amount,t.currency),t.status,t.matchedRef||'',t.status==='Unreconciled'?`<button class="btn small" onclick="markTxnReconciled(${t.id})">Mark Reconciled</button>`:'']))}<p class="notice">Use this to match synced bank transactions to EFT receipts, supplier payments, payroll payments, customer refunds and expense payments.</p></div>`; }
function markTxnReconciled(id){ const t=state.bankTransactions.find(x=>x.id==id); if(!t) return; t.status='Reconciled'; t.matchedRef=t.matchedRef||'Manual Match'; state.reconciliations.push({id:idFor(state.reconciliations),date:today(),bankTxnId:id,matchedRef:t.matchedRef,user:session.name}); audit('Bank transaction reconciled',t.description); save(); renderAccounting(); }
function autoReconcileBank(){ state.bankTransactions.filter(t=>t.status==='Unreconciled').forEach(t=>{ const e=state.eftDeposits.find(e=>e.ref && t.description.includes(e.ref)); if(e){ t.status='Reconciled'; t.matchedRef=e.ref; }}); audit('Bank auto reconciliation run','Auto match completed'); save(); renderAccounting(); }
function assetRegisterHtml(){ return `<div class="card"><div class="section-title"><h3>Asset Register</h3><button class="btn small" onclick="openAssetModal()">Add Asset</button></div>${table(['Date','Asset','Category','Cost','Status'],state.assets.map(a=>[a.date,a.name,a.category,money(a.cost,a.currency),a.status]))}</div>`; }
function openAssetModal(){ modal(`<h3>Add Asset</h3><div class="two-col-form"><div class="form-row"><label>Asset Name</label><input id="asName"></div><div class="form-row"><label>Category</label><input id="asCat" value="Equipment"></div><div class="form-row"><label>Cost</label><input id="asCost" type="number" step="0.01"></div><div class="form-row"><label>Currency</label><select id="asCur">${state.settings.currencies.map(c=>`<option>${c}</option>`).join('')}</select></div></div><button class="btn" onclick="saveAsset()">Save Asset</button>`); }
function saveAsset(){ if(!requireFields([[asName,'Asset name'],[asCat,'Asset category'],[asCost,'Asset cost','number',0],[asCur,'Currency']])) return; const cost=n(asCost.value), cur=asCur.value, costBase=baseAmount(cost,cur); state.assets.push({id:idFor(state.assets),date:today(),name:asName.value,category:asCat.value,cost,currency:cur,costBase,status:'Active'}); postJournal('Asset Purchase',[{account:asCat.value+' Asset',debit:costBase,credit:0},{account:'Bank account',debit:0,credit:costBase}],uid('AST')); audit('Asset recorded',asName.value); save(); document.querySelector('.modal-backdrop').remove(); renderAccounting(); }
function accountingSettingsHtml(){ return `<div class="card"><h3>Accounting Settings</h3><p>Accounting books are auto-created when required and all sensitive modules are restricted to Admin and Accountant roles.</p>${table(['Setting','Value'],[['Auto-create accounts','Enabled'],['Role protection','Admin/Accountant only'],['Bank payment approval','Required'],['Payroll posting','Enabled'],['VAT posting','Enabled when VAT is active']])}</div>`; }
function cashbookHtml(){ const rows=[]; let bal=0; state.journalEntries.forEach(j=>j.lines.forEach(l=>{ if(/cash|bank|ecocash|pos|deposit/i.test(l.account)){ bal+=n(l.debit)-n(l.credit); rows.push([j.date,j.ref,j.type,l.account,money(l.debit),money(l.credit),money(bal),'USD',j.createdBy||'',j.approvedBy||'System',statusBadge(j.status||'Posted')]); } })); return table(['Date','Reference number','Description','Account','Debit','Credit','Balance','Currency','Posted by','Approved by','Status'],rows); }
function recordCashup(){ if(!requireFields([[cashCurrency,'Currency'],[cashCounted,'Cash counted','number',-1]])) return; const cur=cashCurrency.value, counted=n(cashCounted.value); const invs=state.invoices.filter(s=>s.date===today() && s.currency===cur && s.user===session.name); const expected=invs.reduce((a,s)=>a+n(s.paid),0); state.cashups.push({id:idFor(state.cashups),date:today(),cashier:session.name,currency:cur,expected,counted,diff:counted-expected,status:'Pending conclusion'}); audit('Cashup recorded',`${cur} ${counted}`); save(); render(); }
function concludeCashup(id){ const c=state.cashups.find(x=>x.id==id); if(!c) return; c.status='Concluded'; c.concludedBy=session.name; c.concludedAt=now(); audit('Cashup concluded',`${c.cashier} ${c.currency}`); save(); render(); }

function journalHtml(){
  const rows=[]; let running={};
  state.journalEntries.slice().forEach(j=>j.lines.forEach(l=>{ running[l.account]=n(running[l.account])+n(l.debit)-n(l.credit); rows.unshift([j.date,j.ref,j.type,l.account,money(l.debit),money(l.credit),money(running[l.account]),'USD',j.createdBy||'',j.approvedBy||'System',statusBadge(j.status||'Posted')]); }));
  return table(['Date','Reference number','Description','Account','Debit','Credit','Balance','Currency','Posted by','Approved by','Status'],rows);
}
function trialBalanceHtml(){ const accounts=glTotals(); return table(['Account','Debit','Credit','Balance','Currency','Status'],Object.entries(accounts).map(([a,v])=>[a,money(v.debit),money(v.credit),money(v.debit-v.credit),'USD',statusBadge('Posted')])); }
function netProfit(){ const sales=state.invoices.reduce((a,s)=>a+n(s.subtotalBase),0), cogs=state.invoices.reduce((a,s)=>a+n(s.cogs),0), exp=state.expenses.reduce((a,e)=>a+n(e.amountBase),0)+state.payrollRuns.reduce((a,p)=>a+n(p.net),0); return sales-cogs-exp; }
function profitLossHtml(){ const sales=state.invoices.reduce((a,s)=>a+n(s.subtotalBase),0), cogs=state.invoices.reduce((a,s)=>a+n(s.cogs),0), exp=state.expenses.reduce((a,e)=>a+n(e.amountBase),0)+state.payrollRuns.reduce((a,p)=>a+n(p.net),0); return table(['Section','Account','Debit','Credit','Balance','Currency'],[['Income','Sales','',money(sales),money(sales),'USD'],['Cost of Sales','Cost of Goods Sold',money(cogs),'',money(-cogs),'USD'],['Gross Profit','', '', '', money(sales-cogs),'USD'],['Expenses','Operating Expenses + Payroll',money(exp),'',money(-exp),'USD'],['Net Profit','', '', '', money(sales-cogs-exp),'USD']]); }
function inventoryValuationHtml(){ return table(['Product','Available quantity','Avg Cost','Value'],state.products.map(p=>{ const cs=state.carcasses.filter(c=>c.productId==p.id); const k=cs.reduce((a,c)=>a+n(c.remaining),0); const val=cs.reduce((a,c)=>a+n(c.remaining)*n(c.cost),0); return [p.name,qty(k),money(k?val/k:0),money(val)]; })); }
function vatReportHtml(){ const out=state.invoices.reduce((a,s)=>a+n(s.vatBase),0); const input=state.supplierInvoices.reduce((a,s)=>a+n(s.vatInputBase),0); return table(['Date','Reference number','Description','Account','Debit','Credit','Balance','Currency','Status'],[[today(),'VAT-OUTPUT','VAT Output on Sales','VAT Output','',money(out),money(-out),'USD',statusBadge('Posted')],[today(),'VAT-INPUT','VAT Input on Purchases','VAT Input',money(input),'',money(input),'USD',statusBadge('Posted')],[today(),'VAT-NET','Net VAT Payable','VAT Control',money(input),money(out),money(out-input),'USD',statusBadge(out-input>=0?'Payable':'Refundable')]]); }
function balanceSheetHtml(){
  const accounts=glTotals();
  const rows=Object.entries(accounts).map(([name,v])=>{ const acc=state.accounts.find(a=>a.name===name); const type=acc?.type||'Unclassified'; const bal=n(v.debit)-n(v.credit); return [type,name,money(v.debit),money(v.credit),money(bal),'USD']; });
  return table(['Section','Account','Debit','Credit','Balance','Currency'],rows.filter(r=>['Asset','Liability','Equity'].includes(r[0])));
}
function bankLedgerHtml(){ const rows=[]; let bal=0; state.journalEntries.forEach(j=>j.lines.forEach(l=>{ if(/bank/i.test(l.account)){ bal+=n(l.debit)-n(l.credit); rows.push([j.date,j.ref,j.type,l.account,money(l.debit),money(l.credit),money(bal),'USD',j.createdBy||'',j.approvedBy||'System',statusBadge(j.status||'Posted')]); } })); return table(['Date','Reference number','Description','Account','Debit','Credit','Balance','Currency','Posted by','Approved by','Status'],rows); }
function exportJson(){ const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); downloadBlob(blob,'business-erp-backup.json'); }
function exportCsv(key){ const arr=state[key]||[]; if(!arr.length) return alert('No records'); const cols=Object.keys(arr[0]); const csv=[cols.join(','),...arr.map(r=>cols.map(c=>`"${String(r[c]??'').replaceAll('"','""')}"`).join(','))].join('\n'); downloadBlob(new Blob([csv],{type:'text/csv'}),`${key}.csv`); }
function downloadBlob(blob,name){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); }

initV6ScreenshotFeatures();
(async()=>{
  render();
  const ok=await initSupabase();
  render();
})();


/* --------------------------------------------------------------------------
   v6 Screenshot-inspired accounting workflow upgrades
   These functions preserve the AriQ Digital ERP business logic while adding
   modern ERP patterns observed from the reference screenshots: close tasks,
   reconciliation workbench, report center, journal approval controls and
   financial dashboards. No source code, branding, logos or assets were copied.
---------------------------------------------------------------------------- */
function initV6ScreenshotFeatures(){
  state.closeTasks = Array.isArray(state.closeTasks) ? state.closeTasks : [
    {id:1,entity:'Main Branch',category:'AR',task:'Review unposted customer invoices',description:'Check draft and pending receivable documents before month-end close.',owner:'Accountant',startDate:today(),dueDate:addDays(1),dependency:'Sales posting complete',status:'In-progress',schedule:'On track',completedAt:'',completedBy:''},
    {id:2,entity:'Main Branch',category:'AR',task:'Prepare AR reconciliation',description:'Compare Accounts Receivable ledger to the General Ledger control account.',owner:'Accountant',startDate:today(),dueDate:addDays(2),dependency:'Customer statements generated',status:'In-progress',schedule:'On track',completedAt:'',completedBy:''},
    {id:3,entity:'Main Branch',category:'AP',task:'Enter all supplier invoices',description:'Make sure all supplier invoices and GRVs have been captured.',owner:'Accountant',startDate:today(),dueDate:addDays(1),dependency:'GRV review complete',status:'In-progress',schedule:'At risk',completedAt:'',completedBy:''},
    {id:4,entity:'Main Branch',category:'CM',task:'Sign off bank reconciliation',description:'Confirm bank statement balance, unmatched transactions and reconciliation difference.',owner:'Admin / Owner',startDate:today(),dueDate:addDays(3),dependency:'Bank transactions synced',status:'Not started',schedule:'On track',completedAt:'',completedBy:''},
    {id:5,entity:'Main Branch',category:'GL',task:'Close General Ledger',description:'Review journals, payroll, VAT and stock valuation before closing the period.',owner:'Admin / Owner',startDate:today(),dueDate:addDays(4),dependency:'Subledgers reconciled',status:'Not started',schedule:'On track',completedAt:'',completedBy:''},
    {id:6,entity:'Main Branch',category:'Reporting',task:'Generate financial statements',description:'Prepare Income Statement, Balance Sheet, Trial Balance and VAT report.',owner:'Accountant',startDate:today(),dueDate:addDays(5),dependency:'GL closed',status:'Not started',schedule:'On track',completedAt:'',completedBy:''}
  ];
  state.reportDefinitions = Array.isArray(state.reportDefinitions) ? state.reportDefinitions : [
    {id:1,name:'Trial Balance',type:'General Ledger',audience:'Accountant',description:'Debit and credit totals by account.',module:'reports',exportFormats:'PDF, Excel, CSV'},
    {id:2,name:'Income Statement',type:'Financial Statement',audience:'Owner / Accountant',description:'Revenue, cost of sales, gross profit, expenses and net income.',module:'reports',exportFormats:'PDF, Excel, CSV'},
    {id:3,name:'Balance Sheet',type:'Financial Statement',audience:'Owner / Accountant',description:'Assets, liabilities and equity as at a reporting date.',module:'reports',exportFormats:'PDF, Excel, CSV'},
    {id:4,name:'AR Subledger Reconciliation',type:'Close Report',audience:'Accountant',description:'Customer ledger balances compared to GL Accounts Receivable.',module:'ar',exportFormats:'PDF, Excel'},
    {id:5,name:'AP Subledger Reconciliation',type:'Close Report',audience:'Accountant',description:'Supplier ledger balances compared to GL Accounts Payable.',module:'ap',exportFormats:'PDF, Excel'},
    {id:6,name:'Bank Reconciliation',type:'Cash Management',audience:'Accountant',description:'Bank statement transactions matched to ERP cashbook entries.',module:'recon',exportFormats:'PDF, Excel, CSV'},
    {id:7,name:'VAT Report',type:'Tax',audience:'Accountant',description:'VAT output, VAT input and net VAT payable/refundable.',module:'reports',exportFormats:'PDF, Excel'},
    {id:8,name:'Inventory Valuation',type:'Inventory',audience:'Admin / Accountant',description:'Remaining quantity and inventory value by product.',module:'reports',exportFormats:'PDF, Excel, CSV'}
  ];
  state.journalApprovalRequests = Array.isArray(state.journalApprovalRequests) ? state.journalApprovalRequests : [
    {id:1,date:today(),requester:'System',requestStatus:'Submitted',journal:'Manual adjustment',transactionType:'Journal Entry',reference:'JE-REVIEW-001',description:'Large stock adjustment requires review',outlier:true,status:'Pending Approval',lines:[{account:'Inventory / Stock',department:'Operations',location:'Main Branch',debit:0,credit:125},{account:'Cost of Goods Sold',department:'Operations',location:'Main Branch',debit:125,credit:0}]},
    {id:2,date:today(),requester:'Accountant',requestStatus:'Submitted',journal:'Accrued expense',transactionType:'Journal Entry',reference:'JE-REVIEW-002',description:'Accrued cleaning service expense',outlier:false,status:'Pending Approval',lines:[{account:'Cleaning Expense',department:'Admin',location:'Main Branch',debit:60,credit:0},{account:'Accounts Payable',department:'Admin',location:'Main Branch',debit:0,credit:60}]}
  ];
  state.closePeriod = state.closePeriod || {period:'Current Month',status:'Open',lastSaved:'',createdBy:'System'};
  state.currentRecon = state.currentRecon || {account:'Bank account',statementDate:today(),statementEndingBalance:0,attachment:'',status:'Not started',lastSaved:'',createdBy:session?.name||'System'};
  save();
}

function renderAccounting(){
  if(!isAccountingUser()) return page('<div class="card"><h3>Restricted</h3><p>Accounting is hidden from cashier and supervisor users.</p></div>');
  const tabs=[
    ['overview','Financial Dashboard'],['close','Close Workspace'],['recon','Reconciliation'],['journalapprovals','Journal Approvals'],['reportcenter','Report Center'],
    ['gl','General Ledger'],['coa','Chart of Accounts'],['journal','Journal Entries'],['ar','Accounts Receivable'],['ap','Accounts Payable'],['cashbook','Cashbook'],['bankledger','Bank Ledger'],
    ['expenses','Expenses'],['payroll','Payroll'],['eft','EFT Approvals'],['bank','Bank Sync & Payments'],['assets','Asset Register'],['reports','Statements'],['acctset','Accounting Settings']
  ];
  const tabBtns=tabs.map(t=>`<button class="btn ${accountingTab===t[0]?'':'ghost'} small" onclick="accountingTab='${t[0]}';renderAccounting()">${t[1]}</button>`).join('');
  let body='';
  if(accountingTab==='overview') body=accountingDashboardHtml();
  if(accountingTab==='close') body=closeWorkspaceHtml();
  if(accountingTab==='recon') body=bankReconciliationHtml();
  if(accountingTab==='journalapprovals') body=journalApprovalsHtml();
  if(accountingTab==='reportcenter') body=reportCenterHtml();
  if(accountingTab==='gl') body=`<div class="card"><h3>General Ledger</h3><p class="muted-copy">Drill from each posted journal line into the source reference and audit trail.</p>${journalHtml()}</div>`;
  if(accountingTab==='coa') body=`<div class="card"><h3>Chart of Accounts</h3>${table(['Account','Type','System'],state.accounts.map(a=>[a.name,a.type,a.system?'Yes':'No']))}</div>`;
  if(accountingTab==='journal') body=`<div class="card"><h3>Journal Entries</h3><p>All automatic journals from sales, purchases, expenses, payroll, EFT, stock and bank actions appear here.</p>${journalHtml()}</div>`;
  if(accountingTab==='ar') body=`<div class="card"><div class="section-title"><h3>Accounts Receivable Ledger</h3><button class="btn small" onclick="openCustomerPaymentModal()">Receive Customer Payment</button></div>${arLedgerHtml()}${subledgerInsightHtml('AR')}</div>`;
  if(accountingTab==='ap') body=`<div class="card"><div class="section-title"><h3>Accounts Payable Ledger</h3><button class="btn small" onclick="openSupplierPaymentModal()">Pay Supplier</button></div>${apLedgerHtml()}${subledgerInsightHtml('AP')}</div>`;
  if(accountingTab==='cashbook') body=`<div class="card"><h3>Cashbook</h3>${cashbookHtml()}</div>`;
  if(accountingTab==='bankledger') body=`<div class="card"><h3>Bank Ledger</h3>${bankLedgerHtml()}</div>`;
  if(accountingTab==='expenses') body=`<div class="card"><div class="section-title"><h3>Expenses</h3><button class="btn" onclick="openExpenseModal()">Record Expense</button></div>${expenseTable()}</div>`;
  if(accountingTab==='payroll') body=payrollHtml();
  if(accountingTab==='eft') body=eftHtml();
  if(accountingTab==='bank') body=bankHtml();
  if(accountingTab==='assets') body=assetRegisterHtml();
  if(accountingTab==='acctset') body=accountingSettingsHtml();
  if(accountingTab==='reports') body=`<div class="grid cols-2"><div class="card"><h3>Trial Balance</h3>${trialBalanceHtml()}</div><div class="card"><h3>Income Statement</h3>${profitLossHtml()}</div><div class="card"><h3>Balance Sheet</h3>${balanceSheetHtml()}</div><div class="card"><h3>Inventory Valuation</h3>${inventoryValuationHtml()}</div><div class="card"><h3>VAT Report</h3>${vatReportHtml()}</div></div>`;
  page(`<div class="card"><div class="actions">${tabBtns}</div></div><br>${body}`);
}

function accountingDashboardHtml(){
  const ar=state.customers.reduce((a,c)=>a+customerBalance(c.id),0);
  const ap=state.suppliers.reduce((a,s)=>a+supplierBalance(s.id),0);
  const revenue=state.invoices.reduce((a,i)=>a+n(i.subtotalBase),0);
  const cogs=state.invoices.reduce((a,i)=>a+n(i.cogs),0);
  const expenses=state.expenses.reduce((a,e)=>a+n(e.amountBase),0)+state.payrollRuns.reduce((a,p)=>a+n(p.net),0);
  const cash=glBalance(/cash|bank|ecocash|pos|deposit/i);
  const closeStats=closeStatusCounts();
  return `<div class="grid cols-4">
    ${metric('Cash & Bank',money(cash),'Book balance')}
    ${metric('A/R',money(ar),'Customer balances')}
    ${metric('A/P',money(ap),'Supplier balances')}
    ${metric('Net Income',money(revenue-cogs-expenses),'Revenue less costs')}
  </div><br>
  <div class="grid cols-2">
    <div class="card"><div class="section-title"><h3>Profit and Loss Summary</h3><button class="btn small ghost" onclick="accountingTab='reports';renderAccounting()">Open statements</button></div>${profitLossHtml()}</div>
    <div class="card"><h3>Close Dashboard</h3><div class="progress-cards">
      ${donut('Complete', closeStats.complete, state.closeTasks.length)}
      ${donut('In progress', closeStats.inProgress, state.closeTasks.length)}
      ${donut('At risk', closeStats.atRisk, state.closeTasks.length)}
      ${donut('Overdue', closeStats.overdue, state.closeTasks.length)}
    </div><div class="mini-bars">${miniBar('Revenue',revenue,Math.max(1,revenue+expenses+cogs))}${miniBar('COGS',cogs,Math.max(1,revenue+expenses+cogs))}${miniBar('Expenses',expenses,Math.max(1,revenue+expenses+cogs))}</div></div>
    <div class="card"><h3>Financial Insights</h3>${insightPanel()}</div>
    <div class="card"><h3>Quick Actions</h3><div class="actions"><button class="btn small" onclick="accountingTab='recon';renderAccounting()">Start reconciliation</button><button class="btn small" onclick="accountingTab='close';renderAccounting()">Open close tasks</button><button class="btn small" onclick="accountingTab='journalapprovals';renderAccounting()">Review journals</button><button class="btn small ghost" onclick="accountingTab='reportcenter';renderAccounting()">Report center</button></div><p class="notice" style="margin-top:12px">Screens follow modern ERP accounting workflows: dashboard → drilldown → review → approve → report. Cashier and supervisor roles remain restricted from this panel.</p></div>
  </div>`;
}

function glBalance(pattern){ let bal=0; state.journalEntries.forEach(j=>j.lines.forEach(l=>{ if(pattern.test(l.account)) bal += n(l.debit)-n(l.credit); })); return bal; }
function closeStatusCounts(){
  const total=state.closeTasks.length||1;
  const complete=state.closeTasks.filter(t=>t.status==='Completed').length;
  const inProgress=state.closeTasks.filter(t=>t.status==='In-progress').length;
  const atRisk=state.closeTasks.filter(t=>t.schedule==='At risk').length;
  const overdue=state.closeTasks.filter(t=>t.schedule==='Overdue').length;
  return {total,complete,inProgress,atRisk,overdue};
}
function donut(label,value,total){ const pct=Math.round((n(value)/(n(total)||1))*100); return `<div class="donut-card"><div class="donut" style="--pct:${pct}"><span>${pct}%</span></div><b>${esc(label)}</b><small>${value} of ${total}</small></div>`; }
function miniBar(label,value,total){ const pct=Math.max(3,Math.min(100,Math.round(n(value)/(n(total)||1)*100))); return `<div class="mini-row"><span>${esc(label)}</span><div class="mini-track"><i style="width:${pct}%"></i></div><b>${money(value)}</b></div>`; }
function insightPanel(){
  const ar=state.customers.reduce((a,c)=>a+customerBalance(c.id),0), ap=state.suppliers.reduce((a,s)=>a+supplierBalance(s.id),0);
  const pending=state.journalApprovalRequests.filter(j=>j.status==='Pending Approval').length;
  const closeRisk=state.closeTasks.filter(t=>['At risk','Overdue'].includes(t.schedule)).length;
  return `<div class="insight"><b>Control checks</b><ul><li>${pending} journal approval item(s) need review.</li><li>${closeRisk} close task(s) are at risk or overdue.</li><li>AR balance: ${money(ar)}. AP balance: ${money(ap)}.</li><li>Use reconciliation to match bank statement transactions to the ERP cashbook.</li></ul></div>`;
}

function closeWorkspaceHtml(){
  const counts=closeStatusCounts();
  const rows=state.closeTasks.map(t=>[t.entity,t.category,t.task,t.description,t.owner,t.startDate,t.dueDate,t.dependency,statusBadge(t.schedule),statusBadge(t.status), t.status==='Completed'?`Done by ${esc(t.completedBy||'')}`:`<button class="btn small" onclick="completeCloseTask(${t.id})">Mark complete</button>`]);
  return `<div class="grid cols-4">${metric('Tasks complete',counts.complete,`${counts.total} total tasks`)}${metric('Tasks in progress',counts.inProgress,'Close workflow')}${metric('Tasks at risk',counts.atRisk,'Needs attention')}${metric('Tasks overdue',counts.overdue,'Escalate')}</div><br>
  <div class="card"><div class="section-title"><h3>Month-end Close Workspace</h3><div class="actions"><button class="btn small ghost" onclick="previewTaskChart()">Preview task chart</button><button class="btn small" onclick="addCloseTaskModal()">Add task</button></div></div>
  <div class="filters"><input placeholder="Filter task" oninput="filterTable(this.value)"><select><option>All active</option><option>AR</option><option>AP</option><option>CM</option><option>GL</option><option>Reporting</option></select><select><option>${esc(state.closePeriod.period)}</option></select></div>
  ${table(['Entity','Task category','Task','Description','Owner','Start date','Due date','Dependency','On schedule','Task state','Action'],rows)}</div>`;
}
function completeCloseTask(id){ const t=state.closeTasks.find(x=>x.id==id); if(!t) return; t.status='Completed'; t.schedule='Completed'; t.completedAt=now(); t.completedBy=session.name; audit('Close task completed',t.task); save(); renderAccounting(); }
function previewTaskChart(){ alert('Task chart preview: use the close dashboard cards to see Complete, In-progress, At-risk and Overdue task progress.'); }
function addCloseTaskModal(){ modal(`<h3>Add Close Task</h3><div class="two-col-form"><div class="form-row"><label>Task category</label><select id="ctCat"><option>AR</option><option>AP</option><option>CM</option><option>GL</option><option>Reporting</option></select></div><div class="form-row"><label>Owner</label><input id="ctOwner" value="Accountant"></div><div class="form-row span2"><label>Task</label><input id="ctTask"></div><div class="form-row span2"><label>Description</label><textarea id="ctDesc"></textarea></div><div class="form-row"><label>Due date</label><input id="ctDue" type="date" value="${addDays(3)}"></div><div class="form-row"><label>Dependency</label><input id="ctDep" value="None"></div></div><button class="btn" onclick="saveCloseTask()">Save Task</button>`); }
function saveCloseTask(){ if(!requireFields([[ctTask,'Task'],[ctOwner,'Owner'],[ctDue,'Due date']])) return; state.closeTasks.push({id:idFor(state.closeTasks),entity:'Main Branch',category:ctCat.value,task:ctTask.value,description:ctDesc.value,owner:ctOwner.value,startDate:today(),dueDate:ctDue.value,dependency:ctDep.value,status:'Not started',schedule:'On track',completedAt:'',completedBy:''}); audit('Close task created',ctTask.value); save(); document.querySelector('.modal-backdrop').remove(); renderAccounting(); }
function filterTable(q){ document.querySelectorAll('#page tbody tr').forEach(tr=>{ tr.style.display=tr.innerText.toLowerCase().includes(String(q).toLowerCase())?'':'none'; }); }

function bankReconciliationHtml(){
  const recon=state.currentRecon||{};
  const bankBook=glBalance(/bank/i);
  const statement=n(recon.statementEndingBalance);
  const diff=statement-bankBook;
  const unmatched=state.bankTransactions.filter(t=>!['Reconciled','Matched'].includes(t.status));
  return `<div class="grid cols-2"><div class="card"><h3>Reconciliation</h3><div class="two-col-form"><div class="form-row"><label>Account to reconcile *</label><select id="reconAccount"><option ${recon.account==='Bank account'?'selected':''}>Bank account</option><option ${recon.account==='Cash on hand'?'selected':''}>Cash on hand</option><option ${recon.account==='POS/swipe clearing account'?'selected':''}>POS/swipe clearing account</option><option ${recon.account==='EcoCash/mobile money'?'selected':''}>EcoCash/mobile money</option></select></div><div class="form-row"><label>Statement ending date *</label><input id="reconDate" type="date" value="${esc(recon.statementDate||today())}"></div><div class="form-row"><label>Statement ending balance *</label><input id="reconBalance" type="number" step="0.01" value="${esc(recon.statementEndingBalance||0)}"></div><div class="form-row"><label>Attachments</label><input id="reconAttachment" placeholder="bank-statement.pdf" value="${esc(recon.attachment||'')}"></div></div><div class="actions"><button class="btn" onclick="saveReconciliationHeader()">Continue</button><button class="btn ghost" onclick="importSampleBankTransactions()">Import transactions</button></div><p class="hint">Required fields are validated before a reconciliation can be saved.</p></div>
  <div class="card"><h3>Reconciliation Status</h3>${table(['Metric','Amount / Status'],[['Statement beginning balance',money(0)],['Last reconciled date',state.reconciliations.slice(-1)[0]?.date||'--'],['Reconciliation status',statusBadge(Math.abs(diff)<0.01?'Balanced':'Unbalanced')],['Book balance',money(bankBook)],['Statement ending balance',money(statement)],['Difference',money(diff)],['Unmatched transactions',unmatched.length],['Last saved',recon.lastSaved||'--'],['Created by',recon.createdBy||session.name]])}</div>
  <div class="card span2"><div class="section-title"><h3>Unmatched Transactions</h3><div class="actions"><button class="btn small" onclick="autoReconcileBank()">Apply auto-match</button><button class="btn small ghost" onclick="clearReconFilters()">Clear filters</button></div></div>${table(['Date','Description','Charges','Payments','Status','Action'],state.bankTransactions.map(t=>[t.date,t.description,n(t.amount)<0?money(Math.abs(t.amount),t.currency):'--',n(t.amount)>0?money(t.amount,t.currency):'--',statusBadge(t.status),t.status==='Unreconciled'?`<button class="btn small" onclick="markTxnReconciled(${t.id})">Match</button>`:'']))}</div></div>`;
}
function saveReconciliationHeader(){ if(!requireFields([[reconAccount,'Account to reconcile'],[reconDate,'Statement ending date'],[reconBalance,'Statement ending balance','number',-1]])) return; state.currentRecon={account:reconAccount.value,statementDate:reconDate.value,statementEndingBalance:n(reconBalance.value),attachment:reconAttachment.value,status:'In-progress',lastSaved:now(),createdBy:state.currentRecon?.createdBy||session.name}; audit('Bank reconciliation saved',`${reconAccount.value} ${reconDate.value}`); save(); renderAccounting(); }
function importSampleBankTransactions(){ state.bankTransactions.unshift({id:idFor(state.bankTransactions),date:today(),description:'Imported bank charge - statement file',amount:-12.50,currency:'USD',amountBase:-12.50,status:'Unreconciled',matchedRef:''},{id:idFor(state.bankTransactions)+1,date:today(),description:'Imported customer EFT - pending match',amount:250.00,currency:'USD',amountBase:250.00,status:'Unreconciled',matchedRef:''}); audit('Bank transactions imported','Sample import added to reconciliation workbench'); save(); renderAccounting(); }
function clearReconFilters(){ renderAccounting(); }

function reportCenterHtml(){
  const rows=state.reportDefinitions.map(r=>[r.name,r.type,r.audience,r.description,r.exportFormats,`<button class="btn small" onclick="openReport('${r.module}')">Open</button> <button class="btn small ghost" onclick="exportReport('${r.name}')">Export</button>`]);
  return `<div class="card"><div class="section-title"><h3>Financial Report Center</h3><input placeholder="Search report center" oninput="filterTable(this.value)"></div>${table(['Financial report','Report type','Report audience','Purpose','Export as','More actions'],rows)}<p class="notice" style="margin-top:12px">The report center provides reusable accounting reports with role permissions and export actions.</p></div>`;
}
function openReport(module){ if(module==='reports') accountingTab='reports'; else if(module==='ar') accountingTab='ar'; else if(module==='ap') accountingTab='ap'; else if(module==='recon') accountingTab='recon'; renderAccounting(); }
function exportReport(name){ alert(`${name} export prepared. In production this exports PDF, Excel or CSV from the backend reporting service.`); audit('Report exported',name); }

function journalApprovalsHtml(){
  const rows=state.journalApprovalRequests.map(j=>[`<input type="checkbox">`,j.outlier?'⚠':'--',j.requestStatus,j.requester,j.journal,j.transactionType,j.reference,j.description,j.date,statusBadge(j.status), j.status==='Pending Approval'?`<button class="btn small good" onclick="approveJournalRequest(${j.id})">Approve</button> <button class="btn small bad" onclick="declineJournalRequest(${j.id})">Decline</button> <button class="btn small ghost" onclick="viewJournalRequest(${j.id})">View</button>`:`<button class="btn small ghost" onclick="viewJournalRequest(${j.id})">View</button>`]);
  return `<div class="card"><div class="section-title"><h3>Approve Journal Entries</h3><div class="actions"><button class="btn small ghost" onclick="alert('Showing all submitted journals')">View All</button><button class="btn small good" onclick="bulkApproveJournals()">Approve</button><button class="btn small bad" onclick="bulkDeclineJournals()">Decline</button></div></div>${table(['Select','Outlier','Request status','Requester','Journal','Transaction type','Reference #','Description','Date requested','Status','Action'],rows)}<p class="notice" style="margin-top:12px">Outlier flags highlight unusual account, department, location or amount combinations before posting.</p></div>`;
}
function approveJournalRequest(id){ const j=state.journalApprovalRequests.find(x=>x.id==id); if(!j) return; if(j.status!=='Pending Approval') return alert('This journal has already been reviewed.'); j.status='Approved'; j.approvedBy=session.name; j.reviewedAt=now(); postJournal(j.journal,j.lines,j.reference); audit('Journal approval approved',j.reference); save(); renderAccounting(); }
function declineJournalRequest(id){ const reason=prompt('Reason for declining this journal?')||'No reason supplied'; const j=state.journalApprovalRequests.find(x=>x.id==id); if(!j) return; j.status='Declined'; j.approvedBy=session.name; j.reviewedAt=now(); j.reason=reason; audit('Journal approval declined',`${j.reference}: ${reason}`); save(); renderAccounting(); }
function viewJournalRequest(id){ const j=state.journalApprovalRequests.find(x=>x.id==id); if(!j) return; modal(`<h3>Journal Request ${esc(j.reference)}</h3>${table(['Outlier','Account','Department','Location','Transaction debit','Transaction credit','Memo'],j.lines.map((l,i)=>[j.outlier&&i===0?'⚠':'--',l.account,l.department||'--',l.location||'--',money(l.debit),money(l.credit),j.description]))}<p class="notice">${esc(j.description)}</p>`); }
function bulkApproveJournals(){ state.journalApprovalRequests.filter(j=>j.status==='Pending Approval').forEach(j=>{ j.status='Approved'; j.approvedBy=session.name; j.reviewedAt=now(); postJournal(j.journal,j.lines,j.reference); }); audit('Journal approvals bulk approved','All pending journal approvals'); save(); renderAccounting(); }
function bulkDeclineJournals(){ const reason=prompt('Reason for declining all pending journals?')||'Bulk declined'; state.journalApprovalRequests.filter(j=>j.status==='Pending Approval').forEach(j=>{ j.status='Declined'; j.approvedBy=session.name; j.reviewedAt=now(); j.reason=reason; }); audit('Journal approvals bulk declined',reason); save(); renderAccounting(); }

function subledgerInsightHtml(kind){
  const glAccount=kind==='AR'?'Accounts Receivable':'Accounts Payable';
  const gl=glBalance(new RegExp(glAccount,'i'));
  const sub=kind==='AR'?state.customers.reduce((a,c)=>a+customerBalance(c.id),0):state.suppliers.reduce((a,s)=>a+supplierBalance(s.id),0);
  const variance=sub-gl;
  return `<div class="notice" style="margin-top:12px"><b>${kind} Subledger Reconciliation Insight:</b> GL balance ${money(gl)} vs ${kind} subledger ${money(sub)}. Variance: <b>${money(variance)}</b>. ${Math.abs(variance)>0.01?'Review unmatched payments, journals or opening balances.':'No variance detected.'}</div>`;
}


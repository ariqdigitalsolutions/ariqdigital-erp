
    window.addEventListener('error', function(event) {
      var app = document.getElementById('app');
      if (app && !app.innerHTML.trim()) {
        app.innerHTML = '<div style="font-family:Arial;max-width:760px;margin:40px auto;padding:24px;border:1px solid #fecaca;background:#fff1f2;border-radius:12px;color:#7f1d1d"><h2>AriQ Digital ERP could not start</h2><p><b>Error:</b> '+ String(event.message).replace(/[&<>]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[m];}) +'</p><p>Try extracting the ZIP first, then open index.html again. If it still fails, clear browser storage for this file and reload.</p></div>';
      }
    });
  
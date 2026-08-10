window.addEventListener('error', function(evt){
  try{
    const payload = { message: evt.message, filename: evt.filename, lineno: evt.lineno, colno: evt.colno, stack: (evt.error && evt.error.stack) || null, ts: Date.now() };
    if(window.API && window.API.logError) window.API.logError(payload);
  }catch(e){ console.warn('Error reporting failed', e); }
});

window.addEventListener('unhandledrejection', function(evt){
  try{ if(window.API && window.API.logError) window.API.logError({ message: evt.reason && evt.reason.message ? evt.reason.message : String(evt.reason), ts: Date.now() }); }catch(e){}
});

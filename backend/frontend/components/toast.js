// Simple global toast component for L-FUTURE
(function(){
  function show(message, type='info', timeout=3000){
    try{
      const id = 'lf-global-toast';
      let el = document.getElementById(id);
      if(el) el.remove();
      el = document.createElement('div');
      el.id = id;
      el.style.position = 'fixed';
      el.style.right = '18px';
      el.style.bottom = '18px';
      el.style.background = (type==='error'? '#b00020' : (type==='success'? '#007a2f' : '#333'));
      el.style.color = '#fff';
      el.style.padding = '10px 14px';
      el.style.borderRadius = '6px';
      el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.35)';
      el.style.zIndex = '10000';
      el.textContent = message;
      document.body.appendChild(el);
      setTimeout(()=>{ try{ el.style.transition = 'opacity 300ms'; el.style.opacity = '0'; setTimeout(()=> el.remove(),350); }catch(e){} }, timeout);
    }catch(e){ console.warn('LFToast show failed', e); }
  }

  window.LFToast = { show };
})();

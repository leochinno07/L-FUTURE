
// toast.js - lightweight wrapper for iziToast or fallback
(function(window){
	const hasIzi = typeof window.iziToast !== 'undefined';

	function show(type, message, options = {}){
		if(hasIzi){
			const fn = (type === 'success') ? window.iziToast.success : (type === 'error') ? window.iziToast.error : window.iziToast.info;
			fn(Object.assign({message, position: 'topRight', timeout: 3500}, options));
			return;
		}
		// fallback minimal toast
		const id = 'lf-toast';
		let root = document.getElementById(id);
		if(!root){
			root = document.createElement('div');
			root.id = id;
			root.style.position = 'fixed';
			root.style.top = '16px';
			root.style.right = '16px';
			root.style.zIndex = 99999;
			document.body.appendChild(root);
		}
		const el = document.createElement('div');
		el.textContent = message;
		el.style.background = (type === 'error') ? '#ff4d4f' : (type === 'success') ? '#28a745' : '#333';
		el.style.color = '#fff';
		el.style.padding = '10px 14px';
		el.style.marginTop = '8px';
		el.style.borderRadius = '6px';
		el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
		root.appendChild(el);
		setTimeout(()=>{ el.style.opacity = '0'; el.addEventListener('transitionend', ()=> el.remove()); }, options.timeout || 3500);
	}

	window.Toast = window.Toast || {
		success: (msg, opts) => show('success', msg, opts),
		error: (msg, opts) => show('error', msg, opts),
		info: (msg, opts) => show('info', msg, opts)
	};
})(window);

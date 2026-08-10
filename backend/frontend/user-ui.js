(function(){
	// ...robusto helper para obtener datos del usuario (intenta window.getUser(), luego localStorage)...
	function getUserData(){
		try {
			if (typeof window.getUser === 'function') return window.getUser();
			const raw = localStorage.getItem('user');
			if (raw) return JSON.parse(raw);
		} catch(e) { /* ignore */ }
		return null;
	}

	function getInitial(name){
		if(!name) return 'U';
		const parts = name.trim().split(/\s+/);
		const first = parts[0] || name;
		return (first.charAt(0) || 'U').toUpperCase();
	}

	// Genera dataURL de avatar con iniciales (canvas)
	function generateAvatarDataUrl(initials, size = 150, bgColor = '#000000', textColor = '#FFD700'){
		try {
			const canvas = document.createElement('canvas');
			canvas.width = size; canvas.height = size;
			const ctx = canvas.getContext('2d');
			// fondo
			ctx.fillStyle = bgColor;
			ctx.fillRect(0,0,size,size);
			// texto
			const fontSize = Math.floor(size * 0.44);
			ctx.fillStyle = textColor;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.font = `bold ${fontSize}px Arial, sans-serif`;
			ctx.fillText(initials, size/2, size/2);
			// sutil borde
			ctx.strokeStyle = 'rgba(255,215,0,0.08)';
			ctx.lineWidth = Math.max(2, Math.floor(size * 0.02));
			ctx.strokeRect(0,0,size,size);
			return canvas.toDataURL('image/png');
		} catch(e){
			return '';
		}
	}

	// Actualiza la UI en la página: nombre, encabezado y avatar (imagen o div iniciales)
	function updateUserUI(){
		const user = getUserData();
		const username = (user && (user.username || user.nombre_completo)) || 'Usuario';
		const initial = getInitial(username);

		// 1) Nombre en elementos comunes
		document.querySelectorAll('.user-name').forEach(el => { el.textContent = username; });
		document.querySelectorAll('.encabezado-username').forEach(el => { el.textContent = username; });

		// 2) Sidebar: asegurar que haya un .user-name visible encima del logout
		document.querySelectorAll('.barra-lateral').forEach(bar => {
			const info = bar.querySelector('.info-usuario-lateral') || bar;
			let nameEl = info.querySelector('.user-name');
			if (!nameEl) {
				// insertar antes del botón de logout o al principio del bloque info
				nameEl = document.createElement('h3');
				nameEl.className = 'user-name';
				nameEl.style.margin = '6px 0';
				const ref = info.querySelector('.badge, .avatar, .user-avatar') || info.firstChild;
				info.insertBefore(nameEl, ref ? ref.nextSibling : info.firstChild);
			}
			nameEl.textContent = username;
		});

		// 3) Avatar: preferir .avatar-iniciales si existe; si hay <img.user-avatar> poner dataURL
		document.querySelectorAll('.avatar-iniciales').forEach(el => {
			el.textContent = initial;
			el.style.backgroundColor = el.style.backgroundColor || '#000';
			el.style.color = el.style.color || '#FFD700';
			el.setAttribute('aria-label', `Avatar de ${username}`);
		});

		document.querySelectorAll('img.user-avatar').forEach(img => {
			if (user && user.foto_perfil) {
				img.src = user.foto_perfil;
				img.alt = `Avatar de ${username}`;
			} else {
				const dataUrl = generateAvatarDataUrl(initial, 150, '#000', '#FFD700');
				if (dataUrl) img.src = dataUrl;
				img.alt = `Avatar de ${username}`;
			}
		});

		// 4) Asegurar que encima del botón de logout en cada contenedor aparezca el nombre
		document.querySelectorAll('.btn-signout').forEach(btn => {
			const parent = btn.parentElement;
			if (!parent) return;
			let signName = parent.querySelector('.user-name-signout');
			if (!signName) {
				signName = document.createElement('div');
				signName.className = 'user-name-signout';
				signName.style.cssText = 'text-align:center;color:#FFD700;margin-bottom:8px;font-weight:bold;';
				parent.insertBefore(signName, btn);
			}
			signName.textContent = username;
		});
	}

	// Exponer y ejecutar al cargar
	window.LFUTURE = window.LFUTURE || {};
	window.LFUTURE.updateUserUI = updateUserUI;
	document.addEventListener('DOMContentLoaded', updateUserUI);
})();

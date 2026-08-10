const editor3dCore = {
  isMobileUserAgent() {
    const ua = navigator.userAgent || '';
    return /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(ua);
  },

  isSmallViewport() {
    return window.innerWidth < 980 || window.matchMedia('(max-width: 980px)').matches;
  },

  shouldBlockMobile() {
    return this.isMobileUserAgent() || this.isSmallViewport();
  },

  redirectToMobileBlock() {
    const target = '/mobile-no-soportado.html';
    if (window.location.pathname !== target) {
      window.location.replace(target);
    }
  }
};

if (typeof window !== 'undefined') {
  window.Editor3DCore = editor3dCore;
}

export const {
  isMobileUserAgent,
  isSmallViewport,
  shouldBlockMobile,
  redirectToMobileBlock
} = editor3dCore;

export default editor3dCore;

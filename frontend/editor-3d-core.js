(function () {
  function isMobileUserAgent() {
    const ua = navigator.userAgent || '';
    return /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(ua);
  }

  function isSmallViewport() {
    return window.innerWidth < 980 || window.matchMedia('(max-width: 980px)').matches;
  }

  function shouldBlockMobile() {
    return isMobileUserAgent() || isSmallViewport();
  }

  function redirectToMobileBlock() {
    const target = '/mobile-no-soportado.html';
    if (window.location.pathname !== target) {
      window.location.replace(target);
    }
  }

  window.Editor3DCore = {
    isMobileUserAgent,
    isSmallViewport,
    shouldBlockMobile,
    redirectToMobileBlock
  };
})();

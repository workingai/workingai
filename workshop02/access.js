// Marketing workshop uses the shared main-page password modal.
(function () {
  const hasAccess = localStorage.getItem('workbook_logged_in') === 'true' &&
    localStorage.getItem('workbook_access_code') === 'mkt1008';
  if (hasAccess) return;
  document.documentElement.style.visibility = 'hidden';
  const mainUrl = new URL('../index.html', window.location.href);
  const page = window.location.pathname.split('/workshop02/')[1] || 'index.html';
  mainUrl.searchParams.set('redirect', 'workshop02/' + page + window.location.search + window.location.hash);
  window.location.replace(mainUrl.href);
})();

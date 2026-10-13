// Shinsegae workbook uses the workingai password entrance.
(function () {
  if (window.location.protocol === 'file:') return;
  const hasAccess = sessionStorage.getItem('shinsegae_authenticated') === 'true';
  if (hasAccess) return;
  document.documentElement.style.visibility = 'hidden';
  const mainUrl = new URL('../index.html', window.location.href);
  const page = window.location.pathname.split('/shinsegae/')[1] || 'index.html';
  mainUrl.searchParams.set('redirect', 'shinsegae/' + page + window.location.search + window.location.hash);
  window.location.replace(mainUrl.href);
})();

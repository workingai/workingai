// Shinsegae workbook uses the workingai password entrance.
(function () {
  if (window.location.protocol === 'file:') return;
  const hasAccess = localStorage.getItem('ssg_authenticated_261015') === 'true';
  if (hasAccess) return;
  document.documentElement.style.visibility = 'hidden';
  const mainUrl = new URL('../index.html', window.location.href);
  const page = window.location.pathname.split('/ssg/')[1] || 'index.html';
  mainUrl.searchParams.set('redirect', 'ssg/' + page + window.location.search + window.location.hash);
  window.location.replace(mainUrl.href);
})();

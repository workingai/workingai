// Marketing logins cannot enter employee workshops.
(function () {
  if (localStorage.getItem('workbook_access_code') !== 'mkt1008') return;
  document.documentElement.style.visibility = 'hidden';
  window.location.replace(new URL('../workshop02/index.html', window.location.href).href);
})();

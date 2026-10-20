(() => {
  const courses = {
    '1': { password: 'ssg261015', key: 'ssg_authenticated_261015', path: '/ssg/index.html' },
    '2': { password: 'ssg261021', key: 'ssg_authenticated_261021', path: '/ssg/day2/index.html' }
  };
  const dialog = document.getElementById('entrance');
  const input = document.getElementById('password');
  const error = document.getElementById('error');
  let selected;
  document.querySelectorAll('[data-day]').forEach(card => card.addEventListener('click', event => {
    event.preventDefault();
    selected = courses[card.dataset.day];
    document.getElementById('dialog-title').textContent = `Day ${card.dataset.day} 입장`;
    input.value = ''; error.textContent = '';
    dialog.showModal(); input.focus();
  }));
  document.getElementById('cancel').addEventListener('click', () => dialog.close());
  document.getElementById('entry-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!selected || input.value.trim() !== selected.password) {
      error.textContent = '비밀번호를 정확히 입력해 주세요.'; input.focus(); return;
    }
    localStorage.setItem(selected.key, 'true');
    location.href = selected.path;
  });
})();

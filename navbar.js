/**
 * 공통 네비게이션 바 동적 로딩 및 인증 상태 제어 스크립트 (navbar.js)
 */

/**
 * [레이아웃 시프트 & FOUC 방지]
 * 이 IIFE는 스크립트 태그가 파싱되는 즉시 동기적으로 실행됩니다.
 * DOMContentLoaded를 기다리지 않고 <style>을 <head>에 삽입해
 * 브라우저가 body를 렌더링하기 전에 아래 CSS가 적용됩니다:
 *   1. body { opacity: 0 } — 콘텐츠 깜빡임 방지
 *   2. #navbar-placeholder { min-height: 64px } — navbar 공간 미리 예약
 *      (이 값이 없으면 navbar 삽입 시 콘텐츠가 아래로 밀림)
 */
(function () {
  const style = document.createElement('style');
  style.id = '__navbar-preload-style';
  style.textContent = [
    'body{opacity:0;transition:opacity 0.2s ease;}',
    '#navbar-placeholder{min-height:64px;}',
  ].join('');
  document.head.appendChild(style);
})();

document.addEventListener('DOMContentLoaded', () => {
  const placeholder = document.getElementById('navbar-placeholder');
  if (!placeholder) {
    document.body.style.opacity = '1';
    return;
  }

  // 1. 현재 폴더 위치 분석 (workshop01 하위 폴더 여부 확인)
  const isSubdir = window.location.pathname.includes('/workshop01/');
  const prefix = isSubdir ? '../' : '';

  // 2. 공통 navbar.html 로드
  fetch(prefix + 'navbar.html')
    .then(res => {
      if (!res.ok) throw new Error('Navbar load error');
      return res.text();
    })
    .then(html => {
      // 서브디렉토리인 경우 경로를 상대경로(../)로 자동 보정
      let processedHtml = html;
      if (isSubdir) {
        processedHtml = processedHtml
          .replace(/href="index\.html"/g, 'href="../index.html"')
          .replace(/href="mulcam01\.html"/g, 'href="../mulcam01.html"')
          .replace(/href="workshop01\//g, 'href="')
          .replace(/src="images\/logo\.png"/g, 'src="../images/logo.png"');
      }

      placeholder.innerHTML = processedHtml;

      // navbar 삽입 완료 후 body 페이드인
      requestAnimationFrame(() => {
        document.body.style.opacity = '1';
      });

      // 3. 네비게이션 이벤트 핸들러 및 인증 상태 연동 초기화
      initNavbar(isSubdir);
    })
    .catch(err => {
    console.error('Failed to load shared navbar:', err);
    // 로드 실패해도 페이지는 보여줌
    document.body.style.opacity = '1';
  });
});

// 모바일 햄버거 메뉴 토글 기능 정의
window.toggleMobileMenu = () => {
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.toggle('hidden');
};

function initNavbar(isSubdir) {
  const loginBtn = document.getElementById('nav-login-btn');
  const logoutBtn = document.getElementById('nav-logout-btn');
  const mobileLoginBtn = document.getElementById('mobile-login-btn');
  const mobileLogoutBtn = document.getElementById('mobile-logout-btn');

  // [로그인 버튼 클릭 시 처리]
  const handleLoginClick = () => {
    const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    if (isIndexPage && typeof openEntranceModal === 'function') {
      openEntranceModal();
    } else {
      const pageName = isSubdir ? 'workshop01/' + window.location.pathname.split('/').pop() : window.location.pathname.split('/').pop();
      const destIndex = isSubdir ? '../index.html' : 'index.html';
      window.location.href = destIndex + '?redirect=' + pageName;
    }
  };

  if (loginBtn) {
    loginBtn.addEventListener('click', handleLoginClick);
  }
  if (mobileLoginBtn) {
    mobileLoginBtn.addEventListener('click', () => {
      handleLoginClick();
      window.toggleMobileMenu();
    });
  }

  // [로그아웃 버튼 클릭 시 처리]
  const handleLogoutClick = () => {
    localStorage.removeItem('workbook_logged_in');
    localStorage.removeItem('workbook_access_code');
    localStorage.removeItem('workbook_course_code');
    window.location.href = isSubdir ? '../index.html' : 'index.html';
  };

  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogoutClick);
  }
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener('click', handleLogoutClick);
  }

  // [인증 상태 기반 버튼 숨김/노출 상태값 제어]
  const isLoggedIn = localStorage.getItem('workbook_logged_in') === 'true';
  if (isLoggedIn) {
    if (loginBtn) loginBtn.classList.add('hidden');
    if (logoutBtn) logoutBtn.classList.remove('hidden');
    if (mobileLoginBtn) mobileLoginBtn.classList.add('hidden');
    if (mobileLogoutBtn) mobileLogoutBtn.classList.remove('hidden');
  } else {
    if (loginBtn) loginBtn.classList.remove('hidden');
    if (logoutBtn) logoutBtn.classList.add('hidden');
    if (mobileLoginBtn) mobileLoginBtn.classList.remove('hidden');
    if (mobileLogoutBtn) mobileLogoutBtn.classList.add('hidden');
  }
}

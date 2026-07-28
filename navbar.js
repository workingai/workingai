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
    'html{overflow-x:hidden;}',
    'body{opacity:0;transition:opacity 0.2s ease, transform 0.3s ease-in-out;overflow-x:hidden;position:relative;}',
    'body.menu-open{transform: translateX(-256px);}',
    'body.menu-open #mobile-menu-backdrop{transform: translateX(256px);}',
    '#navbar-placeholder{min-height:64px;}',
  ].join('');
  document.head.appendChild(style);
})();

// 모든 페이지 마우스 우클릭 방지
document.addEventListener('contextmenu', event => event.preventDefault());

document.addEventListener('DOMContentLoaded', () => {
  const placeholder = document.getElementById('navbar-placeholder');
  if (!placeholder) {
    document.body.style.opacity = '1';
    return;
  }

  // 1. 현재 폴더 위치 분석 (workshop01 하위 폴더 여부 확인)
  const isSubdir = window.location.pathname.includes('/workshop01/');
  const prefix = isSubdir ? '../' : '';

  // 2. 공통 navbar.html 로드 (캐시 방지를 위해 버전 쿼리 추가)
  fetch(prefix + 'navbar.html?v=5')
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
          .replace(/src="images\//g, 'src="../images/');
      }

      placeholder.innerHTML = processedHtml;

      // index 페이지를 제외한 나머지 메뉴에서 상단 네비게이션을 좌우 끝으로 정렬 (로고 왼쪽 정렬) 및 메뉴 간소화
      const pathname = window.location.pathname;
      const isIndex = pathname.endsWith('index.html') || pathname.endsWith('/') || pathname === '' || pathname.includes('ws01_index.html');
      if (!isIndex) {
        // 1. 네비게이션 컨테이너를 전체 너비로 변경
        const navContainer = placeholder.querySelector('nav > div');
        if (navContainer) {
          navContainer.classList.remove('max-w-[1200px]', 'mx-auto');
          navContainer.classList.add('max-w-full');
        }

        // 2. 데스크톱 기본 링크 숨기기
        const desktopLinks = placeholder.querySelector('nav .hidden.md\\:flex');
        if (desktopLinks) {
          desktopLinks.classList.remove('md:flex');
        }

        // 3. 햄버거 버튼을 데스크톱에서도 표시
        const hamburgerBtn = document.getElementById('nav-hamburger-btn');
        if (hamburgerBtn) {
          hamburgerBtn.classList.remove('md:hidden');
        }

        // 4. 모바일 메뉴(더보기 메뉴)가 데스크톱에서도 표시되도록 md:hidden 제거
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
          mobileMenu.classList.remove('md:hidden');
        }
      }

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

// 모바일/세로 햄버거 메뉴 토글 기능 정의 (화면이 왼쪽으로 밀리며 오른쪽에서 드로어가 나타나는 방식)
window.toggleMobileMenu = () => {
  const backdrop = document.getElementById('mobile-menu-backdrop');
  if (backdrop) {
    const isClosed = !document.body.classList.contains('menu-open');
    if (isClosed) {
      // 열기
      backdrop.classList.remove('hidden');
      requestAnimationFrame(() => {
        document.body.classList.add('menu-open');
        backdrop.classList.remove('opacity-0');
        backdrop.classList.add('opacity-100');
      });
    } else {
      // 닫기
      document.body.classList.remove('menu-open');
      backdrop.classList.remove('opacity-100');
      backdrop.classList.add('opacity-0');
      
      // 트랜지션 완료 후 backdrop 숨김 (300ms)
      setTimeout(() => {
        if (!document.body.classList.contains('menu-open')) {
          backdrop.classList.add('hidden');
        }
      }, 300);
    }
  }
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

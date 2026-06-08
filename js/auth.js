// auth.js – lösenordsskydd för alla sidor
const PASSWORD = 'freeTony';

function isAuthenticated() {
  return sessionStorage.getItem('midsommar_auth') === 'true';
}

// Omdirigera direkt om ej inloggad (körs på welcome.html + food.html)
(function checkAuth() {
  const isLoginPage = !!document.querySelector('.page-login');
  if (!isLoginPage && !isAuthenticated()) {
    // Behåll relativ sökväg så det fungerar på /missommar/
    const base = window.location.pathname.split('/').slice(0, -1).join('/');
    window.location.replace(base + '/index.html');
  }
})();

document.addEventListener('DOMContentLoaded', function () {

  // Logga ut-knapp
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      sessionStorage.removeItem('midsommar_auth');
      const base = window.location.pathname.split('/').slice(0, -1).join('/');
      window.location.replace(base + '/index.html');
    });
  }

  // Inloggningsformulär (index.html)
  const form = document.getElementById('loginForm');
  if (form) {
    if (isAuthenticated()) {
      const base = window.location.pathname.split('/').slice(0, -1).join('/');
      window.location.replace(base + '/welcome.html');
      return;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const val = document.getElementById('passwordInput').value;

      if (val === PASSWORD) {
        sessionStorage.setItem('midsommar_auth', 'true');
        const base = window.location.pathname.split('/').slice(0, -1).join('/');
        window.location.replace(base + '/welcome.html');
      } else {
        const err = document.getElementById('loginError');
        err.classList.remove('hidden');
        const inputEl = document.getElementById('passwordInput');
        inputEl.classList.add('shake');
        setTimeout(() => inputEl.classList.remove('shake'), 600);
      }
    });

    document.getElementById('passwordInput').addEventListener('input', function () {
      document.getElementById('loginError').classList.add('hidden');
    });
  }
});

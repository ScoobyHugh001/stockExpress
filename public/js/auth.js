document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const errorEl = document.getElementById('form-error');
  const logoutLink = document.getElementById('logout-link');

  updateNav();

  function setToken(token) {
    localStorage.setItem('token', token);
    document.cookie = `token=${token}; path=/; SameSite=Strict`;
  }

  function clearToken() {
    localStorage.removeItem('token');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  }

  function hideError() {
    errorEl.classList.add('hidden');
    errorEl.textContent = '';
  }

  function updateNav() {
    const token = localStorage.getItem('token');
    const navLogin = document.getElementById('nav-login');
    const navSignup = document.getElementById('nav-signup');
    const navLogout = document.getElementById('nav-logout');

    if (token) {
      navLogin.classList.add('hidden');
      navSignup.classList.add('hidden');
      navLogout.classList.remove('hidden');
    } else {
      navLogin.classList.remove('hidden');
      navSignup.classList.remove('hidden');
      navLogout.classList.add('hidden');
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError();

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          showError(data.error || 'Login failed');
          return;
        }

        setToken(data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/';
      } catch {
        showError('Network error. Please try again.');
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError();

      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          showError(data.error || 'Signup failed');
          return;
        }

        setToken(data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/';
      } catch {
        showError('Network error. Please try again.');
      }
    });
  }

  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      clearToken();
      localStorage.removeItem('user');
      updateNav();
      window.location.href = '/login';
    });
  }
});

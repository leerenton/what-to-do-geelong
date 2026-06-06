'use strict';

// Redirect if already logged in
(async () => {
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    const next = new URLSearchParams(window.location.search).get('next') || 'account.html';
    window.location.href = next;
  }
})();

document.getElementById('js-pw-toggle')?.addEventListener('click', () => {
  const pw = document.getElementById('login-pw');
  const icon = document.querySelector('#js-pw-toggle .material-symbols-rounded');
  pw.type = pw.type === 'password' ? 'text' : 'password';
  icon.textContent = pw.type === 'password' ? 'visibility' : 'visibility_off';
});

document.getElementById('js-login-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pw    = document.getElementById('login-pw').value;
  const error = document.getElementById('js-login-error');
  const btn   = document.getElementById('js-login-btn');

  error.classList.remove('visible');
  btn.disabled = true;
  btn.textContent = 'Signing in…';

  const { data, error: authError } = await db.auth.signInWithPassword({ email, password: pw });

  if (authError) {
    error.textContent = 'Incorrect email or password.';
    error.classList.add('visible');
    document.getElementById('login-email').classList.add('auth-input--error');
    document.getElementById('login-pw').classList.add('auth-input--error');
    btn.disabled = false;
    btn.textContent = 'Log In';
    return;
  }

  // Store name in localStorage for nav display
  const name = data.user.user_metadata?.name || email.split('@')[0];
  setAccount({ id: data.user.id, name, email });

  // Link any anonymous session guides to this user account
  if (typeof linkSessionGuidesToUser === 'function') {
    await linkSessionGuidesToUser(data.user.id);
  }

  if (typeof trackLogin === 'function') trackLogin('email');

  const next = new URLSearchParams(window.location.search).get('next') || 'account.html';
  window.location.href = next;
});

document.getElementById('js-google-btn')?.addEventListener('click', async () => {
  if (typeof trackLogin === 'function') trackLogin('google');
  const { error } = await db.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/account.html' }
  });
  if (error) alert(error.message);
});

document.getElementById('js-apple-btn')?.addEventListener('click', async () => {
  const { error } = await db.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo: window.location.origin + '/account.html' }
  });
  if (error) alert(error.message);
});

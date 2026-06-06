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
  const pw = document.getElementById('su-pw');
  const icon = document.querySelector('#js-pw-toggle .material-symbols-rounded');
  pw.type = pw.type === 'password' ? 'text' : 'password';
  icon.textContent = pw.type === 'password' ? 'visibility' : 'visibility_off';
});

document.getElementById('js-signup-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const name  = document.getElementById('su-name').value.trim();
  const email = document.getElementById('su-email').value.trim().toLowerCase();
  const pw    = document.getElementById('su-pw').value;
  const error = document.getElementById('js-signup-error');
  const btn   = document.getElementById('js-signup-btn');

  error.classList.remove('visible');

  if (!name) {
    error.textContent = 'Please enter your name.';
    error.classList.add('visible');
    return;
  }
  if (pw.length < 8) {
    error.textContent = 'Password must be at least 8 characters.';
    error.classList.add('visible');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Creating account…';

  const { data, error: authError } = await db.auth.signUp({
    email,
    password: pw,
    options: { data: { name } }
  });

  if (authError) {
    error.textContent = authError.message;
    error.classList.add('visible');
    btn.disabled = false;
    btn.textContent = 'Create Account';
    return;
  }

  // Store name in localStorage for nav display
  if (data.user) {
    setAccount({ id: data.user.id, name, email });
  }

  const next = new URLSearchParams(window.location.search).get('next') || 'account.html';
  window.location.href = next;
});

document.getElementById('js-google-btn')?.addEventListener('click', async () => {
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

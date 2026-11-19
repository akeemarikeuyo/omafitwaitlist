// Waitlist form and share buttons. No trackers, no third-party scripts.
(() => {
  const SHARE_URL = 'https://www.akanniola.com/omafit';
  const SHARE_TEXT = 'omaFIT: a free app to fix your posture, build muscle and stay in shape, made for people who sit all day. Join the waitlist:';

  const form = document.getElementById('waitlist');
  const error = form.querySelector('.form-error');
  const thanks = document.querySelector('.thanks');
  const submit = form.querySelector('button[type="submit"]');

  const showError = msg => {
    error.textContent = msg;
    error.hidden = !msg;
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    showError('');
    const email = form.email.value.trim();
    const platform = form.querySelector('input[name="platform"]:checked')?.value;
    if (!email || !form.email.checkValidity()) return showError('Please enter a valid email address.');
    if (!platform) return showError('Please choose iPhone or Android.');

    submit.disabled = true;
    submit.textContent = 'Joining…';
    try {
      const res = await fetch('/omafit/api/join', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, platform, website: form.website.value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      form.hidden = true;
      thanks.hidden = false;
      thanks.focus();
    } catch (err) {
      showError(err instanceof Error && err.message ? err.message : 'Something went wrong. Please try again.');
    } finally {
      submit.disabled = false;
      submit.textContent = 'Join the waitlist';
    }
  });

  // ---------- share ----------
  const status = document.querySelector('.copied');
  const native = document.querySelector('[data-share="native"]');
  document.querySelector('[data-share="whatsapp"]').href =
    `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT} ${SHARE_URL}`)}`;
  document.querySelector('[data-share="x"]').href =
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SHARE_URL)}`;

  // The phone's own share sheet (WhatsApp, Messages, Instagram…) where the browser supports it
  if (navigator.share) {
    native.hidden = false;
    native.addEventListener('click', () => {
      navigator.share({ title: 'omaFIT', text: SHARE_TEXT, url: SHARE_URL }).catch(() => {});
    });
  }

  document.querySelector('[data-share="copy"]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      status.textContent = 'Link copied. Paste it anywhere.';
    } catch {
      status.textContent = SHARE_URL;
    }
  });
})();

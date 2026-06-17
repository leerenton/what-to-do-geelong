'use strict';
/* ── Admin Preview Bar ───────────────────────────────────────────────────────
   Shows a sticky bar at the top when the wtdg_admin_bypass cookie is set,
   indicating preview mode and the current site's live status.
   ─────────────────────────────────────────────────────────────────────────── */
(async function initPreviewBar() {
  // Only show if bypass cookie is present
  if (!document.cookie.includes('wtdg_admin_bypass=1')) return;

  // Fetch current site mode from DB
  let siteMode = 'active';
  let siteName = document.title;
  try {
    const host = window.location.hostname.replace(/^www\./, '');
    const { data } = await db
      .from('sites')
      .select('site_mode, name')
      .or(`domain.eq.${host},domain_www.eq.${window.location.hostname}`)
      .maybeSingle();
    if (data) {
      siteMode = data.site_mode || 'active';
      siteName = data.name || siteName;
    }
  } catch (_) {}

  const modeLabel = {
    active:      { text: '✅ Live',         bg: '#065f46', dot: '#4ade80' },
    coming_soon: { text: '🚧 Coming Soon',  bg: '#92400e', dot: '#fbbf24' },
    maintenance: { text: '🔧 Maintenance',  bg: '#991b1b', dot: '#f87171' },
  }[siteMode] || { text: siteMode, bg: '#1e293b', dot: '#94a3b8' };

  // Inject bar
  const bar = document.createElement('div');
  bar.id = 'wtdg-preview-bar';
  bar.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
    background: #0f172a; color: #e2e8f0;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 1rem; height: 36px;
    font-family: -apple-system, BlinkMacSystemFont, 'DM Sans', sans-serif;
    font-size: 12px; font-weight: 600; gap: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,.4);
  `;
  bar.innerHTML = `
    <span style="display:flex;align-items:center;gap:.5rem;opacity:.6">
      👁 Admin Preview Mode
    </span>
    <span style="display:flex;align-items:center;gap:.5rem">
      <span style="opacity:.6">${siteName} is currently:</span>
      <span style="
        background:${modeLabel.bg}; color:#fff;
        padding:.15rem .55rem; border-radius:99px; font-size:11px;
        display:inline-flex; align-items:center; gap:.3rem;
      ">
        <span style="width:6px;height:6px;border-radius:50%;background:${modeLabel.dot};flex-shrink:0"></span>
        ${modeLabel.text}
      </span>
    </span>
    <button id="wtdg-preview-clear" style="
      background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2);
      color: #e2e8f0; border-radius: .3rem; padding: .2rem .65rem;
      font-size: 11px; font-weight: 700; cursor: pointer; font-family: inherit;
    ">✕ Exit Preview</button>
  `;
  document.body.prepend(bar);

  // Push page content down so bar doesn't cover anything
  document.body.style.paddingTop = '36px';

  // Clear cookie button
  document.getElementById('wtdg-preview-clear').addEventListener('click', () => {
    document.cookie = 'wtdg_admin_bypass=1; path=/; max-age=0'; // delete
    bar.remove();
    document.body.style.paddingTop = '';
  });
})();

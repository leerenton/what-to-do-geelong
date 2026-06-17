'use strict';
/* ── Admin Preview Bar ───────────────────────────────────────────────────────
   Shows a sticky bar at the top when the wtdg_admin_bypass cookie is set,
   indicating preview mode and the current site's live status.
   ─────────────────────────────────────────────────────────────────────────── */
(async function initPreviewBar() {
  // Only show if bypass cookie is present
  if (!document.cookie.includes('wtdg_admin_bypass=1')) return;

  // Fetch current site mode from DB
  let siteMode = 'unknown';
  let siteName = window.location.hostname;
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
    unknown:     { text: '⚠️ Unknown',      bg: '#374151', dot: '#9ca3af' },
  }[siteMode] || { text: siteMode, bg: '#374151', dot: '#9ca3af' };

  // Inject bar
  const bar = document.createElement('div');
  bar.id = 'wtdg-preview-bar';
  bar.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
    background: #0f172a; color: #e2e8f0;
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;
    padding: 0 .75rem;
    font-family: -apple-system, BlinkMacSystemFont, 'DM Sans', sans-serif;
    font-size: 12px; font-weight: 600; gap: .4rem;
    box-shadow: 0 2px 8px rgba(0,0,0,.4);
    min-height: 36px;
  `;
  bar.innerHTML = `
    <span style="display:flex;align-items:center;gap:.4rem;opacity:.7;white-space:nowrap">
      👁 <span class="pbar-label">Admin Preview</span>
    </span>
    <span style="display:flex;align-items:center;gap:.4rem;flex:1;justify-content:center;min-width:0">
      <span style="opacity:.6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px" class="pbar-site">${siteName}:</span>
      <span style="
        background:${modeLabel.bg}; color:#fff;
        padding:.15rem .5rem; border-radius:99px; font-size:11px;
        display:inline-flex; align-items:center; gap:.3rem; white-space:nowrap; flex-shrink:0;
      ">
        <span style="width:6px;height:6px;border-radius:50%;background:${modeLabel.dot};flex-shrink:0"></span>
        ${modeLabel.text}
      </span>
    </span>
    <button id="wtdg-preview-clear" style="
      background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);
      color: #e2e8f0; border-radius: .3rem; padding: .25rem .6rem;
      font-size: 11px; font-weight: 700; cursor: pointer; font-family: inherit;
      white-space: nowrap; flex-shrink: 0;
    ">✕ Exit</button>
  `;
  document.body.prepend(bar);

  // Push page content down — use actual bar height (may wrap on very small screens)
  const barH = bar.getBoundingClientRect().height || 36;
  document.body.style.paddingTop = barH + 'px';

  // Clear cookie button
  document.getElementById('wtdg-preview-clear').addEventListener('click', () => {
    document.cookie = 'wtdg_admin_bypass=1; path=/; max-age=0'; // delete
    bar.remove();
    document.body.style.paddingTop = '';
  });
})();

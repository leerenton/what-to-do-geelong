'use strict';
// ── WTDG Admin Image Uploader ──────────────────────────────
// Uploads a File to Supabase Storage 'media' bucket.
// Returns the public URL, or null on failure.

const SUPABASE_URL_BASE = 'https://duhxszqyyzrbzrhwneey.supabase.co';

async function uploadMediaFile(file, folder = 'uploads') {
  if (!file || !window.db) return null;
  const ext  = file.name.split('.').pop().toLowerCase();
  const name = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2,7)}.${ext}`;
  const { data, error } = await db.storage.from('media').upload(name, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) {
    console.error('[upload]', error.message);
    return null;
  }
  const { data: { publicUrl } } = db.storage.from('media').getPublicUrl(data.path);
  return publicUrl;
}
window.uploadMediaFile = uploadMediaFile;

// ── Bind a drop zone + file input to an img URL <input> ────
// Params:
//   zoneEl   – the .adm-upload-zone element (or null to use uploadBtn only)
//   fileInput – <input type="file"> hidden inside zone
//   urlInput  – the <input type="text"> that holds the resulting URL
//   previewEl – optional <img> element to show preview
//   folder    – storage folder prefix
function bindUploadZone({ zoneEl, fileInput, urlInput, previewEl, folder = 'uploads', onUploaded } = {}) {
  function showPreview(url) {
    if (previewEl && url) { previewEl.src = url; previewEl.style.display = 'block'; }
    else if (previewEl) previewEl.style.display = 'none';
  }

  async function handleFile(file) {
    if (!file) return;
    const statusEl = zoneEl || urlInput?.parentElement;
    if (zoneEl) zoneEl.textContent = '⏳ Uploading…';
    const url = await uploadMediaFile(file, folder);
    if (!url) {
      if (zoneEl) zoneEl.innerHTML = '✗ Upload failed — check storage bucket setup';
      return;
    }
    if (urlInput) urlInput.value = url;
    showPreview(url);
    if (zoneEl) zoneEl.innerHTML = `✓ Uploaded · <span style="font-size:.7rem;word-break:break-all">${url}</span>`;
    if (onUploaded) onUploaded(url);
  }

  if (fileInput) {
    fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));
  }

  if (zoneEl) {
    zoneEl.addEventListener('click', () => fileInput?.click());
    zoneEl.addEventListener('dragover', e => { e.preventDefault(); zoneEl.classList.add('drag-over'); });
    zoneEl.addEventListener('dragleave', () => zoneEl.classList.remove('drag-over'));
    zoneEl.addEventListener('drop', e => {
      e.preventDefault(); zoneEl.classList.remove('drag-over');
      handleFile(e.dataTransfer.files[0]);
    });
  }

  // Show existing preview from URL input
  if (urlInput && previewEl) {
    urlInput.addEventListener('input', () => showPreview(urlInput.value));
    showPreview(urlInput.value);
  }
}
window.bindUploadZone = bindUploadZone;

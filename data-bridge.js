// Fetches real content from the SSV Supabase project (same one the amged-admin
// CMS writes to) and replaces the hardcoded placeholder cards below with it.
// Anon key only — already public (ships in the amged-admin JS bundle today).
(function () {
  var SUPABASE_URL = 'https://ityojglmlgdadusstlpv.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0eW9qZ2xtbGdkYWR1c3N0bHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDg3NTMsImV4cCI6MjA5ODkyNDc1M30.h-6opQTwYYQnOIe3PoCmI7Iw4Z8jEDbRJ-pqwI3efIo';

  if (!window.supabase || !window.supabase.createClient) {
    console.error('Supabase JS did not load — data bridge disabled.');
    return;
  }
  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  function escapeHtml(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isSafeUrl(u) {
    return typeof u === 'string' && /^https:\/\//i.test(u);
  }

  function emptyMsg(text) {
    return '<p style="color:#999;text-align:center;padding:2rem;grid-column:1/-1;width:100%;">' + escapeHtml(text) + '</p>';
  }

  function setTarget(name, html) {
    var el = document.querySelector('[data-dc-target="' + name + '"]');
    if (el) el.innerHTML = html;
  }

  // ---- Team ----
  function teamCardHtml(m) {
    var photo = isSafeUrl(m.photo_url)
      ? '<img src="' + escapeHtml(m.photo_url) + '" alt="" style="width:100%;height:240px;object-fit:cover;display:block;">'
      : '<div class="team-avatar"><i class="fas fa-user-tie"></i></div>';
    return (
      '<div class="team-card">' +
        photo +
        '<div style="padding: 2rem;">' +
          '<h3 style="font-size: 1.2rem; font-weight: 600; color: #1a1a1a; margin-bottom: 0.25rem;">' + escapeHtml(m.name) + '</h3>' +
          (m.title ? '<p style="color: #c41e3a; font-weight: 600; font-size: 0.9rem; margin-bottom: 1rem;">' + escapeHtml(m.title) + '</p>' : '') +
          (m.bio ? '<p style="color: #666; font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.5rem;">' + escapeHtml(m.bio) + '</p>' : '') +
          (isSafeUrl(m.linkedin) ? '<div style="display: flex; gap: 0.75rem; justify-content: center;"><a href="' + escapeHtml(m.linkedin) + '" target="_blank" rel="noreferrer" style="color: #c41e3a;"><i class="fab fa-linkedin"></i></a></div>' : '') +
        '</div>' +
      '</div>'
    );
  }

  function loadTeam() {
    sb.from('members').select('*').order('display_order').then(function (res) {
      var rows = res.data || [];
      setTarget('team-grid', rows.length ? rows.map(teamCardHtml).join('') : emptyMsg('Team info coming soon.'));
    });
  }

  // ---- Gallery ----
  var GALLERY_CATEGORY_ICON = {
    'Emergency Medical Response': 'fa-hospital',
    'Education & Vocational Training': 'fa-book',
    'WASH & Infrastructure': 'fa-water',
    'Community': 'fa-users',
    'Field Stories': 'fa-camera',
    'Other': 'fa-images',
  };

  function galleryGroupHtml(category, items) {
    var icon = GALLERY_CATEGORY_ICON[category] || 'fa-images';
    return (
      '<div style="margin-bottom: 4rem;">' +
        '<h3 style="font-size: 1.5rem; font-weight: 600; color: #c41e3a; margin-bottom: 1.5rem;"><i class="fas ' + icon + '" style="margin-right: 0.5rem;"></i>' + escapeHtml(category) + '</h3>' +
        '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">' +
          items.map(function (item) {
            return isSafeUrl(item.image_url)
              ? '<img class="gallery-image" src="' + escapeHtml(item.image_url) + '" alt="' + escapeHtml(item.title || '') + '">'
              : '';
          }).join('') +
        '</div>' +
      '</div>'
    );
  }

  function loadGallery() {
    sb.from('gallery').select('*').eq('published', true).order('sort_order').then(function (res) {
      var rows = res.data || [];
      if (!rows.length) { setTarget('gallery-content', emptyMsg('Gallery photos coming soon.')); return; }
      var groups = {};
      var order = [];
      rows.forEach(function (item) {
        var cat = item.category || 'Other';
        if (!groups[cat]) { groups[cat] = []; order.push(cat); }
        groups[cat].push(item);
      });
      setTarget('gallery-content', order.map(function (cat) { return galleryGroupHtml(cat, groups[cat]); }).join(''));
    });
  }

  // ---- Reports (documents) ----
  function reportCardHtml(d) {
    var dateLabel = d.created_at ? new Date(d.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : '';
    return (
      '<div class="publication-card">' +
        '<div style="display: flex; align-items: start; gap: 1rem; margin-bottom: 1rem;">' +
          '<div style="font-size: 2rem; color: #c41e3a;"><i class="fas fa-file-pdf"></i></div>' +
          '<div>' +
            '<h3 style="font-size: 1.1rem; font-weight: 600; color: #1a1a1a; margin-bottom: 0.25rem;">' + escapeHtml(d.title || 'Untitled') + '</h3>' +
            (dateLabel ? '<p style="font-size: 0.85rem; color: #999;">Published: ' + escapeHtml(dateLabel) + '</p>' : '') +
          '</div>' +
        '</div>' +
        (d.description ? '<p style="color: #666; font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.5rem;">' + escapeHtml(d.description) + '</p>' : '') +
        (isSafeUrl(d.file_url) ? '<a href="' + escapeHtml(d.file_url) + '" target="_blank" rel="noreferrer" style="color: #c41e3a; font-weight: 600; font-size: 0.9rem; text-decoration: none;"><i class="fas fa-download" style="margin-right: 0.3rem;"></i>Download →</a>' : '') +
      '</div>'
    );
  }

  function loadReports() {
    sb.from('documents').select('*').eq('published', true).order('created_at', { ascending: false }).then(function (res) {
      var rows = res.data || [];
      setTarget('reports-grid', rows.length ? rows.map(reportCardHtml).join('') : emptyMsg('Reports coming soon.'));
    });
  }

  // ---- Media: videos + news ----
  function videoCardHtml(m) {
    var thumbStyle = isSafeUrl(m.thumbnail_url)
      ? 'background-image: url(' + "'" + escapeHtml(m.thumbnail_url) + "'" + '); background-size: cover; background-position: center;'
      : 'background: linear-gradient(135deg, #c41e3a, #8b1428);';
    return (
      '<a href="' + (isSafeUrl(m.url) ? escapeHtml(m.url) : '#') + '" target="_blank" rel="noreferrer" style="text-decoration: none; color: inherit;">' +
      '<div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">' +
        '<div class="video-thumbnail" style="' + thumbStyle + '"><i class="play-icon fas fa-play"></i></div>' +
        '<div style="padding: 1.5rem;">' +
          '<h4 style="font-size: 1.1rem; font-weight: 600; color: #1a1a1a; margin-bottom: 0.75rem;">' + escapeHtml(m.title) + '</h4>' +
          (m.description ? '<p style="color: #666; font-size: 0.9rem; line-height: 1.6;">' + escapeHtml(m.description) + '</p>' : '') +
          (m.source ? '<p style="font-size: 0.8rem; color: #999; margin-top: 1rem;"><i class="fas fa-play-circle"></i> ' + escapeHtml(m.source) + '</p>' : '') +
        '</div>' +
      '</div>' +
      '</a>'
    );
  }

  function newsCardHtml(m) {
    var dateLabel = m.created_at ? new Date(m.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : '';
    return (
      '<div style="background: white; padding: 2rem; border-radius: 10px; border-left: 5px solid #c41e3a; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">' +
        '<div style="display: flex; align-items: start; justify-content: space-between; gap: 1rem; margin-bottom: 1rem;">' +
          '<h4 style="font-size: 1.1rem; font-weight: 600; color: #1a1a1a;">' + escapeHtml(m.title) + '</h4>' +
          '<span style="font-size: 0.8rem; color: #999; white-space: nowrap;">' + escapeHtml(m.source || '') + (m.source && dateLabel ? ' | ' : '') + escapeHtml(dateLabel) + '</span>' +
        '</div>' +
        (m.description ? '<p style="color: #666; font-size: 0.9rem; line-height: 1.6;">' + escapeHtml(m.description) + '</p>' : '') +
        (isSafeUrl(m.url) ? '<a href="' + escapeHtml(m.url) + '" target="_blank" rel="noreferrer" style="color: #c41e3a; font-weight: 600; font-size: 0.9rem; margin-top: 1rem; display: inline-block;"><i class="fas fa-external-link-alt" style="margin-right: 0.3rem;"></i>Read Article</a>' : '') +
      '</div>'
    );
  }

  function loadMedia() {
    sb.from('media').select('*').eq('published', true).order('created_at', { ascending: false }).then(function (res) {
      var rows = res.data || [];
      var videos = rows.filter(function (m) { return m.type === 'video'; });
      var news = rows.filter(function (m) { return m.type !== 'video'; });
      setTarget('media-videos-grid', videos.length ? videos.map(videoCardHtml).join('') : emptyMsg('Videos coming soon.'));
      setTarget('media-news-list', news.length ? news.map(newsCardHtml).join('') : emptyMsg('No press coverage yet.'));
    });
  }

  // ---- Partners ----
  function partnerCardHtml(p) {
    var logo = isSafeUrl(p.logo_url)
      ? '<img src="' + escapeHtml(p.logo_url) + '" alt="" style="max-height: 48px; max-width: 100%; margin-bottom: 0.5rem; object-fit: contain;">'
      : '<p style="font-size: 2.5rem; margin-bottom: 0.5rem;">🤝</p>';
    return (
      '<div style="background: white; padding: 1.5rem; border-radius: 10px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">' +
        logo +
        '<h4 style="font-size: 1rem; font-weight: 600; color: #1a1a1a; margin-bottom: 0.25rem;">' + escapeHtml(p.name) + '</h4>' +
        (p.tier ? '<p class="donor-badge">' + escapeHtml(p.tier) + '</p>' : '') +
        (p.description ? '<p style="color: #666; font-size: 0.8rem; margin-top: 1rem;">' + escapeHtml(p.description) + '</p>' : '') +
      '</div>'
    );
  }

  function loadPartners() {
    sb.from('partners').select('*').then(function (res) {
      var rows = res.data || [];
      setTarget('partners-grid', rows.length ? rows.map(partnerCardHtml).join('') : emptyMsg('Partner list coming soon.'));
    });
  }

  // ---- Impact Dashboard top KPIs (only these 3 map to impact_stats;
  // Program Performance / Beneficiary Stories / Quarterly Trends are
  // hand-crafted content with no matching table, left static) ----
  function loadKpis() {
    var keys = ['total_lives_impacted', 'direct_beneficiaries', 'investment_2025'];
    var anyTarget = keys.some(function (k) { return document.querySelector('[data-dc-target="kpi-' + k + '"]'); });
    if (!anyTarget) return;
    sb.from('impact_stats').select('*').in('key', keys).then(function (res) {
      (res.data || []).forEach(function (stat) {
        var numEl = document.querySelector('[data-dc-target="kpi-' + stat.key + '"]');
        var labelEl = document.querySelector('[data-dc-target="kpi-' + stat.key + '-label"]');
        if (numEl) numEl.textContent = stat.value;
        if (labelEl && stat.unit) labelEl.textContent = stat.unit;
      });
    });
  }

  // ---- Announcements (social feed) ----
  var ANNOUNCEMENT_ICON = { news: '📰', event: '📅', social: '💬' };

  function announcementCardHtml(a) {
    var when = a.created_at ? new Date(a.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
    return (
      '<div class="social-post">' +
        '<div class="social-header">' +
          '<div class="social-avatar">' + (ANNOUNCEMENT_ICON[a.type] || '📢') + '</div>' +
          '<div>' +
            '<p style="font-weight: 600; color: #1a1a1a; font-size: 0.9rem;">SSV</p>' +
            (when ? '<p style="font-size: 0.8rem; color: #999;">' + escapeHtml(when) + '</p>' : '') +
          '</div>' +
        '</div>' +
        '<div style="padding: 1.5rem;">' +
          '<p style="color: #1a1a1a; line-height: 1.6; margin-bottom: 0.5rem;"><strong>' + escapeHtml(a.title) + '</strong></p>' +
          (a.body ? '<p style="color: #666; line-height: 1.6;">' + escapeHtml(a.body) + '</p>' : '') +
        '</div>' +
      '</div>'
    );
  }

  function loadAnnouncements() {
    sb.from('announcements').select('*').eq('published', true).order('created_at', { ascending: false }).limit(6).then(function (res) {
      var rows = res.data || [];
      var html = rows.length ? rows.map(announcementCardHtml).join('') : emptyMsg('No updates yet.');
      var apply = function () {
        var el = document.querySelector('.social-feed');
        if (el) el.innerHTML = html;
      };
      // .social-feed is re-rendered by the page's own template engine shortly
      // after initial load (unlike the other sections, which are static HTML) —
      // apply immediately, then again after that engine has had time to settle,
      // so whichever runs last is what's actually visible.
      apply();
      setTimeout(apply, 600);
      setTimeout(apply, 1500);
    });
  }

  function boot() {
    loadTeam();
    loadGallery();
    loadReports();
    loadMedia();
    loadPartners();
    loadAnnouncements();
    loadKpis();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

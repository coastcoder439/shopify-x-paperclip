/* ============================================================================
   Reiter „Sichtbarkeit" — Shell mit drei Ebenen.
   Website (Google-Ranking) · Social (Reichweite) · Bewertungen (Sterne).
   Die Ebenen selbst liegen in sicht-*.js und registrieren sich unter SICHT.
   ========================================================================== */
(function () {
  'use strict';
  var F = DEMO.fmt, A = DEMO.actions;

  window.SICHT = window.SICHT || {};

  var ICONS = {
    website: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    social: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="m8.4 10.7 7.2-4.2M8.4 13.3l7.2 4.2"/></svg>',
    reviews: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="m12 3.5 2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.8l6-.8Z"/></svg>'
  };

  var TINT = { website: '#EAF0FB', social: '#EFEAF7', reviews: '#FBF3DC' };
  var FG = { website: '#3B6FD4', social: '#7256A8', reviews: '#B97F10' };

  function segbar(S) {
    var aktiv = S.filters.sicht || 'website';
    var so = DEMO.socialStats(S.range);
    var rv = DEMO.reviewStats();
    var avgPos = DEMO.data.keywords.reduce(function (s, k) { return s + k.pos; }, 0) / DEMO.data.keywords.length;

    var segs = [
      { id: 'website', t: 'Website', v: '<b>Ø Platz ' + avgPos.toFixed(1).replace('.', ',') + '</b> bei Google' },
      { id: 'social', t: 'Social', v: '<b>' + F.num(so.followers) + '</b> Follower · ' + so.kanaele.length + ' Kanäle' },
      { id: 'reviews', t: 'Bewertungen', v: '<b>' + rv.avg.toFixed(1).replace('.', ',') + ' ★</b> aus ' + rv.total +
          (rv.open ? ' · <span style="color:var(--amber)">' + rv.open + ' offen</span>' : '') }
    ];

    return '<div class="segbar">' + segs.map(function (s) {
      return '<button class="segbig' + (aktiv === s.id ? ' on' : '') + '" data-act="sicht.seg" data-arg="' + s.id + '">' +
        '<span class="segbig-ico" style="background:' + TINT[s.id] + ';color:' + FG[s.id] + '">' + ICONS[s.id] + '</span>' +
        '<span><span class="segbig-t">' + s.t + '</span><span class="segbig-v">' + s.v + '</span></span>' +
      '</button>';
    }).join('') + '</div>';
  }

  DEMO.views.sichtbarkeit = {
    render: function (S) {
      var seg = S.filters.sicht || 'website';
      var mod = window.SICHT[seg];
      if (!mod || typeof mod.render !== 'function') {
        return segbar(S) + '<div class="empty"><div class="empty-t">Diese Ebene konnte nicht geladen werden</div>' +
          'Die Datei <span class="mono">sicht-' + F.esc(seg) + '.js</span> fehlt oder hat einen Fehler.</div>';
      }
      return segbar(S) + mod.render(S);
    },
    mount: function (root, S) {
      var mod = window.SICHT[S.filters.sicht || 'website'];
      if (mod && mod.mount) mod.mount(root, S);
    }
  };

  A['sicht.seg'] = function (id) {
    DEMO.state.filters.sicht = id;
    DEMO.render();
    window.scrollTo(0, 0);
  };
})();

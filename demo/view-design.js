/* ============================================================================
   View: Design-Studio — Trend-Radar, Entwürfe, Pipeline, Design-Bibliothek.
   Reine HTML-Strings aus DEMO.state/DEMO.data; Interaktion nur über data-act.
   ========================================================================== */
(function () {
  'use strict';
  var A = DEMO.actions, F = DEMO.fmt, D = DEMO.data, U = DEMO.ui;

  /* --- Feste Ergebnisse für „Tiefer prüfen" — ehrlich: kein Einstieg ------- */
  var DEEP_RESULT = {
    t2: {
      text: 'Konkurrenz ist in 4 Wochen von 780 auf 1.100 Listings gewachsen, der Ø-Preis ist stabil. Idas Empfehlung: <b>noch nicht einsteigen</b> — erst bei einer eigenen Bildidee, sonst wird es ein Preiskampf.',
      short: 'noch nicht einsteigen'
    },
    t3: {
      text: '4.200 konkurrierende Listings, Ø-Preis in 3 Monaten von 14 € auf 11 € gefallen. Idas Empfehlung: <b>auslassen</b> — die Nische verdient sich gerade selbst kaputt.',
      short: 'auslassen'
    }
  };

  /* --- Kleine Helfer -------------------------------------------------------- */
  function hasProduct(list, needle) {
    for (var i = 0; i < list.length; i++) { if (list[i].indexOf(needle) === 0) return true; }
    return false;
  }
  function statusTag(status) {
    if (status === 'new') return '<span class="tag new">Neu</span>';
    if (status === 'paused') return '<span class="tag paused">Pausiert</span>';
    return '<span class="tag">Live</span>';
  }
  function trendWord(t) { return t === 'up' ? 'steigend' : t === 'down' ? 'fallend' : 'stabil'; }
  function sparkSvg(trend) {
    var cls = trend === 'up' ? '' : trend === 'down' ? ' down' : ' flat';
    var path = trend === 'up' ? 'M1 13 Q10 12 15 9 T30 6 T45 2'
      : trend === 'down' ? 'M1 4 Q12 5 20 8 T34 10 T45 13'
      : 'M1 9 Q12 8 20 9 T34 8 T45 8';
    return '<svg class="spark' + cls + '" width="46" height="16" viewBox="0 0 46 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="' + path + '"/></svg>';
  }
  // Kürzt lange Agent-Hinweise für einzeilige Tabellenzeilen — voller Text bleibt im openDesign-Drawer.
  function truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function trendPill(t) {
    if (t.status === 'briefed') return '<span class="pill working"><span class="p-dot"></span>Brief an Theo</span>';
    if (t.status === 'live') return '<span class="pill working"><span class="p-dot"></span>live</span>';
    return '<span class="pill idle"><span class="p-dot"></span>beobachten</span>';
  }

  /* --- Produkt-Mockups: reines SVG, Motiv als Verlauf aus g1/g2 ------------- */
  function shirtMockup(gid, g1, g2, initials, w, h) {
    return '<svg viewBox="0 0 120 130" width="' + w + '" height="' + h + '" aria-hidden="true">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="' + g1 + '"/><stop offset="1" stop-color="' + g2 + '"/>' +
      '</linearGradient></defs>' +
      '<path d="M42 8 L20 18 L8 40 L24 50 L28 42 L28 122 L92 122 L92 42 L96 50 L112 40 L100 18 L78 8 C74 18 66 22 60 22 C54 22 46 18 42 8 Z" fill="#EFE9DF" stroke="#DDD5C8" stroke-width="1.2"/>' +
      '<rect x="44" y="46" width="32" height="40" rx="2" fill="url(#' + gid + ')"/>' +
      '<text x="60" y="70" text-anchor="middle" dominant-baseline="middle" font-size="13" font-weight="700" fill="#fff" fill-opacity="0.4">' + F.esc(initials) + '</text>' +
    '</svg>';
  }
  function posterMockup(gid, g1, g2, initials, w, h) {
    return '<svg viewBox="0 0 100 130" width="' + w + '" height="' + h + '" aria-hidden="true">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="' + g1 + '"/><stop offset="1" stop-color="' + g2 + '"/>' +
      '</linearGradient></defs>' +
      '<rect x="10" y="8" width="80" height="114" rx="1.5" fill="#fff" stroke="#E2E2E2"/>' +
      '<rect x="18" y="16" width="64" height="98" rx="1" fill="url(#' + gid + ')"/>' +
      '<text x="50" y="68" text-anchor="middle" dominant-baseline="middle" font-size="15" font-weight="700" fill="#fff" fill-opacity="0.4">' + F.esc(initials) + '</text>' +
    '</svg>';
  }
  // Wählt automatisch Shirt- oder Poster-Silhouette; Breite wird im Seitenverhältnis mitgeführt.
  function mockupFor(items, g1, g2, initials, w, h, gid) {
    if (hasProduct(items, 'Shirt')) return shirtMockup(gid, g1, g2, initials, w, h);
    return posterMockup(gid, g1, g2, initials, Math.round(w * 100 / 120), h);
  }

  /* --- 1. Kopfzeile ---------------------------------------------------------*/
  function headerNotice() {
    return '<div class="notice info">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.5v.01"/></svg>' +
      '<span style="flex:1;min-width:0">So entsteht ein Design: <b>Ida</b> findet die Nische → <b>Theo</b> baut die Entwürfe → <b>du</b> gibst frei → Shopify stellt live.</span>' +
      '<span class="notice-act"><button class="btn ghost sm" data-act="dz.scan">Ida einen Trend suchen lassen</button></span>' +
    '</div>';
  }

  /* --- 2. Trend-Radar ------------------------------------------------------- */
  // Disclosure-Maß: Name, Score-Balken, Pill, EIN kv-Wert — Rest (Volumen, Konkurrenz,
  // gefunden-Zeitpunkt, Tiefer-prüfen/Entwürfe-Aktionen) wandert in den dz.trend-Drawer.
  // Die ganze Karte ist die Klickfläche (data-act direkt auf .card) statt eines Detail-Buttons.
  function trendCard(t) {
    return '<div class="card" data-act="dz.trend" data-arg="' + t.id + '">' +
        '<div class="card-pad">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px">' +
            '<span style="font-size:14px;font-weight:600">' + F.esc(t.name) + '</span>' + trendPill(t) +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;align-items:baseline;margin:10px 0 4px">' +
            '<span class="kv-k">Score</span><span class="mono" style="font-size:12px">' + t.score + '/100</span>' +
          '</div>' +
          '<div class="prog"><i style="width:' + t.score + '%"></i></div>' +
        '</div>' +
        '<div class="peek" style="margin-top:auto">' +
          '<span class="peek-label">Suchinteresse</span>' +
          '<span class="peek-value"><span class="trend up">' + F.esc(t.growth) + '</span></span>' +
        '</div>' +
      '</div>';
  }
  function trendSection(S) {
    return '<div class="section-head">' +
        '<div><div class="section-title">Trend-Radar</div><div class="section-sub">Was Ida gefunden hat · Quellen: Google Trends, Etsy, Pinterest</div></div>' +
        '<div class="section-action"><button class="btn ghost sm" data-act="askAgent" data-arg="ida">Ida fragen</button></div>' +
      '</div>' +
      '<div class="trio-grid">' + S.trends.map(trendCard).join('') + '</div>';
  }

  /* --- 3. Entwürfe ----------------------------------------------------------*/
  function draftCard(d) {
    var mock = mockupFor(d.products, d.g1, d.g2, d.initials, 110, 120, 'gc_' + d.id);
    return '<div class="card" data-act="openDraft" data-arg="' + d.id + '">' +
        '<div style="height:150px;background:var(--sidebar);display:flex;align-items:center;justify-content:center">' + mock + '</div>' +
        '<div class="card-pad">' +
          '<div style="font-weight:600;font-size:13.5px">' + F.esc(d.name) + '</div>' +
          '<div class="hint">' + F.esc(d.products.join(' · ')) + '</div>' +
          '<div class="mono" style="font-size:11px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="' + F.esc(d.price) + '">' + F.esc(d.price) + '</div>' +
        '</div>' +
        '<div class="card-foot"><button class="btn ghost sm" data-act="openDraft" data-arg="' + d.id + '">Ansehen</button></div>' +
      '</div>';
  }
  function draftsSection(S) {
    var open = S.drafts.filter(function (d) { return d.status === 'draft'; });
    var body = open.length
      ? '<div class="post-grid">' + open.map(draftCard).join('') + '</div>'
      : '<div class="empty"><div class="empty-t">Alle Entwürfe sind live</div>' +
        '<div>Theo wartet auf den nächsten Brief von Ida.</div>' +
        '<div style="margin-top:10px"><button class="btn ghost sm" data-act="dz.toLib">Zur Design-Bibliothek</button></div></div>';
    return '<div class="section-head" id="designStudioDrafts">' +
        '<div><div class="section-title">Entwürfe</div><div class="section-sub">' + S.drafts.length + ' Entwürfe von Theo · aus dem Brief „Retro Trail Running"</div></div>' +
        '<div class="section-action"><button class="btn ghost sm" data-act="askAgent" data-arg="theo">Theo fragen</button></div>' +
      '</div>' + body;
  }

  /* --- 4. Pipeline -----------------------------------------------------------*/
  function pipeItem(swatchCss, text, act, arg) {
    return '<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid var(--border-soft)" data-act="' + act + '" data-arg="' + arg + '">' +
      '<span style="width:22px;height:22px;border-radius:6px;flex:none;' + swatchCss + '"></span>' +
      '<span style="font-size:12px">' + F.esc(text) + '</span>' +
    '</div>';
  }
  function pipeCol(label, count, items) {
    return '<div class="pipeline-col">' +
        '<div class="stage-label">' + label + '</div>' +
        '<div class="stage-num">' + count + '</div>' +
        (items || '<div class="hint">—</div>') +
      '</div>';
  }
  function pipelineSection(S) {
    var idaBg = 'background:' + DEMO.agent('ida').color;
    var theoBg = 'background:' + DEMO.agent('theo').color;

    var research = S.trends.map(function (t) { return pipeItem(idaBg, t.name, 'dz.trend', t.id); }).join('');

    var openDrafts = S.drafts.filter(function (d) { return d.status === 'draft'; });
    var draftItems = openDrafts.map(function (d) {
      return pipeItem('background:linear-gradient(135deg,' + d.g1 + ',' + d.g2 + ')', d.name.replace('Nordic Trails · ', ''), 'openDraft', d.id);
    }).join('');

    var openDesignApprovals = DEMO.openApprovals().filter(function (a) { return a.kind === 'designs'; });
    var approvalItems = openDesignApprovals.map(function (a) { return pipeItem(theoBg, a.title, 'openApproval', a.id); }).join('');

    var liveDesigns = S.designs.filter(function (d) { return d.status === 'new'; });
    var liveItems = liveDesigns.map(function (d) {
      return pipeItem('background:linear-gradient(135deg,' + d.g1 + ',' + d.g2 + ')', d.name, 'openDesign', d.id);
    }).join('');

    return '<div class="section-head"><div><div class="section-title">Pipeline</div><div class="section-sub">Jede Karte ist eine echte Position — klick sie an</div></div></div>' +
      '<div class="card"><div class="pipeline-grid">' +
        pipeCol('RECHERCHE', S.trends.length, research) +
        pipeCol('ENTWURF', openDrafts.length, draftItems) +
        pipeCol('FREIGABE', openDesignApprovals.length, approvalItems) +
        pipeCol('LIVE · 7 TAGE', liveDesigns.length, liveItems) +
      '</div></div>';
  }

  /* --- 5. Design-Bibliothek --------------------------------------------------*/
  function filterCounts(S) {
    var c = { all: S.designs.length, live: 0, new: 0, paused: 0 };
    S.designs.forEach(function (d) { if (c[d.status] !== undefined) c[d.status]++; });
    return c;
  }
  function segHtml(S) {
    var counts = filterCounts(S), cur = S.filters.dzLib || 'all';
    var opts = [['all', 'Alle'], ['live', 'Live'], ['new', 'Neu'], ['paused', 'Pausiert']];
    return '<div class="seg">' + opts.map(function (o) {
      return '<button class="' + (cur === o[0] ? 'on' : '') + '" data-act="dz.filter" data-arg="' + o[0] + '">' + o[1] + ' (' + counts[o[0]] + ')</button>';
    }).join('') + '</div>';
  }
  function searchHtml(S) {
    return '<div class="search-in" style="margin-left:auto">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
      '<input data-model="dz.q" data-live="1" data-focus-key="dz.q" placeholder="Design oder SKU suchen …" value="' + F.esc(S.forms['dz.q'] || '') + '">' +
    '</div>';
  }
  function sortArrow(S, key) {
    var s = S.sort.lib || { key: 'revenue30', dir: 'desc' };
    if (s.key !== key) return '';
    return '<span class="sort-ar">' + (s.dir === 'asc' ? '▲' : '▼') + '</span>';
  }
  function thSort(S, key, label) {
    return '<th class="sortable" data-act="sort" data-arg="lib|' + key + '">' + label + sortArrow(S, key) + '</th>';
  }
  function libraryRows(S) {
    var filter = S.filters.dzLib || 'all';
    var q = (S.forms['dz.q'] || '').trim().toLowerCase();
    var rows = S.designs.filter(function (d) {
      if (filter !== 'all' && d.status !== filter) return false;
      if (q && d.name.toLowerCase().indexOf(q) < 0 && d.sku.toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var sort = S.sort.lib || { key: 'revenue30', dir: 'desc' };
    rows = rows.slice().sort(function (a, b) {
      var av = a[sort.key], bv = b[sort.key];
      if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }
  function libRow(d) {
    return '<tr class="row-link" data-act="openDesign" data-arg="' + d.id + '">' +
        '<td><div class="prod-cell">' +
          '<span class="prod-thumb" style="background:linear-gradient(135deg,' + d.g1 + ',' + d.g2 + ')">' + F.esc(d.initials) + '</span>' +
          '<div><div class="prod-name">' + F.esc(d.name) + '</div><div class="prod-sku">' + d.sku + '</div></div>' +
        '</div></td>' +
        '<td>' + statusTag(d.status) + '</td>' +
        '<td>' + d.listings + '</td>' +
        '<td class="rev">' + F.eur(d.revenue30) + '</td>' +
        '<td>' + sparkSvg(d.trend) + '</td>' +
        '<td class="agent-hint" style="white-space:nowrap">' + F.esc(truncate(d.note, 46)) + '</td>' +
      '</tr>';
  }
  function libEmpty(q) {
    return '<tr><td colspan="6"><div class="empty sm">Kein Design passt zu „' + F.esc(q) + '"' +
      '<div style="margin-top:8px"><button class="btn ghost sm" data-act="dz.clear">Filter zurücksetzen</button></div></div></td></tr>';
  }
  function libFoot(rows, S) {
    var sum = rows.reduce(function (s, d) { return s + d.revenue30; }, 0);
    return '<div class="card-foot">' +
      '<span><b>' + rows.length + '</b> von ' + S.designs.length + ' Designs · Summe <b>' + F.eur(sum) + '</b></span>' +
      '<span>Bibliothek wird von Ida täglich neu bewertet</span>' +
    '</div>';
  }
  function librarySection(S) {
    var rows = libraryRows(S);
    var totalRevenue = S.designs.reduce(function (s, d) { return s + d.revenue30; }, 0);
    var q = S.forms['dz.q'] || '';
    var tbody = rows.length ? rows.map(libRow).join('') : libEmpty(q);
    return '<div class="section-head" id="designStudioLibrary">' +
        '<div><div class="section-title">Design-Bibliothek</div><div class="section-sub">' + S.designs.length + ' Designs · Summe 30-Tage-Umsatz ' + F.eur(totalRevenue) + '</div></div>' +
      '</div>' +
      '<div style="display:flex;gap:10px;align-items:center;margin-bottom:10px">' + segHtml(S) + searchHtml(S) + '</div>' +
      '<div class="card"><table class="products">' +
        '<thead><tr>' + thSort(S, 'name', 'Design') + '<th>Status</th>' + thSort(S, 'listings', 'Listings') + thSort(S, 'revenue30', '30-T.-Umsatz') + '<th>Trend</th><th>Agent-Hinweis</th></tr></thead>' +
        '<tbody>' + tbody + '</tbody>' +
      '</table>' + libFoot(rows, S) + '</div>';
  }

  /* --- View-Registrierung ---------------------------------------------------*/
  DEMO.views.design = {
    render: function (S) {
      return headerNotice() + trendSection(S) + draftsSection(S) + pipelineSection(S) + librarySection(S);
    }
  };

  /* --- Scroll-Helfer für dz.toDrafts / dz.toLib ------------------------------*/
  function scrollToId(id) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* --- openDesign / openDraft: exklusiv, global (core.js verlinkt beide) ---- */
  A['openDesign'] = function (id) {
    var d = DEMO.design(id);
    if (!d) return;
    var mock = mockupFor(d.variants, d.g1, d.g2, d.initials, 134, 145, 'gd_' + d.id);
    var kws = D.keywords.filter(function (k) { return k.design === d.id; });
    var kwHtml = kws.length
      ? kws.map(function (k) { return '<div class="kv-row"><span class="kv-k">' + F.esc(k.kw) + '</span><span class="kv-v">Platz ' + k.pos + '</span></div>'; }).join('')
      : '<div class="hint">Für dieses Design rankt noch kein Keyword in den Top 30.</div>';
    var noteHtml = d.noteBy
      ? '<div class="ag-now"><span class="agent-avatar sm" style="background:' + DEMO.agent(d.noteBy).color + '">' + DEMO.agent(d.noteBy).initials + '</span>&nbsp;' + F.esc(d.note) + '</div>'
      : '<div class="hint">Keine Notiz — das Design läuft unauffällig.</div>';
    U.drawer({
      title: d.name, sub: d.sku + ' · seit ' + d.since,
      body: '<div style="height:170px;background:var(--sidebar);border-radius:10px;display:flex;align-items:center;justify-content:center">' + mock + '</div>' +
        '<div class="drawer-grid">' +
          '<div class="mini"><div class="mini-k">30-T.-Umsatz</div><div class="mini-v">' + F.eur(d.revenue30) + '</div></div>' +
          '<div class="mini"><div class="mini-k">Listings</div><div class="mini-v">' + d.listings + '</div></div>' +
          '<div class="mini"><div class="mini-k">Status</div><div class="mini-v">' + statusTag(d.status) + '</div></div>' +
          '<div class="mini"><div class="mini-k">Trend</div><div class="mini-v">' + trendWord(d.trend) + '</div></div>' +
        '</div>' +
        '<h4 class="drawer-h">Varianten</h4><div class="chip-row">' + d.variants.map(function (v) { return '<span class="tag">' + F.esc(v) + '</span>'; }).join('') + '</div>' +
        '<h4 class="drawer-h">Rankt für</h4>' + kwHtml +
        '<h4 class="drawer-h">Notiz vom Team</h4>' + noteHtml,
      foot: '<button class="btn ghost" data-act="closeDrawer">Schließen</button>' +
            '<button class="btn primary" data-act="askAgent" data-arg="ida">Ida fragen</button>'
    });
  };

  A['openDraft'] = function (id) {
    var d = DEMO.draft(id);
    if (!d) return;
    var mocks = '';
    if (hasProduct(d.products, 'Shirt')) mocks += shirtMockup('gs_' + d.id, d.g1, d.g2, d.initials, 157, 170);
    if (hasProduct(d.products, 'Poster')) mocks += posterMockup('gp_' + d.id, d.g1, d.g2, d.initials, 131, 170);
    var isLive = d.status === 'live';
    var a1 = DEMO.approval('a1');
    var body = '<div style="height:200px;background:var(--sidebar);border-radius:10px;display:flex;align-items:center;justify-content:center;gap:22px">' + mocks + '</div>' +
      '<h4 class="drawer-h">Listing</h4>' +
      '<div style="font-weight:600;font-size:13.5px;margin-bottom:6px">' + F.esc(d.listingTitle) + '</div>' +
      '<div class="excerpt">' + F.rich(d.listingText) + '</div>' +
      '<h4 class="drawer-h">Tags</h4><div class="chip-row">' + d.tags.map(function (t) { return '<span class="tag">' + F.esc(t) + '</span>'; }).join('') + '</div>' +
      '<div class="drawer-grid">' +
        '<div class="mini"><div class="mini-k">Produkte</div><div class="mini-v">' + F.esc(d.products.join(', ')) + '</div></div>' +
        '<div class="mini"><div class="mini-k">Preise</div><div class="mini-v mono">' + F.esc(d.price) + '</div></div>' +
      '</div>' +
      (isLive ? '<div class="notice ok">Ist seit deiner Freigabe live.</div>' : '');
    var foot;
    if (isLive) {
      foot = '<button class="btn ghost" data-act="closeDrawer">Schließen</button>';
    } else {
      foot = '<button class="btn ghost" data-act="dz.discard" data-arg="' + d.id + '">Verwerfen</button>' +
             '<button class="btn ghost" data-act="dz.variant" data-arg="' + d.id + '">Variante anfordern</button>' +
             (a1 && a1.status === 'open' ? '<button class="btn primary" data-act="approve" data-arg="a1">Alle 4 freigeben</button>' : '');
    }
    U.drawer({ title: d.name, sub: 'Entwurf von Theo · aus „Retro Trail Running"', wide: true, body: body, foot: foot });
  };

  /* --- dz.* Namensraum --------------------------------------------------------*/
  A['dz.trend'] = function (id) {
    var t = DEMO.trend(id);
    if (!t) return;
    // Alles, was die Karte nicht mehr zeigt (Volumen, Konkurrenz, gefunden-Zeitpunkt,
    // Tiefer-geprüft-Ergebnis) plus die Status-Aktionen leben jetzt hier im Drawer.
    var res = DEEP_RESULT[id];
    var deepNotice = (t.status === 'watch' && t.deep && res)
      ? '<div class="notice warn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/></svg><span>' + res.text + '</span></div>'
      : '';
    var footBtn = t.status === 'briefed'
      ? '<button class="btn primary" data-act="dz.toDrafts">Entwürfe ansehen</button>'
      : (t.status === 'watch' && !t.deep ? '<button class="btn primary" data-act="dz.deep" data-arg="' + t.id + '">Tiefer prüfen</button>' : '');
    U.drawer({
      trendId: id,
      title: t.name, sub: 'gefunden ' + F.esc(t.found),
      body: '<p class="lead">' + F.esc(t.why) + '</p>' +
        deepNotice +
        '<div class="drawer-grid">' +
          '<div class="mini"><div class="mini-k">Score</div><div class="mini-v">' + t.score + '/100</div></div>' +
          '<div class="mini"><div class="mini-k">Wachstum</div><div class="mini-v">' + F.esc(t.growth) + '</div></div>' +
          '<div class="mini"><div class="mini-k">Volumen</div><div class="mini-v">' + F.num(t.volume) + '/Monat</div></div>' +
          '<div class="mini"><div class="mini-k">Konkurrenz</div><div class="mini-v">' + F.esc(t.competition) + '</div></div>' +
        '</div>' +
        '<h4 class="drawer-h">Design-Brief an Theo</h4><div class="excerpt">' + F.rich(t.brief) + '</div>',
      foot: '<button class="btn ghost" data-act="closeDrawer">Schließen</button>' + footBtn
    });
  };

  A['dz.deep'] = function (id) {
    var t = DEMO.trend(id);
    if (!t || t.deep) return;
    var res = DEEP_RESULT[id];
    if (!res) return;
    U.run({
      agent: 'ida', title: 'Nische tiefer prüfen',
      steps: [
        { text: 'Suchvolumen der letzten 90 Tage abgleichen', ms: 900 },
        { text: 'Etsy-Listings zählen und Preise erfassen', ms: 1100 },
        { text: 'Pinterest-Signale gewichten', ms: 800 },
        { text: 'Empfehlung formulieren', ms: 700 }
      ],
      done: { text: res.text, cta: 'Verstanden', act: 'closeModal' },
      onDone: function () {
        t.deep = true;
        DEMO.pushFeed('ida', '<b>Ida</b> hat <b>„' + F.esc(t.name) + '"</b> tiefer geprüft — Empfehlung: ' + res.short + '.', null, null);
        if (DEMO.state.tab === 'design') DEMO.render();
        // Trend-Drawer war die einzige Quelle für diese Aktion — steht er noch offen, frisch neu zeichnen.
        if (DEMO.state.drawer && DEMO.state.drawer.trendId === id) A['dz.trend'](id);
      }
    });
  };

  A['dz.scan'] = function () {
    U.run({
      agent: 'ida', title: 'Trend-Scan',
      steps: [
        { text: 'Google Trends nach neuen Signalen scannen', ms: 900 },
        { text: 'Etsy-Neuerscheinungen prüfen', ms: 1000 },
        { text: 'Pinterest-Wachstumsraten abgleichen', ms: 800 },
        { text: 'Ergebnis mit bekannten Nischen abgleichen', ms: 700 }
      ],
      done: {
        text: 'Kein neues Signal über der Schwelle — die drei bekannten Nischen sind weiter die besten Kandidaten. Ida meldet sich, sobald sich das ändert.',
        cta: 'Alles klar', act: 'closeModal'
      },
      onDone: function () {
        DEMO.pushFeed('ida', '<b>Ida</b> hat einen Trend-Scan gemacht — keine neue Nische über der Schwelle, die drei bekannten bleiben die besten Kandidaten.', null, null);
        if (DEMO.state.tab === 'design') DEMO.render();
      }
    });
  };

  A['dz.discard'] = function (id) {
    var drafts = DEMO.state.drafts, idx = -1;
    for (var i = 0; i < drafts.length; i++) { if (drafts[i].id === id) { idx = i; break; } }
    if (idx === -1) return;
    U.closeDrawer();
    drafts.splice(idx, 1);
    U.toast('Entwurf verworfen — Theo hat es notiert', 'warn');
    DEMO.pushFeed('theo', '<b>Theo</b> hat den verworfenen Entwurf notiert — für die nächste Runde.', null, null);
    DEMO.render();
  };

  A['dz.variant'] = function (id) {
    var orig = DEMO.draft(id);
    if (!orig) return;
    var newId = 'ev' + Math.random().toString(36).slice(2, 8);
    var shortLabel = orig.name.replace('Nordic Trails · ', '') + ' · Sand';
    U.run({
      agent: 'theo', title: 'Variante anfordern',
      steps: [
        { text: 'Motiv analysieren', ms: 700 },
        { text: 'Farbwelt variieren', ms: 900 },
        { text: 'Mockup rendern', ms: 800 },
        { text: 'Listing-Text anpassen', ms: 600 }
      ],
      done: { text: 'Variante „' + F.esc(shortLabel) + '" liegt bei den Entwürfen.', cta: 'Ansehen', act: 'openDraft', arg: newId },
      onDone: function () {
        DEMO.state.drafts.push({
          id: newId, name: orig.name + ' · Sand', initials: orig.initials,
          g1: '#C9A87C', g2: '#8A6E4B', trend: orig.trend,
          products: orig.products.slice(), price: orig.price,
          listingTitle: orig.listingTitle, listingText: orig.listingText,
          tags: orig.tags.slice(), status: 'draft'
        });
        DEMO.pushFeed('theo', '<b>Theo</b> hat die Variante <b>„' + F.esc(shortLabel) + '"</b> gerendert — liegt bei den Entwürfen.', null, null);
        if (DEMO.state.tab === 'design') DEMO.render();
      }
    });
  };

  A['dz.filter'] = function (arg) { DEMO.state.filters.dzLib = arg; DEMO.render(); };
  A['dz.clear'] = function () { DEMO.state.filters.dzLib = 'all'; DEMO.state.forms['dz.q'] = ''; DEMO.render(); };
  A['dz.toDrafts'] = function () { U.closeDrawer(); setTimeout(function () { scrollToId('designStudioDrafts'); }, 260); };
  A['dz.toLib'] = function () { U.closeDrawer(); setTimeout(function () { scrollToId('designStudioLibrary'); }, 260); };
})();

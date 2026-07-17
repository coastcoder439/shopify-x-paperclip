/* ============================================================================
   View: SEO & Ranking — Mias Arbeit an Rankings, Keywords und Content.
   Datenquelle ausschließlich DEMO.state.keywords / seoTasks / contentPlan und
   DEMO.data.traffic — keine eigenen Kennzahlen.
   ========================================================================== */
(function () {
  'use strict';
  var A = DEMO.actions, F = DEMO.fmt, D = DEMO.data, U = DEMO.ui;
  var ST = DEMO.state;

  /* --- Icons ---------------------------------------------------------------- */
  var GSC_ICON = '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#4285F4" stroke-width="2.6" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  var SEARCH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  var INFO_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v.01M12 11.5v5"/></svg>';

  var STATUS_LABEL = { review: 'Bei dir zur Freigabe', draft: 'Entwurf', live: 'Live' };

  var BUCKETS = [
    { name: 'Top 3', color: '#22A05A', test: function (p) { return p <= 3; } },
    { name: 'Platz 4–10', color: '#5E9E6E', test: function (p) { return p >= 4 && p <= 10; } },
    { name: 'Platz 11–20', color: '#F9AB00', test: function (p) { return p >= 11 && p <= 20; } },
    { name: 'Platz 21+', color: '#C9CDD2', test: function (p) { return p >= 21; } }
  ];

  var RUN_DEFS = {
    s3: {
      steps: [
        { text: 'Produktbilder aus Shopify laden', ms: 700 },
        { text: 'Motive und Produkte beschreiben', ms: 900 },
        { text: 'Alt-Texte schreiben und setzen', ms: 800 },
        { text: 'Bilder zur Indexierung einreichen', ms: 600 }
      ],
      result: '38 Alt-Texte gesetzt und in der Search Console eingereicht. Wirkung auf die Bildersuche frühestens in 2–3 Wochen — ich melde mich, wenn sich die Positionen bewegen.'
    },
    s4: {
      steps: [
        { text: 'Konkurrenzseiten auf Platz 8–11 lesen', ms: 900 },
        { text: 'Fehlende Inhalte bestimmen', ms: 700 },
        { text: 'Größentabelle, Material und Fragen ergänzen', ms: 1000 },
        { text: 'Seite zur Indexierung einreichen', ms: 600 }
      ],
      result: 'Größentabelle, Materialdetails und drei Kundenfragen ergänzt, Seite zur Indexierung eingereicht. Wirkung auf „wander hoodie herren“ frühestens in 2–3 Wochen — ich melde mich, wenn sich die Position bewegt.'
    }
  };

  /* --- Kleine Helfer ---------------------------------------------------------*/
  function de1(n) { return n.toFixed(1).replace('.', ','); }
  function deltaOf(k) { return k.prev - k.pos; }
  function diffText(n) { return n > 0 ? ('+' + F.num(n)) : n < 0 ? ('−' + F.num(Math.abs(n))) : '±0'; }
  function trendArrow(delta) {
    if (delta > 0) return '<span class="trend up">▲' + F.num(delta) + '</span>';
    if (delta < 0) return '<span class="trend down">▼' + F.num(Math.abs(delta)) + '</span>';
    return '<span class="hint">±0</span>';
  }
  function approvalForContent(contentId) {
    return ST.approvals.filter(function (a) { return a.contentId === contentId; })[0];
  }
  function miaAssessment(k) {
    var jump = k.prev - k.pos, s;
    if (jump >= 10) s = 'Großer Sprung seit dem Metadaten-Update — hier lohnt ein Blogartikel, der intern auf die Seite verlinkt.';
    else if (k.pos <= 3) s = 'Steht ganz oben. Halten, nicht anfassen.';
    else if (k.pos <= 10) s = 'In den Top 10 — der Weg auf Platz 1–3 führt über mehr Inhalt auf der Seite.';
    else if (k.pos <= 20) s = 'Knapp hinter der ersten Seite. Das ist der Bereich mit dem besten Aufwand-Nutzen-Verhältnis.';
    else s = 'Zu weit hinten für schnelle Erfolge — erst angehen, wenn die vorderen Keywords sitzen.';
    if (k.pos > k.prev) s += ' Achtung: seit dem Vormonat ' + F.num(k.pos - k.prev) + ' Plätze verloren.';
    return s;
  }

  /* --- Block 1: Hinweiszeile --------------------------------------------------*/
  function renderNotice() {
    return '<div class="notice info">' + INFO_ICON +
      '<span><b>Mia</b> liest jede Nacht die Search Console, schreibt Metadaten und Artikel — veröffentlicht wird nur, was du freigibst.</span>' +
      '<span class="notice-act"><button class="btn ghost sm" data-act="openConnector" data-arg="gsc">Search Console</button></span>' +
    '</div>';
  }

  /* --- Block 2: KPI-Grid -------------------------------------------------------*/
  function kpiCard(label, value, trendHtml, linkAttr) {
    return '<div class="card kpi' + (linkAttr ? ' link' : '') + '"' + (linkAttr || '') + '>' +
      '<div class="kpi-label">' + label + '<span class="kpi-src">' + GSC_ICON + '</span></div>' +
      '<div class="kpi-value">' + value + '</div>' +
      trendHtml +
    '</div>';
  }

  function renderKpis(S) {
    var kws = S.keywords, n = kws.length;
    var top10Now = DEMO.top10(), top10PrevN = DEMO.top10Prev();
    var avgPos = kws.reduce(function (s, k) { return s + k.pos; }, 0) / n;
    var avgPosPrev = kws.reduce(function (s, k) { return s + k.prev; }, 0) / n;
    var deltaPos = avgPos - avgPosPrev;
    var posUp = deltaPos <= 0;
    var posTrendText = (posUp ? '−' : '+') + de1(Math.abs(deltaPos));
    var trafficOrganic = D.traffic.filter(function (t) { return t.name === 'Organische Suche'; })[0] || { share: 0 };
    var organicSessions = Math.round(DEMO.metrics(S.range).sessions * (trafficOrganic.share / 100));
    var improvedCount = kws.filter(function (k) { return k.prev > k.pos; }).length;

    var c1trend = '<div class="kpi-trend"><span class="trend ' + (top10Now >= top10PrevN ? 'up' : 'down') + '">' +
      F.signNum(top10Now - top10PrevN) + '</span><span class="vs">vs. Vormonat</span></div>';
    var c2trend = '<div class="kpi-trend"><span class="trend ' + (posUp ? 'up' : 'down') + '">' + posTrendText +
      '</span><span class="vs">niedriger ist besser</span></div>';
    var c3trend = '<div class="kpi-trend"><span class="vs">' + F.pct0(trafficOrganic.share) + ' des Traffics</span></div>';
    var c4trend = '<div class="kpi-trend"><span class="vs">von ' + F.num(n) + ' beobachteten</span></div>';

    return '<div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">' +
      kpiCard('Keywords in Top 10', F.num(top10Now), c1trend, null) +
      kpiCard('Ø Position', de1(avgPos), c2trend, null) +
      kpiCard('Organische Sitzungen', F.num(organicSessions), c3trend, null) +
      kpiCard('Verbesserte Keywords', F.num(improvedCount), c4trend, ' data-act="seo.filter" data-arg="up"') +
    '</div>';
  }

  /* --- Block 3: Positionsverteilung --------------------------------------------*/
  function renderPositions(S) {
    var kws = S.keywords, n = kws.length;
    var avgPos = kws.reduce(function (s, k) { return s + k.pos; }, 0) / n;
    var avgPosPrev = kws.reduce(function (s, k) { return s + k.prev; }, 0) / n;
    var improved = kws.filter(function (k) { return k.prev > k.pos; }).length;
    var lost = kws.filter(function (k) { return k.pos > k.prev; }).length;
    var same = n - improved - lost;

    var rows = BUCKETS.map(function (b) {
      var today = kws.filter(function (k) { return b.test(k.pos); }).length;
      var prevCount = kws.filter(function (k) { return b.test(k.prev); }).length;
      var pct = n ? (today / n * 100) : 0;
      return '<div class="traffic-row">' +
        '<div class="traffic-name">' + b.name + '</div>' +
        '<div class="traffic-bar"><i style="width:' + pct.toFixed(1) + '%;background:' + b.color + '"></i></div>' +
        '<div class="traffic-val">' + F.num(today) + ' · ' + diffText(today - prevCount) + '</div>' +
      '</div>';
    }).join('');

    var foot = '<div class="traffic-foot">' +
      '<span>Ø Position <b>' + de1(avgPos) + '</b> heute gegen <b>' + de1(avgPosPrev) + '</b> Vormonat</span>' +
      '<span>' + F.num(improved) + ' verbessert · ' + F.num(lost) + ' verloren · ' + F.num(same) + ' unverändert</span>' +
    '</div>';

    return '<div class="section-head"><div><div class="section-title">Positionsverteilung</div>' +
      '<div class="section-sub">Wo die ' + F.num(n) + ' beobachteten Keywords stehen — heute gegen Vormonat</div></div></div>' +
      '<div class="card"><div class="traffic">' + rows + '</div>' + foot + '</div>';
  }

  /* --- Block 4: Keywords-Tabelle ------------------------------------------------*/
  function sortVal(k, key) {
    if (key === 'kw') return k.kw.toLowerCase();
    if (key === 'vol') return k.vol;
    if (key === 'pos') return k.pos;
    return deltaOf(k);
  }

  function keywordRow(k) {
    var delta = deltaOf(k);
    var posCell = '<span class="pill ' + (k.pos <= 10 ? 'working' : 'idle') + '">' + F.num(k.pos) + '</span>';
    var designCell = '<em class="hint">Kategorie/Blog</em>';
    if (k.design) {
      var dz = DEMO.design(k.design);
      if (dz) {
        designCell = '<span data-act="openDesign" data-arg="' + dz.id + '" style="display:inline-flex;align-items:center;gap:6px">' +
          '<span style="width:18px;height:18px;border-radius:5px;flex:none;background:linear-gradient(135deg,' + dz.g1 + ',' + dz.g2 + ')"></span>' +
          '<span>' + F.esc(dz.name) + '</span></span>';
      }
    }
    return '<tr class="row-link" data-act="openKeyword" data-arg="' + F.esc(k.kw) + '">' +
      '<td class="prod-name">' + F.esc(k.kw) + '</td>' +
      '<td class="mono">' + F.num(k.vol) + '/Mon.</td>' +
      '<td>' + posCell + '</td>' +
      '<td>' + trendArrow(delta) + '</td>' +
      '<td class="mono" style="font-size:11px">' + F.esc(k.url) + '</td>' +
      '<td>' + designCell + '</td>' +
    '</tr>';
  }

  function renderKeywordsSection(S) {
    var kws = S.keywords, n = kws.length;
    var improved = kws.filter(function (k) { return k.prev > k.pos; });
    var lost = kws.filter(function (k) { return k.pos > k.prev; });
    var mode = S.filters.seo || 'all';
    var qRaw = S.forms['seo.q'] || '';
    var q = qRaw.trim().toLowerCase();

    var filtered = kws.filter(function (k) {
      if (mode === 'top10' && k.pos > 10) return false;
      if (mode === 'up' && !(k.prev > k.pos)) return false;
      if (mode === 'down' && !(k.pos > k.prev)) return false;
      if (q && k.kw.toLowerCase().indexOf(q) < 0) return false;
      return true;
    });

    var sortState = S.sort.kw || { key: 'delta', dir: 'desc' };
    filtered = filtered.slice().sort(function (a, b) {
      var av = sortVal(a, sortState.key), bv = sortVal(b, sortState.key);
      if (av < bv) return sortState.dir === 'asc' ? -1 : 1;
      if (av > bv) return sortState.dir === 'asc' ? 1 : -1;
      return 0;
    });

    function th(label, key) {
      var active = sortState.key === key;
      var ar = active ? ('<span class="sort-ar">' + (sortState.dir === 'asc' ? '▲' : '▼') + '</span>') : '';
      return '<th class="sortable" data-act="sort" data-arg="kw|' + key + '">' + label + ar + '</th>';
    }

    var segDefs = [
      { key: 'all', label: 'Alle', count: n },
      { key: 'top10', label: 'Top 10', count: kws.filter(function (k) { return k.pos <= 10; }).length },
      { key: 'up', label: 'Verbessert', count: improved.length },
      { key: 'down', label: 'Verloren', count: lost.length }
    ];
    var seg = '<div class="seg">' + segDefs.map(function (s) {
      return '<button class="' + (mode === s.key ? 'on' : '') + '" data-act="seo.filter" data-arg="' + s.key + '">' +
        s.label + ' (' + F.num(s.count) + ')</button>';
    }).join('') + '</div>';

    var theadHtml = '<thead><tr>' + th('Keyword', 'kw') + th('Suchvolumen', 'vol') + th('Position', 'pos') +
      th('Veränderung', 'delta') + '<th>Seite</th><th>Design</th></tr></thead>';
    var tbodyHtml;
    if (!filtered.length) {
      tbodyHtml = '<tbody><tr><td colspan="6"><div class="empty sm">Kein Keyword passt<br>' +
        '<button class="btn ghost sm" data-act="seo.clear" style="margin-top:8px">Filter zurücksetzen</button></div></td></tr></tbody>';
    } else {
      tbodyHtml = '<tbody>' + filtered.map(keywordRow).join('') + '</tbody>';
    }

    var sumVol = filtered.reduce(function (s, k) { return s + k.vol; }, 0);
    var cardFoot = '<div class="card-foot"><span>' + F.num(filtered.length) + ' von ' + F.num(n) + ' Keywords</span>' +
      '<span>Summe Suchvolumen <b>' + F.num(sumVol) + '/Monat</b></span></div>';

    return '<div class="section-head">' +
      '<div><div class="section-title">Keywords</div><div class="section-sub">Aus der Search Console · täglich aktualisiert</div></div>' +
      '<div class="section-action"><span class="search-in">' + SEARCH_ICON +
        '<input data-model="seo.q" data-live="1" data-focus-key="seo.q" value="' + F.esc(qRaw) + '" placeholder="Keyword suchen …"></span></div>' +
    '</div>' +
    '<div class="card">' +
      '<div class="card-pad" style="padding-bottom:8px">' + seg + '</div>' +
      '<table class="products">' + theadHtml + tbodyHtml + '</table>' +
      cardFoot +
    '</div>';
  }

  /* --- Block 5: Mias Arbeit + Content-Plan --------------------------------------*/
  function seoTaskBlock(t, idx) {
    var st = idx > 0 ? ' style="border-top:1px solid var(--border-soft)"' : '';
    var pill = t.status === 'done'
      ? '<span class="pill idle"><span class="p-dot"></span>erledigt</span>'
      : '<span class="pill scheduled"><span class="p-dot"></span>Vorschlag</span>';
    var foot = t.status === 'done'
      ? '<div class="feed-flag ok">' + F.esc(t.result) + '</div>'
      : '<div class="feed-flag warn">' + F.esc(t.result) + '</div>' +
        '<div style="margin-top:8px"><button class="btn primary sm" data-act="seo.run" data-arg="' + t.id + '">Starten (≈' +
        F.num(t.runMinutes) + ' Min.)</button></div>';
    return '<div class="card-pad"' + st + '>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px">' +
        '<span style="font-weight:600;font-size:13.5px">' + F.esc(t.title) + '</span>' + pill +
      '</div>' +
      '<div class="hint">' + F.esc(t.when) + '</div>' +
      '<div class="lead" style="font-size:12.5px;margin-top:4px">' + F.esc(t.detail) + '</div>' +
      foot +
    '</div>';
  }

  function contentBlock(c, idx) {
    var st = idx > 0 ? ' style="border-top:1px solid var(--border-soft)"' : '';
    var pill = c.status === 'review' ? '<span class="pill working"><span class="p-dot"></span>bei dir zur Freigabe</span>'
      : c.status === 'draft' ? '<span class="pill idle"><span class="p-dot"></span>Entwurf</span>'
      : '<span class="pill working"><span class="p-dot"></span>live</span>';
    var kv = '<div class="kv-row"><span class="kv-k">Zielkeyword</span><span class="kv-v">' + F.esc(c.kw) +
        ' <span class="hint">(' + F.num(c.vol) + '/Monat)</span></span></div>' +
      '<div class="kv-row"><span class="kv-k">Länge</span><span class="kv-v">' + F.num(c.words) + ' Wörter</span></div>' +
      '<div class="kv-row"><span class="kv-k">Interne Links</span><span class="kv-v">' + F.num(c.links) + '</span></div>';
    var foot;
    if (c.status === 'review') {
      var appr = approvalForContent(c.id);
      foot = '<div style="margin-top:8px;display:flex;gap:8px">' +
        '<button class="btn ghost sm" data-act="seo.read" data-arg="' + c.id + '">Lesen</button>' +
        (appr ? '<button class="btn primary sm" data-act="openApproval" data-arg="' + appr.id + '">Freigeben</button>' : '') +
      '</div>';
    } else if (c.status === 'draft') {
      foot = '<div style="margin-top:8px;display:flex;gap:8px">' +
        '<button class="btn ghost sm" data-act="seo.read" data-arg="' + c.id + '">Lesen</button>' +
        '<button class="btn primary sm" data-act="seo.finish" data-arg="' + c.id + '">Mia soll ihn fertig schreiben</button>' +
      '</div>';
    } else {
      foot = '<div style="margin-top:8px;display:flex;align-items:center;gap:8px">' +
        '<span class="feed-flag ok">veröffentlicht</span>' +
        '<button class="btn ghost sm" data-act="seo.read" data-arg="' + c.id + '">Lesen</button>' +
      '</div>';
    }
    return '<div class="card-pad"' + st + '>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px">' +
        '<span style="font-weight:600;font-size:13.5px">' + F.esc(c.title) + '</span>' + pill +
      '</div>' + kv + foot +
    '</div>';
  }

  function renderDuoGrid(S) {
    var left = '<div><div class="section-head"><div><div class="section-title">Was Mia gemacht hat</div>' +
      '<div class="section-sub">und was sie vorschlägt</div></div></div>' +
      '<div class="card">' + S.seoTasks.map(seoTaskBlock).join('') + '</div></div>';
    var right = '<div><div class="section-head"><div><div class="section-title">Content-Plan</div>' +
      '<div class="section-sub">Artikel, die auf Keywords zielen</div></div></div>' +
      '<div class="card">' + S.contentPlan.map(contentBlock).join('') + '</div></div>';
    return '<div class="duo-grid">' + left + right + '</div>';
  }

  /* --- View-Registrierung -------------------------------------------------------*/
  DEMO.views.seo = {
    render: function (S) {
      return renderNotice() + renderKpis(S) + renderPositions(S) + renderKeywordsSection(S) + renderDuoGrid(S);
    },
    mount: function (root, S) {}
  };

  /* --- Aktion: Keyword-Detail (exklusiv global) ---------------------------------*/
  A['openKeyword'] = function (kw) {
    var k = ST.keywords.filter(function (x) { return x.kw === kw; })[0];
    if (!k) return;
    var delta = deltaOf(k);
    var progWidth = Math.max(0, 100 - k.pos * 3);
    var mia = DEMO.agent('mia');
    var designHtml = '<p class="hint">Dieses Keyword zielt auf eine Kategorie- oder Blogseite, nicht auf ein einzelnes Design.</p>';
    if (k.design) {
      var dz = DEMO.design(k.design);
      if (dz) {
        designHtml = '<div class="ag-now"><span style="width:20px;height:20px;border-radius:6px;flex:none;background:linear-gradient(135deg,' +
          dz.g1 + ',' + dz.g2 + ')"></span><span>' + F.esc(dz.name) + '</span>' +
          '<button class="btn ghost sm" style="margin-left:auto" data-act="openDesign" data-arg="' + dz.id + '">Design ansehen</button></div>';
      }
    }
    var body =
      '<div class="drawer-grid">' +
        '<div class="mini"><div class="mini-k">Position heute</div><div class="mini-v">' + F.num(k.pos) + '</div></div>' +
        '<div class="mini"><div class="mini-k">Position Vormonat</div><div class="mini-v">' + F.num(k.prev) + '</div></div>' +
        '<div class="mini"><div class="mini-k">Veränderung</div><div class="mini-v">' + trendArrow(delta) + '</div></div>' +
        '<div class="mini"><div class="mini-k">Suchvolumen</div><div class="mini-v">' + F.num(k.vol) + '/Monat</div></div>' +
      '</div>' +
      '<div class="kv-row"><span class="kv-k">Vormonat</span><span class="kv-v">Platz ' + F.num(k.prev) + '</span></div>' +
      '<div class="kv-row"><span class="kv-k">Heute</span><span class="kv-v">Platz ' + F.num(k.pos) + '</span></div>' +
      '<div class="prog" style="margin-top:8px"><i style="width:' + progWidth + '%"></i></div>' +
      '<p class="hint">Je weiter rechts, desto besser sichtbar.</p>' +
      '<h4 class="drawer-h">Landet auf</h4><div class="mono">' + F.esc(k.url) + '</div>' +
      '<h4 class="drawer-h">Gehört zu</h4>' + designHtml +
      '<h4 class="drawer-h">Mias Einschätzung</h4>' +
      '<div class="ag-now"><span class="agent-avatar sm" style="background:' + mia.color + '">' + mia.initials + '</span>' +
      '<span>' + miaAssessment(k) + '</span></div>';
    U.drawer({
      title: F.esc(k.kw),
      sub: F.num(k.vol) + ' Suchanfragen/Monat',
      body: body,
      foot: '<button class="btn ghost" data-act="closeDrawer">Schließen</button>' +
            '<button class="btn primary" data-act="askAgent" data-arg="mia">Mia fragen</button>'
    });
  };

  /* --- Filter / Suche -------------------------------------------------------------*/
  A['seo.filter'] = function (mode) {
    ST.filters.seo = mode;
    DEMO.render();
  };
  A['seo.clear'] = function () {
    ST.filters.seo = 'all';
    ST.forms['seo.q'] = '';
    DEMO.render();
  };

  /* --- Mias Aufgaben starten --------------------------------------------------------*/
  A['seo.run'] = function (id) {
    var t = ST.seoTasks.filter(function (x) { return x.id === id; })[0];
    if (!t || t.status !== 'open') return;
    var def = RUN_DEFS[id] || { steps: [{ text: 'Arbeitet an „' + t.title + '“', ms: 900 }], result: 'Erledigt.' };
    U.run({
      agent: 'mia',
      title: F.esc(t.title),
      steps: def.steps,
      done: { text: def.result, cta: 'Alles klar', act: 'closeModal' },
      onDone: function () {
        t.status = 'done';
        t.when = 'gerade eben';
        t.result = def.result;
        DEMO.pushFeed('mia', '<b>Mia</b>: ' + def.result, { type: 'ok', text: 'Erledigt' }, 'NOR-55');
        U.toast('Aufgabe erledigt — Mia bleibt dran');
        if (ST.tab === 'seo') DEMO.render();
      }
    });
  };

  /* --- Content-Plan: Lesen / Fertigstellen --------------------------------------------*/
  A['seo.read'] = function (id) {
    var c = ST.contentPlan.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    var appr = approvalForContent(c.id);
    U.drawer({
      title: F.esc(c.title),
      sub: 'Zielkeyword „' + F.esc(c.kw) + '“ · ' + F.num(c.vol) + '/Monat',
      body: '<div class="drawer-grid">' +
          '<div class="mini"><div class="mini-k">Länge</div><div class="mini-v">' + F.num(c.words) + ' Wörter</div></div>' +
          '<div class="mini"><div class="mini-k">Interne Links</div><div class="mini-v">' + F.num(c.links) + '</div></div>' +
          '<div class="mini"><div class="mini-k">Status</div><div class="mini-v">' + (STATUS_LABEL[c.status] || c.status) + '</div></div>' +
          '<div class="mini"><div class="mini-k">Autor</div><div class="mini-v">Mia</div></div>' +
        '</div>' +
        '<h4 class="drawer-h">Leseprobe</h4><div class="excerpt">' + F.rich(c.excerpt) + '</div>' +
        '<p class="hint">Gekürzt — der vollständige Text liegt als Artifact am Task.</p>',
      foot: '<button class="btn ghost" data-act="closeDrawer">Schließen</button>' +
            (c.status === 'review' && appr ? '<button class="btn primary" data-act="openApproval" data-arg="' + appr.id + '">Freigeben</button>' : '')
    });
  };

  A['seo.finish'] = function (id) {
    var c = ST.contentPlan.filter(function (x) { return x.id === id; })[0];
    if (!c || c.status !== 'draft') return;
    U.run({
      agent: 'mia',
      title: 'Artikel fertigstellen',
      steps: [
        { text: 'Recherche zu „poster aufhängen höhe“', ms: 900 },
        { text: 'Gliederung und Text schreiben', ms: 1200 },
        { text: 'Intern auf passende Produkte verlinken', ms: 700 },
        { text: 'Meta-Titel und -Beschreibung setzen', ms: 600 }
      ],
      done: { text: 'Der Artikel ist fertig und liegt jetzt bei dir zur Freigabe.', cta: 'Ansehen', act: 'openApproval', arg: 'a5' },
      onDone: function () {
        c.status = 'review';
        c.words = 1680;
        c.links = 5;
        c.when = 'gerade eben';
        ST.approvals.push({
          id: 'a5',
          title: 'Blogartikel „' + c.title + '“ veröffentlichen',
          chip: 'SEO · Content', by: 'mia', ago: 'gerade eben',
          desc: 'Zielkeyword „' + c.kw + '“ (' + F.num(c.vol) + '/Monat) — intern auf 5 Produkte verlinkt, Meta & Bilder fertig.',
          task: 'NOR-55', kind: 'content', contentId: c.id,
          detail: 'Mia hat den Artikel zu Ende geschrieben, auf ' + F.num(c.links) + ' Produkte verlinkt und Meta-Titel sowie -Beschreibung gesetzt. Zielkeyword „' + c.kw + '“ bringt ' + F.num(c.vol) + ' Suchanfragen im Monat.',
          effect: 'Nach Freigabe: Artikel geht live, Mia meldet die URL in der Search Console an.',
          impact: { revenue: 0, note: 'SEO wirkt verzögert — Mia erwartet erste Positionen in etwa 4 Wochen' },
          status: 'open'
        });
        DEMO.pushFeed('mia', '<b>Mia</b>: Der Artikel „' + c.title + '“ ist fertig — liegt jetzt bei dir zur Freigabe.', { type: 'ok', text: 'Fertig' }, 'NOR-55');
        U.toast('Artikel fertig — liegt zur Freigabe bereit');
        if (ST.tab === 'seo') DEMO.render();
      }
    });
  };
})();

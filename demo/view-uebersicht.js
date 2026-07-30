/* ============================================================================
   View „Übersicht" — Shop-Performance, Charts, Design-Pipeline, Automatisierung,
   Commerce-Team, Aktivitäts-Feed, Freigaben, Design-Performance-Tabelle.
   Reine render()-Funktion (nur Strings) + mount() nur für den Chart-Tooltip,
   der nicht über data-act-Delegation läuft.
   ========================================================================== */
(function () {
  'use strict';
  var A = DEMO.actions, F = DEMO.fmt, D = DEMO.data, U = DEMO.ui;

  /* --- Icons (inline SVG, keine externen Ressourcen) ----------------------- */
  var ICON_SHOPIFY = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#5E8E3E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l1.5 13.5a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1L6 7Z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg>';
  var ICON_GA4 = '<svg viewBox="0 0 24 24" width="13" height="13"><rect x="15.2" y="3" width="5.2" height="18" rx="2.6" fill="#F9AB00"/><rect x="9.4" y="9" width="5.2" height="12" rx="2.6" fill="#E37400"/><circle cx="6.2" cy="18.4" r="2.6" fill="#E37400"/></svg>';
  var ICON_GSC = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#4285F4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  var ICON_CHAT = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L3 21l1.6-5.4A8.5 8.5 0 1 1 21 12Z"/></svg>';

  function arrowSvg(up) {
    return '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
      (up ? '<path d="M7 17 17 7M9 7h8v8"/>' : '<path d="M7 7l10 10M15 17h-8V9"/>') + '</svg>';
  }

  function sparkSvg(trend) {
    var cls = trend === 'down' ? ' down' : trend === 'flat' ? ' flat' : '';
    var path = trend === 'down' ? '<path d="M1 4 Q12 5 20 8 T34 10 T45 13"/>'
      : trend === 'flat' ? '<path d="M1 9 Q12 8 20 9 T34 8 T45 8"/>'
      : '<path d="M1 13 Q10 12 15 9 T30 6 T45 2"/>';
    return '<svg class="spark' + cls + '" width="46" height="16" viewBox="0 0 46 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' + path + '</svg>';
  }

  function truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  // Zeitraum-Text, z. B. "14.06. – 13.07.2026 · verglichen mit den 30 Tagen davor"
  function periodLabel(range) {
    var start = D.days[D.days.length - range].date;
    return F.date(start) + ' – ' + F.date(D.today) + ' · verglichen mit den ' + range + ' Tagen davor';
  }

  function kpiCard(label, value, srcIcon, trendUp, trendText, vsText, act, arg) {
    return '<div class="card kpi link" data-act="' + act + '" data-arg="' + arg + '">' +
      '<div class="kpi-label">' + label + '<span class="kpi-src">' + srcIcon + '</span></div>' +
      '<div class="kpi-value">' + value + '</div>' +
      '<div class="kpi-trend"><span class="trend ' + (trendUp ? 'up' : 'down') + '">' + arrowSvg(trendUp) + ' ' + trendText + '</span>' +
      '<span class="vs">' + vsText + '</span></div>' +
      '</div>';
  }

  /* --- Block 1+2: Shop-Performance & KPI ------------------------------------ */
  function blockHead(S, m) {
    var top10n = DEMO.top10(), top10p = DEMO.top10Prev(), top10d = top10n - top10p;
    return '<div class="section-head"><div><div class="section-title">Shop-Performance</div>' +
      '<div class="section-sub">' + periodLabel(S.range) + '</div></div></div>' +
      '<div class="kpi-grid">' +
      kpiCard('Umsatz', F.eur(m.revenue), ICON_SHOPIFY, m.revenueDelta >= 0, F.signPct(m.revenueDelta), 'vs. Vorperiode', 'ov.kpi', 'revenue') +
      kpiCard('Bestellungen', F.num(m.orders), ICON_SHOPIFY, m.ordersDelta >= 0, F.signPct(m.ordersDelta), 'vs. Vorperiode', 'ov.kpi', 'orders') +
      kpiCard('Rohertrag n. Druckkosten', F.eur(m.gross), ICON_SHOPIFY, m.grossDelta >= 0, F.signPct(m.grossDelta), 'Marge ' + F.pct0(m.margin), 'setTab', 'buchhaltung') +
      kpiCard('Google Top-10-Keywords', F.num(top10n), ICON_GSC, top10d >= 0, F.signNum(top10d), 'vs. Vormonat', 'ov.sicht', 'website') +
      kpiCard('Sessions', F.num(m.sessions), ICON_GA4, m.sessionsDelta >= 0, F.signPct(m.sessionsDelta), 'vs. Vorperiode', 'ov.kpi', 'sessions') +
      '</div>';
  }

  /* --- Block 3: Chart-Geometrie ---------------------------------------------- */
  function chartGeom(cur) {
    var n = cur.length, colW = 900 / n, barW = colW * 0.8, gap = (colW - barW) / 2;
    var maxRev = Math.max.apply(null, cur.map(function (d) { return d.revenue; }));
    var maxSes = Math.max.apply(null, cur.map(function (d) { return d.sessions; }));
    var top = 12, base = 198;
    return { n: n, colW: colW, barW: barW, gap: gap, maxRev: maxRev, maxSes: maxSes, top: top, base: base, h: base - top };
  }

  function buildChartSvg(cur) {
    var g = chartGeom(cur);
    var bars = cur.map(function (d, i) {
      var bh = (d.revenue / g.maxRev) * g.h;
      return '<rect x="' + (i * g.colW + g.gap).toFixed(1) + '" y="' + (g.base - bh).toFixed(1) + '" width="' + g.barW.toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="3" fill="#22A05A"/>';
    }).join('');
    var pts = cur.map(function (d, i) {
      return (i * g.colW + g.colW / 2).toFixed(1) + ',' + (g.base - (d.sessions / g.maxSes) * g.h).toFixed(1);
    }).join(' ');
    var grid = [1, 2, 3].map(function (k) {
      var y = (g.top + (g.h / 4) * k).toFixed(1);
      return '<line x1="0" y1="' + y + '" x2="900" y2="' + y + '" stroke="#F2F2F2" stroke-width="1"/>';
    }).join('');
    var hovers = cur.map(function (d, i) {
      return '<rect class="chart-hover" x="' + (i * g.colW).toFixed(1) + '" y="0" width="' + g.colW.toFixed(1) + '" height="210"></rect>';
    }).join('');
    return '<svg viewBox="0 0 900 210" width="100%" height="210" preserveAspectRatio="none" style="display:block">' +
      grid + bars + '<polyline points="' + pts + '" fill="none" stroke="#F9AB00" stroke-width="2.4"/>' + hovers + '</svg>';
  }

  function dateRow(cur) {
    var marks = [0, 1, 2, 3, 4].map(function (k) { return Math.round(k * (cur.length - 1) / 4); });
    return '<div class="mono" style="display:flex;justify-content:space-between;margin-top:6px;font-size:10.5px;color:var(--muted-fg-2)">' +
      marks.map(function (i) { return '<span>' + F.dateShort(cur[i].date) + '</span>'; }).join('') + '</div>';
  }

  function blockCharts(S, m) {
    var cur = D.windowDays(S.range, 0);
    var trafficRows = D.traffic.map(function (t) {
      var val = Math.round(m.sessions * t.share / 100);
      return '<div class="traffic-row"><div class="traffic-name">' + t.name + '</div>' +
        '<div class="traffic-bar"><i style="width:' + t.share + '%;background:' + t.color + '"></i></div>' +
        '<div class="traffic-val">' + F.num(val) + ' · ' + t.share + '%</div></div>';
    }).join('');
    return '<div class="charts-grid">' +
      '<div class="card"><div class="card-head"><div><div class="card-title">Umsatz &amp; Sessions</div>' +
      '<div class="card-title-note">täglich, ' + S.range + ' Tage</div></div>' +
      '<div class="card-head-right"><span class="legend"><i style="background:#22A05A"></i>Umsatz (Shopify)</span>' +
      '<span class="legend"><i style="background:#F9AB00"></i>Sessions (GA4)</span></div></div>' +
      '<div class="chart-body"><div class="chart-wrap">' + buildChartSvg(cur) + '<div class="chart-tip"></div></div>' + dateRow(cur) + '</div></div>' +
      '<div class="card"><div class="card-head"><div><div class="card-title">Traffic-Quellen</div><div class="card-title-note">GA4 · Sessions</div></div></div>' +
      '<div class="traffic">' + trafficRows + '</div>' +
      '<div class="traffic-foot"><span><b>' + F.num(m.sessions) + '</b> Sessions gesamt</span>' +
      '<span>Ø Sitzungsdauer <b>' + D.fixed.avgSessionDuration + '</b></span></div></div>' +
      '</div>';
  }

  /* --- Block 4: Design-Pipeline ---------------------------------------------- */
  function blockPipeline(S) {
    var t0 = S.trends[0];
    var draftItems = S.drafts.filter(function (d) { return d.status === 'draft'; });
    var openDesignApprovals = DEMO.openApprovals().filter(function (a) { return a.kind === 'designs'; });
    var newDesigns = S.designs.filter(function (d) { return d.status === 'new'; });
    var newListings = newDesigns.reduce(function (s, d) { return s + d.listings; }, 0);
    var newRevenue = newDesigns.reduce(function (s, d) { return s + d.revenue30; }, 0);
    var a = openDesignApprovals[0];

    var col1 = '<div class="pipeline-col"><div class="stage-label">TREND-RADAR</div>' +
      '<div class="stage-num">' + S.trends.length + '</div><div class="stage-sub">heiße Nischen erkannt</div>' +
      '<div class="feed-flag warn" data-act="setTab" data-arg="design">' + t0.name + ' ' + t0.growth + '</div></div>';

    var col2 = '<div class="pipeline-col"><div class="stage-label">ENTWÜRFE</div>' +
      '<div class="stage-num">' + draftItems.length + '</div>' +
      '<div class="stage-sub">' + (draftItems.length ? 'von Theo gerendert' : 'alle freigegeben') + '</div>' +
      (draftItems.length ? '<div class="pipe-thumbs">' + draftItems.map(function (d) {
        return '<div class="pipe-thumb" data-act="openDraft" data-arg="' + d.id + '" style="background:linear-gradient(135deg,' + d.g1 + ',' + d.g2 + ');color:rgba(255,255,255,.92)">' + d.initials + '</div>';
      }).join('') + '</div>' : '') + '</div>';

    var col3 = '<div class="pipeline-col"><div class="stage-label">WARTET AUF FREIGABE</div>' +
      '<div class="stage-num">' + openDesignApprovals.length + '</div>' +
      '<div class="stage-sub">' + (a ? truncate(a.title, 34) : 'nichts offen') + '</div>' +
      (a ? '<div class="task-ref" data-act="openTask" data-arg="' + a.task + '">' + a.task + '</div>' : '') + '</div>';

    var col4 = '<div class="pipeline-col"><div class="stage-label">DIESE WOCHE LIVE</div>' +
      '<div class="stage-num">' + newDesigns.length + '</div>' +
      '<div class="stage-sub">Designs · ' + newListings + ' Listings</div>' +
      (newRevenue ? '<div class="trend up">' + arrowSvg(true) + ' +' + F.eur(newRevenue) + ' Umsatz aus Neustarts</div>' : '') + '</div>';

    return '<div class="section-head"><div><div class="section-title">Design-Pipeline</div>' +
      '<div class="section-sub">Recherche → Entwurf → Freigabe → Shop · betrieben von Ida &amp; Theo</div></div>' +
      '<div class="section-action" data-act="setTab" data-arg="design">Design-Studio öffnen →</div></div>' +
      '<div class="card"><div class="pipeline-grid">' + col1 + col2 + col3 + col4 + '</div></div>';
  }

  /* --- Block 5: Automatisiert im Hintergrund --------------------------------- */
  function blockTrio(S) {
    var topKw = S.keywords.slice().sort(function (a, b) { return (b.prev - b.pos) - (a.prev - a.pos); }).slice(0, 3);
    var doneSeo = S.seoTasks.filter(function (t) { return t.status === 'done'; }).length;
    var reviewContent = S.contentPlan.filter(function (c) { return c.status === 'review'; }).length;
    var avgPos = (S.keywords.reduce(function (s, k) { return s + k.pos; }, 0) / S.keywords.length).toFixed(1).replace('.', ',');

    // Teaser für den Sichtbarkeits-Reiter: drei Wege, auf denen Kunden zu dir finden.
    var so = DEMO.socialStats(S.range);
    var rv = DEMO.reviewStats();
    var top10n2 = DEMO.top10();
    var zeile = function (ebene, name, unten, pillCls, pillTxt, trend) {
      return '<div class="kw-row" data-act="ov.sicht" data-arg="' + ebene + '">' +
        '<div><div class="kw-name">' + name + '</div><div class="kw-vol">' + unten + '</div></div>' +
        '<div class="kw-pos"><span class="pill ' + pillCls + '">' + pillTxt + '</span>' + (trend || '') + '</div></div>';
    };
    var seoCard = '<div class="card"><div class="card-head"><div>' +
      '<div class="card-title">Sichtbarkeit</div><div class="card-title-note">Google · Social · Bewertungen</div></div></div>' +
      '<div class="card-pad">' +
        zeile('website', 'Website', 'Ø Platz ' + avgPos + ' bei Google',
          'working', top10n2 + ' in Top 10',
          '<span class="trend up">▲' + (top10n2 - DEMO.top10Prev()) + '</span>') +
        zeile('social', 'Social', F.num(so.sessions) + ' Sitzungen · ' + so.anteil + ' % des Traffics',
          'idle', F.num(so.followers) + ' Follower',
          '<span class="trend up">' + F.signNum(so.growth) + '</span>') +
        zeile('reviews', 'Bewertungen', rv.total + ' Sterne-Bewertungen · ' + F.pct0(rv.quote) + ' der Bestellungen',
          rv.open ? 'scheduled' : 'idle', rv.avg.toFixed(1).replace('.', ',') + ' ★',
          rv.open ? '<span class="feed-flag warn">' + rv.open + ' offen</span>' : '') +
      '</div>' +
      '<div class="card-foot"><span>' + doneSeo + ' Metas optimiert · ' + reviewContent + ' Blogartikel in Freigabe</span>' +
      '<span data-act="ov.sicht" data-arg="website">Alle drei Ebenen →</span></div></div>';
    void topKw;

    var ms = DEMO.monthSums(6);
    var buchCard = '<div class="card" data-act="setTab" data-arg="buchhaltung"><div class="card-head"><div>' +
      '<div class="card-title">Buchhaltung · Juli</div><div class="card-title-note">Shopify · Printful · DATEV</div></div></div>' +
      '<div class="card-pad"><div class="hint" style="margin:0 0 8px">Erfasst: ' + ms.days + ' von 31 Tagen</div>' +
      '<div class="guv"><div class="guv-row"><span>Einnahmen</span><span class="amt">' + F.eur(ms.revenue) + '</span></div>' +
      '<div class="guv-row"><span>Druckkosten (Printful)</span><span class="amt">−' + F.eur(ms.print) + '</span></div>' +
      '<div class="guv-row"><span>Gebühren (Shopify, PayPal)</span><span class="amt">−' + F.eur(ms.fees) + '</span></div>' +
      '<div class="guv-row total"><span>Rohertrag</span><span class="amt">' + F.eur(ms.gross) + ' · ' + F.pct0(ms.margin) + '</span></div></div>' +
      '<div class="chip-row">' +
      '<span class="feed-flag ok">' + D.receipts[6].length + ' Belege automatisch erfasst</span>' +
      '<span class="feed-flag ok">DATEV-Export Juni ✓</span>' +
      (S.ustva === 'draft' ? '<span class="feed-flag warn">USt-VA Juni: Entwurf bereit</span>' : '<span class="feed-flag ok">USt-VA Juni übermittelt ✓</span>') +
      '</div></div></div>';

    var ts = DEMO.ticketStats();
    var topTopics = D.topics.slice().sort(function (a, b) { return b.share - a.share; }).slice(0, 3);
    var maxTopic = Math.max.apply(null, D.topics.map(function (t) { return t.share; }));
    var supportCard = '<div class="card" data-act="setTab" data-arg="support"><div class="card-head"><div>' +
      '<div class="card-title">Kundenservice · 7 Tage</div><div class="card-title-note">Shopify Inbox · E-Mail</div></div></div>' +
      '<div class="card-pad"><div class="stat-big">' + F.pct0(ts.rate) + '</div>' +
      '<div class="stat-sub">automatisch gelöst (' + ts.solved + ' von ' + ts.total + ' Anfragen)</div>' +
      '<div class="kv-row"><span class="kv-k">Ø Erstantwort</span><span class="kv-v">' + D.fixed.firstReply + '</span></div>' +
      '<div class="kv-row"><span class="kv-k">Zufriedenheit mit Emma</span><span class="kv-v">' + D.fixed.satisfaction + '</span></div>' +
      '<div class="traffic" style="margin-top:8px">' + topTopics.map(function (t) {
        return '<div class="traffic-row"><div class="traffic-name">' + t.key + '</div>' +
          '<div class="traffic-bar"><i style="width:' + ((t.share / maxTopic) * 100).toFixed(0) + '%;background:' + t.color + '"></i></div>' +
          '<div class="traffic-val">' + t.share + '%</div></div>';
      }).join('') + '</div></div>' +
      '<div class="card-foot"><span>' + ts.open + ' Eskalation' + (ts.open === 1 ? '' : 'en') + ' offen → Kundenservice</span></div></div>';

    return '<div class="section-head"><div><div class="section-title">Automatisiert im Hintergrund</div>' +
      '<div class="section-sub">Buchhaltung, SEO und Support laufen als Routinen</div></div></div>' +
      '<div class="trio-grid">' + seoCard + buchCard + supportCard + '</div>';
  }

  /* --- Block 6: Commerce-Team -------------------------------------------------- */
  function blockTeam() {
    return '<div class="section-head"><div><div class="section-title">Dein Commerce-Team</div>' +
      '<div class="section-sub">' + D.agents.length + ' Agenten · einer je Aufgabenbereich</div></div>' +
      '<div class="section-action" data-act="openChat">' + ICON_CHAT + ' Otto im Chat fragen</div></div>' +
      '<div class="team-grid">' + D.agents.map(function (a) {
        return '<div class="card agent-card" data-act="openAgent" data-arg="' + a.id + '">' +
          '<div class="agent-top"><span class="agent-avatar" style="background:' + a.color + '">' + a.initials + '</span>' +
          '<span class="agent-name">' + a.name + '</span><span class="agent-open">' + arrowSvg(true) + '</span></div>' +
          '<div class="agent-role">' + a.role + '</div>' +
          '<span class="pill ' + a.status + '"><span class="p-dot"></span>' + (a.statusLabel || a.status) + '</span>' +
          '<div class="agent-model">' + a.model + '<br>' + a.runtime + '</div>' +
          '<div class="agent-last">' + truncate(a.now, 60) +
          '<div class="task-line"><span class="task-ref" data-act="openTask" data-arg="' + a.task + '">' + a.task + '</span></div></div>' +
          '</div>';
      }).join('') + '</div>';
  }

  /* --- Block 7: Feed & Freigaben ------------------------------------------------ */
  function blockDuo(S) {
    var rows = S.feed.slice(0, S.feedExpanded ? S.feed.length : 6).map(DEMO.feedRowHtml).join('');
    var open = DEMO.openApprovals();
    var approvedN = S.approvals.filter(function (a) { return a.status === 'approved'; }).length;
    var rejectedN = S.approvals.filter(function (a) { return a.status === 'rejected'; }).length;
    var approvalsHtml;
    if (open.length) {
      approvalsHtml = open.map(function (a) {
        var by = DEMO.agent(a.by);
        return '<div class="approval"><div class="approval-title">' + a.title + ' <span class="cat-chip">' + a.chip + '</span></div>' +
          '<div class="approval-desc">' + a.desc + '</div>' +
          '<div class="approval-foot"><span class="approval-by"><span class="avatar" style="background:' + by.color + '">' + by.initials + '</span>' + by.name + ' · ' + a.ago + '</span>' +
          '<button class="btn ghost sm" data-act="openApproval" data-arg="' + a.id + '">Ansehen</button>' +
          '<button class="btn primary sm" data-act="approve" data-arg="' + a.id + '">Freigeben</button></div></div>';
      }).join('');
    } else {
      var parts = [];
      if (approvedN) parts.push(approvedN + ' freigegeben');
      if (rejectedN) parts.push(rejectedN + ' abgelehnt');
      approvalsHtml = '<div class="empty"><div class="empty-t">Nichts liegt bei dir</div>' +
        '<p>Dein Team arbeitet weiter — sobald etwas eine Entscheidung braucht, steht es hier.</p>' +
        (parts.length ? '<div class="hint">Heute ' + parts.join(' · ') + '</div>' : '') + '</div>';
    }
    return '<div class="duo-grid"><div>' +
      '<div class="section-head"><div><div class="section-title">Agent-Aktivität</div><div class="section-sub">heute</div></div>' +
      '<div class="section-action" data-act="ov.feed">' + (S.feedExpanded ? 'Weniger zeigen ↑' : 'Alles ansehen →') + '</div></div>' +
      '<div class="card feed">' + rows + '</div></div>' +
      '<div><div class="section-head"><div><div class="section-title">Wartet auf deine Freigabe</div></div>' +
      '<div class="section-action"><span class="approvals-count">' + open.length + ' offen</span></div></div>' +
      '<div class="card">' + approvalsHtml + '</div></div></div>';
  }

  /* --- Block 8: Design-Performance-Tabelle --------------------------------------- */
  function blockTable(S) {
    var sort = S.sort.designs || { key: 'revenue30', dir: 'desc' };
    var sorted = S.designs.slice().sort(function (a, b) {
      var av = a[sort.key], bv = b[sort.key];
      if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      var cmp = av > bv ? 1 : av < bv ? -1 : 0;
      return sort.dir === 'asc' ? cmp : -cmp;
    }).slice(0, 5);

    function ar(key) { return sort.key === key ? '<span class="sort-ar">' + (sort.dir === 'asc' ? '▲' : '▼') + '</span>' : ''; }

    var rows = sorted.map(function (d) {
      var noteAgent = d.noteBy ? DEMO.agent(d.noteBy) : null;
      var tag = d.status === 'new' ? '<span class="tag new">NEU</span>' : d.status === 'paused' ? '<span class="tag paused">PAUSIERT</span>' : '';
      return '<tr class="row-link" data-act="openDesign" data-arg="' + d.id + '">' +
        '<td><div class="prod-cell"><div class="prod-thumb" style="background:linear-gradient(135deg,' + d.g1 + ',' + d.g2 + ');color:rgba(255,255,255,.92)">' + d.initials + '</div>' +
        '<div><div class="prod-name">' + d.name + ' ' + tag + '</div><div class="prod-sku">' + d.sku + '</div></div></div></td>' +
        '<td class="mono">' + d.listings + '</td>' +
        '<td class="rev">' + F.eur(d.revenue30) + '</td>' +
        '<td>' + sparkSvg(d.trend) + '</td>' +
        '<td class="agent-hint">' + (noteAgent ? '<span class="avatar" style="background:' + noteAgent.color + '">' + noteAgent.initials + '</span> ' + d.note : '<em>—</em>') + '</td>' +
        '</tr>';
    }).join('');

    return '<div class="section-head"><div><div class="section-title">Design-Performance</div>' +
      '<div class="section-sub">Bestseller &amp; Neustarts · von Ida täglich bewertet</div></div>' +
      '<div class="section-action" data-act="setTab" data-arg="design">Alle ' + S.designs.length + ' Designs →</div></div>' +
      '<div class="card"><table class="products"><thead><tr>' +
      '<th class="sortable" data-act="sort" data-arg="designs|name">Design' + ar('name') + '</th>' +
      '<th class="sortable" data-act="sort" data-arg="designs|listings">Listings' + ar('listings') + '</th>' +
      '<th class="sortable" data-act="sort" data-arg="designs|revenue30">30-T.-Umsatz' + ar('revenue30') + '</th>' +
      '<th>Trend</th><th>Agent-Hinweis</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  /* --- Block 9: Fußzeile --------------------------------------------------------- */
  function blockFoot() {
    return '<div class="page-foot">' + ICON_SHOPIFY + ' Commerce-Modul · Plugin für das Agentic AIOS (Paperclip) · ' +
      'Datenquellen: Shopify Admin API · GA4 Data API · Search Console API · Printful API · Alle Zahlen: Demo-Daten</div>';
  }

  /* --- View-Registrierung --------------------------------------------------------- */
  DEMO.views.uebersicht = {
    render: function (S) {
      var m = DEMO.metrics(S.range);
      return blockHead(S, m) + blockCharts(S, m) + blockPipeline(S) + blockTrio(S) + blockTeam() + blockDuo(S) + blockTable(S) + blockFoot();
    },
    mount: function (root, S) {
      var cur = D.windowDays(S.range, 0), g = chartGeom(cur);
      var wrap = root.querySelector('.chart-wrap');
      if (!wrap) return;
      var tip = wrap.querySelector('.chart-tip'), svg = wrap.querySelector('svg');
      wrap.querySelectorAll('.chart-hover').forEach(function (r, i) {
        r.addEventListener('mouseenter', function () {
          var d = cur[i];
          var barTop = g.base - (d.revenue / g.maxRev) * g.h;
          tip.innerHTML = '<span class="tip-d">' + F.date(d.date) + '</span><br><b>' + F.eur(d.revenue) + '</b> · ' + F.num(d.orders) + ' Bestellungen<br>' + F.num(d.sessions) + ' Sessions';
          tip.style.left = (((i + 0.5) / g.n) * 100).toFixed(2) + '%';
          tip.style.top = ((barTop / 210) * 100).toFixed(2) + '%';
          tip.classList.add('on');
        });
      });
      if (svg) svg.addEventListener('mouseleave', function () { tip.classList.remove('on'); });
    }
  };

  /* --- Eigene Actions (Präfix ov.) ------------------------------------------------ */
  A['ov.kpi'] = function (arg) {
    var st = DEMO.state, m = DEMO.metrics(st.range);
    var cur = D.windowDays(st.range, 0);
    var titles = { revenue: 'Umsatz', orders: 'Bestellungen', sessions: 'Sessions' };
    var fmtV = arg === 'revenue' ? F.eur : F.num;
    var val = function (d) { return d[arg]; };
    var best = cur[0], worst = cur[0];
    cur.forEach(function (d) {
      if (val(d) > val(best)) best = d;
      if (val(d) < val(worst)) worst = d;
    });
    var avg = m[arg] / cur.length;
    var extra = '';
    if (arg === 'orders') {
      extra = '<div class="kv-row"><span class="kv-k">Ø Bestellwert</span><span class="kv-v">' + F.eur2(m.aov) + '</span></div>';
    } else if (arg === 'sessions') {
      extra = '<div class="kv-row"><span class="kv-k">Conversion</span><span class="kv-v">' + F.pct1(m.conversion) + '</span></div>' +
        '<div class="kv-row"><span class="kv-k">Ø Sitzungsdauer</span><span class="kv-v">' + D.fixed.avgSessionDuration + '</span></div>';
    }
    U.drawer({
      title: titles[arg], sub: periodLabel(st.range),
      body: '<div class="drawer-grid">' +
        '<div class="mini"><div class="mini-k">Aktueller Zeitraum</div><div class="mini-v">' + fmtV(m[arg]) + '</div></div>' +
        '<div class="mini"><div class="mini-k">Zeitraum davor</div><div class="mini-v">' + fmtV(m[arg + 'Prev']) + '</div></div>' +
        '<div class="mini"><div class="mini-k">Veränderung</div><div class="mini-v">' + F.signPct(m[arg + 'Delta']) + '</div></div>' +
        '<div class="mini"><div class="mini-k">Ø pro Tag</div><div class="mini-v">' + fmtV(avg) + '</div></div>' +
        '</div>' +
        '<div class="kv-row"><span class="kv-k">Bester Tag</span><span class="kv-v">' + F.date(best.date) + ' · ' + fmtV(val(best)) + '</span></div>' +
        '<div class="kv-row"><span class="kv-k">Schwächster Tag</span><span class="kv-v">' + F.date(worst.date) + ' · ' + fmtV(val(worst)) + '</span></div>' +
        '<div class="kv-row"><span class="kv-k">Zeitraum</span><span class="kv-v">' + cur.length + ' Tage</span></div>' +
        extra,
      foot: '<button class="btn ghost" data-act="closeDrawer">Schließen</button>'
    });
  };

  A['ov.feed'] = function () {
    DEMO.state.feedExpanded = !DEMO.state.feedExpanded;
    DEMO.render();
  };

  // Springt in den Sichtbarkeits-Reiter und gleich auf die richtige Ebene.
  A['ov.sicht'] = function (ebene) {
    DEMO.state.filters.sicht = ebene || 'website';
    A.setTab('sichtbarkeit');
  };
})();

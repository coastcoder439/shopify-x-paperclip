/* ============================================================================
   Ebene „Social" des Sichtbarkeits-Reiters — Neles Arbeit an Pinterest,
   Instagram und TikTok. Datenquelle ausschließlich DEMO.socialStats(),
   DEMO.state.socialPosts / socialPlan und DEMO.data.socialChannels — keine
   eigenen Kennzahlen.
   ========================================================================== */
(function () {
  'use strict';
  var A = DEMO.actions, F = DEMO.fmt, D = DEMO.data, U = DEMO.ui;
  var ST = DEMO.state;

  /* --- Icons --------------------------------------------------------------- */
  var ICON_INFO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.5v.01"/></svg>';
  var NET_ICON = '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#7256A8" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="m8.4 10.7 7.2-4.2M8.4 13.3l7.2 4.2"/></svg>';

  var CHANNEL_IDS = D.socialChannels.map(function (c) { return c.id; });

  /* --- Kleine Helfer --------------------------------------------------------*/
  function channel(id) { return D.socialChannels.filter(function (c) { return c.id === id; })[0]; }
  function swatch(d) {
    return d ? 'background:linear-gradient(135deg,' + d.g1 + ',' + d.g2 + ')' : 'background:var(--muted)';
  }
  // Eine Beitrags-/Planzeile — von der Wochenplan-Sektion und den Kanal-Drawern geteilt.
  function planRow(p) {
    var ch = channel(p.channel);
    var d = DEMO.design(p.design);
    return '<div class="plan-row" data-act="openPost" data-arg="' + p.id + '">' +
      '<span class="ch-dot" style="background:' + (ch ? ch.color : '#999') + '"></span>' +
      '<span class="plan-main"><b>' + F.esc(p.title) + '</b><span class="plan-sub">' +
        (ch ? F.esc(ch.name) : '—') + ' · ' + F.esc(p.kind) + ' · ' + F.esc(p.when) + '</span></span>' +
      '<span style="margin-left:auto;width:20px;height:20px;border-radius:6px;flex:none;' + swatch(d) + '"></span>' +
    '</div>';
  }

  /* --- Block 1: Kopfzeile -----------------------------------------------------*/
  function renderHeader(S) {
    var html = '<div class="notice info">' + ICON_INFO +
      '<span><b>Nele</b> plant die Woche, baut jeden Beitrag aus einem Design, das du schon hast — und veröffentlicht nichts ohne deine Freigabe.</span>' +
      '<span class="notice-act"><button class="btn ghost sm" data-act="openAgent" data-arg="nele">Nele ansehen</button></span>' +
    '</div>';
    if (S.planStatus === 'open') {
      html += '<div class="notice warn">' + ICON_INFO +
        '<span><b>Neles Wochenplan</b> mit ' + S.socialPlan.length + ' Beiträgen wartet auf dich.</span>' +
        '<span class="notice-act"><button class="btn primary sm" data-act="openApproval" data-arg="a7">Plan ansehen</button></span>' +
      '</div>';
    } else {
      html += '<div class="notice ok">' + ICON_INFO +
        '<span>Wochenplan freigegeben — ' + S.socialPlan.length + ' Beiträge sind eingeplant.</span>' +
      '</div>';
    }
    return html;
  }

  /* --- Block 2: KPI-Grid ------------------------------------------------------*/
  function kpiCard(label, value, trendHtml) {
    return '<div class="card kpi">' +
      '<div class="kpi-label">' + label + '<span class="kpi-src">' + NET_ICON + '</span></div>' +
      '<div class="kpi-value">' + value + '</div>' +
      trendHtml +
    '</div>';
  }

  function renderKpis(S) {
    var so = DEMO.socialStats(S.range);
    var m = DEMO.metrics(S.range);
    var revShare = m.revenue ? (so.revenue / m.revenue) * 100 : 0;
    var postsN = Math.round(so.posts * S.range / 30);

    var c1 = '<div class="kpi-trend"><span class="vs">' + F.pct0(so.anteil) + ' deines Traffics</span></div>';
    var c2 = '<div class="kpi-trend"><span class="vs">' + F.pct0(revShare) + ' vom Gesamtumsatz</span></div>';
    var c3 = '<div class="kpi-trend"><span class="trend ' + (so.growth >= 0 ? 'up' : 'down') + '">' +
      F.signNum(so.growth) + '</span><span class="vs">im letzten Monat</span></div>';
    var c4 = '<div class="kpi-trend"><span class="vs">in ' + S.range + ' Tagen</span></div>';

    return '<div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">' +
      kpiCard('Sitzungen aus Social', F.num(so.sessions), c1) +
      kpiCard('Umsatz aus Social', F.eur(so.revenue), c2) +
      kpiCard('Follower & Abonnenten', F.num(so.followers), c3) +
      kpiCard('Beiträge', F.num(postsN), c4) +
    '</div>';
  }

  /* --- Block 3: Kanäle --------------------------------------------------------*/
  function channelCard(k, S) {
    var ch = k.ch;
    var postsN = Math.round(ch.posts30 * S.range / 30);
    return '<div class="card">' +
      '<div class="card-head"><div class="ch-head"><span class="ch-dot" style="background:' + ch.color + '"></span>' +
        '<span class="ch-name">' + F.esc(ch.name) + '</span></div>' +
        '<span class="card-title-note">' + F.num(ch.followers) + ' ' + (ch.audienceLabel || 'Follower') + '</span></div>' +
      '<div class="card-pad">' +
        '<div class="stat-big">' + F.num(k.sessions) + '</div>' +
        '<div class="stat-sub">Sitzungen · ' + F.pct0(ch.share) + ' des Social-Traffics</div>' +
        '<div class="kv-row"><span class="kv-k">Umsatz</span><span class="kv-v">' + F.eur(k.revenue) + '</span></div>' +
        '<div class="kv-row"><span class="kv-k">Bestellungen</span><span class="kv-v">' + F.num(k.orders) + '</span></div>' +
        '<div class="kv-row"><span class="kv-k">' + (ch.audienceLabel === 'Abonnenten' ? 'Abonnenten-Zuwachs' : 'Follower-Zuwachs') + '</span><span class="kv-v">' + F.signNum(ch.growth) + '</span></div>' +
        '<div class="kv-row"><span class="kv-k">Beiträge</span><span class="kv-v">' + F.num(postsN) + '</span></div>' +
        '<p class="hint">' + F.esc(ch.role) + '</p>' +
      '</div>' +
      '<div class="card-foot">' +
        '<button class="btn ghost sm" data-act="so.channel" data-arg="' + ch.id + '">Details</button>' +
        '<button class="btn ghost sm" data-act="openConnector" data-arg="' + ch.id + '">Verbindung</button>' +
      '</div>' +
    '</div>';
  }

  function renderChannels(S) {
    var so = DEMO.socialStats(S.range);
    var cards = so.kanaele.map(function (k) { return channelCard(k, S); }).join('');
    return '<div class="section-head"><div><div class="section-title">Kanäle</div>' +
      '<div class="section-sub">Wo deine Reichweite herkommt · ' + S.range + ' Tage</div></div></div>' +
      // 4 Kanäle seit dem WhatsApp-Zugang — trio-grid würde 3+1 stapeln
      '<div class="trio-grid" style="grid-template-columns:repeat(' + so.kanaele.length + ',1fr)">' + cards + '</div>';
  }

  /* --- Block 4: Beiträge -------------------------------------------------------*/
  function postCard(p) {
    var d = DEMO.design(p.design);
    var ch = channel(p.channel);
    var g1 = d ? d.g1 : '#8B8B8B', g2 = d ? d.g2 : '#5E5E5E', dname = d ? d.name : '—';
    return '<div class="card" data-act="openPost" data-arg="' + p.id + '" style="overflow:hidden">' +
      '<div class="post-art" style="background:linear-gradient(135deg,' + g1 + ',' + g2 + ')">' +
        '<span class="post-kind">' + F.esc(p.kind) + '</span>' +
        '<span>' + F.esc(dname) + '</span>' +
      '</div>' +
      '<div class="post-body">' +
        '<div class="post-title">' + F.esc(p.title) + '</div>' +
        '<div class="post-meta">' +
          '<span style="display:inline-flex;align-items:center;gap:4px"><span class="ch-dot" style="background:' +
            (ch ? ch.color : '#999') + '"></span>' + (ch ? F.esc(ch.name) : '—') + '</span>' +
          '<span>' + F.num(p.reach) + ' Impressionen</span>' +
          '<span>' + F.num(p.clicks) + ' Klicks</span>' +
          '<span>' + F.eur(p.revenue) + '</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderPosts(S) {
    var mode = S.filters.soPost || 'all';
    var posts = S.socialPosts;
    var counts = { all: posts.length };
    CHANNEL_IDS.forEach(function (id) {
      counts[id] = posts.filter(function (p) { return p.channel === id; }).length;
    });
    var filtered = mode === 'all' ? posts : posts.filter(function (p) { return p.channel === mode; });
    var sorted = filtered.slice().sort(function (a, b) { return b.reach - a.reach; });

    var segDefs = [{ key: 'all', label: 'Alle' }].concat(CHANNEL_IDS.map(function (id) {
      return { key: id, label: channel(id).name };
    }));
    var seg = '<div class="seg">' + segDefs.map(function (s) {
      return '<button class="' + (mode === s.key ? 'on' : '') + '" data-act="so.filter" data-arg="' + s.key + '">' +
        s.label + ' (' + F.num(counts[s.key] || 0) + ')</button>';
    }).join('') + '</div>';

    var body;
    if (!sorted.length) {
      body = '<div class="empty sm">Keine Beiträge für diesen Kanal.<br>' +
        '<button class="btn ghost sm" data-act="so.clear" style="margin-top:8px">Filter zurücksetzen</button></div>';
    } else {
      var so30 = DEMO.socialStats(30);
      var sumReach = sorted.reduce(function (s, p) { return s + p.reach; }, 0);
      var sumRevenue = sorted.reduce(function (s, p) { return s + p.revenue; }, 0);
      body = '<div class="post-grid">' + sorted.map(postCard).join('') + '</div>' +
        '<div style="border-top:1px solid var(--border-soft);margin-top:12px;padding-top:10px;font-size:12px;color:var(--muted-fg);display:flex;justify-content:space-between">' +
          '<span>' + F.num(sorted.length) + ' von ' + F.num(so30.posts) + ' Beiträgen der letzten 30 Tage — die mit der größten Reichweite</span>' +
          '<span>Summe: ' + F.num(sumReach) + ' Impressionen · ' + F.eur(sumRevenue) + '</span>' +
        '</div>';
    }

    return '<div class="section-head"><div><div class="section-title">Beiträge</div>' +
      '<div class="section-sub">Die stärksten der letzten 30 Tage · von Nele gebaut</div></div>' +
      '<div class="section-action">' + seg + '</div></div>' + body;
  }

  /* --- Block 5: Wochenplan -------------------------------------------------------*/
  function renderPlan(S) {
    var rows = S.socialPlan.map(planRow).join('');
    var byChannel = {};
    S.socialPlan.forEach(function (p) { byChannel[p.channel] = (byChannel[p.channel] || 0) + 1; });
    var distText = CHANNEL_IDS
      .map(function (id) { return { name: channel(id).name, n: byChannel[id] || 0 }; })
      .filter(function (x) { return x.n > 0; })
      .map(function (x) { return x.n + ' ' + F.esc(x.name); })
      .join(' · ');

    var footRight = S.planStatus === 'open'
      ? '<button class="btn primary sm" data-act="openApproval" data-arg="a7">Plan freigeben</button>'
      : '<span class="feed-flag ok">freigegeben</span>';

    var sub = S.socialPlan.length + ' Beiträge · ' + (S.planStatus === 'open' ? 'wartet auf deine Freigabe' : 'eingeplant');

    return '<div class="section-head"><div><div class="section-title">Wochenplan</div>' +
      '<div class="section-sub">' + sub + '</div></div></div>' +
      '<div class="card"><div class="card-pad"><div class="plan-list">' +
        (rows || '<div class="empty sm">Keine Beiträge geplant.</div>') +
      '</div></div>' +
      '<div class="card-foot"><span>' + (distText || '—') + '</span><span>' + footRight + '</span></div></div>';
  }

  /* --- Block 6: Neles Vorschläge -------------------------------------------------*/
  function suggestItem(title, hint, key, runs) {
    var action = runs[key]
      ? '<span class="feed-flag ok">erledigt</span>'
      : '<button class="btn primary sm" data-act="so.run" data-arg="' + key + '">Starten</button>';
    return '<div style="font-weight:600;font-size:13.5px">' + title + '</div>' +
      '<p class="hint">' + hint + '</p>' +
      '<div style="margin-top:6px">' + action + '</div>';
  }

  function renderNext(S) {
    var runs = S.filters.soRuns || {};
    return '<div class="section-head"><div><div class="section-title">Was Nele als Nächstes vorschlägt</div></div></div>' +
      '<div class="card card-pad">' +
        '<div>' + suggestItem('Bestes Design für Pinterest neu aufbereiten',
          'Vier neue Pin-Varianten aus dem Design mit dem höchsten 30-Tage-Umsatz — Hoch- und Querformat, eigene Texte.',
          'repin', runs) + '</div>' +
        '<div style="border-top:1px solid var(--border-soft);padding-top:12px;margin-top:12px">' +
          suggestItem('Beste Zeiten neu bestimmen',
            'Wertet aus, wann Beiträge je Kanal am besten laufen, und richtet künftige Planzeiten danach aus — bestehende Zahlen ändern sich dadurch nicht.',
            'zeiten', runs) +
        '</div>' +
      '</div>';
  }

  /* --- Registrierung als Ebene „Social" des Sichtbarkeits-Reiters ------------------*/
  window.SICHT = window.SICHT || {};
  window.SICHT.social = {
    render: function (S) {
      return renderHeader(S) + renderKpis(S) + renderChannels(S) + renderPosts(S) + renderPlan(S) + renderNext(S);
    }
  };

  /* --- Aktion: openPost — exklusiv, deckt Beiträge UND Planeinträge ab ------------*/
  A['openPost'] = function (id) {
    var p = ST.socialPosts.filter(function (x) { return x.id === id; })[0];
    var isPlan = false;
    if (!p) { p = ST.socialPlan.filter(function (x) { return x.id === id; })[0]; isPlan = true; }
    if (!p) return;

    var ch = channel(p.channel);
    var d = DEMO.design(p.design);
    var g1 = d ? d.g1 : '#8B8B8B', g2 = d ? d.g2 : '#5E5E5E', dname = d ? d.name : '—';

    var artHtml = '<div style="height:170px;border-radius:10px;background:linear-gradient(135deg,' + g1 + ',' + g2 +
      ');display:flex;align-items:center;justify-content:center">' +
      '<span style="color:rgba(255,255,255,.9);font-weight:600;font-size:14px">' + F.esc(dname) + '</span></div>';

    var designHtml = '<div class="ag-now"><span style="width:22px;height:22px;border-radius:6px;flex:none;' + swatch(d) + '"></span>' +
      '<span>' + F.esc(dname) + '</span>' +
      (d ? '<button class="btn ghost sm" style="margin-left:auto" data-act="openDesign" data-arg="' + d.id + '">Design ansehen</button>' : '') +
    '</div>';

    var extra;
    if (!isPlan) {
      var ctr = p.reach ? (p.clicks / p.reach) * 100 : 0;
      extra = '<div class="drawer-grid">' +
          '<div class="mini"><div class="mini-k">Impressionen</div><div class="mini-v">' + F.num(p.reach) + '</div></div>' +
          '<div class="mini"><div class="mini-k">Klicks</div><div class="mini-v">' + F.num(p.clicks) + '</div></div>' +
          '<div class="mini"><div class="mini-k">Bestellungen</div><div class="mini-v">' + F.num(p.orders) + '</div></div>' +
          '<div class="mini"><div class="mini-k">Umsatz</div><div class="mini-v">' + F.eur(p.revenue) + '</div></div>' +
        '</div>' +
        '<div class="kv-row"><span class="kv-k">Klickrate</span><span class="kv-v">' + F.pct1(ctr) + '</span></div>';
    } else if (ST.planStatus === 'approved') {
      extra = '<div class="notice ok">' + ICON_INFO + '<span>Eingeplant für ' + F.esc(p.when) + '.</span></div>';
    } else {
      extra = '<div class="notice info">' + ICON_INFO +
        '<span>Geplant für ' + F.esc(p.when) + '. Geht raus, sobald du den Wochenplan freigibst.</span></div>';
    }

    var foot = '<button class="btn ghost" data-act="closeDrawer">Schließen</button>';
    if (isPlan) {
      var a7 = DEMO.approval('a7');
      if (a7 && a7.status === 'open') {
        foot += '<button class="btn primary" data-act="openApproval" data-arg="a7">Wochenplan ansehen</button>';
      }
    }

    U.drawer({
      title: F.esc(p.title),
      sub: (ch ? F.esc(ch.name) : '—') + ' · ' + F.esc(p.kind) + ' · ' + F.esc(p.when),
      body: artHtml +
        '<h4 class="drawer-h">Beitragstext</h4><div class="excerpt">' + F.rich(p.text) + '</div>' +
        '<h4 class="drawer-h">Design</h4>' + designHtml +
        extra,
      foot: foot
    });
  };

  /* --- Aktion: so.channel — Kanal-Detail (Drawer) --------------------------------*/
  A['so.channel'] = function (id) {
    var so = DEMO.socialStats(ST.range);
    var k = so.kanaele.filter(function (x) { return x.ch.id === id; })[0];
    if (!k) return;
    var ch = k.ch;
    var postsN = Math.round(ch.posts30 * ST.range / 30);
    var ownPosts = ST.socialPosts.filter(function (p) { return p.channel === id; });
    var ownPlan = ST.socialPlan.filter(function (p) { return p.channel === id; });

    var body = '<div class="drawer-grid">' +
        '<div class="mini"><div class="mini-k">Sitzungen</div><div class="mini-v">' + F.num(k.sessions) + '</div></div>' +
        '<div class="mini"><div class="mini-k">Umsatz</div><div class="mini-v">' + F.eur(k.revenue) + '</div></div>' +
        '<div class="mini"><div class="mini-k">Bestellungen</div><div class="mini-v">' + F.num(k.orders) + '</div></div>' +
        '<div class="mini"><div class="mini-k">Beiträge</div><div class="mini-v">' + F.num(postsN) + '</div></div>' +
      '</div>' +
      '<p class="lead">' + F.esc(ch.note) + '</p>' +
      '<h4 class="drawer-h">Beiträge auf diesem Kanal</h4>' +
      (ownPosts.length ? '<div class="plan-list">' + ownPosts.map(planRow).join('') + '</div>' : '<p class="hint">—</p>') +
      '<h4 class="drawer-h">Geplant</h4>' +
      (ownPlan.length ? '<div class="plan-list">' + ownPlan.map(planRow).join('') + '</div>' : '<p class="hint">—</p>');

    U.drawer({
      title: F.esc(ch.name),
      sub: F.num(ch.followers) + ' Follower · ' + F.signNum(ch.growth) + ' im Monat',
      body: body,
      foot: '<button class="btn ghost" data-act="closeDrawer">Schließen</button>' +
            '<button class="btn primary" data-act="askAgent" data-arg="nele">Nele fragen</button>'
    });
  };

  /* --- Aktionen: Filter über die Beiträge-Sektion --------------------------------*/
  A['so.filter'] = function (mode) {
    ST.filters.soPost = mode;
    DEMO.render();
  };
  A['so.clear'] = function () {
    ST.filters.soPost = 'all';
    DEMO.render();
  };

  /* --- Aktion: so.run — Neles zwei Vorschläge ------------------------------------*/
  A['so.run'] = function (kind) {
    ST.filters.soRuns = ST.filters.soRuns || {};
    if (ST.filters.soRuns[kind]) return;

    if (kind === 'repin') {
      U.run({
        agent: 'nele', title: 'Pin-Serie erstellen',
        steps: [
          { text: 'Reichweite der letzten 30 Tage auswerten', ms: 800 },
          { text: 'Stärkstes Design bestimmen', ms: 600 },
          { text: 'Vier Pin-Varianten bauen (Hoch- und Querformat)', ms: 1100 },
          { text: 'Texte und Verschlagwortung schreiben', ms: 700 }
        ],
        done: { text: '4 neue Pins hängen jetzt am Wochenplan.', cta: 'Alles klar', act: 'closeModal' },
        onDone: function () {
          var best = ST.designs.slice().sort(function (a, b) { return b.revenue30 - a.revenue30; })[0];
          var variants = [
            { title: best.name + ' — Nahaufnahme', text: 'Struktur und Farben von „' + best.name + '“ ganz nah — für alle, die genau hinsehen.', when: 'Di 09:00' },
            { title: best.name + ' — im Raum', text: 'So wirkt „' + best.name + '“ an der Wand. Ein Foto, das den Maßstab zeigt.', when: 'Mi 14:00' },
            { title: best.name + ' — Hochformat', text: 'Fürs schmale Treppenhaus: „' + best.name + '“ hochkant gesetzt.', when: 'Fr 10:00' },
            { title: best.name + ' — Querformat', text: 'Breite Wand, ruhiges Motiv: „' + best.name + '“ quer gesetzt.', when: 'So 18:00' }
          ];
          variants.forEach(function (v, i) {
            ST.socialPlan.push({
              id: 'rp' + Math.random().toString(36).slice(2) + i,
              channel: 'pinterest', design: best.id, kind: 'Pin', when: v.when,
              title: v.title, text: v.text
            });
          });
          ST.filters.soRuns.repin = true;
          DEMO.pushFeed('nele', '<b>Nele</b> hat 4 neue Pins aus <b>„' + F.esc(best.name) + '“</b> gebaut — sie hängen jetzt am nächsten Wochenplan.', null, 'NOR-66');
          U.toast('4 neue Pins am Wochenplan');
          if (ST.tab === 'sichtbarkeit') DEMO.render();
        }
      });
    } else if (kind === 'zeiten') {
      U.run({
        agent: 'nele', title: 'Beste Zeiten bestimmen',
        steps: [
          { text: 'Impressionen je Wochentag und Uhrzeit auswerten', ms: 800 },
          { text: 'Kanäle einzeln vergleichen', ms: 700 },
          { text: 'Planzeiten ableiten', ms: 600 }
        ],
        done: { text: 'Pinterest läuft sonntagabends am stärksten. Nele legt künftige Pins bevorzugt in dieses Fenster — an den bestehenden Zahlen ändert das nichts.', cta: 'Alles klar', act: 'closeModal' },
        onDone: function () {
          ST.filters.soRuns.zeiten = true;
          DEMO.pushFeed('nele', '<b>Nele</b>: Auswertung der besten Zeiten — Pinterest läuft sonntagabends am stärksten, künftige Beiträge plant sie bevorzugt dort ein. Bestehende Zahlen bleiben unverändert.', null, 'NOR-66');
          U.toast('Beste Zeiten bestimmt');
          if (ST.tab === 'sichtbarkeit') DEMO.render();
        }
      });
    }
  };
})();

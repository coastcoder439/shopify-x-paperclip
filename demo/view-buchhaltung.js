/* ============================================================================
   Reiter „Buchhaltung" — GuV, Belege, USt-VA, Agenten-Kosten.
   Jede Zahl kommt aus DEMO.monthSums() / DEMO.ustvaNumbers() / D.receipts,
   also aus derselben Tagesserie wie der Rest der Demo.
   ========================================================================== */
(function () {
  'use strict';
  var A = DEMO.actions, F = DEMO.fmt, D = DEMO.data, U = DEMO.ui;

  var KONTEN = ['4930 Bürobedarf', '3400 Wareneingang', '4980 Betriebsbedarf', '4600 Werbekosten'];
  var ICON_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  var ICON_INFO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/></svg>';

  function receipts(S) { return D.receipts[S.month] || []; }

  function gefiltert(S) {
    var q = (S.forms['bu.q'] || '').toLowerCase().trim();
    var f = S.filters.bu || 'all';
    return receipts(S).filter(function (r) {
      var offen = r.status === 'open' && S.receiptOpen === 'open';
      if (f === 'auto' && offen) return false;
      if (f === 'open' && !offen) return false;
      if (!q) return true;
      return (r.vendor + ' ' + r.text + ' ' + r.account + ' ' + r.id + ' ' + r.kind).toLowerCase().indexOf(q) >= 0;
    });
  }

  function sortiert(S, list) {
    var s = S.sort.bel || { key: 'date', dir: 'desc' };
    var out = list.slice();
    out.sort(function (a, b) {
      var x = a[s.key], y = b[s.key];
      if (s.key === 'date') { x = a.date.getTime(); y = b.date.getTime(); }
      if (s.key === 'amount') { x = a.amount; y = b.amount; }
      if (typeof x === 'string') { var c = x.localeCompare(y); return s.dir === 'asc' ? c : -c; }
      return s.dir === 'asc' ? x - y : y - x;
    });
    return out;
  }

  function th(S, key, label, tabelle) {
    var s = S.sort[tabelle];
    var ar = s && s.key === key ? '<span class="sort-ar">' + (s.dir === 'asc' ? '▲' : '▼') + '</span>' : '';
    return '<th class="sortable" data-act="sort" data-arg="' + tabelle + '|' + key + '">' + label + ar + '</th>';
  }

  /* --- GuV ---------------------------------------------------------------- */
  function guv(S) {
    var m = DEMO.monthSums(S.month);
    var zeile = function (k, v, cls) { return '<div class="guv-row' + (cls ? ' ' + cls : '') + '"><span>' + k + '</span><span class="amt">' + v + '</span></div>'; };
    return '<div class="card">' +
      '<div class="card-head"><span class="card-title">Gewinn- und Verlustrechnung</span>' +
        '<span class="card-title-note">' + F.monthName(S.month) + ' 2026</span></div>' +
      '<div class="card-pad">' +
        '<div class="guv">' +
          zeile('Einnahmen (Shopify)', F.eur2(m.revenue)) +
          zeile('Druckkosten (Printful)', F.eurSigned(-m.print)) +
          zeile('Zahlungsgebühren (Shopify, PayPal)', F.eurSigned(-m.fees)) +
          zeile('Rohertrag', F.eur2(m.gross) + ' · ' + F.pct0(m.margin), 'total') +
        '</div>' +
        '<div class="guv" style="margin-top:10px">' +
          zeile('Werbung (Google Ads)', F.eurSigned(-m.ads)) +
          zeile('Software &amp; Abos', F.eurSigned(-m.software)) +
          zeile('Agenten <span class="feed-flag ok" style="margin-left:4px">6 Agenten</span>', F.eurSigned(-m.agentCost)) +
          zeile('Betriebsergebnis', F.eur2(m.operating), 'total') +
        '</div>' +
      '</div>' +
      '<div class="card-foot">' +
        '<span>Aus <b>' + receipts(S).length + '</b> Belegen gerechnet — jeder einzeln zugeordnet</span>' +
        '<span style="display:flex;gap:6px">' +
          '<button class="btn ghost sm" data-act="bu.export" data-arg="datev">DATEV-Export</button>' +
          '<button class="btn ghost sm" data-act="bu.export" data-arg="csv">CSV</button>' +
        '</span>' +
      '</div>' +
    '</div>';
  }

  /* --- USt-VA ------------------------------------------------------------- */
  function ustva(S) {
    var u = DEMO.ustvaNumbers(5);                 // immer der abgeschlossene Vormonat
    var zeile = function (k, v, cls) { return '<div class="guv-row' + (cls ? ' ' + cls : '') + '"><span>' + k + '</span><span class="amt">' + v + '</span></div>'; };
    var unten = S.ustva === 'draft'
      ? '<div class="notice warn" style="margin:12px 0 0">' + ICON_INFO +
          '<span>Entwurf steht — gegen die Payouts geprüft, keine Abweichung. Frist: <b>10.08.2026</b>.</span></div>' +
        '<button class="btn primary sm" style="margin-top:10px" data-act="openApproval" data-arg="a2">Prüfen &amp; freigeben</button>'
      : '<div class="notice ok" style="margin:12px 0 0">' + ICON_INFO +
          '<span>Übermittelt. Das Protokoll liegt als Artifact am Task ' +
          '<span class="task-ref" data-act="openTask" data-arg="NOR-49">NOR-49</span>.</span></div>';
    return '<div class="card">' +
      '<div class="card-head"><span class="card-title">Umsatzsteuer-Voranmeldung</span>' +
        '<span class="card-title-note">Juni 2026</span></div>' +
      '<div class="card-pad">' +
        '<div class="guv">' +
          zeile('Umsätze netto', F.eur2(u.net)) +
          zeile('Umsatzsteuer 19 %', F.eur2(u.vat)) +
          zeile('Vorsteuer', F.eurSigned(-u.inputVat)) +
          zeile('Zahllast', F.eur2(u.pay), 'total') +
        '</div>' + unten +
        '<p class="hint">Fällig ist immer der abgeschlossene Vormonat — deshalb Juni, egal welchen Monat du oben ansiehst.</p>' +
      '</div>' +
    '</div>';
  }

  /* --- Belege ------------------------------------------------------------- */
  function belege(S) {
    var alle = receitsSafe(S);
    var liste = sortiert(S, gefiltert(S));
    var limit = S.filters.buLimit || 40;
    var sichtbar = liste.slice(0, limit);
    var summe = liste.reduce(function (s, r) { return s + r.amount; }, 0);
    var f = S.filters.bu || 'all';
    var offeneAnzahl = alle.filter(function (r) { return r.status === 'open' && S.receiptOpen === 'open'; }).length;
    var seg = [['all', 'Alle', alle.length], ['auto', 'Automatisch', alle.length - offeneAnzahl], ['open', 'Offen', offeneAnzahl]]
      .map(function (x) { return '<button class="' + (f === x[0] ? 'on' : '') + '" data-act="bu.filter" data-arg="' + x[0] + '">' + x[1] + ' (' + x[2] + ')</button>'; }).join('');

    var rows = sichtbar.map(function (r) {
      var offen = r.status === 'open' && S.receiptOpen === 'open';
      var konto = offen
        ? '<span class="feed-flag warn">Zuordnung offen</span>'
        : '<span class="mono" style="font-size:11px">' + F.esc(r.account) + '</span>';
      var text = r.text.length > 46 ? r.text.slice(0, 44) + '…' : r.text;
      return '<tr class="row-link" data-act="openReceipt" data-arg="' + r.id + '">' +
        '<td><span class="mono">' + r.id + '</span><br><span class="hint" style="font-size:11px">' + F.esc(text) + '</span></td>' +
        '<td><span class="mono">' + F.dateShort(r.date) + '</span></td>' +
        '<td><span style="font-weight:600">' + F.esc(r.vendor) + '</span><br><span class="hint" style="font-size:11px">' + F.esc(r.kind) + '</span></td>' +
        '<td>' + konto + '</td>' +
        '<td class="rev">' + F.eurSigned(r.amount) + '</td>' +
      '</tr>';
    }).join('');

    var inhalt = liste.length
      ? '<table class="products"><tr>' +
          th(S, 'id', 'Beleg', 'bel') + th(S, 'date', 'Datum', 'bel') + th(S, 'vendor', 'Lieferant', 'bel') +
          '<th>Konto</th>' + th(S, 'amount', 'Betrag', 'bel') +
        '</tr>' + rows + '</table>'
      : '<div class="empty sm"><div class="empty-t">Kein Beleg passt</div>' +
        'Weder Suche noch Filter liefern hier etwas.<br>' +
        '<button class="btn ghost sm" style="margin-top:10px" data-act="bu.clear">Filter zurücksetzen</button></div>';

    var foot = liste.length
      ? '<div class="card-foot"><span>' +
          (sichtbar.length < liste.length
            ? '<b>' + sichtbar.length + '</b> von ' + liste.length + ' Belegen gezeigt — Summe aller gefilterten: <b>' + F.eur2(summe) + '</b>'
            : '<b>' + liste.length + '</b> Belege · Summe <b>' + F.eur2(summe) + '</b>') +
        '</span>' +
        (sichtbar.length < liste.length
          ? '<button class="btn ghost sm" data-act="bu.more">Weitere 40 zeigen</button>'
          : '<span>Karla erfasst sie jede Nacht um 18:00</span>') +
      '</div>' : '';

    return '<div class="section-head"><span class="section-title">Belege</span>' +
        '<span class="section-sub">' + alle.length + ' Belege im ' + F.monthName(S.month) + ' · von Karla automatisch erfasst</span>' +
        '<span class="section-action"><span class="search-in">' + ICON_SEARCH +
          '<input data-model="bu.q" data-live="1" data-focus-key="bu.q" value="' + F.esc(S.forms['bu.q'] || '') + '" placeholder="Beleg, Lieferant oder Konto suchen …"></span></span>' +
      '</div>' +
      '<div style="margin-bottom:10px"><span class="seg">' + seg + '</span></div>' +
      '<div class="card" style="overflow:hidden">' + inhalt + foot + '</div>';
  }
  // Kleiner Schutz: fehlt der Monat, ist die Liste leer statt undefined
  function receitsSafe(S) { return receipts(S); }

  /* --- Agenten-Kosten ------------------------------------------------------ */
  function kosten(S) {
    var m = DEMO.monthSums(S.month);
    var summeKosten = D.agents.reduce(function (s, a) { return s + a.costMonth; }, 0);
    var summeStunden = D.agents.reduce(function (s, a) { return s + a.hoursSaved; }, 0);
    var wert = summeStunden * 45;
    var anteil = (m.agentCost / (m.agentCost + m.ads)) * 100;
    var vomRohertrag = (m.agentCost / m.gross) * 100;

    var rows = D.agents.map(function (a) {
      return '<tr class="row-link" data-act="openAgent" data-arg="' + a.id + '">' +
        '<td><span class="prod-cell"><span class="agent-avatar" style="background:' + a.color + '">' + a.initials + '</span>' +
          '<span><span class="prod-name">' + a.name + '</span><br><span class="prod-sku">' + a.role + '</span></span></span></td>' +
        '<td><span class="mono" style="font-size:11px">' + a.model + '</span></td>' +
        '<td><span class="hint">' + a.access + '</span></td>' +
        '<td class="rev">' + (a.costMonth ? F.eur2(a.costMonth) : 'kostenfrei ' + '<span class="feed-flag ok">lokal</span>') + '</td>' +
        '<td><span class="mono">' + a.hoursSaved + ' Std.</span></td>' +
      '</tr>';
    }).join('');

    return '<div class="section-head"><span class="section-title">Was dich die Agenten kosten</span>' +
        '<span class="section-sub">Der ehrliche Vergleich · ' + F.monthName(S.month) + '</span></div>' +
      '<div class="duo-grid">' +
        '<div class="card" style="overflow:hidden">' +
          '<div class="card-head"><span class="card-title">Kosten je Agent</span>' +
            '<span class="card-title-note">Klick öffnet das Profil</span></div>' +
          '<table class="products"><tr><th>Agent</th><th>Modell</th><th>Zugang</th><th>Kosten</th><th>Zeit gespart</th></tr>' +
          rows + '</table>' +
          '<div class="card-foot"><span><b>' + D.agents.length + ' Agenten</b> · Summe <b>' + F.eur2(summeKosten) + '</b></span>' +
            '<span><b>' + summeStunden + ' Stunden</b> nicht bei dir gelandet</span></div>' +
        '</div>' +
        '<div class="card card-pad">' +
          '<div class="stat-big">' + F.eur2(m.agentCost) + '</div>' +
          '<div class="stat-sub">Agenten-Kosten im ' + F.monthName(S.month) + '</div>' +
          '<div style="margin-top:14px">' +
            '<div class="kv-row"><span class="kv-k">Google Ads im selben Monat</span><span class="kv-v">' + F.eur2(m.ads) + '</span></div>' +
            '<div class="kv-row"><span class="kv-k">Software &amp; Abos</span><span class="kv-v">' + F.eur2(m.software) + '</span></div>' +
            '<div class="kv-row"><span class="kv-k">Gesparte Zeit</span><span class="kv-v">' + summeStunden + ' Std.</span></div>' +
            '<div class="kv-row"><span class="kv-k">Bei 45 €/Std. entspricht das</span><span class="kv-v">' + F.eur2(wert) + '</span></div>' +
          '</div>' +
          '<div style="margin-top:14px"><div class="prog"><i style="width:' + anteil.toFixed(1) + '%"></i></div>' +
            '<p class="hint">Von jedem Euro, den du diesen Monat für Werbung und Agenten ausgibst, gehen <b>' +
              Math.round(anteil) + ' Cent</b> an die Agenten.</p></div>' +
          '<div class="notice ok" style="margin-top:12px">' + ICON_INFO +
            '<span>Die Agenten kosten <b>' + vomRohertrag.toFixed(1).replace('.', ',') + ' %</b> deines Rohertrags.</span></div>' +
          '<p class="hint">Emma läuft auf einem lokalen Modell auf deinem Server — sie taucht mit 0 € auf, weil sie außer Strom nichts kostet.</p>' +
        '</div>' +
      '</div>';
  }

  /* --- View ---------------------------------------------------------------- */
  DEMO.views.buchhaltung = {
    render: function (S) {
      var m = DEMO.monthSums(S.month);
      var seg = [[5, 'Juni'], [6, 'Juli']].map(function (x) {
        return '<button class="' + (S.month === x[0] ? 'on' : '') + '" data-act="bu.month" data-arg="' + x[0] + '">' + x[1] + '</button>';
      }).join('');

      return '<div class="notice info">' + ICON_INFO +
          '<span><b>Karla</b> holt jede Nacht um 18:00 die Belege aus Shopify und Printful, ordnet sie zu und bereitet die Voranmeldung vor. ' +
          'Übermittelt wird nur, was du freigibst.</span>' +
          '<span class="notice-act"><span class="seg">' + seg + '</span></span>' +
        '</div>' +
        (!m.complete ? '<p class="hint" style="margin:-4px 0 12px">Juli läuft noch — die Zahlen umfassen <b>' + m.days + ' von 31 Tagen</b>.</p>' : '') +
        '<div class="charts-grid">' + guv(S) + ustva(S) + '</div>' +
        '<div style="margin-top:26px">' + belege(S) + '</div>' +
        '<div style="margin-top:26px">' + kosten(S) + '</div>';
    }
  };

  /* --- Aktionen ------------------------------------------------------------ */
  A['bu.month'] = function (m) {
    DEMO.state.month = parseInt(m, 10);
    DEMO.state.filters.buLimit = 40;
    DEMO.render();
  };
  A['bu.filter'] = function (f) {
    DEMO.state.filters.bu = f;
    DEMO.state.filters.buLimit = 40;
    DEMO.render();
  };
  A['bu.clear'] = function () {
    DEMO.state.filters.bu = 'all';
    DEMO.state.forms['bu.q'] = '';
    DEMO.render();
  };
  A['bu.more'] = function () {
    DEMO.state.filters.buLimit = (DEMO.state.filters.buLimit || 40) + 40;
    DEMO.render();
  };

  A['bu.export'] = function (art) {
    var S = DEMO.state;
    var n = receipts(S).length, monat = F.monthName(S.month);
    U.run({
      agent: 'karla', title: 'Export erstellen',
      steps: [
        { text: 'Belege des Monats sammeln', ms: 700 },
        { text: 'Konten nach SKR03 zuordnen', ms: 800 },
        { text: 'Datei schreiben', ms: 600 }
      ],
      done: {
        text: (art === 'datev' ? 'DATEV-Datei' : 'CSV-Datei') + ' für ' + monat + ' mit ' + n +
              ' Belegen liegt als Artifact am Task NOR-49.',
        cta: 'Alles klar', act: 'closeModal'
      },
      onDone: function () {
        DEMO.pushFeed('karla', '<b>Karla</b> hat den <b>' + (art === 'datev' ? 'DATEV-Export' : 'CSV-Export') +
          '</b> für ' + monat + ' erstellt — ' + n + ' Belege → Artifacts.', { type: 'ok', text: 'Fertig' }, 'NOR-49');
      }
    });
  };

  A['openReceipt'] = function (id) {
    var S = DEMO.state;
    var r = receipts(S).filter(function (x) { return x.id === id; })[0];
    if (!r) return;
    var offen = r.status === 'open' && S.receiptOpen === 'open';

    var karte = '<div class="card card-pad">' +
      '<div style="display:flex;align-items:baseline;gap:10px">' +
        '<span style="font-size:15px;font-weight:600;color:var(--fg-strong)">' + F.esc(r.vendor) + '</span>' +
        '<span class="rev" style="margin-left:auto;font-size:15px;font-weight:700">' + F.eurSigned(r.amount) + '</span>' +
      '</div>' +
      '<div style="margin-top:8px">' +
        '<div class="kv-row"><span class="kv-k">Datum</span><span class="kv-v">' + F.date(r.date) + '</span></div>' +
        '<div class="kv-row"><span class="kv-k">Art</span><span class="kv-v">' + F.esc(r.kind) + '</span></div>' +
        '<div class="kv-row"><span class="kv-k">Text</span><span class="kv-v" style="font-family:inherit">' + F.esc(r.text) + '</span></div>' +
        '<div class="kv-row"><span class="kv-k">Konto</span><span class="kv-v">' + F.esc(r.account) + '</span></div>' +
        '<div class="kv-row"><span class="kv-k">Status</span><span>' +
          (offen ? '<span class="feed-flag warn">Zuordnung offen</span>' : '<span class="feed-flag ok">automatisch zugeordnet</span>') +
        '</span></div>' +
      '</div></div>';

    var extra = '', foot;
    if (offen) {
      extra = '<div class="notice warn" style="margin-top:12px">' + ICON_INFO +
          '<span>Karla ist sich nicht sicher: Der Lieferant ist neu und die Rechnung nennt keinen Leistungszeitraum. ' +
          'Sie ordnet nichts zu, was sie nicht belegen kann.</span></div>' +
        '<label class="fld" style="margin-top:12px"><span class="fld-k">Konto wählen</span>' +
          '<select class="field" data-model="bu.acct">' +
            '<option value="">— bitte wählen —</option>' +
            KONTEN.map(function (k) { return '<option value="' + k + '">' + k + '</option>'; }).join('') +
          '</select></label>';
      foot = '<button class="btn ghost" data-act="closeDrawer">Schließen</button>' +
             '<button class="btn primary" data-act="bu.assign" data-arg="' + r.id + '">Konto zuordnen</button>';
    } else {
      foot = '<button class="btn ghost" data-act="closeDrawer">Schließen</button>' +
             '<button class="btn ghost" data-act="askAgent" data-arg="karla">Karla fragen</button>';
    }

    U.drawer({
      title: r.vendor, sub: r.id + ' · ' + F.date(r.date),
      body: karte + extra, foot: foot
    });
    DEMO.state.forms['bu.acct'] = '';
  };

  A['bu.assign'] = function (id) {
    var S = DEMO.state;
    var konto = S.forms['bu.acct'];
    if (!konto) { U.toast('Bitte erst ein Konto wählen', 'warn'); return; }
    var r = (D.receipts[6] || []).filter(function (x) { return x.id === id; })[0];
    if (r) { r.account = konto; r.status = 'auto'; }
    S.receiptOpen = 'assigned';
    U.closeDrawer();
    U.toast('Beleg zugeordnet — Karla merkt sich den Lieferanten');
    DEMO.pushFeed('karla', '<b>Karla</b> hat den Beleg <b>Nordisk Papir A/S</b> auf <b>' + F.esc(konto) +
      '</b> gebucht und die Regel für künftige Rechnungen dieses Lieferanten gespeichert.',
      { type: 'ok', text: 'Erledigt' }, 'NOR-49');
    DEMO.render();
  };
})();

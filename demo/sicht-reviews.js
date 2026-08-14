/* ============================================================================
   Ebene „Bewertungen" des Sichtbarkeits-Reiters.
   Rating (Sterne) ist etwas anderes als Ranking (Google-Position, Ebene
   „Website") — diese Ebene zeigt nur die Sterne. Emma beantwortet gute
   Bewertungen selbst; bei drei Sternen und weniger liegt ihr Entwurf bei dir,
   weil meist ein Kulanzangebot drinsteht. Datenquelle ausschließlich
   DEMO.state.reviews / DEMO.reviewStats() — keine eigenen Kennzahlen.
   ========================================================================== */
(function () {
  'use strict';
  var A = DEMO.actions, F = DEMO.fmt, D = DEMO.data, U = DEMO.ui, ST = DEMO.state;

  /* --- Sterne ---------------------------------------------------------------- */
  var STAR_D = 'm12 3.5 2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.8l6-.8Z';

  function starIcon(on) {
    return on
      ? '<svg viewBox="0 0 24 24" class="s-on" fill="currentColor" stroke="none"><path d="' + STAR_D + '"/></svg>'
      : '<svg viewBox="0 0 24 24" class="s-off" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="' + STAR_D + '"/></svg>';
  }
  function stars(n, big) {
    var html = '';
    for (var i = 1; i <= 5; i++) html += starIcon(i <= n);
    return '<span class="stars' + (big ? ' lg' : '') + '">' + html + '</span>';
  }
  function miniStar() {
    return '<svg viewBox="0 0 24 24" width="10" height="10" fill="#E8A33D" stroke="none"><path d="' + STAR_D + '"/></svg>';
  }

  /* --- Hinweiszeilen (.notice) ------------------------------------------------- */
  function noticeIcon(kind) {
    if (kind === 'warn') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 8v5"/><path d="M12 16.5v.01"/><circle cx="12" cy="12" r="9"/></svg>';
    if (kind === 'ok') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/></svg>';
  }
  function notice(kind, bodyHtml, actHtml) {
    return '<div class="notice ' + kind + '">' + noticeIcon(kind) + '<span>' + bodyHtml + '</span>' +
      (actHtml ? '<span class="notice-act">' + actHtml + '</span>' : '') + '</div>';
  }

  var SEARCH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  var DIST_COLORS = { 5: '#22A05A', 4: '#5E9E6E', 3: '#F9AB00', 2: '#E08A3C', 1: '#D64545' };

  /* --- Zeit-Strings der Demo vergleichbar machen (wie in view-support.js) ----- */
  function whenTs(w) {
    var m;
    if (/^Heute /.test(w)) {
      m = w.match(/(\d\d):(\d\d)$/);
      var d1 = new Date(D.today.getTime());
      d1.setHours(parseInt(m[1], 10), parseInt(m[2], 10), 0, 0);
      return d1.getTime();
    }
    if (/^Gestern /.test(w)) {
      m = w.match(/(\d\d):(\d\d)$/);
      var d2 = new Date(D.today.getTime());
      d2.setDate(d2.getDate() - 1);
      d2.setHours(parseInt(m[1], 10), parseInt(m[2], 10), 0, 0);
      return d2.getTime();
    }
    m = w.match(/^(\d\d)\.(\d\d)\.\s*(\d\d):(\d\d)$/);
    if (m) return new Date(2026, parseInt(m[2], 10) - 1, parseInt(m[1], 10), parseInt(m[3], 10), parseInt(m[4], 10)).getTime();
    return 0;
  }

  /* --- Kleine Helfer ----------------------------------------------------------- */
  function designSquare(designId, size) {
    var d = DEMO.design(designId);
    if (!d) return '';
    return '<span style="width:' + size + 'px;height:' + size + 'px;border-radius:5px;flex:none;display:inline-block;background:linear-gradient(135deg,' + d.g1 + ',' + d.g2 + ')"></span>';
  }
  function ticketChipFor(r) {
    if (!r.ticket) return '';
    var t = DEMO.ticket(r.ticket);
    if (!t) return '';
    return ' <span class="task-ref" data-act="openTicket" data-arg="' + r.ticket + '">auch als Anfrage ' + F.esc(t.no) + '</span>';
  }
  // Was genau im Entwurf Geld kostet — benennt nur, was im Text bereits steht.
  function draftWarnText(r) {
    if (r.id === 'rv1') return 'Im Entwurf steht ein kostenloser <b>Neudruck</b> — das kostet Geld, deshalb entscheidest du.';
    if (r.id === 'rv2') return 'Im Entwurf steht eine kostenlose <b>Ersatzsendung</b> — auch das kostet Geld, das liegt außerhalb von Emmas Rechten.';
    if (r.id === 'rv3') return 'Im Entwurf steht ein kostenloser <b>Ersatz-Hoodie</b> — das kostet Geld, deshalb entscheidest du.';
    return 'Der Entwurf sagt eine Kulanzleistung zu, die Geld kostet — das liegt außerhalb von Emmas Rechten.';
  }
  function openApprovalForTicket(ticketId) {
    return ST.approvals.filter(function (a) {
      return a.kind === 'support' && a.ticketId === ticketId && a.status === 'open';
    })[0];
  }

  /* --- Block 1: Kopfzeile ------------------------------------------------------- */
  function renderNotices(rv) {
    var html = notice('info',
      '<b>Emma</b> beantwortet gute Bewertungen selbst. Bei drei Sternen und weniger schreibt sie einen Entwurf und fragt dich — weil dort meist ein Kulanzangebot drinsteht.',
      '<button class="btn ghost sm" data-act="openConnector" data-arg="reviews">Quelle</button>');
    if (rv.open > 0) {
      html += notice('warn',
        '<b>' + rv.open + '</b> Bewertungen warten auf deine Freigabe.',
        '<button class="btn primary sm" data-act="rv.first">Erste öffnen</button>');
    }
    return html;
  }

  /* --- Block 2: Gesamtwertung + Verteilung -------------------------------------- */
  function distRow(v) {
    return '<div class="dist-row" data-act="rv.filterStars" data-arg="' + v.stars + '">' +
      '<span class="dist-k">' + v.stars + miniStar() + '</span>' +
      '<span class="traffic-bar"><i style="width:' + v.share.toFixed(1) + '%;background:' + DIST_COLORS[v.stars] + '"></i></span>' +
      '<span class="dist-v">' + v.count + ' · ' + Math.round(v.share) + '%</span>' +
    '</div>';
  }

  function renderChartsGrid(rv) {
    var avgTxt = rv.avg.toFixed(1).replace('.', ',');
    var goodEntries = rv.verteilung.filter(function (v) { return v.stars >= 4; });
    var goodCount = goodEntries.reduce(function (s, v) { return s + v.count; }, 0);
    var goodShare = goodEntries.reduce(function (s, v) { return s + v.share; }, 0);

    var left = '<div class="card card-pad">' +
      '<div class="rating-hero">' +
        '<span class="rating-num">' + avgTxt + '</span>' +
        '<div>' + stars(Math.round(rv.avg), true) +
          '<div class="stat-sub">aus ' + F.num(rv.total) + ' Bewertungen · ' + F.pct0(rv.quote) + ' deiner Bestellungen</div>' +
        '</div>' +
      '</div>' +
      '<div class="kv-row"><span class="kv-k">Bewertungen mit 4–5 Sternen</span><span class="kv-v">' + F.num(goodCount) + ' (' + F.pct0(goodShare) + ')</span></div>' +
      '<div class="kv-row"><span class="kv-k">Kritisch (1–3 Sterne)</span><span class="kv-v">' + F.num(rv.kritisch) + '</span></div>' +
      '<div class="kv-row"><span class="kv-k">Unbeantwortet</span><span class="kv-v">' + F.num(rv.open) + '</span></div>' +
      '<p class="hint">Nicht zu verwechseln mit dem <b>Ranking</b>: Das ist deine Position bei Google und steht unter „Website“. Das Ranking bringt Leute in den Shop — die Sterne entscheiden, ob sie kaufen.</p>' +
    '</div>';

    var right = '<div class="card">' +
      '<div class="card-head"><span class="card-title">Verteilung</span><span class="card-title-note">alle ' + F.num(rv.total) + ' Bewertungen</span></div>' +
      '<div class="card-pad" style="padding-bottom:4px">' + rv.verteilung.map(distRow).join('') + '</div>' +
      '<div class="traffic-foot"><span>Ø <b>' + avgTxt + '</b> von 5</span><span>' + F.pct0(goodShare) + ' positiv</span></div>' +
    '</div>';

    return '<div class="charts-grid">' + left + right + '</div>';
  }

  /* --- Block 3: Liste „Bewertungen" ---------------------------------------------- */
  function reviewMatches(r, mode, starsFilter, q) {
    if (mode === 'open' && r.status !== 'open') return false;
    if (mode === 'kritisch' && r.stars > 3) return false;
    if (mode === 'answered' && r.status !== 'answered') return false;
    if (starsFilter && r.stars !== starsFilter) return false;
    if (q) {
      var hay = (r.text + ' ' + r.title + ' ' + r.product + ' ' + r.author).toLowerCase();
      if (hay.indexOf(q) < 0) return false;
    }
    return true;
  }

  function reviewRow(r) {
    var flag = r.status === 'open' ? '<span class="feed-flag warn">wartet auf dich</span>' : '';
    var replyHtml = r.reply
      ? '<div class="rv-reply"><div class="rv-reply-k">Antwort von Nordwind Studio · ' + F.esc(r.reply.at) + '</div>' + F.rich(r.reply.text) + '</div>'
      : '';
    var footHtml = r.status === 'open'
      ? '<div style="margin-top:8px;display:flex;gap:8px">' +
          (r.ticket
            ? '<button class="btn primary sm" data-act="openTicket" data-arg="' + r.ticket + '">Zum Fall im Kundenservice</button>'
            : '<button class="btn primary sm" data-act="openReview" data-arg="' + r.id + '">Entwurf ansehen &amp; senden</button>') +
        '</div>'
      : '';
    return '<div class="rv-row' + (r.status === 'open' ? ' open' : '') + '" data-act="openReview" data-arg="' + r.id + '">' +
      '<div class="rv-head">' + stars(r.stars) + '<span class="rv-title">' + F.esc(r.title) + '</span>' + flag +
        '<span class="rv-meta">' + F.esc(r.author) + ' · ' + F.esc(r.when) + '</span>' +
      '</div>' +
      '<div class="rv-text">' + F.esc(r.text) + '</div>' +
      '<div class="rv-prod">' +
        '<span data-act="openDesign" data-arg="' + r.design + '" style="display:inline-flex;align-items:center;gap:6px">' +
          designSquare(r.design, 18) + '<span>' + F.esc(r.product) + '</span>' +
        '</span>' + ticketChipFor(r) +
      '</div>' +
      replyHtml + footHtml +
    '</div>';
  }

  function renderListSection(S, rv) {
    var mode = S.filters.rvFilter || 'all';
    var starsFilter = S.filters.rvStars || null;
    var qRaw = S.forms['rv.q'] || '';
    var q = qRaw.trim().toLowerCase();

    var list = S.reviews.filter(function (r) { return reviewMatches(r, mode, starsFilter, q); });
    list = list.slice().sort(function (a, b) {
      var ao = a.status === 'open' ? 0 : 1, bo = b.status === 'open' ? 0 : 1;
      if (ao !== bo) return ao - bo;
      return whenTs(b.when) - whenTs(a.when);
    });

    var limit = S.filters.rvLimit || 20;
    var shown = list.slice(0, limit);
    var answeredTotal = S.reviews.filter(function (r) { return r.status === 'answered'; }).length;

    var segDefs = [
      { key: 'all', label: 'Alle', count: rv.total },
      { key: 'open', label: 'Offen', count: rv.open },
      { key: 'kritisch', label: 'Kritisch (1–3★)', count: rv.kritisch },
      { key: 'answered', label: 'Beantwortet', count: answeredTotal }
    ];
    var segHtml = '<div class="seg">' + segDefs.map(function (s) {
      return '<button class="' + (mode === s.key ? 'on' : '') + '" data-act="rv.filter" data-arg="' + s.key + '">' + s.label + ' (' + F.num(s.count) + ')</button>';
    }).join('') + '</div>';
    var starsTag = starsFilter
      ? '<span class="tag">' + starsFilter + ' ★ <span data-act="rv.filterStars" data-arg="" title="Filter entfernen">✕</span></span>'
      : '';

    var listHtml;
    if (!shown.length) {
      listHtml = '<div class="empty sm"><div class="empty-t">Keine Bewertungen gefunden</div>Versuch andere Filter oder eine andere Suche.<br>' +
        '<button class="btn ghost sm" data-act="rv.clear" style="margin-top:8px">Filter zurücksetzen</button></div>';
    } else {
      listHtml = shown.map(reviewRow).join('');
    }

    var footHtml = '';
    if (list.length) {
      var answeredInList = list.filter(function (r) { return r.status === 'answered'; }).length;
      footHtml = '<div class="card-foot"><span>gezeigt <b>' + F.num(shown.length) + '</b> von <b>' + F.num(list.length) + '</b> Bewertungen</span>' +
        (shown.length < list.length
          ? '<button class="btn ghost sm" data-act="rv.more">Weitere zeigen</button>'
          : '<span>Emma hat <b>' + F.num(answeredInList) + '</b> davon selbst beantwortet</span>') +
      '</div>';
    }

    return '<div class="section-head">' +
        '<div><div class="section-title">Bewertungen</div><div class="section-sub">Neueste zuerst · von Emma betreut</div></div>' +
        '<div class="section-action"><span class="search-in">' + SEARCH_ICON +
          '<input data-model="rv.q" data-live="1" data-focus-key="rv.q" value="' + F.esc(qRaw) + '" placeholder="Text, Produkt oder Name suchen …"></span></div>' +
      '</div>' +
      '<div class="chip-row" style="margin-bottom:10px">' + segHtml + starsTag + '</div>' +
      '<div class="card">' + listHtml + footHtml + '</div>';
  }

  /* --- Block 5: „Was die Kritik dir sagt" (Render-Teil) -------------------------- */
  function critRow(label, count, total, color) {
    var pct = total ? Math.round((count / total) * 100) : 0;
    return '<div class="traffic-row">' +
      '<div class="traffic-name">' + label + '</div>' +
      '<div class="traffic-bar"><i style="width:' + pct + '%;background:' + color + '"></i></div>' +
      '<div class="traffic-val">' + F.num(count) + ' · ' + pct + '%</div>' +
    '</div>';
  }

  function proposalItem(key, title, hint, S, first) {
    var st = first ? '' : ' style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border-soft)"';
    var done = !!(S.filters.rvRuns && S.filters.rvRuns[key]);
    var action = done
      ? '<span class="feed-flag ok">erledigt</span>'
      : '<button class="btn primary sm" data-act="rv.run" data-arg="' + key + '">Starten</button>';
    return '<div' + st + '>' +
      '<div style="font-weight:600;font-size:13.5px">' + F.esc(title) + '</div>' +
      '<div class="hint" style="margin-top:2px">' + F.esc(hint) + '</div>' +
      '<div style="margin-top:8px">' + action + '</div>' +
    '</div>';
  }

  function renderCritSection(S) {
    var ida = DEMO.agent('ida');
    var kritischList = S.reviews.filter(function (r) { return r.stars <= 3; });
    var withTicket = kritischList.filter(function (r) { return !!r.ticket; }).length;
    var withoutTicket = kritischList.length - withTicket;

    var left = '<div class="card">' +
      '<div class="card-pad">' +
        '<div class="traffic">' +
          critRow('Versand/Fehldruck', withTicket, kritischList.length, DIST_COLORS[1]) +
          critRow('Produkt-/Erwartungsthema', withoutTicket, kritischList.length, DIST_COLORS[3]) +
        '</div>' +
        '<div class="ag-now" style="margin-top:10px"><span class="agent-avatar sm" style="background:' + ida.color + '">' + ida.initials + '</span>' +
          '<span><b>' + F.num(withoutTicket) + ' von ' + F.num(kritischList.length) + '</b> kritischen Bewertungen hängen an keinem Versand- oder Druckfall — es geht um Pflegehinweise und Erwartungen ans Format, nicht ums Motiv. Das lässt sich mit einer Zeile auf der Produktseite lösen, kein Rabatt nötig.</span>' +
        '</div>' +
      '</div>' +
      '<div class="card-foot"><button class="btn ghost sm" data-act="askAgent" data-arg="ida">Ida fragen</button></div>' +
    '</div>';

    var right = '<div class="card card-pad">' +
      '<div style="font-weight:600;font-size:13.5px;margin-bottom:10px">Was daraus folgt</div>' +
      proposalItem('pflege', 'Pflegehinweis auf allen Textil-Produktseiten größer setzen',
        'Betrifft die Kritik ohne Versand- oder Druckfall — bislang steht der Hinweis nur klein auf der Seite.', S, true) +
      proposalItem('bitte', 'Bewertungs-Erinnerung an zufriedene Kunden',
        'Fragt Kunden 14 Tage nach Lieferung automatisch nach einer Bewertung.', S, false) +
    '</div>';

    return '<div class="section-head"><div><div class="section-title">Was die Kritik dir sagt</div><div class="section-sub">Von Ida ausgewertet · letzte 90 Tage</div></div></div>' +
      '<div class="duo-grid">' + left + right + '</div>';
  }

  /* --- Registrierung als Ebene „reviews" des Sichtbarkeits-Reiters ---------------- */
  window.SICHT = window.SICHT || {};
  window.SICHT.reviews = {
    render: function (S) {
      var rv = DEMO.reviewStats();
      return renderNotices(rv) + renderChartsGrid(rv) + renderListSection(S, rv) + renderCritSection(S);
    }
  };

  /* --- Block 4: openReview-Drawer (exklusiv, global) ------------------------------ */
  A['openReview'] = function (id) {
    var r = DEMO.review(id);
    if (!r) return;

    var body = '<div class="rating-hero">' + stars(r.stars, true) + '<span class="stat-sub">' + r.stars + ' von 5 Sternen</span></div>' +
      '<div class="excerpt">' + F.esc(r.text) + '</div>' +
      '<div class="rv-prod">' + designSquare(r.design, 18) + '<span>' + F.esc(r.product) + '</span>' +
        '<button class="btn ghost sm" style="margin-left:auto" data-act="openDesign" data-arg="' + r.design + '">Design ansehen</button>' +
      '</div>';

    if (r.ticket) {
      body += notice('warn', 'Derselbe Kunde hat sich auch direkt gemeldet.',
        '<button class="btn ghost sm" data-act="openTicket" data-arg="' + r.ticket + '">Anfrage öffnen</button>');
      var appr = openApprovalForTicket(r.ticket);
      if (appr) {
        body += notice('info', 'Dazu liegt eine Freigabe: <b>' + F.esc(appr.title) + '</b> — Antwort und Kulanz gehören zusammen.',
          '<button class="btn ghost sm" data-act="openApproval" data-arg="' + appr.id + '">Freigabe ansehen</button>');
      }
    }

    var foot;
    if (r.status === 'answered') {
      body += '<h4 class="drawer-h">Antwort</h4>' +
        '<div class="rv-reply"><div class="rv-reply-k">Antwort von Nordwind Studio · ' + F.esc(r.reply.at) + '</div>' + F.rich(r.reply.text) + '</div>';
      foot = '<button class="btn ghost" data-act="closeDrawer">Schließen</button>' +
             '<button class="btn ghost" data-act="askAgent" data-arg="emma">Emma fragen</button>';
    } else if (r.status === 'open' && r.ticket) {
      // Bearbeitet wird im Kundenservice — hier ist die Auswertung, dort die Arbeit.
      // Zwei Editoren für denselben Vorgang wären genau das Gesplitte, das stört.
      var tkOpen = DEMO.ticket(r.ticket);
      body += notice('warn',
        'Diese Bewertung läuft als <b>Fall ' + (tkOpen ? F.esc(tkOpen.no) : '') + '</b> im Kundenservice — ' +
        'Emmas Antwortentwurf und die Kulanz-Entscheidung liegen dort.');
      foot = '<button class="btn ghost" data-act="closeDrawer">Schließen</button>' +
             '<button class="btn primary" data-act="openTicket" data-arg="' + r.ticket + '">Fall öffnen</button>';
    } else if (r.status === 'open') {
      ST.forms['rv.reply.' + id] = r.draft;
      body += '<h4 class="drawer-h">Emmas Antwortentwurf</h4>' +
        notice('warn', draftWarnText(r)) +
        '<textarea class="field" rows="9" data-model="rv.reply.' + id + '">' + F.esc(r.draft) + '</textarea>' +
        '<p class="hint">Du kannst den Text ändern, bevor er öffentlich unter der Bewertung steht.</p>';
      foot = '<button class="btn ghost" data-act="closeDrawer">Schließen</button>' +
             '<button class="btn primary" data-act="rv.send" data-arg="' + id + '">Antwort veröffentlichen</button>';
    } else {
      foot = '<button class="btn ghost" data-act="closeDrawer">Schließen</button>';
    }

    U.drawer({
      title: F.esc(r.title),
      sub: F.esc(r.author) + ' · ' + F.esc(r.when) + ' · ' + F.esc(r.source),
      wide: true,
      body: body,
      foot: foot
    });
  };

  A['rv.send'] = function (id) {
    var r = DEMO.review(id);
    if (!r) return;
    var text = (ST.forms['rv.reply.' + id] || '').trim();
    if (!text) { U.toast('Die Antwort ist leer', 'warn'); return; }

    var appr = r.ticket ? openApprovalForTicket(r.ticket) : null;
    r.reply = { text: text, at: 'gerade eben' };
    r.status = 'answered';
    r.draft = null;
    U.closeDrawer();
    U.toast('Antwort veröffentlicht');
    DEMO.pushFeed('emma', '<b>Emma</b> hat öffentlich auf die <b>' + r.stars + '-Sterne-Bewertung</b> von ' + F.esc(r.author) + ' geantwortet.',
      { type: 'ok', text: 'Erledigt' }, 'NOR-51');
    if (appr) {
      // Ehrlich: die öffentliche Antwort ist gesendet, die Kulanz (Neudruck/Ersatz) hängt noch an der Freigabe.
      DEMO.pushFeed('emma', 'Hinweis: <b>' + F.esc(appr.title) + '</b> ist damit noch nicht ausgelöst — die Kulanz liegt weiter bei dir zur Freigabe.',
        { type: 'warn', text: 'Wartet' }, 'NOR-51');
    }
    DEMO.render();
  };

  /* --- Block 5: Idas Aktionen ------------------------------------------------------ */
  A['rv.run'] = function (key) {
    if (!ST.filters.rvRuns) ST.filters.rvRuns = {};
    if (ST.filters.rvRuns[key]) return;

    if (key === 'pflege') {
      U.run({
        agent: 'ida', title: 'Produktseiten anpassen',
        steps: [
          { text: 'Kritische Bewertungen nach Ursache sortieren', ms: 800 },
          { text: 'Betroffene Produktseiten bestimmen', ms: 700 },
          { text: 'Textvorschlag für den Pflegehinweis schreiben', ms: 900 }
        ],
        done: { text: 'Ein Textvorschlag für den Pflegehinweis liegt jetzt als Task bei Theo — an den Bewertungen selbst ändert das nichts.', cta: 'Alles klar', act: 'closeModal' },
        onDone: function () {
          ST.filters.rvRuns.pflege = true;
          DEMO.pushFeed('ida', '<b>Ida</b> hat einen Textvorschlag für den Pflegehinweis auf den Textil-Produktseiten geschrieben — liegt als Task bei Theo.', { type: 'ok', text: 'Vorschlag' }, 'NOR-65');
          U.toast('Textvorschlag liegt bei Theo');
          if (ST.tab === 'sichtbarkeit') DEMO.render();
        }
      });
    } else if (key === 'bitte') {
      U.run({
        agent: 'emma', title: 'Bewertungs-Erinnerung einrichten',
        steps: [
          { text: 'Kunden mit abgeschlossener Bestellung seit 14 Tagen finden', ms: 700 },
          { text: 'Erinnerungstext schreiben', ms: 800 },
          { text: 'Automatischen Versand einrichten', ms: 700 }
        ],
        done: { text: 'Emma bittet ab jetzt 14 Tage nach Lieferung automatisch um eine Bewertung — das hebt erfahrungsgemäß die Menge, nicht den Schnitt.', cta: 'Alles klar', act: 'closeModal' },
        onDone: function () {
          ST.filters.rvRuns.bitte = true;
          DEMO.pushFeed('emma', '<b>Emma</b> bittet zufriedene Kunden jetzt automatisch nach 14 Tagen um eine Bewertung.', { type: 'ok', text: 'Eingerichtet' }, 'NOR-51');
          U.toast('Erinnerung eingerichtet');
          if (ST.tab === 'sichtbarkeit') DEMO.render();
        }
      });
    }
  };

  /* --- Filter- und Such-Aktionen --------------------------------------------------- */
  A['rv.first'] = function () {
    var rv = DEMO.reviewStats();
    if (rv.openList.length) A['openReview'](rv.openList[0].id);
    else U.toast('Nichts offen — Emma hat alle beantwortet');
  };
  A['rv.filter'] = function (mode) {
    ST.filters.rvFilter = mode;
    ST.filters.rvLimit = 20;
    DEMO.render();
  };
  A['rv.filterStars'] = function (arg) {
    var n = arg ? parseInt(arg, 10) : null;
    ST.filters.rvStars = (n && ST.filters.rvStars !== n) ? n : null;
    ST.filters.rvLimit = 20;
    DEMO.render();
  };
  A['rv.clear'] = function () {
    ST.filters.rvFilter = 'all';
    ST.filters.rvStars = null;
    ST.filters.rvLimit = 20;
    ST.forms['rv.q'] = '';
    DEMO.render();
  };
  A['rv.more'] = function () {
    ST.filters.rvLimit = (ST.filters.rvLimit || 20) + 20;
    DEMO.render();
  };
})();

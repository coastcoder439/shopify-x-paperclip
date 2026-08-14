/* ============================================================================
   View „Kundenservice" — Emma beantwortet Standardfälle, eskaliert alles,
   was Geld kostet oder unklar ist. Diese View zeigt beides: die Bilanz der
   letzten 7 Tage und die einzelnen Fälle, inkl. Emmas Antwortentwürfe.
   ========================================================================== */
(function () {
  'use strict';
  var A = DEMO.actions, F = DEMO.fmt, D = DEMO.data, U = DEMO.ui;

  /* --- Kleine Helfer -------------------------------------------------------- */

  // Wandelt die Zeit-Strings der Demo ("Heute 08:12", "Gestern 16:22",
  // "05.07. 14:20") in einen vergleichbaren Zeitstempel — fürs Sortieren.
  function parseWhen(w) {
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
    if (m) {
      return new Date(2026, parseInt(m[2], 10) - 1, parseInt(m[1], 10), parseInt(m[3], 10), parseInt(m[4], 10)).getTime();
    }
    return 0;
  }

  function noticeIcon(kind) {
    if (kind === 'warn') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 8v5"/><path d="M12 16.5v.01"/><circle cx="12" cy="12" r="9"/></svg>';
    if (kind === 'ok') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/></svg>';
  }
  function notice(kind, bodyHtml, actHtml) {
    return '<div class="notice ' + kind + '">' + noticeIcon(kind) + '<span>' + bodyHtml + '</span>' +
      (actHtml ? '<span class="notice-act">' + actHtml + '</span>' : '') + '</div>';
  }

  // Die eine offene Freigabe, die zu diesem Ticket gehört (falls vorhanden).
  function openApprovalFor(id) {
    return DEMO.state.approvals.filter(function (a) {
      return a.kind === 'support' && a.ticketId === id && a.status === 'open';
    })[0];
  }

  // Warum Emma diese Antwort nicht selbst abschickt — aus dem jeweiligen Fall
  // abgeleitet, keine neuen Zahlen erfunden.
  function draftWarnText(t) {
    if (t.id === 'tk1') return 'Die Antwort sagt einen kostenlosen <b>Neudruck</b> zu — das kostet Geld, das darf Emma nicht allein zusagen.';
    if (t.id === 'tk2') return 'Die Antwort sagt eine kostenlose <b>Ersatzsendung</b> zu — auch das kostet Geld, das liegt außerhalb von Emmas Rechten.';
    return 'Diese Antwort löst Kosten aus, die Emma nicht allein freigeben darf.';
  }

  function sortIndicator(S, key) {
    var s = S.sort.tk;
    if (!s || s.key !== key) return '';
    return '<span class="sort-ar">' + (s.dir === 'asc' ? '▲' : '▼') + '</span>';
  }

  /* --- Block 1: Kopfzeile ---------------------------------------------------- */
  function blockNotices(S, ts) {
    var html = notice('info',
      '<b>Emma</b> beantwortet Standardfälle selbst und eskaliert alles, was Geld kostet oder unklar ist — sie läuft auf einem lokalen Modell und kostet nichts.',
      '<button class="btn ghost sm" data-act="openAgent" data-arg="emma">Emma ansehen</button>');
    if (ts.open > 0) {
      html += notice('warn',
        '<b>' + ts.open + '</b> Fälle warten auf dich.',
        '<button class="btn primary sm" data-act="su.first">Ersten öffnen</button>');
    }
    // Kritische Bewertungen SIND Fälle: Emma legt sie automatisch als Vorgang an
    // (Kanal „Bewertung“) — eine Arbeitsliste, kein zweiter Ort. Die Auswertung
    // (Schnitt, Verteilung, Muster) bleibt unter Sichtbarkeit → Bewertungen.
    var rvFaelle = S.tickets.filter(function (t) { return t.channel === 'Bewertung'; }).length;
    if (rvFaelle > 0) {
      html += notice('info',
        'Kritische Bewertungen legt Emma automatisch als Fall an — Kanal <b>„Bewertung“</b>, ' +
        'unten in der Liste. Die Antwort erscheint öffentlich unter der Bewertung.',
        '<button class="btn ghost sm" data-act="sicht.go" data-arg="reviews">Zur Auswertung</button>');
    }
    return html;
  }

  /* --- Block 2: KPI-Kacheln --------------------------------------------------- */
  function blockKpis(S, ts) {
    var src = '<span class="kpi-src"><svg viewBox="0 0 24 24" fill="none" stroke="#8B8B8B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L3 21l1.6-5.4A8.5 8.5 0 1 1 21 12Z"/></svg></span>';
    function card(link, arg, label, value, vs) {
      return '<div class="card kpi' + (link ? ' link' : '') + '"' + (link ? ' data-act="su.filter" data-arg="' + arg + '"' : '') + '>' +
        '<div class="kpi-label">' + label + src + '</div>' +
        '<div class="kpi-value">' + value + '</div>' +
        '<div class="kpi-trend"><span class="vs">' + vs + '</span></div>' +
      '</div>';
    }
    return '<div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">' +
      card(true, 'solved', 'Automatisch gelöst', F.pct0(ts.rate), ts.solved + ' von ' + ts.total + ' Anfragen') +
      card(true, 'all', 'Anfragen', F.num(ts.total), 'letzte 7 Tage') +
      card(false, '', 'Ø Erstantwort', D.fixed.firstReply, 'von Emma') +
      card(false, '', 'Zufriedenheit', D.fixed.satisfaction, 'aus ' + ts.solved + ' Bewertungen') +
    '</div>';
  }

  /* --- Block 3: Themen + Emmas Grenzen ---------------------------------------- */
  function blockTopics(S, ts) {
    var counts = {};
    D.topics.forEach(function (t) { counts[t.key] = 0; });
    S.tickets.forEach(function (t) { if (counts.hasOwnProperty(t.topic)) counts[t.topic]++; });
    var rows = D.topics.map(function (t) {
      var n = counts[t.key] || 0;
      var pct = ts.total ? Math.round((n / ts.total) * 100) : 0;
      return '<div class="traffic-row" data-act="su.topic" data-arg="' + F.esc(t.key) + '">' +
        '<span class="traffic-name">' + F.esc(t.key) + '</span>' +
        '<span class="traffic-bar"><i style="width:' + pct + '%;background:' + t.color + '"></i></span>' +
        '<span class="traffic-val">' + n + ' · ' + pct + '%</span>' +
      '</div>';
    }).join('');
    return '<div class="card">' +
      '<div class="card-head"><span class="card-title">Worum es geht</span><span class="card-title-note">letzte 7 Tage · nach Thema</span></div>' +
      '<div class="traffic">' + rows + '</div>' +
      '<div class="traffic-foot"><span><b>' + ts.total + '</b> Anfragen gesamt</span><span><b>' + ts.solved + '</b> ohne dich gelöst</span></div>' +
    '</div>';
  }

  function blockEmmaLimits() {
    var emma = DEMO.agent('emma');
    return '<div class="card">' +
      '<div class="card-head"><span class="card-title">Was Emma darf — und was nicht</span></div>' +
      '<div class="card-pad">' +
        '<h4 class="drawer-h">Erledigt sie allein</h4><ul class="tick-list">' +
          emma.skills.map(function (s) { return '<li>' + F.esc(s) + '</li>'; }).join('') + '</ul>' +
        '<h4 class="drawer-h">Fragt immer nach</h4><ul class="tick-list lock">' +
          emma.permissions.map(function (s) { return '<li>' + F.esc(s) + '</li>'; }).join('') + '</ul>' +
        '<p class="hint">Deshalb liegen genau die Fälle bei dir, in denen es um Geld geht.</p>' +
      '</div>' +
    '</div>';
  }

  /* --- Block 4: Tabelle „Anfragen" -------------------------------------------- */
  function blockRequests(S, ts) {
    var status = S.filters.suStatus || 'all';
    var topic = S.filters.suTopic || null;
    var limit = S.filters.suLimit || 25;
    var q = (S.forms['su.q'] || '').trim().toLowerCase();

    var list = S.tickets.filter(function (t) {
      if (status === 'open' && t.status !== 'escalated') return false;
      if (status === 'solved' && t.status !== 'solved') return false;
      if (topic && t.topic !== topic) return false;
      if (q) {
        var hay = (t.customer + ' ' + t.subject + ' ' + t.no).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });

    var srt = S.sort.tk;
    var sorted = list.slice();
    if (srt) {
      sorted.sort(function (a, b) {
        var av, bv;
        if (srt.key === 'no') { av = parseInt(a.no.replace('#', ''), 10); bv = parseInt(b.no.replace('#', ''), 10); }
        else if (srt.key === 'when') { av = parseWhen(a.when); bv = parseWhen(b.when); }
        else { av = String(a[srt.key] || '').toLowerCase(); bv = String(b[srt.key] || '').toLowerCase(); }
        if (av < bv) return srt.dir === 'asc' ? -1 : 1;
        if (av > bv) return srt.dir === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      sorted.sort(function (a, b) {
        var ao = a.status === 'escalated' ? 0 : 1, bo = b.status === 'escalated' ? 0 : 1;
        if (ao !== bo) return ao - bo;
        return parseWhen(b.when) - parseWhen(a.when);
      });
    }

    var shown = sorted.slice(0, limit);

    function segBtn(val, label, count) {
      return '<button' + (status === val ? ' class="on"' : '') + ' data-act="su.filter" data-arg="' + val + '">' + label + ' (' + count + ')</button>';
    }
    var segHtml = '<div class="seg">' + segBtn('all', 'Alle', ts.total) + segBtn('open', 'Offen', ts.open) + segBtn('solved', 'Gelöst', ts.solved) + '</div>';
    var topicTag = topic ? '<span class="tag">' + F.esc(topic) + ' <span data-act="su.topic" data-arg="" title="Filter entfernen">✕</span></span>' : '';

    var theadHtml = '<tr>' +
      '<th class="sortable" data-act="sort" data-arg="tk|no">Anfrage' + sortIndicator(S, 'no') + '</th>' +
      '<th class="sortable" data-act="sort" data-arg="tk|customer">Kunde' + sortIndicator(S, 'customer') + '</th>' +
      '<th class="sortable" data-act="sort" data-arg="tk|topic">Thema' + sortIndicator(S, 'topic') + '</th>' +
      '<th>Kanal</th>' +
      '<th class="sortable" data-act="sort" data-arg="tk|when">Zeit' + sortIndicator(S, 'when') + '</th>' +
      '<th>Status</th>' +
    '</tr>';

    var bodyHtml, footHtml;
    if (!shown.length) {
      bodyHtml = '<tr><td colspan="6"><div class="empty sm"><div class="empty-t">Keine Treffer</div>Versuch andere Filter oder eine andere Suche.<br>' +
        '<button class="btn ghost sm" data-act="su.clear" style="margin-top:8px">Filter zurücksetzen</button></div></td></tr>';
      footHtml = '';
    } else {
      bodyHtml = shown.map(function (t) {
        var pill = t.status === 'escalated'
          ? '<span class="pill scheduled"><span class="p-dot"></span>bei dir</span>'
          : '<span class="pill idle"><span class="p-dot"></span>gelöst</span>';
        return '<tr class="row-link" data-act="openTicket" data-arg="' + t.id + '">' +
          '<td><span class="mono">' + F.esc(t.no) + '</span><div class="hint">' + F.esc(t.subject) + '</div></td>' +
          '<td>' + F.esc(t.customer) + '</td>' +
          '<td><span class="tag">' + F.esc(t.topic) + '</span></td>' +
          '<td><span class="hint">' + F.esc(t.channel) + '</span></td>' +
          '<td><span class="mono" style="font-size:11px">' + F.esc(t.when) + '</span></td>' +
          '<td>' + pill + '</td>' +
        '</tr>';
      }).join('');
      footHtml = '<div class="card-foot"><span>gezeigt <b>' + shown.length + '</b> von <b>' + sorted.length + '</b> Anfragen</span>' +
        (shown.length < sorted.length
          ? '<button class="btn ghost sm" data-act="su.more">Weitere zeigen</button>'
          : '<span>Emma hat davon <b>' + ts.solved + '</b> allein gelöst</span>') +
        '</div>';
    }

    return '<div class="section-head">' +
        '<div><div class="section-title">Anfragen</div><div class="section-sub">Jede Zeile ist ein echtes Gespräch — klick sie an</div></div>' +
        '<div class="section-action"><span class="search-in">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
          '<input data-model="su.q" data-live="1" data-focus-key="su.q" placeholder="Kunde, Betreff oder Nummer suchen …" value="' + F.esc(S.forms['su.q'] || '') + '">' +
        '</span></div>' +
      '</div>' +
      '<div class="chip-row" style="margin-bottom:10px">' + segHtml + topicTag + '</div>' +
      '<div class="card">' +
        '<table class="products"><thead>' + theadHtml + '</thead><tbody>' + bodyHtml + '</tbody></table>' +
        footHtml +
      '</div>';
  }

  /* --- Block 6: Section „Emma" ------------------------------------------------ */
  function blockEmmaSection(S, ts) {
    var emma = DEMO.agent('emma');
    return '<div class="section-head"><div><div class="section-title">Emma</div><div class="section-sub">Der günstigste Agent im Team</div></div></div>' +
      '<div class="card">' +
        '<div class="card-pad" style="display:flex;gap:28px;flex-wrap:wrap;align-items:flex-start">' +
          '<div><div class="stat-big">' + F.eur(emma.costMonth) + '</div><div class="stat-sub">Kosten im Monat — lokales Modell auf deinem Server</div></div>' +
          '<div style="flex:1;min-width:220px">' +
            '<div class="kv-row"><span class="kv-k">Modell</span><span class="kv-v">' + F.esc(emma.model) + '</span></div>' +
            '<div class="kv-row"><span class="kv-k">Zeit gespart</span><span class="kv-v">' + emma.hoursSaved + ' Std./Monat</span></div>' +
            '<div class="kv-row"><span class="kv-k">Gelöst ohne dich</span><span class="kv-v">' + F.pct0(ts.rate) + '</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="card-foot">' +
          '<button class="btn ghost sm" data-act="openAgent" data-arg="emma">Emmas Profil</button>' +
          '<button class="btn ghost sm" data-act="askAgent" data-arg="otto">Otto fragen</button>' +
        '</div>' +
      '</div>';
  }

  /* --- View-Registrierung ----------------------------------------------------- */
  DEMO.views.support = {
    render: function (S) {
      var ts = DEMO.ticketStats();
      return blockNotices(S, ts) +
        blockKpis(S, ts) +
        '<div class="charts-grid">' + blockTopics(S, ts) + blockEmmaLimits() + '</div>' +
        blockRequests(S, ts) +
        blockEmmaSection(S, ts);
    },
    mount: function (root, S) { void root; void S; }
  };

  /* --- Block 5: Ticket-Drawer (exklusive globale Action) ----------------------- */
  A['openTicket'] = function (id) {
    var t = DEMO.ticket(id);
    if (!t) return;

    var body = '<div class="drawer-grid">' +
      '<div class="mini"><div class="mini-k">Thema</div><div class="mini-v">' + F.esc(t.topic) + '</div></div>' +
      '<div class="mini"><div class="mini-k">Kanal</div><div class="mini-v">' + F.esc(t.channel) + '</div></div>' +
      '<div class="mini"><div class="mini-k">Bestellung</div><div class="mini-v mono">' + (t.order ? F.esc(t.order) : '—') + '</div></div>' +
      '<div class="mini"><div class="mini-k">Status</div><div class="mini-v">' + (t.status === 'escalated' ? 'bei dir' : 'gelöst') + '</div></div>' +
    '</div>';

    if (t.design) {
      var dsg = DEMO.design(t.design);
      if (dsg) {
        body += '<div class="ag-now">' +
          '<span style="width:22px;height:22px;flex:none;border-radius:6px;background:linear-gradient(135deg,' + dsg.g1 + ',' + dsg.g2 + ')"></span>' +
          '<span>Betrifft <b>' + F.esc(dsg.name) + '</b></span>' +
          '<button class="btn ghost sm" style="margin-left:auto" data-act="openDesign" data-arg="' + t.design + '">Design ansehen</button>' +
        '</div>';
      }
    }

    // Hängt an diesem Fall eine öffentliche Bewertung, ist die Antwort keine Privatsache.
    var linkedRv = DEMO.state.reviews.filter(function (r) { return r.ticket === id; })[0];
    if (linkedRv) {
      body += notice(linkedRv.status === 'open' ? 'warn' : 'info',
        'Dieser Fall ist eine <b>öffentliche ' + linkedRv.stars + '-Sterne-Bewertung</b>' +
        (t.channel === 'Bewertung' ? ' — es gab nie eine Mail. Deine Antwort erscheint für alle sichtbar unter der Bewertung.'
                                   : ' — derselbe Kunde hat auch öffentlich bewertet.'),
        '<button class="btn ghost sm" data-act="openReview" data-arg="' + linkedRv.id + '">Bewertung ansehen</button>');
    }

    body += '<h4 class="drawer-h">Gesprächsverlauf</h4><div class="thread">' + DEMO.threadHtml(t) + '</div>';

    var foot;
    if (t.status === 'escalated' && t.draft) {
      if (DEMO.state.forms['su.reply.' + id] === undefined) DEMO.state.forms['su.reply.' + id] = t.draft;
      var replyVal = DEMO.state.forms['su.reply.' + id];
      var appr = openApprovalFor(id);

      body += '<h4 class="drawer-h">Emmas Antwortentwurf</h4>' +
        notice('warn', draftWarnText(t)) +
        '<textarea class="field" rows="9" data-model="su.reply.' + id + '">' + F.esc(replyVal) + '</textarea>' +
        '<p class="hint">Du kannst den Text ändern, bevor er rausgeht.</p>';

      if (appr) {
        body += notice('info',
          'Zu diesem Fall liegt außerdem eine Freigabe: <b>' + F.esc(appr.title) + '</b> — die Antwort und der Neudruck gehören zusammen.',
          '<button class="btn ghost sm" data-act="openApproval" data-arg="' + appr.id + '">Freigabe ansehen</button>');
      }
      foot = '<button class="btn ghost" data-act="closeDrawer">Schließen</button>' +
             '<button class="btn primary" data-act="su.send" data-arg="' + id + '">Antwort senden</button>';
    } else {
      foot = '<button class="btn ghost" data-act="closeDrawer">Schließen</button>' +
             '<button class="btn ghost" data-act="askAgent" data-arg="emma">Emma fragen</button>';
    }

    U.drawer({
      title: F.esc(t.subject),
      sub: F.esc(t.no) + ' · ' + F.esc(t.customer) + ' · ' + F.esc(t.channel) + ' · ' + F.esc(t.when),
      wide: true,
      body: body,
      foot: foot
    });
  };

  /* --- su.*-Aktionen ------------------------------------------------------------ */
  A['su.first'] = function () {
    var t = DEMO.state.tickets.filter(function (x) { return x.status === 'escalated'; })[0];
    if (t) A['openTicket'](t.id);
    else U.toast('Keine offenen Fälle mehr.');
  };

  A['su.filter'] = function (arg) {
    DEMO.state.filters.suStatus = arg;
    DEMO.state.filters.suLimit = 25;
    DEMO.render();
  };

  A['su.topic'] = function (arg) {
    var f = DEMO.state.filters;
    f.suTopic = (arg && f.suTopic !== arg) ? arg : null;
    f.suLimit = 25;
    DEMO.render();
  };

  A['su.more'] = function () {
    DEMO.state.filters.suLimit = (DEMO.state.filters.suLimit || 25) + 25;
    DEMO.render();
  };

  A['su.clear'] = function () {
    var f = DEMO.state.filters;
    f.suStatus = 'all'; f.suTopic = null; f.suLimit = 25;
    DEMO.state.forms['su.q'] = '';
    DEMO.render();
  };

  A['su.send'] = function (id) {
    var t = DEMO.ticket(id);
    if (!t) return;
    var text = (DEMO.state.forms['su.reply.' + id] || '').trim();
    if (!text) { U.toast('Die Antwort ist leer', 'warn'); return; }

    var appr = openApprovalFor(id);
    t.thread.push({ from: 'emma', at: 'gerade eben', text: text });
    t.status = 'solved';
    t.draft = null;
    // Fälle aus Bewertungen haben keinen Privatkanal — die Antwort geht öffentlich
    // unter die Bewertung, deshalb wird sie dort mitveröffentlicht.
    var rv = DEMO.state.reviews.filter(function (r) { return r.ticket === id && r.status === 'open'; })[0];
    if (rv && t.channel === 'Bewertung') {
      rv.reply = { text: text, at: 'gerade eben' };
      rv.status = 'answered';
      rv.draft = null;
    }
    U.closeDrawer();
    U.toast(t.channel === 'Bewertung'
      ? 'Antwort öffentlich unter der Bewertung veröffentlicht' + (appr ? ' — die Kulanz wartet noch auf deine Freigabe' : '')
      : 'Antwort an ' + F.esc(t.customer) + ' gesendet' + (appr ? ' — der Neudruck wartet noch auf deine Freigabe' : ''));
    DEMO.pushFeed('emma', '<b>Emma</b> hat deine Antwort ' +
      (t.channel === 'Bewertung' ? 'öffentlich unter der Bewertung von <b>' + F.esc(t.customer) + '</b> (' + F.esc(t.no) + ') veröffentlicht.'
                                 : 'an <b>' + F.esc(t.customer) + '</b> (' + F.esc(t.no) + ') gesendet.'),
      { type: 'ok', text: 'Erledigt' }, 'NOR-51');
    if (appr) {
      DEMO.pushFeed('emma', 'Hinweis: Die <b>Kulanz</b> für ' + F.esc(t.no) + ' ist damit noch nicht ausgelöst — dafür liegt die Freigabe <b>' + F.esc(appr.title) + '</b> noch bei dir.',
        { type: 'warn', text: 'Wartet' }, 'NOR-51');
    }
    DEMO.render();
  };
})();

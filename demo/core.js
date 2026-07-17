/* ============================================================================
   Demo-Engine — State, Router, Aktionen, UI-Primitive, Otto-Chat.
   Views registrieren sich unter DEMO.views[id] und liefern reine HTML-Strings.
   Interaktion läuft ausschließlich über data-act / data-model (Delegation),
   damit ein Re-Render keine Handler verliert.
   ========================================================================== */
(function () {
  'use strict';

  var D = window.DEMO_DATA;

  /* --- Formatierung ------------------------------------------------------- */
  var nf0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
  var nf1 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var nf2 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  var fmt = {
    num: function (n) { return nf0.format(Math.round(n)); },
    eur: function (n) { return nf0.format(Math.round(n)) + ' €'; },
    eur2: function (n) { return nf2.format(n) + ' €'; },
    // Beträge in der Buchhaltung: Vorzeichen erhalten, 2 Nachkommastellen
    eurSigned: function (n) { return (n > 0 ? '' : '−') + nf2.format(Math.abs(n)) + ' €'; },
    pct1: function (n) { return nf1.format(n) + ' %'; },
    pct0: function (n) { return nf0.format(Math.round(n)) + ' %'; },
    signPct: function (n) { return (n >= 0 ? '+' : '−') + nf1.format(Math.abs(n)) + ' %'; },
    signNum: function (n) { return (n >= 0 ? '+' : '−') + nf0.format(Math.abs(n)); },
    date: function (d) { return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear(); },
    dateShort: function (d) { return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.'; },
    monthName: function (m) { return ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][m]; },
    esc: function (s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    },
    // Sehr leichtes Markdown für Chat & Entwurfstexte: **fett**, Zeilenumbrüche
    rich: function (s) {
      return fmt.esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
    }
  };

  /* --- Kennzahlen (immer aus der Tagesserie berechnet) -------------------- */
  function metrics(n) {
    var cur = D.windowDays(n, 0), prev = D.windowDays(n, 1);
    var rev = D.sum(cur, 'revenue'), revP = D.sum(prev, 'revenue');
    var ses = D.sum(cur, 'sessions'), sesP = D.sum(prev, 'sessions');
    var ord = D.sum(cur, 'orders'), ordP = D.sum(prev, 'orders');
    var print = D.sum(cur, 'print'), fees = D.sum(cur, 'fees'), ads = D.sum(cur, 'ads');
    var gross = rev - print - fees;
    var grossP = revP - D.sum(prev, 'print') - D.sum(prev, 'fees');
    var software = D.fixed.software * (n / 30);
    var agentCost = D.agents.reduce(function (s, a) { return s + a.costMonth; }, 0) * (n / 30);
    var d = function (a, b) { return b ? ((a - b) / b) * 100 : 0; };
    return {
      days: n,
      revenue: rev, revenuePrev: revP, revenueDelta: d(rev, revP),
      sessions: ses, sessionsPrev: sesP, sessionsDelta: d(ses, sesP),
      orders: ord, ordersPrev: ordP, ordersDelta: d(ord, ordP),
      print: print, fees: fees, ads: ads, software: software, agentCost: agentCost,
      gross: gross, grossDelta: d(gross, grossP),
      margin: rev ? (gross / rev) * 100 : 0,
      operating: gross - ads - software - agentCost,
      aov: ord ? rev / ord : 0,
      conversion: ses ? (ord / ses) * 100 : 0
    };
  }

  // Monatsaggregation (Buchhaltung rechnet in Kalendermonaten, nicht in Fenstern)
  function monthDays(m) {
    return D.days.filter(function (d) { return d.date.getMonth() === m && d.date.getFullYear() === 2026; });
  }
  function monthSums(m) {
    var md = monthDays(m);
    var rev = D.sum(md, 'revenue'), print = D.sum(md, 'print'), fees = D.sum(md, 'fees'), ads = D.sum(md, 'ads');
    var software = D.fixed.software;
    var agentCost = D.agents.reduce(function (s, a) { return s + a.costMonth; }, 0);
    return {
      days: md.length, revenue: rev, orders: D.sum(md, 'orders'), sessions: D.sum(md, 'sessions'),
      print: print, fees: fees, ads: ads, software: software, agentCost: agentCost,
      gross: rev - print - fees, margin: rev ? ((rev - print - fees) / rev) * 100 : 0,
      operating: rev - print - fees - ads - software - agentCost,
      complete: m !== D.today.getMonth()
    };
  }
  // USt-VA: aus den Monatszahlen gerechnet, nichts behauptet. Brutto → netto → Zahllast.
  function ustvaNumbers(m) {
    var s = monthSums(m);
    var net = s.revenue / 1.19, vat = net * 0.19;
    var inputBase = (s.print + s.fees + s.ads + s.software) / 1.19;
    var inputVat = inputBase * 0.19;
    return { month: m, net: net, vat: vat, inputVat: inputVat, pay: vat - inputVat, gross: s.revenue };
  }

  function top10() { return D.keywords.filter(function (k) { return k.pos <= 10; }).length; }
  function top10Prev() { return D.keywords.filter(function (k) { return k.prev <= 10; }).length; }

  function ticketStats() {
    var t = state.tickets;
    var solved = t.filter(function (x) { return x.status === 'solved'; }).length;
    return { total: t.length, solved: solved, open: t.length - solved, rate: (solved / t.length) * 100 };
  }

  /* --- State -------------------------------------------------------------- */
  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  var state = {
    tab: 'uebersicht',
    range: 30,
    month: 6,                       // Buchhaltung: 6 = Juli
    approvals: D.approvals.map(function (a) { var c = Object.assign({}, a); c.status = 'open'; return c; }),
    feed: D.feed.slice(),
    designs: D.designs.map(function (x) { return Object.assign({}, x); }),
    drafts: D.drafts.map(function (x) { var c = Object.assign({}, x); c.status = 'draft'; return c; }),
    trends: D.trends.map(function (x) { return Object.assign({}, x); }),
    keywords: D.keywords.map(function (x) { return Object.assign({}, x); }),
    seoTasks: D.seoTasks.map(function (x) { return Object.assign({}, x); }),
    contentPlan: D.contentPlan.map(function (x) { return Object.assign({}, x); }),
    tickets: D.tickets.map(function (x) { return Object.assign({}, x); }),
    receiptOpen: 'open',            // der eine unzugeordnete Beleg
    ustva: 'draft',                 // draft | submitted
    feedExpanded: false,
    chat: { open: false, agent: 'otto', busy: false, messages: [] },
    forms: {},                      // data-model-Werte
    sort: {},                       // { designs: {key,dir}, keywords: {...} }
    filters: {},
    drawer: null,
    modal: null,
    liveIdx: 0,
    focusKey: null
  };

  /* --- Lookups ------------------------------------------------------------ */
  function agent(id) { return D.agents.filter(function (a) { return a.id === id; })[0]; }
  function design(id) { return state.designs.filter(function (d) { return d.id === id; })[0]; }
  function draft(id) { return state.drafts.filter(function (d) { return d.id === id; })[0]; }
  function trend(id) { return state.trends.filter(function (t) { return t.id === id; })[0]; }
  function ticket(id) { return state.tickets.filter(function (t) { return t.id === id; })[0]; }
  function approval(id) { return state.approvals.filter(function (a) { return a.id === id; })[0]; }
  function openApprovals() { return state.approvals.filter(function (a) { return a.status === 'open'; }); }

  /* --- Feed --------------------------------------------------------------- */
  function nowStamp() {
    var d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function pushFeed(agentId, text, flag, task) {
    state.feed.unshift({ id: 'x' + Math.random().toString(36).slice(2), agent: agentId, time: 'gerade eben',
      stamp: nowStamp(), flag: flag || null, task: task || null, text: text, fresh: true });
  }

  /* --- UI-Primitive -------------------------------------------------------- */
  var ui = {
    toast: function (text, kind) {
      var host = document.getElementById('toasts');
      var el = document.createElement('div');
      el.className = 'toast' + (kind ? ' ' + kind : '');
      el.innerHTML = '<span class="toast-ico">' + (kind === 'warn'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 8v5"/><path d="M12 16.5v.01"/><circle cx="12" cy="12" r="9"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>') +
        '</span><span class="toast-text">' + text + '</span>';
      host.appendChild(el);
      requestAnimationFrame(function () { el.classList.add('in'); });
      setTimeout(function () {
        el.classList.remove('in');
        setTimeout(function () { el.remove(); }, 260);
      }, 4200);
    },

    drawer: function (opts) {          // { title, sub, body, foot, wide }
      state.drawer = opts;
      renderDrawer();
    },
    closeDrawer: function () {
      var el = document.getElementById('drawer');
      if (!el.classList.contains('open')) return;
      el.classList.remove('open');
      document.getElementById('scrim').classList.remove('on');
      setTimeout(function () { state.drawer = null; el.innerHTML = ''; }, 220);
    },

    modal: function (opts) {           // { title, sub, body, foot, size }
      state.modal = opts;
      renderModal();
    },
    closeModal: function () {
      var el = document.getElementById('modal');
      if (!el.classList.contains('on')) return;
      el.classList.remove('on');
      setTimeout(function () { state.modal = null; el.innerHTML = ''; }, 200);
    },

    /* Agentenlauf: zeigt Schritte, die nacheinander abgehakt werden. */
    run: function (opts) {             // { agent, title, steps:[{text, ms}], done:{text, cta, act, arg} }
      var a = agent(opts.agent);
      var stepsHtml = opts.steps.map(function (s, i) {
        return '<div class="run-step" data-step="' + i + '">' +
                 '<span class="run-dot"><span class="run-spin"></span>' +
                   '<svg class="run-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>' +
                 '</span><span class="run-text">' + s.text + '</span>' +
               '</div>';
      }).join('');
      ui.modal({
        title: opts.title,
        sub: a.name + ' · ' + a.role,
        size: 'sm',
        body: '<div class="run-head"><span class="agent-avatar" style="background:' + a.color + '">' + a.initials + '</span>' +
                '<div><div class="run-agent">' + a.name + ' arbeitet</div><div class="run-model">' + a.model + ' · ' + a.runtime + '</div></div>' +
                '<span class="pill working" style="margin-left:auto"><span class="p-dot"></span>läuft</span></div>' +
              '<div class="run-steps">' + stepsHtml + '</div>' +
              '<div class="run-result" id="runResult"></div>',
        foot: '<button class="btn ghost" data-act="closeModal">Im Hintergrund laufen lassen</button>'
      });
      var i = 0;
      function step() {
        var el = document.querySelector('.run-step[data-step="' + i + '"]');
        if (!el) return;
        el.classList.add('active');
        setTimeout(function () {
          el.classList.remove('active');
          el.classList.add('done');
          i++;
          if (i < opts.steps.length) step();
          else finish();
        }, opts.steps[i].ms);
      }
      function finish() {
        var r = document.getElementById('runResult');
        if (!r) return;                                   // Modal wurde geschlossen
        r.innerHTML = '<div class="run-done"><span class="run-done-ico">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span>' +
            '<span>' + opts.done.text + '</span></div>';
        r.classList.add('on');
        var foot = document.querySelector('#modal .modal-foot');
        if (foot) {
          foot.innerHTML = '<button class="btn ghost" data-act="closeModal">Schließen</button>' +
            '<button class="btn primary" data-act="' + opts.done.act + '" data-arg="' + (opts.done.arg || '') + '">' + opts.done.cta + '</button>';
        }
        var badge = document.querySelector('#modal .pill');
        if (badge) { badge.className = 'pill idle'; badge.style.marginLeft = 'auto'; badge.innerHTML = '<span class="p-dot"></span>fertig'; }
        if (opts.onDone) opts.onDone();
      }
      setTimeout(step, 260);
    }
  };

  function renderDrawer() {
    var o = state.drawer, el = document.getElementById('drawer');
    if (!o) return;
    el.className = 'drawer' + (o.wide ? ' wide' : '');
    el.innerHTML =
      '<div class="drawer-head">' +
        '<div class="drawer-titles"><div class="drawer-title">' + o.title + '</div>' +
        (o.sub ? '<div class="drawer-sub">' + o.sub + '</div>' : '') + '</div>' +
        '<button class="icon-btn" data-act="closeDrawer" aria-label="Schließen">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="drawer-body">' + o.body + '</div>' +
      (o.foot ? '<div class="drawer-foot">' + o.foot + '</div>' : '');
    document.getElementById('scrim').classList.add('on');
    requestAnimationFrame(function () { el.classList.add('open'); });
  }

  function renderModal() {
    var o = state.modal, el = document.getElementById('modal');
    if (!o) return;
    el.innerHTML =
      '<div class="modal-box' + (o.size === 'sm' ? ' sm' : o.size === 'lg' ? ' lg' : '') + '">' +
        '<div class="modal-head">' +
          '<div><div class="modal-title">' + o.title + '</div>' + (o.sub ? '<div class="modal-sub">' + o.sub + '</div>' : '') + '</div>' +
          '<button class="icon-btn" data-act="closeModal" aria-label="Schließen">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="modal-body">' + o.body + '</div>' +
        (o.foot ? '<div class="modal-foot">' + o.foot + '</div>' : '') +
      '</div>';
    requestAnimationFrame(function () { el.classList.add('on'); });
  }

  /* --- Agenten-Drawer (global, aus jeder View erreichbar) ------------------ */
  function agentDrawer(id) {
    var a = agent(id);
    var m = metrics(30);
    var body =
      '<div class="ag-hero"><span class="agent-avatar lg" style="background:' + a.color + '">' + a.initials + '</span>' +
        '<div><div class="ag-name">' + a.name + '</div><div class="agent-role">' + a.role + '</div></div>' +
        '<span class="pill ' + a.status + '" style="margin-left:auto"><span class="p-dot"></span>' + (a.statusLabel || a.status) + '</span></div>' +
      '<div class="ag-now"><b>Gerade:</b> ' + a.now + ' <span class="task-ref" data-act="openTask" data-arg="' + a.task + '">' + a.task + '</span></div>' +
      '<div class="drawer-grid">' +
        '<div class="mini"><div class="mini-k">Modell</div><div class="mini-v mono">' + a.model + '</div></div>' +
        '<div class="mini"><div class="mini-k">Laufzeit</div><div class="mini-v mono">' + a.runtime + '</div></div>' +
        '<div class="mini"><div class="mini-k">Zugang</div><div class="mini-v">' + a.access + '</div></div>' +
        '<div class="mini"><div class="mini-k">Kosten im Juli</div><div class="mini-v">' + (a.costMonth ? fmt.eur2(a.costMonth) : 'kostenfrei') + '</div></div>' +
      '</div>' +
      '<h4 class="drawer-h">Was ' + a.name + ' kann</h4><ul class="tick-list">' +
        a.skills.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>' +
      '<h4 class="drawer-h">Rechte</h4><ul class="tick-list lock">' +
        a.permissions.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>' +
      '<h4 class="drawer-h">Letzte Läufe</h4><div class="runs">' +
        a.runs.map(function (r) {
          return '<div class="run-row"><span class="run-when mono">' + r.at + '</span>' +
                 '<span class="run-what">' + r.what + '<span class="run-res">' + r.result + '</span></span>' +
                 '<span class="run-tok mono">' + r.tokens + '</span></div>';
        }).join('') + '</div>' +
      '<div class="ag-saved">Hat dir diesen Monat rund <b>' + a.hoursSaved + ' Stunden</b> Arbeit abgenommen — bei Kosten von <b>' +
        (a.costMonth ? fmt.eur2(a.costMonth) : '0 €') + '</b>.</div>';
    ui.drawer({
      title: a.name, sub: a.title,
      body: body,
      foot: '<button class="btn ghost" data-act="closeDrawer">Schließen</button>' +
            '<button class="btn primary" data-act="askAgent" data-arg="' + a.id + '">' +
              '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L3 21l1.6-5.4A8.5 8.5 0 1 1 21 12Z"/></svg>' +
              ' Auftrag geben</button>'
    });
    void m;
  }

  /* --- Freigabe-Drawer ----------------------------------------------------- */
  function approvalDrawer(id) {
    var a = approval(id), by = agent(a.by);
    var extra = '';
    if (a.kind === 'designs') {
      extra = '<h4 class="drawer-h">Die vier Entwürfe</h4><div class="draft-strip">' +
        state.drafts.map(function (d) {
          return '<div class="draft-mini" data-act="openDraft" data-arg="' + d.id + '">' +
                   '<span class="draft-art" style="background:linear-gradient(135deg,' + d.g1 + ',' + d.g2 + ')">' + d.initials + '</span>' +
                   '<span class="draft-mini-name">' + d.name.replace('Nordic Trails · ', '') + '</span>' +
                 '</div>';
        }).join('') + '</div><p class="hint">Klick auf einen Entwurf zeigt Mockup, Listing-Text und Preis.</p>';
    } else if (a.kind === 'ustva') {
      var u = ustvaNumbers(5);
      extra = '<h4 class="drawer-h">Die Zahlen (Juni 2026)</h4>' +
        '<div class="guv"><div class="guv-row"><span>Umsätze netto</span><span class="amt">' + fmt.eur2(u.net) + '</span></div>' +
        '<div class="guv-row"><span>Umsatzsteuer 19 %</span><span class="amt">' + fmt.eur2(u.vat) + '</span></div>' +
        '<div class="guv-row"><span>Vorsteuer (Druck, Gebühren, Werbung, Software)</span><span class="amt">−' + fmt.eur2(u.inputVat) + '</span></div>' +
        '<div class="guv-row total"><span>Zahllast</span><span class="amt">' + fmt.eur2(u.pay) + '</span></div></div>' +
        '<p class="hint">Gerechnet aus ' + D.receipts[5].length + ' Belegen des Monats — jeder einzeln zugeordnet, nachprüfbar unter Buchhaltung.</p>';
    } else if (a.kind === 'content') {
      var c = state.contentPlan.filter(function (x) { return x.id === a.contentId; })[0];
      extra = '<h4 class="drawer-h">Leseprobe</h4><div class="excerpt">' + fmt.rich(c.excerpt) + '</div>' +
        '<div class="drawer-grid"><div class="mini"><div class="mini-k">Länge</div><div class="mini-v">' + c.words + ' Wörter</div></div>' +
        '<div class="mini"><div class="mini-k">Interne Links</div><div class="mini-v">' + c.links + '</div></div>' +
        '<div class="mini"><div class="mini-k">Zielkeyword</div><div class="mini-v">' + c.kw + '</div></div>' +
        '<div class="mini"><div class="mini-k">Suchvolumen</div><div class="mini-v">' + fmt.num(c.vol) + '/Monat</div></div></div>';
    } else if (a.kind === 'support') {
      var t = ticket(a.ticketId);
      extra = '<h4 class="drawer-h">Der Fall</h4><div class="thread">' + threadHtml(t) + '</div>';
    }
    var impact = a.impact
      ? '<div class="impact"><span class="impact-k">Erwartete Wirkung</span><span class="impact-v ' + (a.impact.revenue >= 0 ? 'up' : 'down') + '">' +
        (a.impact.revenue === 0 ? '—' : (a.impact.revenue > 0 ? '+' : '−') + fmt.eur2(Math.abs(a.impact.revenue))) +
        '</span><span class="impact-n">' + a.impact.note + '</span></div>' : '';

    ui.drawer({
      title: a.title, sub: 'Vorbereitet von ' + by.name + ' · ' + a.ago,
      wide: true,
      body: '<div class="chip-row"><span class="cat-chip">' + a.chip + '</span>' +
              '<span class="task-ref" data-act="openTask" data-arg="' + a.task + '">' + a.task + '</span></div>' +
            '<p class="lead">' + a.detail + '</p>' + impact + extra +
            '<div class="effect"><b>Wenn du freigibst:</b> ' + a.effect + '</div>',
      foot: '<button class="btn ghost" data-act="rejectStart" data-arg="' + a.id + '">Ablehnen</button>' +
            '<button class="btn primary" data-act="approve" data-arg="' + a.id + '">Freigeben</button>'
    });
  }

  function threadHtml(t) {
    return t.thread.map(function (m) {
      var internal = m.text.indexOf('[interne Notiz]') === 0;
      var text = internal ? m.text.replace('[interne Notiz] ', '') : m.text;
      var who = m.from === 'customer' ? t.customer : 'Emma';
      return '<div class="msg ' + (m.from === 'customer' ? 'them' : 'us') + (internal ? ' internal' : '') + '">' +
               '<div class="msg-meta">' + (internal ? 'Interne Notiz von Emma' : who) + ' · ' + m.at + '</div>' +
               '<div class="msg-body">' + fmt.rich(text) + '</div>' +
             '</div>';
    }).join('');
  }

  /* --- Aktionen ------------------------------------------------------------ */
  var actions = {
    setTab: function (id) {
      if (!DEMO.views[id]) return;
      state.tab = id;
      ui.closeDrawer();
      render();
      window.scrollTo(0, 0);
    },
    setRange: function (n) { state.range = parseInt(n, 10); render(); },
    // Klick auf die Fläche neben der Modal-Box schließt — Klicks in der Box nicht.
    modalScrim: function (_, el, ev) { if (ev.target.id === 'modal') ui.closeModal(); },
    rangeMenu: function (_, el) {
      var host = el.closest('.range-select');
      var open = host.classList.toggle('open');
      if (!open) return;
      var close = function (ev) {
        if (host.contains(ev.target)) return;
        host.classList.remove('open');
        document.removeEventListener('click', close, true);
      };
      setTimeout(function () { document.addEventListener('click', close, true); }, 0);
    },
    closeDrawer: function () { ui.closeDrawer(); },
    closeModal: function () { ui.closeModal(); },
    openAgent: function (id) { agentDrawer(id); },
    openApproval: function (id) { approvalDrawer(id); },

    approve: function (id) {
      var a = approval(id);
      if (!a || a.status !== 'open') return;
      a.status = 'approved';
      ui.closeDrawer(); ui.closeModal();

      if (a.kind === 'designs') {
        state.drafts.forEach(function (d) { d.status = 'live'; });
        // Aus jedem Entwurf wird ein Design — Umsatz startet bei 0, nichts wird behauptet.
        state.drafts.forEach(function (d, i) {
          state.designs.push({
            id: 'n' + i, name: d.name, sku: 'NW-DSN-0' + (26 + i), initials: d.initials,
            g1: d.g1, g2: d.g2, listings: d.products.length * 2, revenue30: 0, trend: 'flat',
            status: 'new', since: fmt.dateShort(D.today) + '2026', by: 'theo',
            note: 'gerade live gegangen — Mia schreibt die Metadaten', noteBy: 'mia',
            variants: d.products.slice()
          });
        });
        var t1 = trend('t1'); if (t1) t1.status = 'live';
        pushFeed('theo', '<b>24 Listings</b> aus „Nordic Trails“ sind <b>live</b> — Shopify hat alle Varianten übernommen.', { type: 'ok', text: 'Live' }, 'NOR-62');
        setTimeout(function () {
          pushFeed('mia', '<b>Mia</b> hat den Auftrag übernommen: Metadaten für die 24 neuen Listings — fertig in etwa 20 Minuten.', null, 'NOR-55');
          if (state.tab === 'uebersicht' || state.tab === 'design') render();
        }, 2600);
        ui.toast('4 Designs sind live — 24 Listings im Shop');
      } else if (a.kind === 'ustva') {
        state.ustva = 'submitted';
        pushFeed('karla', '<b>USt-Voranmeldung Juni</b> an ELSTER übermittelt — Zahllast <b>' + fmt.eur2(ustvaNumbers(5).pay) + '</b>, fällig zum 10.08. Übertragungsprotokoll liegt in den Artifacts.', { type: 'ok', text: 'Erledigt' }, 'NOR-49');
        ui.toast('USt-Voranmeldung übermittelt');
      } else if (a.kind === 'content') {
        var c = state.contentPlan.filter(function (x) { return x.id === a.contentId; })[0];
        if (c) c.status = 'live';
        pushFeed('mia', 'Blogartikel <b>„Die 10 schönsten Fernwanderwege“</b> ist live — URL zur Indexierung angemeldet. Wirkung aufs Ranking frühestens in 2–4 Wochen.', { type: 'ok', text: 'Live' }, 'NOR-55');
        ui.toast('Artikel veröffentlicht');
      } else if (a.kind === 'support') {
        var tk = ticket(a.ticketId);
        if (tk) {
          tk.status = 'solved';
          tk.thread.push({ from: 'emma', at: 'gerade eben', text: tk.draft });
          tk.draft = null;
        }
        pushFeed('emma', '<b>Emma</b> hat den Neudruck für <b>#1044</b> bei Printful ausgelöst und die Kundin informiert.', { type: 'ok', text: 'Erledigt' }, 'NOR-51');
        ui.toast('Neudruck ausgelöst, Kundin informiert');
      }
      render();
    },

    rejectStart: function (id) {
      var a = approval(id);
      ui.closeDrawer();
      ui.modal({
        title: 'Ablehnen', sub: a.title, size: 'sm',
        body: '<p class="lead">Sag kurz, warum — ' + agent(a.by).name + ' arbeitet damit weiter.</p>' +
              '<textarea class="field" rows="3" data-model="reject.' + id + '" placeholder="z. B. Preis zu niedrig, Motiv 2 gefällt mir nicht …"></textarea>' +
              '<div class="reason-chips">' +
                ['Preis passt nicht', 'Motiv überarbeiten', 'Timing falsch', 'Will ich selbst prüfen'].map(function (r) {
                  return '<button class="chip-btn" data-act="reasonChip" data-arg="' + id + '|' + r + '">' + r + '</button>';
                }).join('') + '</div>',
        foot: '<button class="btn ghost" data-act="closeModal">Zurück</button>' +
              '<button class="btn primary" data-act="rejectConfirm" data-arg="' + id + '">Ablehnen</button>'
      });
    },
    reasonChip: function (arg) {
      var p = arg.split('|'), id = p[0], text = p[1];
      state.forms['reject.' + id] = text;
      var f = document.querySelector('[data-model="reject.' + id + '"]');
      if (f) f.value = text;
    },
    rejectConfirm: function (id) {
      var a = approval(id);
      var reason = (state.forms['reject.' + id] || '').trim();
      a.status = 'rejected';
      ui.closeModal();
      var who = agent(a.by);
      pushFeed(a.by, '<b>' + who.name + '</b> hat deine Ablehnung übernommen' + (reason ? ': „' + fmt.esc(reason) + '“' : '') +
        ' — ' + (a.kind === 'designs' ? 'die Entwürfe bleiben als Vorlage liegen, ich warte auf deine Vorgabe.'
              : a.kind === 'content' ? 'der Artikel bleibt im Entwurf.'
              : a.kind === 'ustva' ? 'die Voranmeldung bleibt liegen — Frist ist der 10.08.'
              : 'ich habe der Kundin noch nicht geantwortet.'), { type: 'warn', text: 'Abgelehnt' }, a.task);
      ui.toast('Abgelehnt — ' + who.name + ' hat Bescheid', 'warn');
      render();
    },

    openTask: function (ref) {
      var f = state.feed.filter(function (x) { return x.task === ref; });
      var owner = f[0] ? agent(f[0].agent) : null;
      ui.drawer({
        title: ref, sub: 'Task im Board',
        body: '<p class="lead">In Paperclip ist jede Agenten-Arbeit eine Task — Kommentare, Ergebnisse und Freigaben hängen daran. ' +
                'Diese Demo zeigt den Verlauf, den das Commerce-Modul dazu kennt.</p>' +
              (owner ? '<div class="ag-now"><b>Zuständig:</b> ' + owner.name + ' <span class="agent-role">' + owner.role + '</span></div>' : '') +
              '<h4 class="drawer-h">Verlauf</h4><div class="feed plain">' +
                (f.length ? f.map(function (x) { return feedRowHtml(x); }).join('')
                          : '<div class="empty sm">Zu dieser Task gibt es im gewählten Zeitraum keine Einträge.</div>') +
              '</div>',
        foot: '<button class="btn ghost" data-act="closeDrawer">Schließen</button>'
      });
    },

    openConnector: function (id) {
      var c = D.connectors.filter(function (x) { return x.id === id; })[0];
      ui.drawer({
        title: c.name, sub: c.shop,
        body: '<div class="conn-state"><span class="dot"></span> Verbunden · letzter Abgleich ' + c.sync + '</div>' +
              '<h4 class="drawer-h">Was das Modul liest</h4><ul class="tick-list">' +
                c.scope.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>' +
              '<h4 class="drawer-h">Was es schreibt</h4><ul class="tick-list lock"><li>' + c.writes + '</li></ul>' +
              '<p class="hint">Zugänge liegen als Firmen-Secret in den Paperclip-Einstellungen und sind an genau die Agenten gebunden, die sie brauchen.</p>',
        foot: '<button class="btn ghost" data-act="closeDrawer">Schließen</button>'
      });
    },

    report: function () {
      ui.modal({
        title: 'Report erstellen', sub: 'Otto stellt ihn zusammen', size: 'sm',
        body: '<label class="fld"><span class="fld-k">Zeitraum</span>' +
                '<select class="field" data-model="rep.range"><option value="7">Letzte 7 Tage</option><option value="30" selected>Letzte 30 Tage</option><option value="90">Letzte 90 Tage</option></select></label>' +
              '<span class="fld-k">Inhalte</span>' +
              '<div class="checks">' +
                [['umsatz', 'Umsatz & Bestellungen', true], ['designs', 'Design-Performance', true],
                 ['seo', 'Rankings & Traffic', true], ['buch', 'Kosten & Rohertrag', false], ['support', 'Kundenservice', false]]
                .map(function (c) {
                  return '<label class="check"><input type="checkbox" data-model="rep.' + c[0] + '"' + (c[2] ? ' checked' : '') + '><span>' + c[1] + '</span></label>';
                }).join('') + '</div>',
        foot: '<button class="btn ghost" data-act="closeModal">Abbrechen</button>' +
              '<button class="btn primary" data-act="reportRun">Erstellen</button>'
      });
      state.forms['rep.range'] = '30';
      ['umsatz', 'designs', 'seo'].forEach(function (k) { state.forms['rep.' + k] = true; });
    },
    reportRun: function () {
      ui.closeModal();
      ui.run({
        agent: 'otto', title: 'Report wird erstellt',
        steps: [
          { text: 'Zahlen aus Shopify und GA4 holen', ms: 900 },
          { text: 'Design-Performance auswerten', ms: 800 },
          { text: 'Rankings aus der Search Console ergänzen', ms: 700 },
          { text: 'Zusammenfassung schreiben', ms: 1000 }
        ],
        done: { text: 'Report „Juli 2026“ liegt in den Artifacts — 6 Seiten, mit Vergleich zum Vormonat.', cta: 'Alles klar', act: 'closeModal' },
        onDone: function () {
          pushFeed('otto', '<b>Otto</b> hat den Report <b>„Juli 2026“</b> erstellt — 6 Seiten mit Vergleich zum Vormonat → Artifacts.', { type: 'ok', text: 'Fertig' }, 'NOR-52');
          if (state.tab === 'uebersicht') render();
        }
      });
    },

    reset: function () { location.reload(); },

    navBlocked: function (name) {
      ui.toast('Diese Demo zeigt das <b>Commerce-Modul</b>. „' + name + '“ ist eine native Paperclip-Ansicht und nicht Teil der Demo.', 'warn');
    },

    palette: function () {
      var items = [
        { k: 'Übersicht', s: 'Reiter', act: 'setTab', arg: 'uebersicht' },
        { k: 'Design-Studio', s: 'Reiter', act: 'setTab', arg: 'design' },
        { k: 'SEO & Ranking', s: 'Reiter', act: 'setTab', arg: 'seo' },
        { k: 'Buchhaltung', s: 'Reiter', act: 'setTab', arg: 'buchhaltung' },
        { k: 'Kundenservice', s: 'Reiter', act: 'setTab', arg: 'support' }
      ].concat(D.agents.map(function (a) { return { k: a.name, s: a.role, act: 'openAgent', arg: a.id }; }))
       .concat(openApprovals().map(function (a) { return { k: a.title, s: 'Freigabe · ' + agent(a.by).name, act: 'openApproval', arg: a.id }; }))
       .concat(state.designs.filter(function (d) { return d.revenue30 > 0; }).map(function (d) { return { k: d.name, s: 'Design · ' + d.sku, act: 'openDesign', arg: d.id }; }));
      state.paletteItems = items;
      ui.modal({
        title: '', size: 'sm',
        body: '<div class="pal"><div class="pal-in">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
                '<input class="pal-field" data-model="pal.q" data-focus-key="pal" placeholder="Springen zu … (Reiter, Agent, Freigabe, Design)" autocomplete="off">' +
              '</div><div class="pal-list" id="palList">' + paletteList('') + '</div></div>'
      });
      state.forms['pal.q'] = '';
      setTimeout(function () { var f = document.querySelector('.pal-field'); if (f) f.focus(); }, 60);
    },

    askAgent: function (id) {
      ui.closeDrawer();
      state.chat.agent = id;
      state.chat.open = true;
      renderChat();
      var a = agent(id);
      if (id !== 'otto' && !state.chat.messages.length) {
        state.chat.messages.push({ from: 'agent', agent: id, text: 'Ich bin ' + a.name + '. Ich kümmere mich um ' + a.title.toLowerCase() + '.\n\nIn dieser Demo antwortet **Otto** für das ganze Team — frag ihn einfach, er kennt meine Zahlen.' });
        state.chat.agent = 'otto';
        renderChat();
      }
    },
    openChat: function () { state.chat.open = !state.chat.open; renderChat(); },
    closeChat: function () { state.chat.open = false; renderChat(); },
    chatSuggest: function (q) { sendChat(q); },
    chatSend: function () { sendChat((state.forms['chat.q'] || '').trim()); },

    /* Von Views genutzt, aber global sinnvoll */
    sort: function (arg) {
      var p = arg.split('|'), table = p[0], key = p[1];
      var cur = state.sort[table];
      if (cur && cur.key === key) cur.dir = cur.dir === 'asc' ? 'desc' : 'asc';
      else state.sort[table] = { key: key, dir: 'desc' };
      render();
    }
  };

  function paletteList(q) {
    var items = state.paletteItems || [];
    var ql = q.toLowerCase();
    var hits = items.filter(function (i) { return !ql || (i.k + ' ' + i.s).toLowerCase().indexOf(ql) >= 0; }).slice(0, 8);
    if (!hits.length) return '<div class="empty sm">Nichts gefunden — versuch „Design“, „Otto“ oder „Buchhaltung“.</div>';
    return hits.map(function (i) {
      return '<button class="pal-item" data-act="palGo" data-arg="' + i.act + '|' + i.arg + '">' +
               '<span class="pal-k">' + fmt.esc(i.k) + '</span><span class="pal-s">' + fmt.esc(i.s) + '</span></button>';
    }).join('');
  }
  actions.palGo = function (arg) {
    var p = arg.split('|');
    ui.closeModal();
    setTimeout(function () { (actions[p[0]] || function () {})(p[1]); }, 180);
  };

  /* --- Otto-Chat ----------------------------------------------------------- */
  function chatVars() {
    var m = metrics(30), ts = ticketStats();
    var hours = D.agents.reduce(function (s, a) { return s + a.hoursSaved; }, 0);
    return {
      rev30: fmt.num(m.revenue), revTrend: fmt.signPct(m.revenueDelta), orders30: fmt.num(m.orders),
      sessions30: fmt.num(m.sessions), gross30: fmt.num(m.gross), margin: fmt.pct0(m.margin),
      print30: fmt.num(m.print), fees30: fmt.num(m.fees), ads30: fmt.num(m.ads),
      operating: fmt.num(m.operating), aov: nf2.format(m.aov), agentCost: nf2.format(m.agentCost),
      hoursSaved: String(hours), hoursValue: fmt.num(hours * 45),
      openApprovals: String(openApprovals().length),
      top10: String(top10()), top10Delta: fmt.signNum(top10() - top10Prev()),
      ticketsTotal: String(ts.total), ticketsSolved: String(ts.solved), ticketsOpen: String(ts.open),
      solveRate: fmt.pct0(ts.rate), receipts: String(D.receipts[6].length),
      ustvaPay: fmt.eur2(ustvaNumbers(5).pay), receiptsJune: String(D.receipts[5].length)
    };
  }
  function fill(text) {
    var v = chatVars();
    return text.replace(/\{(\w+)\}/g, function (_, k) { return v[k] !== undefined ? v[k] : '{' + k + '}'; });
  }
  function answerFor(q) {
    var ql = ' ' + q.toLowerCase() + ' ';
    var best = null, bestScore = 0;
    D.chat.knowledge.forEach(function (entry) {
      var score = 0;
      entry.keys.forEach(function (k) { if (ql.indexOf(k) >= 0) score += k.length; });
      if (score > bestScore) { bestScore = score; best = entry; }
    });
    if (!best) return null;
    return fill(best.answer);
  }
  function sendChat(q) {
    if (!q || state.chat.busy) return;
    state.chat.messages.push({ from: 'me', text: q });
    state.forms['chat.q'] = '';
    var f = document.querySelector('.chat-field'); if (f) f.value = '';
    state.chat.busy = true;
    renderChat();
    setTimeout(function () {
      var a = answerFor(q);
      if (a) state.chat.messages.push({ from: 'agent', agent: 'otto', text: a });
      else state.chat.messages.push({ from: 'agent', agent: 'otto', text: D.chat.fallback, chips: D.chat.suggestions });
      state.chat.busy = false;
      renderChat();
    }, 620 + Math.random() * 420);
  }

  function renderChat() {
    var el = document.getElementById('chat');
    el.classList.toggle('open', state.chat.open);
    document.getElementById('chatBtn').classList.toggle('active', state.chat.open);
    if (!state.chat.open) return;
    var otto = agent('otto');
    var msgs = state.chat.messages.length
      ? state.chat.messages.map(function (m) {
          if (m.from === 'me') return '<div class="cmsg me"><div class="cmsg-body">' + fmt.rich(m.text) + '</div></div>';
          return '<div class="cmsg them"><span class="agent-avatar sm" style="background:' + agent(m.agent || 'otto').color + '">' + agent(m.agent || 'otto').initials + '</span>' +
                 '<div class="cmsg-body">' + fmt.rich(m.text) +
                 (m.chips ? '<div class="chat-chips">' + m.chips.map(function (c) {
                    return '<button class="chip-btn" data-act="chatSuggest" data-arg="' + fmt.esc(c) + '">' + fmt.esc(c) + '</button>';
                  }).join('') + '</div>' : '') + '</div></div>';
        }).join('')
      : '<div class="chat-intro"><span class="agent-avatar lg" style="background:' + otto.color + '">OT</span>' +
        '<div class="chat-intro-t">Frag Otto</div>' +
        '<div class="chat-intro-s">Er koordiniert dein Commerce-Team und kennt die Zahlen aus Shopify, GA4, Search Console und Printful.</div>' +
        '<div class="chat-chips center">' + D.chat.suggestions.map(function (c) {
          return '<button class="chip-btn" data-act="chatSuggest" data-arg="' + fmt.esc(c) + '">' + fmt.esc(c) + '</button>';
        }).join('') + '</div></div>';

    el.innerHTML =
      '<div class="chat-head"><span class="agent-avatar" style="background:' + otto.color + '">OT</span>' +
        '<div><div class="chat-name">Otto</div><div class="chat-role">commerce/lead</div></div>' +
        '<button class="icon-btn" data-act="closeChat" style="margin-left:auto" aria-label="Chat schließen">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
      '<div class="chat-body" id="chatBody">' + msgs +
        (state.chat.busy ? '<div class="cmsg them"><span class="agent-avatar sm" style="background:' + otto.color + '">OT</span>' +
          '<div class="cmsg-body typing"><i></i><i></i><i></i></div></div>' : '') + '</div>' +
      '<div class="chat-foot">' +
        '<input class="chat-field" data-model="chat.q" data-enter="chatSend" placeholder="Frag Otto etwas …" autocomplete="off">' +
        '<button class="chat-send" data-act="chatSend" aria-label="Senden">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12 16-8-6 8 6 8-16-8Z"/></svg></button>' +
      '</div>';
    var body = document.getElementById('chatBody');
    body.scrollTop = body.scrollHeight;
    var f2 = document.querySelector('.chat-field');
    if (f2 && state.chat.messages.length) f2.focus();
  }

  /* --- Feed-Zeile (von Views und Task-Drawer genutzt) ---------------------- */
  function feedRowHtml(x) {
    var a = agent(x.agent);
    return '<div class="feed-row' + (x.fresh ? ' fresh' : '') + '">' +
             '<span class="feed-avatar" style="background:' + a.color + '" data-act="openAgent" data-arg="' + a.id + '">' + a.initials + '</span>' +
             '<span class="feed-text">' + (x.flag ? '<span class="feed-flag ' + x.flag.type + '">' + x.flag.text + '</span>' : '') + x.text +
               (x.task ? ' <span class="task-ref" data-act="openTask" data-arg="' + x.task + '">' + x.task + '</span>' : '') + '</span>' +
             '<span class="feed-time">' + (x.stamp || x.time) + '</span>' +
           '</div>';
  }

  /* --- Chrome (Sidebar-Badge, Tabs, Zeitraum) ------------------------------ */
  function updateChrome() {
    var open = openApprovals().length;
    var badge = document.getElementById('inboxBadge');
    badge.textContent = open;
    badge.style.display = open ? '' : 'none';
    document.querySelectorAll('#tabbar .tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-arg') === state.tab);
    });
    document.getElementById('rangeLabel').textContent =
      state.range === 7 ? 'Letzte 7 Tage' : state.range === 30 ? 'Letzte 30 Tage' : 'Letzte 90 Tage';
    document.querySelectorAll('.range-menu button').forEach(function (b) {
      b.classList.toggle('sel', parseInt(b.getAttribute('data-arg'), 10) === state.range);
    });
  }

  /* --- Render -------------------------------------------------------------- */
  function render() {
    var view = DEMO.views[state.tab];
    var root = document.getElementById('view');
    // Fehlt eine View-Datei, zeigt die Demo das — statt einer weißen Seite.
    if (!view) {
      root.innerHTML = '<div class="empty"><div class="empty-t">Dieser Reiter konnte nicht geladen werden</div>' +
        'Die Datei <span class="mono">view-' + fmt.esc(state.tab) + '.js</span> fehlt oder hat einen Fehler. ' +
        'Öffne die Konsole des Browsers, dort steht die Ursache.</div>';
      updateChrome();
      return;
    }
    root.innerHTML = view.render(state);
    updateChrome();
    if (view.mount) view.mount(root, state);
    if (state.focusKey) {
      var f = document.querySelector('[data-focus-key="' + state.focusKey + '"]');
      if (f) { f.focus(); if (f.setSelectionRange && f.value) f.setSelectionRange(f.value.length, f.value.length); }
    }
  }

  /* --- Event-Delegation ---------------------------------------------------- */
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-act]');
    if (!el) return;
    var name = el.getAttribute('data-act');
    var fn = actions[name] || (DEMO.actions && DEMO.actions[name]);
    if (!fn) return;
    ev.preventDefault();
    ev.stopPropagation();
    fn(el.getAttribute('data-arg'), el, ev);
  });

  document.addEventListener('input', function (ev) {
    var el = ev.target.closest('[data-model]');
    if (!el) return;
    var key = el.getAttribute('data-model');
    state.forms[key] = el.type === 'checkbox' ? el.checked : el.value;
    if (key === 'pal.q') {
      document.getElementById('palList').innerHTML = paletteList(el.value);
      return;
    }
    var live = el.getAttribute('data-live');       // Views: bei jedem Tastendruck neu rendern
    if (live) {
      state.focusKey = el.getAttribute('data-focus-key');
      render();
      state.focusKey = null;
    }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') {
      if (state.modal) return ui.closeModal();
      if (state.drawer) return ui.closeDrawer();
      if (state.chat.open) return actions.closeChat();
    }
    if (ev.key === 'Enter') {
      var el = ev.target.closest('[data-enter]');
      if (el) { ev.preventDefault(); (actions[el.getAttribute('data-enter')] || function () {})(); }
      var pal = ev.target.closest('.pal-field');
      if (pal) { var first = document.querySelector('.pal-item'); if (first) first.click(); }
    }
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') { ev.preventDefault(); actions.palette(); }
  });

  /* --- Hintergrund-Ticker: Agenten melden sich von selbst ------------------ */
  function scheduleLive() {
    var delays = [48000, 96000, 152000];
    delays.forEach(function (ms, i) {
      setTimeout(function () {
        if (state.liveIdx >= D.liveEvents.length) return;
        var e = D.liveEvents[state.liveIdx++];
        pushFeed(e.agent, e.text, e.flag, e.task);
        ui.toast('<b>' + agent(e.agent).name + '</b> hat sich gemeldet', 'ok');
        if (state.tab === 'uebersicht') render();
      }, ms);
      void i;
    });
  }

  /* --- Export -------------------------------------------------------------- */
  window.DEMO = {
    data: D, state: state, fmt: fmt, ui: ui, actions: actions, views: {},
    metrics: metrics, monthDays: monthDays, monthSums: monthSums, ustvaNumbers: ustvaNumbers,
    top10: top10, top10Prev: top10Prev, ticketStats: ticketStats,
    agent: agent, design: design, draft: draft, trend: trend, ticket: ticket,
    approval: approval, openApprovals: openApprovals,
    feedRowHtml: feedRowHtml, threadHtml: threadHtml, pushFeed: pushFeed,
    render: render, clone: clone,
    boot: function () {
      render();
      renderChat();
      scheduleLive();
    }
  };
})();

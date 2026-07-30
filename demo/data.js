/* ============================================================================
   Demo-Datensatz — Commerce-Modul (Nordwind Studio)
   Alle Werte sind frei erfunden. Einzige Wahrheitsquelle ist die Tagesserie
   unten: KPIs, Charts, Belege und GuV werden daraus berechnet, nicht separat
   behauptet. Deterministisch (fester Seed, festes "heute") — die Demo zeigt
   bei jedem Öffnen exakt dieselben Zahlen.
   ========================================================================== */
(function () {
  'use strict';

  /* --- Zeit & Zufall: deterministisch ------------------------------------ */
  var TODAY = new Date(2026, 6, 13);          // 13.07.2026
  var DAYS = 180;

  function addDays(d, n) {
    var x = new Date(d.getTime());
    x.setDate(x.getDate() + n);
    return x;
  }
  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  // Mulberry32 — kleiner, deterministischer PRNG
  function prng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* --- Tagesserie -------------------------------------------------------- */
  // Rohkurve: sanftes Wachstum + Wochenrhythmus + Rauschen.
  // Der Seed ist so gewählt, dass der Shop in allen drei Zeitfenstern (7/30/90)
  // wächst — sonst zeigt die Demo je nach Schalterstellung zufällig einen
  // Einbruch, der nichts mit dem Erzählten zu tun hat.
  var rnd = prng(20260790);
  var rawRev = [], rawSess = [], dates = [];
  var weekFactor = [0.88, 1.03, 1.06, 1.01, 0.97, 1.10, 1.02];   // So..Sa

  for (var i = 0; i < DAYS; i++) {
    var d = addDays(TODAY, -(DAYS - 1 - i));
    dates.push(d);
    var growth = 1 + (i / DAYS) * 0.52;
    var wk = weekFactor[d.getDay()];
    rawRev.push(620 * growth * wk * (0.80 + rnd() * 0.40));
    rawSess.push(560 * growth * (0.92 + wk * 0.08) * (0.84 + rnd() * 0.32));
  }

  // Skaliert die Serie so, dass die letzten `n` Tage exakt `target` ergeben.
  function fitLast(vals, n, target) {
    var start = vals.length - n, s = 0, k;
    for (k = start; k < vals.length; k++) s += vals[k];
    var f = target / s;
    var out = vals.map(function (v) { return Math.round(v * f); });
    var got = 0;
    for (k = start; k < out.length; k++) got += out[k];
    var diff = target - got, step = diff > 0 ? 1 : -1, idx = out.length - 1;
    while (diff !== 0) {
      out[idx] += step; diff -= step; idx--;
      if (idx < start) idx = out.length - 1;
    }
    return out;
  }

  var revenue  = fitLast(rawRev, 30, 24640);
  var sessions = fitLast(rawSess, 30, 21480);
  // Bestellungen folgen dem Umsatz (Warenkorb ~34 €) mit eigenem Rauschen
  var rnd2 = prng(970301);
  var orders = fitLast(revenue.map(function (r) { return (r / 34) * (0.90 + rnd2() * 0.20); }), 30, 724);

  // Kostenserien — proportional zu Bestellungen bzw. Umsatz
  var printCost = fitLast(orders.map(function (o) { return o * 14; }), 30, 10150);   // Printful
  var feeCost   = fitLast(revenue.map(function (r) { return r * 0.05; }), 30, 1230); // Shopify + PayPal
  var rnd3 = prng(551122);
  var adsCost   = fitLast(revenue.map(function () { return 70 + rnd3() * 20; }), 30, 2180);

  var days = dates.map(function (d, k) {
    return {
      date: d, iso: iso(d),
      revenue: revenue[k], sessions: sessions[k], orders: orders[k],
      print: printCost[k], fees: feeCost[k], ads: adsCost[k]
    };
  });

  function sum(arr, key) {
    var s = 0;
    for (var k = 0; k < arr.length; k++) s += arr[k][key];
    return s;
  }
  // Fenster: `n` Tage bis heute (offset 0) bzw. die `n` Tage davor (offset 1)
  function windowDays(n, offset) {
    var end = days.length - (offset || 0) * n;
    return days.slice(Math.max(0, end - n), end);
  }

  /* --- Agenten ----------------------------------------------------------- */
  var agents = [
    {
      id: 'otto', name: 'Otto', initials: 'OT', color: 'var(--agent-otto)',
      role: 'commerce/lead', title: 'Koordinator', status: 'working',
      model: 'claude-fable-5', runtime: 'Claude Code', access: 'Firmen-Abo',
      costMonth: 11.40, hoursSaved: 9,
      task: 'NOR-52', now: 'Zerlegt „Saisonabverkauf Q3“ und verteilt an das Team.',
      skills: ['Aufträge zerlegen & verteilen', 'Ergebnisse abnehmen', 'Tagesbriefing schreiben', 'Zahlen aus allen Quellen zusammenführen'],
      permissions: ['Tasks anlegen & zuweisen', 'Alle Board-Daten lesen', 'Keine Shop-Änderungen ohne Freigabe'],
      runs: [
        { at: '07:30', what: 'Tagesbriefing erstellt', result: '4 Punkte für dich markiert', tokens: '18k' },
        { at: 'Gestern 07:30', what: 'Tagesbriefing erstellt', result: '2 Punkte für dich markiert', tokens: '17k' },
        { at: 'Mo 09:15', what: 'Plan „Saisonabverkauf Q3“ zerlegt', result: '7 Tasks an 4 Agenten', tokens: '42k' }
      ]
    },
    {
      id: 'ida', name: 'Ida', initials: 'ID', color: 'var(--agent-ida)',
      role: 'commerce/design-research', title: 'Designrecherche', status: 'working',
      model: 'claude-sonnet-5', runtime: 'Claude Code', access: 'Firmen-Abo',
      costMonth: 8.20, hoursSaved: 14,
      task: 'NOR-61', now: 'Scannt Google Trends, Etsy & Pinterest nach Nischen.',
      skills: ['Trendsignale sammeln (Trends, Etsy, Pinterest)', 'Konkurrenzdichte schätzen', 'Nischen bewerten & Design-Briefs schreiben', 'Bestehende Designs nachbewerten'],
      permissions: ['Externe Quellen lesen', 'Design-Briefs als Task anlegen', 'Keine Veröffentlichung'],
      runs: [
        { at: '09:52', what: 'Trend-Scan (90 Tage)', result: '3 Nischen erkannt, 1 Brief erstellt', tokens: '61k' },
        { at: 'Gestern 09:50', what: 'Trend-Scan (90 Tage)', result: 'keine neue Nische über Schwelle', tokens: '58k' },
        { at: 'Di 14:20', what: 'Design-Bewertung „Bergziege Retro“', result: 'Empfehlung: auslaufen lassen', tokens: '12k' }
      ]
    },
    {
      id: 'theo', name: 'Theo', initials: 'TH', color: 'var(--agent-theo)',
      role: 'commerce/design', title: 'Designerstellung', status: 'working',
      model: 'claude-sonnet-5', runtime: '+ Bild-KI', access: 'Firmen-Schlüssel',
      costMonth: 9.80, hoursSaved: 21,
      task: 'NOR-62', now: 'Rendert 4 Mockups „Nordic Trails“ für Shirt & Poster.',
      skills: ['Entwürfe aus Design-Brief erzeugen', 'Varianten & Farbwelten ableiten', 'Produkt-Mockups rendern', 'Listing-Texte & Preisvorschlag schreiben'],
      permissions: ['Bild-KI aufrufen', 'Entwürfe als Artifact ablegen', 'Live-Stellung nur nach deiner Freigabe'],
      runs: [
        { at: '09:30', what: '4 Entwürfe „Nordic Trails“', result: 'zur Freigabe eingereicht', tokens: '86k' },
        { at: 'Gestern 16:10', what: '2 Varianten „Fjord Lines / Sand“', result: 'zur Freigabe eingereicht', tokens: '44k' },
        { at: 'Mo 11:05', what: '3er-Poster-Bundle „Nordlicht“', result: 'Entwurf fertig', tokens: '52k' }
      ]
    },
    {
      id: 'mia', name: 'Mia', initials: 'MI', color: 'var(--agent-mia)',
      role: 'commerce/seo', title: 'SEO & Ranking', status: 'idle',
      model: 'claude-sonnet-5', runtime: 'Claude Code', access: 'Firmen-Abo',
      costMonth: 4.10, hoursSaved: 11,
      task: 'NOR-55', now: '12 Metas live — „nordische poster“ Platz 4.',
      skills: ['Rankings aus Search Console lesen', 'Meta-Titel & -Beschreibungen optimieren', 'Blogartikel auf Zielkeyword schreiben', 'Interne Verlinkung setzen'],
      permissions: ['Search Console lesen', 'Shop-Metadaten schreiben (nach Freigabe)', 'Blog-Entwürfe anlegen'],
      runs: [
        { at: '08:47', what: '12 Meta-Beschreibungen ausgerollt', result: '„nordische poster“ 9 → 4', tokens: '38k' },
        { at: 'Gestern 08:45', what: 'Ranking-Check', result: '3 Keywords verbessert, 1 verloren', tokens: '9k' },
        { at: 'Mi 13:30', what: 'Blogartikel „Fernwanderwege“', result: 'Entwurf zur Freigabe', tokens: '71k' }
      ]
    },
    {
      id: 'nele', name: 'Nele', initials: 'NE', color: 'var(--agent-nele)',
      role: 'commerce/social', title: 'Social Media', status: 'scheduled',
      statusLabel: 'Plan 11:00',
      model: 'claude-sonnet-5', runtime: '+ Bild-KI', access: 'Firmen-Abo',
      costMonth: 6.80, hoursSaved: 12,
      task: 'NOR-66', now: 'Plant die Woche für Pinterest, Instagram & TikTok.',
      skills: ['Beiträge aus vorhandenen Designs bauen', 'Je Kanal eigene Bildformate & Texte', 'Beste Zeiten aus der Reichweite lernen', 'Kommentare beantworten & Fragen weiterleiten'],
      permissions: ['Kanal-Statistiken lesen', 'Beiträge planen & Entwürfe anlegen', 'Veröffentlichen nur nach deiner Freigabe'],
      runs: [
        { at: '11:00', what: 'Wochenplan erstellt', result: '9 Beiträge zur Freigabe', tokens: '48k' },
        { at: 'Gestern 11:00', what: 'Reichweiten-Auswertung', result: 'Pinterest 4× stärker als Instagram', tokens: '14k' },
        { at: 'Di 15:30', what: '4 Pins „Fjord Lines“', result: '12.400 Impressionen, 340 Klicks', tokens: '31k' }
      ]
    },
    {
      id: 'karla', name: 'Karla', initials: 'KA', color: 'var(--agent-karla)',
      role: 'commerce/buchhaltung', title: 'Buchhaltung', status: 'scheduled',
      statusLabel: 'Routine 18:00',
      model: 'claude-haiku-4-5', runtime: 'Claude Code', access: 'Firmen-Schlüssel',
      costMonth: 0.90, hoursSaved: 16,
      task: 'NOR-49', now: 'Verbucht Belege & bereitet die USt-VA vor.',
      skills: ['Belege aus Shopify & Printful holen', 'Konten zuordnen (SKR03)', 'Payouts abgleichen', 'USt-VA vorbereiten & DATEV exportieren'],
      permissions: ['Shopify & Printful lesen', 'Belege ablegen & zuordnen', 'Keine Übermittlung ans Finanzamt ohne Freigabe'],
      runs: [
        { at: '07:45', what: 'Belegabgleich', result: '14 Belege verbucht, Payout 1.890 € geprüft', tokens: '22k' },
        { at: 'Gestern 18:00', what: 'Belegabgleich', result: '9 Belege verbucht', tokens: '19k' },
        { at: 'Do 18:00', what: 'USt-VA Juni vorbereitet', result: 'Entwurf zur Freigabe', tokens: '31k' }
      ]
    },
    {
      id: 'emma', name: 'Emma', initials: 'EM', color: 'var(--agent-emma)',
      role: 'commerce/support', title: 'Kundenservice', status: 'idle',
      model: 'gemma-3 (lokal)', runtime: 'kostenfrei', access: 'Lokal auf deinem Server',
      costMonth: 0, hoursSaved: 19,
      task: 'NOR-51', now: 'Nur 2 von 38 Anfragen brauchten diese Woche dich.',
      skills: ['Anfragen einordnen', 'Lieferstatus aus Tracking beantworten', 'Größentausch & Retoure abwickeln', 'Bei Zweifel an dich eskalieren'],
      permissions: ['Bestellungen & Tracking lesen', 'Antworten senden (Standardfälle)', 'Erstattungen nur nach Freigabe'],
      runs: [
        { at: '08:20', what: '9 Anfragen bearbeitet', result: '8 gelöst, 1 eskaliert', tokens: '0 (lokal)' },
        { at: 'Gestern 17:40', what: '11 Anfragen bearbeitet', result: '11 gelöst', tokens: '0 (lokal)' },
        { at: 'Gestern 09:10', what: '6 Anfragen bearbeitet', result: '5 gelöst, 1 eskaliert', tokens: '0 (lokal)' }
      ]
    }
  ];

  /* --- Designs ----------------------------------------------------------- */
  // revenue30 summiert exakt auf den 30-Tage-Umsatz (24.640 €) — geprüft in core.js
  var designs = [
    { id: 'd12', name: 'Fjord Lines',      sku: 'NW-DSN-012', initials: 'FL', g1: '#3E6C8E', g2: '#2E8B7A', listings: 6, revenue30: 4320, trend: 'up',   status: 'live', since: '12.03.2026', by: 'theo',
      note: 'Trend stabil — Farbvariante „Sand“ in NOR-63', noteBy: 'ida',
      variants: ['Shirt (5 Farben)', 'Hoodie (3 Farben)', 'Poster A2', 'Poster A3'] },
    { id: 'd07', name: 'Wild & Frei',      sku: 'NW-DSN-007', initials: 'WF', g1: '#4C8A5A', g2: '#2C5F3E', listings: 8, revenue30: 3780, trend: 'up',   status: 'live', since: '04.02.2026', by: 'theo',
      note: 'rankt Platz 7 für „wander t-shirt spruch“', noteBy: 'mia',
      variants: ['Shirt (6 Farben)', 'Hoodie (4 Farben)', 'Tasse', 'Beutel'] },
    { id: 'd19', name: 'Nordlicht Serie',  sku: 'NW-DSN-019', initials: 'NL', g1: '#6B4FA8', g2: '#3B3A8C', listings: 3, revenue30: 2940, trend: 'flat', status: 'live', since: '28.04.2026', by: 'theo',
      note: '3er-Poster-Bundle als Entwurf fertig', noteBy: 'theo',
      variants: ['Poster A2', 'Poster A3', 'Leinwand 40×60'] },
    { id: 'd21', name: 'Retro Trail',      sku: 'NW-DSN-021', initials: 'RT', g1: '#D4762F', g2: '#B03B2E', listings: 4, revenue30: 1960, trend: 'up',   status: 'new',  since: '02.07.2026', by: 'theo',
      note: 'aus Trend-Radar vom 02.07. — bester Start bisher', noteBy: 'ida',
      variants: ['Shirt (4 Farben)', 'Hoodie (2 Farben)', 'Poster A3', 'Cap'] },
    { id: 'd03', name: 'Bergziege Retro',  sku: 'NW-DSN-003', initials: 'BZ', g1: '#8A6E4B', g2: '#5C4630', listings: 5, revenue30: 1480, trend: 'down', status: 'live', since: '15.12.2025', by: 'theo',
      note: 'Nische kühlt ab — auslaufen lassen, kein Re-Design', noteBy: 'otto',
      variants: ['Shirt (3 Farben)', 'Hoodie (2 Farben)', 'Tasse'] },
    { id: 'd15', name: 'Küstenwind',       sku: 'NW-DSN-015', initials: 'KW', g1: '#4E86A8', g2: '#2F6076', listings: 5, revenue30: 1920, trend: 'up',   status: 'live', since: '19.03.2026', by: 'theo',
      note: 'stabile Zweitplatzierung hinter „Fjord Lines“', noteBy: 'ida',
      variants: ['Shirt (4 Farben)', 'Poster A3', 'Beutel'] },
    { id: 'd09', name: 'Waldläufer',       sku: 'NW-DSN-009', initials: 'WL', g1: '#5C7F4A', g2: '#33502C', listings: 6, revenue30: 1640, trend: 'flat', status: 'live', since: '22.02.2026', by: 'theo',
      note: '—', noteBy: null,
      variants: ['Shirt (5 Farben)', 'Hoodie (3 Farben)'] },
    { id: 'd17', name: 'Polarstern',       sku: 'NW-DSN-017', initials: 'PS', g1: '#3F5BA8', g2: '#26306B', listings: 4, revenue30: 1480, trend: 'up',   status: 'live', since: '08.04.2026', by: 'theo',
      note: 'Winterthema — Nachfrage steigt ab September', noteBy: 'ida',
      variants: ['Poster A2', 'Poster A3', 'Tasse', 'Leinwand 40×60'] },
    { id: 'd05', name: 'Salzluft',         sku: 'NW-DSN-005', initials: 'SL', g1: '#5A9BA8', g2: '#357180', listings: 4, revenue30: 1280, trend: 'flat', status: 'live', since: '30.01.2026', by: 'theo',
      note: '—', noteBy: null,
      variants: ['Shirt (3 Farben)', 'Beutel', 'Tasse'] },
    { id: 'd23', name: 'Gipfelstürmer',    sku: 'NW-DSN-023', initials: 'GS', g1: '#8E5B3A', g2: '#5E3626', listings: 3, revenue30: 1080, trend: 'up',   status: 'new',  since: '06.07.2026', by: 'theo',
      note: 'zweiter Start aus dem Trend-Radar — beobachten', noteBy: 'ida',
      variants: ['Shirt (3 Farben)', 'Hoodie (2 Farben)', 'Cap'] },
    { id: 'd11', name: 'Moorlicht',        sku: 'NW-DSN-011', initials: 'ML', g1: '#6E5B8E', g2: '#413659', listings: 3, revenue30: 960,  trend: 'flat', status: 'live', since: '05.03.2026', by: 'theo',
      note: '—', noteBy: null,
      variants: ['Poster A3', 'Leinwand 30×40'] },
    { id: 'd01', name: 'Seemannsgarn',     sku: 'NW-DSN-001', initials: 'SG', g1: '#3E5C7A', g2: '#26384D', listings: 5, revenue30: 820,  trend: 'down', status: 'live', since: '02.11.2025', by: 'theo',
      note: 'ältestes Design — Umsatz halbiert seit Mai', noteBy: 'otto',
      variants: ['Shirt (4 Farben)', 'Tasse', 'Beutel'] },
    { id: 'd13', name: 'Heidefeuer',       sku: 'NW-DSN-013', initials: 'HF', g1: '#A8543F', g2: '#6B2F2A', listings: 2, revenue30: 560,  trend: 'down', status: 'paused', since: '14.03.2026', by: 'theo',
      note: 'pausiert — Motiv zu nah an Wettbewerber', noteBy: 'ida',
      variants: ['Shirt (2 Farben)'] },
    { id: 'd25', name: 'Nebelkrähe',       sku: 'NW-DSN-025', initials: 'NK', g1: '#5E6470', g2: '#383C45', listings: 2, revenue30: 420,  trend: 'flat', status: 'new',  since: '09.07.2026', by: 'theo',
      note: 'frisch live — noch keine Aussage möglich', noteBy: 'ida',
      variants: ['Shirt (2 Farben)', 'Poster A3'] }
  ];

  /* --- Trend-Radar (Idas Fund) ------------------------------------------- */
  var trends = [
    { id: 't1', name: 'Retro Trail Running', score: 92, growth: '+140 %', volume: 4800, competition: 'niedrig', source: 'Google Trends · Etsy · Pinterest',
      status: 'briefed', found: '09:52 heute',
      why: 'Suchinteresse in 90 Tagen +140 %, auf Etsy nur 340 Konkurrenz-Listings bei 4.800 Suchanfragen/Monat. Bildsprache: 80er-Laufsport, warme Erdtöne, grobe Raster.',
      brief: 'Vier Motive im 80er-Laufsport-Stil: gestreifte Retro-Bahnen, körnige Farbverläufe in Terrakotta/Senf/Creme, kurze Wortmarken („TRAIL 84“, „MILE AFTER MILE“). Zielprodukte: Shirt, Hoodie, Poster A3. Ton: nostalgisch, nicht ironisch.',
      task: 'NOR-61' },
    { id: 't2', name: 'Cottage-Wandern / „Slow Hiking“', score: 78, growth: '+64 %', volume: 2900, competition: 'mittel', source: 'Google Trends · Pinterest',
      status: 'watch', found: 'Gestern 09:50',
      why: 'Stetiges Wachstum seit April, Pinterest-Pins +64 %. Konkurrenz zieht aber an: 1.100 Etsy-Listings. Empfehlung: beobachten, Einstieg erst bei klarer Bildidee.',
      brief: 'Noch kein Brief — Ida sammelt weiter Signale.',
      task: null },
    { id: 't3', name: 'Nordische Minimal-Karten', score: 71, growth: '+38 %', volume: 3300, competition: 'hoch', source: 'Google Trends · Etsy',
      status: 'watch', found: 'Mo 09:50',
      why: 'Solides Volumen, aber 4.200 konkurrierende Listings und Preisverfall (Ø 14 € → 11 €). Nur mit klarer Differenzierung sinnvoll.',
      brief: 'Noch kein Brief — Ida beobachtet die Preisentwicklung.',
      task: null }
  ];

  /* --- Entwürfe (Theos Arbeit an „Nordic Trails“) ------------------------- */
  var drafts = [
    { id: 'e1', name: 'Nordic Trails · Bahnen', initials: 'NT', g1: '#3E6C8E', g2: '#2E8B7A', trend: 't1',
      products: ['Shirt', 'Hoodie', 'Poster A3'], price: 'Shirt 29,90 € · Hoodie 49,90 € · Poster 19,90 €',
      listingTitle: 'Retro Trail Running Shirt „Bahnen“ — Vintage Laufsport Motiv, Unisex',
      listingText: 'Grafisches Bahnenmotiv im Stil der 80er-Laufsportplakate. Gedruckt auf Bio-Baumwolle (180 g/m²), unisex geschnitten. Für alle, die lieber im Wald laufen als auf dem Laufband.',
      tags: ['retro laufshirt', 'trail running geschenk', 'vintage laufsport'] },
    { id: 'e2', name: 'Nordic Trails · Mile 84', initials: 'M8', g1: '#D4762F', g2: '#B03B2E', trend: 't1',
      products: ['Shirt', 'Hoodie'], price: 'Shirt 29,90 € · Hoodie 49,90 €',
      listingTitle: 'Trail Running Shirt „Mile 84“ — Retro Wortmarke, Terrakotta',
      listingText: 'Wortmarke „MILE AFTER MILE“ in körniger Retro-Typografie, Terrakotta auf Creme. Bio-Baumwolle, unisex. Ein Shirt für lange Strecken.',
      tags: ['trail running shirt', 'laufen geschenk', 'retro sport shirt'] },
    { id: 'e3', name: 'Nordic Trails · Höhenlinien', initials: 'HL', g1: '#4C8A5A', g2: '#2C5F3E', trend: 't1',
      products: ['Poster A3', 'Shirt'], price: 'Poster 19,90 € · Shirt 29,90 €',
      listingTitle: 'Poster „Höhenlinien“ A3 — Trail Running Motiv, Erdtöne',
      listingText: 'Abstrahierte Höhenlinien einer Trailstrecke, gedruckt auf 200 g Naturpapier. Ohne Rahmen, in Papprolle versandt.',
      tags: ['höhenlinien poster', 'laufen wandbild', 'trail poster'] },
    { id: 'e4', name: 'Nordic Trails · Sonnenlauf', initials: 'SO', g1: '#C9973A', g2: '#8E5B3A', trend: 't1',
      products: ['Shirt', 'Poster A3'], price: 'Shirt 29,90 € · Poster 19,90 €',
      listingTitle: 'Retro Shirt „Sonnenlauf“ — 80er Farbverlauf, Trail Running',
      listingText: 'Körniger Sonnenverlauf über einer Bergsilhouette, wie von einem Plakat aus 1984. Bio-Baumwolle, unisex geschnitten.',
      tags: ['retro sonnenuntergang shirt', 'bergmotiv shirt', 'trail running'] }
  ];

  /* --- Keywords (Search Console) ----------------------------------------- */
  // pos = aktuelle Position, prev = Position im Vormonat. Top-10-KPI wird gezählt.
  var keywords = [
    { kw: 'bergmotiv t-shirt',              pos: 7,  prev: 18, vol: 2400, url: '/collections/berge',            design: 'd12' },
    { kw: 'nordische poster',               pos: 4,  prev: 9,  vol: 3600, url: '/collections/poster',           design: 'd19' },
    { kw: 'wander hoodie herren',           pos: 12, prev: 24, vol: 1900, url: '/products/wild-frei-hoodie',    design: 'd07' },
    { kw: 'wander t-shirt spruch',          pos: 7,  prev: 11, vol: 1600, url: '/products/wild-frei-shirt',     design: 'd07' },
    { kw: 'fjord poster',                   pos: 3,  prev: 5,  vol: 1300, url: '/products/fjord-lines-poster',  design: 'd12' },
    { kw: 'nordlicht bild',                 pos: 6,  prev: 8,  vol: 2200, url: '/products/nordlicht-a2',        design: 'd19' },
    { kw: 'geschenk für wanderer',          pos: 9,  prev: 14, vol: 5400, url: '/collections/geschenke',        design: null },
    { kw: 'poster skandinavisch',           pos: 5,  prev: 6,  vol: 2700, url: '/collections/poster',           design: 'd19' },
    { kw: 'trail running shirt retro',      pos: 8,  prev: 41, vol: 4800, url: '/products/retro-trail-shirt',   design: 'd21' },
    { kw: 'bio baumwolle shirt berge',      pos: 10, prev: 13, vol: 880,  url: '/collections/berge',            design: 'd12' },
    { kw: 'küstenbild leinwand',            pos: 11, prev: 12, vol: 1100, url: '/products/kuestenwind-leinwand',design: 'd15' },
    { kw: 'wanderrouten poster',            pos: 14, prev: 19, vol: 1300, url: '/blog/fernwanderwege',          design: null },
    { kw: 'hoodie natur motiv',             pos: 6,  prev: 10, vol: 1450, url: '/collections/hoodies',          design: 'd09' },
    { kw: 'poster a2 natur',                pos: 8,  prev: 8,  vol: 1900, url: '/collections/poster',           design: 'd17' },
    { kw: 'geschenk läufer',                pos: 13, prev: 22, vol: 3100, url: '/collections/laufen',           design: 'd21' },
    { kw: 'skandinavische wanddeko',        pos: 5,  prev: 7,  vol: 2050, url: '/collections/poster',           design: 'd19' },
    { kw: 'shirt mit bergen',               pos: 4,  prev: 4,  vol: 1750, url: '/collections/berge',            design: 'd12' },
    { kw: 'minimalistisches poster natur',  pos: 9,  prev: 15, vol: 1600, url: '/collections/poster',           design: 'd11' },
    { kw: 'polarstern poster',              pos: 2,  prev: 3,  vol: 590,  url: '/products/polarstern-a2',       design: 'd17' },
    { kw: 'meer poster minimalistisch',     pos: 15, prev: 16, vol: 1250, url: '/products/salzluft-poster',     design: 'd05' },
    { kw: 'wandershirt damen',              pos: 16, prev: 21, vol: 1400, url: '/collections/damen',            design: 'd07' },
    { kw: 'outdoor geschenk mann',          pos: 18, prev: 26, vol: 2600, url: '/collections/geschenke',        design: null },
    { kw: 'naturfoto poster wald',          pos: 12, prev: 12, vol: 980,  url: '/products/waldlaeufer-poster',  design: 'd09' },
    { kw: 'bergsteiger tasse',              pos: 7,  prev: 9,  vol: 720,  url: '/products/bergziege-tasse',     design: 'd03' },
    { kw: 'jutebeutel natur motiv',         pos: 9,  prev: 11, vol: 830,  url: '/collections/beutel',           design: 'd05' },
    { kw: 'leinwand 40x60 natur',           pos: 20, prev: 24, vol: 1050, url: '/collections/leinwand',         design: 'd17' },
    { kw: 'retro laufshirt',                pos: 6,  prev: 38, vol: 1900, url: '/products/retro-trail-shirt',   design: 'd21' },
    { kw: 'poster set 3 teilig natur',      pos: 17, prev: 20, vol: 1350, url: '/collections/poster',           design: 'd19' },
    { kw: 'nachhaltiges t-shirt outdoor',   pos: 10, prev: 17, vol: 1150, url: '/collections/nachhaltig',       design: null },
    { kw: 'wanderkarte poster personalisiert', pos: 23, prev: 23, vol: 1750, url: '/collections/poster',        design: null },
    { kw: 'cap wandern',                    pos: 19, prev: 25, vol: 640,  url: '/products/gipfelstuermer-cap',  design: 'd23' },
    { kw: 'moor poster',                    pos: 8,  prev: 9,  vol: 380,  url: '/products/moorlicht-poster',    design: 'd11' },
    { kw: 'maritime deko poster',           pos: 21, prev: 18, vol: 1450, url: '/products/seemannsgarn-poster', design: 'd01' },
    { kw: 'shirt spruch natur',             pos: 11, prev: 14, vol: 1250, url: '/collections/sprueche',         design: 'd07' }
  ];

  /* --- SEO: Mias Arbeit --------------------------------------------------- */
  var seoTasks = [
    { id: 's1', title: 'Meta-Beschreibungen für 12 Produkte', status: 'done', when: 'Heute 08:47',
      detail: 'Zielkeywords aus Search Console abgeleitet, Länge auf 150–158 Zeichen getrimmt, Nutzenversprechen nach vorn gezogen.',
      result: '„nordische poster“ 9 → 4 · „bergmotiv t-shirt“ 18 → 7' },
    { id: 's2', title: 'Interne Verlinkung Blog → Produkte', status: 'done', when: 'Mi 13:30',
      detail: 'Aus 3 Blogartikeln 14 kontextbezogene Links auf Produktseiten gesetzt.',
      result: 'Ø Position der verlinkten Seiten −2,1' },
    { id: 's3', title: 'Alt-Texte für 38 Produktbilder', status: 'open', when: 'Vorschlag',
      detail: 'Bildbeschreibungen fehlen — kostet Sichtbarkeit in der Google-Bildersuche, die bei Poster-Motiven ~18 % des Traffics bringt.',
      result: 'Geschätzt: +6 % organische Sitzungen', runMinutes: 8 },
    { id: 's4', title: '„wander hoodie herren“ von 12 auf Top 10', status: 'open', when: 'Vorschlag',
      detail: 'Produktseite ausbauen: Größentabelle, Materialdetails, 3 Kundenfragen beantworten. Konkurrenz auf Platz 8–11 hat dünnere Seiten.',
      result: 'Geschätzt: Platz 7–9 in 3 Wochen', runMinutes: 12 }
  ];

  var contentPlan = [
    { id: 'c1', title: 'Die 10 schönsten Fernwanderwege Europas', kw: 'wanderrouten poster', vol: 1300,
      status: 'review', words: 1840, links: 6, by: 'mia', when: 'Mi 13:30',
      excerpt: 'Wer einmal auf dem Kungsleden gestanden hat, versteht, warum Menschen sich Karten an die Wand hängen. Wir haben zehn Fernwanderwege gesammelt — von der schwedischen Tundra bis zur portugiesischen Steilküste — und für jeden notiert, was ihn ausmacht, wie lange man braucht und wann die beste Zeit ist.\n\nDie Reihenfolge ist keine Wertung. Sie folgt der Landschaft: erst der Norden, dann die Mitte, dann der Süden.\n\n**1. Kungsleden, Schweden — 440 km, 4 Wochen**\nDer „Königspfad“ führt durch Lapplands Nationalparks, meist über Holzstege durch Moor und Birkenwald. Zwischen den Hütten liegen selten mehr als 20 Kilometer, Nachschub gibt es in Abisko und Kvikkjokk. Beste Zeit: Ende Juni bis September — davor liegt Schnee, danach kommen die Stürme.' },
    { id: 'c2', title: 'Poster richtig aufhängen: 5 Regeln aus der Galerie', kw: 'poster aufhängen höhe', vol: 2400,
      status: 'draft', words: 1120, links: 4, by: 'mia', when: 'Entwurf',
      excerpt: 'Die Mitte des Bildes gehört auf 145 Zentimeter — das ist keine Geschmacksfrage, sondern Galerie-Standard, abgeleitet von der durchschnittlichen Augenhöhe. Wer höher hängt, zwingt seine Gäste zum Nacken strecken.\n\nIn diesem Artikel: die fünf Regeln, die Museen anwenden, und wann man sie brechen darf.' }
  ];

  /* --- Belege (aus der Tagesserie erzeugt) -------------------------------- */
  // Jeder Beleg entspricht exakt einer Position der Tagesserie — die Summe der
  // Belege eines Monats ergibt deshalb genau die Kosten der GuV. Nur der eine
  // bewusst offene Beleg fehlt dort, weil Karla ihn (noch) nicht buchen darf.
  function buildReceipts(monthIdx) {           // monthIdx: 6 = Juli, 5 = Juni
    var out = [], n = 1;
    days.forEach(function (d) {
      if (d.date.getMonth() !== monthIdx || d.date.getFullYear() !== 2026) return;
      var ds = d.date;
      out.push({ id: 'B' + (n++), date: ds, vendor: 'Printful', kind: 'Druck & Versand',
        text: 'Sammelrechnung ' + d.orders + ' Bestellungen', amount: -d.print, account: '3400 Wareneingang', status: 'auto' });
      out.push({ id: 'B' + (n++), date: ds, vendor: 'Shopify Payments', kind: 'Zahlungsgebühr',
        text: 'Transaktionsgebühren Tagesabschluss', amount: -d.fees, account: '4970 Nebenkosten Geldverkehr', status: 'auto' });
      out.push({ id: 'B' + (n++), date: ds, vendor: 'Google Ads', kind: 'Werbung',
        text: 'Kampagne „Poster · Berge“', amount: -d.ads, account: '4600 Werbekosten', status: 'auto' });
    });
    // Feste monatliche Posten
    var first = new Date(2026, monthIdx, 1);
    [
      { vendor: 'Shopify', kind: 'Software', text: 'Shop-Abo Basic', amount: -36, account: '4980 Betriebsbedarf' },
      { vendor: 'Canva', kind: 'Software', text: 'Pro-Abo', amount: -12, account: '4980 Betriebsbedarf' },
      { vendor: 'Anthropic', kind: 'Software', text: 'Agenten-Zugang (Claude)', amount: -20, account: '4980 Betriebsbedarf' },
      { vendor: 'Anthropic', kind: 'Software', text: 'Agenten-API (Verbrauch)', amount: -14, account: '4980 Betriebsbedarf' },
      { vendor: 'Mailchimp', kind: 'Software', text: 'Newsletter-Abo', amount: -18, account: '4980 Betriebsbedarf' },
      { vendor: 'Hetzner', kind: 'Software', text: 'Server (Agenten lokal)', amount: -49, account: '4980 Betriebsbedarf' }
    ].forEach(function (p) {
      out.push({ id: 'B' + (n++), date: first, vendor: p.vendor, kind: p.kind, text: p.text,
        amount: p.amount, account: p.account, status: 'auto' });
    });
    // Ein Beleg, der Karla nicht sicher zuordnen konnte — ehrlicher Reibungspunkt
    if (monthIdx === 6) {
      out.push({ id: 'B' + (n++), date: new Date(2026, 6, 8), vendor: 'Nordisk Papir A/S', kind: 'Unklar',
        text: 'Rechnung 2026-4471 — Zuordnung unsicher', amount: -184, account: '— offen —', status: 'open' });
    }
    out.sort(function (a, b) { return b.date - a.date; });
    return out;
  }

  var receiptsJuly = buildReceipts(6);
  var receiptsJune = buildReceipts(5);

  /* --- Freigaben ---------------------------------------------------------- */
  var approvals = [
    { id: 'a1', title: '4 Designs „Nordic Trails“ live stellen', chip: 'Shopify · Listings', by: 'theo', ago: 'vor 1 Std.',
      desc: '24 Listings (Shirt, Hoodie, Poster) mit Texten, Preisen und Mockups — geht nach Freigabe automatisch in den Shop.',
      task: 'NOR-62', kind: 'designs',
      detail: 'Theo hat aus Idas Design-Brief (NOR-61) vier Motive erzeugt und daraus 24 Listings gebaut: je Motiv Shirt (4–6 Farben), teils Hoodie, teils Poster A3. Preise nach deiner Standardkalkulation: Shirt 29,90 € (Druck 12,40 € → Marge 58 %), Hoodie 49,90 €, Poster 19,90 €.',
      effect: 'Nach Freigabe: Listings gehen live, Mia bekommt automatisch den Auftrag für die Metadaten.',
      impact: { revenue: 2400, note: 'erwarteter Umsatz in 30 Tagen — „Retro Trail“ machte in den ersten 11 Tagen 1.960 €; Theo rechnet vorsichtig mit rund der Hälfte davon je Motiv' } },
    { id: 'a2', title: 'USt-Voranmeldung Juni übermitteln', chip: 'Buchhaltung · ELSTER', by: 'karla', ago: 'vor 2 Std.',
      desc: 'Alle Belege des Monats sind zugeordnet und gegen die Shopify-Payouts geprüft — die Zahlen stehen im Detail.',
      task: 'NOR-49', kind: 'ustva',
      detail: 'Karla hat jeden Juni-Beleg einem Konto zugeordnet, die Umsatzsteuer aus den Bestellungen und die Vorsteuer aus Druck, Gebühren, Werbung und Software gerechnet und die Summen gegen die tatsächlichen Auszahlungen geprüft — keine Abweichung.',
      effect: 'Nach Freigabe: Übermittlung an ELSTER, die Zahlung wird zum 10.08. fällig.',
      impact: null },
    { id: 'a3', title: 'Blogartikel „Die 10 schönsten Fernwanderwege“ veröffentlichen', chip: 'SEO · Content', by: 'mia', ago: 'vor 4 Std.',
      desc: 'Zielkeyword „wanderrouten poster“ (1.300/Monat) — intern auf 6 Produkte verlinkt, Meta & Bilder fertig.',
      task: 'NOR-55', kind: 'content', contentId: 'c1',
      detail: '1.840 Wörter, 6 interne Links auf Poster-Produkte, Meta-Titel und -Beschreibung gesetzt, Alt-Texte für 4 Bilder. Aktuell steht die Domain für dieses Keyword auf Platz 14.',
      effect: 'Nach Freigabe: Artikel geht live, Mia meldet die URL in der Search Console an.',
      impact: { revenue: 0, note: 'SEO wirkt verzögert — Mia erwartet Platz 6–9 in etwa 4 Wochen' } },
    { id: 'a4', title: 'Kulanz-Neudruck für Bestellung #1044', chip: 'Support', by: 'emma', ago: 'vor 5 Std.',
      desc: 'Reklamation Farbabweichung — Neudruck kostet 12,40 € (Printful), Kundin wartet seit gestern.',
      task: 'NOR-51', kind: 'support', ticketId: 'tk1',
      detail: 'Kundin schickte ein Foto: der Terrakotta-Ton des Drucks wirkt deutlich blasser als in der Vorschau. Emma hat den Druckauftrag geprüft — Printful hat ein anderes Farbprofil verwendet als bei der Erstauflage. Emma stuft die Reklamation als berechtigt ein, darf Erstattungen und Neudrucke aber nicht selbst auslösen.',
      effect: 'Nach Freigabe: Neudruck wird bei Printful ausgelöst, Emma informiert die Kundin.',
      impact: { revenue: -12.40, note: 'Kosten des Neudrucks' } },
    { id: 'a6', title: 'Ersatzsendung für Bestellung #1047', chip: 'Support · Versand', by: 'emma', ago: 'vor 3 Std.',
      desc: 'Sendung steht seit 6 Tagen im Depot — Ersatz kostet 18,60 €, der Kunde wartet.',
      task: 'NOR-51', kind: 'support', ticketId: 'tk2',
      detail: 'Das Tracking zeigt seit dem 07.07. keinen Scan mehr. Emma hat die DHL-Nachforschung angestoßen, die dauert erfahrungsgemäß 5–10 Werktage. Sie schlägt vor, nicht darauf zu warten, sondern sofort neu zu schicken — der Kunde hat zusätzlich eine 1-Stern-Bewertung hinterlassen.',
      effect: 'Nach Freigabe: Ersatz geht mit Priorität raus, Emma antwortet dem Kunden und auf seine Bewertung.',
      impact: { revenue: -18.60, note: 'Kosten der Ersatzsendung — die Bewertung kostet mehr' } },
    { id: 'a7', title: 'Social-Wochenplan: 9 Beiträge freigeben', chip: 'Social · Pinterest, Instagram, TikTok', by: 'nele', ago: 'vor 30 Min.',
      desc: 'Nele hat die Woche geplant: 5 Pins, 3 Instagram-Beiträge, 1 TikTok — alle aus vorhandenen Designs.',
      task: 'NOR-66', kind: 'social',
      detail: 'Der Plan folgt der Reichweite der letzten 30 Tage: Pinterest bekommt das meiste Gewicht, weil dort ein Beitrag monatelang weiterläuft. Das Wintermotiv „Polarstern“ geht bewusst schon im Juli raus — auf Pinterest wird der Dezember im Sommer geplant.',
      effect: 'Nach Freigabe: Die Beiträge gehen zu den geplanten Zeiten raus, Nele meldet die Reichweite nach 48 Stunden.',
      impact: { revenue: 640, note: 'erwarteter Umsatz in 30 Tagen — gerechnet aus der Klickrate vergleichbarer Beiträge' } }
  ];

  /* --- Aktivitäts-Feed ---------------------------------------------------- */
  var feed = [
    { id: 'f1', agent: 'ida', time: '09:52', flag: { type: 'warn', text: 'Trend' }, task: 'NOR-61',
      text: '<b>Ida</b> meldet: Nische <b>„Retro Trail Running“</b> +140 % Suchinteresse (Google Trends, 90 Tage), geringe Konkurrenz auf Etsy — Design-Brief an Theo erstellt.' },
    { id: 'f1b', agent: 'nele', time: '11:00', flag: { type: 'warn', text: 'Plan' }, task: 'NOR-66',
      text: '<b>Nele</b> hat den <b>Social-Wochenplan</b> fertig: 9 Beiträge, Schwerpunkt Pinterest — liegt bei dir zur Freigabe.' },
    { id: 'f1c', agent: 'emma', time: '10:20', flag: { type: 'warn', text: 'Bewertung' }, task: 'NOR-51',
      text: '<b>Emma</b>: neue <b>1-Stern-Bewertung</b> zu Bestellung #1047 — derselbe Kunde, dessen Paket im Depot hängt. Antwortentwurf liegt bereit.' },
    { id: 'f2', agent: 'theo', time: '09:30', flag: null, task: 'NOR-62',
      text: '<b>Theo</b> hat <b>4 Entwürfe „Nordic Trails“</b> gerendert — Mockups für Shirt, Hoodie &amp; Poster inkl. Listing-Texten → Freigaben.' },
    { id: 'f3', agent: 'mia', time: '08:47', flag: null, task: 'NOR-55',
      text: '<b>Mia</b>: 12 Meta-Beschreibungen live — <b>„nordische poster“</b> von Platz 9 auf <b>4</b> gestiegen (Search Console).' },
    { id: 'f4', agent: 'emma', time: '08:20', flag: null, task: 'NOR-51',
      text: '<b>Emma</b> hat 9 Anfragen beantwortet (7× Lieferstatus automatisch via Tracking), 1 eskaliert: <b>Druckqualität #1044</b>.' },
    { id: 'f5', agent: 'karla', time: '07:45', flag: null, task: 'NOR-49',
      text: '<b>Karla</b> hat 14 Printful-Belege verbucht, Payout <b>1.890 €</b> abgeglichen — USt-VA Juni als Entwurf fertig.' },
    { id: 'f6', agent: 'otto', time: '07:30', flag: { type: 'ok', text: 'Routine' }, task: 'NOR-52',
      text: '<b>Otto</b> hat dein <b>Tagesbriefing</b> erstellt: Umsatz gestern 912 € (27 Bestellungen), 4 Punkte brauchen dich → Inbox.' },
    { id: 'f7', agent: 'karla', time: 'Gestern 18:02', flag: { type: 'warn', text: 'Rückfrage' }, task: 'NOR-49',
      text: '<b>Karla</b> konnte einen Beleg nicht sicher zuordnen: <b>Nordisk Papir A/S, 184 €</b> — wartet auf dein Konto → Buchhaltung.' },
    { id: 'f8', agent: 'theo', time: 'Gestern 16:10', flag: null, task: 'NOR-63',
      text: '<b>Theo</b> hat 2 Varianten <b>„Fjord Lines / Sand“</b> gerendert — Ida hatte sie aus dem Trend-Radar vorgeschlagen.' },
    { id: 'f9', agent: 'emma', time: 'Gestern 17:40', flag: null, task: 'NOR-51',
      text: '<b>Emma</b> hat 11 Anfragen beantwortet, alle gelöst — Ø Erstantwort 3 Min.' },
    { id: 'f9b', agent: 'ida', time: 'Gestern 12:05', flag: { type: 'warn', text: 'Muster' }, task: 'NOR-65',
      text: '<b>Ida</b> hat die kritischen Bewertungen durchgesehen: nur <b>2 von 7</b> betreffen einen echten Fehler (Druck, Versand) — der Rest sind Erwartungen an Pflege und Motivgröße. Vorschlag an Theo: Hinweise auf der Produktseite deutlicher setzen.' },
    { id: 'f9c', agent: 'nele', time: 'Gestern 11:00', flag: null, task: 'NOR-66',
      text: '<b>Nele</b>: Reichweiten-Auswertung — ein <b>Pin bringt viermal so viele Klicks</b> wie ein Instagram-Bild und läuft Monate weiter. Sie verschiebt Gewicht auf Pinterest.' },
    { id: 'f10', agent: 'ida', time: 'Gestern 14:20', flag: null, task: 'NOR-64',
      text: '<b>Ida</b> hat <b>„Bergziege Retro“</b> nachbewertet: Suchinteresse −31 % seit Mai — Empfehlung: auslaufen lassen.' },
    { id: 'f11', agent: 'mia', time: 'Gestern 08:45', flag: null, task: 'NOR-55',
      text: '<b>Mia</b>: Ranking-Check — 3 Keywords verbessert, <b>„maritime deko poster“</b> von 18 auf 21 gefallen (Wettbewerber neu).' },
    { id: 'f12', agent: 'otto', time: 'Gestern 07:30', flag: { type: 'ok', text: 'Routine' }, task: 'NOR-52',
      text: '<b>Otto</b> hat dein <b>Tagesbriefing</b> erstellt: Umsatz vorgestern 848 € (25 Bestellungen), 2 Punkte brauchen dich.' }
  ];

  // Ereignisse, die während der Demo "von selbst" eintrudeln (Hintergrund-Ticker)
  var liveEvents = [
    { agent: 'mia', flag: null, task: 'NOR-55',
      text: '<b>Mia</b>: Ranking-Aktualisierung — <b>„trail running shirt retro“</b> von Platz 8 auf <b>6</b> gestiegen.' },
    { agent: 'emma', flag: null, task: 'NOR-51',
      text: '<b>Emma</b> hat 2 neue Anfragen bearbeitet (Lieferstatus), beide automatisch gelöst.' },
    { agent: 'ida', flag: null, task: 'NOR-61',
      text: '<b>Ida</b> beobachtet <b>„Slow Hiking“</b>: Pinterest-Pins +9 % in 24 Std. — noch unter der Einstiegsschwelle.' },
    { agent: 'nele', flag: null, task: 'NOR-66',
      text: '<b>Nele</b>: der Pin <b>„Fjord Lines — Papierstruktur“</b> hat in 2 Stunden 1.240 Impressionen — überdurchschnittlich für die Uhrzeit.' },
    { agent: 'emma', flag: { type: 'ok', text: 'Bewertung' }, task: 'NOR-51',
      text: '<b>Emma</b> hat eine neue <b>5-Sterne-Bewertung</b> zu „Nordlicht“ beantwortet — Standardfall, ohne dich.' }
  ];

  /* --- Kundenservice ------------------------------------------------------ */
  var topics = [
    { key: 'Lieferstatus', share: 54, color: '#8B8B8B' },
    { key: 'Größentausch', share: 22, color: '#5E6AD2' },
    { key: 'Designwünsche', share: 11, color: '#D9739F' },
    { key: 'Sonstiges', share: 13, color: '#C9CDD2' }
  ];

  var firstNames = ['Lena', 'Jonas', 'Mara', 'Tim', 'Sophie', 'Niklas', 'Hanna', 'Erik', 'Julia', 'Ben', 'Nora', 'Lukas', 'Frieda', 'Ole', 'Clara', 'Finn', 'Mia', 'Paul', 'Ida', 'Jan', 'Emilia', 'Hendrik', 'Ronja', 'Malte', 'Greta', 'Simon', 'Alma', 'Tobias', 'Merle', 'Kai', 'Leonie', 'Arne'];
  var lastNames  = ['Brandt', 'Vogel', 'Sander', 'Kruse', 'Hoffmann', 'Lorenz', 'Bauer', 'Petersen', 'Wagner', 'Roth', 'Schuster', 'Behrens', 'Ahrens', 'Timm', 'Köhler', 'Nowak', 'Reimer', 'Faber', 'Otten', 'Diehl', 'Marquardt', 'Sievers', 'Hagen', 'Weber', 'Lange', 'Böhm', 'Kramer', 'Wolter', 'Jansen', 'Ricken', 'Stein', 'Prigge'];

  // Handgeschriebene Fälle (die, die man in der Demo öffnet)
  var tickets = [
    { id: 'tk1', no: '#1044', customer: 'Lena Brandt', topic: 'Sonstiges', channel: 'E-Mail', status: 'escalated',
      subject: 'Farbe des Drucks weicht ab', when: 'Gestern 16:22', order: 'NW-1044', design: 'd21',
      thread: [
        { from: 'customer', at: 'Gestern 16:22', text: 'Hallo, ich habe gestern das Shirt „Retro Trail“ bekommen. Der orange Ton sieht viel blasser aus als auf euren Bildern — fast rosa. Ich hänge ein Foto an. So hätte ich es nicht bestellt.' },
        { from: 'emma', at: 'Gestern 16:24', text: 'Hallo Frau Brandt, danke für das Foto — das sehe ich auch, der Terrakotta-Ton ist deutlich blasser als in unserer Vorschau. Ich prüfe das gerade beim Druckpartner und melde mich heute noch bei Ihnen.' },
        { from: 'emma', at: 'Gestern 16:41', text: '[interne Notiz] Druckauftrag geprüft: Printful hat Profil „Comfort Colors“ statt „Bella Canvas“ verwendet — Farbabweichung bestätigt, Reklamation berechtigt. Neudruck kostet 12,40 €. Erstattung/Neudruck liegt außerhalb meiner Rechte → eskaliert an dich (Freigabe a4).' }
      ],
      draft: 'Hallo Frau Brandt,\n\nSie haben recht — der Druck ist mit einem falschen Farbprofil gelaufen, der Ton weicht sichtbar ab. Das ärgert uns.\n\nWir drucken Ihr Shirt neu und schicken es Ihnen kostenlos zu, das alte können Sie behalten oder verschenken. Der Versand geht heute noch raus, in 3–4 Tagen sollte es bei Ihnen sein.\n\nDanke, dass Sie uns das Foto geschickt haben — dadurch haben wir den Fehler beim Druckpartner gefunden.\n\nViele Grüße\nNordwind Studio' },
    { id: 'tk2', no: '#1047', customer: 'Jonas Vogel', topic: 'Lieferstatus', channel: 'Shopify Inbox', status: 'escalated',
      subject: 'Sendung seit 6 Tagen ohne Bewegung', when: 'Heute 08:12', order: 'NW-1047', design: 'd12',
      thread: [
        { from: 'customer', at: 'Heute 08:12', text: 'Meine Bestellung ist laut Tracking seit dem 07.07. „im Zustelldepot“ und bewegt sich nicht. Ist das Paket weg?' },
        { from: 'emma', at: 'Heute 08:14', text: 'Guten Morgen Herr Vogel, ich habe das Tracking geprüft: die Sendung steht seit 6 Tagen still, das ist deutlich zu lang. Das sieht nach einem Verlust im Depot aus.' },
        { from: 'emma', at: 'Heute 08:15', text: '[interne Notiz] Tracking NW-1047: letzter Scan 07.07., DHL-Nachforschung nötig. Ersatzsendung wäre die schnelle Lösung (Kosten 18,60 €), liegt außerhalb meiner Rechte → an dich.' }
      ],
      draft: 'Hallo Herr Vogel,\n\ndie Sendung hängt seit sechs Tagen im Depot fest — dafür gibt es keine gute Erklärung, und ich möchte Sie nicht länger warten lassen.\n\nWir schicken Ihnen die Bestellung heute neu raus, versandkostenfrei und mit Priorität. Um die verschollene Sendung kümmern wir uns selbst, da müssen Sie nichts tun.\n\nEs tut uns leid für die Warterei.\n\nViele Grüße\nNordwind Studio' },
    { id: 'tk3', no: '#1039', customer: 'Mara Sander', topic: 'Größentausch', channel: 'E-Mail', status: 'solved',
      subject: 'Hoodie eine Nummer größer', when: 'Heute 07:58', order: 'NW-1039', design: 'd07',
      thread: [
        { from: 'customer', at: 'Heute 07:58', text: 'Hallo, der Hoodie „Wild & Frei“ in M ist mir zu eng. Kann ich gegen L tauschen?' },
        { from: 'emma', at: 'Heute 08:01', text: 'Hallo Frau Sander, klar. Ich habe Ihnen ein kostenloses Rücksendeetikett per Mail geschickt — legen Sie den Hoodie einfach in die Originalverpackung zurück.\n\nDen Hoodie in L habe ich bereits reserviert; sobald die Rücksendung gescannt ist, geht er automatisch raus. Sie müssen nichts weiter tun.\n\nViele Grüße\nEmma · Nordwind Studio' },
        { from: 'customer', at: 'Heute 08:44', text: 'Super, danke für die schnelle Antwort!' }
      ], draft: null },
    { id: 'tk4', no: '#1041', customer: 'Sophie Hoffmann', topic: 'Designwünsche', channel: 'Shopify Inbox', status: 'solved',
      subject: 'Gibt es „Fjord Lines“ auch als Leinwand?', when: 'Heute 07:31', order: null, design: 'd12',
      thread: [
        { from: 'customer', at: 'Heute 07:31', text: 'Hallo! Ich liebe das Fjord-Lines-Poster. Gibt es das auch als Leinwand in 40×60?' },
        { from: 'emma', at: 'Heute 07:33', text: 'Hallo Frau Hoffmann, freut mich! Als Leinwand haben wir aktuell nur „Nordlicht“ und „Polarstern“ — „Fjord Lines“ gibt es bisher als Poster A2 und A3.\n\nIch habe Ihren Wunsch an unser Design-Team weitergegeben; solche Anfragen sammeln wir und entscheiden danach über neue Formate. Wenn Sie möchten, melde ich mich, sobald es die Leinwand gibt.\n\nViele Grüße\nEmma · Nordwind Studio' },
        { from: 'customer', at: 'Heute 07:49', text: 'Ja gerne, sagen Sie Bescheid!' },
        { from: 'emma', at: 'Heute 07:50', text: '[interne Notiz] 4. Anfrage nach „Fjord Lines“ als Leinwand in 30 Tagen → Hinweis an Ida für die Formatprüfung.' }
      ], draft: null },
    { id: 'tk5', no: '#1046', customer: 'Tim Kruse', topic: 'Lieferstatus', channel: 'E-Mail', status: 'solved',
      subject: 'Wann kommt meine Bestellung?', when: 'Heute 09:04', order: 'NW-1046', design: 'd19',
      thread: [
        { from: 'customer', at: 'Heute 09:04', text: 'Guten Tag, wann wird meine Bestellung geliefert? Bestellnummer NW-1046.' },
        { from: 'emma', at: 'Heute 09:05', text: 'Guten Tag Herr Kruse, Ihre Bestellung (2× Poster „Nordlicht“) ist seit gestern 14:20 unterwegs — laut DHL-Tracking ist die Zustellung für morgen zwischen 10 und 14 Uhr geplant.\n\nHier ist Ihr Link zur Sendungsverfolgung: dhl.de/…/NW-1046\n\nViele Grüße\nEmma · Nordwind Studio' }
      ], draft: null },
    { id: 'tk6', no: '#1043', customer: 'Niklas Lorenz', topic: 'Sonstiges', channel: 'E-Mail', status: 'solved',
      subject: 'Rechnung für die Steuer', when: 'Gestern 11:12', order: 'NW-1043', design: null,
      thread: [
        { from: 'customer', at: 'Gestern 11:12', text: 'Hallo, ich bräuchte für mein Arbeitszimmer eine ordentliche Rechnung mit USt-Ausweis für die zwei Poster. Geht das?' },
        { from: 'emma', at: 'Gestern 11:14', text: 'Hallo Herr Lorenz, natürlich — die Rechnung mit ausgewiesener Umsatzsteuer (19 %) habe ich Ihnen gerade per Mail geschickt, als PDF im Anhang.\n\nWenn Sie eine abweichende Rechnungsanschrift oder eine USt-IdNr. brauchen, sagen Sie kurz Bescheid, dann stelle ich sie neu aus.\n\nViele Grüße\nEmma · Nordwind Studio' }
      ], draft: null }
  ];

  // Die übrigen Anfragen der letzten 7 Tage — aus Vorlagen erzeugt, jede mit echtem Verlauf
  var templates = {
    'Lieferstatus': [
      { s: 'Wo ist mein Paket?', c: 'Hallo, ich habe am {d} bestellt und noch keine Versandbestätigung bekommen. Ist die Bestellung angekommen?',
        e: 'Hallo {f}, Ihre Bestellung ist bei uns eingegangen und ging gestern in den Druck. Sobald das Paket den Druckpartner verlässt — voraussichtlich morgen —, bekommen Sie die Sendungsnummer automatisch per Mail.\n\nViele Grüße\nEmma · Nordwind Studio' },
      { s: 'Lieferung bis Freitag möglich?', c: 'Brauche das Shirt als Geschenk bis Freitag. Schafft ihr das?',
        e: 'Hallo {f}, das wird knapp, aber es geht: Druck 1–2 Tage, Versand 2 Tage. Ich habe Ihre Bestellung eben als vorrangig markiert, damit sie heute noch in den Druck geht.\n\nSollte es dennoch später werden, melde ich mich unaufgefordert bei Ihnen.\n\nViele Grüße\nEmma · Nordwind Studio' },
      { s: 'Sendung als zugestellt markiert, aber nicht da', c: 'DHL sagt zugestellt, ich habe aber nichts. Was nun?',
        e: 'Hallo {f}, das ist ärgerlich — meist liegt das Paket dann beim Nachbarn oder in einer Ablage. Im Tracking ist als Ablageort „{p}“ vermerkt.\n\nBitte schauen Sie dort einmal nach. Falls es bis morgen nicht auftaucht, schreiben Sie mir kurz — dann starten wir die Nachforschung und schicken Ersatz.\n\nViele Grüße\nEmma · Nordwind Studio' }
    ],
    'Größentausch': [
      { s: 'Shirt zu klein', c: 'Das Shirt in {sz} passt leider nicht, ich bräuchte eine Nummer größer.',
        e: 'Hallo {f}, kein Problem — das Rücksendeetikett ist per Mail unterwegs, die Rücksendung ist für Sie kostenlos.\n\nDie größere Größe habe ich reserviert; sie geht raus, sobald die Rücksendung gescannt wurde.\n\nViele Grüße\nEmma · Nordwind Studio' },
      { s: 'Frage zur Größentabelle', c: 'Ich bin zwischen {sz} und einer Nummer größer. Fallen die Hoodies eher klein aus?',
        e: 'Hallo {f}, die Hoodies fallen normal bis leicht groß aus — wer es körpernah mag, bleibt bei {sz}, wer es locker mag, nimmt eine Nummer größer.\n\nZur Orientierung: Brustweite {sz} = 55 cm flach gemessen. Und falls es doch nicht passt: Tausch ist kostenlos.\n\nViele Grüße\nEmma · Nordwind Studio' }
    ],
    'Designwünsche': [
      { s: 'Motiv auf anderem Produkt', c: 'Gibt es das Motiv auch auf einer Tasse?',
        e: 'Hallo {f}, auf einer Tasse gibt es dieses Motiv bisher nicht — das Format ist deutlich schmaler, das Motiv müsste dafür neu aufgebaut werden.\n\nIch habe Ihren Wunsch an unser Design-Team weitergegeben. Solche Anfragen sammeln wir; bei genug Interesse setzen wir es um.\n\nViele Grüße\nEmma · Nordwind Studio' },
      { s: 'Wunschfarbe', c: 'Gibt es das Shirt auch in Dunkelgrün?',
        e: 'Hallo {f}, aktuell nicht — für dieses Motiv haben wir Creme, Sand und Schwarz im Sortiment.\n\nDunkelgrün ist als Textilfarbe verfügbar, das Motiv müsste dafür farblich angepasst werden. Ich habe den Wunsch notiert und ans Design-Team gegeben.\n\nViele Grüße\nEmma · Nordwind Studio' }
    ],
    'Sonstiges': [
      { s: 'Waschhinweise', c: 'Wie wasche ich das Shirt, damit der Druck hält?',
        e: 'Hallo {f}, am besten auf links, bei 30 °C, ohne Weichspüler — und nicht in den Trockner. So bleibt der Druck jahrelang wie am ersten Tag.\n\nViele Grüße\nEmma · Nordwind Studio' },
      { s: 'Nachhaltigkeit der Textilien', c: 'Sind die Shirts wirklich Bio-Baumwolle?',
        e: 'Hallo {f}, ja — die Shirts sind aus 100 % Bio-Baumwolle (GOTS-zertifiziert), gedruckt wird auf Bestellung, damit nichts auf Halde produziert wird.\n\nDie Zertifikatsnummer finden Sie auf der Produktseite unter „Material“.\n\nViele Grüße\nEmma · Nordwind Studio' },
      { s: 'Rechnung nicht erhalten', c: 'Ich finde die Rechnung nicht in meinen Mails.',
        e: 'Hallo {f}, ich habe sie Ihnen gerade erneut geschickt — bitte schauen Sie auch kurz im Spam-Ordner nach.\n\nViele Grüße\nEmma · Nordwind Studio' }
    ]
  };

  (function buildRestTickets() {
    var r = prng(84210);
    var sizes = ['S', 'M', 'L', 'XL'];
    var places = ['Garage', 'Hinterhof', 'bei Nachbar Reimer'];
    var counts = { 'Lieferstatus': 21, 'Größentausch': 8, 'Designwünsche': 4, 'Sonstiges': 5 };
    // handgeschriebene Fälle abziehen
    counts['Lieferstatus'] -= 2; counts['Größentausch'] -= 1; counts['Designwünsche'] -= 1; counts['Sonstiges'] -= 2;
    var no = 1005;
    Object.keys(counts).forEach(function (topic) {
      for (var k = 0; k < counts[topic]; k++) {
        var tpl = templates[topic][Math.floor(r() * templates[topic].length)];
        var fn = firstNames[Math.floor(r() * firstNames.length)];
        var ln = lastNames[Math.floor(r() * lastNames.length)];
        var dayBack = Math.floor(r() * 7);
        var d = addDays(TODAY, -dayBack);
        var hh = 8 + Math.floor(r() * 11), mm = Math.floor(r() * 60);
        var stamp = (dayBack === 0 ? 'Heute ' : dayBack === 1 ? 'Gestern ' : String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '. ') +
                    String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
        var sz = sizes[Math.floor(r() * sizes.length)];
        var fill = function (s) {
          return s.replace('{f}', fn).replace('{sz}', sz).replace('{sz}', sz)
                  .replace('{d}', String(addDays(d, -3).getDate()).padStart(2, '0') + '.' + String(addDays(d, -3).getMonth() + 1).padStart(2, '0') + '.')
                  .replace('{p}', places[Math.floor(r() * places.length)]);
        };
        var replyMin = 2 + Math.floor(r() * 5);
        tickets.push({
          id: 'tg' + no, no: '#' + (no++), customer: fn + ' ' + ln, topic: topic,
          channel: r() > 0.45 ? 'E-Mail' : 'Shopify Inbox', status: 'solved',
          subject: tpl.s, when: stamp, order: 'NW-' + (1000 + Math.floor(r() * 60)), design: null,
          thread: [
            { from: 'customer', at: stamp, text: fill(tpl.c) },
            { from: 'emma', at: stamp.replace(/(\d\d):(\d\d)$/, function (_, h, m) {
                var t = parseInt(m, 10) + replyMin, hh2 = parseInt(h, 10) + (t >= 60 ? 1 : 0);
                return String(hh2).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
              }), text: fill(tpl.e) }
          ],
          draft: null
        });
      }
    });
  })();

  /* --- Social ------------------------------------------------------------- */
  // Anteile statt absoluter Zahlen: die Kanäle teilen sich den Social-Traffic
  // (15 % laut D.traffic) — dadurch rechnet auch der Zeitraum-Schalter mit.
  var socialChannels = [
    { id: 'pinterest', name: 'Pinterest', color: '#C8232C', share: 55, revShare: 62,
      followers: 4820, growth: 312, posts30: 26,
      role: 'Der Kanal für Poster — Pins laufen monatelang weiter.',
      note: 'Ein Pin bringt im Schnitt 8 Monate lang Klicks. Deshalb liegt hier der Schwerpunkt.' },
    { id: 'instagram', name: 'Instagram', color: '#C13584', share: 30, revShare: 29,
      followers: 2140, growth: 96, posts30: 14,
      role: 'Textil und Gesicht der Marke — Reels vor Bildern.',
      note: 'Reels erreichen hier das Vierfache eines Bildbeitrags, kosten Nele aber auch mehr Arbeit.' },
    { id: 'tiktok', name: 'TikTok', color: '#2B2B2B', share: 15, revShare: 9,
      followers: 610, growth: 184, posts30: 7,
      role: 'Jung, wächst schnell, kauft (noch) wenig.',
      note: 'Stärkstes Wachstum, schwächster Umsatz — Nele hält es klein, bis sich das dreht.' }
  ];

  var socialPosts = [
    { id: 'sp1', channel: 'pinterest', design: 'd12', kind: 'Pin', when: 'Di 15:30', status: 'live',
      title: 'Fjord Lines — Poster A2 im Wohnzimmer',
      text: 'Ruhige Linien, warmes Licht: „Fjord Lines“ über dem Sofa. Gedruckt auf 200 g Naturpapier.',
      reach: 12400, clicks: 340, orders: 11, revenue: 380 },
    { id: 'sp2', channel: 'pinterest', design: 'd19', kind: 'Pin', when: 'Mo 09:15', status: 'live',
      title: 'Nordlicht Serie — 3er-Wand',
      text: 'Drei Poster, eine Wand, ein Abend Arbeit. Die „Nordlicht“-Serie als Triptychon.',
      reach: 9800, clicks: 262, orders: 8, revenue: 290 },
    { id: 'sp3', channel: 'instagram', design: 'd21', kind: 'Reel', when: 'Mi 18:00', status: 'live',
      title: 'Retro Trail — vom Entwurf zum Shirt',
      text: '15 Sekunden: Idas Trendfund, Theos Entwurf, der fertige Druck. So entsteht ein Motiv bei uns.',
      reach: 18600, clicks: 410, orders: 9, revenue: 268 },
    { id: 'sp4', channel: 'instagram', design: 'd07', kind: 'Bild', when: 'Di 12:00', status: 'live',
      title: 'Wild & Frei — unterwegs',
      text: 'Bio-Baumwolle, unisex, für Tage ohne Empfang.',
      reach: 5200, clicks: 118, orders: 4, revenue: 122 },
    { id: 'sp5', channel: 'tiktok', design: 'd21', kind: 'Video', when: 'Do 17:20', status: 'live',
      title: 'Warum 1984 gerade zurückkommt',
      text: 'Retro-Laufsport ist überall — wir zeigen, woher die Farben kommen.',
      reach: 24100, clicks: 196, orders: 3, revenue: 89 },
    { id: 'sp6', channel: 'pinterest', design: 'd17', kind: 'Pin', when: 'Fr 08:00', status: 'live',
      title: 'Polarstern — Poster für den Winter',
      text: 'Klare Nacht, klare Linien. Ab September das meistgesuchte Motiv.',
      reach: 7300, clicks: 184, orders: 5, revenue: 178 },
    { id: 'sp7', channel: 'pinterest', design: 'd15', kind: 'Pin', when: 'Sa 10:40', status: 'live',
      title: 'Küstenwind — Beutel & Poster',
      text: 'Zwei Formate, ein Motiv. Für alle, die das Meer im Kopf behalten wollen.',
      reach: 6100, clicks: 143, orders: 4, revenue: 131 },
    { id: 'sp8', channel: 'instagram', design: 'd12', kind: 'Story', when: 'Heute 09:00', status: 'live',
      title: 'Frage an euch: Sand oder Petrol?',
      text: 'Wir überlegen eine zweite Farbe für „Fjord Lines“. Stimmt ab.',
      reach: 3400, clicks: 88, orders: 2, revenue: 64 }
  ];

  // Neles Wochenplan — wartet als Ganzes auf Freigabe (Approval a7)
  var socialPlan = [
    { id: 'pl1', channel: 'pinterest', design: 'd12', kind: 'Pin', when: 'Morgen 08:00',
      title: 'Fjord Lines — Detailaufnahme Papierstruktur',
      text: 'Nah dran: 200 g Naturpapier, sichtbare Faser, kein Glanz. So fühlt sich „Fjord Lines“ an.' },
    { id: 'pl2', channel: 'pinterest', design: 'd19', kind: 'Pin', when: 'Morgen 15:00',
      title: 'Nordlicht — Poster über dem Bett',
      text: 'Dunkle Wand, helles Motiv. „Nordlicht“ funktioniert genau dort am besten.' },
    { id: 'pl3', channel: 'instagram', design: 'd21', kind: 'Reel', when: 'Do 18:00',
      title: 'Retro Trail — 3 Farben, 3 Stimmungen',
      text: 'Terrakotta, Senf, Creme. Welche würdest du tragen?' },
    { id: 'pl4', channel: 'pinterest', design: 'd17', kind: 'Pin', when: 'Fr 08:00',
      title: 'Polarstern — Winterthema früh besetzen',
      text: 'Pinterest plant im Juli den Dezember. Deshalb geht das Wintermotiv jetzt raus.' },
    { id: 'pl5', channel: 'instagram', design: 'd07', kind: 'Bild', when: 'Fr 12:00',
      title: 'Wild & Frei — Kundenfoto',
      text: 'Von Marie aus Kiel, mit ihrer Erlaubnis. Danke dafür.' },
    { id: 'pl6', channel: 'tiktok', design: 'd23', kind: 'Video', when: 'Sa 17:00',
      title: 'Gipfelstürmer — der Entwurf in 20 Sekunden',
      text: 'Von der ersten Linie bis zum fertigen Druck.' },
    { id: 'pl7', channel: 'pinterest', design: 'd05', kind: 'Pin', when: 'So 10:00',
      title: 'Salzluft — minimalistisch wohnen',
      text: 'Weniger Motiv, mehr Wand. Für ruhige Räume.' },
    { id: 'pl8', channel: 'instagram', design: 'd12', kind: 'Story', when: 'So 19:00',
      title: 'Ergebnis der Farb-Umfrage',
      text: 'Ihr habt entschieden — wir zeigen, was daraus wird.' },
    { id: 'pl9', channel: 'pinterest', design: 'd09', kind: 'Pin', when: 'Mo 08:00',
      title: 'Waldläufer — Hoodie im Herbstlicht',
      text: 'Der ruhigste Entwurf im Sortiment, jetzt in seiner Jahreszeit.' }
  ];

  /* --- Bewertungen --------------------------------------------------------- */
  // „Rating“ ist etwas anderes als „Ranking“: hier zählen Sterne, nicht Positionen.
  var reviews = [
    { id: 'rv1', design: 'd21', product: 'Retro Trail Shirt „Bahnen“', stars: 2, author: 'Lena B.',
      when: 'Gestern 16:40', title: 'Farbe weicht deutlich ab', source: 'Shopify', ticket: 'tk1', status: 'open',
      text: 'Das Motiv ist schön, aber der orange Ton ist viel blasser als auf den Produktbildern — fast rosa. Schade, ich hatte mich gefreut.',
      reply: null,
      draft: 'Hallo Lena,\n\nSie haben recht, und der Fehler liegt bei uns: Ihr Shirt ist mit einem falschen Farbprofil gelaufen. Wir drucken es neu und schicken es Ihnen kostenlos zu.\n\nDanke, dass Sie das Foto geschickt haben — dadurch haben wir den Fehler beim Druckpartner gefunden und für alle künftigen Drucke korrigiert.\n\nViele Grüße\nNordwind Studio' },
    { id: 'rv2', design: 'd12', product: 'Fjord Lines Poster A2', stars: 1, author: 'Jonas V.',
      when: 'Heute 08:30', title: 'Nie angekommen', source: 'Shopify', ticket: 'tk2', status: 'open',
      text: 'Seit sechs Tagen im Zustelldepot, keine Bewegung, keine Info. Für den Preis erwarte ich mehr.',
      reply: null,
      draft: 'Hallo Jonas,\n\ndie Sendung hängt seit sechs Tagen im Depot fest — dafür gibt es keine gute Erklärung, und der Ärger ist berechtigt.\n\nWir haben Ihre Bestellung heute neu und mit Priorität rausgeschickt, versandkostenfrei. Um die verschollene Sendung kümmern wir uns selbst.\n\nViele Grüße\nNordwind Studio' },
    { id: 'rv3', design: 'd07', product: 'Wild & Frei Hoodie', stars: 2, author: 'Sarah K.',
      when: '09.07. 11:20', title: 'Druck nach dem Waschen matt', source: 'Shopify', ticket: null, status: 'open',
      text: 'Nach zweimal Waschen bei 40 Grad wirkt der Druck stumpf. Beim Shirt meiner Schwester ist das nicht passiert.',
      reply: null,
      draft: 'Hallo Sarah,\n\n40 Grad sind für den Druck schon grenzwertig — empfohlen sind 30 Grad auf links und kein Trockner. Das steht bei uns bisher nur klein auf der Produktseite, das ändern wir.\n\nWeil der Hinweis bei Ihnen untergegangen ist, schicken wir Ihnen einen neuen Hoodie. Behalten Sie den alten gern als Arbeitsstück.\n\nViele Grüße\nNordwind Studio' },
    { id: 'rv4', design: 'd12', product: 'Fjord Lines Poster A2', stars: 5, author: 'Miriam T.',
      when: 'Heute 07:10', title: 'Genau wie erhofft', source: 'Shopify', ticket: null, status: 'answered',
      text: 'Die Farben sind gedeckt und ruhig, das Papier fühlt sich hochwertig an. Hängt jetzt im Flur und wird jedes Mal kommentiert.',
      reply: { text: 'Vielen Dank, Miriam! Das Papier war eine bewusste Entscheidung — matt statt glänzend, damit die Linien ruhig bleiben. Schön, dass es ankommt.', at: 'Heute 07:34' }, draft: null },
    { id: 'rv5', design: 'd19', product: 'Nordlicht Poster A3', stars: 5, author: 'Timo R.',
      when: 'Gestern 20:15', title: 'Drittes Poster bei euch', source: 'Shopify', ticket: null, status: 'answered',
      text: 'Sammle die Serie langsam. Versand war schnell, Verpackung stabil in der Rolle, nichts geknickt.',
      reply: { text: 'Danke, Timo! Die Rolle ist bewusst eine Nummer dicker als nötig — geknickte Poster sind der häufigste Ärger im Versand. Freut uns, dass die Serie wächst.', at: 'Gestern 20:48' }, draft: null },
    { id: 'rv6', design: 'd21', product: 'Retro Trail Shirt „Bahnen“', stars: 5, author: 'Nils P.',
      when: '11.07. 14:05', title: 'Endlich mal ein Laufshirt ohne Logo-Schlacht', source: 'Shopify', ticket: null, status: 'answered',
      text: 'Sitzt gut, Motiv ist zurückhaltend, Baumwolle angenehm. Genau das habe ich lange gesucht.',
      reply: { text: 'Danke, Nils! Genau der Gedanke stand hinter dem Motiv — Retro-Laufsport ohne Marken-Getöse. Viel Freude damit.', at: '11.07. 14:52' }, draft: null },
    { id: 'rv7', design: 'd15', product: 'Küstenwind Beutel', stars: 4, author: 'Anke M.',
      when: '10.07. 09:40', title: 'Schön, Versand etwas lang', source: 'Shopify', ticket: null, status: 'answered',
      text: 'Der Beutel ist toll bedruckt und stabil. Acht Tage bis zur Lieferung fand ich aber lang.',
      reply: { text: 'Danke, Anke! Wir drucken erst nach Bestellung — das spart Lagerware, kostet aber ein paar Tage. Acht waren dennoch zu viel, wir schauen uns die Laufzeit beim Druckpartner an.', at: '10.07. 10:12' }, draft: null },
    { id: 'rv8', design: 'd03', product: 'Bergziege Retro Tasse', stars: 3, author: 'Kai H.',
      when: '08.07. 18:25', title: 'Motiv kleiner als gedacht', source: 'Shopify', ticket: null, status: 'answered',
      text: 'Auf den Bildern wirkt die Bergziege größer. Qualität ist ok, aber ich hatte mir mehr Präsenz vorgestellt.',
      reply: { text: 'Danke für den Hinweis, Kai. Wir haben daraufhin ein Foto mit Größenvergleich zur Produktseite ergänzt — das war vorher nicht eindeutig genug.', at: '08.07. 19:03' }, draft: null },
    { id: 'rv9', design: 'd17', product: 'Polarstern Poster A2', stars: 5, author: 'Helena W.',
      when: '07.07. 12:30', title: 'Geschenk, das gesessen hat', source: 'Shopify', ticket: null, status: 'answered',
      text: 'Für meinen Vater gekauft, der seit Jahren von Lappland erzählt. Er hat es sofort aufgehängt.',
      reply: { text: 'Das freut uns sehr, Helena — danke fürs Erzählen. Grüße an Ihren Vater.', at: '07.07. 13:15' }, draft: null }
  ];

  // Der Rest der 79 Bewertungen — kurz, echt formuliert, aus Vorlagen erzeugt.
  var reviewTemplates = [
    { s: 5, t: 'Sehr zufrieden', x: 'Druck ist sauber, Farben wie abgebildet. Gerne wieder.' },
    { s: 5, t: 'Schnell und schön', x: 'Nach vier Tagen da, tadellos verpackt. Motiv wirkt in echt noch besser.' },
    { s: 5, t: 'Tolle Qualität', x: 'Der Stoff ist dicker als bei anderen Shops, das merkt man sofort.' },
    { s: 5, t: 'Genau mein Stil', x: 'Zurückhaltend, gut gedruckt, keine grellen Farben. Passt.' },
    { s: 5, t: 'Zweite Bestellung', x: 'Beim ersten Mal überzeugt, deshalb gleich nachbestellt.' },
    { s: 5, t: 'Als Geschenk perfekt', x: 'Kam pünktlich vor dem Geburtstag an und ist gut angekommen.' },
    { s: 4, t: 'Gut, kleine Abzüge', x: 'Alles in Ordnung — der Karton war leicht angestoßen, Inhalt aber heil.' },
    { s: 4, t: 'Schönes Motiv', x: 'Gefällt mir gut. Etwas kräftigere Farben hätte ich noch schöner gefunden.' },
    { s: 4, t: 'Passt', x: 'Größe stimmt, Druck sitzt. Für den Preis in Ordnung.' },
    { s: 3, t: 'Solide, nicht mehr', x: 'Nichts falsch gemacht, aber auch nichts, was mich begeistert hätte.' }
  ];

  (function buildRestReviews() {
    var r = prng(730915);
    // Zielverteilung minus die handgeschriebenen: 54× 5★, 13× 4★, 3× 3★
    var plan = [];
    for (var i = 0; i < 54; i++) plan.push(5);
    for (var j = 0; j < 13; j++) plan.push(4);
    for (var k = 0; k < 3; k++) plan.push(3);
    var designPool = designs.filter(function (d) { return d.status !== 'paused'; });
    plan.forEach(function (stars, idx) {
      var pool = reviewTemplates.filter(function (t) { return t.s === stars; });
      var tpl = pool[Math.floor(r() * pool.length)];
      var d = designPool[Math.floor(r() * designPool.length)];
      var fn = firstNames[Math.floor(r() * firstNames.length)];
      var ln = lastNames[Math.floor(r() * lastNames.length)];
      var back = Math.floor(r() * 28);
      var dt = addDays(TODAY, -back);
      var stamp = (back === 0 ? 'Heute ' : back === 1 ? 'Gestern ' :
        String(dt.getDate()).padStart(2, '0') + '.' + String(dt.getMonth() + 1).padStart(2, '0') + '. ') +
        String(8 + Math.floor(r() * 12)).padStart(2, '0') + ':' + String(Math.floor(r() * 60)).padStart(2, '0');
      reviews.push({
        id: 'rg' + idx, design: d.id, product: d.name, stars: stars,
        author: fn + ' ' + ln.charAt(0) + '.', when: stamp, title: tpl.t,
        source: 'Shopify', ticket: null, status: 'answered', text: tpl.x,
        reply: { text: 'Danke für die Bewertung! Freut uns, dass es passt.', at: stamp }, draft: null
      });
    });
  })();

  /* --- Connectors --------------------------------------------------------- */
  var connectors = [
    { id: 'shopify', name: 'Shopify', label: 'Shopify', status: 'ok', shop: 'nordwind-studio.myshopify.com',
      sync: 'vor 4 Min.', scope: ['Bestellungen & Umsätze', 'Produkte & Listings', 'Kunden-Nachrichten (Inbox)'],
      writes: 'Listings, Preise und Metadaten — nur nach deiner Freigabe.' },
    { id: 'ga4', name: 'Google Analytics 4', label: 'GA4', status: 'ok', shop: 'Property 481 205 993',
      sync: 'vor 4 Min.', scope: ['Sitzungen & Quellen', 'Conversion-Funnel', 'Ereignisse'],
      writes: 'Nur lesend.' },
    { id: 'gsc', name: 'Search Console', label: 'Search Console', status: 'ok', shop: 'nordwind-studio.de',
      sync: 'vor 22 Min.', scope: ['Keyword-Positionen', 'Klicks & Impressionen', 'Indexierungsstatus'],
      writes: 'Nur lesend. Neue URLs meldet Mia zur Indexierung an.' },
    { id: 'printful', name: 'Printful', label: 'Printful', status: 'ok', shop: 'Store #4471',
      sync: 'vor 11 Min.', scope: ['Druckkosten je Bestellung', 'Produktionsstatus', 'Rechnungen & Payouts'],
      writes: 'Neudrucke — nur nach deiner Freigabe.' },
    { id: 'pinterest', name: 'Pinterest', label: 'Pinterest', status: 'ok', shop: 'nordwindstudio',
      sync: 'vor 18 Min.', scope: ['Impressionen & Klicks je Pin', 'Follower-Entwicklung', 'Welche Pins Umsatz bringen'],
      writes: 'Pins veröffentlichen — nur nach deiner Freigabe.' },
    { id: 'instagram', name: 'Instagram', label: 'Instagram', status: 'ok', shop: '@nordwindstudio',
      sync: 'vor 18 Min.', scope: ['Reichweite je Beitrag', 'Follower & Interaktionen', 'Klicks aus der Bio'],
      writes: 'Beiträge & Storys veröffentlichen — nur nach deiner Freigabe.' },
    { id: 'tiktok', name: 'TikTok', label: 'TikTok', status: 'ok', shop: '@nordwindstudio',
      sync: 'vor 26 Min.', scope: ['Aufrufe & Watchtime', 'Follower-Entwicklung', 'Profilklicks'],
      writes: 'Videos veröffentlichen — nur nach deiner Freigabe.' },
    { id: 'reviews', name: 'Shopify Bewertungen', label: 'Bewertungen', status: 'ok', shop: 'Produkt- & Shop-Rating',
      sync: 'vor 4 Min.', scope: ['Sterne & Texte je Produkt', 'Shop-Gesamtwertung', 'Unbeantwortete Bewertungen'],
      writes: 'Antworten veröffentlichen — bei 1–3 Sternen nur nach deiner Freigabe.' }
  ];

  /* --- Otto-Chat: Wissen aus genau diesen Daten --------------------------- */
  var chatSuggestions = [
    'Wie lief die Woche?',
    'Was kosten mich die Agenten?',
    'Welches Design soll ich pushen?',
    'Warum ist der Rohertrag so hoch?',
    'Was liegt bei mir zur Freigabe?',
    'Wo verliere ich Ranking?',
    'Was bringt mir Social?',
    'Wie stehen meine Bewertungen?'
  ];

  var chatKnowledge = [
    { keys: ['woche', 'wie läuft', 'wie lief', 'überblick', 'briefing', 'zusammenfassung', 'status'],
      answer: 'Kurz zusammengefasst:\n\n• **Umsatz** 30 Tage: {rev30} € ({revTrend} vs. Vormonat) bei {orders30} Bestellungen.\n• **Rohertrag** nach Druck und Gebühren: {gross30} € — das sind {margin} %.\n• **Neu live**: „Retro Trail“ hat in 11 Tagen 1.960 € gemacht, der beste Start bisher.\n• **Bei dir liegen {openApprovals} Freigaben** — die größte davon sind Theos 4 Designs.\n\nDas Einzige, was mir Sorgen macht: „Bergziege Retro“ verliert seit Mai stetig. Ida empfiehlt, es auslaufen zu lassen.' },
    { keys: ['kosten', 'kostet', 'teuer', 'preis', 'rechnet', 'roi', 'lohnt'],
      answer: 'Die {agentCount} Agenten kosten dich im Juli **{agentCost} €**.\n\nDavon entfallen 20 € auf den Claude-Zugang und der Rest auf Verbrauch. Emma läuft auf einem lokalen Modell auf deinem Server — sie kostet nichts außer Strom.\n\nDagegen stehen rund **{hoursSaved} Stunden** Arbeit, die diesen Monat nicht bei dir gelandet sind. Wenn du deine Stunde mit 45 € ansetzt, sind das etwa {hoursValue} €.\n\nZum Vergleich: deine Google-Ads haben im selben Zeitraum {ads30} € gekostet.' },
    { keys: ['design', 'pushen', 'bestseller', 'welches', 'motiv'],
      answer: 'Ich würde auf **„Fjord Lines“** setzen: 4.320 € in 30 Tagen, Trend stabil, und Ida hat schon eine Farbvariante „Sand“ vorbereitet (NOR-63) — das ist der billigste Weg zu mehr Umsatz, weil das Motiv steht.\n\nDer zweite Kandidat ist **„Retro Trail“**: 1.960 € in nur 11 Tagen seit dem Start. Wenn der Trend hält, überholt es „Nordlicht“ im August.\n\nFinger weg von **„Bergziege Retro“** und **„Seemannsgarn“** — beide fallen seit Wochen.' },
    { keys: ['rohertrag', 'marge', 'gewinn', 'verdiene', 'ertrag'],
      answer: 'Der Rohertrag von **{gross30} €** ist Umsatz minus Druckkosten minus Zahlungsgebühren:\n\n{rev30} € − {print30} € (Printful) − {fees30} € (Shopify/PayPal) = **{gross30} €**, also {margin} %.\n\nDas ist für Print-on-Demand ordentlich: Poster liegen bei rund 58 % Marge, Shirts bei 51 % — und dein Poster-Anteil wächst.\n\nDavon gehen noch {ads30} € Werbung, 149 € Software und {agentCost} € Agenten ab. Bleibt ein Betriebsergebnis von rund **{operating} €**.' },
    { keys: ['freigabe', 'freigeben', 'liegt bei mir', 'offen', 'genehmig', 'warten'],
      answer: 'Bei dir liegen **{openApprovals} Freigaben**. Der Reihe nach, wie ich sie sortieren würde:\n\n1. **Theos 4 Designs „Nordic Trails“** — 24 fertige Listings. Größter Hebel, kostet dich einen Klick.\n2. **Emmas zwei Support-Fälle** — ein Neudruck (12,40 €) und eine Ersatzsendung (18,60 €). Beide Kunden warten, einer hat schon einen Stern gegeben.\n3. **Neles Social-Wochenplan** — 9 Beiträge aus vorhandenen Designs, nichts Neues zu produzieren.\n4. **Karlas USt-Voranmeldung** — Frist ist der 10.08., das eilt heute nicht.\n5. **Mias Blogartikel** — SEO wirkt ohnehin erst in Wochen.\n\nWenn du nur zwei Sachen machst: die Designs und die beiden Kunden.' },
    { keys: ['ranking', 'seo', 'google', 'keyword', 'position', 'verliere'],
      answer: 'Verloren hast du eigentlich nur an einer Stelle: **„maritime deko poster“** ist von 18 auf 21 gefallen, weil ein Wettbewerber eine neue Seite gebaut hat. Das Keyword hängt an „Seemannsgarn“, das ohnehin ausläuft — ich würde es ziehen lassen.\n\nSonst geht es nach oben: {top10} Keywords stehen in den Top 10, {top10Delta} mehr als im Vormonat. Am stärksten: „trail running shirt retro“ von 41 auf 8 — das kam mit dem neuen Design.\n\nMia hat zwei Vorschläge offen: Alt-Texte für 38 Bilder (8 Min. Arbeit) und der Ausbau der Hoodie-Seite.' },
    { keys: ['trend', 'nische', 'neue', 'ida', 'radar'],
      answer: 'Ida hat heute früh **„Retro Trail Running“** gemeldet: +140 % Suchinteresse in 90 Tagen, 4.800 Suchanfragen im Monat, und auf Etsy nur 340 konkurrierende Listings. Sie hat direkt einen Design-Brief geschrieben, Theo hat daraus vier Entwürfe gemacht — die liegen bei dir zur Freigabe.\n\nZwei weitere Nischen beobachtet sie noch: „Slow Hiking“ (+64 %, Konkurrenz zieht an) und „Nordische Minimal-Karten“ (+38 %, aber Preisverfall).\n\nDas ist übrigens genau der Kreislauf: Ida findet, Theo baut, du entscheidest.' },
    { keys: ['support', 'kunden', 'emma', 'anfragen', 'tickets'],
      answer: 'Emma hat in den letzten 7 Tagen **{ticketsTotal} Anfragen** bearbeitet und {ticketsSolved} davon selbst gelöst — das sind {solveRate} %.\n\nÜber die Hälfte davon sind Lieferstatus-Fragen, die sie direkt aus dem Tracking beantwortet. Ø Erstantwort: 4 Minuten.\n\n**{ticketsOpen} Fälle liegen bei dir**: der Farbfehler bei #1044 und die verschollene Sendung #1047. Beides Fälle, wo Geld fließt — deshalb fragt sie nach.' },
    { keys: ['buchhaltung', 'karla', 'belege', 'steuer', 'ustva', 'umsatzsteuer', 'datev'],
      answer: 'Karla hat im Juli **{receipts} Belege** automatisch erfasst und zugeordnet — Druckkosten, Gebühren, Werbung und die Abos.\n\nEinen konnte sie nicht sicher zuordnen: **Nordisk Papir A/S über 184 €**. Da wartet sie auf dein Konto, das findest du in der Buchhaltung.\n\nDie **USt-Voranmeldung für Juni** liegt fertig bei dir: Zahllast **{ustvaPay}**, gerechnet aus {receiptsJune} Belegen und gegen die Payouts geprüft. Übermittelt wird erst, wenn du freigibst.' },
    { keys: ['sicher', 'kontrolle', 'selbst', 'ohne mich', 'dürfen', 'rechte'],
      answer: 'Nichts, was Geld kostet oder öffentlich wird, passiert ohne dich.\n\nDie Agenten dürfen **lesen, recherchieren, entwerfen und vorbereiten** — aber Listings live stellen, Erstattungen auslösen, Steuern übermitteln oder Artikel veröffentlichen geht nur über eine Freigabe von dir. Das siehst du an jedem Agenten in seinem Rechte-Profil.\n\nDeshalb ist die Freigabe-Spalte die eigentliche Steuerzentrale: dein Tag besteht aus vier Klicks, nicht aus vier Stunden.' },
    { keys: ['warenkorb', 'bestellwert', 'aov', 'durchschnitt'],
      answer: 'Der durchschnittliche Bestellwert liegt bei **{aov} €** ({orders30} Bestellungen auf {rev30} € Umsatz).\n\nDer stärkste Hebel dafür wären Bundles — Theo hat ein 3er-Poster-Bundle für „Nordlicht“ schon als Entwurf fertig. Poster werden ohnehin oft zu zweit gekauft.' },
    { keys: ['traffic', 'besucher', 'sessions', 'woher', 'quelle'],
      answer: 'In 30 Tagen: **{sessions30} Sitzungen**.\n\nDie größte Quelle ist die organische Suche mit 42 % — die ist seit Mias Arbeit um 18 % gewachsen und kostet dich nichts. Google Ads bringt 16 % und kostet {ads30} €.\n\nDas ist der eigentliche Punkt: der Anteil, den du bezahlst, wird kleiner, während der Umsatz wächst.' },
    { keys: ['social', 'pinterest', 'instagram', 'tiktok', 'nele', 'follower', 'reichweite', 'posten'],
      answer: 'Social bringt dir **{socialSessions} Sitzungen** in 30 Tagen — 15 % deines Traffics — und rund **{socialRevenue} €** Umsatz.\n\nDie Verteilung ist eindeutig: **Pinterest** macht 55 % davon. Ein Pin läuft im Schnitt acht Monate weiter, ein Instagram-Bild ist nach zwei Tagen tot. Deshalb hat Nele das Gewicht dorthin verschoben.\n\n**TikTok** wächst am schnellsten (+184 Follower im Monat), verkauft aber am wenigsten — sie hält es bewusst klein, bis sich das dreht.\n\nIhr **Wochenplan mit 9 Beiträgen** liegt bei dir zur Freigabe. Nichts davon muss neu produziert werden, alles baut auf Designs, die du schon hast.' },
    { keys: ['bewertung', 'sterne', 'rating', 'rezension', 'kritik', 'unzufrieden', 'beschwer'],
      answer: 'Dein Shop steht bei **{ratingAvg} von 5 Sternen** aus {reviewCount} Bewertungen — das sind {reviewRate} % deiner Bestellungen, ein normaler Wert.\n\n**{reviewsOpen} Bewertungen warten auf eine Antwort**, alle mit drei Sternen oder weniger. Emma hat für jede einen Entwurf geschrieben, sendet aber nicht selbst: Bei Kritik steht ein Kulanzangebot im Text, und das ist deine Entscheidung.\n\nInteressanter als die Sterne ist das Muster dahinter: Ida hat die kritischen Bewertungen sortiert — **nur zwei davon betreffen einen echten Fehler** (ein Fehldruck, ein verschollenes Paket). Der Rest sind Erwartungen an Pflege und Motivgröße. Das ist kein Design-Problem, sondern eine Zeile auf der Produktseite.' },
    { keys: ['ranking oder rating', 'unterschied', 'ranking rating'],
      answer: 'Zwei verschiedene Dinge, die oft verwechselt werden:\n\n**Ranking** ist deine Position bei Google — Platz 1 bis 100. Daran arbeitet Mia. Aktuell: {top10} Keywords in den Top 10.\n\n**Rating** sind die Sterne, die Kunden dir geben. Aktuell {ratingAvg} von 5. Darum kümmert sich Emma.\n\nDer Zusammenhang: Das Ranking bringt Leute in den Shop, das Rating entscheidet, ob sie kaufen. Beides findest du unter **Sichtbarkeit** — zusammen mit Social, dem dritten Weg, auf dem dich Leute finden.' },
    { keys: ['printful', 'druck', 'lieferant', 'produktion'],
      answer: 'Printful hat im Juli {print30} € gekostet, im Schnitt rund 14 € pro Bestellung.\n\nEin Problem gab es: bei „Retro Trail“ lief ein Druck mit dem falschen Farbprofil (Comfort Colors statt Bella Canvas) — die Kundin hat sich beschwert, Emma hat es beim Druckpartner nachgewiesen. Der Neudruck liegt bei dir zur Freigabe.\n\nAnsonsten läuft die Produktion sauber, keine Verzögerungen.' }
  ];

  var chatFallback = 'Dazu habe ich in dieser Demo keine Daten — ich erfinde lieber nichts.\n\nWas ich beantworten kann:';

  /* --- Export ------------------------------------------------------------- */
  window.DEMO_DATA = {
    today: TODAY,
    company: { name: 'Nordwind Studio', shop: 'nordwind-studio.de', prefix: 'NOR' },
    days: days,
    windowDays: windowDays,
    sum: sum,
    agents: agents,
    designs: designs,
    trends: trends,
    drafts: drafts,
    keywords: keywords,
    seoTasks: seoTasks,
    contentPlan: contentPlan,
    receipts: { 6: receiptsJuly, 5: receiptsJune },
    approvals: approvals,
    feed: feed,
    liveEvents: liveEvents,
    tickets: tickets,
    topics: topics,
    socialChannels: socialChannels,
    socialPosts: socialPosts,
    socialPlan: socialPlan,
    reviews: reviews,
    connectors: connectors,
    chat: { suggestions: chatSuggestions, knowledge: chatKnowledge, fallback: chatFallback },
    traffic: [
      { name: 'Organische Suche', share: 42, color: '#22A05A' },
      { name: 'Google Ads',       share: 16, color: '#F9AB00' },
      { name: 'Direkt',           share: 18, color: '#5E6AD2' },
      { name: 'Social',           share: 15, color: '#D9739F' },
      { name: 'E-Mail',           share: 9,  color: '#8B8B8B' }
    ],
    fixed: { software: 149, avgSessionDuration: '2:41 Min.', firstReply: '4 Min.', satisfaction: '4,8 / 5' }
  };
})();

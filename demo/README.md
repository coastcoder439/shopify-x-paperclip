# Commerce-Demo — Nordwind Studio

Interaktive Demo des Commerce-Moduls für Paperclip. **Öffnen:** `index.html` doppelklicken (kein Server, kein Build).
Alle Daten sind erfunden. Der Reset-Knopf unten mittig stellt den Ausgangszustand wieder her — die Demo ist damit beliebig oft vorführbar.

## Der 5-Minuten-Weg durch die Demo

1. **Übersicht** — Zahlen, Team, „4 offen" bei den Freigaben.
2. **Freigabe „4 Designs live stellen"** → *Ansehen* → *Freigeben*. Das ist der Aha-Moment: Zähler fällt, Feed reagiert, die Designs erscheinen in der Bibliothek (mit 0 € — die Demo erfindet keinen Umsatz).
3. **Design-Studio** — woher das kam: Trend-Radar → Entwürfe → Freigabe → live. *Variante anfordern* startet einen echten Agentenlauf und erzeugt einen neuen Entwurf.
4. **Otto fragen** (unten rechts) — „Was kosten mich die Agenten?" Er antwortet aus denselben Daten, die im Dashboard stehen.
5. **Buchhaltung** — das Kaufargument: 6 Agenten = 34,40 €/Monat gegen 2.180 € Google Ads.

## Was echt funktioniert

Zeitraum 7/30/90 Tage (rechnet neu) · Chart mit Hover · alle Drawer · Sortieren, Filtern, Suchen in jeder Tabelle · Agentenläufe · Freigeben **und Ablehnen mit Grund** · Beleg zuordnen · Ticket beantworten (Text editierbar) · Otto-Chat mit 13 Themen · Command-Palette (Strg+K) · Hintergrund-Ticker (Agenten melden sich nach ~1 Min. von selbst).

Sidebar-Punkte außerhalb von „Commerce" sind bewusst inaktiv — sie sagen per Hinweis, dass sie native Paperclip-Ansichten und nicht Teil der Demo sind, statt ins Leere zu führen.

## Warum die Zahlen zusammenpassen

`data.js` erzeugt **eine** Tagesserie über 180 Tage. Alles andere wird daraus gerechnet — KPIs, Chart, Belege, GuV, USt-VA. Belegbar:

- Die 96 Juni-Belege ergeben **exakt** die Kosten der GuV (Differenz 0,00 €).
- Im Juli fehlen 184 € — genau der eine Beleg, den Karla nicht zuordnen darf. Das ist die Story, kein Fehler.
- Die 14 Designs summieren auf exakt den 30-Tage-Umsatz (24.640 €).

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Shell: Sidebar, Topbar, Reiter |
| `data.js` | Datensatz + Tagesserie (deterministisch) |
| `core.js` | State, Router, Drawer/Modal/Toast, Agentenläufe, Otto-Chat |
| `view-*.js` | die fünf Reiter |
| `base.css` | Design 1:1 aus dem abgenommenen Mockup |
| `app.css` | Interaktions-Komponenten |

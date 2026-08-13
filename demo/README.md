# Commerce-Demo — Nordwind Studio

Interaktive Demo des Commerce-Moduls für Paperclip. **Öffnen:** `index.html` doppelklicken (kein Server, kein Build).
Alle Daten sind erfunden. Der Reset-Knopf unten mittig stellt den Ausgangszustand wieder her — die Demo ist beliebig oft vorführbar.

## Die fünf Reiter

| Reiter | Inhalt |
|---|---|
| **Übersicht** | Zahlen, Team, Freigaben, Design-Performance |
| **Design-Studio** | Trend-Radar → Entwürfe → Freigabe → Bibliothek |
| **Sichtbarkeit** | drei Ebenen: **Website** (Google-Ranking) · **Social** (Pinterest, Instagram, TikTok, WhatsApp-Kanal) · **Bewertungen** (Sterne) |
| **Buchhaltung** | GuV, Belege, USt-Voranmeldung, Agenten-Kosten |
| **Kundenservice** | Anfragen mit echten Gesprächsverläufen |

**Ranking ≠ Rating:** Das Ranking ist die Google-Position (Ebene „Website"), das Rating sind die Sterne (Ebene „Bewertungen"). Das Ranking bringt Leute in den Shop, das Rating entscheidet, ob sie kaufen. Deshalb liegen beide zusammen unter „Sichtbarkeit" — mit Social als drittem Weg, auf dem Kunden dich finden.

## Der 5-Minuten-Weg durch die Demo

1. **Übersicht** — 6 Freigaben warten. Das ist der Tag des Shop-Betreibers in einem Bild.
2. **„4 Designs live stellen"** → *Ansehen* → *Freigeben*. Der Aha-Moment: Zähler fällt, und im Feed reagiert eine Kette — Theo meldet live, **Mia** übernimmt die Metadaten, **Nele** plant Pins dazu. Ohne dass jemand sie beauftragt hat.
3. **Freigabe „Kulanz-Neudruck #1044"** → *Freigeben*. Jetzt der stärkste Moment: Damit ist gleichzeitig die **öffentliche 2-Sterne-Bewertung** desselben Kunden beantwortet. Nachzusehen unter Sichtbarkeit → Bewertungen.
4. **Sichtbarkeit** — die drei Ebenen durchklicken. Social zeigt, warum Pinterest bei Print-on-Demand zählt: ein Pin läuft Monate weiter.
5. **Otto fragen** (unten rechts) — „Was kosten mich die Agenten?" oder „Wie stehen meine Bewertungen?"
6. **Buchhaltung** — das Kaufargument: **7 Agenten = 41,20 €/Monat** gegen 2.180 € Google Ads.

## Das Team

Otto (Koordination) · Ida (Designrecherche) · Theo (Designerstellung) · Mia (SEO) · **Nele (Social)** · Karla (Buchhaltung) · Emma (Kundenservice, lokales Modell, 0 €).

Bewertungen haben bewusst **keinen** eigenen Agenten — dort arbeiten drei zusammen: Emma antwortet, Ida erkennt Muster in der Kritik, Theo bessert die Produktseite nach.

## Was echt funktioniert

Zeitraum 7/30/90 Tage (rechnet alles neu, auch Social) · Chart mit Hover · alle Drawer · Sortieren, Filtern, Suchen in jeder Tabelle · Agentenläufe · Freigeben **und Ablehnen mit Grund** · Beleg zuordnen · Ticket beantworten · Bewertung beantworten (Text editierbar) · Otto-Chat mit 16 Themen · Command-Palette (Strg+K) · Hintergrund-Ticker.

Sidebar-Punkte außerhalb von „Commerce" sind bewusst inaktiv — sie sagen per Hinweis, dass sie native Paperclip-Ansichten und nicht Teil der Demo sind, statt ins Leere zu führen.

## Warum die Zahlen zusammenpassen

`data.js` erzeugt **eine** Tagesserie über 180 Tage. Alles andere wird daraus gerechnet. Belegbar:

- Die 96 Juni-Belege ergeben **exakt** die Kosten der GuV (Differenz 0,00 €).
- Im Juli fehlen 184 € — genau der eine Beleg, den Karla nicht zuordnen darf. Das ist die Story, kein Fehler.
- Die 14 Designs summieren auf exakt den 30-Tage-Umsatz (24.640 €).
- Social summiert in **jedem** Zeitraum auf exakt 15 % der Sitzungen — den Anteil aus dem Traffic-Diagramm.
- 79 Bewertungen, Ø 4,6 — das sind 10,9 % der Bestellungen, ein realistischer Wert.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Shell: Sidebar, Topbar, Reiter |
| `data.js` | Datensatz + Tagesserie (deterministisch) |
| `core.js` | State, Router, Drawer/Modal/Toast, Agentenläufe, Otto-Chat |
| `view-*.js` | die fünf Reiter |
| `sicht-*.js` | die drei Ebenen von „Sichtbarkeit" |
| `base.css` | Design 1:1 aus dem abgenommenen Mockup |
| `app.css` | Interaktions-Komponenten |

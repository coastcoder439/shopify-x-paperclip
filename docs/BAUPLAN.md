# Bauplan — vom Demo zum echten Commerce-Modul

Stand: 30.07.2026 · Die Demo (`demo/`) ist abgenommen und ist ab jetzt die **Spezifikation**:
Was dort klickbar ist, ist das Zielverhalten. Abweichungen beim echten Bau werden bewusst
entschieden und hier notiert, nicht stillschweigend eingebaut.

## Das Sortierprinzip: die Risiko-Leiter

Gebaut wird in der Reihenfolge **lesen → intern schreiben → nach außen schreiben**.
Jede Stufe ist einzeln vorführbar und einzeln verkaufbar. Kein Agent bekommt
Außenwirkung, bevor die Freigabe-Mechanik steht.

## Meilensteine

### M0 · Verkaufen mit dem, was da ist — 0 Bautage
Die Demo dem Interessenten zeigen (Bildschirmfreigabe oder Link). Jede Rückmeldung
ist kostenlose Spezifikation: Was er zuerst anklickt, ist das, was ihm wichtig ist —
das zieht in der Reihenfolge unten vor. Preis-/Pilotmodell klären, bevor M2 beginnt.

### M1 · Fundament: echte Zahlen, nur lesend
- Commerce-Reiter als echtes Paperclip-Plugin (offizieller Plugin-Slot, kein Patch)
- Shopify Admin API **lesend**: Bestellungen, Umsätze, Produkte, Gebühren
- GA4 Data API lesend: Sitzungen, Quellen
- Übersichts-Reiter + Buchhaltungs-GuV mit echten Zahlen (Belege wie in der Demo
  aus den Tagesdaten abgeleitet, Printful-Rechnungen lesend dazu)

**Warum zuerst:** Ohne seine echten Zahlen glaubt niemand dem Rest. Lesend = kein
Risiko, keine Freigabe-Mechanik nötig. Ergebnis ist allein schon vorführbar.

### M2 · Otto + die Freigabe-Mechanik
- Otto als erster lebender Agent, **rein lesend**: Tagesbriefing als Task-Kommentar
  (der native Paperclip-Weg: Konversation = Task, siehe Zielbild §E)
- Freigabe-Queue als Task-Muster: Vorschlags-Task → Freigabe durch den Menschen →
  Ausführung. Genau die Mechanik, die die Demo zeigt.

**Warum jetzt:** „Ein Agent arbeitet für mich" mit minimalem Risiko — und die
Freigabe-Mechanik ist Voraussetzung für alles, was danach schreibt.

### M3 · Karla light — Buchhaltung ohne Außenwirkung
- Belege aus Shopify Payments + Printful ziehen, Konten zuordnen (SKR03),
  unklare Belege zur Zuordnung vorlegen (wie in der Demo)
- CSV-/DATEV-Export als Datei
- **Noch nicht:** USt-VA an ELSTER übermitteln (eigener Aufwand, kommt in M6)

**Warum vor der Design-Pipeline:** höchste Zeitersparnis pro Bauaufwand, null
Außenwirkung, monatlich wiederkehrender Schmerz — und „automatisierte Buchhaltung"
war eine der ausdrücklichen Anforderungen des Interessenten.

### M4 · Design-Pipeline — der erste schreibende Zugriff
- Ida: Trend-Scan (Websuche/Google Trends), Design-Briefs als Tasks
- Theo: Entwürfe über Bild-KI, Mockups, Listing-Texte
- Nach Freigabe: Listings über die Shopify Admin API **schreibend** anlegen

**Warum erst jetzt:** Das ist der Umsatz-Wow der Demo — aber es schreibt in den
Live-Shop. Deshalb nach der Freigabe-Mechanik, nicht vorher.

### M5 · Sichtbarkeit
- Mia: Search Console lesend, Metadaten nach Freigabe schreibend, Blogentwürfe
- Bewertungen: lesen, Antworten nach Freigabe veröffentlichen (Brücke zum
  Kundenservice wie in der Demo)
- Emma light: Antwortentwürfe für Shopify Inbox/E-Mail — **noch kein** Autosend

### M6 · Ausbau
- Emma voll: Standardfälle (Lieferstatus) automatisch beantworten
- Nele: **Pinterest zuerst** (API gut zugänglich, stärkster POD-Kanal), dann
  WhatsApp-Kanal (Business-API), Instagram/TikTok danach
- Karla voll: USt-VA-Vorbereitung + ELSTER-Übermittlung nach Freigabe
- Kosten-/ROI-Ansicht je Agent (Token-Verbrauch aus Paperclip nativ)

## Technischer Rahmen (aus dem Zielbild-Dokument)

- **Plugin, kein Fork-Umbau:** Der Reiter kommt über den offiziellen Plugin-Slot;
  Fork-Patches nur, wo das Zielbild sie ohnehin vorsieht (P1–P6)
- **Agenten sind native Paperclip-Agenten** mit Skill-Liste, Rechte-Profil und
  Budget — Emma auf lokalem Modell (gemma), Routinearbeit lokal, wie in der Demo
- **Zugänge als Company-Secrets**, gebunden an genau die Agenten, die sie brauchen
- **Alles ist eine Task:** Briefings, Vorschläge, Freigaben — kein Kanal daran vorbei

## Offene Entscheidungen (bewusst nicht jetzt)

- Ob die Demo-Firma „Nordwind Studio" als White-Label-Vorlage bleibt oder der
  echte Shop des Interessenten das erste Setup wird
- Bewertungs-Quelle im echten Bau (Shopify-Review-Apps sind fragmentiert:
  Judge.me, Loox, … — hängt davon ab, was sein Shop nutzt)
- Preis-/Betriebsmodell (einmalig, monatlich, gehostet vs. bei ihm)

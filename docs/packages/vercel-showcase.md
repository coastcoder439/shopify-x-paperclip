# Work package: vercel-showcase

> Arbeitsartefakt nach `working-method.md`: lebt im Repo dieses Projekts.
> Angelegt 2026-09-02 beim Deploy, nachgefuehrt bei jedem Paket-Abschluss.

**Problem:** Das statische Nordwind-Cockpit (`demo/`) lief nur lokal per `python -m http.server`; es gab keine oeffentlich erreichbare Prototyp-URL, die sich als `<iframe>` in das Portfolio auf `https://coastcoder439.github.io` einbetten laesst.
**Intent:** Den Prototyp als eigenes Vercel-Projekt `showcase-nordwind` aus dem lokalen Ordner deployen (kein GitHub-Push, keine Bestandsprojekte beruehren, keine Secrets, nur erfundene Demo-Zahlen), damit das Portfolio ihn live zeigt.
**Goal:** `https://showcase-nordwind.vercel.app/` antwortet 200, setzt `Content-Security-Policy: frame-ancestors 'self' https://coastcoder439.github.io http://localhost:3000` und KEIN `X-Frame-Options`; ein iframe von `http://localhost:3000` zeigt das Cockpit; Secret-Scan auf dem Output = 0 Treffer.

## Plan

1. [x] `demo/vercel.json` mit frame-ancestors-Header anlegen (sonst nichts: kein Build, kein Framework)
2. [x] `demo/.vercelignore` anlegen (`.env*`, `.vercel`, `README.md`) — README nicht oeffentlich, Token-Datei nie hochladen
3. [x] Secret-/Groessen-Scan auf `demo/` vor dem Deploy
4. [x] `vercel link --yes --project showcase-nordwind --scope coastcoder-2263s-projects` im Ordner `demo/`
5. [x] `vercel deploy --prod --yes` im Ordner `demo/`
6. [x] Nach-Deploy-Messung per curl (Status, Header, Inhalt, Secret-Scan, README/.env/vercel.json = 404)
7. [x] Einbettungs-Test aus erlaubter Origin `http://localhost:3000` mit Screenshot im Browser
8. [x] Paket anlegen, Commit nur eigener Dateien (kein Push)

## Status

2026-09-02 — Produktions-Deploy steht.
- Production-URL: **https://showcase-nordwind.vercel.app** (Alias; Deployment `dpl_Ff3sMp1WjSZBEURzETF1RrCtBLqT`, Team `coastcoder-2263s-projects`, Projekt neu angelegt, keines der 8 Bestandsprojekte beruehrt)
- Upload 351,1 KB aus `demo/`; Build: keiner (Statik, Output Directory `.`)
- `grep -rniE "supabase\.co|eyJ|sk_|api_key" demo | wc -l` = 0 · `find demo -type f -size +20M` = leer
- `curl -sI https://showcase-nordwind.vercel.app/` → `HTTP/1.1 200 OK`; genau eine Zeile `Content-Security-Policy: frame-ancestors 'self' https://coastcoder439.github.io http://localhost:3000`; kein `x-frame-options`
- `curl -s …/ | grep -c "Nordwind Studio"` = 2 · `curl -s …/data.js | grep -ciE "supabase\.co|eyJ|sk_|api_key"` = 0
- `/README.md`, `/.env.local`, `/vercel.json` → je 404 (nicht ausgeliefert)
- iframe-Test: `iframe-test.html` im Session-Scratchpad, ausgeliefert ueber `python -m http.server 3000`, Screenshot im Browser: Cockpit (Sidebar, Reiter, KPI-Kacheln, Chart, Design-Pipeline, Badge „Demo · alle Zahlen erfunden") im Rahmen sichtbar, Konsole 0 Fehler
- `vercel link` legte `demo/.env.local` mit `VERCEL_OIDC_TOKEN` an — nach dem Deploy geloescht; `demo/.vercel/` bleibt lokal und ist per `demo/.gitignore` ausgeschlossen

## Abnahme

- `curl -sI https://showcase-nordwind.vercel.app/ | grep -iE "^HTTP|x-frame-options|content-security-policy"` → 200, eine CSP-Zeile mit frame-ancestors, keine x-frame-options-Zeile
- `curl -s https://showcase-nordwind.vercel.app/ | grep -c "Nordwind Studio"` → >= 1
- `curl -s https://showcase-nordwind.vercel.app/data.js | grep -ciE "supabase\.co|eyJ|sk_|api_key"` → 0
- iframe von `http://localhost:3000` oder `https://coastcoder439.github.io` zeigt das Cockpit (file:// hat Origin null und wird zu Recht blockiert)

## Abschluss

Coverage: Alle acht Planschritte ausgefuehrt; Header, Inhalt, Secret-Scan und Einbettung gemessen.
Fulfillment: erfuellt — Goal-Zustand (200, frame-ancestors-CSP, kein X-Frame-Options, iframe sichtbar, 0 Secret-Treffer) am 2026-09-02 gemessen.
Geprueft gegen: curl-Header und -Inhalt der Production-URL, Secret-Scan lokal (0) und auf `/data.js` (0), Browser-Screenshot des iframe von `http://localhost:3000`.
Offen: Einbettung von `https://coastcoder439.github.io` selbst erst pruefbar, sobald das Portfolio den iframe eingebaut hat (Header erlaubt die Origin bereits). Kein Push dieses Commits (Owner-Vorgabe, Repo privat).

## Anhang

- Deploy-Wurzel ist `demo/`, nicht die Projektwurzel (dort keine index.html; Referenz-JPEGs wuerden mit hochgeladen).
- Neu-Deploy: `cd demo && vercel deploy --prod --yes` (Link liegt in `demo/.vercel/project.json`, lokal).

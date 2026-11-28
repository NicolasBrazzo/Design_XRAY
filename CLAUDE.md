# Design XRAY

Tool che, dato l'URL di un sito pubblico, ne ricostruisce il design system: colori, tipografia, spaziature, radius, ombre, motion, breakpoint e font, organizzati come design token. È un progetto da portfolio.

Il progetto completo (logica, pipeline, roadmap) è in [docs/brief.md](docs/brief.md): leggilo prima di proporre o scrivere codice.

## Stato attuale

- Fase: **prima versione online**. Il motore conta sfondi, colori del testo e dei bordi (roadmap archiviate). Motore riusabile (`analyzeUrl`), endpoint `POST /api/analyze` e pagina dei risultati esistono già; mancano il design della pagina, il controllo SSRF dentro il browser e il deploy. Il piano è in [docs/roadmap-prima-versione.md](docs/roadmap-prima-versione.md).
- Si lavora in verticale: ogni nuova proprietà è finita solo quando si vede nel report. Il quaderno in `docs/lab/` si usa solo per i problemi difficili.
- Le roadmap finite, il piano completo (M0–M6) e le note di M0 generate con l'AI sono stati rimossi: restano nella cronologia di git. La logica del progetto è in `docs/brief.md`.
- Il codice lo scrive l'utente: Claude spiega, dà indizi e rivede, e dà la soluzione solo se richiesta.

## Comandi

- `engine/`: `npm test` (`node:test`), `npm run typecheck` (`tsc --noEmit`). I file `.ts` si eseguono direttamente con Node ≥ 22.18, senza compilazione.
- `client/`: `npm run dev` (Vite, http://localhost:5173), `npm run build`, `npm run lint` (oxlint).
- `server/`: `npm run dev` (Express con `node --watch`, http://localhost:3000), `npm start`.
- Browser per Playwright: `npx playwright install chromium` (da `engine/`, serve dopo un'installazione pulita).

## Come lavorare con l'utente

- Rispondi in **italiano**.
- L'utente vuole **capire la logica**, non solo avere codice funzionante. Spiega il perché delle scelte e collega ogni concetto nuovo alla fase della pipeline in cui serve.
- Procedi a piccoli passi, una tappa alla volta. Prima di implementare qualcosa di non banale, descrivi l'approccio e aspetta conferma.
- Non scrivere grandi blocchi di codice non richiesti.

## Decisioni di architettura già prese

- **Pipeline in 5 fasi:** acquisizione → estrazione → normalizzazione → inferenza → output. Ogni fase ha input e output espliciti in JSON e fa una cosa sola.
- **Motore separato dall'interfaccia:** `engine` riceve un URL e restituisce JSON, non sa nulla della UI. CLI, API e web app lo usano.
- **Dati grezzi separati dai token:** l'estrazione salva `raw.json`; l'inferenza produce `tokens.json` e deve poter girare offline su un `raw.json` salvato. I `raw.json` salvati servono anche come casi di test.
- **Trasparenza:** ogni token inferito porta con sé le prove (conteggio, area, selettori di esempio, fonte) e un livello di confidenza.
- **Playwright come libreria** (pacchetto `playwright`), non come test runner.

## Stack

TypeScript, Node.js, Playwright (libreria), css-tree (parsing CSS), culori (colori, OKLCH, Delta E).

- **engine:** TypeScript eseguito direttamente da Node (i tipi vengono cancellati, `tsc` serve solo a controllarli; `erasableSyntaxOnly` e `verbatimModuleSyntax` attivi), Playwright, test con `node:test`.
- **client:** React + TypeScript (Vite), React Router, Tailwind v4 (plugin `@tailwindcss/vite`, nessun `tailwind.config.js`).
- **server:** Node + Express 5 (ES module).
- Hosting non ancora deciso: vedi "Decisioni aperte" nel brief.

## Convenzioni

- Codice, identificatori e commit in inglese; documentazione e spiegazioni in italiano.
- Colori: calcoli in OKLCH, visualizzazione in hex. La trasparenza va composta sullo sfondo prima di confrontare i colori.
- Lunghezze normalizzate in px; il valore in rem si calcola rispetto al font-size della radice del sito analizzato, non a un 16px fisso.
- Output deterministico: stesso input → stesso output (ordinamenti stabili).

## Vincoli

- Solo siti pubblici, una pagina per richiesta. Niente crawling massivo.
- I file dei font e degli asset non si ridistribuiscono mai: si riportano nome, provider e URL.
- Il servizio web dovrà bloccare gli URL verso reti interne (SSRF).

## Mappa dei file

- `docs/brief.md`: cos'è il progetto, logica di inferenza, architettura, roadmap.
- `docs/roadmap-prima-versione.md`: la roadmap attiva (dalla CLI al link pubblico).
- `docs/checklist-conclusione.md`: le tappe aperte della roadmap divise in passi da spuntare.
- `docs/lab/`: quaderno di laboratorio dell'utente (osservazioni e regole per ogni proprietà, per esempio `sfondi-conteggio-grezzo.md`, `colori-testo-conteggio-grezzo.md`).
- `docs/da-sistemare.md`: cose notate durante il lavoro, da riprendere più avanti.
- `engine/`: la pipeline e la CLI; qui gira Playwright con Chromium headless.
- `client/`: interfaccia web (report).
- `server/`: API Express che usa l'engine (`POST /api/analyze`) e il primo controllo SSRF (`ssrf.js`).

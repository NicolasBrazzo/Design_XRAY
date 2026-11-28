# Design XRAY

Tool che, dato l'URL di un sito pubblico, ne ricostruisce il design system: colori, tipografia, spaziature, radius, ombre, motion, breakpoint e font, organizzati come design token. È un progetto da portfolio.

Il progetto completo (logica, pipeline, roadmap) è in [docs/brief.md](docs/brief.md): leggilo prima di proporre o scrivere codice.

## Stato attuale

- Fase: **prima versione online**. Fatti: conteggio di sfondi, testo e bordi, `analyzeUrl`, `POST /api/analyze` con limite per IP, proxy SSRF dentro il browser, design della pagina (in inglese), Dockerfile, README. Mancano il deploy su Railway e la prova sul sito di Futura. I passi sono in [docs/checklist-conclusione.md](docs/checklist-conclusione.md).
- Si lavora in verticale: ogni nuova proprietà è finita solo quando si vede nel report. Il quaderno in `docs/lab/` si usa solo per i problemi difficili.
- Le roadmap finite, il piano completo (M0–M6) e le note di M0 generate con l'AI sono stati rimossi: restano nella cronologia di git. La logica del progetto è in `docs/brief.md`.
- Dal 28 novembre 2026 il codice lo scrive Claude: l'utente ha capito le basi e vuole chiudere in fretta la prima versione per passare al prossimo progetto. L'utente decide e rivede; il quaderno e le verifiche a voce non servono più.

## Comandi

- `engine/`: `npm test` (`node:test`), `npm run typecheck` (`tsc --noEmit`). I file `.ts` si eseguono direttamente con Node ≥ 22.18, senza compilazione.
- `client/`: `npm run dev` (Vite, http://localhost:5173), `npm run build`, `npm run lint` (oxlint).
- `server/`: `npm run dev` (Express con `node --watch`, http://localhost:3000), `npm start`.
- Browser per Playwright: `npx playwright install chromium` (da `engine/`, serve dopo un'installazione pulita).
- Docker: `docker build -t design-xray .` e `docker run --rm -p 3000:3000 design-xray` dalla radice. La versione dell'immagine Playwright nel `Dockerfile` deve restare uguale a quella del pacchetto `playwright` in `engine/`.

## Come lavorare con l'utente

- Rispondi in **italiano**.
- Obiettivo attuale: chiudere in fretta la prima versione seguendo [docs/checklist-conclusione.md](docs/checklist-conclusione.md). Claude implementa direttamente e spiega in breve cosa ha cambiato e perché.
- Chiedi all'utente solo le decisioni che sono sue: hosting, gusto del design, lingua del README. Si lavora su `main` e non si fanno commit: li fa l'utente.

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
- **Hosting:** Railway, un solo servizio Docker (`Dockerfile` nella radice) basato sull'immagine ufficiale di Playwright: Express serve l'API e `client/dist`.

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
- `server/`: API Express che usa l'engine (`POST /api/analyze`), il primo controllo SSRF (`ssrf.js`), il limite per IP (`rateLimit.js`) e serve `client/dist`.
- `engine/src/network/`: lista degli indirizzi interni (`addresses.ts`) e proxy che filtra ogni richiesta di Chromium (`guardProxy.ts`).

# Design XRAY: checklist per chiudere la prima versione

> Le tappe ancora aperte di [roadmap-prima-versione.md](roadmap-prima-versione.md), divise in passi piccoli. Dal 28 novembre 2026 il codice lo scrive Claude; i punti 1-4c sono fatti, restano il deploy e la prova sui siti veri.
>
> **Finito quando:** un link pubblico analizza un URL e mostra le tre palette, lo hai provato sul sito di Futura, il README ha screenshot e limiti.

Ordine consigliato: 1 → 2 → 3 → 4 → 5. Il punto 2 viene prima del design perché senza il punto 2 il link non si può pubblicare, e perché è la parte più difficile.

---

## 1. Spuntare quello che è già fatto (circa 15 minuti)

### Tappa 0: bordi con lati diversi

Il codice lo gestisce già: [borderColors.ts](../engine/src/borderColors.ts) passa a `countColors` i colori dei lati con spessore > 0, e [calculateColors.ts](../engine/src/calculateColors.ts) conta ogni colore distinto una volta per elemento.

- [x] In [colori-bordo-conteggio-grezzo.md](lab/colori-bordo-conteggio-grezzo.md) la regola 3 rimanda al test (niente esempio reale: dal 28 novembre il quaderno non si usa più).
- [x] Test: c'è già, `sides with different colors give one count per distinct color` in `engine/test/borderColors.test.ts` copre la regola 3.
- [x] Spunta la Tappa 0 nella roadmap.

### Tappa 0b: il commit `33f0d57`

- [x] ~~Rispondi a voce~~ (non serve più: l'utente ha capito le basi), senza riaprire il codice:
  - perché in `res.on('close')` serve `res.writableFinished`;
  - perché nel `catch` di `analyzeUrl` il controllo su `signal?.aborted` viene per primo;
  - cosa non copre `checkPublicUrl`, e perché (è l'introduzione al punto 2).
- [x] Spunta la Tappa 0b.

---

## 2. Controllo SSRF dentro il browser *(fatto)*

`page.route` non bastava: una prova ha mostrato che Playwright chiama il gestore solo per il primo URL di una catena di redirect, e Chromium è arrivato a `127.0.0.1` senza controllo. Soluzione adottata: un proxy locale per ogni analisi.

- [x] Lista degli indirizzi interni spostata nel motore: [engine/src/network/addresses.ts](../engine/src/network/addresses.ts) (`isPublicAddress`, `resolveAllowed`). Il server la riusa in [ssrf.js](../server/ssrf.js).
- [x] Proxy [engine/src/network/guardProxy.ts](../engine/src/network/guardProxy.ts): Chromium manda ogni richiesta (redirect, risorse, fetch, WebSocket via `CONNECT`) al proxy, che risolve il nome, controlla gli indirizzi e si collega all'IP controllato. Chiude anche il DNS rebinding.
- [x] `localhost` passa dal proxy (`--proxy-bypass-list=<-loopback>`); WebRTC non può usare UDP fuori dal proxy.
- [x] Nuovo codice `BLOCKED_URL` nel motore: se viene bloccata la pagina stessa (anche dopo un redirect). Una risorsa secondaria bloccata non ferma l'analisi.
- [x] Opzione `isAllowedAddress` di `analyzeUrl`: i test passano una regola che blocca solo `127.0.0.2`.
- [x] Test in [engine/test/guardProxy.test.ts](../engine/test/guardProxy.test.ts): pagina bloccata, redirect bloccato, immagine bloccata, `localhost` bloccato di default, tunnel `CONNECT` rifiutato con 403. 46 test su 46.
- [x] Prova con siti HTTPS veri (example.com, github.com) e con un dominio inesistente.

## 3. Il design della pagina *(fatto)*

- [x] Direzione: grigio neutro da cabina di valutazione colore, nessuna tinta nell'interfaccia. Schibsted Grotesk per l'interfaccia, Spline Sans Mono solo per gli hex.
- [x] Stato vuoto: titolo, spiegazione, campo URL ed esempi.
- [x] Caricamento: tre fasce vuote con una luce che scorre, tempo trascorso, "Most pages take 5 to 20 seconds", pulsante Cancel.
- [x] Errore: titolo e suggerimento per ogni codice; "Try again" solo dove può servire.
- [x] Risultato: la "lastra" con tre fasce proporzionali in cima, poi una griglia di campioni per sezione (hex da copiare, percentuale, conteggio).
- [x] Riga con i limiti noti sotto la lastra.
- [x] Interfaccia e messaggi di server e motore in inglese.
- [x] Provato a 1280 px e a 390 px; `npm run lint` e `npm run build` passano.

## 4. Online

### 4a. Limite di richieste per IP *(fatto)*

- [x] [server/rateLimit.js](../server/rateLimit.js): finestra scorrevole in memoria, 10 analisi per IP ogni 10 minuti (`RATE_LIMIT_MAX` per cambiarlo), risposta `429` con codice `RATE_LIMITED` e `Retry-After`.
- [x] `trust proxy` attivato solo con la variabile `TRUST_PROXY` (impostata a 1 nel Dockerfile).
- [x] Messaggio nella pagina per `RATE_LIMITED`.

### 4b. Express serve anche il client *(fatto)*

- [x] `express.static` su `client/dist`, con percorso basato su `import.meta.dirname`.
- [x] Fallback `/{*path}` verso `index.html` dopo le rotte `/api` (sintassi di Express 5).
- [x] Messaggio `SERVER_DOWN` adatto a chi usa il sito.
- [x] Provato con `curl`: `/results` restituisce l'app, un'API sconosciuta dà 404 in JSON, `localhost` e `169.254.169.254` danno `BLOCKED_URL`, la richiesta oltre il limite dà `429`.

### 4c. Dockerfile *(fatto)*

- [x] [Dockerfile](../Dockerfile) su `mcr.microsoft.com/playwright:v1.65.0-noble`, la stessa versione del pacchetto `playwright`.
- [x] Dipendenze installate a strati, build del client, utente non root `pwuser`.
- [x] [.dockerignore](../.dockerignore).
- [x] Verifica locale: `docker build` e `docker run` funzionano (pagina, blocco di `localhost`, analisi di python.org); Node 26 nell'immagine.

### 4d. Deploy su Railway (lo fa l'utente: serve il suo account)

- [ ] Crea un progetto su [railway.com](https://railway.com) → "Deploy from GitHub repo" → scegli `Design_XRAY`. Railway trova il `Dockerfile` da solo.
- [ ] Servono le modifiche su GitHub: prima fai commit e push di questo lavoro su `main`.
- [ ] In Settings → Networking → "Generate Domain" per avere il link pubblico.
- [ ] Memoria: ogni analisi usa 100-200 MB e ne girano al massimo 2. Se Railway segnala memoria esaurita, abbassa `MAX_RUNNING_ANALYSES` a 1 in [server/index.js](../server/index.js).
- [ ] Verifica dal telefono: un sito vero mostra le tre palette.
- [ ] Verifica che vengano rifiutati `http://localhost`, `http://127.0.0.1` e `http://169.254.169.254`.
- [ ] Metti il link nel README, al posto di "_coming soon_".

**Fatto quando:** il link funziona da telefono, e un URL verso `http://localhost` viene rifiutato.

---

## 5. Prova vera e chiusura

### 5a. Prova su siti veri

- [ ] Analizza il sito di Futura dal link pubblico.
- [ ] Analizza altri due siti molto diversi: uno costruito con JavaScript (React o simili) e uno semplice.
- [ ] Annota in [da-sistemare.md](da-sistemare.md) cosa è sbagliato o manca: è il punto di partenza dopo la prima versione.

### 5b. README *(fatto, manca il link)*

- [x] [README.md](../README.md) in inglese: cosa fa, screenshot, come funziona, protezione SSRF, limiti noti, come si avvia in locale e con Docker, cosa viene dopo.
- [x] Screenshot in [docs/screenshots/](screenshots/).
- [ ] Link alla demo (dopo 4d).

### 5c. Documentazione *(fatto)*

- [x] [brief.md](brief.md): stato, struttura delle cartelle, stack, decisioni prese (frontend, hosting, lingua).
- [x] [CLAUDE.md](../CLAUDE.md): stato attuale, hosting, comandi Docker, mappa dei file.
- [x] [roadmap-prima-versione.md](roadmap-prima-versione.md): spuntate le tappe fatte.

### 5d. Portfolio

- [ ] Il progetto entra nel portfolio con il link alla demo e al repo.
- [ ] Una frase su cosa hai imparato (per esempio: separare il motore dall'interfaccia, SSRF e perché `page.route` non basta, deploy di un servizio che fa girare un browser).

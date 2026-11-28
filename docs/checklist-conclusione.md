# Design XRAY: checklist per chiudere la prima versione

> Le tappe ancora aperte di [roadmap-prima-versione.md](roadmap-prima-versione.md), divise in passi piccoli. Qui ci sono i passi e gli indizi, non le soluzioni: il codice lo scrivi tu.
>
> **Finito quando:** un link pubblico analizza un URL e mostra le tre palette, lo hai provato sul sito di Futura, il README ha screenshot e limiti, e sai spiegare a voce il percorso di una richiesta.

Ordine consigliato: 1 → 2 → 3 → 4 → 5. Il punto 2 viene prima del design perché senza il punto 2 il link non si può pubblicare, e perché è la parte più difficile.

---

## 1. Spuntare quello che è già fatto (circa 15 minuti)

### Tappa 0: bordi con lati diversi

Il codice lo gestisce già: [borderColors.ts](../engine/src/borderColors.ts) passa a `countColors` i colori dei lati con spessore > 0, e [calculateColors.ts](../engine/src/calculateColors.ts) conta ogni colore distinto una volta per elemento.

- [ ] Trova un esempio reale di elemento con lati di colori diversi (per esempio un `border-bottom` diverso dagli altri lati, o una tab attiva).
- [ ] In [colori-bordo-conteggio-grezzo.md](lab/colori-bordo-conteggio-grezzo.md) sostituisci "da trovare con la prova 3" con l'esempio.
- [x] Test: c'è già, `sides with different colors give one count per distinct color` in `engine/test/borderColors.test.ts` copre la regola 3.
- [ ] Spunta la Tappa 0 nella roadmap.

### Tappa 0b: il commit `33f0d57`

- [ ] Rispondi a voce, senza riaprire il codice:
  - perché in `res.on('close')` serve `res.writableFinished`;
  - perché nel `catch` di `analyzeUrl` il controllo su `signal?.aborted` viene per primo;
  - cosa non copre `checkPublicUrl`, e perché (è l'introduzione al punto 2).
- [ ] Spunta la Tappa 0b.

---

## 2. Controllo SSRF dentro il browser

**Il problema:** `checkPublicUrl` in [ssrf.js](../server/ssrf.js) controlla solo l'URL di partenza. Una volta aperta la pagina, Chromium segue i redirect e carica immagini, script, fetch e iframe verso qualsiasi indirizzo, compresi `127.0.0.1` e `169.254.169.254`.

**L'idea:** ogni richiesta che parte dal browser passa da un controllo. Se il dominio porta a un indirizzo interno, la richiesta viene interrotta.

### 2a. Progettare (prima di scrivere codice, descrivi l'approccio a Claude)

- [ ] **Dove sta il controllo.** Oggi la lista degli indirizzi bloccati (`BlockList`) è nel server, ma `page.route` vive nel motore. Le scelte possibili:
  - spostare la logica degli indirizzi nel motore e farla usare anche al server;
  - lasciarla nel server e passarla al motore come opzione di `analyzeUrl`, così come passi già `signal`.

  Pensa a quale rispetta meglio "motore separato dall'interfaccia" e quale si testa più facilmente.
- [ ] **Come si testa.** Un test con un server locale (`127.0.0.1`) verrebbe bloccato dal controllo stesso. *Indizio:* se il controllo è un parametro, nel test puoi passarne uno finto che blocca solo un URL preciso.
- [ ] **Cosa succede alla pagina principale** se viene bloccata dopo un redirect: quale codice di errore deve uscire da `analyzeUrl`? Esiste già `BLOCKED_URL` nel server, ma non nel motore (`AnalyzeErrorCode`).
- [ ] **Cosa succede a una risorsa secondaria bloccata** (un'immagine verso la rete interna): l'analisi deve fallire o continuare senza quella risorsa?

### 2b. Implementare

- [ ] Leggi la documentazione di Playwright: `page.route` / `context.route`, `route.abort()`, `route.continue()`, `request.isNavigationRequest()`, `request.redirectedFrom()`.
- [ ] Registra la route **prima** di `page.goto`, altrimenti la prima richiesta passa senza controllo.
- [ ] Nel gestore: estrai l'hostname, risolvilo, controlla ogni indirizzo, poi chiama `abort` o `continue`.
- [ ] Gestisci gli IP letterali e gli IPv6 tra parentesi quadre, come fa già `checkPublicUrl`.
- [ ] Pensa ai service worker: le richieste fatte da un service worker possono sfuggire a `page.route`. *Indizio:* cerca l'opzione `serviceWorkers` di `browser.newContext`.
- [ ] Pensa ai WebSocket: `page.route` non li vede. Cerca cosa offre Playwright per i WebSocket, oppure scrivilo tra i limiti noti.
- [ ] Gli URL non HTTP (`data:`, `blob:`) non hanno un host da controllare: decidi cosa farne.

### 2c. Verificare

- [ ] Test: una pagina che fa redirect verso un indirizzo bloccato produce l'errore che hai scelto.
- [ ] Test: una pagina con un'immagine verso un indirizzo bloccato si comporta come hai deciso in 2a.
- [ ] Test: un sito pubblico vero viene ancora analizzato e i tempi non peggiorano troppo. Ogni richiesta ora fa una risoluzione DNS: osserva quanto pesa.
- [ ] `npm test` e `npm run typecheck` passano in `engine/`.
- [ ] Aggiorna il commento "Known limits" in [ssrf.js](../server/ssrf.js): cosa è chiuso ora, cosa resta aperto (DNS rebinding: Chromium risolve di nuovo il nome e può ricevere una risposta diversa da quella che hai controllato).

**Cosa capire:** il controllo all'ingresso (server) e quello dentro il browser (motore) non sono doppioni. Il primo rifiuta subito gli URL sbagliati senza aprire Chromium, il secondo copre tutto quello che succede dopo.

---

## 3. Il design della pagina

### 3a. Su carta

- [ ] **Stato vuoto:** cosa vede chi arriva per la prima volta? Bastano un campo e una frase che spiega cosa fa lo strumento?
- [ ] **Caricamento (5-20 secondi):** è lo stato più lungo, quindi va progettato. Si può mostrare cosa sta succedendo (apertura della pagina, lettura dei colori)? Il pulsante per annullare esiste già nel codice?
- [ ] **Errore:** un errore per ogni codice che conta davvero (`INVALID_URL`, `BLOCKED_URL`, `NAME_NOT_RESOLVED`, `HTTP_ERROR`, `TIMEOUT`, `BUSY`, `SERVER_DOWN`). Per ognuno: cosa può fare l'utente adesso?
- [ ] **Risultato:** almeno tre disposizioni diverse delle tre palette (per esempio colonne affiancate, righe orizzontali, una griglia unica con un filtro). Poi scegline una.
- [ ] Scegli font e colori della tua interfaccia. Attenzione: la pagina mostra i colori di altri siti, quindi la tua UI deve restare neutra e non competere con i campioni.
- [ ] Manda una foto per una critica.

### 3b. Applicare

- [ ] Applica il design a [SearchWebsite.tsx](../client/src/pages/SearchWebsite.tsx), [Results.tsx](../client/src/pages/Results.tsx), [ColorSection.tsx](../client/src/components/ColorSection.tsx) e [App.tsx](../client/src/App.tsx).
- [ ] Font e colori come variabili del tema Tailwind v4 in [index.css](../client/src/index.css) (`@theme`), non sparsi nelle classi.
- [ ] Una riga in pagina con i limiti noti: "conta gli elementi, non l'area occupata", "i colori semitrasparenti sono esclusi".
- [ ] Prova la pagina su uno schermo stretto (DevTools, modalità mobile): il link finirà su un telefono.
- [ ] Prova con un sito che ha molti colori e con uno che ne ha pochissimi: la disposizione regge in entrambi i casi?
- [ ] `npm run lint` e `npm run build` passano in `client/`.

**Fatto quando:** analizzi un sito e il risultato ti sembra fatto da te, non da un template.

---

## 4. Online

### 4a. Limite di richieste per IP

- [ ] Decidi il limite (per esempio N analisi per IP ogni 10 minuti) e cosa risponde il server quando si supera: stato `429` e un codice nuovo in `STATUS_BY_CODE`.
- [ ] Scegli se scriverlo tu (una `Map` IP → tempi delle richieste) o usare un pacchetto (`express-rate-limit`). Se lo scrivi tu, pensa a come svuotare la `Map` col tempo.
- [ ] **Importante online:** su Railway e Render il server sta dietro un proxy, quindi senza configurazione tutte le richieste sembrano arrivare dallo stesso IP. *Indizio:* cerca `trust proxy` nella documentazione di Express.
- [ ] Applica il limite solo a `POST /api/analyze`, non a `/api/health`.
- [ ] Aggiungi alla pagina il messaggio per il nuovo codice di errore.

### 4b. Express serve anche il client

- [ ] `express.static` sulla cartella `client/dist`, con un percorso che non dipenda dalla cartella da cui avvii il server (*indizio:* `import.meta.dirname`).
- [ ] Fallback per React Router: se apri direttamente `/results` o ricarichi la pagina, il server deve restituire `index.html`. Il fallback va **dopo** le rotte `/api`, altrimenti un errore dell'API restituirebbe HTML. Attenzione: Express 5 ha cambiato la sintassi dei percorsi jolly, `*` da solo non funziona più.
- [ ] Il messaggio `SERVER_DOWN` in [api.ts](../client/src/api.ts) dice "npm run dev nella cartella server/": online non ha senso. Rendilo adatto a chi usa il sito.
- [ ] Prova in locale: `npm run build` in `client/`, poi `npm start` in `server/`, e apri `http://localhost:3000`, ricaricando anche su `/results`.

### 4c. Dockerfile

- [ ] Parti dall'immagine ufficiale di Playwright (`mcr.microsoft.com/playwright`). La versione dell'immagine deve essere **la stessa** del pacchetto `playwright` in `engine/package.json`, altrimenti Chromium non viene trovato (errore `BROWSER_MISSING`).
- [ ] Controlla che la versione di Node dell'immagine sia almeno la 22.18: serve per eseguire i `.ts` senza compilazione.
- [ ] Installa le dipendenze di `engine/`, `server/` e `client/`, fai la build del client e avvia il server.
- [ ] Aggiungi un `.dockerignore` per escludere `node_modules`, `dist` e `.git`.
- [ ] Il server legge già `PORT` dall'ambiente: verifica che sia così anche nel container.
- [ ] Se hai Docker in locale, prova `docker build` e `docker run` prima del deploy.

### 4d. Deploy

- [ ] Scegli Railway o Render. Confronta: memoria del piano gratuito o economico (ogni Chromium usa 100-200 MB, e ne permetti 2 insieme), se il servizio va in pausa quando nessuno lo usa (il primo utente aspetta l'avvio), costo.
- [ ] Se la memoria è poca, valuta di abbassare `MAX_RUNNING_ANALYSES` a 1.
- [ ] Deploy dal repo GitHub con il Dockerfile.
- [ ] Verifica dal telefono: un sito vero mostra le tre palette.
- [ ] Verifica che vengano rifiutati `http://localhost`, `http://127.0.0.1`, `http://169.254.169.254` e un sito pubblico che fa redirect verso un indirizzo interno (il test del punto 2).
- [ ] Verifica il limite per IP: dopo N richieste arriva il `429`.
- [ ] Nel [brief](brief.md), sezione 14, chiudi "Dove pubblicare la demo?" con la scelta e il motivo.

**Fatto quando:** il link funziona da telefono, e un URL verso `http://localhost` viene rifiutato.

---

## 5. Prova vera e chiusura

### 5a. Prova su siti veri

- [ ] Analizza il sito di Futura dal link pubblico.
- [ ] Analizza altri due siti molto diversi: uno costruito con JavaScript (React o simili) e uno semplice.
- [ ] Per ognuno confronta il report con quello che vedi a occhio e annota in una lista breve cosa è sbagliato o manca. La lista diventa il punto di partenza dopo la prima versione: mettila in [da-sistemare.md](da-sistemare.md).

### 5b. README

- [ ] Decidi la lingua (italiano o inglese, decisione aperta nel brief). Per un portfolio internazionale l'inglese arriva a più persone.
- [ ] Contenuto:
  - [ ] cosa fa, in due righe;
  - [ ] link alla demo;
  - [ ] uno o due screenshot (stato risultato, magari anche il caricamento);
  - [ ] come funziona: lo schema della richiesta (pagina → API → motore → Playwright → JSON → palette);
  - [ ] limiti noti: conta gli elementi e non l'area, esclude i colori semitrasparenti e i formati diversi da `rgb`, una pagina per volta, siti con protezione anti-bot, limiti SSRF rimasti (DNS rebinding);
  - [ ] come si avvia in locale: Node ≥ 22.18, `npx playwright install chromium`, i comandi di `engine/`, `server/`, `client/`;
  - [ ] cosa viene dopo (tipografia, radius, spaziature, raggruppamento OKLCH).
- [ ] Il README è nella radice del repo (`README.md`).

### 5c. Aggiornare la documentazione

- [ ] [brief.md](brief.md): aggiorna lo stato in cima e la data; nella sezione 11 il frontend è React + Vite (non "Next.js o SvelteKit") e l'hosting è quello scelto; nella sezione 10 la struttura delle cartelle è `engine/`, `server/`, `client/` (non `web/`); nella sezione 14 chiudi le decisioni prese.
- [ ] [CLAUDE.md](../CLAUDE.md): aggiorna "Stato attuale" e l'hosting nello stack.
- [ ] Spunta tutto in [roadmap-prima-versione.md](roadmap-prima-versione.md).

### 5d. Portfolio

- [ ] Il progetto entra nel portfolio con il link alla demo e al repo.
- [ ] Una frase su cosa hai imparato (per esempio: separare il motore dall'interfaccia, SSRF, deploy di un servizio che fa girare un browser).

### 5e. L'ultima prova

- [ ] Spiega a voce il percorso di una richiesta, dal campo URL fino ai campioni a schermo, passando per: validazione, controllo SSRF nel server, limite di analisi contemporanee, `analyzeUrl`, Chromium e `page.route`, lettura dei colori, `countColors`, JSON, rendering in React.

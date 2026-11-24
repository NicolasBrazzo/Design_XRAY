# Design XRAY: roadmap "prima versione online"

> Obiettivo: un link pubblico dove incolli un URL e vedi la palette del sito (sfondi, testo, bordi) con i conteggi. Solo colori, ma finito: online, usato su un sito vero, con un README.

**Prima:** [roadmap-colori.md](archivio/roadmap-colori.md), che ha portato il motore a contare sfondi, testo e bordi.
**Dopo:** una proprietà alla volta, portata ogni volta fino al report (vedi "E dopo?").

## Perché cambia l'ordine

Finora si è costruito il motore in profondità, e dopo due settimane il risultato si vede solo nel terminale. Da qui si va in verticale: con quello che c'è già si attraversano tutti gli strati (motore, API, pagina, deploy). Poi ogni nuova proprietà arriva subito anche nel report, così ogni sera di lavoro si vede a schermo.

```
URL ──▶ pagina React ──▶ POST /api/analyze ──▶ engine (Playwright) ──▶ JSON ──▶ palette a schermo
```

## Come lavoriamo

- Il codice lo scrivi tu; Claude spiega, dà indizi e fa review.
- **Il quaderno in `docs/lab/` solo per i problemi difficili**: contrasto, sfondo reale dietro un testo, raggruppamento dei colori simili. Per le parti semplici bastano il codice e un test.
- Niente domande di verifica da spuntare: alla fine di ogni tappa devi saper spiegare a voce cosa hai fatto e perché.
- Bloccato da più di 20 minuti: chiedi un indizio.

---

## Tappa 0 · Chiudere i colori (10 minuti)

- [x] Archiviare `roadmap-colori.md`.
- [ ] Il caso dei bordi con lati diversi (Passo D): se lo hai già gestito nel codice, annota una riga in `docs/lab/colori-bordo-conteggio-grezzo.md`; se no, mettilo tra i limiti noti.

## Tappa 1 · Un motore che si può chiamare

**Obiettivo:** una funzione `analyzeUrl(url)` esportata da `engine/src/index.ts`, che restituisce il risultato o un errore. La CLI diventa un guscio sottile che la chiama e stampa.

- [ ] Sposta la logica di `printPageBackground` in `analyzeUrl`. La funzione **non stampa e non tocca `process`**: restituisce dati.
- [ ] Gli errori diventano valori con un codice (`INVALID_URL`, `PAGE_ERROR`, `NOT_FOUND`, `TIMEOUT`, ...), non messaggi in console. Sarà il server a tradurli in stati HTTP e la pagina in testi per l'utente.
- [ ] Rinomina quello che resta in `cli.ts`: stampa molto più dello sfondo.
- [ ] I test esistenti passano. Aggiungi un test su un URL non valido, che non apre il browser.

**Cosa capire:** è la regola del brief "motore separato dall'interfaccia". Una funzione che stampa può usarla solo un terminale; una che restituisce dati la usano CLI, API e test.

**Fatto quando:** `node src/cli.ts <url>` stampa lo stesso JSON di prima, ma passando da `analyzeUrl`.

## Tappa 2 · L'endpoint

**Obiettivo:** `POST /api/analyze` con `{ "url": "..." }` in `server/index.js`.

- [ ] Il server importa `analyzeUrl` dal motore. *Indizio:* Node ≥ 22.18 esegue i `.ts` anche se importati da un `.js`, e Playwright viene risolto da `engine/node_modules`.
- [ ] Traduci i codici di errore in stati HTTP: 400 URL non valido, 502 la pagina ha risposto con un errore, 504 timeout.
- [ ] Proxy di Vite: `/api` verso `http://localhost:3000`, così il client in sviluppo chiama lo stesso indirizzo che userà online.
- [ ] Provalo con `curl` prima di avere una pagina.

**Cosa capire:** un'analisi dura qualche secondo e apre un browser. Per ora una richiesta = un browser, ed è accettabile. Coda di lavori e browser condiviso sono il problema di system design per dopo: annota qui sotto come lo faresti, senza scriverlo.

**Fatto quando:** `curl` su un sito vero restituisce la palette, e su un URL sbagliato un errore con lo stato giusto.

## Tappa 3 · La pagina del report

**Obiettivo:** la parte tua. Campo URL, analisi, tre palette di campioni con hex e conteggio.

- [ ] **Prima il design, su carta.** Quattro stati: vuoto, caricamento (5-20 secondi, quindi va pensato), errore, risultato. Almeno tre disposizioni diverse per il risultato, poi scegli. Manda una foto per una critica, non per farti disegnare la pagina.
- [ ] Poi React e Tailwind: un componente per il campione, uno per la palette, uno per il form.
- [ ] Mostra in pagina i limiti noti, in una riga: "conta gli elementi, non l'area occupata", "i colori semitrasparenti sono esclusi".
- [ ] Una sola interazione in più, se vuoi: copiare l'hex con un clic.

**Fatto quando:** da `npm run dev` analizzi un sito e il risultato ti sembra fatto da te, non da un template.

## Tappa 4 · Online

**Obiettivo:** un solo servizio su Railway o Render: Express serve sia l'API sia la build del client.

- [ ] Express serve `client/dist` come file statici.
- [ ] Un `Dockerfile` basato sull'immagine ufficiale di Playwright, che ha già Chromium e le sue dipendenze.
- [ ] **Protezioni minime, prima di pubblicare il link:**
  - blocca gli indirizzi interni dopo aver risolto il dominio: localhost, reti private, `169.254.169.254` (SSRF, vedi i vincoli in `CLAUDE.md`);
  - timeout sull'analisi;
  - limite di richieste per IP e al massimo un paio di analisi contemporanee.
- [ ] Chiudi nel brief la decisione aperta "Dove pubblicare la demo?".

**Cosa capire:** il tuo server apre un URL scelto da uno sconosciuto. Senza il blocco degli indirizzi interni, chiunque può fargli leggere servizi che non dovrebbero essere raggiungibili da fuori.

**Fatto quando:** il link funziona da telefono, e un URL verso `http://localhost` viene rifiutato.

## Tappa 5 · Prova vera e chiusura

- [ ] Analizza il sito attuale di Futura e altri due siti. Annota in una lista breve cosa è sbagliato o manca: diventa la lista della prossima tappa.
- [ ] README in inglese o italiano (decidi, è una decisione aperta del brief): cosa fa, screenshot, link, limiti noti, come gira in locale.
- [ ] Il progetto entra nel portfolio con il link.

## Finito quando

- [ ] Un link pubblico analizza un URL e mostra le tre palette.
- [ ] Lo hai usato su un sito vero, quello di Futura.
- [ ] README con screenshot e limiti.
- [ ] Sai spiegare a voce il percorso di una richiesta, dal campo URL fino ai campioni a schermo.

## E dopo?

Una proprietà alla volta, e **ogni proprietà è finita solo quando si vede nel report**. Ordine suggerito, dal più visibile:

1. Tipografia: `font-family` e `font-size`.
2. `border-radius`.
3. Spaziature: `margin`, `padding`, `gap`.
4. Raggruppamento dei colori simili in OKLCH: qui torna utile il quaderno.

Il piano completo resta in [roadmap-completa.md](archivio/roadmap-completa.md) come riferimento, non come scaletta.

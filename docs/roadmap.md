# Design XRAY: roadmap dell'MVP

> Il primo obiettivo è piccolo apposta: **scrivi nel terminale l'URL di una pagina e il programma ti dice di che colore è lo sfondo.** Nient'altro.

**Ultimo aggiornamento:** 11 novembre 2026 · **Passo attuale:** 0

Il piano completo (M0–M6) è archiviato in [archivio/roadmap-completa.md](archivio/roadmap-completa.md). Non serve leggerlo adesso: lo riprendiamo quando l'MVP è finito e ogni sua parte ti è chiara.

---

## Cosa costruiamo

```
$ node src/cli.ts https://example.com
{
  "url": "https://example.com/",
  "background": "rgb(238, 238, 238)",
  "source": "body"
}
```

*(I valori sono d'esempio.)* Tre informazioni: l'indirizzo della pagina, il colore di sfondo e **da dove** viene quel colore.

Il programma fa tre cose in fila:

```
URL ──▶ apre la pagina ──▶ legge lo sfondo ──▶ stampa il risultato
        (acquisizione)      (estrazione)        (output)
```

Sono tre delle cinque fasi del progetto completo, in miniatura. Le altre due (normalizzazione e inferenza) arriveranno dopo.

## Come lavoriamo

- **Il codice lo scrivi tu.** Claude ti dà indizi, spiega e rivede il tuo codice. La soluzione completa te la dà solo se la chiedi.
- **Un passo alla volta.** Ogni passo finisce con qualcosa che esegui e vedi nel terminale.
- **Prima di spuntare un passo, rispondi alla domanda di verifica** con parole tue. Se non ci riesci, il passo non è finito, e va bene così.
- **Bloccato da più di 20 minuti?** Chiedi un indizio, non la soluzione.
- **Prima la documentazione ufficiale, poi l'AI.** I link sono in ogni passo.

---

## Passo 0 · Preparare l'ambiente

**Obiettivo:** poter eseguire file TypeScript con Node, senza compilarli.

- [x] Aggiornare Node.js. Ora è installato il 22.14, ma Node esegue i file `.ts` direttamente solo dalla 22.18 in poi. Installa l'ultima versione LTS da [nodejs.org](https://nodejs.org/en/download) e controlla con `node --version`.
- [x] Da `engine/`: `npm install`, poi `npx playwright install chromium` (scarica il browser che Playwright userà).
- [x] Da `engine/`: `npm test`. C'è già un test che controlla che Chromium sia installato.

**Cosa capire:** Node "cancella" i tipi TypeScript e poi esegue il JavaScript che resta. Quindi in un file `.ts` puoi scrivere JavaScript normale: i tipi li aggiungi quando servono.

**Risorse:** [Node.js e TypeScript](https://nodejs.org/api/typescript.html)

**Fatto quando:** `node --version` mostra 22.18 o più e `npm test` passa.

---

## Passo 1 · Guardare a mano ✅

**Obiettivo:** vedere con i DevTools quello che il programma farà in automatico.

- [x] In Console: `getComputedStyle(document.body).backgroundColor`.
- [x] Confrontare il valore della Console con quello del pannello degli stili.
- [x] Esperimento: togliere la classe `dark` da `<html>` e rileggere lo sfondo.
- [x] Rispondere alla domanda di verifica.

**Cosa hai visto:**

- **Valore dichiarato:** quello scritto nel CSS (pannello Regole/Styles). Ce ne possono essere più d'uno in conflitto, come `--background` in `:root` e in `.dark`.
- **Valore calcolato:** quello che il browser ha scelto alla fine (pannello Calcolate/Computed, e `getComputedStyle`). È uno solo e ha un formato standard (`rgb(...)` invece di `#09090b`).

**Risorse:**

- [MDN: getComputedStyle](https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle)
- [MDN: come il browser elabora i valori CSS](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Property_value_processing) (in fondo, la sezione "Resolved value" spiega cosa restituisce `getComputedStyle`)
- DevTools: [Firefox, esaminare il CSS](https://firefox-source-docs.mozilla.org/devtools-user/page_inspector/how_to/examine_and_edit_css/index.html) · [Chrome, CSS](https://developer.chrome.com/docs/devtools/css)

**Domanda di verifica:** perché il programma leggerà il valore calcolato invece del testo del CSS?

---

## Passo 2 · Aprire una pagina con Playwright

**Obiettivo:** uno script che apre un sito e stampa il titolo della pagina. File di prova: `engine/scratch/title.ts` (si può buttare dopo).

**Cosa capire:**

- **Browser headless:** un Chromium vero, senza finestra, comandato dal tuo codice.
- **Playwright come libreria:** la catena è *avvio il browser → apro una pagina → vado a un URL → leggo qualcosa → chiudo il browser*.
- **Quasi tutto è asincrono:** ogni passaggio parla con un altro processo (il browser), quindi va aspettato con `await`.
- **Il browser va chiuso sempre**, anche quando qualcosa va storto (`try/finally`). Altrimenti restano processi di Chromium aperti in memoria.

**Consiglio:** all'inizio avvia il browser con `headless: false`. Vedrai la finestra aprirsi e andare sul sito, e capirai meglio cosa sta succedendo.

**Risorse:**

- [Playwright come libreria](https://playwright.dev/docs/library) (la pagina da cui partire)
- [`chromium.launch`](https://playwright.dev/docs/api/class-browsertype#browser-type-launch) · [`page.goto`](https://playwright.dev/docs/api/class-page#page-goto) · [`page.title`](https://playwright.dev/docs/api/class-page#page-title)
- [MDN: try...catch...finally](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch)

**Fatto quando:** `node scratch/title.ts` stampa il titolo di due siti diversi.

**Domanda di verifica:** cosa succede se dimentichi di chiudere il browser? E se togli l'`await` davanti a `goto`?

---

## Passo 3 · Leggere lo sfondo

**Obiettivo:** `engine/src/cli.ts` apre un URL scritto nel codice e stampa lo sfondo del `body`, lo stesso valore che vedi in Console.

**Cosa capire: i due mondi.** Il tuo script gira in **Node**, mentre `document` e `getComputedStyle` esistono solo **dentro la pagina**. `page.evaluate(funzione)` prende la tua funzione, la manda alla pagina come testo, la esegue lì e ti restituisce il risultato. Ne seguono due regole:

1. Dentro la funzione non vedi le variabili del tuo script. Se ti serve un valore, lo passi come argomento.
2. Il risultato deve poter diventare JSON: stringhe, numeri, oggetti semplici. Un elemento del DOM no.

**Esperimento:** metti un `console.log` dentro la funzione di `evaluate`. Compare nel terminale? Perché?

**Risorse:**

- [Playwright: eseguire JavaScript nella pagina](https://playwright.dev/docs/evaluating)
- [`page.evaluate`](https://playwright.dev/docs/api/class-page#page-evaluate)
- [MDN: introduzione al DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction)

**Fatto quando:** su 2 o 3 siti il programma stampa lo stesso `rgb(...)` che leggi in Console.

**Domanda di verifica:** cosa succederebbe se la funzione restituisse `document.body` invece del colore?

---

## Passo 4 · L'URL dal terminale

**Obiettivo:** `node src/cli.ts https://un-sito.it` funziona con qualsiasi URL, senza modificare il codice.

**Cosa capire:**

- **`process.argv`:** l'array con le parole del comando che hai scritto nel terminale.
- **Validare prima di aprire il browser:** avviare Chromium costa tempo e memoria, quindi un input sbagliato va scartato subito. `new URL(testo)` lancia un errore se il testo non è un URL. Accetta solo `http:` e `https:`: un programma che apre pagine non deve aprire `file:` o `javascript:`. È il primo mattone della sicurezza del progetto.
- **Codice di uscita:** un programma che fallisce lo comunica al sistema con un numero diverso da 0 (`process.exitCode = 1`). Serve agli altri programmi per capire che qualcosa è andato storto.

**Risorse:**

- [Node: `process.argv`](https://nodejs.org/api/process.html#processargv) (nella stessa pagina trovi anche `process.exitCode`)
- [MDN: `new URL()`](https://developer.mozilla.org/en-US/docs/Web/API/URL/URL) · [MDN: `url.protocol`](https://developer.mozilla.org/en-US/docs/Web/API/URL/protocol)

**Fatto quando:** `node src/cli.ts ciao` e `node src/cli.ts file:///C:/` danno un messaggio chiaro **senza aprire il browser**, e un URL valido funziona.

**Domanda di verifica:** perché validare l'URL prima di avviare il browser, e non dopo?

---

## Passo 5 · Quando lo sfondo è trasparente

**Obiettivo:** il programma dà sempre il colore che si vede davvero e dice da dove l'ha preso. L'output diventa l'oggetto JSON mostrato in cima a questa pagina.

**Cosa capire:**

- Molti siti non danno uno sfondo al `body`. In quel caso `getComputedStyle` restituisce `rgba(0, 0, 0, 0)`: non è nero, è **trasparente** (l'ultimo numero è l'opacità, e 0 vuol dire invisibile).
- Regola semplificata: guardo il `body`. Se è trasparente guardo `<html>`. Se è trasparente anche quello, vale lo sfondo predefinito del browser, cioè il bianco.
- Il campo `source` (`"body"`, `"html"` o `"default"`) dice da dove viene la risposta. È la versione in piccolo di un principio del progetto: ogni risultato porta con sé le sue prove.
- L'`url` nell'output è l'indirizzo **finale**, dopo eventuali redirect: chiedilo alla pagina, non copiare quello che hai ricevuto.
- Perché stampare JSON e non una frase: un altro programma (più avanti il server, la pagina web) potrà leggerlo.

**Esperimento:** trova un sito con il `body` trasparente aprendo i DevTools su qualche sito. Oppure simulalo in Console con `document.body.style.background = 'transparent'` e guarda cosa cambia a schermo.

**Risorse:**

- [MDN: `background-color`](https://developer.mozilla.org/en-US/docs/Web/CSS/background-color) (il valore iniziale è `transparent`)
- [MDN: `rgb()` e l'opacità](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/rgb)
- [Specifica CSS: lo sfondo della finestra e il `body`](https://www.w3.org/TR/css-backgrounds-3/#body-background). Lettura facoltativa: spiega perché lo sfondo del `body` colora tutta la finestra.

**Fatto quando:** su un sito con il `body` trasparente il programma stampa il colore giusto e la `source` giusta.

**Domanda di verifica:** perché `rgba(0, 0, 0, 0)` non vuol dire "nero"?

---

## Passo 6 · Errori chiari

**Obiettivo:** quando qualcosa va storto, un messaggio comprensibile invece di un errore lungo e illeggibile.

**I casi da gestire:**

| Caso | Come provarlo |
|---|---|
| Il sito non esiste | un dominio inventato, per esempio `https://questo-sito-non-esiste-1234.com` |
| Il sito è troppo lento | metti un tempo massimo bassissimo nell'opzione `timeout` di `goto` |
| La pagina risponde con un errore (404, 403…) | un indirizzo inesistente di un sito vero, per esempio `/pagina-che-non-esiste` |

**Cosa capire:** `goto` lancia un errore se il sito non risponde o se scade il tempo, ma **non** se la pagina risponde 404. In quel caso la pagina esiste (è la pagina di errore del sito) e `goto` restituisce una risposta con il suo stato HTTP: sta a te controllarlo.

**Risorse:**

- [`page.goto`](https://playwright.dev/docs/api/class-page#page-goto) (leggi quando lancia errori e cosa restituisce)
- [`TimeoutError`](https://playwright.dev/docs/api/class-timeouterror) · [`response.status`](https://playwright.dev/docs/api/class-response#response-status)

**Fatto quando:** i tre casi danno tre messaggi diversi e un codice di uscita 1, e dopo non resta nessun Chromium aperto.

**Domanda di verifica:** se non controllassi lo stato HTTP, che sfondo stamperebbe il programma per una pagina 404?

---

## Passo 7 · Un test con un valore noto

**Obiettivo:** un test che dimostra che il programma legge il colore giusto, senza dipendere da nessun sito reale.

**Cosa capire:**

- **Perché un valore noto:** i siti veri cambiano, mentre una pagina che scrivi tu con `background: rgb(10, 20, 30)` dà sempre la stessa risposta. Nel progetto completo queste si chiamano *pagine sintetiche*.
- **Separare il codice:** sposta la lettura dello sfondo in una funzione `readBackground(page)` dentro `src/background.ts`. `cli.ts` la usa, e il test usa la stessa funzione. Il test crea la pagina con `page.setContent(html)`, senza internet.
- Così hai separato *aprire la pagina* (acquisizione) da *leggere lo sfondo* (estrazione): è la stessa divisione del progetto completo.
- Negli import tra file `.ts` si scrive l'estensione: `'./background.ts'`.

**Tre casi da testare:**

1. `body` colorato;
2. `body` trasparente e `html` colorato;
3. entrambi trasparenti.

**Risorse:**

- [Node: `node:test`](https://nodejs.org/api/test.html) · [Node: `assert`](https://nodejs.org/api/assert.html)
- [`page.setContent`](https://playwright.dev/docs/api/class-page#page-set-content)

**Fatto quando:** `npm test` passa con i tre casi. Se rompi apposta la funzione, il test fallisce.

**Domanda di verifica:** perché testare su una pagina scritta da te e non su un sito vero?

---

## MVP finito quando

- [ ] `node src/cli.ts <url>` stampa il JSON con `url`, `background` e `source`.
- [ ] Il `body` trasparente è gestito.
- [ ] URL non valido, sito inesistente, tempo scaduto e pagina di errore danno messaggi chiari.
- [ ] `npm test` passa senza internet.
- [ ] Sai rispondere a tutte le domande di verifica senza riaprire il codice.

## Limiti dichiarati

Non sono errori, sono scelte. Scriverli fa parte del progetto: un buon strumento dice anche cosa **non** sa fare.

- Legge solo `body` e `html`. Se il sito usa un contenitore a tutta pagina con un suo sfondo, l'MVP non lo vede.
- Ignora immagini e sfumature di sfondo (`background-image`).
- Non gestisce gli sfondi semitrasparenti, come `rgba(0, 0, 0, 0.5)`: il colore visibile dipenderebbe da cosa c'è sotto.
- Lo sfondo "predefinito" non è sempre bianco: una pagina può chiedere il tema scuro con [`color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme).
- Il colore può arrivare in formati diversi da `rgb()`, per esempio `oklch(...)`: l'MVP lo stampa così com'è.
- Non riconosce i siti che bloccano i browser automatici.

## E dopo?

Solo quando l'MVP ti è chiaro. In ordine di difficoltà:

1. **Convertire in hex:** una funzione pura `rgb(9, 9, 11)` → `#09090b`, con i suoi test.
2. **Tutti gli sfondi della pagina:** lo sfondo di ogni elemento visibile, con quante volte compare. È il primo vero passo verso la palette.
3. **I nomi delle variabili CSS:** il dizionario *valore → nome*, con il trucco della sonda.

Ognuno avrà una roadmap piccola come questa.

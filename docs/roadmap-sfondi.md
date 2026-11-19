# Design XRAY: roadmap "palette degli sfondi"

> Obiettivo: dato un URL, il programma stampa **tutti i colori di sfondo usati nella pagina**, in hex, con **quante volte compaiono**. È il primo passo verso la palette del design system.

**Prima:** l'MVP ([roadmap.md](roadmap.md)), che legge un solo valore (lo sfondo del `body`).
**Dopo:** le altre proprietà (`color`, `border-color`, `border-radius`, `font-size`, ...), una per volta, con lo stesso metodo.

## Cosa costruiamo

```
$ node src/cli.ts https://example.com
{
  "url": "https://example.com/",
  "backgrounds": [
    { "color": "rgb(255, 255, 255)", "hex": "#ffffff", "count": 41 },
    { "color": "rgb(9, 9, 11)",       "hex": "#09090b", "count": 12 },
    { "color": "rgb(244, 244, 245)",  "hex": "#f4f4f5", "count": 3 }
  ]
}
```

*(I valori sono d'esempio.)* Un design system non sta nel singolo elemento: sta nei **valori che si ripetono**. Per questo contiamo.

```
URL ──▶ apre la pagina ──▶ legge lo sfondo di ogni elemento ──▶ converte in hex ──▶ conta e ordina ──▶ stampa
        (acquisizione)      (estrazione)                         (normalizzazione)  (inizio inferenza)
```

Rispetto all'MVP entra in gioco una fase nuova, la **normalizzazione**: portare valori scritti in modi diversi a una forma unica, così si possono confrontare.

## Come lavoriamo

Come nell'MVP: il codice lo scrivi tu, io do indizi e rivedo. Prima di spuntare un passo rispondi alla domanda di verifica con parole tue. Bloccato da più di 20 minuti: chiedi un indizio.

---

## Passo A · Pulizia

**Obiettivo:** chiudere i piccoli problemi emersi dalla revisione dell'MVP, prima di costruirci sopra.

- [x] **Non eseguire la CLI all'import.** In `cli.ts` la funzione `printPageBackground()` è esportata ma viene anche chiamata a livello di modulo: chi la importa la fa partire senza volerlo. Fai in modo che parta solo quando il file è eseguito da terminale. *Indizio:* cerca `import.meta.main` nella documentazione di Node sui moduli ES (disponibile dalla 22.18).
- [x] **Mettere `chromium.launch()` dentro la gestione degli errori**, in modo che un Chromium mancante dia un messaggio chiaro. Attenzione: se il `launch` fallisce, `browser` non esiste e nel `finally` non puoi chiuderlo. Come si gestisce?
- [x] **Aggiornare i documenti:** nel `docs/roadmap.md` l'intestazione dice ancora "Passo attuale: 0"; in `docs/da-sistemare.md` il file indicato (`cli.ts`) è ora `background.ts`.
- [x] Facoltativo, ma utile: un test per `validateUrl`, che è una funzione pura e quindi la più facile da testare.

**Risorse:** [Node: `import.meta.main`](https://nodejs.org/api/esm.html#importmetamain) · [MDN: try...catch...finally](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch)

**Fatto quando:** importare `cli.ts` da un altro file non apre nessun browser, e `npm test` passa ancora.

**Domanda di verifica:** perché un file che esporta una funzione non dovrebbe eseguirla da solo quando viene importato?

---

## Passo B · Guardare a mano tutti gli sfondi

**Obiettivo:** capire cosa restituisce davvero `getComputedStyle` quando lo chiedi per **ogni** elemento, prima di scrivere codice. Come il Passo 1 dell'MVP.

- [x] Su 2 o 3 siti, in Console:
  ```js
  const counts = {};
  document.querySelectorAll('*').forEach(e => {
    const v = getComputedStyle(e).backgroundColor;
    counts[v] = (counts[v] || 0) + 1;
  });
  console.table(counts);
  ```
- [x] Annota in `docs/lab/` (usa `_modello.md`) cosa osservi, per esempio:
  - quale valore compare più spesso, e perché (indizio: è un colore che nessuno ha scelto);
  - quanti valori distinti ci sono;
  - se compaiono colori semitrasparenti (`rgba(..., 0.5)`);
  - se ci sono elementi che non si vedono (nascosti, di larghezza 0, come `<script>` o `<style>`) e che colorano il conteggio.
- [x] Confronta con un sito che conosci: il colore più usato è quello che ti aspettavi?

**Cosa capire:** il conteggio grezzo mente. Prima di contare va deciso **cosa conta**: scartare i trasparenti e gli elementi invisibili. Queste regole le scegli tu, e vanno scritte (ricordi il principio "ogni risultato porta le sue prove").

**Risorse:** [MDN: `querySelectorAll`](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll) · [MDN: `getBoundingClientRect`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)

**Fatto quando:** nel quaderno hai scritto le regole su cosa si conta e cosa si scarta, con un esempio reale per ciascuna.

**Domanda di verifica:** perché il valore più frequente nel conteggio grezzo quasi mai è un colore del design?

---

## Passo C · Da `rgb(...)` a hex

**Obiettivo:** una funzione pura `rgbToHex("rgb(9, 9, 11)")` → `"#09090b"`, con i suoi test. File: `engine/src/color.ts`.

**Cosa capire:**

- **Normalizzare:** `rgb(9, 9, 11)` e `#09090b` sono lo stesso colore scritto in due modi. Per contare, i valori uguali devono avere la stessa forma. Qui nasce la fase di normalizzazione.
- **Funzione pura:** stesso input, stesso output, nessun browser, nessuna rete. Per questo si testa in millisecondi, senza Playwright.
- **Esadecimale:** ogni canale (0-255) diventa due cifre in base 16, con lo zero davanti se serve (`9` → `09`).
- **Cosa fare con `rgba(...)`:** `getComputedStyle` lo usa per i colori con trasparenza. Decidi e scrivi la regola: alfa 0 si scarta (controllando solo il quarto valore, come annotato in `da-sistemare.md`); alfa tra 0 e 1 è un **limite dichiarato** (il colore visibile dipende da cosa c'è sotto). Come lo segnali?
- **Input non riconosciuto** (per esempio `oklch(...)`): cosa restituisce la funzione? Un errore, `null`? Scegli e scrivilo.

**Test da scrivere** (con `node:test`, senza browser): un `rgb` normale, uno con canali a una cifra, il nero e il bianco, un `rgba` con alfa 1, uno con alfa 0, una stringa non valida.

**Risorse:** [MDN: `Number.prototype.toString`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toString) (il parametro della base) · [MDN: `String.prototype.padStart`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart) · [MDN: espressioni regolari](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions) · [Node: `node:test`](https://nodejs.org/api/test.html)

**Fatto quando:** `npm test` passa con i casi sopra e, rompendo apposta la funzione, almeno un test fallisce.

**Domanda di verifica:** perché `rgb(9, 9, 11)` e `#09090b` devono diventare la stessa stringa **prima** di contare?

---

## Passo D · Contare gli sfondi

**Obiettivo:** `readBackgrounds(page)` in `engine/src/backgrounds.ts` restituisce l'elenco dei colori di sfondo con il conteggio, e la CLI lo stampa.

**Cosa capire:**

- **Dentro la pagina si raccoglie, fuori si elabora.** Come nell'MVP, la funzione di `page.evaluate` gira nel browser e può restituire solo dati che diventano JSON. Un `Map` **non** si serializza: restituisci un array. Il conteggio e l'hex li fai in Node, dove hai le tue funzioni e puoi testarle.
- **Cosa raccogliere per elemento:** il colore e, per scartare gli invisibili, la dimensione. Quanto poco puoi far uscire dalla pagina? (Meno dati escono, più è veloce e più è semplice il test.)
- **Regole del Passo B**, applicate: scarta trasparenti e invisibili, normalizza in hex, conta.
- **Output deterministico:** stesso input, stesso output. Ordina per conteggio decrescente e, a parità, per hex. Senza il secondo criterio l'ordine dei pari merito può cambiare da una esecuzione all'altra.
- **Prove:** ogni voce porta almeno `color` (il valore originale), `hex` e `count`. Facoltativo: un selettore di esempio, o l'area occupata in pixel. Il conteggio dice quanti elementi usano un colore, ma un colore su 3 elementi enormi può contare più di uno su 40 icone: è la differenza tra **frequenza** e **peso visivo**. Annotala nei limiti.

**Test (senza internet):** una pagina con `setContent` e elementi di colori noti. Per esempio tre `div` rossi, due blu, uno trasparente e uno con `display: none`: il risultato atteso è rosso 3, blu 2, e nient'altro. Aggiungi un caso con due colori a pari conteggio per verificare l'ordine.

**Limiti dichiarati (da copiare nel documento finale):**

- Gli sfondi semitrasparenti non sono composti sullo sfondo sottostante.
- Ignora `background-image` e sfumature.
- Non vede i pseudo-elementi (`::before`, `::after`).
- Un conteggio per elementi non dice quanto spazio occupa ogni colore.
- Le pagine che caricano contenuto dopo l'apertura potrebbero essere lette troppo presto.

**Risorse:** [Playwright: `page.evaluate`](https://playwright.dev/docs/evaluating) · [MDN: `Array.prototype.sort`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) (il confronto con due criteri) · [MDN: `Object.groupBy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy) oppure `Map`, a scelta tua

**Fatto quando:** il test sintetico passa, e su 2 o 3 siti reali la palette stampata ti sembra coerente con quello che vedi a schermo (confronta con quello che avevi scoperto a mano nel Passo B).

**Domanda di verifica:** perché il conteggio si fa in Node e non dentro `page.evaluate`? E perché l'ordine a parità di conteggio deve essere definito?

---

## Finito quando

- [x] Importare `cli.ts` non lancia nulla.
- [x] `docs/lab/` contiene le regole su cosa si conta e cosa si scarta.
- [x] `rgbToHex` ha i suoi test e gestisce `rgba`.
- [ ] `node src/cli.ts <url>` stampa la lista di sfondi con hex e conteggio, in ordine stabile.
- [ ] `npm test` passa senza internet.
- [ ] Sai rispondere a tutte le domande di verifica senza riaprire il codice.

## E dopo?

Con lo stesso schema (a mano in Console → regole nel quaderno → funzione pura → raccolta nella pagina → conteggio) si passa alle altre proprietà, in ordine di difficoltà: `color` e `border-color` (stessa funzione `rgbToHex`), poi `border-radius` e `font-size`, poi `margin`/`padding`, infine `box-shadow` e `transition`.

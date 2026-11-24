# Design XRAY: roadmap "colori del testo e dei bordi"

> **Archiviata il 24 novembre 2026.** Il motore conta sfondi, testo e bordi. I punti rimasti aperti sono passati nella Tappa 0 di [roadmap-prima-versione.md](../roadmap-prima-versione.md) oppure non servono più (rename della CLI: Tappa 1; domande di verifica: sostituite dalla spiegazione a voce).

> Obiettivo: dato un URL, il programma stampa anche **tutti i colori del testo** e **tutti i colori dei bordi** usati nella pagina, in hex, con **quante volte compaiono**. Insieme agli sfondi, completa la palette di colori del design system.

**Prima:** [roadmap-sfondi.md](roadmap-sfondi.md), che conta gli sfondi (`readBackgrounds`, `rgbToHex`).
**Dopo:** `border-radius` e `font-size`, poi `margin`/`padding`, infine `box-shadow` e `transition`.

## Cosa costruiamo

```
$ node src/cli.ts https://example.com
{
  "url": "https://example.com/",
  "backgrounds": [ ... ],
  "textColors": [
    { "color": "rgb(9, 9, 11)",    "hex": "#09090b", "count": 58 },
    { "color": "rgb(113, 113, 122)", "hex": "#71717a", "count": 14 }
  ],
  "borderColors": [
    { "color": "rgb(228, 228, 231)", "hex": "#e4e4e7", "count": 23 }
  ]
}
```

*(I valori sono d'esempio.)* Lo schema è quello degli sfondi, ma cambia la domanda più importante: **cosa conta?** Per lo sfondo bastava scartare trasparenti e invisibili. Qui un elemento può avere un `color` calcolato senza mostrare nessun testo, e un `border-color` senza mostrare nessun bordo.

```
URL ──▶ apre la pagina ──▶ legge color e border-color ──▶ converte in hex ──▶ conta e ordina ──▶ stampa
        (acquisizione)      di ogni elemento che li usa     (normalizzazione)  (inizio inferenza)
                            (estrazione)
```

## Come lavoriamo

Come nelle roadmap precedenti: il codice lo scrivi tu, io do indizi e rivedo. Prima di spuntare un passo rispondi alla domanda di verifica con parole tue. Bloccato da più di 20 minuti: chiedi un indizio.

Il metodo è sempre lo stesso: **a mano in Console → regole nel quaderno → raccolta nella pagina → conteggio → test.** La funzione pura (`rgbToHex`) esiste già e non si tocca, salvo un caso (vedi Passo B).

---

## Passo A · Guardare a mano i colori del testo

**Obiettivo:** capire cosa restituisce `getComputedStyle(...).color` per ogni elemento, prima di scrivere codice.

- [x] Su 2 o 3 siti, in Console, conta il `color` calcolato di **tutti** gli elementi (stesso snippet del Passo B degli sfondi, cambiando la proprietà).
- [x] Rifai il conteggio solo sugli elementi che hanno **testo proprio**: almeno un nodo di testo non vuoto tra i figli diretti. *Indizio:* `childNodes`, `nodeType`, `Node.TEXT_NODE`, `trim()`.
- [x] Confronta le due tabelle e annota in `docs/lab/` (usa `_modello.md`, nome suggerito `colori-testo-conteggio-grezzo.md`):
  - quanto cambia il conteggio tra "tutti" e "solo con testo proprio", e perché;
  - quali colori spariscono nel secondo conteggio;
  - se compaiono colori semitrasparenti (`rgba(..., 0.6)`): sono molto comuni per il testo secondario;
  - se compaiono testi nascosti (`visibility: hidden`, `opacity: 0`, `display: none`, testo fuori schermo).
- [x] Confronta con un sito che conosci: il colore del testo più usato è quello che ti aspettavi?

**Cosa capire:** `color` è una proprietà **ereditata**. Ogni elemento ha un `color` calcolato, anche un `div` che contiene solo altri `div`: lo ha preso dal genitore. Se conti tutti gli elementi, conti l'ereditarietà, non le scelte del design.

**Risorse:** [MDN: `color`](https://developer.mozilla.org/en-US/docs/Web/CSS/color) · [MDN: ereditarietà](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Inheritance) · [MDN: `Node.nodeType`](https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType)

**Fatto quando:** nel quaderno hai le due tabelle a confronto e una frase che spiega la differenza, con un esempio reale.

**Domanda di verifica:** perché il conteggio su tutti gli elementi sovrastima il colore del `body`?

---

## Passo B · Le regole per il testo

**Obiettivo:** scrivere nel quaderno cosa si conta e cosa si scarta, **prima** del codice. Sono scelte tue; la roadmap ti dà le domande.

- [x] **Quando un elemento "ha testo":** solo nodi di testo diretti non vuoti? E il testo dentro un `<input>` o un `placeholder`? Decidi e scrivi, anche se la risposta è "per ora no, limite dichiarato".
- [x] **Quando il testo non si vede:** `visibility: hidden`, `opacity: 0`, dimensione zero. Quali controlli servono e quali sono eccessivi per questa fase?
- [x] **Testo semitrasparente.** `rgbToHex` oggi restituisce `null` per alfa diverso da 1, quindi `rgba(0, 0, 0, 0.6)` sparirebbe dalla palette. Per gli sfondi era accettabile; per il testo no, perché il grigio del testo secondario è quasi sempre un nero o un bianco con trasparenza. Tre strade, scegline una e scrivi il perché:
  1. scartarli, come ora, e dichiararlo nei limiti;
  2. contarli separatamente, con il loro `rgba(...)` originale e senza hex;
  3. comporli sullo sfondo (la regola del progetto: "la trasparenza va composta sullo sfondo prima di confrontare i colori"). Richiede di sapere qual è lo sfondo dietro il testo: probabilmente è troppo per questa fase.
- [x] **`transparent` e `currentcolor`:** per `color` il valore calcolato è sempre un colore concreto, ma controlla in Console cosa restituisce il browser.

**Fatto quando:** nel quaderno c'è una sezione "Regole per il testo" con ogni decisione e un esempio reale.

**Domanda di verifica:** perché per il testo la regola "scarta tutto ciò che non ha alfa 1" cancella proprio colori importanti per il design?

---

## Passo C · Contare i colori del testo

**Obiettivo:** `readTextColors(page)` in `engine/src/textColors.ts` restituisce l'elenco dei colori del testo con il conteggio, e la CLI lo stampa sotto `textColors`.

**Cosa capire:**

- **Cosa raccogliere per elemento:** il colore, la dimensione (per gli invisibili) e un booleano "ha testo proprio". Il calcolo del booleano si fa **dentro** la pagina, perché lì hai i nodi: fuori da `evaluate` i nodi non esistono. Quanto poco puoi far uscire?
- **Regole del Passo B**, applicate in Node: filtra, normalizza in hex, conta, ordina (conteggio decrescente, poi hex).
- **Forma del risultato:** stessa di `readBackgrounds` (`color`, `hex`, `count`). Se hai scelto la strada 2 per i semitrasparenti, decidi come rappresentarli.
- **Peso visivo:** un titolo enorme e 40 link minuscoli contano uguale per elemento. Annotalo nei limiti. Facoltativo: aggiungere ai risultati anche il numero di caratteri.

**Test (senza internet), con `setContent`:** testo rosso in 3 elementi, blu in 2; un `div` contenitore senza testo proprio che eredita un colore diverso; un elemento con testo e `display: none`; un caso con due colori a pari conteggio per verificare l'ordine; un testo semitrasparente, secondo la regola che hai scelto.

**Limiti dichiarati (da copiare nel documento finale):**

- Conta elementi con testo proprio, non caratteri né area: la frequenza non è il peso visivo.
- Ignora il testo dentro `<input>`, `<textarea>` e `placeholder` (se così hai scelto).
- Non vede i pseudo-elementi (`::before`, `::after`).
- Testo semitrasparente: secondo la regola scelta nel Passo B.
- Il colore dei link `:hover` e `:visited` non si legge: è lo stato a riposo.

**Risorse:** [Playwright: `page.evaluate`](https://playwright.dev/docs/evaluating) · [MDN: `Node.childNodes`](https://developer.mozilla.org/en-US/docs/Web/API/Node/childNodes) · [Node: `node:test`](https://nodejs.org/api/test.html)

**Fatto quando:** il test sintetico passa, e su 2 o 3 siti reali la palette del testo coincide con quello che vedi e con le tabelle del Passo A.

**Domanda di verifica:** perché "ha testo proprio" va calcolato dentro `page.evaluate` e non in Node?

---

## Passo D · Guardare a mano i colori dei bordi

**Obiettivo:** capire cosa restituisce `getComputedStyle` per i bordi, che sono quattro (alto, destra, basso, sinistra) e possono avere colori, spessori e stili diversi.

- [x] In Console, su 2 o 3 siti, per ogni elemento leggi `borderTopColor`, `borderTopWidth` e `borderTopStyle`. Conta i colori prima senza filtri e poi solo dove spessore > 0.
- [x] Controlla cosa restituisce il browser per un elemento **senza bordo**: che colore ha, che spessore ha, che stile? *Indizio:* nei DevTools guarda un `div` qualsiasi e cerca `border-top-color` nel pannello Computed.
- [ ] Controlla un caso con **lati diversi**: per esempio un elemento con solo `border-bottom`. Se leggi soltanto `borderTopColor` cosa perdi?
- [x] Annota in `docs/lab/` (nome suggerito `colori-bordo-conteggio-grezzo.md`) cosa osservi.

**Cosa capire:** il valore iniziale di `border-color` è `currentcolor`, cioè **il colore del testo**. Un elemento senza bordo ha quindi un `border-color` calcolato uguale al suo `color`. Se non filtri per spessore, la palette dei bordi diventa una copia della palette del testo.

**Risorse:** [MDN: `border-color`](https://developer.mozilla.org/en-US/docs/Web/CSS/border-color) · [MDN: `currentcolor`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#currentcolor_keyword) · [MDN: `border-width`](https://developer.mozilla.org/en-US/docs/Web/CSS/border-width)

**Fatto quando:** nel quaderno hai scritto la regola "un lato conta se…" con un esempio reale, e cosa succede con `outline` e `box-shadow` usati come finti bordi.

**Domanda di verifica:** perché un elemento senza bordo ha comunque un `border-color` calcolato, e perché va scartato?

---

## Passo E · Contare i colori dei bordi

**Obiettivo:** `readBorderColors(page)` in `engine/src/borderColors.ts` restituisce l'elenco dei colori dei bordi con il conteggio, e la CLI lo stampa sotto `borderColors`.

**Cosa capire:**

- **Quattro lati, un conteggio:** decidi cosa conti. Una voce per elemento? Una per lato visibile? Le due scelte danno numeri diversi: un riquadro con bordo uniforme conta 1 oppure 4. Scegli, scrivilo e fai in modo che il test lo dimostri.
- **Cosa raccogliere:** per ogni lato colore, spessore e stile, oppure solo quello che serve dopo aver deciso la regola. Meno dati escono dalla pagina, meglio è.
- **Stesse regole di normalizzazione:** `rgbToHex`, alfa, ordinamento stabile. Se hai deciso una strada per i semitrasparenti nel Passo B, qui deve essere la **stessa**: un design system con due regole diverse per due proprietà è incoerente.

**Test (senza internet), con `setContent`:** elemento con bordo uniforme; elemento con solo `border-bottom`; elemento senza bordo (non deve comparire); bordo con stile `none` ma colore impostato; due colori a pari conteggio.

**Limiti dichiarati:**

- Non vede `outline`, `box-shadow` e `border-image`.
- Non vede i pseudo-elementi.
- Bordi semitrasparenti: secondo la regola scelta.
- Frequenza, non peso visivo.

**Risorse:** [Playwright: `page.evaluate`](https://playwright.dev/docs/evaluating) · [MDN: `border-style`](https://developer.mozilla.org/en-US/docs/Web/CSS/border-style)

**Fatto quando:** il test sintetico passa e su 2 o 3 siti reali i bordi trovati corrispondono a quelli che vedi a schermo.

**Domanda di verifica:** perché la regola dei semitrasparenti deve essere la stessa per testo, sfondo e bordo?

---

## Passo F · Mettere ordine

**Obiettivo:** ora che esistono tre funzioni che fanno lo stesso conteggio, decidere cosa unire. Si fa **dopo** aver scritto la terza, non prima: con due esempi si indovina male cosa hanno in comune, con tre si vede.

- [x] Confronta `backgrounds.ts`, `textColors.ts` e `borderColors.ts`: cosa è identico (normalizzare in hex, contare, ordinare) e cosa cambia (cosa si raccoglie e come si filtra)?
- [x] Estrai la parte identica in una funzione pura, per esempio `countColors(colors)`, in un file dedicato, con i suoi test senza browser. Le tre `read...` diventano: raccolta dalla pagina → filtro → `countColors`.
- [ ] `cli.ts`: la funzione `printPageBackground` ora stampa molto più dello sfondo. Valuta se il nome è ancora giusto.
- [x] Controlla che `npm test` e `npm run typecheck` passino.

**Cosa capire:** si separa ciò che dipende dalla pagina (la raccolta, che si testa con Playwright) da ciò che è logica pura (il conteggio, che si testa in millisecondi). È la stessa divisione tra estrazione e normalizzazione della pipeline.

**Fatto quando:** le tre funzioni usano lo stesso conteggio, nessun test è stato indebolito, e il comportamento dell'output non è cambiato rispetto a prima del refactor.

**Domanda di verifica:** perché conviene estrarre la funzione comune dopo la terza occorrenza invece che alla prima?

---

## Finito quando

- [ ] `docs/lab/` contiene le regole per testo e bordi, con un esempio reale per ciascuna.
- [x] `node src/cli.ts <url>` stampa `backgrounds`, `textColors` e `borderColors`, in ordine stabile.
- [x] Testo, sfondi e bordi trattano i colori semitrasparenti con la stessa regola.
- [x] Il conteggio è condiviso in una funzione pura con i suoi test.
- [x] `npm test` passa senza internet.
- [ ] Sai rispondere a tutte le domande di verifica senza riaprire il codice.

## E dopo?

Si passa alle proprietà che non sono colori, dove la normalizzazione cambia: `border-radius` e `font-size` (lunghezze in px, con il valore in rem rispetto alla radice del sito), poi `margin`/`padding`, infine `box-shadow` e `transition`.

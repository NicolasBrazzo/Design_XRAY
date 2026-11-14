# Da sistemare

Cose notate durante il lavoro, da riprendere più avanti. Non bloccano il passo corrente.

## Riconoscere un colore trasparente (passo 5)

**Dove:** `engine/src/cli.ts`, dentro `page.evaluate`.

**Situazione:** oggi un colore è considerato trasparente solo se è la stringa esatta `"rgba(0, 0, 0, 0)"`. Va bene per il trasparente puro, perché `getComputedStyle` lo restituisce sempre in quel formato.

**Il problema:** un colore come `rgba(255, 0, 0, 0)` ha l'alfa a 0, quindi è trasparente, ma non coincide con la stringa e non verrebbe riconosciuto.

**Idea:** controllare solo il quarto valore (l'alfa) invece di confrontare l'intera stringa. Per i semitrasparenti (`rgba(0, 0, 0, 0.5)`) serve invece comporre il colore sullo sfondo sottostante: è un limite dichiarato dell'MVP.

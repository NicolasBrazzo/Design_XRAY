# Casi difficili

> Ogni problema incontrato nelle analisi di M0, con il sito dove compare, la fase della roadmap che dovrà risolverlo e una strategia proposta. Ogni caso è un candidato per una pagina sintetica in `engine/fixtures/synthetic/` (elenco in fondo).

**Siti:** SH = [shadcn/ui](shadcn-ui.md) · BS = [Bluesky](bluesky.md) · PY = [python.org](python-org.md)

---

## Fase 1 · Acquisizione (M1)

### C01 · Pagina costruita dal JavaScript · BS · M1.4

**Cosa succede.** L'HTML iniziale di Bluesky contiene 232 caratteri di testo; nessuno dei 15 testi campione della pagina finita compare nel sorgente. Tutto il resto lo costruisce il browser.
**Strategia.** Estrarre solo dopo `load`, `document.fonts.ready` e una breve calma della rete. Controllare che il numero di elementi visibili sia plausibile: poche decine vuol dire che la pagina non si è costruita, o che un blocco anti-bot l'ha fermata.

### C02 · Popup che copre la pagina · BS · M1.4 (segnalare), M6.3 (gestire)

**Cosa succede.** Al primo caricamento una finestra di benvenuto copre la pagina, con lo sfondo sfocato. Senza chiuderla, l'estrazione vedrebbe soprattutto il popup, e uno screenshot dello sfondo sfocato.
**Strategia.** In M1, riconoscere un elemento `position: fixed` che copre più di metà della finestra e segnalarlo in `meta`. In M6.3, riconoscerlo ed escluderlo da aree e conteggi, oppure chiuderlo.

### C03 · Contenuti che cambiano a ogni visita · BS, PY · M1.9

**Cosa succede.** Il feed di Bluesky ha dato 4.224 elementi in un passaggio e 8.462 in un altro, con post, immagini e video sempre diversi. Su python.org la barra di avviso cambia testo nel tempo.
**Strategia.** È il motivo per cui si salva `raw.json`: da lì in poi tutto è riproducibile. Le note di M0 descrivono l'**interfaccia**, mai i contenuti.

### C04 · Slideshow che cambia il DOM nel tempo · PY · M1.4

**Cosa succede.** Lo slideshow di python.org cambia slide ogni pochi secondi. Due misure fatte a pochi secondi di distanza danno risultati diversi: per esempio la ricerca dei breakpoint ha trovato cambi "fantasma" a 624–656 e 1664–1920px. Nel DOM ci sono 5 `h1`, uno solo visibile.
**Strategia.** Leggere tutti i dati in una sola chiamata, nello stesso istante. Provare l'opzione `reducedMotion: 'reduce'` del contesto di Playwright: non ferma le animazioni fatte in JavaScript, ma alcune librerie la rispettano.

### C05 · Fogli di stile di altri domini (CORS) · BS, PY · M1.4, M1.6

**Cosa succede.** `cssRules` lancia `SecurityError` sui due fogli di `web-cdn.bsky.app` (Bluesky) e su `jquery-ui.css` da `ajax.googleapis.com` (python.org).
**Strategia.** Quella già prevista: intercettare il testo dei CSS dalla rete e analizzarlo con css-tree.

### C06 · CSS scaricati ma non collegati alla pagina · SH · M1.6

**Cosa succede.** shadcn scarica 5 file CSS, ma solo 3 sono collegati al documento. Gli altri 2 sono caricati in anticipo da Next.js per altre pagine.
**Strategia.** Intercettare la rete non basta: analizzare solo i fogli che compaiono in `document.styleSheets`, usando la rete solo per leggerne il testo quando il CSSOM è bloccato.

### C07 · Font scaricati ma non usati · SH · M1.7, M3.1

**Cosa succede.** shadcn scarica 30 file di font, ma il testo è disegnato con una sola famiglia (Geist). Geist Mono e Noto Sans Arabic/Hebrew sono dichiarati e mai usati in pagina.
**Strategia.** I font "in uso" si decidono dal font disegnato (CDP `CSS.getPlatformFontsForNode`) e da `document.fonts` con stato `loaded`, non dalle richieste di rete.

---

## Fase 2 · Estrazione (M1)

### C08 · CSS-in-JS: `<style>` con il testo vuoto · BS · M1.6

**Cosa succede.** Un `<style>` di Bluesky ha `textContent` vuoto ma 418 regole; un altro 78. Le regole sono state inserite con `insertRule`: leggendo il testo dei tag non si vedrebbero.
**Strategia.** Per i fogli dello stesso dominio, leggere sempre il CSSOM (`sheet.cssRules`), mai il testo del tag.

### C09 · Variabili ridefinite in un ramo della pagina · SH · M1.6, M3.0

**Cosa succede.** Su `:root` `--foreground` vale `#000000`, ma dentro `.theme-container` il testo è `#0a0a0a`. `--primary` vale `#000000` su `:root` e `#171717` nei componenti d'esempio. `--chart-*` è blu su `:root` e grigio dentro `.theme-neutral`. Leggere il valore solo su `document.documentElement` dà la risposta sbagliata per metà pagina.
**Strategia.** In M1 salvare **tutte** le dichiarazioni di ogni variabile con il loro selettore, non solo il valore su `:root`. In M3 la tabella valore → nome deve conoscerle tutte (vedi la decisione D5).

### C10 · Elementi "visibili" ma nascosti agli occhi · SH, PY · M1.5

**Cosa succede.** I testi per screen reader (`sr-only`, `.screen-reader-text`) misurano 1×1 px, con `clip` e margine −1px: superano `checkVisibility()`. Su shadcn sono 52.
**Strategia.** Aggiungere al filtro di visibilità le dimensioni ≤ 1px e `clip`/`clip-path` che riducono l'area a zero.

### C11 · Elementi coperti da altri · BS · M1.5, M2

**Cosa succede.** Su Bluesky un livello `#f2f2f2` grande quanto la finestra (1440×900) sta dietro al contenuto: non si vede, ma la sua area viene contata.
**Strategia.** Per l'area "visibile", campionare la pagina su una griglia di punti con `document.elementFromPoint` e attribuire ogni punto all'elemento in cima. È anche la base per comporre correttamente la trasparenza.

### C12 · Pesi finti: il grassetto come famiglia separata · PY · M1.7, M3.3

**Cosa succede.** python.org dichiara `SourceSansProBold` e `Flux-Bold` come famiglie a sé. Sull'h1 dello slideshow e nel footer `font-weight` vale 400, ma il testo è in grassetto. Il font disegnato dice `SourceSansPro-Bold`.
**Strategia.** Salvare il nome PostScript del font disegnato (1.7) e, in M3, dedurne famiglia e peso reali (`-Bold` → 700, `-SemiBold` → 600…).

### C13 · Font di sistema ed emoji · PY, BS · M1.7, M3.3

**Cosa succede.** Il codice di python.org è disegnato con Consolas, che esiste su Windows ma non su un server Linux. Le emoji di Bluesky usano `Segoe UI Emoji`. Il risultato dipende dalla macchina che esegue il browser.
**Strategia.** Distinguere i font scaricati (`isCustomFont: true` nel CDP) da quelli di sistema. Per questi ultimi riportare lo stack dichiarato, non il font trovato sulla macchina. Escludere i font delle emoji.

### C14 · Nessun tag di titolo · BS · M1.5, M3.3

**Cosa succede.** Bluesky non usa né `h1`–`h6` né `p`: è tutto `div` e `span`. La regola "titoli = h1–h6, testo = p" non trova niente.
**Strategia.** In M1 salvare comunque tag e ruolo ARIA. In M3 riconoscere i titoli anche da dimensione e peso: uno stile raro, grande e pesante è un titolo.

---

## Fase 3 · Normalizzazione (M2)

### C15 · Formati di colore misti · SH · M2.2

**Cosa succede.** Su shadcn `getComputedStyle` restituisce colori in quattro formati: `rgba()` (703 volte), `lab()` (589), `rgb()` (298), `oklab()` (28). `lab()` viene dalle variabili di Tailwind v4; `oklab()` dai colori con opacità (`color-mix`). Bluesky e python.org usano solo `rgb()`/`rgba()`.
**Strategia.** Leggere ogni formato con culori, mai con espressioni regolari su `rgb(`.

### C16 · Numeri in notazione esponenziale · SH · M2.3, M3.1

**Cosa succede.** Il `rounded-full` di Tailwind v4 (`calc(infinity * 1px)`) arriva come `3.35544e+07px`.
**Strategia.** `parseFloat` lo legge correttamente, una regex come `/\d+px/` no. In M3, ogni radius ≥ 9999px o ≥ metà del lato corto dell'elemento diventa `full`.

### C17 · `box-shadow` a molti livelli trasparenti · SH · M2.4

**Cosa succede.** Tailwind v4 compone sempre 5–6 livelli (inset, anello, offset dell'anello, ombra); quelli non usati valgono `rgba(0, 0, 0, 0) 0px 0px 0px 0px`. Senza pulizia, un'ombra sola sembra quattro ombre diverse.
**Strategia.** Dopo la scomposizione, scartare i livelli con alpha 0 o con tutti i valori a zero. Un anello `0 0 0 1px` è più un bordo che un'ombra: segnarlo come tale.

### C18 · Bordi trasparenti · SH · M2.2

**Cosa succede.** 164 lati di bordo su shadcn hanno spessore 1px e colore trasparente (`border-transparent` sui bottoni, per non farli cambiare dimensione al passaggio del mouse).
**Strategia.** Scartarli, come previsto per i colori che non si vedono.

### C19 · Sfumature come vero colore · PY · M2.2

**Cosa succede.** Su python.org 18 elementi hanno una `linear-gradient` (8 diverse), compresi tutti i bottoni e l'header. Il colore che si vede è quello della sfumatura; `background-color` è un ripiego che può non vedersi affatto.
**Strategia.** Estrarre i colori delle sfumature (già previsto in 2.2). Quando c'è una sfumatura opaca, considerare il `background-color` "coperto" e non contarne l'area.

### C20 · Valori con i decimali · PY, BS · M2.3

**Cosa succede.** Su python.org 22 valori di padding su 36 hanno i decimali (10,5; 5,25; 1,3125…) e le dimensioni del testo arrivano a 24,1501px, perché tutto è in `em`. Su Bluesky le dimensioni del testo sono 13,1 e 11,3px, calcolate in JavaScript.
**Strategia.** Arrotondamento fisso a 2 decimali (già previsto); in M3 una tolleranza per riconoscere i quasi doppioni (18 e 18,11px).

### C21 · Margini `auto` trasformati in pixel · SH, PY · M2.4

**Cosa succede.** Per i margini, `getComputedStyle` restituisce il valore effettivo in pixel. Un margine `auto` diventa 196px su shadcn (un `ml-auto` che spinge un bottone a destra) e 120px su python.org (centratura del contenitore di 1200px). Non sono spaziature del design system.
**Strategia.** Escludere i margini che vengono da `auto`. Il modo preciso è guardare le regole che si applicano all'elemento (CDP `CSS.getMatchedStylesForNode`). Quello approssimato è scartare i margini orizzontali uguali sui due lati (centratura) e quelli molto più grandi del resto della scala.

### C22 · Padding usati per le proporzioni · BS · M2.4

**Cosa succede.** Bluesky usa `padding-top: 100%` (515px) e `56,25%` (289,69px) per tenere le proporzioni delle immagini.
**Strategia.** Scartare i padding verticali uguali alla larghezza dell'elemento moltiplicata per un rapporto comune (1, 9/16, 3/4…), oppure tutti i valori sopra una soglia (per esempio 200px).

---

## Fase 4 · Inferenza (M3)

### C23 · Primary acromatico · SH · M3.5

**Cosa succede.** Il colore primario di shadcn è `#171717`, con chroma 0. Il segnale "colore saturo su elementi cliccabili" non trova niente. L'unico colore saturo è un pallino giallo di 8×8 px, che il motore non deve promuovere a primary.
**Strategia.** Primary = lo sfondo dei bottoni pieni (cliccabili, con sfondo opaco e testo in contrasto), anche se è un grigio. La saturazione è un indizio in più, non una condizione. Se esiste, decide la variabile `--primary`.

### C24 · Grigi della stessa tinta del brand · BS · M3.6

**Cosa succede.** I grigi di Bluesky hanno hue 255–257°, il blu del brand 260°. Raggruppando per tinta finirebbero nella stessa scala.
**Strategia.** Separare prima i neutri per **chroma** (proposta: C < 0,06 in OKLCH), poi raggruppare per tinta solo i colori veri. Va tarata: i grigi di Bluesky arrivano a 0,053.

### C25 · Il colore più frequente non è il testo principale · BS, SH, PY · M3.5

**Cosa succede.** Per numero di elementi, su Bluesky vince `#405168` (178 contro 120 del nero); su python.org `#666666` (88 contro 53 di `#444444`). Contando i **caratteri** Bluesky si sistema (nero 7.001 contro 1.728), ma shadcn si rompe (`#737373` 1.160 contro 1.128 del testo principale) e python.org resta sbagliato (`#666666` è il footer, 1.133 caratteri contro 764).
**Strategia.** Nessun conteggio semplice funziona sui tre siti: vedi la decisione D2.

### C26 · Colori segnaposto dei media · BS · M3.5

**Cosa succede.** Su Bluesky `#f9fafb` è lo sfondo dietro avatar e immagini (128 elementi): ha l'area più grande della pagina, ma non si vede quasi mai. Il nero `#000000` è lo sfondo dei player video. Poiché `#f9fafb`–`#ffffff` = 1,2 ΔE2000, finiscono nello stesso gruppo, e con il "più pesante per area" come rappresentante lo sfondo diventerebbe `#f9fafb`.
**Strategia.** Non contare l'area degli sfondi di elementi che contengono (o sono) `img`, `video`, `picture`, `canvas`.

### C27 · Un componente ripetuto domina i conteggi · BS · M3.2, M3.5

**Cosa succede.** I bottoni d'azione sotto ogni post di Bluesky producono 1.188 lati di padding a 5px: più di metà di tutti i padding della pagina. Più post carica il feed, più pesano.
**Strategia.** Vedi la decisione D4.

### C28 · Mezzi passi di spaziatura · SH · M3.2

**Cosa succede.** shadcn dichiara `--spacing: 4px`, ma usa spesso i mezzi passi di Tailwind (6, 10, 14px). Solo il 72% dei valori è multiplo di 4, quindi con la regola "la base più grande sopra l'80%" il motore sceglierebbe 2px.
**Strategia.** Vedi la decisione D3.

### C29 · Nessuna griglia, o griglie miste · BS, PY · M3.2

**Cosa succede.** Su Bluesky convivono valori sul 4 (2, 4, 8, 12, 16) e sul 5 (5, 10, 15): nessuna base supera il 57%. Su python.org le spaziature sono in `em` e in pixel non c'è griglia (al massimo 20%).
**Strategia.** "Griglia non riconosciuta" è un risultato valido e va detto. Per i siti in `em`, provare la ricerca della base anche sul rapporto valore / font-size dell'elemento: `raw.json` contiene entrambi.

### C30 · Distanze tra colori vicino al nero e al bianco · SH · M3.4

**Cosa succede.** `#000000` e `#0a0a0a` sono indistinguibili sullo schermo: ΔE2000 = 1,6. Ma la distanza euclidea in OKLab è 0,145, sette volte una soglia tipica di 0,02, perché OKLab amplifica le differenze tra i colori molto scuri. All'opposto, `#ffffff`–`#f5f5f5` = 2,01 ΔE2000, proprio sulla soglia, anche se sono due ruoli diversi (sfondo e superficie).
**Strategia.** Vedi la decisione D1.

### C31 · Dichiarato ma non usato · SH, BS, PY · M3.0

**Cosa succede.** shadcn dichiara 22 tinte di Tailwind e una palette `--chart-*` blu che in pagina non compaiono. Bluesky dichiara 91 `@keyframes` e nessuna è attiva. python.org dichiara FontAwesome senza usarlo.
**Strategia.** Due elenchi separati in `tokens.json`: token **usati** (con prove) e valori **dichiarati, non usati**. I secondi non diventano mai token del design system.

### C32 · Il nome della variabile non descrive il ruolo · BS · M3.5

**Cosa succede.** Su Bluesky il colore dei bordi `#dce2ea` corrisponde alla variabile `--backgroundLight`. Applicando alla lettera "se c'è una variabile, si usa il suo nome", il token dei bordi si chiamerebbe "backgroundLight".
**Strategia.** Il ruolo viene dall'uso; la variabile dà il nome del **primitivo** e una prova in più. Se nome e uso non vanno d'accordo, abbassare la confidenza e mostrare entrambi.

### C33 · Variabili parziali · PY · M3.7

**Cosa succede.** python.org ha 18 variabili, ma molti colori usati non passano da nessuna (`#f9f9f9`, `#1e2933`, `#ffdf76`, quasi tutti i blu intermedi).
**Strategia.** Confidenza per singolo token, non per sito: alta dove valore e variabile coincidono, più bassa dove il token è solo dedotto.

### C34 · Colori della sintassi del codice · PY · M3.5, M3.8

**Cosa succede.** Il codice evidenziato di python.org porta sei colori saturi (verde `#0d870d`, arancio `#c65d09`…) che non sono colori del brand. Hanno anche contrasti bassi su fondo scuro (3,08–3,91:1).
**Strategia.** Riconoscere gli elementi dentro `pre`/`code` ed escluderli dall'assegnazione dei ruoli. I loro problemi di contrasto vanno riportati a parte, come "codice".

### C35 · Colori di sezione che sembrano semantici · PY · M3.5

**Cosa succede.** Verde `#82b043`, viola `#a06ba7` e rosso `#b55863` marcano le schede PyPI, Jobs e Community. Un motore che guarda solo la tinta li chiamerebbe "success" ed "error".
**Strategia.** I ruoli semantici richiedono un contesto (messaggi, badge, campi in errore, classi come `.error`), non solo la tinta.

### C36 · Pagina vetrina con due temi · SH · M3 (audit)

**Cosa succede.** L'interfaccia del sito shadcn usa nero puro e radius 8–10px; i componenti d'esempio usano `#171717`, `#0a0a0a`, card da 24px e bottoni a pillola. Il motore li fonde in un solo design system.
**Strategia.** Per ora accettarlo e mostrare entrambi i valori nelle prove dei token (per esempio testo principale `#0a0a0a`, visto anche come `#000000`). Riconoscere i sottotemi è un lavoro da M6.5.

### C37 · Font di icone · PY · M3.1

**Cosa succede.** python.org usa Pythonicon (in base64 dentro il CSS) e dichiara FontAwesome. Sono icone, non tipografia.
**Strategia.** Escluderli dalle famiglie tipografiche: nomi tipici (`icon`, `awesome`, `material symbols`), caratteri nell'area Unicode privata, elementi con classi `icon-*`/`fa-*`.

### C38 · Breakpoint nel JavaScript · BS · M3.1, M6.1

**Cosa succede.** Nei CSS di Bluesky non c'è nessuna `@media` di layout, ma il layout cambia a circa 1300, 1100 e 800px: la larghezza la controlla il JavaScript.
**Strategia.** In M3 dire "nessun breakpoint dichiarato nei CSS", non "sito non responsive". In M6.1 il confronto tra viewport li troverà.

### C39 · Media query in `em` e coppie min/max · PY · M3.1

**Cosa succede.** python.org mescola `px` ed `em` (25em, 30em, 58,75em…) e usa coppie come `max-width: 24.9375em` (399px) e `min-width: 25em` (400px).
**Strategia.** Convertire gli `em` con 16px (già previsto) e fondere i valori che distano 1px, o meno di 1px.

### C40 · Ombre interne decorative · PY · M3.1

**Cosa succede.** 4 ombre su 5 di python.org sono `inset` (rilievi dei bottoni, vignettature dell'header). Non sono livelli di profondità.
**Strategia.** Tenere le ombre `inset` in un gruppo separato; la scala `shadow-sm…xl` si costruisce solo con le ombre esterne.

### C41 · Testo sopra sfumature e immagini · PY · M3.8

**Cosa succede.** Le voci del menu e i bottoni di python.org stanno sopra sfumature: il contrasto non si può calcolare da `background-color`. Sono almeno 15 elementi.
**Strategia.** Quella già prevista: la lista "da verificare". In futuro si può misurare il contrasto sullo screenshot.

---

## Decisioni aperte per M3

Questi casi mostrano che alcune regole del brief vanno precisate. Le proposte sono da discutere all'inizio di M3; ogni decisione ha i test di M0 che la mettono alla prova.

**D1 · Come misurare la distanza tra colori.** La distanza euclidea in OKLab esagera le differenze tra colori molto scuri (C30). Proposta: ΔE2000 per il raggruppamento, con soglia iniziale 2; OKLCH resta lo spazio per descrivere i colori (luminosità, chroma, tinta) e costruire le scale. Il caso `#ffffff`–`#f5f5f5` (2,01) mostra che la soglia da sola non basta: due colori con ruoli diversi non vanno fusi. *Test:* SH-02, SH-06, BS-04.

**D2 · Come scegliere il testo principale.** Contare gli elementi sbaglia su Bluesky e python.org; contare i caratteri sbaglia su shadcn e python.org (C25). Un'idea che funziona su tutti e tre: tra i colori di testo che coprono una quota minima di caratteri (per esempio il 10%), il testo principale è quello con il **contrasto più alto** rispetto al proprio sfondo. Shadcn: `#0a0a0a` (19,8:1) batte `#737373` (4,7:1); Bluesky: il nero batte `#405168`; python.org: `#444444` (9,7:1) batte `#666666` (5,7:1). La variabile (`--foreground`, `--text`, `--color-default`) è una prova in più. *Test:* SH-02, BS-05, PY-04.

**D3 · Unità base dichiarata contro unità base misurata.** Con la regola dell'80%, shadcn dà 2px anche se dichiara `--spacing: 4px` (C28). Proposta: se esiste una variabile di spaziatura base, quella decide l'unità (confidenza alta) e la quota misura solo quanto viene rispettata. Senza variabile si applica la regola, contando come "sulla griglia" anche i mezzi passi. *Test:* SH-16, BS-15, PY-18.

**D4 · Peso dei componenti ripetuti.** Un singolo componente ripetuto può decidere l'unità base (C27). Proposta: oltre alle occorrenze, contare le coppie distinte (valore, "firma" dell'elemento: tag + classi), e usare queste per la ricerca della base. *Test:* BS-15.

**D5 · Variabili ridefinite nei temi.** Il valore su `:root` non è l'unico (C09). Proposta: la tabella valore → nome contiene tutte le dichiarazioni con il loro selettore. Se lo stesso valore corrisponde a variabili diverse in rami diversi, il nome si sceglie in base al ramo in cui il valore compare di più. *Test:* SH-02, SH-04.

---

## Pagine sintetiche suggerite

Da creare in `engine/fixtures/synthetic/` a partire da M1, una per caso o per piccolo gruppo di casi, con valori noti.

| File | Casi | Cosa contiene |
|---|---|---|
| `spa.html` | C01 | il contenuto viene creato dal JavaScript dopo 500ms |
| `overlay.html` | C02 | finestra modale `fixed` sopra la pagina, con sfondo sfocato |
| `css-in-js.html` | C08 | regole aggiunte con `insertRule` a un `<style>` vuoto |
| `scoped-vars.html` | C09 | `--primary` ridefinita dentro `.theme` |
| `hidden.html` | C10, C11 | `sr-only`, `display: none`, un elemento coperto da un altro |
| `fake-bold.html` | C12 | `@font-face` con famiglia "XBold" usata con `font-weight: 400` |
| `color-formats.html` | C15, C18 | lo stesso colore in hex, `rgb()`, `lab()`, `oklch()`; bordi trasparenti |
| `tailwind-shadows.html` | C16, C17 | `box-shadow` a 6 livelli, radius `calc(infinity * 1px)` |
| `gradients.html` | C19, C41 | bottoni con sfumature e testo sopra |
| `em-spacing.html` | C20, C29 | padding in `em` su elementi con font-size diversi |
| `half-steps.html` | C28 | spaziature 4/6/8/10/14px con `--spacing: 4px` |
| `repeated.html` | C27 | un componente ripetuto 50 volte con padding 5px |
| `text-weight.html` | C25 | footer lungo in grigio medio, paragrafi brevi in grigio scuro |

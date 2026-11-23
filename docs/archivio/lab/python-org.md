# python.org: analisi manuale (M0)

## Info

- **URL:** https://www.python.org/ (home)
- **Data:** 11 novembre 2026
- **Categoria:** **artigianale e datato.** CSS scritto a mano senza un design system: valori in `em` che diventano pixel con i decimali, molti grigi e blu quasi uguali, sfumature su tutti i bottoni.
- **Tecnologia:** pagina generata sul server (il testo è già nell'HTML). Indizi d'epoca: classi di Modernizr su `<html>` (`js no-touch geolocation fontface svg… flexslide`), tema di jQuery UI caricato dal CDN di Google, FontAwesome 4.7, font in formato `woff`/`eot` con una famiglia separata per ogni peso, slideshow jQuery (FlexSlider).
- **Ammodernamento parziale:** su `:root` ci sono 18 variabili CSS, ma molti colori usati non passano da una variabile. Sembrano aggiunte in un secondo momento.
- **Condizioni:** viewport 1440×900, Chromium headless. Lo **slideshow** in alto ruota tra 5 esempi di codice (ognuno con il suo `h1`; ne è visibile uno alla volta). Una **barra di avviso** gialla ("Security notice…") ha un contenuto che cambia nel tempo.
- **Metodo:** come per gli altri due siti.

## Panoramica

| Voce | Valore |
|---|---|
| Elementi nel DOM | 902 (467 visibili, 265 con testo diretto; 392 nascosti, soprattutto i sottomenu a tendina) |
| Colori unici (testo, sfondo, bordo) | 53 |
| Famiglie di font | 7 valori diversi di `font-family`, cioè 3 caratteri (Source Sans Pro, Flux, monospace di sistema) più Georgia su un elemento |
| Dimensioni di testo | 13 |
| Media query | 18 condizioni, in `px` e in `em` |
| Fogli di stile | 4: `style.css` (743 regole), `mq.css` (13), `font-awesome.css` (713) leggibili; `jquery-ui.css` da `ajax.googleapis.com` **non leggibile** |
| Regole CSS | 1.913 (77 con `:hover`, 67 con `:focus`, 48 dichiarazioni `!important`) |
| Variabili CSS | 18 |
| `@keyframes` | 1 (`fa-spin`, di FontAwesome) |

## Variabili CSS

```css
--color-default: #444;        --color-white: #fff;
--color-grey-lightest: #e6e8ea; --color-grey-lighter: #caccce;
--color-grey-light: #999;     --color-grey: #666;     --color-grey-dark: #333;
--color-blue: #3776ab;        --color-blue-medium: #2b5b84;  --color-blue-dark: #1e415e;
--color-yellow: #ffd343;      --color-green: #82b043;
--color-purple: #a06ba7;      --color-red: #b55863;
--font-size-base: 16px;       --line-height-base: 28px;
--border-radius-default: 6px; --transition-duration: 0.3s;
```

Solo una parte dei valori usati ha una variabile. Restano fuori, per esempio, lo sfondo della pagina `#f9f9f9`, la barra scura `#1e2933`, il giallo chiaro `#ffdf76` e la maggior parte dei blu intermedi.

## Colori

| Ruolo | Valore | Variabile | Come l'ho capito |
|---|---|---|---|
| sfondo della pagina | `#f9f9f9` | — | contenitore del contenuto (1440×1315): l'area più grande |
| header | `#2b5b84` | `--color-blue-medium` | header blu (1440×561) con ombra interna e sfumatura |
| barra superiore, blocchi scuri | `#1e2933` | — | barra in alto, barra di ricerca, riquadro del codice |
| testo principale | `#444444` | `--color-default` | paragrafi, titoli dei widget, date (764 caratteri) |
| testo secondario | `#666666` | `--color-grey` | link del footer (57), tag, citazione: **1.133 caratteri, più del testo principale** |
| testo terziario | `#999999` | `--color-grey-light` | link della barra superiore (PSF, Docs…) |
| primary / link | `#3776ab` | `--color-blue` | link nel contenuto, bordo della scheda attiva, bordi dei bottoni |
| accent | `#ffd343` | `--color-yellow` | bottoni "Donate", "Become a Member", ">_"; titoli dello slideshow su fondo scuro. Bordo dei bottoni gialli: `#dca900` |
| testo su fondo scuro | `#e6e8ea` | `--color-grey-lightest` | voci del menu principale, bottone "GO"; è anche lo sfondo dei tag |
| bordo | `#caccce` | `--color-grey-lighter` | separatori delle liste News ed Events (47 lati) |
| colori di sezione | `#ffd343`, `#82b043`, `#a06ba7`, `#b55863` | `--color-yellow`, `-green`, `-purple`, `-red` | bordo superiore delle schede Docs, PyPI, Jobs e Community nella barra in alto: un elemento ciascuno |
| avviso | `#ffdf76` | — | barra "Security notice", citazione |
| sintassi del codice | `#0d870d`, `#c65d09`, `#3677a9`, `#24909d`, `#6ab825`, `#447fcf`, `#dddddd` | — | colori dell'evidenziazione nel riquadro del codice: **non** sono colori del brand |

**Scale tonali:**

- **Blu** (hue 245–247°): almeno 10 valori, `#89b4d9`, `#75a8d3`, `#629ccd`, `#4f90c6`, `#3d83be`, `#3776ab`, `#2d618c`, `#2b5b84`, `#1c3b56`, `#18334b`. Molti nascono da sfumature e stati hover. A parte c'è `#006dad`, un blu più saturo usato su un solo bottone ("See more").
- **Grigi neutri:** circa 15 (`#ffffff`, `#f9f9f9`, `#f6f6f6`, `#f2f4f6`, `#e6e8ea`, `#dddddd`, `#cccccc`, `#caccce`, `#bbbbbb`, `#999999`, `#78797a`, `#666666`, `#4d4d4d`, `#444444`, `#111111`). Sono i "40 grigi" del brief, in piccolo.
- **Grigio-blu scuri** (chroma ≈ 0,015): `#070a0c`, `#11171d`, `#1e2933`, `#1f2a32`, `#273643`, `#2d3e4d`, nella barra superiore.
- **Gialli:** `#ffeba9`, `#ffdf76`, `#ffd343`, `#dca900`, più `#664e04` (testo sopra il giallo).

**Sfumature:** 8 `linear-gradient` diverse su 18 elementi, tutte verticali dal 10% al 90%. Per esempio: Donate `#ffdf76 → #ffd343`, menu `#3776ab → #2b5b84`, `#1e415e → #2b5b84`, `#13191e → #1f2a32`. Il colore che si vede sui bottoni è quello della sfumatura; `background-color` è solo il ripiego.

**Distanze (ΔE2000):** `#444444`–`#666666` = 12,0; `#3776ab`–`#3d83be` = 5,1; `#2b5b84`–`#2d618c` = 2,2; `#ffd343`–`#ffdf76` = 5,5; `#f9f9f9`–`#ffffff` = 1,2.

## Tipografia

- **Testo:** Source Sans Pro, ospitato dal sito, con **una famiglia per stile**: `SourceSansProRegular`, `SourceSansProBold`, `SourceSansProItalic`. Font disegnato: "Source Sans Pro" (`SourceSansPro-Regular`, `SourceSansPro-Bold`).
- **Titoli:** Flux. `Flux-Regular` per i titoli dei widget, `Flux-Bold` per i titoli e i link del footer. Il menu principale e il testo in grassetto dei widget restano in Source Sans Pro.
- **Codice:** lo stack `Consolas, "Lucida Console", "Liberation Mono", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Courier New", monospace`. Su Windows viene disegnato Consolas, un font di sistema non scaricato. Su un server Linux il risultato sarebbe diverso.
- **Pesi finti:** sull'h1 dello slideshow (`SourceSansProBold`) e sui testi del footer in `Flux-Bold`, `font-weight` vale **400**, eppure il testo si vede in grassetto: il grassetto viene dalla famiglia, non dal peso. Solo il font disegnato (`SourceSansPro-Bold`) lo rivela. I `<b>` e `<strong>`, invece, hanno anche `font-weight: 700`.
- **Dimensioni:** 11,9; 13,125; 14; 15; 16; 17,5; 18; 18,1125; 19,2; 21; 24; 24,1501; 28,9801 px. Sono 13 valori, molti con decimali perché calcolati in `em` (per esempio 0,875em di 15px = 13,125px). Ci sono quasi doppioni: 18 e 18,11, 24 e 24,15. I rapporti tra valori consecutivi vanno da 1,006 a 1,2: **non modulare**.
- **Interlinea:** in pixel sembra disordinata (24,375; 22,75; 21,33…), ma come rapporto è costante: **1,625** per 15px, 14px e 13,125px. Qui il rapporto è il token giusto, non il valore in pixel.

| Stile | Carattere, dimensione / peso / interlinea | Dove |
|---|---|---|
| titolo dei widget (h2) | Flux-Regular, 24,15px / 400 / 30,19px (1,25) | "Get Started", "Download", "Docs", "Jobs" |
| titolo dello slideshow (h1) | SourceSansProBold, 21px / "400" (in realtà grassetto) / 21px | "Functions Defined", giallo su scuro |
| introduzione | Source Sans Pro, 24px / 400 / 33,6px (1,4) | "Python is a programming language…", `#caccce` su blu |
| menu principale | Source Sans Pro, 18px / 400 / 29,25px, letter-spacing 0,18px (0,01em) | About, Downloads, Documentation… |
| titoli del footer | Flux-Bold, 17,5px | colonne della mappa del sito |
| link in fondo al footer | Flux-Bold, 18,11px | Help & Contact, Diversity Initiatives, Status… |
| grassetto nel testo | SourceSansProBold, 15px | "Web Development", "GUI Development"… |
| **testo** | **Source Sans Pro, 15px / 400 / 24,375px (1,625)** | paragrafi dei widget |
| liste | 14px / 400 / 22,75px (1,625) | notizie ed eventi |
| piccolo | 13,125px / 400 / 21,33px (1,625) | link del footer |
| codice | monospace, 16px / 400 e 700 / 24px | slideshow |

## Spaziature

- **Valori in `em`:** padding di 10,5px (114 lati), 5,25 (70), 5,6 (66), 7 (66), 12 (35), 20 (35), 1,3125 (30), 2,625 (30), 6,5625 (20), 6,4 (16), 8,75 (16), 22,5 (14)…
- **36 valori distinti** di padding, **22 con i decimali**. Nessun `gap`: il layout usa margini e float.
- **Quota sulla griglia** (pesata): base 2 → 20%; base 4 → 17%; base 8 → 5%. **Nessuna unità base in pixel.**
- **Interpretazione:** le spaziature sono scritte in `em`, quindi in pixel dipendono dal font-size di ogni elemento (per esempio 0,75em × 14px = 10,5px). Una griglia, se esiste, è relativa al testo, non in pixel.
- **Margini:** 120px ai lati del contenitore di 1200px (centratura con `auto`: (1440 − 1200) / 2), margini negativi, −1px per il testo riservato agli screen reader.

## Radius

| Valore | Dove | Variabile |
|---|---|---|
| 6px | Donate, GO, barra di ricerca, bottoni (13 elementi) | `--border-radius-default` |
| 8px | menu principale (la barra blu) | — |
| 16px | barra di avviso | — |
| 99px | pallino di stato 12×12 → full | — |

## Ombre

| Ombra | Dove |
|---|---|
| `inset 0 0 5px rgb(55 118 171 / .2)` | bottone GO, numeri dello slideshow (6) |
| `1px 1px 1px rgb(0 0 0 / .05), inset 0 0 5px rgb(255 255 255 / .5)` | Donate, ">_", "See more" (5) |
| `inset 0 0 50px rgb(0 0 0 / .03), inset 0 0 20px rgb(0 0 0 / .03)` | header, widget PSF, footer (3) |
| `0 0 10px rgb(0 0 0 / .2)` | menu principale (1) |
| `inset 0 0 30px rgb(0 0 0 / .6)` | slideshow (1) |

Quasi tutte sono **ombre interne decorative**. L'unica ombra esterna con sfocatura è quella del menu. Non c'è una scala di elevazione.

## Animazioni

- Una sola transizione: `width 0.3s ease-in-out`, su un elemento (corrisponde a `--transition-duration: 0.3s`).
- Gli hover cambiano colore senza transizione: il bottone GO passa da sfondo `#2b5b84` a `#244e71` e da testo `#e6e8ea` a `#f2f4f6`.
- Lo slideshow è animato dal JavaScript, non dal CSS. `@keyframes`: solo `fa-spin`.

## Breakpoint

- **Dichiarati** (18 condizioni):
  - in `px`: max 640 (insieme a max 1200), max 768, max 860, min e max 1200, max 1320;
  - in `em`: max 24,9375em (399px), min 25em (400), max e min 30em (480), min 32,5em (520), 39,9375em–58,75em (639–940), min 40em (640), min 50em (800), min 58,75em (940), min 64em (1024), min 75em (1200).
- **Osservati**, stabili in due passaggi: **400, 480, 520, 800, 940**. Gli altri (624–656, 1664–1920) cambiavano da un passaggio all'altro: li causa lo slideshow che cambia slide mentre si misura.
- **Coppie** come 399/400 e 639/640 sono le due facce dello stesso confine (un `max-width` e un `min-width`). Vanno fuse.

## Font

| Famiglia | Stili | File | Provider | In uso |
|---|---|---|---|---|
| Source Sans Pro (3 famiglie: Regular, Bold, Italic) | normale, grassetto, corsivo | woff (più eot/ttf), `www.python.org/static/fonts/` | il sito stesso | sì |
| Flux (2 famiglie: Regular, Bold) | normale, grassetto | woff, stesso percorso | il sito stesso | sì |
| Pythonicon | font di icone | in base64 dentro il CSS | il sito stesso | sì, per le icone |
| FontAwesome 4.7 | font di icone | woff2, stesso percorso | il sito stesso | no (non caricato) |
| stack monospace (Consolas…) | — | font di sistema | — | sì, dipende dalla macchina |
| Georgia | — | font di sistema | — | un elemento |

Dalla rete arrivano 5 file di font, tutti `woff` da `www.python.org`.

## Prove nella console

- `getComputedStyle($0).fontWeight` sull'h1 "Functions Defined" → `"400"`, mentre Rendered Fonts dice `SourceSansPro-Bold`.
- `document.styleSheets`: `jquery-ui.css` da `ajax.googleapis.com` lancia `SecurityError`; gli altri 3 fogli sono leggibili.
- Conteggio degli sfondi: `#e6e8ea` (31, i tag), `#2b5b84` (9), `#ffd343` (4), `#1e2933` (3).
- `document.fonts`: 8 voci. Pythonicon compare due volte (una caricata), Flux e Source Sans Pro sono caricati, FontAwesome no.

## Casi difficili

Dettagli in [casi-difficili.md](casi-difficili.md):

- pesi finti (grassetto come famiglia separata);
- spaziature in `em` con i decimali;
- variabili CSS parziali;
- sfumature come vero colore dei bottoni;
- colori della sintassi del codice;
- slideshow che cambia il DOM nel tempo;
- banner dal contenuto variabile;
- font di icone;
- font di sistema per il codice;
- media query in `em` e `px` mescolate;
- ombre interne decorative;
- foglio di stile di un altro dominio;
- testo sopra sfumature;
- footer più "pesante" dei paragrafi;
- margini `auto` in pixel.

## Tempo impiegato

Raccolta automatica dei dati: circa 20 secondi per passaggio. Come per gli altri due siti: se rifai l'analisi a mano, annota qui il tuo tempo.

## Risultato atteso

Tolleranze standard: colori ΔE2000 ≤ 2, lunghezze ± 0,5px.

### Acquisizione ed estrazione (M1)

- **PY-01** · *(M1)* Lo slideshow non rende l'estrazione incoerente: tutti i dati vengono letti nello stesso istante. Nel DOM ci sono 5 `h1`, uno solo visibile.
- **PY-02** · *(M1)* `jquery-ui.css` viene letto dal testo intercettato in rete, anche se il CSSOM lo blocca.

### Colori

- **PY-03** · Sfondo ≈ `#f9f9f9` (la tolleranza accetta anche `#ffffff`, a ΔE2000 = 1,2).
- **PY-04** · Testo principale ≈ `#444444`, con la variabile `--color-default` come prova. ⚠ Il motore **non deve** scegliere `#666666`, anche se vince sia per elementi sia per caratteri: quel testo è quasi tutto nel footer (vedi la decisione D2 in [casi-difficili.md](casi-difficili.md)).
- **PY-05** · Testo secondario ≈ `#666666`.
- **PY-06** · Primary ≈ `#3776ab` (`--color-blue`), confidenza alta.
- **PY-07** · Accent ≈ `#ffd343` (`--color-yellow`), confidenza alta.
- **PY-08** · Bordo ≈ `#caccce` (`--color-grey-lighter`).
- **PY-09** · Esiste una scala dei blu con almeno 6 gradini tra `#89b4d9` e `#18334b`, nella stessa tinta, con `#3776ab` tra i gradini centrali.
- **PY-10** · I colori della sintassi del codice **non** ricevono ruoli: `#0d870d` non diventa "success" e `#c65d09` non diventa "warning".
- **PY-11** · I colori di sezione `#82b043`, `#a06ba7` e `#b55863` **non** diventano "success", "error" o simili solo per la tinta: sono usati una volta ciascuno su un bordo.
- **PY-12** · I colori delle sfumature vengono estratti: almeno `#ffdf76 → #ffd343` (Donate) e `#3776ab → #2b5b84` (menu).

### Tipografia

- **PY-13** · Testo: Source Sans Pro. Titoli: Flux. Codice: monospace di sistema. Il report indica lo stack, non "Consolas".
- **PY-14** · `SourceSansProRegular` e `SourceSansProBold` vengono riconosciuti come **una sola famiglia** (Source Sans Pro) con pesi 400 e 700, non come due famiglie diverse entrambe a 400. Lo stesso vale per Flux.
- **PY-15** · Pythonicon e FontAwesome non compaiono tra le famiglie tipografiche: sono font di icone.
- **PY-16** · Stile body = 15px con interlinea **1,625**; lo stesso rapporto vale anche per 14px e 13,125px.
- **PY-17** · Scala non modulare, con circa 13 dimensioni; 18 e 18,11 px (e 24 e 24,15 px) vengono segnalati come quasi doppioni.

### Spaziature

- **PY-18** · Nessuna unità base in pixel: il report dice "griglia non riconosciuta" (al massimo il 20% dei valori cade su una base). Questo giudizio va dato con confidenza alta.
- **PY-19** · I margini di 120px (centratura) e i margini negativi non entrano nella scala.

### Radius

- **PY-20** · Radius principale 6px (`--border-radius-default`), confidenza alta; poi 8px, 16px e full.

### Ombre

- **PY-21** · Una sola ombra esterna (`0 0 10px rgb(0 0 0 / .2)`). Le ombre `inset` vengono riportate a parte, non come livelli di elevazione `shadow-sm…xl`.

### Animazioni

- **PY-22** · Un solo valore: 300ms `ease-in-out`, su un elemento. Confidenza bassa, per mancanza di dati.

### Breakpoint

- **PY-23** · Breakpoint dichiarati: 400, 480, 520, 640, 768, 800, 860, 940, 1024, 1200, 1320 px. Gli `em` vanno convertiti con 16px, non con il font-size della radice; 399 e 639 vanno fusi con 400 e 640.
- **PY-24** · *(M6.1)* Il confronto tra viewport trova cambi di layout a 400, 480, 520, 800 e 940 px.

### Font

- **PY-25** · Tutti i font sono ospitati da `www.python.org`; nessun Google Fonts. `jquery-ui.css` da `ajax.googleapis.com` non c'entra con i font.

### Audit

- **PY-26** · Colori unici: circa 50; dopo il raggruppamento restano comunque più di 30. È il sito con più colori dei tre.
- **PY-27** · Contrasto: gli errori sono nel codice evidenziato (`#0d870d` su `#1e2933` = 3,16:1; `#3677a9` 3,08:1; `#c65d09` 3,5:1…) e vanno mostrati come "codice", separati dal resto. Il testo sopra le sfumature (menu, bottoni, almeno 15 elementi) va nella lista "da verificare", non tra gli errori.
- **PY-28** · Il punteggio di coerenza è il **più basso** dei tre siti di M0.

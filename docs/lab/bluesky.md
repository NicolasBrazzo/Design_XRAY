# Bluesky: analisi manuale (M0)

## Info

- **URL:** https://bsky.app/ (home da utente non registrato: feed "Discover")
- **Data:** 11 novembre 2026
- **Categoria:** **costruito con JavaScript.** L'HTML iniziale pesa 28,8 KB e, tolti gli script, contiene 232 caratteri di testo; nessuno dei 15 testi campione presi dalla pagina renderizzata compare nel sorgente. Tutto quello che si vede lo costruisce il browser.
- **Tecnologia:** React Native for Web, tramite Expo. Indizi: file in `/_expo/static/`, classi atomiche generate (`css-g5y9jx`, `r-1loqt21`), nessun tag `h1`–`h6` né `p`, tutto `div` e `span`. Il codice dell'app è pubblico e il suo design system si chiama ALF, ma vive nel JavaScript, non nel CSS.
- **Condizioni:** viewport 1440×900, Chromium headless, tema chiaro (classe `theme--light` su `<html>`).
- **Popup:** al primo caricamento una finestra di benvenuto ("Real people. Real conversations.") copre la pagina, con lo sfondo sfocato. L'analisi è fatta **dopo averla chiusa** con "Explore the app".
- **Contenuto:** il feed è fatto dai post degli utenti e cambia di minuto in minuto (testo, immagini, video, emoji). Questa nota descrive solo l'**interfaccia**, non i contenuti.
- **Metodo:** come per shadcn: letture di DevTools eseguite da script, screenshot controllati a occhio, ruoli scritti a mano.

## Panoramica

| Voce | Valore |
|---|---|
| Elementi nel DOM | 4.224 in un passaggio, 8.462 in un altro: dipende da quanti post carica il feed |
| Elementi visibili | 3.827 (473 con testo diretto) |
| Colori unici (testo, sfondo, bordo) | 10 |
| Famiglie di font | 1 (Inter) |
| Dimensioni di testo | 5 |
| Media query | 4, nessuna di layout tranne `(max-width: 600px)` |
| Fogli di stile | 10: 8 `<style>` (due contengono 418 e 78 regole ma hanno il **testo vuoto**), 2 `<link>` da `web-cdn.bsky.app`, **non leggibili** |
| Regole CSS | 540 (2 con `:hover`, 3 con `:focus`) |
| Variabili CSS | 3 di tema, più circa 45 di librerie |
| `@keyframes` | 91 |

## Variabili CSS

Solo tre variabili di tema su `:root`: `--text: black`, `--background: white`, `--backgroundLight: #DCE2EA`. Le altre appartengono a librerie: `--gray1…12`, `--normal-bg`, `--success-*`, `--error-*` (sonner, la libreria dei toast) e `--expo-image-timing`.

I veri token (colori, spaziature, dimensioni) stanno nel codice JavaScript e arrivano alla pagina già trasformati in classi atomiche (`.r-1loqt21 { … }`). Per questo sito **mancano i nomi**: ruoli e scale vanno dedotti tutti dall'uso, e la confidenza sarà più bassa.

## Colori

| Ruolo | Valore | Variabile | Come l'ho capito |
|---|---|---|---|
| sfondo | `#ffffff` | `--background` | sfondo della radice e delle colonne |
| testo principale | `#000000` | `--text` | testo dei post, nomi, tab attiva: **7.001 caratteri** |
| testo secondario | `#405168` | — | handle (`@…`), orari, tab non attiva. È il colore usato sul **maggior numero di elementi** (178 contro 120 del nero), ma con soli 1.728 caratteri |
| testo terziario | `#667b99` | — | contatori sotto i post (13,1px) e icone (`fill` su 295 elementi SVG) |
| testo quaternario | `#8798b0` | — | numeri della lista Trending |
| primary | `#006aff` | — | sfondo del bottone "Create account", link e hashtag nei post, indicatore della tab attiva (64×3px), farfalla del logo |
| bordo | `#dce2ea` | `--backgroundLight` | 489 lati di 1px: separatori tra post, bordi della colonna centrale, card Trending. Il nome della variabile dice "background", ma l'uso dice "bordo" |
| superficie | `#eff2f6` | — | bottone secondario "Sign in", campo Search, badge "1/2" |
| segnaposto dei media | `#f9fafb` | — | sfondo dietro avatar e immagini (128 elementi). Ha l'**area più grande** della pagina ma non è una superficie: si vede solo mentre l'immagine carica |
| sfondo dei video | `#000000` | — | player video (11) |

**Scala tonale.** I grigi formano una scala "fredda": `#f9fafb` → `#eff2f6` → `#dce2ea` → `#8798b0` → `#667b99` → `#526580` (un'icona) → `#405168`. In OKLCH hanno **la stessa tinta del blu del brand** (hue 255–257° contro 260° di `#006aff`), ma chroma tra 0,002 e 0,053, contro 0,236 del blu. A separarli è la chroma, non la tinta.

**Distanze (ΔE2000):** `#405168`–`#667b99` = 15,7; `#667b99`–`#8798b0` = 10,7; `#405168`–`#006aff` = 19,3; `#f9fafb`–`#ffffff` = 1,2 (sotto la soglia: il raggruppamento li unisce).

## Tipografia

- **Famiglia:** Inter, dichiarata come `InterVariable` (variabile, 300–1000) con uno stack di font di sistema come ripiego. Font disegnato: "Inter Variable" nelle istanze `InterVariable-Text`, `-Medium`, `-SemiBold`, `-Bold`. Le emoji sono disegnate da font di sistema (`Segoe UI Emoji` su Windows).
- **Nessun tag di titolo:** né `h1`–`h6` né `p`. I titoli si riconoscono solo da dimensione e peso.
- **Dimensioni:** 8px (24 elementi), 11,3 (6), 13,1 (175), 15 (267), 24,3 (1). I decimali fanno pensare a una moltiplicazione fatta in JavaScript, per esempio per la preferenza "dimensione del testo" dell'app.
- **Pesi:** 400 (385 elementi), 600 (56), 700 (25), 500 (7). Nessun letter-spacing, nessun maiuscolo.

| Stile | Dimensione / peso / interlinea | Dove |
|---|---|---|
| titolo | 24,3px / 700 / 24,3px (1,0) | "Join the conversation" |
| **testo dei post** | **15px / 400 / 20px** (1,33) | corpo dei post, link nei post |
| testo dell'interfaccia | 15px / 400 o 600 / 17px (1,13) | nomi (600), handle e orari (400), tab |
| piccolo | 13,1px / 400 / 17px | contatori, lista Trending, bottoni "Create account" e "Sign in" (500) |
| micro | 11,3px / 500 / 16,95px (1,5) | badge "1/2" |
| badge sulle immagini | 8px / 700 / 10px | "ALT", "1/6" |

Scala: 8, 11,3, 13,1, 15, 24,3. Cinque valori, rapporti irregolari (da 1,15 a 1,62): **non modulare**.

## Spaziature

- **Padding:** 5px (1.188 lati), 4 (258), 8 (154), 10 (98), 2 (67), 15 (50), 12 (20), 14 (10), 16 (9), 20 (3). Più due valori anomali: 515px e 289,69px.
- **Gap:** 4px (740), 8 (104), 10 (98), 12 (98), 2 (36), 3 (30), 5 (4), 16 (2).
- **Quota sulla griglia** (padding + gap, pesata): base 2 → 57%; base 4 → 47%; base 5 → 48%. Nessuna base arriva all'80%.
- **Interpretazione:** convivono due famiglie di valori, una sul 4 (2, 4, 8, 12, 16, 20) e una sul 5 (5, 10, 15).
- **Un solo componente pesa tantissimo:** i 1.188 lati a 5px vengono quasi tutti dai bottoni d'azione sotto ogni post (rispondi, ricondividi, mi piace…), ripetuti per ogni post del feed. Con più post caricati il loro peso cresce ancora.
- **Padding usati per le proporzioni:** 515px e 289,69px sono `padding-top` che tengono il rapporto delle immagini (quadrato e 16:9 su una larghezza di 515px). Non sono spaziature.

## Radius

| Valore | Dove |
|---|---|
| 999px | bottoni d'azione, bottoni a pillola, avatar (351 elementi) → full |
| 21px su un elemento 42×42 | avatar → cerchio, quindi anche questo è full |
| 12px | immagini, video, card dei link incorporati (111); nelle griglie di immagini solo su alcuni angoli (`12px 0 0 12px`…) |
| 8px | badge "ALT" e "1/6" (30) |
| 10px | campo Search |
| 6px | selettore della lingua |

## Ombre

**Nessuna.** Nessun elemento visibile ha una `box-shadow`. La profondità è affidata ai bordi `#dce2ea` e alle superfici `#eff2f6`.

## Animazioni

- `transform` in 200ms con `cubic-bezier(0.17, 0.73, 0.14, 1)` su 28 elementi: è l'effetto di pressione su immagini e card.
- Colori in 100ms su 3 elementi; `opacity` su 1.
- `@keyframes`: 91 dichiarate. 6 con nomi generati (`r-11cv4x`…), 7 di sonner, 78 con nomi come `FadeIn`, `ZoomIn`, `BounceIn`, `SlideInLeft` (una libreria di animazioni d'ingresso e uscita). Nessuna attiva con la pagina ferma.
- I due elementi provati con il passaggio del mouse (un avatar e un'immagine) non cambiano colore né sfondo. Gli stati hover andranno studiati in M6.4.

## Breakpoint

- **Dichiarati nei CSS:** nessuno di layout. Ci sono solo `(max-width: 600px)`, `(prefers-color-scheme: dark)`, `(prefers-reduced-motion)` e `(hover: none) and (pointer: coarse)`.
- **Osservati** restringendo la finestra (due passaggi):
  - **1300px:** sotto questa larghezza sparisce la colonna sinistra ("Join the conversation", "Create account") e compare una barra fissa in basso;
  - **1100px:** sotto sparisce la colonna destra (Search e Trending);
  - **800px:** il layout cambia ancora (non ho isolato cosa);
  - 583px e 365px compaiono in entrambi i passaggi, ma non ho verificato cosa cambi;
  - 771, 768, 539 e 391px compaiono in un solo passaggio: dipendono dai contenuti del feed.
- **Interpretazione:** i breakpoint sono decisi dal JavaScript in base alla larghezza della finestra, non da `@media`. Leggendo i CSS non si trovano.

## Font

| Famiglia | Pesi | File | Provider | In uso |
|---|---|---|---|---|
| InterVariable | 300–1000 | woff2, `web-cdn.bsky.app/static/assets/assets/fonts/inter/InterVariable.….woff2` | il sito stesso (CDN su un sottodominio di `bsky.app`) | sì |
| InterVariableItalic | 300–1000, corsivo | woff2, stesso percorso | il sito stesso | no |

Un solo file di font scaricato. Il dominio del file (`web-cdn.bsky.app`) è diverso da quello della pagina (`bsky.app`) ma appartiene allo stesso sito: per riconoscere il provider bisogna confrontare il dominio registrato (`bsky.app`), non l'host completo.

## Prove nella console

- `getComputedStyle($0).backgroundColor` su "Create account" → `"rgb(0, 106, 255)"`. Qui tutti i colori arrivano in `rgb()`/`rgba()`: React Native Web li converte.
- `document.styleSheets`: 10 fogli. I 2 da `web-cdn.bsky.app` lanciano `SecurityError` (CORS). Un `<style>` ha `textContent` vuoto ma 418 `cssRules`: le regole sono state inserite con `insertRule`.
- Conteggio degli sfondi: primo `#f9fafb` (128, i segnaposto delle immagini), poi `#000000` (11, i video), `#eff2f6` (8), `#ffffff` (6).
- `document.fonts`: `InterVariable 300 1000 loaded`, `InterVariableItalic … unloaded`.

## Casi difficili

Dettagli in [casi-difficili.md](casi-difficili.md):

- HTML vuoto, tutto renderizzato dal JavaScript;
- popup che copre la pagina;
- contenuti che cambiano a ogni visita;
- CSS-in-JS con `<style>` vuoti;
- fogli di stile di un altro dominio;
- token solo nel JavaScript;
- breakpoint nel JavaScript;
- nessun tag di titolo;
- colori segnaposto dei media;
- un componente ripetuto che domina i conteggi;
- padding usati per le proporzioni;
- grigi della stessa tinta del brand;
- il colore più frequente per elementi non è il testo principale;
- variabile con un nome che non descrive il ruolo;
- emoji con font di sistema;
- un elemento a tutto schermo coperto da altri.

## Tempo impiegato

Raccolta automatica dei dati: circa 30–40 secondi per passaggio (il feed è pesante). Come per shadcn, non è un tempo "a mano": se rifai l'analisi con DevTools, annota qui il tuo.

## Risultato atteso

Valgono per la pagina **con il popup chiuso** e per l'**interfaccia**, non per i contenuti dei post. Tolleranze standard: colori ΔE2000 ≤ 2, lunghezze ± 0,5px.

### Acquisizione ed estrazione (M1)

- **BS-01** · *(M1)* L'estrazione avviene dopo il rendering: `raw.json` contiene migliaia di elementi visibili (≥ 3.000), non le poche decine dell'HTML iniziale.
- **BS-02** · *(M1)* Le regole dei `<style>` con testo vuoto vengono lette dal CSSOM; i 2 fogli di `web-cdn.bsky.app` vengono letti dal testo intercettato in rete.
- **BS-03** · *(M1, poi M6.3)* Se il popup non viene chiuso, `raw.json` lo segnala (un elemento fisso che copre più di metà della finestra) invece di presentare quei dati come la pagina.

### Colori

- **BS-04** · Sfondo ≈ `#ffffff`. Il motore **non deve** usare `#f9fafb` come sfondo o superficie solo perché ha più area: è il segnaposto dei media. Se `#f9fafb` finisce nel gruppo del bianco (ΔE2000 = 1,2), il rappresentante del gruppo deve restare `#ffffff`.
- **BS-05** · Testo principale ≈ `#000000`. Il motore **non deve** scegliere `#405168` solo perché compare su più elementi.
- **BS-06** · Testo secondario ≈ `#405168` e terziario ≈ `#667b99`, distinti tra loro.
- **BS-07** · Primary ≈ `#006aff`, confidenza **media**: non c'è una variabile, ma è l'unico colore saturo ed è su bottone pieno, link e tab attiva.
- **BS-08** · Bordo ≈ `#dce2ea`, con ruolo "bordo" dato dall'uso, anche se la variabile corrispondente si chiama `--backgroundLight`.
- **BS-09** · I grigi da `#f9fafb` a `#405168` sono classificati come **neutri** e formano una scala separata dal blu `#006aff`, nonostante abbiano la stessa tinta.
- **BS-10** · Il nero dei player video non crea un ruolo a sé (per esempio "superficie scura").

### Tipografia

- **BS-11** · Una sola famiglia: Inter (disegnata come Inter Variable). I font delle emoji non contano come famiglie del sito.
- **BS-12** · Stile body = 15px / interlinea 20px; testo dell'interfaccia 15px / 17px; piccolo 13,1px / 17px.
- **BS-13** · Scala {8, 11,3, 13,1, 15, 24,3} px, giudicata non modulare.
- **BS-14** · Lo stile titolo (24,3px, peso 700) viene riconosciuto anche senza tag `h1`–`h6`.

### Spaziature

- **BS-15** · Nessuna unità base supera la soglia: il report dice "griglia non riconosciuta" o "mista (4 e 5)", con confidenza bassa. **Non** deve dichiarare 5px come unità base con confidenza alta per colpa del componente ripetuto.
- **BS-16** · I padding di 515px e 289,69px non entrano nella scala.

### Radius

- **BS-17** · Tre livelli principali: full (999px; 21px su 42px), 12px, 8px. 10px e 6px sono valori rari.

### Ombre

- **BS-18** · Nessuna ombra: la sezione è vuota e il report lo dice, senza inventare livelli.

### Animazioni

- **BS-19** · Durata più usata 200ms con `cubic-bezier(0.17, 0.73, 0.14, 1)` (su `transform`); 100ms per i colori.
- **BS-20** · Le 91 `@keyframes` risultano "dichiarate, non usate in pagina".

### Breakpoint

- **BS-21** · Dalle `@media` non risulta nessun breakpoint di layout (solo 600px). Il report **non** deve concludere che il sito non è responsive: deve dire che i breakpoint non sono dichiarati nei CSS.
- **BS-22** · *(M6.1)* Il confronto tra viewport trova cambi di layout a circa 1300, 1100 e 800 px.

### Font

- **BS-23** · InterVariable da `web-cdn.bsky.app`, provider = il sito stesso, un solo file in uso.

### Audit

- **BS-24** · Colori unici: circa 10, che scendono a circa 7–8 dopo il raggruppamento.
- **BS-25** · Contrasto: i contatori sotto i post (`#667b99` su `#ffffff`, 13,1px) hanno 4,32:1, sotto il minimo AA di 4,5:1. Errore su decine di elementi (almeno 40 in questo passaggio).
- **BS-26** · Il punteggio di coerenza sta **tra** quello di shadcn (più alto) e quello di python.org (più basso).

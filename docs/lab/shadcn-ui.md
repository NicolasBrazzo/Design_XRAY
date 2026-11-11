# shadcn/ui: analisi manuale (M0)

## Info

- **URL:** https://ui.shadcn.com/ (home)
- **Data:** 11 novembre 2026
- **Categoria:** **ricco di variabili CSS.** 525 variabili, con i due livelli tipici di un design system: i primitivi di Tailwind (`--color-neutral-500`) e i ruoli di shadcn (`--primary`, `--border`).
- **Tecnologia:** Next.js (file in `/_next/static/`, `next-route-announcer`), Tailwind CSS v4 (variabili `--tw-*`, `--spacing`, `@layer theme`), componenti shadcn/ui. È renderizzato sul server: 13 testi campione su 15 si trovano già nell'HTML.
- **Condizioni:** viewport 1440×900, Chromium headless (Playwright 1.65), tema chiaro, nessun popup.
- **Metodo:** le stesse letture di DevTools (`getComputedStyle`, `document.styleSheets`, `document.fonts`, Chrome DevTools Protocol per i font disegnati) eseguite da uno script, più gli screenshot controllati a occhio. Ruoli e "Risultato atteso" sono scritti a mano a partire da questi dati.
- **Attenzione:** la home è una **vetrina**. Sopra c'è l'interfaccia del sito (header, titolo, bottoni "Get Started"), sotto una griglia di componenti d'esempio (card, form, grafici) racchiusa in `.theme-container` / `.theme-neutral`, che ridefinisce alcune variabili. I due blocchi usano token leggermente diversi (vedi "Casi difficili").

## Panoramica

Numeri equivalenti a quelli di CSS Overview, calcolati dalla console. Il pannello può dare valori leggermente diversi, perché conta anche gli elementi nascosti.

| Voce | Valore |
|---|---|
| Elementi nel DOM | 1.768 (809 visibili, 143 con testo diretto) |
| Colori unici (testo, sfondo, bordo) | 17 |
| Famiglie di font usate | 1 (Geist) |
| Dimensioni di testo | 9 |
| Media query distinte | 27, più 9 container query |
| Fogli di stile | 4 collegati, tutti dello stesso dominio e leggibili; 5 file CSS scaricati |
| Regole CSS | 5.472 (174 con `:hover`, 176 con `:focus`) |
| Variabili CSS | 525, di cui 93 interne di Tailwind (`--tw-*`) |
| `@keyframes` | 19 |

## Variabili CSS

Tre livelli, uno sopra l'altro:

1. **Primitivi di Tailwind** su `:root, :host`: `--color-<tinta>-<gradino>` (22 tinte, solo i gradini usati da qualche parte del sito), `--spacing: .25rem`, `--text-xs…7xl` con l'interlinea abbinata (`--text-sm--line-height: calc(1.25 / .875)`), `--radius-*`, `--shadow-xl`, `--ease-*`, `--font-weight-*`, `--tracking-*`, `--leading-*`, `--breakpoint-2xl`, `--container-*`.
2. **Ruoli di shadcn:** `--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--chart-1…5`, `--sidebar-*`, ognuno con la sua coppia `-foreground`.
3. **Ponte tra i due:** `--color-primary: var(--primary)`, così Tailwind genera classi come `bg-primary`.

Altre cose notate:

- **Ogni colore è dichiarato due volte:** prima in hex (`#fef2f2`), poi in `lab(96.5% 4.18 1.52)`. Il browser tiene il secondo, quindi `getComputedStyle` restituisce `lab(…)`, non `rgb(…)`.
- **Il radius è una formula:** `--radius: .625rem` (10px) e `--radius-sm…4xl = calc(var(--radius) * 0.6 … 2.6)` → 6, 8, 10, 14, 18, 22, 26 px.
- **Le variabili cambiano valore a seconda del tema:** `.theme-mono`, `.theme-blue`, `.theme-green`, `.theme-amber`, `.theme-sketch`, `.dark` ridefiniscono gli stessi nomi. Su `:root` `--foreground` vale `#000000` e `--primary` `#000000`, ma dentro i componenti d'esempio il testo è `#0a0a0a` e i bottoni pieni sono `#171717`.

## Colori

| Ruolo | Valore | Variabile | Come l'ho capito |
|---|---|---|---|
| sfondo | `#ffffff` | `--background` | sfondo con l'area più grande (pagina, header, card) |
| superficie | `#f5f5f5` | `--muted`, `--secondary`, `--accent` | secondo sfondo per area: campo di ricerca, bottoni secondari, sfondo dei link al passaggio del mouse; usato anche al 50% di opacità nei riquadri interni delle card |
| testo principale | `#0a0a0a` (e `#000000` nell'header) | `--foreground` | il colore di testo usato sul maggior numero di elementi (65 + 12) |
| testo secondario | `#737373` | `--muted-foreground` | descrizioni, etichette, numeri piccoli. Attenzione: per numero di **caratteri** supera il testo principale (1.160 contro 1.128 di `#0a0a0a` e `#000000` insieme) |
| primary | `#171717` (e `#000000` nell'header) | `--primary` | sfondo dei bottoni pieni ("Button", "Create Goal", "View Full Report", "Get Started", "New") con testo `#fafafa` (`--primary-foreground`) |
| bordo | `#e5e5e5` | `--border`, `--input` | 36 lati di bordo: bottone Outline, separatori; al 50% come sfondo dei campi di testo |
| focus ring | `#a1a1a1` | `--ring` | solo dichiarato: non si vede senza dare il focus a un elemento |
| errore | `#e7000b` | `--destructive` | dichiarato; in pagina compare solo in 2 tratti di icona |
| grafici | blu, da `#8ec5ff` a `#193cb8` | `--chart-1…5` | dichiarati su `:root`, ma i grafici in pagina sono grigi: il tema locale `.theme-neutral` li ridefinisce |

**Scala tonale.** La pagina è **acromatica**: tutti i colori usati hanno chroma 0 in OKLCH. I grigi coincidono con la scala `neutral` di Tailwind: `#fafafa` (50), `#f5f5f5` (100), `#e5e5e5` (200), `#d4d4d4` (300), `#a1a1a1` (400), `#737373` (500), `#525252` (600), `#404040` (700), `#262626` (800), `#171717` (900), `#0a0a0a` (950). Gli unici colori cromatici visibili sono un pallino giallo `#f0b100` di 8×8 px e il rosso `#e7000b` in un'icona.

**Distanze utili per tarare il raggruppamento (ΔE2000):** `#000000`–`#0a0a0a` = 1,6 (vanno uniti); `#0a0a0a`–`#171717` = 3,0 (separati); `#ffffff`–`#f5f5f5` = 2,0 (proprio sulla soglia: devono restare separati perché hanno ruoli diversi).

## Tipografia

- **Famiglia:** Geist per tutto, titoli compresi (`--font-heading` e `--font-sans` valgono entrambi Geist). Font disegnato, letto dal Chrome DevTools Protocol: `Geist-SemiBold` per l'h1, `Geist` per i paragrafi, `Geist-Medium` per i link. Geist Mono è dichiarato ma non usato in pagina.
- **Scala usata:** 12 (19 elementi), 14 (106), 16 (10), 18 (2), 24 (1), 30 (2), 36 (1), 48 (1) px, più un 12,8px isolato. Sono `text-xs`, `sm`, `base`, `lg`, `2xl`, `3xl`, `4xl` e `5xl` di Tailwind. I rapporti tra valori consecutivi vanno da 1,13 a 1,33: **non è una scala modulare**.
- **Pesi:** 400, 500, 600.

| Stile | Dimensione / peso / interlinea | Dove |
|---|---|---|
| titolo hero (h1) | 48px / 600 / 52,8px (1,1), letter-spacing −2,4px (−0,05em) | "The Foundation for your Design System" |
| sottotitolo | 18px / 400 / 28px | paragrafo sotto il titolo |
| numeri grandi | 30px / 600 / 36px; 24px / 600 / 32px | valori nelle card ("$15,000") |
| titolo di card | 16px / 500 / 24px | "Contribution History" |
| **testo dell'interfaccia** | **14px / 400 / 20px** (52 elementi) e 14px / 500 / 20px (30) | bottoni, etichette, descrizioni |
| piccolo | 12px / 400–500 / 16px | assi dei grafici, note |
| overline | 12px / 500 / 16px, maiuscolo, letter-spacing 0,6px (0,05em) | "UPCOMING", "SAVINGS PLAN" |

Il `body` ha 16px, ma il testo che si legge è quasi tutto a 14px: per questo sito il "body" del design system è 14px.

## Spaziature

- **Dichiarata:** `--spacing: .25rem` = **4px**. In Tailwind v4 `p-3` vale `calc(var(--spacing) * 3)`.
- **Padding usati:** 10px (80 lati), 20 (79), 8 (77), 12 (36), 16 (31), 14 (26), 4 (15), 24 (10), 2 (8), 48 (5), 6 (3), 80 (1).
- **Gap usati:** 8 (126), 6 (68), 4 (48), 12 (46), 20 (28), 14 (26), 24 (24), 16 (14), 10 (2).
- **Quota sulla griglia** (padding + gap, pesata per occorrenze): base 2 → 100%; **base 4 → 72%**; base 8 → 38%.
- **Interpretazione:** la base è 4px, ma Tailwind permette i mezzi passi (`p-2.5` = 10px, `gap-1.5` = 6px, `3.5` = 14px), che qui sono molto usati. Per questo solo il 72% dei valori è multiplo di 4.
- **Margini:** quasi tutti −1px (testo per screen reader, `sr-only`) o margini `auto` risolti in pixel (196px; 26,36px; 33,59px). Non sono spaziature del design system.

## Radius

| Valore | Dove | Token dichiarato |
|---|---|---|
| 6px (solo in alto) | barre del grafico | `--radius-sm` |
| 8px | link di navigazione nell'header | `--radius-md` |
| 10px | campo di ricerca, bottone "New" | `--radius-lg` (= `--radius`) |
| 14px | riquadro del codice QR | `--radius-xl` |
| 18px | bottoni d'esempio alti 32px → visivamente a pillola | `--radius-2xl` |
| 22px | card piccole | `--radius-3xl` |
| 24px | card grandi (anche come 24px 24px 0 0 e 0 0 24px 24px nelle parti di card) | `min(var(--radius-4xl), 24px)` |
| 26px | bottoni hero "Get Started", "View Components" | `--radius-4xl` |
| `3.35544e+07px`, `50%` | badge, pallini | "full" (`calc(infinity * 1px)` di Tailwind v4) |

Un valore fuori scala: 19,6px (voci di menu dentro le card), che viene da un `calc()` annidato.

## Ombre

Tailwind v4 compone sempre la stessa `box-shadow` a 5–6 livelli (inset, anello, offset dell'anello, ombra); i livelli non usati valgono `rgba(0, 0, 0, 0) 0px 0px 0px 0px`. Togliendo quelli trasparenti resta **un solo livello reale**:

- `0 1px 3px rgb(0 0 0 / .1), 0 1px 2px -1px rgb(0 0 0 / .1)` (lo `shadow-sm` di Tailwind) + un anello `0 0 0 1px` del colore del testo al 5%, su 15 card e sul cursore degli switch.

`--shadow-xl` è dichiarata ma non usata in pagina.

## Animazioni

- **Durate:** 150ms (42 elementi), 200ms (35), 100ms (13).
- **Curva:** `cubic-bezier(0.4, 0, 0.2, 1)` su 86 elementi su 90 (= `--default-transition-timing-function`); `linear` sui restanti 4.
- **Proprietà:** `all`, colori, `color, box-shadow` nei campi di testo, `width, height, padding`.
- **Hover:** i link dell'header prendono sfondo `#f5f5f5` e testo `#171717` (stile "ghost"); il campo di ricerca passa da `#f5f5f5` a `#f5f5f5` al 50%.
- **`@keyframes`:** 19 dichiarate (spin, pulse, enter/exit, accordion, caret-blink, shimmer, sonner…), nessuna attiva al caricamento.

## Breakpoint

- **Dichiarati:** la scala di Tailwind in rem: 40rem (640), **48rem (768)**, **64rem (1024)**, 80rem (1280), 96rem (1536). Poi valori del sito: 480, 560, 600 (max), 1400, 1600, 1800, 1900, 2000, 2200. Inoltre `hover`, `pointer`, `prefers-reduced-motion`, `forced-colors`, `print`.
- **Container query:** 9 (`card` ≥ 250px, 28rem, 540px, 767px; `main` ≥ 36, 56, 64rem; `field-group` ≥ 28, 42rem).
- **Osservati** restringendo la finestra da 1920 a 320px: il layout cambia a **1900, 1400, 1280, 1024 e 768px**. A 640px non cambia nulla di visibile in questa pagina.

## Font

| Famiglia | Pesi | File | Provider | In uso |
|---|---|---|---|---|
| Geist | 100–900 (variabile) | woff2, `ui.shadcn.com/_next/static/media/…` | il sito stesso (via `next/font`) | sì |
| Geist Mono | 400 | woff2, stesso percorso | il sito stesso | no |
| Noto Sans Arabic, Noto Sans Hebrew | 100–900 | woff2, stesso percorso | il sito stesso | no (servono per le lingue scritte da destra) |

- Ogni famiglia ha un "fallback" calcolato (`"Geist Fallback"` = `local("Arial")` con le metriche corrette), per evitare salti di layout mentre il font carica.
- La rete scarica **30 file di font** (molti con `preload`), ma `document.fonts` ne segna come caricati solo 2, entrambi Geist.

## Prove nella console

- `getComputedStyle($0).backgroundColor` sul bottone "Button" → `"lab(7.78201 -0.0000149012 0)"`. Non è `rgb()`: va gestito ogni formato.
- Conteggio degli sfondi: in testa `#ffffff`, poi `#737373` (17, sono le barre del grafico), `#f5f5f5` (14), `#171717` (13).
- `document.styleSheets`: 4 fogli, tutti leggibili (stesso dominio). Due dei 5 file CSS scaricati non sono collegati alla pagina: Next.js li carica in anticipo per altre pagine.
- `document.fonts`: 31 voci, solo 2 `loaded`.

## Casi difficili

Dettagli in [casi-difficili.md](casi-difficili.md):

- colori in `lab()` e `oklab()`;
- variabili ridefinite dentro i temi;
- pagina vetrina con due temi;
- radius `3.35544e+07px`;
- ombre a 6 livelli quasi tutti trasparenti;
- mezzi passi di spaziatura;
- 164 lati di bordo trasparenti;
- elementi `sr-only`;
- margini `auto` in pixel;
- font scaricati ma non usati;
- CSS scaricati ma non collegati;
- primary acromatico;
- distanza tra colori vicino al nero.

## Tempo impiegato

Raccolta automatica dei dati: circa 30 secondi per passaggio. Interpretazione e stesura: buona parte del lavoro. Non è un'analisi fatta solo a mano con DevTools, quindi non è il dato "a mano" che serve per il portfolio: se la rifai di persona, annota qui il tuo tempo.

## Risultato atteso

Tolleranze standard: colori ΔE2000 ≤ 2, lunghezze ± 0,5px (vedi [il modello](_modello.md)).

### Colori

- **SH-01** · Sfondo principale ≈ `#ffffff`, confidenza alta (corrisponde a `--background`).
- **SH-02** · Testo principale ≈ `#0a0a0a`. `#000000` deve finire nello **stesso gruppo** (ΔE2000 = 1,6).
- **SH-03** · Testo secondario ≈ `#737373`, distinto dal testo principale, nome dalla variabile `--muted-foreground`.
- **SH-04** · Primary ≈ `#171717` (colore pieno dei bottoni), acromatico.
- **SH-05** · Il motore **non deve** scegliere come primary un colore cromatico: l'unico candidato, `#f0b100`, occupa 64px² di area.
- **SH-06** · Superficie ≈ `#f5f5f5`, separata dallo sfondo `#ffffff` anche se distano solo ΔE2000 = 2,0.
- **SH-07** · Bordo ≈ `#e5e5e5` (`--border`).
- **SH-08** · Esiste una scala dei neutri con almeno 8 gradini, i cui valori coincidono con `--color-neutral-*` di Tailwind, e i nomi vengono da quelle variabili.
- **SH-09** · Il report dice che la palette è acromatica: nessuna scala cromatica tra i colori **usati**.
- **SH-10** · Le variabili dichiarate e non usate in pagina (le altre tinte di Tailwind, `--chart-*` blu) **non** compaiono come token usati; al massimo in un elenco "dichiarati, non usati".

### Tipografia

- **SH-11** · Una sola famiglia per titoli e testo: Geist, confermata dal font disegnato.
- **SH-12** · Stile body = 14px / interlinea 20px (rapporto 1,43), pesi 400 e 500.
- **SH-13** · Stile H1 = 48px, peso 600, interlinea 1,1, letter-spacing −0,05em.
- **SH-14** · Scala: {12, 14, 16, 18, 24, 30, 36, 48} px, giudicata **non modulare**. Il 12,8px (un elemento) non entra nella scala.
- **SH-15** · Esiste uno stile "overline": 12px, peso 500, maiuscolo, letter-spacing 0,05em.

### Spaziature

- **SH-16** · Unità base = **4px**, con la variabile `--spacing` come prova. ⚠ L'algoritmo del brief (la base più grande sopra l'80%) oggi darebbe 2px, perché solo il 72% dei valori è multiplo di 4: è un test che va fatto passare in M3 (vedi la decisione D3 in [casi-difficili.md](casi-difficili.md)).
- **SH-17** · La scala contiene almeno {4, 6, 8, 10, 12, 14, 16, 20, 24} px.
- **SH-18** · I margini −1px e i margini `auto` risolti in pixel (196px; 26,36px; 33,59px) **non** entrano nella scala.

### Radius

- **SH-19** · I valori 6, 8, 10, 14, 18, 22, 26 px prendono i nomi delle variabili `--radius-sm…4xl` (corrispondenza esatta del valore).
- **SH-20** · Le card hanno radius 24px; `3.35544e+07px` e `50%` diventano `full`.

### Ombre

- **SH-21** · Un solo livello di ombra: `0 1px 3px` + `0 1px 2px -1px`, nero al 10%. I livelli trasparenti vengono scartati: il motore **non** deve riportare 4 o più ombre diverse.

### Animazioni

- **SH-22** · Durata più usata 150ms; curva più usata `cubic-bezier(0.4, 0, 0.2, 1)`.

### Breakpoint

- **SH-23** · Tra i breakpoint dichiarati ci sono 640, 768, 1024, 1280, 1536 px (rem convertiti con 16px).
- **SH-24** · *(M6.1)* Il confronto tra viewport trova cambi di layout a 768 e 1024 px.

### Font

- **SH-25** · Geist, variabile 100–900, file ospitati dal sito (`ui.shadcn.com`), nessun provider esterno.
- **SH-26** · Geist Mono, Noto Sans Arabic e Noto Sans Hebrew risultano "dichiarati, non usati in pagina".

### Audit

- **SH-27** · Colori unici: circa 17, che scendono a circa 11–12 dopo il raggruppamento.
- **SH-28** · Nessun errore di contrasto sul testo (l'unica coppia sotto soglia è un'icona: `#737373` su `#f2f2f2`, 4,24:1).
- **SH-29** · Il punteggio di coerenza è il **più alto** dei tre siti di M0.

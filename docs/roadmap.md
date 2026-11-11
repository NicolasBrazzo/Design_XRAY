# Design XRAY: roadmap

> Il piano operativo per costruire Design XRAY, passo per passo. Il [brief](brief.md) spiega **cosa** fa il progetto e **perché**; questa roadmap spiega **in che ordine** lo costruiamo e **come** capiamo che ogni passo è finito.

**Ultimo aggiornamento:** 11 novembre 2026 · **Fase attuale:** M1 (M0 completata)

---

## Come leggere questa roadmap

Il lavoro è diviso in **7 fasi** (M0–M6), le stesse della roadmap del brief (§12), qui spezzate in passaggi concreti. A queste si aggiungono alcune **attività trasversali** (test, documentazione, portfolio) che accompagnano tutte le fasi.

Ogni fase ha la stessa struttura:

- **Obiettivo:** cosa esiste alla fine che prima non c'era.
- **Perché adesso:** perché è il passo giusto in quel momento.
- **Passaggi:** il lavoro in ordine, con caselle da spuntare.
- **Concetti da capire:** le idee nuove che servono e in quale fase della pipeline entrano in gioco.
- **Fatto quando:** il criterio che chiude la fase. Se non si può verificare, la fase non è finita.

Regole che valgono sempre:

1. **Una fase alla volta.** La successiva inizia solo quando il "fatto quando" è soddisfatto.
2. **Ogni passaggio finisce con qualcosa che si può vedere o provare:** un file, un comando, un test.
3. **Prima l'approccio, poi il codice:** per ogni passaggio non banale si descrive come lo faremo, poi si implementa.
4. **Il brief resta il riferimento per il "cosa":** se la roadmap e il brief non vanno d'accordo, si decide e si aggiornano entrambi.

## Panoramica

| Fase | Nome | Fase della pipeline | Produce | Peso |
|---|---|---|---|---|
| **M0** | Esplorazione manuale | tutte, a mano | 3 note in `docs/lab/`, lista dei casi difficili | piccolo |
| **M1** | Acquisizione ed estrazione | 1 e 2 | `raw.json` + screenshot | grande |
| **M2** | Normalizzazione | 3 | `normalized.json` | medio |
| **M3** | Inferenza e metriche | 4 | `tokens.json` | molto grande |
| **M4** | Report web e API | 5 (report) | interfaccia, API, demo online | grande |
| **M5** | Export | 5 (export) | variabili CSS, tema Tailwind, DTCG | medio |
| **M6** | Funzioni avanzate | tutte | hover, dark mode, mobile, componenti… | a scelta |

```
M0 ──▶ M1 ──▶ M2 ──▶ M3 ──┬──▶ M4 ──┐
 │                   ▲    └──▶ M5 ──┴──▶ M6
 └───────────────────┘
   le note di M0 sono il termine di paragone di M3
```

M4 e M5 dipendono solo da M3, quindi il loro ordine si può invertire. Conviene fare prima M4: un report visivo mostra subito gli errori dell'inferenza che nei JSON sfuggono.

---

## Stato di partenza (11 novembre 2026)

**Cosa c'è già nel repository:**

- `docs/brief.md`
- `client/`: Vite + React 19 + TypeScript + Tailwind CSS v4 + React Router. Per ora una sola pagina segnaposto.
- `server/`: Express 5 in JavaScript, con `playwright` tra le dipendenze. Per ora si avvia e ascolta sulla porta 3000, niente di più.
- Node.js 22.14.

**Differenze rispetto al brief, da risolvere:**

| Tema | Brief | Repository | Proposta |
|---|---|---|---|
| Cartelle | `engine/` + `web/` | `client/` + `server/` | Tenere `client/` e `server/` e aggiungere `engine/` in M1. Aggiornare il brief §10 |
| Frontend | Next.js o SvelteKit, da decidere | React + Vite già installati | Decisione presa di fatto: il report è un'app a pagina singola e non serve rendering lato server. Registrarla nel brief §14 |
| Linguaggio del server | TypeScript | JavaScript | Passare il server a TypeScript in M4, quando dovrà usare i tipi dell'engine |
| Playwright | usato dall'engine | dipendenza di `server/` | Spostarlo in `engine/` in M1: è l'engine che apre il browser |
| Node.js | non specificato | 22.14 | Aggiornare a una LTS recente prima di M1: da Node 22.18 in poi i file `.ts` si eseguono direttamente, senza passaggi di compilazione |

**Struttura prevista a regime:**

```
Design_XRAY/
├── CLAUDE.md
├── docs/
│   ├── brief.md
│   ├── roadmap.md
│   └── lab/                 note di M0 e note di verifica delle fasi successive
├── engine/                  libreria TypeScript: pipeline + CLI (da M1)
│   ├── src/
│   │   ├── types/           forma di raw.json, normalized.json, tokens.json
│   │   ├── acquire/         fase 1: browser, rete, attese, scroll
│   │   ├── extract/         fase 2: codice che gira nella pagina + parsing CSS
│   │   ├── normalize/       fase 3
│   │   ├── infer/           fase 4
│   │   ├── export/          fase 5: CSS, Tailwind, DTCG (M5)
│   │   ├── index.ts         API pubblica dell'engine
│   │   └── cli.ts           comandi da terminale
│   ├── test/
│   └── fixtures/
│       ├── synthetic/       pagine HTML scritte a mano, con valori noti
│       └── sites/           raw.json salvati dai siti reali di M0
├── server/                  API Express che usa l'engine (M4)
└── client/                  report React (M4)
```

Ogni fase della pipeline ha una cartella in `engine/src/` e un comando nella CLI. È il principio guida del brief (una fase, un input, un output) tradotto in struttura di file.

---

## M0. Esplorazione manuale

**Obiettivo:** analizzare a mano 3 siti molto diversi e scrivere per ognuno cosa ne ricaverebbe un esperto. Questi appunti diventano il **risultato atteso** del motore.

**Perché adesso:** prima di automatizzare un'analisi bisogna saperla fare a mano. M0 ti fa scoprire dove stanno davvero i dati, quali sono i casi difficili e qual è la risposta giusta per ogni sito. Senza M0, in M3 non avremmo un modo per dire se l'inferenza funziona.

**Stato (11 novembre 2026):** completata. Siti: [shadcn/ui](lab/shadcn-ui.md) (variabili CSS), [Bluesky](lab/bluesky.md) (JavaScript), [python.org](lab/python-org.md) (artigianale); casi in [casi-difficili.md](lab/casi-difficili.md). Le letture di DevTools sono state eseguite da script, con screenshot controllati a occhio (vedi "Metodo" in ogni nota). Il tempo di un'analisi fatta solo a mano resta da misurare.

### Passaggi

**0.1 Scegliere i 3 siti**

- [x] Uno **ricco di variabili CSS**, per esempio costruito con Tailwind v4, shadcn/ui o Radix. Verifica in DevTools che `:root` dichiari molte `--variabili`.
- [x] Uno **costruito con JavaScript** (React, Next.js, Vue…). Verifica con "Visualizza sorgente" (Ctrl+U): se il testo della pagina non compare nell'HTML, è il caso giusto.
- [x] Uno **artigianale:** CSS scritto a mano, senza design system, magari datato (il sito di un negozio o di uno studio, un vecchio WordPress). Metterà alla prova raggruppamento e audit.
- [x] Per ognuno annotare l'URL esatto (una sola pagina, per esempio la home) e la data: i siti cambiano e la nota vale per quel giorno.

**0.2 Preparare il modello di nota**

- [x] Creare `docs/lab/_modello.md` con sezioni fisse: Info · Panoramica · Variabili CSS · Colori · Tipografia · Spaziature · Radius · Ombre · Animazioni · Breakpoint · Font · Prove nella console · Casi difficili · Tempo impiegato · **Risultato atteso**.
- [x] Le sezioni seguono lo stesso ordine che avrà `tokens.json`, così in M3 il confronto si fa sezione per sezione.

**0.3 Analizzare ogni sito** (una nota per sito: `docs/lab/<nome-sito>.md`)

- [x] **Panoramica:** in Chrome DevTools apri il pannello *CSS Overview* (dal menu "More tools"). Dà i conteggi di colori, font e media query. Annota i numeri: sono il punto di partenza "da elenco" che Design XRAY deve superare.
- [x] **Variabili:** in Elements seleziona `<html>` e guarda la regola `:root` nel pannello Styles. Elenca le variabili di colori, raggi e spaziature.
- [x] **Colori:** individua sfondo, testo principale e secondario, colore primario (bottoni e link), bordi, colori semantici. Per ognuno annota il valore e **come l'hai capito**: quel "come" diventerà una regola in M3.
- [x] **Tipografia:** famiglia dei titoli e del testo, dimensioni di h1–h6 e del paragrafo, pesi, interlinea. In Elements → Computed, in fondo, la voce *Rendered Fonts* mostra il font disegnato davvero.
- [x] **Spaziature:** misura padding e gap di 10–15 elementi (bottoni, card, sezioni). Prova a indovinare l'unità base: 4? 8?
- [x] **Radius e ombre:** bottoni, card, campi di input, finestre modali.
- [x] **Animazioni:** transizioni al passaggio del mouse su link e bottoni (durata, curva).
- [x] **Breakpoint:** restringi la finestra (o usa la device toolbar) e annota a che larghezza cambia il layout. Poi cerca le `@media` nei CSS (Ctrl+Shift+F in DevTools, cerca `@media`).
- [x] **Font:** pannello Network, filtro *Font*: nomi dei file e provider (`fonts.gstatic.com` = Google Fonts, `use.typekit.net` = Adobe Fonts, stesso dominio del sito = file ospitati dal sito).
- [ ] **Tempo impiegato:** annota quanto ci hai messo. È l'argomento principale del progetto: "a mano: due ore; con Design XRAY: venti secondi". *(Da misurare rifacendo a mano almeno un sito.)*

**0.4 Provare qualche riga di codice nella console**

Queste prove sono il primo prototipo del codice di estrazione di M1: quello che funziona nella console funzionerà, quasi uguale, dentro Playwright.

- [x] `getComputedStyle($0)` sull'elemento selezionato in Elements (`$0` è l'elemento selezionato).
- [x] Un ciclo su `document.querySelectorAll('*')` che conta i colori di sfondo.
- [x] `[...document.styleSheets]` e prova a leggere le `cssRules` di ogni foglio: su quelli di altri domini otterrai un errore di sicurezza. È il problema CORS del brief §8, visto dal vivo.
- [x] `[...document.fonts].map(f => f.family + ' ' + f.weight + ' ' + f.status)`.

**0.5 Lista dei casi difficili**

- [x] Creare `docs/lab/casi-difficili.md`: ogni problema incontrato, con il sito dove compare. Per esempio: banner dei cookie che coprono la pagina, colori dentro immagini o sfumature, testo sopra immagini, CSS generato da JavaScript, iframe, Shadow DOM, animazioni d'ingresso che lasciano elementi invisibili.
- [x] Per ogni caso, indicare la fase della roadmap che dovrà risolverlo. I casi diventeranno pagine di test (vedi "Attività trasversali").

### Concetti da capire

- **Valore dichiarato e valore usato** (brief §4): nel pannello Styles vedi il dichiarato, in Computed l'usato. Tutto il progetto si regge su questa distinzione.
- **Stile calcolato:** come il browser risolve cascata, ereditarietà e variabili in un unico valore finale. → fase 2, estrazione.
- **Ereditarietà:** perché un `<div>` senza testo "ha" comunque un `color`. → è il motivo per cui in M1 si salva se un elemento contiene testo direttamente.
- **CORS sui fogli di stile:** il browser non lascia leggere a JavaScript i CSS di altri domini. → fase 1, i CSS si intercettano dalla rete.

### Fatto quando

- Ci sono 3 note complete in `docs/lab/`, ognuna con una sezione "Risultato atteso" scritta in modo verificabile (per esempio: "colore primario ≈ #635bff", "unità base 4px", "font dei titoli: X").
- `docs/lab/casi-difficili.md` contiene almeno un caso per sito.

---

## M1. Acquisizione ed estrazione

**Obiettivo:** un comando che, dato un URL, apre la pagina in un browser headless e salva `raw.json` e uno screenshot.

**Perché adesso:** è il fondamento: senza dati grezzi affidabili nessuna inferenza ha senso. E una volta salvati, i `raw.json` permettono di lavorare su M2 e M3 offline, senza riaprire i siti.

### Passaggi

**1.1 Preparare `engine/`**

- [ ] Aggiornare Node.js a una LTS recente (vedi "Stato di partenza"). *Al 11/11/2026 è ancora installato il 22.14; l'Active LTS è Node 26.*
- [x] Creare `engine/` con il suo `package.json` (`"type": "module"`), TypeScript e `playwright`. Scaricare il browser con `npx playwright install chromium`.
- [x] Spostare `playwright` dalle dipendenze di `server/` a quelle di `engine/`.
- [x] Configurare `tsconfig.json` per far girare i `.ts` direttamente con Node: TypeScript serve solo a controllare i tipi (`tsc --noEmit`). Con l'opzione `erasableSyntaxOnly` il compilatore segnala la sintassi che Node non sa eliminare da solo, come gli `enum`.
- [x] Usare come test runner `node:test`, già incluso in Node: nessuna dipendenza in più.
- [x] Aggiungere i comandi dell'engine alla sezione "Comandi" di CLAUDE.md.

**1.2 Definire la forma di `raw.json`, prima del codice**

- [ ] Scrivere i tipi in `engine/src/types/raw.ts`. Bozza dei contenuti:
  - `meta`: URL richiesto e URL finale (dopo i redirect), stato HTTP, data, viewport, user agent, versione dell'engine, font-size della radice, eventuale `blocked` con il motivo.
  - `elements[]`: per ogni elemento visibile, indice, **indice del genitore**, tag, ruolo ARIA, selettore d'esempio, se contiene testo direttamente e quanto, rettangolo (x, y, larghezza, altezza), proprietà della tabella del brief §6.2.
  - `pseudoElements[]`: `::before` e `::after` con un `content` diverso da `none`.
  - `customProperties[]`: nome, valore dichiarato, valore risolto.
  - `fontFaces[]`, `fontsLoaded[]`, `mediaQueries[]`, `keyframes[]`, `themeColor`, link al manifest.
  - `stylesheets[]`: provenienza di ogni foglio (URL o inline) e se è stato letto.
- [ ] Perché serve l'indice del genitore: in M2 bisogna sapere su quale sfondo sta un elemento per comporre la trasparenza. Senza il DOM, l'unico modo è risalire l'albero salvato.

**1.3 Una pagina sintetica di prova**

- [ ] Creare `engine/fixtures/synthetic/basic.html`, una pagina scritta a mano con valori noti: 3 colori, 2 dimensioni di testo, padding multipli di 8, un'ombra, una media query, un elemento nascosto, un colore `rgba` semitrasparente.
- [ ] Da qui in avanti ogni passaggio si prova prima su questa pagina: sappiamo già cosa deve uscire, quindi gli errori si vedono subito.

**1.4 Acquisizione** (`src/acquire/`)

- [ ] Avviare Chromium headless con Playwright e aprire un contesto con viewport fisso (per esempio 1440×900).
- [ ] Navigare con un tempo massimo; registrare redirect e stato HTTP.
- [ ] Attendere il caricamento: evento `load`, poi `document.fonts.ready`, poi una breve attesa che la rete si calmi, sempre con un tempo massimo.
- [ ] Scorrere fino in fondo a piccoli passi, con pause, per attivare i contenuti caricati in ritardo e le animazioni d'ingresso; poi tornare in cima.
- [ ] Intercettare le risposte di rete: tenere il testo dei CSS e gli URL dei font.
- [ ] Riconoscere i blocchi anti-bot: stato 403, 429 o 503, titoli come "Just a moment…", pagina con pochissimi elementi. In questi casi si compila `meta.blocked`.
- [ ] Salvare uno screenshot del viewport (e, come opzione, della pagina intera).

**1.5 Estrazione dal DOM** (`src/extract/in-page.ts`)

- [ ] Capire i "due mondi" (vedi i concetti sotto): la funzione passata a `page.evaluate` viene trasformata in testo e gira nel browser.
- [ ] Visitare tutti gli elementi con un `TreeWalker`. Il TreeWalker non entra da solo negli Shadow DOM aperti: quel passaggio va fatto a mano.
- [ ] Filtro di visibilità: `display: none`, `visibility: hidden`, opacità zero, dimensioni nulle, posizione fuori dalla pagina. `element.checkVisibility()` fa già una parte del lavoro.
- [ ] Per ogni elemento visibile: le proprietà della tabella §6.2 lette con `getComputedStyle`, il rettangolo, il contesto.
- [ ] Testo diretto: controllare i nodi di testo figli non vuoti, non `innerText`, che include anche il testo dei discendenti.
- [ ] Pseudo-elementi con `getComputedStyle(el, '::before')`.
- [ ] Un selettore d'esempio corto e leggibile (tag con id o classi, con un limite di lunghezza).
- [ ] Un limite al numero di elementi (per esempio 5.000), segnalato in `meta` se viene superato.

**1.6 Estrazione dai fogli di stile** (`src/extract/stylesheets.ts`)

- [ ] Fogli dello stesso dominio e regole aggiunte da JavaScript: leggerli dal CSSOM (`document.styleSheets`). Molte librerie CSS-in-JS inseriscono le regole con `insertRule` e lasciano vuoto il tag `<style>`: dal testo non si vedrebbero.
- [ ] Fogli di altri domini: usare il testo intercettato in 1.4 e analizzarlo con css-tree.
- [ ] Raccogliere: dichiarazioni di variabili (`--*`), `@font-face`, condizioni delle `@media`, nomi delle `@keyframes`, regole con `:hover` e `:focus` (per ora solo contate: serviranno in M6).
- [ ] Valori delle variabili: i nomi si prendono dai CSS, i valori li risolve il browser con `getComputedStyle(document.documentElement).getPropertyValue(nome)`.
- [ ] Per le variabili di colore, il trucco della sonda: applicare `color: var(--nome)` a un elemento invisibile e leggerne il colore calcolato. Così il valore è scritto nello stesso formato degli elementi e in M3 il confronto valore → nome è esatto.

**1.7 Font disegnati davvero**

- [ ] Da `document.fonts`: famiglie, pesi, stato (`loaded` o `error`).
- [ ] Per un campione di elementi di testo (titoli, paragrafi) chiedere a Chromium quale font ha usato per disegnarli, tramite il Chrome DevTools Protocol (`CSS.getPlatformFontsForNode`). Risolve il caso `Inter, sans-serif` con Inter che non si è caricato.

**1.8 CLI**

- [ ] `src/cli.ts` con il comando `extract <url> --out <cartella>`. Gli argomenti si leggono con `parseArgs` di `node:util`, senza librerie.
- [ ] Output nella cartella indicata: `raw.json` e `screenshot.png`.
- [ ] Messaggi di avanzamento per fase: "apro la pagina… scorro… estraggo 1.234 elementi…".

**1.9 Prova sui 3 siti di M0**

- [ ] Eseguire l'estrazione sui 3 siti e salvare i risultati in `engine/fixtures/sites/<nome>/`.
- [ ] Confrontare con le note di M0: ci sono le variabili che avevi visto? Il font disegnato è quello giusto? Il sito JavaScript ha tutti i contenuti?
- [ ] Nei `raw.json` messi su git salvare solo i dati estratti, non il testo completo dei CSS del sito: quello resta in una cache locale ignorata da git. È coerente con il principio "non copia il sito".

### Concetti da capire

- **Browser headless e Playwright come libreria.** → fase 1.
- **I due mondi, Node e pagina:** il codice dentro `page.evaluate` non vede le variabili e gli `import` di Node; riceve solo argomenti trasformabili in JSON e restituisce JSON. → fase 2.
- **TreeWalker, Shadow DOM, pseudo-elementi:** i punti in cui una lettura semplice del DOM non arriva. → fase 2.
- **CSSOM e testo CSS:** perché servono entrambi. → fase 2.
- **Chrome DevTools Protocol (CDP):** il canale con cui DevTools comunica con Chrome; Playwright ci dà accesso diretto. Tornerà in M6 per forzare lo stato `:hover`.
- **Perché salvare `raw.json`:** lo stesso sito aperto in due momenti può dare risultati diversi (contenuti dinamici, test A/B). Da `raw.json` in poi, invece, tutto è deterministico.

### Fatto quando

- `extract` funziona sulla pagina sintetica e sui 3 siti di M0, compreso quello costruito con JavaScript.
- Sulla pagina sintetica, `raw.json` contiene esattamente i valori noti (verificato da un test).
- Un sito che blocca i browser automatici produce un `raw.json` con `meta.blocked`, non dati parziali presentati come completi.

---

## M2. Normalizzazione

**Obiettivo:** trasformare `raw.json` in `normalized.json`: tutti i valori nello stesso formato, proprietà composte spezzate, doppioni fusi con il conteggio delle occorrenze.

**Perché adesso:** l'inferenza deve confrontare valori. Ma `#fff`, `rgb(255, 255, 255)` e `oklch(1 0 0)` sono lo stesso colore scritto in tre modi, e `rgba(0,0,0,0.1)` su bianco è in pratica un grigio. Se non si sistemano prima, M3 conterebbe tre colori al posto di uno.

### Passaggi

**2.1 Tipi**

- [ ] `src/types/normalized.ts`: per ogni categoria (colori, lunghezze, tipografia, ombre, animazioni…) una lista di **valori unici**, ognuno con valore normalizzato, occorrenze, area totale, proprietà in cui compare (per esempio `background-color`) e gli indici di alcuni elementi d'esempio.

**2.2 Colori** (`src/normalize/colors.ts`, con culori)

- [ ] Leggere ogni formato: hex, `rgb()`, `hsl()`, `oklch()`, `color(…)`, parole chiave. Chromium restituisce i colori moderni nel loro spazio (per esempio `oklch(…)` sui siti con Tailwind v4): non si può dare per scontato che arrivi sempre `rgb()`.
- [ ] Composizione della trasparenza: trovare lo sfondo effettivo risalendo i genitori, grazie all'indice salvato in M1, fino al primo sfondo non trasparente; poi mescolare il colore sopra quello sfondo. Se lo sfondo è un'immagine o una sfumatura, segnarlo come "sfondo incerto".
- [ ] Conservare sia il colore originale (con l'alpha) sia quello composto: il primo serve per l'export, il secondo per i confronti.
- [ ] Convertire in OKLCH per i calcoli e in hex per la visualizzazione.
- [ ] Scartare `transparent` e i colori che non si vedono (per esempio un `border-color` con bordo di spessore zero).
- [ ] Estrarre i colori dalle sfumature in `background-image`.

**2.3 Lunghezze** (`src/normalize/lengths.ts`)

- [ ] Tutto in px. Lo stile calcolato è quasi sempre già in px; vanno gestite le eccezioni: `normal`, `auto`, percentuali.
- [ ] Equivalente in rem calcolato sul font-size della radice salvato in `meta`, non su 16px fisso.
- [ ] `line-height`: tenere sia i px sia il rapporto con il font-size (come token, `1.5` è più utile di `24px`); `normal` resta una parola chiave.
- [ ] Arrotondare a un numero fisso di decimali, per esempio 2: `15.9999px` e `16px` devono diventare lo stesso valore.

**2.4 Proprietà composte**

- [ ] `box-shadow` → lista di livelli `{ x, y, blur, spread, color, inset }`. Le virgole dentro `rgba(…)` non separano le ombre: serve un parser che rispetti le parentesi (css-tree), non un semplice `split(',')`.
- [ ] `transition` → coppie durata/curva per proprietà; durate in millisecondi; parole chiave come `ease` tradotte nella `cubic-bezier` equivalente.
- [ ] Spaziature: scartare zero, valori negativi e `auto`.

**2.5 Doppioni e conteggi**

- [ ] Fondere i valori identici dopo la normalizzazione, sommando occorrenze e area.
- [ ] `color` e `font-*` si contano solo sugli elementi con testo diretto (brief §8).
- [ ] Gli sfondi si contano solo se non trasparenti.

**2.6 Determinismo, CLI e test**

- [ ] Ordinare ogni lista con un criterio completo (per esempio occorrenze decrescenti, poi valore), così non restano mai pareggi decisi dal caso.
- [ ] Nessuna data o valore variabile dentro `normalized.json` fuori da `meta`.
- [ ] Comando `normalize <raw.json> --out <normalized.json>`.
- [ ] Test con **golden file**: per ogni fixture si salva il `normalized.json` atteso; il test lo rigenera e lo confronta. Se qualcosa cambia, la differenza mostra esattamente cosa.

### Concetti da capire

- **Spazi colore:** sRGB, HSL, OKLCH, e perché i calcoli si fanno in OKLCH. → 2.2.
- **Composizione della trasparenza:** `risultato = colore × α + sfondo × (1 − α)`, canale per canale. → 2.2.
- **Parsing dei valori CSS:** perché dividere il testo sulle virgole non basta. → 2.4.
- **Determinismo:** ordinamenti stabili, arrotondamenti, nessuna dipendenza dall'ordine in cui arrivano i dati. → 2.6.
- **Golden file:** confrontare l'output con un file di riferimento già controllato a mano. → 2.6.

### Fatto quando

- Stesso `raw.json` → stesso `normalized.json`, identico byte per byte, sempre (verificato da test).
- Sulla pagina sintetica il colore `rgba` risulta composto correttamente, e lo stesso colore scritto in formati diversi risulta un valore solo.

---

## M3. Inferenza e metriche

**Obiettivo:** da `normalized.json` a `tokens.json`: valori raggruppati, ruoli assegnati, scale ricostruite, ogni token con prove e confidenza, più le metriche di coerenza.

**Perché adesso:** è il cuore del progetto e ciò che distingue Design XRAY dagli strumenti esistenti (brief §1). Si fa ora perché finalmente ci sono dati puliti (M2) e risultati attesi con cui confrontarli (M0).

**Approccio generale:** un modulo per categoria. Ogni modulo è una **funzione pura** (riceve `normalized.json`, restituisce una sezione di `tokens.json`) con i suoi test. Si parte dalle categorie semplici per fissare lo schema di un modulo (tipi, prove, confidenza, test) e si arriva ai colori, i più complessi, con lo schema già rodato.

### Passaggi

**3.0 La forma di `tokens.json`**

- [ ] `src/types/tokens.ts`, prima di qualsiasi algoritmo. Ogni token ha: `id`, nome, valore, ruolo (se c'è), confidenza (`high`, `medium`, `low`) con i **motivi**, prove (occorrenze, area, selettori d'esempio, fonte `declared` o `inferred`, variabile CSS corrispondente).
- [ ] Sezioni: `colors`, `typography`, `spacing`, `radius`, `shadows`, `motion`, `breakpoints`, `fonts`, `audit`.
- [ ] La tabella valore → nome delle variabili CSS (da `customProperties`), condivisa da tutti i moduli.
- [ ] Una prima bozza delle regole di confidenza (da rivedere in 3.7).

**3.1 Categorie semplici**

- [ ] **Breakpoint:** valori di `min-width` e `max-width` (anche nella sintassi `width >= 768px`), senza doppioni. Attenzione: nelle media query `em` e `rem` valgono il font-size predefinito del browser (di solito 16px), **non** quello della radice del sito.
- [ ] **Radius:** valori distinti per frequenza; valori enormi (`9999px`) o `50%` diventano `full`; livelli `sm`, `md`, `lg`.
- [ ] **Ombre:** un'intera `box-shadow`, anche a più livelli, è un livello di profondità; raggruppare quelle simili, ordinarle per sfocatura e distanza, chiamarle `shadow-sm`…`shadow-xl`.
- [ ] **Animazioni:** durate e curve più usate, escludendo `0s`.
- [ ] **Font:** famiglie, pesi disponibili (da `@font-face`) e pesi usati, provider riconosciuto dal dominio, URL. Mai il file.

**3.2 Spaziature**

- [ ] L'algoritmo del brief §7: per ogni base candidata (2, 4, 5, 6, 8 px) calcolare la quota di valori che ne sono multipli e scegliere **la base più grande** sopra la soglia (per esempio 80%).
- [ ] Pesare per occorrenze, non solo per valori unici: un 16px usato 300 volte conta più di un 13px usato una volta.
- [ ] La scala è fatta dai valori frequenti multipli della base; i valori fuori griglia vanno in una lista a parte, utile per l'audit.

**3.3 Tipografia**

- [ ] **Famiglie:** il font dei titoli (h1–h6) e quello del testo (p, li), usando il font **disegnato** raccolto in 1.7.
- [ ] **Scala:** dimensioni ordinate, escluse quelle rarissime; rapporti tra valori consecutivi; prova dei rapporti classici (1.125, 1.2, 1.25, 1.333, 1.5) partendo dalla dimensione del testo base, con una tolleranza per gli arrotondamenti. Se nessun rapporto spiega bene i valori, va detto: "scala non modulare" è un risultato valido.
- [ ] **Stili di testo:** raggruppare le combinazioni di famiglia, dimensione, peso, interlinea, spaziatura tra lettere e maiuscolo, e dare un nome in base al tag (H1…H6), alla frequenza (body) e alla dimensione (caption, sotto il body).

**3.4 Colori: raggruppamento**

- [ ] Distanza percepita con culori: ΔE 2000, oppure distanza euclidea in OKLab.
- [ ] Algoritmo: ordinare i colori per peso (occorrenze e area) e, uno alla volta, unirli al gruppo più vicino se entro la soglia, altrimenti aprirne uno nuovo. Il rappresentante del gruppo è il colore **più pesante, un valore che esiste davvero sulla pagina**, non una media.
- [ ] Soglia: partire da un valore vicino alla differenza appena percepibile e tararla sui siti di M0. È giusta quando i "40 grigi" del sito artigianale si riducono a pochi senza che il colore primario si fonda con un colore vicino ma diverso.

**3.5 Colori: ruoli**

- [ ] Un punteggio per ogni ruolo, calcolato dai segnali della tabella del brief §7: area come sfondo, frequenza come colore del testo, saturazione (la chroma di OKLCH) su elementi cliccabili, presenza sui bordi, tinte rosse, verdi o gialle in messaggi e badge.
- [ ] Indizi in più: il nome della variabile (`--primary`, `--danger`), il `theme-color`, le classi dell'elemento (`.btn-primary`, `.error`).
- [ ] Ogni ruolo assegnato porta i suoi motivi, per esempio: "chroma alta, 14 bottoni, corrisponde a `--color-primary`".

**3.6 Colori: scale e nomi**

- [ ] Separare i neutri (chroma molto bassa) dai colori; raggruppare i colori per tinta.
- [ ] Ordinare per luminosità e assegnare i gradini 50…900 in base alla luminosità **effettiva**, non alla posizione nella lista: se un sito ha solo tre blu, non devono diventare 100, 200 e 300, ma i gradini che corrispondono alla loro chiarezza.
- [ ] Nomi: la variabile CSS se c'è; altrimenti il ruolo (`accent`) o tinta + gradino (`gray-700`). Il nome della tinta viene da una tabella di intervalli di hue.

**3.7 Confidenza**

- [ ] Rivedere le regole in modo uniforme tra le categorie. Per esempio:
  - **alta:** il valore corrisponde a una variabile dichiarata **e** l'uso conferma il ruolo;
  - **media:** dedotto da segnali forti e concordi;
  - **bassa:** segnali deboli o in contrasto, oppure pochi elementi.
- [ ] Documentare le regole in `docs/` (per esempio in una nuova sezione del brief): il report dovrà spiegarle all'utente.

**3.8 Audit e punteggio**

- [ ] Le metriche del brief §7: colori unici prima e dopo il raggruppamento, numero di dimensioni e di famiglie di font, percentuale di spaziature sulla griglia, numero di radius e di ombre.
- [ ] Contrasto WCAG per ogni coppia testo/sfondo effettivo. Soglia AA: 4.5:1, oppure 3:1 per il testo grande (almeno 24px, o 18.66px se in grassetto). Le coppie con sfondo incerto (immagini) vanno in una lista "da verificare", non tra gli errori.
- [ ] Punteggio: ogni metrica diventa un punteggio parziale da 0 a 100 con una formula semplice e dichiarata, poi una media pesata. Il risultato contiene anche il dettaglio del calcolo.

**3.9 CLI e verifica sui siti di M0**

- [ ] Comando `infer <normalized.json> --out <tokens.json>` e comando unico `analyze <url>` che esegue tutta la pipeline.
- [ ] Per ogni sito di M0, un test che controlla le affermazioni del "Risultato atteso" (per esempio: "esiste un token `accent` a meno di 2 ΔE da #635bff", "unità base = 4px"). Non si confronta il file intero, solo ciò che una persona ha verificato a mano.
- [ ] Nota di verifica `docs/lab/m3-verifica.md`: per ogni sito, cosa il motore trova bene, cosa sbaglia e perché.

### Concetti da capire

- **Raggruppamento (clustering):** perché un algoritmo "greedy" ordinato per peso è semplice, spiegabile e deterministico. → 3.4.
- **Delta E e differenza appena percepibile.** → 3.4.
- **Euristiche e punteggi:** come si combinano segnali deboli in una decisione, e perché la decisione va spiegata. → 3.5 e 3.7.
- **Modular scale** e rapporti tipografici. → 3.3.
- **Massimo comun divisore "tollerante":** l'idea dietro la ricerca dell'unità base. → 3.2.
- **Contrasto WCAG:** luminanza relativa e rapporto di contrasto. → 3.8.
- **Funzioni pure:** stesso input, stesso output, nessun effetto collaterale. È ciò che rende l'inferenza testabile offline.

### Fatto quando

- I `tokens.json` dei 3 siti corrispondono a quanto annotato a mano in M0: i test di 3.9 passano.
- Ogni token ha prove e confidenza; il punteggio di coerenza ha la sua spiegazione.
- L'inferenza gira interamente offline sui `raw.json` salvati.

---

## M4. Report web e API

**Obiettivo:** incollare un URL in una pagina web e vedere il report. Demo online.

**Perché adesso:** il motore funziona da terminale; ora deve diventare usabile da chi un terminale non lo apre. È anche il momento in cui un report visivo mostra gli errori di M3 che nei JSON sfuggivano.

### Passaggi

**4.1 Collegare engine, server e client**

- [ ] Workspace npm alla radice del progetto (un `package.json` con `workspaces: ["engine", "server", "client"]`): il server importa l'engine come un pacchetto, senza percorsi relativi fragili.
- [ ] Passare il server a TypeScript, così server e client usano gli stessi tipi di `tokens.json` definiti nell'engine.
- [ ] L'engine espone una funzione `analyze(url, opzioni)`; il server non sa nulla di Playwright.

**4.2 API** (`server/`)

- [ ] `POST /api/analyze` con `{ url }` → risposta con `tokens.json`, `meta` e l'indirizzo dello screenshot.
- [ ] Validazione dell'URL: solo `http` e `https`, lunghezza massima, niente credenziali dentro l'URL.
- [ ] **Protezione SSRF, a più livelli:**
  1. risolvere il nome a dominio e rifiutare gli indirizzi privati e riservati: `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16` (dove i cloud espongono i metadati del server), `0.0.0.0`, `::1`, `fc00::/7`, `fe80::/10`;
  2. controllare anche le richieste fatte dalla pagina, intercettandole con `page.route`: una pagina pubblica può fare redirect o caricare risorse verso indirizzi interni. Questo controllo ha dei punti ciechi (alcuni redirect, i service worker, che vanno disattivati nel contesto del browser);
  3. la difesa più solida è a livello di rete: il processo che esegue Chromium non deve poter raggiungere reti interne (proxy in uscita o regole del firewall), qualunque cosa faccia la pagina.
- [ ] Tempo massimo per analisi (per esempio 45 secondi), un solo browser condiviso, un limite alle analisi in parallelo con una coda.
- [ ] Cache dei risultati per URL con scadenza: prima in memoria, poi su file.
- [ ] Limite di richieste per indirizzo IP.
- [ ] Errori chiari e distinti: URL non valido, sito irraggiungibile, sito che blocca i browser automatici, tempo scaduto.
- [ ] Avanzamento: all'inizio una sola richiesta che attende il risultato; poi un'analisi con identificativo e Server-Sent Events per mostrare le fasi ("apro la pagina", "estraggo", "inferisco").

**4.3 Struttura del client** (`client/`)

- [ ] Proxy di sviluppo di Vite: le chiamate a `/api` vanno al server Express, così client e server girano insieme senza problemi di CORS.
- [ ] Rotte: `/` (campo per l'URL) e `/report?url=…` (il report, condivisibile come link).
- [ ] Stati della pagina: caricamento con le fasi, errore, sito bloccato, risultato.

**4.4 Sezioni del report** (brief §9)

- [ ] **Panoramica:** screenshot, URL, data, punteggio di coerenza con il dettaglio del calcolo.
- [ ] **Colori:** palette per ruolo, scale tonali, valori in hex e OKLCH.
- [ ] **Tipografia:** campionario dei font, scala, stili di testo.
- [ ] **Spaziature:** unità base, scala disegnata come barre, valori fuori griglia.
- [ ] **Forme e ombre:** anteprime dei radius e dei livelli di profondità.
- [ ] **Animazioni e breakpoint.**
- [ ] **Font:** nomi, pesi, provider, link.
- [ ] **Audit:** metriche e coppie con contrasto insufficiente.
- [ ] **Pannello delle prove,** apribile da ogni token: confidenza con i motivi, occorrenze, area, selettori, fonte.

**4.5 Dettagli di design e accessibilità**

- [ ] I colori dei campioni arrivano dai dati, quindi si applicano con lo `style` inline: Tailwind genera le classi al momento della build e non può conoscere i colori dei siti analizzati.
- [ ] Campionario dei font senza ridistribuire file: i Google Fonts si caricano dal servizio ufficiale di Google; per gli altri si mostra un ritaglio dello screenshot dell'elemento reale, oppure il nome con un font di ripiego dichiarato come tale.
- [ ] Il report deve rispettare il contrasto WCAG che misura sugli altri siti.
- [ ] I token del report stesso vivono nel tema di Tailwind v4: il report è un piccolo design system.

**4.6 Pubblicazione della demo**

- [ ] Decidere l'hosting (brief §14): serve un server che possa eseguire Chromium (per esempio Railway, Render, Fly.io). L'immagine Docker ufficiale di Playwright contiene già il browser e le sue dipendenze.
- [ ] Il server Express serve anche il client compilato: un solo servizio da pubblicare.
- [ ] Variabili d'ambiente, log, limiti di memoria (Chromium ne usa molta).

### Concetti da capire

- **API HTTP e JSON tra client e server.** → 4.2.
- **Workspace npm e monorepo:** più pacchetti in un solo repository. → 4.1.
- **SSRF e DNS rebinding:** un nome a dominio può puntare a un indirizzo diverso tra il momento del controllo e quello della richiesta; per questo un controllo solo iniziale non basta. → 4.2.
- **Code e concorrenza:** perché non si possono aprire cinquanta browser insieme. → 4.2.
- **Server-Sent Events:** il server invia aggiornamenti al client su una connessione aperta. → 4.2.
- **Cache:** chiave, scadenza, invalidazione. → 4.2.

### Fatto quando

- Si incolla un URL e si vede il report completo; ogni token apre le sue prove.
- Un URL verso un indirizzo interno (per esempio `http://localhost` o `http://169.254.169.254`) viene rifiutato.
- La demo è online a un indirizzo pubblico.

---

## M5. Export

**Obiettivo:** scaricare i token come variabili CSS, tema Tailwind e JSON in formato DTCG.

**Perché adesso:** i token sono pronti e visibili; l'export li rende utili anche fuori da Design XRAY. Ogni export è una funzione pura `tokens.json → testo`: vive nell'engine (`src/export/`) e funziona anche da CLI.

### Passaggi

**5.1 Decisione preliminare**

- [ ] Formato colore predefinito (brief §14): hex o OKLCH. Proposta: hex come predefinito, perché lo legge qualsiasi strumento, e OKLCH come opzione.

**5.2 Nomi e livelli comuni a tutti i formati**

- [ ] Una sola funzione che decide i nomi finali dei token (kebab-case, senza collisioni), usata da tutti gli export.
- [ ] Due livelli: **primitivi** (`gray-700`, `indigo-500`) e **semantici** che li richiamano (`text-secondary` → `gray-700`), come nel glossario del brief.

**5.3 Variabili CSS**

- [ ] Un blocco `:root { … }` con prima i primitivi, poi i semantici che li richiamano con `var(--…)`.
- [ ] Un commento in testa con sito, data e versione di Design XRAY.

**5.4 Tema Tailwind**

- [ ] Tailwind v4, la stessa versione del client: il tema si scrive in CSS con `@theme { … }`.
- [ ] Rispettare i nomi che Tailwind si aspetta (`--color-*`, `--font-*`, `--text-*`, `--radius-*`, `--shadow-*`, `--breakpoint-*`, `--spacing`): così le classi generate funzionano subito.
- [ ] Opzionale: un `tailwind.config.js` per chi usa ancora Tailwind v3.

**5.5 DTCG**

- [ ] Studiare la versione stabile della specifica del Design Tokens Community Group (link nel brief §16): `$value`, `$type`, `$description`, gruppi, alias con la sintassi `{color.gray.700}`.
- [ ] Tipi da usare: `color`, `dimension`, `fontFamily`, `fontWeight`, `duration`, `cubicBezier`, `shadow`, `typography`.
- [ ] Prove e confidenza in `$extensions`, il campo previsto dalla specifica per i dati propri di uno strumento: la trasparenza arriva anche nell'export.
- [ ] Verifica: aprire il file con uno strumento che legge DTCG (per esempio Style Dictionary) e controllare che lo accetti senza errori.

**5.6 Download**

- [ ] Pulsanti nel report, con anteprima del file e "copia negli appunti".
- [ ] Download anche di `raw.json`.
- [ ] Comando `export <tokens.json> --format css|tailwind|dtcg`.

### Concetti da capire

- **Token primitivi, semantici e alias.** → 5.2.
- **Standard di interscambio:** perché esiste DTCG e quali strumenti lo leggono. → 5.5.
- **Tailwind v4 "CSS-first"** rispetto alla configurazione in JavaScript di v3. → 5.4.

### Fatto quando

- I tre formati si scaricano dal report e si generano dalla CLI.
- Il CSS esportato, incollato in una pagina vuota, funziona; il tema Tailwind genera le classi attese; il DTCG rispetta la specifica ed è letto da uno strumento esterno.
- Ogni formato ha i suoi test con golden file sulle fixture.

---

## M6. Funzioni avanzate

**Obiettivo:** ampliare ciò che il motore vede. Ogni funzione è indipendente: si sceglie, si progetta, si implementa e si chiude con la sua nota di verifica in `docs/lab/`.

**Perché adesso:** solo con la pipeline completa si capisce dove sono i limiti veri. Ognuna di queste funzioni ripercorre le fasi della pipeline in piccolo.

Ordine proposto, dalla più economica alla più impegnativa:

| # | Funzione | Idea | Fasi toccate |
|---|---|---|---|
| 6.1 | Mobile e desktop | due analisi con viewport diversi (per esempio 390 e 1440 px), poi il confronto di cosa cambia | acquisizione, report |
| 6.2 | Dark mode | Playwright simula `prefers-color-scheme: dark`; seconda analisi; i colori chiari e scuri si abbinano per ruolo | acquisizione, inferenza |
| 6.3 | Banner dei cookie e popup | riconoscerli (posizione fissa, sovrapposti a tutto, parole tipiche) ed escluderli da aree e conteggi | estrazione, normalizzazione |
| 6.4 | Stati hover e focus | forzare lo stato con il CDP (`CSS.forcePseudoState`) su bottoni e link e leggerne lo stile; confrontarlo con le regole `:hover` raccolte in M1 | estrazione, inferenza |
| 6.5 | Riconoscimento dei componenti | raggruppare gli elementi cliccabili con la stessa "firma" di stile (colori, padding, radius) per trovare le varianti dei bottoni | inferenza |
| 6.6 | Confronto tra due siti | due `tokens.json` affiancati, con le differenze di palette, scala e punteggio | output |
| 6.7 | Più pagine dello stesso sito | analizzare alcune pagine indicate dall'utente (non crawling) e unire i `raw.json` prima dell'inferenza | acquisizione, normalizzazione |
| 6.8 | iframe | estrarre anche dagli iframe dello stesso sito | estrazione |

- [ ] Per ogni funzione scelta: una nota di progetto prima e una nota di verifica dopo (`docs/lab/m6-<funzione>.md`).

### Fatto quando

Ogni funzione implementata ha la sua nota di verifica. M6 non va completata per intero: è un elenco da cui scegliere.

---

## Attività trasversali

Accompagnano tutte le fasi.

### Test

- **Pagine sintetiche** (`engine/fixtures/synthetic/`): piccole pagine HTML scritte a mano, una per caso (trasparenza, CSS-in-JS, Shadow DOM, scala modulare perfetta, spaziature disordinate…). Ogni caso difficile di M0 dovrebbe diventare una pagina sintetica.
- **Siti salvati** (`engine/fixtures/sites/`): i `raw.json` reali. Non cambiano più, quindi i test da M2 in poi restano stabili anche quando i siti cambiano.
- **Golden file** per normalizzazione ed export.
- **Affermazioni verificate a mano in M0** per l'inferenza.
- I test che aprono il browser (M1) sono lenti e vanno tenuti separati da quelli offline (M2–M5), che devono girare in pochi secondi.

### Documentazione

- Spuntare le caselle di questa roadmap a ogni passaggio e aggiornare la "Fase attuale" in cima.
- Aggiornare "Stato attuale" e "Comandi" in CLAUDE.md alla fine di ogni fase.
- Quando una decisione aperta del brief §14 viene presa, registrarla con il motivo.
- Le soglie (ΔE, quota per l'unità base, tolleranza della scala tipografica) vanno documentate con il valore scelto e il perché.

### Git

- Un commit per passaggio, con messaggio in inglese.
- Un branch per fase (per esempio `m1-extraction`), unito a `main` quando il "fatto quando" è soddisfatto.

### Portfolio

Design XRAY è un progetto da portfolio: il modo in cui viene raccontato conta quanto il codice.

- [ ] Dopo M1: le prime schermate e un `raw.json` d'esempio.
- [ ] Dopo M3: il confronto "a mano contro motore" tratto dalle note di M0. È la storia del progetto.
- [ ] Dopo M4: la demo online e una breve registrazione dello schermo.
- [ ] Dopo M5: un README con screenshot, spiegazione della pipeline e limiti dichiarati, e un case study su problemi e scelte. Le note in `docs/lab/` sono il materiale di partenza.

---

## Decisioni da prendere, e quando

| Decisione | Quando serve | Note |
|---|---|---|
| Versione di Node.js | inizio M1 | una LTS recente, per eseguire TypeScript senza compilazione |
| Struttura delle cartelle | inizio M1 | proposta: `engine/` + `server/` + `client/` |
| Framework frontend | già presa di fatto | React + Vite; da registrare nel brief |
| Regole di inferenza emerse da M0 (D1–D5: distanza tra colori, testo principale, unità base, componenti ripetuti, variabili nei temi) | inizio M3 | proposte e test collegati in `docs/lab/casi-difficili.md` |
| Hosting della demo | M4.6 | serve un server che esegua Chromium |
| Formato colore negli export | M5.1 | proposta: hex predefinito, OKLCH come opzione |
| Lingua dell'interfaccia | M4 | |
| Lingua della documentazione pubblica | Portfolio | il README conviene in inglese per un portfolio internazionale |

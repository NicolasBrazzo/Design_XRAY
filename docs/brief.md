# Design XRAY: brief di progetto

> Dato l'URL di un sito pubblico, Design XRAY ne fa una "radiografia" e ricostruisce il suo design system: colori, tipografia, spaziature, forme, ombre, animazioni e breakpoint, organizzati come design token pronti da usare.

**Stato:** progettazione · **Ultimo aggiornamento:** 11 novembre 2026

---

## 1. Il problema

Designer e sviluppatori hanno spesso bisogno di capire "di cosa è fatto" un sito:

- rifare un sito esistente di cui nessuno ha più i file di design;
- studiare un concorrente o un sito di riferimento;
- capire se un sito è coerente o se nel tempo ha accumulato 40 grigi diversi;
- portare un sito verso un design system vero e proprio.

Oggi si fa a mano con i DevTools del browser, elemento per elemento: è lento, incompleto e soggettivo.

Gli strumenti esistenti (CSS Peeper, CSS Stats, Project Wallace, il pannello CSS Overview di Chrome) **elencano** i valori ma non li **interpretano**. Ti dicono che la pagina usa 63 colori, non che uno di questi è il colore primario e che altri dieci formano la scala dei grigi.

## 2. Obiettivi

1. Estrarre tutti i valori di stile **usati davvero** da una pagina.
2. **Interpretarli:** raggruppare i valori simili, assegnare un ruolo, ricostruire le scale e trasformarli in token.
3. Mostrare il risultato in un **report visivo** chiaro.
4. **Esportare** i token in formati standard: variabili CSS, tema Tailwind, W3C Design Tokens (DTCG).
5. **Misurare la coerenza** del design system (audit).
6. Essere **trasparente:** per ogni token mostrare da dove viene e quanto è affidabile.

### Cosa non fa (per ora)

- Non ricostruisce il file di design originale né i nomi esatti scelti dal team: questi si possono solo dedurre.
- Non copia il sito né i suoi asset (font, immagini).
- Non analizza pagine dietro login.
- Non esplora interi siti: si analizza una pagina alla volta.

## 3. Per chi è

- **Designer UI** che vogliono studiare o prendere ispirazione da un sito.
- **Sviluppatori frontend** che devono ricostruire o migrare uno stile.
- **Chi fa audit** di coerenza visiva e di design system.

### Esperienza d'uso

L'utente incolla un URL e dopo qualche secondo vede il report: palette, tipografia, spaziature, ombre, con un punteggio di coerenza. Può aprire ogni token per vedere dove è usato e scaricare tutto nel formato che preferisce.

## 4. Il modello mentale: reverse engineering

Normalmente un design system segue questo percorso:

```
token (color-primary)  →  CSS (var(--color-primary))  →  valore sulla pagina (rgb(99, 91, 255))
```

Design XRAY fa il percorso **al contrario**:

```
valori sulla pagina  →  schemi ricorrenti  →  token ricostruiti
```

Per farlo servono due tipi di dati, e servono **entrambi**:

|  | Dichiarato | Usato |
|---|---|---|
| **Cos'è** | Quello che è scritto nei file CSS | Quello che il browser applica davvero a ogni elemento |
| **Dove si legge** | Fogli di stile, variabili CSS | `getComputedStyle` |
| **Cosa ci dà** | I nomi (`--color-primary`), breakpoint, font dichiarati | Frequenza, contesto d'uso, area occupata |
| **Limite** | Può contenere regole mai usate | Perde i nomi: `var(--primary)` diventa `rgb(99, 91, 255)` |

## 5. Da dove arrivano i dati

| Fonte | Cosa ci troviamo |
|---|---|
| Variabili CSS su `:root` | Token espliciti. Quando ci sono, metà del lavoro è fatta (es. siti con Tailwind v4, Radix, shadcn) |
| Stile calcolato degli elementi | Colori, font, dimensioni, spaziature, radius, ombre effettivamente usati |
| `@font-face`, richieste di rete, `document.fonts` | Famiglie di font, pesi, provider (Google Fonts, Adobe Fonts, file sul sito) |
| `@media` | Breakpoint |
| `transition`, `@keyframes` | Durate e curve delle animazioni |
| `theme-color`, manifest, favicon | Colore del brand |
| Screenshot | Colori dentro immagini e sfumature, che il CSS non vede |

## 6. La pipeline

```
          URL
           │
           ▼
 ┌───────────────────┐
 │ 1. ACQUISIZIONE   │  apre la pagina in un browser headless
 └─────────┬─────────┘
           ▼
 ┌───────────────────┐
 │ 2. ESTRAZIONE     │  legge stili e fogli CSS          → raw.json
 └─────────┬─────────┘
           ▼
 ┌───────────────────┐
 │ 3. NORMALIZZAZIONE│  formati unici, niente doppioni
 └─────────┬─────────┘
           ▼
 ┌───────────────────┐
 │ 4. INFERENZA      │  gruppi, ruoli, scale, metriche   → tokens.json
 └─────────┬─────────┘
           ▼
 ┌───────────────────┐
 │ 5. OUTPUT         │  report visivo + export
 └───────────────────┘
```

**Principio guida:** ogni fase riceve un input e produce un output in JSON, e fa una cosa sola. `raw.json` viene salvato: così la fase 4 si può rieseguire e migliorare senza riaprire il sito, e i file salvati diventano casi di test.

### 1. Acquisizione

Apre l'URL con Playwright in un browser senza finestra (headless). Aspetta che la pagina abbia finito di caricare, poi scorre fino in fondo per far comparire i contenuti caricati in ritardo. Intercetta dalla rete i file CSS e i font.

Opzioni future: più dimensioni di schermo (mobile e desktop), dark mode.

### 2. Estrazione

Per ogni elemento **visibile** legge un insieme fisso di proprietà:

| Gruppo | Proprietà |
|---|---|
| Colore | `color`, `background-color`, colori dei bordi, `outline-color`, `fill` e `stroke` (SVG), sfumature in `background-image` |
| Tipografia | `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, `text-transform` |
| Spaziatura | `padding`, `margin`, `gap` (lati e assi separati) |
| Forma | `border-radius`, `border-width` |
| Profondità | `box-shadow`, `opacity` |
| Animazione | `transition-duration`, `transition-timing-function`, `animation-name` |

Per ogni elemento salva anche il contesto: tag, ruolo, se contiene testo direttamente, posizione e dimensioni, un selettore di esempio.

Dai fogli di stile legge: variabili su `:root`, `@font-face`, `@media`, `@keyframes`.

Il risultato è `raw.json`.

### 3. Normalizzazione

- Tutti i colori in un unico formato. I calcoli si fanno in OKLCH; la trasparenza va prima composta sullo sfondo.
- Tutte le lunghezze in px, con equivalente in rem calcolato sul font-size della radice del sito.
- Le proprietà composte vengono spezzate nelle loro parti (es. le ombre multiple di `box-shadow`).
- Si eliminano i doppioni e si contano le occorrenze.

### 4. Inferenza

È il cuore del progetto: vedi la sezione 7. Produce `tokens.json` e le metriche di coerenza.

### 5. Output

Report visivo ed export: vedi la sezione 9.

## 7. La logica di inferenza

### Colori

1. **Comporre la trasparenza:** `rgba(0,0,0,0.1)` sopra uno sfondo bianco è in pratica un grigio chiaro.
2. **Raggruppare** i colori quasi uguali usando la distanza percepita dall'occhio (Delta E, calcolata in OKLCH/Lab) con una soglia di tolleranza. La distanza tra i numeri RGB non va bene, perché non corrisponde a come vediamo i colori.
3. **Assegnare un ruolo** in base a dove compare il colore:

   | Segnale | Ruolo probabile |
   |---|---|
   | Sfondo che copre l'area più grande | background / surface |
   | Colore di testo più frequente | testo principale (quelli più chiari: testo secondario) |
   | Colore saturo su bottoni, link, elementi cliccabili | primary / accent |
   | Colore su bordi e separatori | border |
   | Rosso, verde, giallo su messaggi, badge, campi in errore | semantici (error, success, warning) |

4. **Ricostruire le scale:** i colori della stessa tinta, ordinati per luminosità, formano la scala da chiaro a scuro (50…900).
5. **Dare un nome:** se il valore corrisponde a una variabile CSS, si usa quel nome. Altrimenti si genera un nome dal ruolo o dalla scala (es. `accent`, `gray-700`).

### Tipografia

- **Famiglie:** distinguere il font dei titoli da quello del testo (in base a `h1`–`h6` e `p`). Verificare quale font viene davvero disegnato e non solo quello dichiarato, perché in `Inter, sans-serif` Inter potrebbe non caricarsi.
- **Scala:** ordinare le dimensioni e cercare un rapporto costante tra valori consecutivi, con una tolleranza per gli arrotondamenti. I rapporti classici sono 1.125, 1.2, 1.25, 1.333 e 1.5.
- **Stili di testo:** raggruppare dimensione, peso, interlinea e spaziatura tra lettere in stili (H1, H2, body, caption), usando tag e frequenza come indizi.
- **Si contano solo gli elementi che contengono testo direttamente**, altrimenti l'ereditarietà gonfia i numeri.

### Spaziature

- Raccogliere tutti i valori di `padding`, `margin` e `gap` maggiori di zero.
- Provare diverse unità base (2, 4, 5, 6, 8 px). Scegliere **la più grande** che spiega una quota alta dei valori (es. almeno l'80%): la più piccola li spiega sempre tutti, quindi da sola non dice nulla.
- La scala è formata dai valori frequenti che sono multipli della base; quelli che non lo sono vengono segnalati a parte.

### Radius, ombre, animazioni, breakpoint

- **Radius:** valori distinti ordinati per frequenza, poi livelli tipo `sm`, `md`, `lg`, `full`.
- **Ombre:** ogni ombra viene scomposta nelle sue parti; quelle simili si raggruppano in livelli di profondità, ordinati per sfocatura e distanza.
- **Animazioni:** durate e curve di easing più usate.
- **Breakpoint:** i valori di `min-width` e `max-width` nelle `@media`, senza doppioni.

### Confidenza e prove

Ogni token contiene:

- valore e ruolo;
- **confidenza** (alta, media, bassa);
- **prove:** quanti elementi lo usano, quanta area occupa, alcuni selettori di esempio, se viene da una variabile dichiarata o è stato dedotto.

Esempio: *`accent` = #635bff, confidenza alta: corrisponde alla variabile `--color-primary`, usato su 14 bottoni e 32 link.*

### Metriche di coerenza (audit)

- Colori unici prima e dopo il raggruppamento.
- Numero di dimensioni e di famiglie di font.
- Percentuale di spaziature che rispettano l'unità base.
- Numero di valori diversi di radius e di ombre.
- Coppie testo/sfondo che non rispettano il contrasto minimo WCAG AA.

Da queste nasce un **punteggio di coerenza** complessivo, sempre accompagnato dalla spiegazione di come è stato calcolato.

## 8. Problemi noti e come li affrontiamo

| Problema | Perché succede | Strategia |
|---|---|---|
| L'ereditarietà gonfia i conteggi | `color` e `font-family` passano a tutti i figli | Testo contato solo sugli elementi che lo contengono direttamente; sfondi solo se non trasparenti |
| Più frequente non vuol dire più importante | Il colore del bottone principale compare poche volte ma è il brand | Pesare anche per area visibile e tipo di elemento |
| Lo stile calcolato perde i nomi | `var(--primary)` diventa `rgb(...)` | Tabella valore → nome costruita dalle variabili CSS |
| `:hover` e `:focus` non si vedono | Lo stile calcolato mostra solo lo stato attuale | Leggere le regole CSS con `:hover`; più avanti forzare lo stato via Chrome DevTools Protocol |
| Elementi nascosti, `::before`/`::after`, Shadow DOM, iframe | Non compaiono in una lettura semplice del DOM | Filtro di visibilità; lettura degli pseudo-elementi; attraversare gli shadow root; iframe in seguito |
| I fogli di stile di altri domini non si leggono | Restrizioni di sicurezza del browser (CORS) | Scaricare i file CSS dalla rete con Playwright e analizzarli con css-tree |
| Pagine costruite da JavaScript, contenuti in ritardo | L'HTML iniziale è quasi vuoto | Browser headless, attesa del caricamento, scroll fino in fondo |
| Banner dei cookie e popup | Coprono la pagina e falsano le aree | Riconoscerli e ignorarli (in seguito) |
| Protezioni anti-bot | Alcuni siti bloccano i browser automatici | Accettare il limite e segnalarlo chiaramente all'utente |

## 9. Output

### Report visivo

1. **Panoramica:** screenshot della pagina e punteggio di coerenza.
2. **Colori:** palette per ruolo e scale tonali.
3. **Tipografia:** campionario dei font, scala, stili di testo.
4. **Spaziature:** unità base e scala.
5. **Forme e ombre:** radius e livelli di profondità.
6. **Animazioni e breakpoint.**
7. **Font:** nomi, pesi, provider.
8. **Audit:** metriche di coerenza e problemi di contrasto.

Ogni token si può aprire per vedere le prove: dove è usato e con che confidenza.

### Export

- **Variabili CSS**, pronte da incollare.
- **Tema Tailwind.**
- **JSON in formato W3C Design Tokens (DTCG)**, lo standard per scambiare token tra strumenti.
- **`raw.json`**, per chi vuole tutti i dati grezzi.

## 10. Architettura

```
                ┌──────────────┐
      URL ────▶ │    engine    │ ────▶ raw.json + tokens.json
                └──────┬───────┘
                       │ usato da
           ┌───────────┼────────────┐
           ▼           ▼            ▼
          CLI         API  ◀──── web app (report)
```

- **engine:** libreria che fa tutta la pipeline. Non dipende dall'interfaccia.
- **CLI:** usa l'engine da riga di comando. Serve per sviluppare e provare.
- **API:** server che esegue l'engine (con Chromium headless), con tempo massimo, cache dei risultati e protezione contro gli URL di reti interne (SSRF).
- **web app:** l'interfaccia del report.

### Struttura delle cartelle prevista

Si parte solo con `engine`; il resto arriva con le milestone successive.

```
Design_XRAY/
├── CLAUDE.md
├── docs/
│   ├── brief.md
│   └── lab/        quaderno di laboratorio (analisi manuali)
├── engine/         pipeline + CLI
└── web/            report web + API
```

## 11. Stack

| Ambito | Scelta | Perché |
|---|---|---|
| Linguaggio | TypeScript | Il codice di estrazione gira dentro la pagina (JavaScript); i tipi descrivono con precisione il formato dei token |
| Runtime | Node.js | Esegue Playwright e il server |
| Browser | Playwright (libreria, non test runner) | Controlla un browser vero e attende da solo che la pagina sia pronta |
| Parsing CSS | css-tree | Legge i fogli di stile scaricati dalla rete |
| Colori | culori | OKLCH, Delta E, conversioni tra formati |
| Frontend | da decidere | Next.js o SvelteKit |
| Hosting | da decidere | Serve un server che possa eseguire Chromium (es. Railway, Render, Fly.io) |

## 12. Roadmap

| Milestone | Cosa | Fatto quando |
|---|---|---|
| **M0. Esplorazione manuale** | Analizzare a mano con i DevTools 3 siti molto diversi (uno con molte variabili CSS, uno costruito con React, uno "artigianale") | 3 note complete in `docs/lab/` e una lista dei casi difficili |
| **M1. Acquisizione ed estrazione** | Comando che, dato un URL, salva `raw.json` | Funziona sui 3 siti di M0, compreso quello costruito con JavaScript |
| **M2. Normalizzazione** | Formati unici, proprietà spezzate, doppioni eliminati | Stesso input → stesso output, sempre |
| **M3. Inferenza e metriche** | Colori, tipografia, spaziature, radius, ombre, breakpoint, confidenza, coerenza | I `tokens.json` dei 3 siti corrispondono a quanto annotato a mano in M0 |
| **M4. Report web** | Interfaccia e API | Si incolla un URL e si vede il report; demo online |
| **M5. Export** | Variabili CSS, Tailwind, DTCG | File scaricabili; il DTCG rispetta la specifica |
| **M6. Funzioni avanzate** | Stati hover/focus, dark mode, mobile e desktop, riconoscimento dei componenti (es. varianti dei bottoni), confronto tra due siti, più pagine | Ogni funzione ha la sua nota di verifica |

Le note di M0 sono il **termine di paragone** per M3: quello che hai trovato a mano è il risultato che il motore deve riuscire a ottenere da solo.

## 13. Limiti e uso responsabile

- Si analizzano solo pagine pubbliche, una per richiesta, su iniziativa dell'utente.
- Font e asset non vengono mai ridistribuiti: il report mostra nomi, provider e link.
- Alcuni siti bloccano i browser automatici: il report lo dice chiaramente invece di mostrare dati parziali come completi.
- I ruoli e i nomi dei token sono **deduzioni**: il report lo esplicita con il livello di confidenza.

## 14. Decisioni aperte

- Framework frontend: Next.js o SvelteKit?
- Dove pubblicare la demo?
- Formato colore predefinito negli export: hex o OKLCH?
- Lingua dell'interfaccia e della documentazione pubblica: italiano o inglese (per un portfolio internazionale)?

## 15. Glossario

- **Design token:** un valore di design con un nome (es. `color-primary = #635bff`).
- **Token primitivo / semantico / di componente:** il valore puro (`blue-500`), il ruolo (`color-primary`), dove si usa (`button-bg`).
- **Stile calcolato (computed style):** il valore finale che il browser applica a un elemento dopo aver risolto tutte le regole.
- **CSSOM:** la rappresentazione dei fogli di stile che il browser rende leggibile da JavaScript.
- **Browser headless:** un browser vero, senza finestra, controllato da codice.
- **Playwright:** libreria per controllare un browser. Il pacchetto `playwright` è la libreria; `@playwright/test` aggiunge gli strumenti per i test.
- **Web scraping:** usare un browser automatico per leggere dati da un sito.
- **OKLCH:** spazio colore in cui le distanze corrispondono bene a come l'occhio percepisce i colori.
- **Delta E:** misura di quanto due colori appaiono diversi.
- **Modular scale:** una scala tipografica in cui ogni dimensione è la precedente moltiplicata per un rapporto fisso.
- **DTCG:** il formato standard W3C per descrivere design token in JSON.
- **SSRF:** attacco in cui un server viene indotto ad aprire indirizzi interni che non dovrebbe raggiungere.

## 16. Riferimenti

- [Playwright: Library](https://playwright.dev/docs/library), la libreria senza test runner
- [Playwright: Evaluating JavaScript](https://playwright.dev/docs/evaluating), i "due mondi" script e pagina
- [MDN: getComputedStyle](https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle)
- [Design Tokens Community Group](https://www.designtokens.org/), formato DTCG
- [CSS Stats](https://cssstats.com/) e [Project Wallace](https://www.projectwallace.com/), strumenti esistenti da studiare
- [oklch.com](https://oklch.com/), per sperimentare con OKLCH
- [culori](https://culorijs.org/), libreria per i colori

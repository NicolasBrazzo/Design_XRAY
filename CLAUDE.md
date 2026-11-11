# Design XRAY

Tool che, dato l'URL di un sito pubblico, ne ricostruisce il design system: colori, tipografia, spaziature, radius, ombre, motion, breakpoint e font, organizzati come design token. È un progetto da portfolio.

Il progetto completo (logica, pipeline, roadmap) è in [docs/brief.md](docs/brief.md): leggilo prima di proporre o scrivere codice.

## Stato attuale

- Fase: **progettazione**. Non c'è ancora codice, quindi non esistono comandi di build, test o avvio. Quando arriveranno (es. `package.json`), aggiungi qui una sezione "Comandi".
- Prossimo passo: milestone **M0** (analisi manuali in `docs/lab/`), poi **M1** (vedi la roadmap nel brief).

## Come lavorare con l'utente

- Rispondi in **italiano**.
- L'utente vuole **capire la logica**, non solo avere codice funzionante. Spiega il perché delle scelte e collega ogni concetto nuovo alla fase della pipeline in cui serve.
- Procedi a piccoli passi, una milestone alla volta. Prima di implementare qualcosa di non banale, descrivi l'approccio e aspetta conferma.
- Non scrivere grandi blocchi di codice non richiesti.

## Decisioni di architettura già prese

- **Pipeline in 5 fasi:** acquisizione → estrazione → normalizzazione → inferenza → output. Ogni fase ha input e output espliciti in JSON e fa una cosa sola.
- **Motore separato dall'interfaccia:** `engine` riceve un URL e restituisce JSON, non sa nulla della UI. CLI, API e web app lo usano.
- **Dati grezzi separati dai token:** l'estrazione salva `raw.json`; l'inferenza produce `tokens.json` e deve poter girare offline su un `raw.json` salvato. I `raw.json` salvati servono anche come casi di test.
- **Trasparenza:** ogni token inferito porta con sé le prove (conteggio, area, selettori di esempio, fonte) e un livello di confidenza.
- **Playwright come libreria** (pacchetto `playwright`), non come test runner.

## Stack

TypeScript, Node.js, Playwright (libreria), css-tree (parsing CSS), culori (colori, OKLCH, Delta E). Frontend e hosting non ancora decisi: vedi "Decisioni aperte" nel brief.

## Convenzioni

- Codice, identificatori e commit in inglese; documentazione e spiegazioni in italiano.
- Colori: calcoli in OKLCH, visualizzazione in hex. La trasparenza va composta sullo sfondo prima di confrontare i colori.
- Lunghezze normalizzate in px; il valore in rem si calcola rispetto al font-size della radice del sito analizzato, non a un 16px fisso.
- Output deterministico: stesso input → stesso output (ordinamenti stabili).

## Vincoli

- Solo siti pubblici, una pagina per richiesta. Niente crawling massivo.
- I file dei font e degli asset non si ridistribuiscono mai: si riportano nome, provider e URL.
- Il servizio web dovrà bloccare gli URL verso reti interne (SSRF).

## Mappa dei file

- `docs/brief.md`: cos'è il progetto, logica di inferenza, architettura, roadmap.
- `docs/lab/` (da creare in M0): quaderno di laboratorio, una nota per ogni sito analizzato a mano.

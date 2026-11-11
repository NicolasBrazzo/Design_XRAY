# <Nome del sito>: analisi manuale (M0)

> Modello per le note di `docs/lab/`. Copialo in `docs/lab/<nome-sito>.md` e compila ogni sezione.
> Le sezioni da **Colori** a **Font** seguono l'ordine che avrà `tokens.json`: in M3 il confronto tra il motore e la nota si fa sezione per sezione.

## Come si scrive questa nota

- **Valore e motivo, sempre insieme.** Per ogni valore annota anche *come l'hai capito* ("è lo sfondo con l'area più grande", "è il colore dei bottoni pieni"). Quel "come" diventerà una regola del motore in M3.
- **Numeri dalla pagina, non a memoria.** Copia i valori da DevTools (pannello Computed) o dalla console. Se un valore è una stima, scrivilo.
- **Una data, una pagina.** I siti cambiano: la nota vale per l'URL e il giorno indicati in "Info".

## Come si scrive il "Risultato atteso"

È la parte che diventa un test in M3 (passaggio 3.9). Regole:

1. **Ogni affermazione ha un codice** (`XX-01`, `XX-02`…) così i test possono citarla.
2. **Solo cose verificate**, che una persona può controllare guardando la pagina.
3. **Con una tolleranza esplicita.** Quelle standard:
   - colori: "≈ `#rrggbb`" significa **ΔE2000 ≤ 2** (la differenza appena percepibile);
   - lunghezze: ± 0,5 px;
   - rapporti (interlinea, scala tipografica): ± 0,02.
4. **Anche affermazioni negative**, cioè cosa il motore *non* deve fare ("non deve scegliere come primary il giallo del pallino di stato"). Sono i test più utili, perché fissano gli errori tipici.
5. **Indicare la fase** in cui l'affermazione diventa verificabile (M3, M6.1…), quando non è M3.

---

## Info

- **URL:**
- **Data:**
- **Categoria:** variabili CSS / costruito con JavaScript / artigianale, e perché il sito ci rientra
- **Tecnologia:** indizi trovati (classi, nomi dei file, `generator`, cartelle come `/_next/`)
- **Condizioni:** viewport, browser, tema chiaro o scuro, popup chiusi o no
- **Metodo:** DevTools a mano, console, script

## Panoramica

Numeri del pannello **CSS Overview** di Chrome (menu ⋮ → More tools → CSS Overview → Capture overview). Sono il punto di partenza "da elenco" che Design XRAY deve superare.

| Voce | Valore |
|---|---|
| Elementi nel DOM | |
| Colori unici (testo, sfondo, bordo) | |
| Famiglie di font | |
| Dimensioni di testo | |
| Media query | |
| Fogli di stile (e quanti leggibili) | |
| Variabili CSS | |

## Variabili CSS

Seleziona `<html>` in Elements e guarda la regola `:root` nel pannello Styles. Annota i gruppi di variabili (colori, raggi, spaziature, font) e i nomi dei ruoli (`--primary`, `--border`…). Controlla anche se le stesse variabili vengono **ridefinite** più in basso nell'albero (temi, dark mode).

## Colori

| Ruolo | Valore | Variabile | Come l'ho capito |
|---|---|---|---|
| sfondo | | | |
| superficie | | | |
| testo principale | | | |
| testo secondario | | | |
| primary / accent | | | |
| bordo | | | |
| semantici (errore, successo…) | | | |

Scale tonali individuate (es. "grigi: #f5f5f5 → #171717, 8 gradini").

## Tipografia

- Famiglia dei titoli e del testo (dichiarata e **disegnata**: Elements → Computed → in fondo, *Rendered Fonts*).
- Dimensione, peso, interlinea e spaziatura tra lettere di h1–h6, paragrafo, testo piccolo.
- Scala: le dimensioni in ordine e i rapporti tra valori consecutivi.

## Spaziature

Padding e gap di 10–15 elementi (bottoni, card, sezioni). Unità base ipotizzata e quota di valori che la rispettano.

## Radius

Bottoni, card, input, finestre modali.

## Ombre

Livelli di profondità trovati, con l'elemento su cui compare ciascuno.

## Animazioni

Transizioni al passaggio del mouse su link e bottoni: proprietà, durata, curva.

## Breakpoint

- **Osservati:** restringi la finestra (o usa la device toolbar) e annota a che larghezza cambia il layout.
- **Dichiarati:** cerca `@media` in tutti i CSS (Ctrl+Shift+F in DevTools).

## Font

Pannello Network, filtro *Font*: nome dei file, formato, provider (`fonts.gstatic.com` = Google Fonts, `use.typekit.net` = Adobe Fonts, stesso dominio = file ospitati dal sito).

## Prove nella console

Le stesse righe, quasi uguali, diventeranno il codice di estrazione di M1. Incollale nella console di DevTools e annota cosa restituiscono.

```js
// 1. Stile calcolato dell'elemento selezionato in Elements ($0)
getComputedStyle($0).backgroundColor;

// 2. Colori di sfondo contati su tutta la pagina
const conta = new Map();
for (const el of document.querySelectorAll('*')) {
  const bg = getComputedStyle(el).backgroundColor;
  if (bg !== 'rgba(0, 0, 0, 0)') conta.set(bg, (conta.get(bg) || 0) + 1);
}
console.table([...conta].sort((a, b) => b[1] - a[1]).slice(0, 15));

// 3. Fogli di stile: quali si possono leggere?
[...document.styleSheets].map((s) => {
  try { return [s.href ?? '<style> inline', s.cssRules.length + ' regole']; }
  catch (e) { return [s.href, e.name]; } // SecurityError = foglio di un altro dominio (CORS)
});

// 4. Font registrati e stato di caricamento
[...document.fonts].map((f) => `${f.family} ${f.weight} ${f.status}`);

// 5. Valore di una variabile, risolto dal browser
getComputedStyle(document.documentElement).getPropertyValue('--primary');
```

## Casi difficili

Ogni problema incontrato, con un rimando a [casi-difficili.md](casi-difficili.md).

## Tempo impiegato

Quanto ci hai messo, fase per fase. È l'argomento principale del progetto: "a mano: due ore; con Design XRAY: venti secondi".

## Risultato atteso

Affermazioni con codice, tolleranza e fase (vedi sopra), raggruppate per sezione.

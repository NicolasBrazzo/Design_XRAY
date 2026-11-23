# Colori del testo: conteggio grezzo su 3 siti (Passo A)

## Info

- **Data:** 2026-11-21
- **Metodo:** Console di DevTools, `getComputedStyle(e).color` su `document.querySelectorAll('*')`, contato con `console.table`. Due letture per sito: **tutti** gli elementi, e **solo quelli con testo proprio** (almeno un nodo di testo non vuoto tra i figli diretti).
- **Siti:**
  1. https://frontend-production-0a46.up.railway.app/
  2. https://nasa-neo-dashboard-brz.vercel.app/
  3. https://snippify.andreasabettaprogrammatore.com/

## Dati

Elementi contati: il totale è la somma dei conteggi della tabella.

| | Sito 1 | Sito 2 | Sito 3 |
|---|---|---|---|
| Tutti gli elementi | 528 | 351 | 393 |
| Solo con testo proprio | 262 | 104 | 70 |

### Sito 1 (Railway)

| Colore | Tutti | Solo testo proprio |
|---|---|---|
| `rgb(0, 0, 0)` | 16 | 4 |
| `rgb(250, 250, 249)` | 297 | 57 |
| `rgb(161, 161, 170)` | 37 | 36 |
| `rgb(255, 255, 255)` | 23 | 23 |
| `rgb(113, 113, 122)` | 69 | 58 |
| `rgb(165, 180, 252)` | 13 | 11 |
| `rgb(16, 185, 129)` | 7 | 6 |
| `rgb(99, 102, 241)` | 1 | 1 |
| `rgb(34, 211, 238)` | 3 | 3 |
| `rgb(245, 158, 11)` | 61 | 61 |
| `rgb(199, 210, 254)` | 1 | 1 |
| `rgb(24, 24, 27)` | 0 | 1 |

### Sito 2 (NASA)

| Colore | Tutti | Solo testo proprio |
|---|---|---|
| `rgb(0, 0, 0)` | 49 | 1 |
| `lab(93.0497 -0.985801 -1.98162)` | 231 | 55 |
| `lab(51.2921 -1.29932 -2.63377)` | 60 | 38 |
| `lab(73.9802 29.8539 68.1053)` | 4 | 4 |
| `lab(32.7316 -1.28855 -2.62803)` | 7 | 6 |

### Sito 3 (Snippify)

| Colore | Tutti | Solo testo proprio |
|---|---|---|
| `rgb(0, 0, 0)` | 21 | 8 |
| `rgb(234, 234, 234)` | 144 | 21 |
| `rgb(176, 160, 164)` | 44 | 26 |
| `rgb(255, 255, 255)` | 3 | 3 |
| `rgb(0, 160, 249)` | 75 | 8 |
| `rgb(248, 248, 242)` | 86 | 0 |
| `rgb(130, 146, 162)` | 2 | 1 |
| `rgb(102, 217, 239)` | 7 | 0 |
| `rgb(230, 219, 116)` | 7 | 0 |
| `rgb(166, 226, 46)` | 1 | 0 |
| `rgb(174, 129, 255)` | 3 | 0 |
| `rgb(6, 55, 81)` | 0 | 3 |

## Cosa si osserva

1. **L'ereditarietà gonfia il colore del testo principale.** `color` è ereditato: un contenitore senza testo ha comunque il colore del genitore. Il filtro "testo proprio" dimezza o più il conteggio.
   - Sito 1: `rgb(250, 250, 249)` da 297 a 57.
   - Sito 2: `lab(93.05 ...)` da 231 a 55.
   - Sito 3: `rgb(234, 234, 234)` da 144 a 21.
2. **Il nero `rgb(0, 0, 0)` è il valore di default**, non una scelta: 49 elementi su 351 nel sito 2, ma solo 1 con testo proprio.
3. **Il formato dei colori cambia da sito a sito.** Il sito 2 restituisce tutti i colori in `lab(...)`, non in `rgb(...)`. `rgbToHex` li scarta (restituisce `null`).
4. **Il filtro "testo proprio" può perdere colori del design.** Nel sito 3 i colori `#f8f8f2`, `#66d9ef`, `#e6db74`, `#a6e22e`, `#ae81ff` (la palette Monokai, usata per evidenziare il codice) compaiono solo tra "tutti". Non è stato verificato che tipo di elementi siano. Anche `rgb(0, 160, 249)` passa da 75 a 8: probabilmente icone SVG che usano `currentColor`.
5. **La pagina cambia tra due letture.** Nel sito 1 `rgb(24, 24, 27)` compare 1 volta con testo proprio e 0 tra tutti, ma il secondo insieme contiene il primo. Lo stesso vale per `rgb(6, 55, 81)` nel sito 3. Le due letture non sono dello stesso momento (contenuto caricato dopo, hover, animazioni).
6. **Nessun colore semitrasparente (`rgba(..., 0.x)`)** compare in questi tre siti.

## Regole: cosa si conta e cosa si scarta

| # | Regola | Esempio reale |
|---|---|---|
| 1 | **Si conta solo un elemento con testo proprio:** almeno un nodo di testo non vuoto tra i figli diretti. | `rgb(250, 250, 249)`: 297 → 57 (sito 1) |
| 2 | **Elementi senza area (larghezza o altezza 0) si scartano**, come negli sfondi. `opacity` e `visibility` non si controllano (limite). | `display: none` e `width: 0` nel test sintetico |
| 3 | **Colori semitrasparenti (alfa tra 0 e 1): si scartano**, come negli sfondi. Nessun caso reale visto finora: si rivede se ne compare uno. | nessuno nei 3 siti |
| 4 | **Formato non `rgb(...)` (per esempio `lab(...)`): si scarta.** `rgbToHex` restituisce `null`. | tutti i colori del sito 2 |
| 5 | **Icone (SVG, `currentColor`) fuori.** Un colore applicato solo a elementi senza testo non entra in palette. | `rgb(0, 160, 249)`: 75 → 8 (sito 3) |

## Limiti dichiarati

- Il sito 2 produrrebbe una palette senza i suoi colori principali, perché sono in `lab(...)`. Va ripreso quando si gestiranno i formati diversi da `rgb`, con `culori` (già nello stack).
- I colori Monokai del sito 3 sono esclusi dal filtro. Non è chiaro perché: da verificare in DevTools.
- Il conteggio è per elementi, non per caratteri o area: la frequenza non è il peso visivo.
- Una pagina che carica contenuto dopo l'apertura può essere letta troppo presto.

## Domanda di verifica

> Perché `hasOwnText` va calcolato dentro `page.evaluate` e non in Node?

*Risposta dell'utente:* perché il DOM esiste solo dentro il browser.

# Portfolio
TUTTI debugger eval code:10:9
console.table() debugger eval code:10:31
(indice)	Valori
rgb(251, 251, 254)	23
rgb(237, 235, 230)	142
rgba(237, 235, 230, 0.08)	37
rgb(255, 210, 63)	71
rgb(156, 154, 148)	71
rgb(125, 123, 117)	51
rgba(0, 0, 0, 0)	1
oklab(0.940224 0.000165999 0.00702018 / 0.9)	2
rgb(11, 10, 6)	8
rgba(237, 235, 230, 0.16)	8
SOLO CON SPESSORE > 0 debugger eval code:11:9
console.table() debugger eval code:11:47
(indice)	Valori

rgba(237, 235, 230, 0.16)	8
rgba(237, 235, 230, 0.08)	7
rgb(255, 210, 63)

Array(4) [ "rgb(237, 235, 230)", "0px", "solid", "rgb(237, 235, 230)" ]

## Quindi 
- solid non conta, importa lo spessore 
- se ci sono lati diversi li contiamo come 2 colori diversi 

## Regole: cosa si conta e cosa si scarta

| # | Regola | Esempio reale |
|---|---|---|
| 1 | **Un lato conta se il suo spessore è maggiore di 0.** Lo stile non si guarda: un elemento senza bordo ha stile `solid` e spessore `0px`. | `["rgb(237, 235, 230)", "0px", "solid", ...]`: senza bordo, ma stile `solid` |
| 2 | **Un elemento senza bordo si scarta**, anche se ha un `border-color` calcolato: è `currentcolor`, cioè uguale al `color`. | `border-top-color` = `color` = `rgb(237, 235, 230)` (142 elementi) |
| 3 | **Un elemento conta una volta per ogni colore distinto dei suoi lati visibili.** Bordo uniforme (4 lati dello stesso colore) = 1. Lati con colori diversi = un conteggio per ciascun colore. | verificata con una pagina sintetica: test `sides with different colors give one count per distinct color` in `engine/test/borderColors.test.ts` |
| 4 | **Alfa 0 si scarta.** | `rgba(0, 0, 0, 0)`: 1 elemento |
| 5 | **Alfa tra 0 e 1: si scarta**, come per sfondi e testo (stessa regola per le tre proprietà). | `rgba(237, 235, 230, 0.16)` ×8, `rgba(237, 235, 230, 0.08)` ×7 |
| 6 | **Formato diverso da `rgb(...)` (per esempio `oklab`): si scarta.** `rgbToHex` restituisce `null`. | `oklab(0.94 ... / 0.9)`: 2 elementi |

## Limiti dichiarati

- **La palette dei bordi di questo sito resta quasi vuota.** Dei bordi visibili solo `rgb(255, 210, 63)` è opaco; gli altri due sono semitrasparenti e vengono scartati. È il caso reale più forte finora per riaprire la decisione sull'alfa, dopo sfondi e testo.
- Non vede `outline`, `box-shadow` e `border-image`, che spesso fanno da finti bordi.
- Non vede i pseudo-elementi.
- Frequenza, non peso visivo: un bordo lungo e uno corto contano uguale.

## Ancora da fare

- Completare i conteggi della seconda tabella (manca quello di `rgb(255, 210, 63)`) e i totali.

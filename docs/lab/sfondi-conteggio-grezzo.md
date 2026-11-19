# Sfondi: conteggio grezzo su 3 siti (Passo B)

## Info

- **Data:** 2026-11-18
- **Metodo:** Console di DevTools, `getComputedStyle(e).backgroundColor` su `document.querySelectorAll('*')`, risultati contati con `console.table`.
- **Siti:** tre, in quest'ordine: sito 1, sito 2, sito 3.

## Cosa si osserva

| | Sito 1 | Sito 2 | Sito 3 |
|---|---|---|---|
| Elementi contati | 3501 | 552 | 272 |
| `rgba(0, 0, 0, 0)` (trasparente) | 3440 (98,3%) | 519 (94,0%) | 251 (92,3%) |
| Valori distinti (trasparente incluso) | 11 | 12 | 11 |
| Valori semitrasparenti | 7 valori, 20 elementi (tutti `oklab(... / alfa)`) | 0 | 1 valore, 1 elemento (`rgba(8, 15, 29, 0.92)`) |

1. **Il valore più frequente è sempre il trasparente.** È il valore di default di ogni elemento a cui nessuno ha assegnato uno sfondo: non è una scelta di design.
2. **Dopo averlo tolto restano pochi colori:** circa 10 per sito. La palette vera sta lì.
3. **I semitrasparenti compaiono in due formati diversi:**
   - `rgba(8, 15, 29, 0.92)` (sito 3);
   - `oklab(1 0 5.96046e-8 / 0.04)` (sito 1). Chromium restituisce `oklab(...)` quando il colore è scritto in uno spazio moderno. L'alfa è l'ultimo valore, dopo la `/`.
4. **Non verificato:** gli elementi invisibili (`display: none`, larghezza o altezza 0, `<script>`, `<style>`). Lo snippet non misura la dimensione, quindi non si può dire quanto colorino il conteggio. Da controllare nel Passo D.

## Regole: cosa si conta e cosa si scarta

| # | Regola | Esempio reale |
|---|---|---|
| 1 | **Alfa 0: si scarta.** Si guarda solo l'ultimo valore, sia in `rgba(...)` sia in `oklab(... / alfa)`. | `rgba(0, 0, 0, 0)`: 3440 elementi nel sito 1 |
| 2 | **Alfa 1 (o assente): si converte in hex e si conta.** | `rgb(255, 255, 255)` → `#ffffff`, 34 elementi nel sito 1 |
| 3 | **Alfa tra 0 e 1: non si converte e non entra in palette.** È un limite dichiarato: il colore visibile dipende da cosa c'è sotto. | `rgba(8, 15, 29, 0.92)` (sito 3); `oklab(1 0 5.96046e-8 / 0.045)` (sito 1, 10 elementi) |
| 4 | **Elementi senza area (larghezza o altezza 0) o con `display: none`: si scartano.** *Da verificare su siti reali.* | da trovare nel Passo D |
| 5 | **Formato non riconosciuto:** la funzione di conversione restituisce `null`, non un errore. | un `oklab(...)` opaco, se mai comparisse |

### Decisione: niente conversione oklab → hex (per ora)

Tutti gli `oklab` visti hanno alfa minore di 1, quindi cadono nella regola 3 e non servono in palette. Servirebbe una conversione solo per un `oklab` opaco, e finora non ne è comparso nessuno. Se compare, si riapre la decisione (con `culori`, già nello stack).

## Domanda di verifica (da rispondere a mano)

> Perché il valore più frequente nel conteggio grezzo quasi mai è un colore del design?

*Risposta dell'utente:* perché la maggior parte degli elementi del sito sono testo o contenitori o qualunque altro elemento che non ha uno sfondo ma ha quello automatico che gli viene affidato, ovvero il trasparente

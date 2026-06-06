---
title: "Estrarre dati strutturati da cataloghi tecnici in PDF"
subtitle: "Il progetto pdf-to-csv: da tabelle gerarchiche a un CSV navigabile"
date: 2026-06-06 11:00:00 +0200
categories: [Progettazione, Dati]
---

Un problema ricorrente quando si lavora con componentistica: i dati buoni esistono, ma sono
intrappolati in **cataloghi PDF** fatti di tabelle gerarchiche, pensate per la stampa e non per
essere lette da una macchina. `pdf-to-csv` nasce per questo — estrarre quei dati in un CSV
rettangolare e renderli filtrabili.

Caso concreto: cataloghi di **cuffie semiasse automotive**, con tabelle multi-livello e un
dettaglio fastidioso — due colonne, **WS** (lato ruota) e **GS** (lato cambio), marcate solo da
un asterisco la cui posizione conta.

## L'idea chiave: usare il *text layer*, non l'euristica

Invece di indovinare a quale colonna appartiene un asterisco dal testo, l'estrattore legge le
**coordinate del text layer** del PDF (via PyMuPDF):

1. localizza le intestazioni `WS` e `GS` → coordinate X di riferimento;
2. per ogni riga cerca i token `*` con le loro coordinate;
3. assegna ogni asterisco alla colonna in base alla X, e alla riga in base alla Y (tolleranza ±5 pt).

Sulla pagina di test: **58/58 asterischi** assegnati correttamente. Molto più robusto del parsing
del testo "a occhio".

## Un limite onesto

Non tutto è recuperabile: WS e GS sono **posizioni fisiche indipendenti** con gamme dimensionali
sovrapposte, e la relazione tra le righe è N:M. Conclusione: **non si può inferire** il parametro
mancante dai soli dati dimensionali del catalogo. A volte il risultato di un'analisi è capire cosa
*non* si può dedurre — ed è giusto scriverlo.

## Provalo

L'esploratore gira **interamente nel browser** (Streamlit compilato in WebAssembly), su un campione
di dati:

- **Demo live:** <https://carlobragetti.github.io/pdf-to-csv/>
- **Codice:** <https://github.com/CarloBragetti/pdf-to-csv>

Nei prossimi post entrerò più nel dettaglio della pipeline e di come ho ripulito il progetto per
pubblicarlo.

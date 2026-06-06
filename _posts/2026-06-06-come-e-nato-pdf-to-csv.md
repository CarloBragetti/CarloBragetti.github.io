---
title: "Com'è nato pdf-to-csv: una cuffia del semiasse e un catalogo PDF impossibile"
subtitle: "Dalla Mini Cooper S R53 del 2006 a uno strumento per cercare ricambi per dimensione"
date: 2026-06-06 14:00:00 +0200
categories: [Meccanica, Dati]
---

Quasi tutti i miei progetti software nascono da un problema fisico, con le mani sporche di grasso.
Questo non fa eccezione.

## Il problema: una cuffia strappata

Ho una **Mini Cooper S del 2006** — la prima serie, la **R53**, quella col compressore volumetrico.
È un'auto su cui metto regolarmente mano (mezzo box è pieno di pezzi che le ho stampato in 3D), quindi
quando ho trovato una **cuffia del semiasse** (il soffietto in gomma che protegge il giunto omocinetico)
**strappata**, la domanda non era "la porto dal meccanico?" ma "qual è il pezzo giusto da ordinare?".

Una cuffia rotta è una di quelle cose che sembrano banali ma non lo sono: appena si lacera, il grasso
schizza via e sporco e acqua entrano nel giunto. Da lì, il giunto omocinetico si rovina in fretta — e a
quel punto non sostituisci più una cuffia da pochi euro, ma il semiasse. Meglio prenderla in tempo.

## Perché trovare il pezzo era il vero problema

Le cuffie aftermarket "universali" non si scelgono per modello di auto, ma per **geometria**:

- **Ø1** — diametro piccolo (lato albero),
- **Ø2** — diametro grande (lato giunto),
- **L** — lunghezza,
- e soprattutto il **lato**: *wheel side* (lato ruota) o *gear side* (lato cambio/differenziale),
  che hanno forme e misure diverse.

Il fornitore questi dati ce li ha — ma dentro un **catalogo PDF** di 9 file, fatto di **tabelle
gerarchiche multi-livello** pensate per essere stampate, non interrogate. Provare a rispondere a
"dammi tutte le cuffie *lato ruota* con Ø1 ~22 mm, Ø2 ~80 mm e L ~110 mm" sfogliando un PDF è esattamente
il tipo di lavoro che un computer dovrebbe fare al posto mio.

## L'idea: trasformare il PDF in dati filtrabili

Da lì è nato **pdf-to-csv**: estrarre quel catalogo in un **CSV rettangolare** e poi filtrarlo per
**intervalli di dimensione**. In pratica, trasformare un catalogo insfogliabile in una lista di candidati.
Le due parti — *generare* bene il CSV e *filtrarlo* bene — hanno richiesto un paio di trucchi non ovvi.

## La procedura: dal PDF al CSV (senza colonne sballate)

Il primo tentativo "naive" (split per riga + tieni le righe con ≥15 token) falliva di brutto: perdeva
~40% delle righe, spezzava quelle lunghe e mescolava metadati e dati, **sfasando le colonne di 2-3
posizioni**. Le query restituivano 0 risultati.

Il problema vero è la **struttura del PDF**: tabelle **gerarchiche multi-livello** pensate per la stampa.
Smontandolo pagina per pagina è saltato fuori che:

- le prime pagine sono indice/intro, i **dati veri** iniziano più avanti;
- marca / modello / motorizzazione stanno **su righe separate** (a volte un solo token: `ABARTH`, poi `500`);
- alcune righe logiche **continuano sulla riga fisica successiva** (quando `REMARK` è lungo) e in quella
  continuazione **manca l'anno**;
- a volte persino l'header è concatenato (`YEARTRANSM.`).

La procedura che funziona si regge su due **àncore**.

**1) Anchor pattern sull'anno.** Il campo YEAR ha una forma riconoscibile che compare **solo** nelle righe
dati, mai nei metadati:

```text
\d{4}\.\d{2}[-\d.]*      # es. 2008.08-   oppure   2007.07-2010.06
```

Questo separa righe-dati da metadati in modo **deterministico** (>99% di affidabilità).

**2) Coda di colonne invariante.** Le ultime colonne (`Standard, Basic, Ø1, Ø2, L, MATL`) sono **sempre**
in fondo a una riga logica: è il confine che permette di ricucire le righe spezzate.

A quel punto l'algoritmo è lineare:

```text
1. CLASSIFICA la riga
   • YEAR presente + molti token   → riga DATI
   • niente YEAR + pochi token     → METADATO (marca/modello) → da EREDITARE
2. PARSIFICA le colonne della riga dati
   • YEAR via regex · TRANSM./FR/LR via pattern · numeri (Ø, L) come float
   • MATL come codice materiale · eredita Record_Class dalla gerarchia
3. ACCUMULA → DataFrame → CSV   (salvataggio progressivo dopo ogni PDF)
```

Il pezzo più delicato sono **gli asterischi WS/GS** (lato ruota / lato cambio): il lato è marcato solo da
un `*`, e conta **dove** sta. Invece di indovinarlo dal testo, lo leggo dalle **coordinate del text layer**
del PDF (PyMuPDF): trovo le X delle intestazioni `WS`/`GS`, poi assegno ogni `*` alla colonna per **X** e
alla riga per **Y** (tolleranza ±5 pt). Validato **58/58** sulla pagina di test.

Risultato: un CSV rettangolare e pulito (20 colonne), con Ø1, Ø2 e L normalizzati come intervallo
`min|max` (tenendo anche il token grezzo originale, per sicurezza).

## I trick per il filtraggio

Avere il CSV è metà dell'opera; cercarci dentro "per misura" richiede qualche accortezza.

**Range come `min|max`.** Ogni dimensione è un intervallo, non un numero secco. Il parser normalizza anche
i casi sporchi: valore singolo → `v|v`, intervallo invertito → riordinato.

**Overlap matching, non uguaglianza.** Una cuffia data come `[22, 25]` deve comparire se cerco `[23, 24]`.
La regola è il classico test di sovrapposizione tra intervalli:

```text
match  ⇔  min_dato ≤ max_query   AND   min_query ≤ max_dato
```

Così ottengo tutti i candidati *compatibili*, non solo quelli identici.

**Dato mancante = nessun vincolo.** Se una riga ha una dimensione illeggibile o assente, **non** la escludo
dal filtro su quella dimensione: altrimenti perderei candidati validi per colpa di un buco nei dati.

**Slider che "scattano" ai valori reali.** I cursori di Ø e L fanno *snap* ai valori effettivamente presenti
nel dataset — niente soglie fantasma che non corrispondono a nessun articolo.

**Filtri WS/GS espliciti.** Posso isolare "solo lato ruota" o "solo lato cambio": è proprio il lato che fa
la differenza nella scelta del pezzo.

**Il limite onesto.** WS e GS sono posizioni fisiche **indipendenti**, con gamme dimensionali sovrapposte:
**non si può dedurre** il lato dai soli numeri. A volte il risultato di un'analisi è capire cosa *non* è
deducibile — e scriverlo.

> Il dettaglio implementativo dell'estrazione l'ho ripreso anche qui:
> [Estrarre dati strutturati da cataloghi tecnici in PDF](/blog/2026/06/pdf-to-csv-estrazione-cataloghi/).

## Il risultato

Da un PDF impossibile da cercare sono arrivato a una **tabella filtrabile** in cui restringere i
candidati per misura e per lato in pochi secondi — esattamente quello che mi serviva per scegliere la
cuffia. Lo strumento è pubblico e gira **nel browser** su un campione di dati:

- **Demo live:** <https://carlobragetti.github.io/pdf-to-csv/>
- **Codice:** <https://github.com/CarloBragetti/pdf-to-csv>
- **Scheda progetto:** [pdf-to-csv](/projects/pdf-to-csv/)

## La morale

È il pattern che mi piace di più: un problema piccolo e concreto (una cuffia da 10 €) che diventa la
scusa per costruire uno strumento riutilizzabile. La Mini, tra l'altro, è una fonte inesauribile di
progetti del genere — ne arriveranno altri. 🔧

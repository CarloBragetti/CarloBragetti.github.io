---
title: "Da una foto di catalogo a un solido CAD pronto per CNC e stampa 3D"
subtitle: "Cronaca di una pipeline: AI generativa, reverse engineering parametrico in Fusion e una spec che rimette le misure al loro posto"
date: 2026-07-08 18:00:00 +0200
categories: [Progettazione, CAD, AI]
lang: it
translation_url: /en/blog/2026/07/from-catalog-photo-to-cad-solid/
---

Tutto parte da una domanda semplice: **se di un componente meccanico ho solo le foto del catalogo, quanto
posso avvicinarmi a un solido CAD vero — forabile, fresabile, stampabile?** Non una mesh "da render": un
**BRep parametrico watertight**, con i fori che sono *fori* e gli spessori che sono *quote*.

Questo articolo è la cronaca onesta del tentativo, su **un solo soggetto**: un kit anti-torsione motorsport
con due flange di fissaggio specchiate. Lo dico subito, da bravo meccanico: **questo è l'incipit di uno studio,
non un benchmark**. Un pezzo, un catalogo, una coppia di ricostruzioni. Per dire qualcosa di rigoroso servirà
un dataset più ampio e metriche di valutazione allineate alle best practice metrologiche (distribuzioni
d'errore dimensionale contro il pezzo fisico, tolleranze in stile GD&T, precision/recall delle feature). Però
quello che è successo lungo la strada merita di essere raccontato — perché le lezioni sono già solide.

## Atto I — Il soggetto, e una regola di ingaggio

La materia prima: foto di catalogo del kit, migliorate e date in pasto a un generatore image-to-3D. Ne esce
una **mesh AI**: riconoscibile, suggestiva… e piena di bugie. Per lavorarci ho guidato **Autodesk Fusion
interamente via script** (un server MCP locale che espone l'API Python di Fusion), con una regola ferrea:
**il documento sorgente non si salva mai** — tutto avviene in-memory, su disco escono solo STEP e STL.

{% include figure.html src="/assets/img/image-to-cad/01_mesh_original_iso.png" alt="La mesh AI originale delle due flange" cap="Il punto di partenza: la mesh generata dall'AI. Bella da lontano; da vicino, una zuppa di poligoni." %}

## Atto II — Reverse engineering: misurare la mesh, non fidarsi della mesh

I convertitori automatici mesh→solido falliscono su geometria così (o restituiscono 101 frammenti). La strada
buona è stata **misurare la mesh con algoritmi scritti ad hoc** — saldatura dei vertici, separazione dei
gusci, estrazione dell'outline dal fondo, fit ai minimi quadrati di cerchi per bore e fori, istogrammi dei
piani dominanti per gli spessori — e **ricostruire il pezzo come l'avrebbe disegnato un progettista**: sketch,
estrusioni, tagli, lamature.

{% include figure.html src="/assets/img/image-to-cad/03_overlay_recon_vs_mesh.png" alt="Overlay ricostruzione vs mesh" cap="Il solido ricostruito sovrapposto alla mesh: l'outline segue la mesh entro lo 0,3%." %}

La parte istruttiva è arrivata con la **seconda flangia**: sembrava una copia della prima, e invece nascondeva
una struttura a due livelli (binari rialzati su una base ribassata) e **due fori mai forati fino in fondo**.
L'ha scoperto la verifica automatica — rieseguita su ogni pezzo, sempre: *il modello è onesto quanto i
controlli che gli fai passare*.

{% include figure.html src="/assets/img/image-to-cad/B07_overlay_top.png" alt="Flangia B vs mesh" cap="Flangia B: base + binari, ricostruita con un blocco pieno e un recess booleano." %}

Tutto il procedimento è poi confluito in **uno script batch config-driven**: da una mesh nuova rilegge le
misure (auto-detect), ricostruisce i solidi, esegue la QA dei dettagli (inclusi i gradini interni dei fori,
oggi verificati anche con il **ray-casting** della nuova API di Fusion) ed esporta. Accanto allo script, una
**spec del pezzo** in JSON: spessori, conteggio fori, diametri nominali, viti — la *verità dimensionale*
contro cui tutto si valida.

{% include figure.html src="/assets/img/image-to-cad/10_pair_solids_iso.png" alt="Le due flange ricostruite" cap="Le due flange ricostruite: watertight, parametriche, esportate in STEP." %}

## Atto III — E se togliessimo il servizio a pagamento?

La mesh di partenza veniva da un servizio commerciale. Domanda da ingegneri: **si può rifare tutto con
strumenti open o gratuiti?** Ne è nato un banco di prova che è arrivato a **18 esperimenti** documentati, con
una metrica brutale quanto efficace — la *thinness* (spessore/larghezza: una flangia vera fa ~0,12–0,15; una
"lastra allucinata" fa 0,06).

Le scoperte, in ordine di importanza:

1. **La profondità arriva dalle viste, non dal modello.** Una sola foto frontale produce una lastra piatta
   con *qualunque* generatore — incluso il servizio a pagamento (la sua stessa mesh grezza misura 0,052!).
   Due viste da angoli diversi, date a un modello multi-view aperto, recuperano lo spessore vero.
2. **I fori arrivano dalla vista giusta.** Per mesi di esperimenti (ok, giorni — ma intensi) nessun motore
   forava davvero: l'ambiguità incavo/rilievo è un classico della shape-from-shading. La svolta è stata
   banale e bellissima: usare la **vista dall'alto del catalogo, dove i fori sono "a giorno"** — si vede lo
   sfondo attraverso. Con quell'input, il miglior generatore hosted sul mercato (provato tramite la sua demo
   pubblica ufficiale) ha finalmente **forato il pezzo: 6 fori passanti su 6**, verificati con una griglia di
   raggi 80×80.
3. **A volte la computer vision classica batte l'AI.** Un piccolo motore senza reti neurali — silhouette
   OpenCV → curva → estrusione in Blender allo spessore di spec — produce in **secondi** un solido watertight
   con l'outline *misurato* dall'immagine invece che sognato da un modello. Per pezzi piatti è imbattibile.
4. **La scala si àncora alla spec.** Le mesh AI vivono in coordinate normalizzate; la spec nomina il foro
   centrale come riferimento di scala, e una calibrazione in due passate (stima grossolana → fit di cerchio
   sulla mesh saldata) inchioda tutto al diametro reale.

## Atto IV — La resa dei conti

Mettendo insieme i pezzi migliori — *prior con i fori veri* (vista dall'alto) + *scala ancorata al bore* +
*snapping dei diametri ai nominali di spec* + *ricostruzione parametrica* — il run finale si confronta così
con la ricostruzione di riferimento (quella dalla mesh del servizio a pagamento):

| Metrica | Pipeline aperta | Riferimento |
|---|---|---|
| Solido | watertight, 61 facce | watertight, 62 facce |
| Volume | 182 243 mm³ (**−5,5%**) | 192 823 mm³ |
| Distanze bore→fori (mm) | 62,6 · 68,4 · 73,8 · 74,1 · 78,3 | 62,3 · 68,1 · 72,5 · 77,6 · 78,3 |
| RMS del pattern fori | **1,7 mm** | — |
| Fori passanti (verifica a raggi) | 6/6 | 6/6 |

{% include figure.html src="/assets/img/image-to-cad/D01_composed_overlay_iso.png" alt="Il solido finale sopra la mesh AI" cap="Il run finale: solido parametrico (grigio) sopra il suo prior AI (viola)." %}

{% include figure.html src="/assets/img/image-to-cad/D02_composed_solid_top.png" alt="Vista dall'alto del solido finale" cap="Bore, tre fori da 11 con lamatura, i due piccoli da 5 e 2,5: tutti veri, tutti passanti." %}

Il gap residuo è la sola **silhouette** (−5,5% di volume): l'outline dell'AI contro quello del catalogo. Ed è
esattamente ciò che il motore di tracing "classico" sa già misurare — la fusione dei due è il prossimo passo.

## Cosa resta in mano (le cinque righe che porterei via)

1. **Le viste battono i modelli**: profondità da un secondo angolo, fori dalla vista in cui sono a giorno.
2. **Le mesh AI sono prior di forma, non misure** — vanno trattate come silhouette con suggerimenti di topologia.
3. **La spec è la verità dimensionale**: scala dal riferimento, spessori e nominali dalla tabella. L'AI propone, la spec dispone.
4. **La CV classica vince dove si applica**: tracciare ed estrudere, senza reti, ha dato l'outline più fedele del banco.
5. **Vince la composizione**, non il modello più grosso.

## Dove va a finire

Lo studio serio è davanti: più pezzi, più stili di catalogo, metriche metrologiche vere. Ma la conclusione
pratica è già utilizzabile oggi: **questo procedimento accelera enormemente la prototipazione**. In poche ore,
da foto di catalogo si arriva a una base parametrica pulita — non il pezzo finito, ma un punto di partenza
**facilmente manipolabile e migliorabile** con Autodesk Fusion e strumenti simili: ogni foro, raccordo e
profilo del risultato è una feature vera, modificabile come se l'avessi disegnata a mano.

E per chi se lo stesse chiedendo: sì, anche tutta l'orchestrazione — Fusion compreso — è andata via script.
Ma questa è un'altra storia (e sarà un altro post).

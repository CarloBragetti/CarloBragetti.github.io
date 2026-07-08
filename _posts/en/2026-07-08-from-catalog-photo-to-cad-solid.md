---
title: "From a catalog photo to a CNC- and 3D-print-ready CAD solid"
subtitle: "Chronicle of a pipeline: generative AI, parametric reverse engineering in Fusion, and a spec that puts the dimensions back in their place"
date: 2026-07-08 18:00:00 +0200
categories: [Design, CAD, AI]
lang: en
permalink: /en/blog/2026/07/from-catalog-photo-to-cad-solid/
translation_url: /blog/2026/07/da-foto-di-catalogo-a-solido-cad/
---

It all starts from a simple question: **if all I have of a mechanical component are its catalog
photos, how close can I get to a real CAD solid — drillable, millable, printable?** Not a mesh
"for renders": a **watertight parametric BRep**, where holes are *holes* and thicknesses are
*dimensions*.

This article is the honest chronicle of the attempt, on **a single subject**: a motorsport
anti-torsion kit with two mirrored mounting flanges. Let me say it upfront, like a good mechanic:
**this is the opening of a study, not a benchmark**. One part, one catalog, one pair of
reconstructions. Saying anything rigorous will take a larger dataset and evaluation metrics aligned
with metrology best practices (dimensional-error distributions against the physical part,
GD&T-style tolerances, feature precision/recall). But what happened along the way deserves telling —
because the lessons are already solid.

## Act I — The subject, and a rule of engagement

The raw material: catalog photos of the kit, enhanced and fed to an image-to-3D generator. Out
comes an **AI mesh**: recognizable, suggestive… and full of lies. To work on it I drove **Autodesk
Fusion entirely through scripts** (a local MCP server exposing Fusion's Python API), with one iron
rule: **the source document never gets saved** — everything happens in-memory, and only STEP and
STL files are written to disk.

{% include figure.html src="/assets/img/image-to-cad/01_mesh_original_iso.png" alt="The original AI mesh of the two flanges" cap="The starting point: the AI-generated mesh. Pretty from afar; up close, polygon soup." %}

## Act II — Reverse engineering: measure the mesh, don't trust the mesh

Automatic mesh→solid converters fail on geometry like this (or return 101 fragments). The path that
worked was **measuring the mesh with purpose-written algorithms** — vertex welding, shell
separation, outline extraction from the bottom face, least-squares circle fits for bore and holes,
dominant-plane histograms for thicknesses — and **rebuilding the part the way a designer would have
drawn it**: sketches, extrusions, cuts, counterbores.

{% include figure.html src="/assets/img/image-to-cad/03_overlay_recon_vs_mesh.png" alt="Overlay of reconstruction vs mesh" cap="The reconstructed solid overlaid on the mesh: the outline follows the mesh within 0.3%." %}

The instructive part came with the **second flange**: it looked like a copy of the first, but hid a
two-level structure (raised rails on a recessed base) and **two holes that had never been drilled
through**. The automated verification caught it — re-run on every part, always: *the model is only
as honest as the checks you run against the mesh*.

{% include figure.html src="/assets/img/image-to-cad/B07_overlay_top.png" alt="Flange B vs the mesh" cap="Flange B: base + rails, rebuilt as a full block plus a boolean recess." %}

The whole procedure then became **a config-driven batch script**: from a new mesh it re-reads the
measurements (auto-detect), rebuilds the solids, runs a detail QA pass (including the internal hole
steps, now verified by **ray-casting** through Fusion's new API) and exports. Next to the script, a
**part spec** in JSON: thicknesses, hole count, nominal diameters, screws — the *dimensional truth*
everything validates against.

{% include figure.html src="/assets/img/image-to-cad/10_pair_solids_iso.png" alt="The two reconstructed flanges" cap="The two reconstructed flanges: watertight, parametric, exported to STEP." %}

## Act III — What if we removed the paid service?

The original mesh came from a commercial service. The engineer's question: **can the whole thing be
redone with open or free tools?** That spawned a test bench that grew to **18 documented
experiments**, with a metric as brutal as it is effective — *thinness* (thickness/width: a real
flange sits at ~0.12–0.15; a "hallucinated slab" at 0.06).

The findings, in order of importance:

1. **Depth comes from the views, not from the model.** A single frontal photo produces a flat slab
   with *any* generator — including the paid service (its own raw mesh measures 0.052!). Two views
   from different angles, fed to an open multi-view model, recover the true thickness.
2. **Holes come from the right view.** For ages (okay, days — but intense ones) no engine actually
   drilled anything: the concave/convex ambiguity is a classic of shape-from-shading. The
   breakthrough was banal and beautiful: use the **top-down catalog view, where the holes are
   see-through** — you can see the background through them. With that input, the strongest hosted
   generator on the market (tried through its official public demo) finally **drilled the part:
   6 through-holes out of 6**, verified with an 80×80 ray grid.
3. **Sometimes classic computer vision beats the AI.** A small engine with no neural networks —
   OpenCV silhouette → curve → Blender extrusion at the spec thickness — produces a watertight
   solid in **seconds**, with an outline *measured* from the image rather than dreamed by a model.
   For flat parts it's unbeatable.
4. **Scale gets anchored to the spec.** AI meshes live in normalized coordinates; the spec names
   the central bore as its scale reference, and a two-pass calibration (coarse estimate → circle
   fit on the welded mesh) pins everything to the real diameter.

## Act IV — The reckoning

Putting the best pieces together — *hole-true prior* (top-down view) + *bore-anchored scale* +
*diameter snapping to spec nominals* + *parametric rebuild* — the final run compares to the
reference reconstruction (the one from the paid service's mesh) like this:

| Metric | Open pipeline | Reference |
|---|---|---|
| Solid | watertight, 61 faces | watertight, 62 faces |
| Volume | 182,243 mm³ (**−5.5%**) | 192,823 mm³ |
| Bore→hole distances (mm) | 62.6 · 68.4 · 73.8 · 74.1 · 78.3 | 62.3 · 68.1 · 72.5 · 77.6 · 78.3 |
| Hole-pattern RMS | **1.7 mm** | — |
| Through-holes (ray-verified) | 6/6 | 6/6 |

{% include figure.html src="/assets/img/image-to-cad/D01_composed_overlay_iso.png" alt="The final solid over the AI mesh" cap="The final run: parametric solid (grey) over its AI prior (purple)." %}

{% include figure.html src="/assets/img/image-to-cad/D02_composed_solid_top.png" alt="Top view of the final solid" cap="Bore, three Ø11 counterbored holes, the two small Ø5 and Ø2.5: all real, all through." %}

The residual gap is the **silhouette** alone (−5.5% volume): the AI's outline versus the
catalog's. And that's exactly what the "classic" tracing engine already knows how to measure —
fusing the two is the next step.

## What I'm keeping (the five lines I'd take away)

1. **Views beat models**: depth from a second angle, holes from the view where they're see-through.
2. **AI meshes are shape priors, not measurements** — treat them as silhouettes with topology hints.
3. **The spec is the dimensional truth**: scale from the reference feature, thicknesses and nominals from the table. AI proposes, the spec disposes.
4. **Classic CV wins where it applies**: tracing and extruding, no neural networks, gave the most faithful outline of the bench.
5. **Composition wins**, not the bigger model.

## Where this goes

The serious study lies ahead: more parts, more catalog styles, real metrology metrics. But the
practical conclusion is already usable today: **this procedure massively accelerates prototyping**.
In a few hours, catalog photos become a clean parametric base — not the finished part, but a
starting point that is **easy to manipulate and improve** with Autodesk Fusion and similar tools:
every hole, fillet and profile in the result is a real feature, editable as if you had drawn it
by hand.

And for those wondering: yes, the whole orchestration — Fusion included — ran through scripts.
But that's another story (and it will be another post).

---
title: "pdf-to-csv"
subtitle: "Estrattore di dati da cataloghi tecnici PDF + esploratore web"
status: "pubblicato"
tech: [Python, PyMuPDF, Streamlit, stlite]
repo: "https://github.com/CarloBragetti/pdf-to-csv"
demo: "https://carlobragetti.github.io/pdf-to-csv/"
---

Pipeline che trasforma cataloghi PDF con tabelle gerarchiche multi-livello in un **CSV rettangolare**
(20 colonne), più una **web app** per il filtraggio interattivo *range-aware* (un record `[22, 25]`
matcha una query `[23, 24]`).

## Punti salienti

- **Estrazione WS/GS dal text layer** del PDF (coordinate X/Y via PyMuPDF), non parsing euristico -
  validato 58/58 asterischi sulla pagina di test.
- **Esploratore** con filtri per anno, tipo, materiale, e slider con *overlap matching* e snapping.
- **Demo nel browser** senza server: la web app è servita su GitHub Pages tramite
  [stlite](https://github.com/whitphx/stlite) (Streamlit in WebAssembly), su un campione di dati.

## Stack

Python 3.13 · PyMuPDF (`fitz`) · pandas · Streamlit · stlite per l'hosting statico.

→ **[Codice]({{ page.repo }})** · **[Demo live]({{ page.demo }})**

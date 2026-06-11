---
title: "pdf-to-csv"
subtitle: "Data extractor for technical PDF catalogs + web explorer"
status: "published"
tech: [Python, PyMuPDF, Streamlit, stlite]
repo: "https://github.com/CarloBragetti/pdf-to-csv"
demo: "https://carlobragetti.github.io/pdf-to-csv/"
lang: en
permalink: /en/projects/pdf-to-csv/
translation_url: /projects/pdf-to-csv/
---

A pipeline that turns PDF catalogs with multi-level hierarchical tables into a **rectangular CSV**
(20 columns), plus a **web app** for interactive *range-aware* filtering (a `[22, 25]` record
matches a `[23, 24]` query).

## Highlights

- **WS/GS extraction from the PDF text layer** (X/Y coordinates via PyMuPDF), not heuristic parsing -
  validated 58/58 asterisks on the test page.
- **Explorer** with filters for year, type, material, and sliders with *overlap matching* and snapping.
- **In-browser demo** with no server: the web app is served on GitHub Pages through
  [stlite](https://github.com/whitphx/stlite) (Streamlit in WebAssembly), on a data sample.

## Stack

Python 3.13 · PyMuPDF (`fitz`) · pandas · Streamlit · stlite for static hosting.

→ **[Code]({{ page.repo }})** · **[Live demo]({{ page.demo }})**

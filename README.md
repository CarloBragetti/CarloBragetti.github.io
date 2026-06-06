# CarloBragetti.github.io — personal engineering blog

Personal site/blog of Carlo Bragetti — **meccanica · motori · progettazione · schemi elettrici ·
prototipi 3D**. Built with **Jekyll 4** (custom "Officina dark" theme, no external theme gem),
deployed to GitHub Pages via GitHub Actions. Live at **https://carlobragetti.github.io/**.

## Write a new post
Create `_posts/YYYY-MM-DD-titolo.md`:
```markdown
---
title: "Titolo"
subtitle: "Sottotitolo opzionale"
date: 2026-06-10 10:00:00 +0200
categories: [Meccanica, Motori]   # used as chips; see _config.yml "domains"
---
Contenuto in **Markdown**.
```

## Add a project
Create `_projects/nome.md` with front matter `title, subtitle, status, tech: [...], repo, demo`.

## Local preview (optional, needs Ruby)
```bash
bundle install
bundle exec jekyll serve   # http://localhost:4000
```
> Ruby isn't required to publish — pushing to `main` triggers the Actions build & deploy.

## Structure
```
_config.yml          site config, nav, domains, projects collection
_layouts/            default, post, page, project
_includes/           head, header, footer
_posts/              blog posts (Markdown)
_projects/           project cards (collection)
assets/css/main.css  Officina dark theme (+ light mode)
assets/js/main.js    theme toggle + animated gears canvas
index.html · blog.html · projects.html · about.md · 404.html
.github/workflows/jekyll.yml   build + deploy to Pages
```

Theme: dark-first graphite + amber, blueprint grid, glassmorphism navbar, animated gears
(respects `prefers-reduced-motion`), light "drafting paper" mode toggle.

# Writing and projects

Nikhil Baddam's dependency-free static website at https://nikhilbaddam.com/.
The homepage has a Writing / Projects slider. Existing essay URLs are preserved.

## Preview

Serve this directory with any static web server, for example:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/`. The dashboard needs HTTP to load its local JSON.
There is no package installation or build step.

## Edit

- `index.html`: writing and project tiles.
- `collection.js`: accessible tab selection, keyboard navigation, and hash links.
- `styles.css`: responsive collection and essay typography.
- `what-we-lose-in-the-pursuit-of-insight.html`: essay text and links.
- `assets/`: writing and project thumbnails.
- `projects/midterm-sentiment/`: standalone dashboard and saved weekly aggregates.

The Projects collection is linked directly at `/#projects`. The previous
`projects.html` URL redirects there. Writing and adventures redirects still work.

## Midterm Sentiment Analysis

The project tile opens `/projects/midterm-sentiment/`. It includes state/week
selection, sentiment charts, sample sizes, and the Jev methodology walkthrough.
The current public dataset is a static snapshot for August 10–October 18, 2026:
six states, twelve candidates, ten weeks, and 120 candidate/week observations.
Partial coverage remains marked on the dashboard.

`weekly-results.json` contains aggregate counts only. The website has no API keys,
database, raw X post text, post IDs, author IDs, or paid API requests. It does not
automatically fetch new posts or synchronize future local collections.

The source project is maintained separately as Midterm Sentiment Analysis. To refresh the
published frontend and aggregate snapshot, run this from its local checkout:

```sh
.venv/bin/python -m snapshot.export_site ../personal-site/projects/midterm-sentiment
```

The exporter writes an explicit six-file bundle from saved results. Review and
commit those generated files in this repository, then push `main` to deploy.
Do not copy the source project's `data/`, `.env`, raw archives, or local reports.

## Deploy on Netlify

This site uses Netlify with the repository root as its publish directory and an
empty build command, configured in `netlify.toml`. The production branch is
`main`; the existing GitHub integration deploys pushes automatically. Keep the
custom domain `nikhilbaddam.com` attached to this same Netlify site.

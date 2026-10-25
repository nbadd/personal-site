# Writing and projects

Nikhil Baddam's static website at https://nikhilbaddam.com/.
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

## FedAwards

The FedAwards tile opens `/projects/fedawards/`. This is the complete app hosted
on the personal website, adapted from `nbadd/fedawards` commit
`cdb6a03f9f66f069d72066af8c76f6ff97ec46c0`. It is a single static HTML file,
with no dependence on the `fedawards.io` domain.

Recipient searches and award-detail enrichment call the public USASpending.gov
API directly from the browser. Chart.js 4.4.0 and its data-label plugin 2.2.0 load
from jsDelivr. There is no separate application server, API key, or database.
The list can be filtered and sorted; annual/quarterly charts prorate contract
values over their periods of performance, and CSV exports reflect the filter.
These charts are not a record of actual cash payments by date.

The former `?q=recipient` search links also work on the new project path. Large
recipient searches can take time: the existing app retrieves all search pages
and then requests details for each returned award. API requests time out
after 30 seconds. Search failures show an error rather than an empty result;
failed detail lookups retain search values with a visible count warning.

Keep `fedawards.io` online during testing. Do not detach its domain, disable its
deployment, delete its repository, or cancel its registration until the owner
has tested and approved the replacement. Test search, details, filters, sorting,
annual/quarterly charts, CSV export, query links, and navigation on the personal
domain before retiring the old site. No domain/DNS settings were changed for
this integration. The personal-site copy is maintained in this repository.

## Chronos

The Chronos tile opens `/projects/chronos/`, a browser build of the separately
maintained `nbadd/chronos-history` app. It includes year search, BC/AD selection,
random discovery, event cards, and saved AI Origins timelines. Some events have
no saved precursor timeline and display that explicitly. Its historical
dataset currently contains 497 events through 2024. The web build has no API key
and makes no paid requests when a visitor explores events.

The native app's `master` branch is unchanged; web source lives on the separate
`codex/chronos-web` branch in the private Chronos repository. This public
repository contains only the exported browser assets. To update it, run this
from the Chronos checkout with its dependencies installed:

```sh
node scripts/export-web.mjs --dest /absolute/path/to/personal-site/projects/chronos
```

The exporter requires saved Origins for every event, disables environment-file
loading and client variable inlining, checks the output, and copies an explicit
asset bundle. Review and commit the output here, then push `main` to deploy.
Do not copy `.env`, source files, local generation ledgers, or native build files.

## Deploy on Netlify

This site uses Netlify with the repository root as its publish directory and an
empty build command, configured in `netlify.toml`. The production branch is
`main`; the existing GitHub integration deploys pushes automatically. Keep the
custom domain `nikhilbaddam.com` attached to this same Netlify site.

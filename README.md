# Nikhil Baddam — personal site

A dependency-free, static personal site. It can be hosted on Vercel, Netlify, GitHub Pages, Cloudflare Pages, or any plain web server.

## Preview locally

From this folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Personalize first

Edit `site.js` and fill in:

- `email`
- `linkedin`
- `x`
- `github`

Then edit the page copy directly in:

- `index.html`
- `writing.html`
- `projects.html`
- `adventures.html`

## Deploy on Vercel

1. Create a GitHub repository and push this folder.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Framework preset: **Other**. There is no build command and no output directory required for a static project.
4. Deploy.
5. Add a custom domain in **Project Settings → Domains** if you want one.

Every later push to the main branch will redeploy automatically.

## Good next changes

- Replace placeholder profile links in `site.js`.
- Add a real CV PDF and link it from the homepage.
- Add personal photos/artifacts to the timeline.
- Turn draft writing rows into real article pages.
- Replace placeholder project cards with project detail pages.
- Add lightweight analytics only if you actually want it.

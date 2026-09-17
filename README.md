# Writings

A clean, dependency-free static site with a single Writings tab and the essay
“What we lose in the pursuit of insight.”

## Preview

Open `index.html` directly in a browser, or serve this directory with any static web server.

## Edit

- `index.html`: article thumbnail grid and navigation.
- `what-we-lose-in-the-pursuit-of-insight.html`: full essay text and links.
- `styles.css`: responsive layout and typography.
- `assets/mountain-landscape.png`: thumbnail and faded article background.

To add an article, create its HTML page and add a linked image-and-title card
to the article grid in `index.html`.

The previous writing, projects, and adventures URLs redirect to the homepage.
No JavaScript or build step is required.

## Deploy on Netlify

Import the GitHub repository `nbadd/personal-site` into Netlify and select
`main` as the production branch. The `netlify.toml` file sets the publish
directory to the repository root. Leave the build command empty.

After connecting the repository, pushes to `main` deploy automatically.
A custom domain can be added in the Netlify project’s domain settings.

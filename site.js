const PROFILE = {
  email: "",
  linkedin: "",
  x: "",
  github: "https://github.com/nbadd"
};

const NAV = [
  ["about", "About", "index.html"],
  ["writing", "Writing", "writing.html"],
  ["projects", "Projects", "projects.html"],
  ["adventures", "Adventures", "adventures.html"]
];

function renderHeader(active = "about") {
  const mount = document.querySelector("[data-site-header]");
  if (!mount) return;

  mount.innerHTML = `
    <header class="site-header">
      <a class="wordmark" href="index.html" aria-label="Nikhil Baddam home">Nikhil Baddam</a>
      <nav class="site-nav" aria-label="Primary navigation">
        ${NAV.map(([key, label, href]) =>
          `<a href="${href}"${key === active ? ' aria-current="page"' : ""}>${label}</a>`
        ).join("")}
      </nav>
    </header>`;
}

function renderFooter() {
  const mount = document.querySelector("[data-site-footer]");
  if (!mount) return;
  mount.innerHTML = `
    <footer class="site-footer">
      <span>© ${new Date().getFullYear()} Nikhil Baddam</span>
      <span>Built for curiosity, not completeness.</span>
    </footer>`;
}

function hydrateProfileLinks() {
  document.querySelectorAll("[data-profile-link]").forEach((link) => {
    const key = link.dataset.profileLink;
    const raw = PROFILE[key];

    if (!raw) {
      link.setAttribute("data-disabled", "true");
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("title", "Add this link in site.js");
      link.removeAttribute("href");
      return;
    }

    const href = key === "email" && !raw.startsWith("mailto:") ? `mailto:${raw}` : raw;
    link.href = href;
    if (key !== "email") {
      link.target = "_blank";
      link.rel = "noreferrer";
    }
  });
}

function enableReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  items.forEach((el) => observer.observe(el));
}

document.addEventListener("DOMContentLoaded", () => {
  renderFooter();
  hydrateProfileLinks();
  enableReveal();
});

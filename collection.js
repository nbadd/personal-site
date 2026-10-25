(() => {
  const switcher = document.querySelector(".collection-switcher");
  if (!switcher) return;
  const tabs = Array.from(switcher.querySelectorAll('[role="tab"]'));
  const names = tabs.map((tab) => tab.dataset.collection);

  function select(name, { focus = false, updateHash = false } = {}) {
    if (!names.includes(name)) return;
    switcher.dataset.active = name;
    for (const tab of tabs) {
      const selected = tab.dataset.collection === name;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      document.getElementById(tab.getAttribute("aria-controls")).hidden = !selected;
      if (selected && focus) tab.focus();
    }
    document.title = name === "projects" ? "Projects" : "Writings";
    if (updateHash && window.location.hash !== `#${name}`) {
      window.location.hash = name;
    }
  }

  for (const [index, tab] of tabs.entries()) {
    tab.addEventListener("click", () => select(tab.dataset.collection, { updateHash: true }));
    tab.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;
      event.preventDefault();
      select(names[next], { focus: true, updateHash: true });
    });
  }

  window.addEventListener("hashchange", () => select(window.location.hash === "#projects" ? "projects" : "writing"));
  select(window.location.hash === "#projects" ? "projects" : "writing");
})();

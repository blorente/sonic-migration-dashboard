// ---------------------------------------------------------------------
// RENDER
// Reads the data loaded from data.js and renders it to the DOM directly.
// ---------------------------------------------------------------------

// Utility to create an element in the DOM.
const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  for (const c of children) if (c != null) node.append(c);
  return node;
};

function statusPill(statusKey) {
  const meta = STATUS[statusKey] || STATUS["not-started"];
  const pill = el("span", { className: `pill ${meta.cls}` });
  if (meta.logos.length) {
    const logos = el("span", { className: "logos" });
    for (const key of meta.logos) {
      const l = BUILD_LOGOS[key];
      if (l) logos.append(el("img", { className: "logo", src: l.src, alt: l.alt, title: l.alt }));
    }
    pill.append(logos);
  }
  pill.append(el("span", { className: "status", textContent: meta.label }));
  return pill;
}

function companyCell(slug) {
  if (!slug) return document.createTextNode("");
  const co = COMPANIES[slug];
  const inner = co && co.logo
    ? el("img", { src: co.logo, alt: co.name, title: co.name })
    // Text fallback for any company without a logo in the roster.
    : el("span", { className: "name-fallback", textContent: (co && co.name) || slug });

  if (co && co.url) {
    return el("a", {
      className: "company company-link", href: co.url,
      target: "_blank", rel: "noopener", title: co.name,
    }, inner);
  }
  return el("span", { className: "company" }, inner);
}

function prCell(pr) {
  if (!pr) return document.createTextNode("");
  const link = el("a", { className: "pr-link", href: PR_BASE + pr, target: "_blank", rel: "noopener" });
  const state = PR_STATUS_ICONS[PR_STATUSES[pr]];
  if (state) {
    link.append(el("img", { className: "pr-icon", src: state.icon, alt: state.label, title: state.label }));
    link.title = `${state.label} — #${pr}`;
  }
  link.append(document.createTextNode("#" + pr));
  return link;
}

function contributorCell(handle) {
  if (!handle) return document.createTextNode("");
  return el("a", {
    className: "contributor-link", href: GITHUB_BASE + handle,
    target: "_blank", rel: "noopener", textContent: "@" + handle,
  });
}

function renderRows() {
  const tbody = document.getElementById("rows");
  const sorted = [...COMPONENTS].sort((a, b) => {
    const d = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
    return d !== 0 ? d : a.name.localeCompare(b.name);
  });
  for (const c of sorted) {
    tbody.append(el("tr", {},
      el("td", { className: "component", textContent: c.name }),
      el("td", { className: "rules", textContent: `rules/${c.name}.mk` }),
      el("td", {}, statusPill(c.status)),
      el("td", {}, prCell(c.pr)),
      el("td", {}, contributorCell(c.contributor)),
      el("td", {}, companyCell(c.company)),
      el("td", { className: "notes", textContent: c.notes || "" }),
    ));
  }
}

function renderSummary() {
  const total = COMPONENTS.length;
  const counts = { "not-started": 0, "bazel-make": 0, "bazel-only": 0 };
  for (const c of COMPONENTS) counts[c.status] = (counts[c.status] || 0) + 1;

  const summary = document.getElementById("summary");

  const countRow = el("div", { className: "counts" });
  for (const key of STATUS_ORDER) {
    countRow.append(el("span", { className: "count" },
      el("span", { className: `swatch ${STATUS[key].cls}` }),
      document.createTextNode(`${STATUS[key].label}: ${counts[key]}`),
    ));
  }
  countRow.append(el("span", { className: "count", style: "font-weight:400" },
    document.createTextNode(`Total: ${total}`)));
  summary.append(countRow);

  // Composition bar: one segment per status, sized by raw count. The count row
  // above is the accessible equivalent, so the bar itself is decorative.
  const bar = el("div", { className: "progress-bar" });

  // Hide from screen readers. This bar a nicety anyway.
  bar.setAttribute("aria-hidden", "true");

  for (const key of STATUS_ORDER) {
    const n = counts[key];
    if (!n) continue; // a zero-count status must paint nothing, not a hairline
    const seg = el("span", {
      className: `seg ${STATUS[key].cls}`,
      title: `${STATUS[key].label}: ${n} of ${total} (${(n / total * 100).toFixed(1)}%)`,
    });
    seg.style.flexGrow = String(n);
    bar.append(seg);
  }
  summary.append(bar);
}

function initSearch() {
  const total = COMPONENTS.length;
  const countEl = document.getElementById("result-count");
  const emptyEl = document.getElementById("empty-state");

  // List.js runs after we have rendered all rows, so it can index 100% of the content.
  const list = new List("migration", {
    valueNames: ["component", "status"],
    listClass: "list",
    searchClass: "search",
    page: 1000,
  });

  const updateFeedback = () => {
    const shown = list.matchingItems.length;
    countEl.textContent = `Showing ${shown} of ${total}`;
    emptyEl.hidden = shown !== 0;
  };

  list.on("updated", updateFeedback);
  updateFeedback();
}

renderSummary();
renderRows();
initSearch();

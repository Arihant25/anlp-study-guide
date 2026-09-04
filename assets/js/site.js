/* ANLP Study Guide — small runtime */

// Shared site map — used by both the mobile top nav and the desktop left rail.
const SITE_NAV = [
  { href: "index.html", short: "⌂", label: "Home", group: "home" },
  { href: "lectures/1-logistics.html", short: "01", label: "Logistics", group: "lectures" },
  { href: "lectures/2-transformers.html", short: "02", label: "Transformers", group: "lectures" },
  { href: "lectures/3-tokenization.html", short: "03", label: "Tokenization", group: "lectures" },
  { href: "lectures/4-positional-encoding.html", short: "04", label: "Positional", group: "lectures" },
  { href: "lectures/5-attention.html", short: "05", label: "Attention", group: "lectures" },
  { href: "lectures/6-more-attention.html", short: "06", label: "More Attn", group: "lectures" },
  { href: "tutorials/1-math-for-dl.html", short: "T1", label: "Math for DL", group: "tutorials" },
  { href: "tutorials/2-matrices-to-transformers.html", short: "T2", label: "Matrices", group: "tutorials" },
  { href: "assignments/1-transformers-from-scratch.html", short: "A1", label: "Transformers", group: "assignments" },
  { href: "pyqs/mid-2023.html", short: "Q23", label: "PYQ 2023", group: "pyqs" },
  { href: "pyqs/mid-2024.html", short: "Q24", label: "PYQ 2024", group: "pyqs" },
];
const GROUP_LABELS = { home: "", lectures: "Lectures", tutorials: "Tutorials", assignments: "Assignments", pyqs: "PYQs" };

// Resolve prefix + currentIdx from window.location — shared by both injectors.
function __siteContext() {
  const path = location.pathname.replace(/\\/g, "/");
  const inSubdir = /\/(lectures|tutorials|pyqs|assignments)\//.test(path);
  const prefix = inSubdir ? "../" : "";
  const currentIdx = SITE_NAV.findIndex(item => {
    const target = "/" + item.href;
    return path.endsWith(target) || (item.href === "index.html" && (path.endsWith("/") || path.endsWith("/index.html")));
  });
  return { path, inSubdir, prefix, currentIdx };
}

// Top nav — mobile-only. Injects on every subpage but only when the desktop
// sidebars are hidden (viewport below the shell breakpoint of 1120px).
(function () {
  const MQ = "(max-width: 1119px)";
  let nav = null;

  function build(prefix, currentIdx) {
    const n = document.createElement("nav");
    n.className = "lecture-nav";
    n.setAttribute("aria-label", "Course sections");

    const brand = document.createElement("a");
    brand.className = "ln-brand";
    brand.href = prefix + "index.html";
    brand.innerHTML = 'an attention <em>lab notebook</em>';
    n.appendChild(brand);

    const scroll = document.createElement("div");
    scroll.className = "ln-scroll";

    let currentGroup = null;
    let groupEl = null;
    SITE_NAV.forEach((item, i) => {
      if (item.group !== currentGroup) {
        groupEl = document.createElement("div");
        groupEl.className = "ln-group";
        scroll.appendChild(groupEl);
        currentGroup = item.group;
      }
      const a = document.createElement("a");
      a.href = prefix + item.href;
      a.className = "ln-chip " + item.group + (i === currentIdx ? " current" : "");
      a.innerHTML = '<span class="ln-num">' + item.short + '</span><span class="ln-lbl">' + item.label + '</span>';
      if (i === currentIdx) a.setAttribute("aria-current", "page");
      groupEl.appendChild(a);
    });
    n.appendChild(scroll);

    const btn = document.createElement("button");
    btn.className = "theme-toggle";
    btn.type = "button";
    btn.setAttribute("aria-label", "Toggle theme");
    btn.onclick = () => window.__toggleTheme && window.__toggleTheme();
    btn.textContent = "◑ dark";
    n.appendChild(btn);

    // Center current chip
    requestAnimationFrame(() => {
      const curEl = n.querySelector(".ln-chip.current");
      if (curEl) {
        const target = curEl.offsetLeft - scroll.clientWidth / 2 + curEl.offsetWidth / 2;
        scroll.scrollLeft = Math.max(0, target);
      }
    });

    // Drag-to-scroll (mouse + touch). Wheel scrolls horizontally.
    let isDown = false, startX = 0, startScroll = 0, moved = 0;
    const DRAG_THRESHOLD = 5;
    const onDown = (e) => {
      const pt = e.touches ? e.touches[0] : e;
      isDown = true; moved = 0;
      startX = pt.pageX; startScroll = scroll.scrollLeft;
    };
    const onMove = (e) => {
      if (!isDown) return;
      const pt = e.touches ? e.touches[0] : e;
      const dx = pt.pageX - startX;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > DRAG_THRESHOLD) scroll.classList.add("dragging");
      scroll.scrollLeft = startScroll - dx;
      if (e.cancelable && Math.abs(dx) > DRAG_THRESHOLD) e.preventDefault();
    };
    const onUp = () => {
      if (!isDown) return;
      isDown = false;
      scroll.classList.remove("dragging");
    };
    scroll.addEventListener("click", (e) => {
      if (moved > DRAG_THRESHOLD) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    scroll.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    scroll.addEventListener("mouseleave", onUp);
    scroll.addEventListener("touchstart", onDown, { passive: true });
    scroll.addEventListener("touchmove", onMove, { passive: false });
    scroll.addEventListener("touchend", onUp);
    scroll.addEventListener("touchcancel", onUp);
    scroll.addEventListener("wheel", (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        scroll.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }, { passive: false });

    return n;
  }

  function ensureMounted() {
    const ctx = __siteContext();
    if (!ctx.inSubdir) return;
    const shouldShow = window.matchMedia(MQ).matches;
    if (shouldShow && !nav) {
      nav = build(ctx.prefix, ctx.currentIdx);
      document.body.classList.add("has-topnav");
      document.body.insertBefore(nav, document.body.firstChild);
    } else if (!shouldShow && nav) {
      nav.remove();
      nav = null;
      document.body.classList.remove("has-topnav");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const ctx = __siteContext();
    if (!ctx.inSubdir) return;
    ensureMounted();
    window.addEventListener("resize", ensureMounted, { passive: true });
  });
})();

// Left rail — inject the canonical "all pages" list on every subpage so the
// sidebar shape is identical across the whole site.
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const ctx = __siteContext();
    if (!ctx.inSubdir) return;
    const rail = document.querySelector(".rail-left");
    if (!rail) return;

    // Ensure brand block
    let brand = rail.querySelector(".brand");
    if (!brand) {
      brand = document.createElement("div");
      brand.className = "brand";
      rail.insertBefore(brand, rail.firstChild);
    }
    brand.innerHTML = '<a href="' + ctx.prefix + 'index.html" style="text-decoration:none;color:inherit">an attention<br><em>lab notebook</em></a><small>ANLP · Monsoon \'26</small>';

    // Replace nav content with unified all-pages listing
    let nav = rail.querySelector("nav");
    if (!nav) {
      nav = document.createElement("nav");
      rail.appendChild(nav);
    }
    const out = [];
    // Home first
    out.push('<a href="' + ctx.prefix + 'index.html"' + (ctx.currentIdx === 0 ? ' class="active"' : '') + '>← Home</a>');
    let lastGroup = "home";
    SITE_NAV.forEach((item, i) => {
      if (i === 0) return; // home already rendered
      if (item.group !== lastGroup) {
        const heading = GROUP_LABELS[item.group] || item.group;
        if (heading) out.push('<div class="grp">' + heading + '</div>');
        lastGroup = item.group;
      }
      const isCurrent = i === ctx.currentIdx;
      out.push('<a href="' + ctx.prefix + item.href + '"' + (isCurrent ? ' class="active"' : '') + '>' + item.short + ' · ' + item.label + '</a>');
    });
    // Footer meta
    out.push('<div class="grp">Meta</div>');
    out.push('<a href="' + ctx.prefix + 'index.html#credits">Credits</a>');
    out.push('<a href="https://github.com/Arihant25/anlp-study-guide" target="_blank" rel="noopener">GitHub ↗</a>');
    nav.innerHTML = out.join("\n");
  });
})();

// Strip leading icon glyphs from callout labels so the CSS-injected
// icon is the single unique marker per callout.
(function () {
  const leadingIcons = /^[\s -　]*[\p{Emoji_Presentation}\p{Extended_Pictographic}✦→⚠⚙◐◑◇◆★☆⇒⇢▸▶⚡]+[\s:·\-]*\s*/u;
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".callout .callout-label").forEach(el => {
      const t = el.textContent;
      const stripped = t.replace(leadingIcons, "");
      if (stripped !== t) el.textContent = stripped;
    });
  });
})();

// Theme toggle
(function () {
  const KEY = "anlp-theme";
  const saved = localStorage.getItem(KEY);
  if (saved === "light" || saved === "dark") {
    document.documentElement.setAttribute("data-theme", saved);
  }
  window.__toggleTheme = function () {
    const cur = document.documentElement.getAttribute("data-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = cur ? cur === "dark" : prefersDark;
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(KEY, next);
    updateThemeLabels();
  };
  function updateThemeLabels() {
    const cur = document.documentElement.getAttribute("data-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = cur ? cur === "dark" : prefersDark;
    document.querySelectorAll(".theme-toggle").forEach(b => {
      b.textContent = isDark ? "◐ light" : "◑ dark";
    });
  }
  document.addEventListener("DOMContentLoaded", updateThemeLabels);
})();

// Lightbox
(function () {
  let lb = null;
  function ensure() {
    if (lb) return lb;
    lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML = '<img alt=""><div class="lb-caption"></div>';
    document.body.appendChild(lb);
    lb.addEventListener("click", close);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
    return lb;
  }
  function open(src, cap) {
    ensure();
    lb.querySelector("img").src = src;
    lb.querySelector(".lb-caption").textContent = cap || "";
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function close() {
    if (!lb) return;
    lb.classList.remove("open");
    document.body.style.overflow = "";
  }
  document.addEventListener("click", (e) => {
    const img = e.target.closest(".slide-frame img");
    if (!img) return;
    const cap = img.closest(".slide-frame").querySelector(".tag");
    open(img.src, cap ? cap.textContent : "");
  });
})();

// Eager image loading. Pages carry 20 MB+ of slide PNGs, and the browser's
// default network priority leaves below-the-fold images stalled until the
// viewport approaches. Force eager loading with async decode, then warm the
// cache in parallel so images are already fetched before the user scrolls.
(function () {
  function preloadAll() {
    const imgs = Array.from(document.images);
    imgs.forEach((img, i) => {
      img.loading = "eager";
      img.decoding = "async";
      if (i < 3) img.setAttribute("fetchpriority", "high");
    });
    const pending = imgs.filter(img => !img.complete && img.src);
    let inFlight = 0;
    const MAX = 8;
    let next = 0;
    function pump() {
      while (inFlight < MAX && next < pending.length) {
        const src = pending[next++].src;
        inFlight++;
        const warm = new Image();
        const done = () => { inFlight--; pump(); };
        warm.onload = done;
        warm.onerror = done;
        warm.src = src;
      }
    }
    pump();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", preloadAll);
  } else {
    preloadAll();
  }
})();

// Scrollspy — highlight active TOC link + light up heatmap rail
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    // Seed the heatmap rail with cells regardless of headings
    const rail = document.querySelector(".heatmap-rail");
    let cells = [];
    if (rail) {
      cells = Array.from(rail.querySelectorAll(".cell"));
      if (cells.length === 0) {
        const N = 16;
        for (let i = 0; i < N; i++) {
          const c = document.createElement("div");
          c.className = "cell";
          rail.appendChild(c);
        }
        cells = Array.from(rail.querySelectorAll(".cell"));
      }
    }

    // Prefer h2/h3 with ids; if none, fall back to all h2/h3 in main
    let headings = Array.from(document.querySelectorAll("main h2[id], main h3[id]"));
    if (headings.length === 0) {
      headings = Array.from(document.querySelectorAll("main h2, main h3"));
    }
    const tocLinks = Array.from(document.querySelectorAll(".rail-left a[href^='#'], .rail-right .rail-toc a[href^='#']"));

    // If we have no headings and no cells, nothing to do
    if (headings.length === 0 && cells.length === 0) return;

    function currentIndex() {
      if (headings.length === 0) return 0;
      const y = window.scrollY + 100;
      let idx = 0;
      for (let i = 0; i < headings.length; i++) {
        if (headings[i].offsetTop <= y) idx = i; else break;
      }
      return idx;
    }
    function scrollProgress() {
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      if (total <= 0) return 1;
      return Math.min(1, Math.max(0, window.scrollY / total));
    }
    function update() {
      const idx = currentIndex();
      if (headings.length) {
        const id = headings[idx] ? headings[idx].id : null;
        if (id) {
          tocLinks.forEach(a => {
            a.classList.toggle("active", a.getAttribute("href") === "#" + id);
          });
        }
      }
      if (cells.length) {
        // Progress by scroll position — always yields something visible, even before scrolling
        const pct = scrollProgress();
        const lit = Math.max(1, Math.round(pct * cells.length));
        cells.forEach((c, i) => c.classList.toggle("lit", i < lit));
      }
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  });
})();

(function () {
  const nav = document.querySelector("[data-section-nav]");
  const main = document.querySelector(".site-main");

  if (!nav || !main) return;

  const headings = Array.from(main.querySelectorAll("h2")).filter((heading) => {
    return heading.textContent.trim().length > 0;
  });

  if (!headings.length) {
    const firstFallbackLink = nav.querySelector("a");
    if (firstFallbackLink) firstFallbackLink.classList.add("active");
    return;
  }

  const usedIds = new Set(
    Array.from(document.querySelectorAll("[id]")).map((element) => element.id)
  );

  const slugify = (value) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const ensureId = (heading) => {
    if (heading.id) return heading.id;

    const base = slugify(heading.textContent) || "section";
    let id = base;
    let index = 2;

    while (usedIds.has(id)) {
      id = `${base}-${index}`;
      index += 1;
    }

    heading.id = id;
    usedIds.add(id);
    return id;
  };

  const labelFor = (heading) => {
    const label = heading.textContent.trim();
    return label === "About Me" ? "About" : label;
  };

  nav.innerHTML = "";

  const links = headings.map((heading) => {
    const link = document.createElement("a");
    link.href = `#${ensureId(heading)}`;
    link.textContent = labelFor(heading);
    nav.appendChild(link);
    return { heading, link };
  });

  const setActive = (activeHeading) => {
    links.forEach(({ heading, link }) => {
      link.classList.toggle("active", heading === activeHeading);
    });
  };

  const findActiveHeading = () => {
    const offset = 120;
    let active = links[0].heading;

    for (const { heading } of links) {
      if (heading.getBoundingClientRect().top <= offset) {
        active = heading;
      } else {
        break;
      }
    }

    return active;
  };

  let ticking = false;
  const updateActive = () => {
    if (ticking) return;

    ticking = true;
    window.requestAnimationFrame(() => {
      setActive(findActiveHeading());
      ticking = false;
    });
  };

  links.forEach(({ link, heading }) => {
    link.addEventListener("click", () => setActive(heading));
  });

  updateActive();
  window.addEventListener("scroll", updateActive, { passive: true });
  window.addEventListener("resize", updateActive);
})();

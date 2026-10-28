(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     Footer year
     --------------------------------------------------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     Contact: "open now" status from data-open / data-close
     (HH:MM, Europe/Sofia time; close may be past midnight)
     --------------------------------------------------------- */
  var hoursEl = document.getElementById("openHours");
  var statusEl = hoursEl && hoursEl.querySelector(".open-status");
  if (statusEl) {
    var toMinutes = function (hhmm) {
      var parts = String(hhmm).split(":");
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || "0", 10);
    };
    var openAt = toMinutes(hoursEl.dataset.open);
    var closeAt = toMinutes(hoursEl.dataset.close);
    var sofiaClock = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Sofia",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    });
    var statusText = statusEl.querySelector(".open-status__text");

    var updateOpenStatus = function () {
      var now = toMinutes(sofiaClock.format(new Date()));
      var isOpen = closeAt > openAt ? now >= openAt && now < closeAt : now >= openAt || now < closeAt;
      statusEl.classList.toggle("is-open", isOpen);
      statusText.textContent = isOpen ? "Отворено сега" : "Затворено";
      statusEl.hidden = false;
    };

    if (!isNaN(openAt) && !isNaN(closeAt)) {
      updateOpenStatus();
      setInterval(updateOpenStatus, 60000);
    }
  }

  /* ---------------------------------------------------------
     Navbar: solid background once the page is scrolled
     --------------------------------------------------------- */
  var nav = document.getElementById("siteNav");
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------------------------------------------------------
     Mobile menu
     --------------------------------------------------------- */
  var navToggle = document.getElementById("navToggle");
  var mobileNav = document.getElementById("mobileNav");
  if (navToggle && mobileNav) {
    // moveFocus: only for keyboard use, so touch users don't get a focus ring.
    var setMobileNav = function (open, moveFocus) {
      mobileNav.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Затвори менюто" : "Отвори менюто");
      document.body.classList.toggle("nav-open", open);
      if (!moveFocus) return;
      if (open) {
        var firstLink = mobileNav.querySelector("a");
        if (firstLink) firstLink.focus({ preventScroll: true });
      } else {
        navToggle.focus({ preventScroll: true });
      }
    };

    navToggle.addEventListener("click", function (e) {
      // e.detail is 0 when the button was activated from the keyboard.
      setMobileNav(!mobileNav.classList.contains("is-open"), e.detail === 0);
    });
    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMobileNav(false, false);
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mobileNav.classList.contains("is-open")) setMobileNav(false, true);
    });
    window.matchMedia("(min-width: 901px)").addEventListener("change", function (e) {
      if (e.matches) setMobileNav(false, false);
    });
  }

  /* ---------------------------------------------------------
     Scroll reveal (fade-up)
     --------------------------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ---------------------------------------------------------
     Highlight the nav link of the section in view
     --------------------------------------------------------- */
  var navLinks = document.querySelectorAll(".nav__links a[href^='#']");
  if (navLinks.length && "IntersectionObserver" in window) {
    var linkFor = {};
    navLinks.forEach(function (link) {
      linkFor[link.getAttribute("href").slice(1)] = link;
    });
    var spyObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (link) {
            link.removeAttribute("aria-current");
          });
          var active = linkFor[entry.target.id];
          if (active) active.setAttribute("aria-current", "true");
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    Object.keys(linkFor).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spyObserver.observe(section);
    });
  }
})();

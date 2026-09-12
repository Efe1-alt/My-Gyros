(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     Footer year
     --------------------------------------------------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     Navbar: solid on scroll
     --------------------------------------------------------- */
  var nav = document.getElementById("siteNav");
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle("is-scrolled", window.scrollY > 40);
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
    var closeMobileNav = function () {
      mobileNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
    };
    navToggle.addEventListener("click", function () {
      var isOpen = mobileNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      document.body.classList.toggle("nav-open", isOpen);
    });
    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMobileNav);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMobileNav();
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
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---------------------------------------------------------
     Reviews carousel
     --------------------------------------------------------- */
  var carousel = document.getElementById("reviewsCarousel");
  var track = document.getElementById("reviewsTrack");
  var dotsWrap = document.getElementById("reviewsDots");
  var prevBtn = document.getElementById("reviewsPrev");
  var nextBtn = document.getElementById("reviewsNext");

  if (carousel && track && dotsWrap && prevBtn && nextBtn) {
    var slides = Array.prototype.slice.call(track.children);
    var total = slides.length;
    var index = 0;
    var perView = 1;
    var autoplayId = null;
    var AUTOPLAY_MS = 5500;

    var getPerView = function () {
      var w = window.innerWidth;
      if (w >= 1024) return 3;
      if (w >= 700) return 2;
      return 1;
    };

    var maxIndex = function () {
      return Math.max(0, total - perView);
    };

    // Number of distinct scroll positions ("pages") at the current
    // perView — this is what the dots should represent, not the raw
    // slide count, otherwise the last dots have nowhere left to scroll
    // to and the carousel appears to drag empty space into view.
    var pageCount = function () {
      return maxIndex() + 1;
    };

    var buildDots = function () {
      dotsWrap.innerHTML = "";
      var pages = pageCount();
      for (var i = 0; i < pages; i++) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", "Отиди на отзив " + (i + 1));
        (function (i) {
          dot.addEventListener("click", function () {
            goTo(i);
            restartAutoplay();
          });
        })(i);
        dotsWrap.appendChild(dot);
      }
    };

    var update = function () {
      var offset = index * (100 / perView);
      track.style.transform = "translateX(-" + offset + "%)";

      var dots = dotsWrap.children;
      for (var i = 0; i < dots.length; i++) {
        var active = i === index;
        dots[i].setAttribute("aria-selected", active ? "true" : "false");
      }
    };

    var goTo = function (i) {
      var pages = pageCount();
      if (i < 0) i = pages - 1;
      if (i > pages - 1) i = 0;
      index = i;
      update();
    };

    var next = function () {
      goTo(index + 1);
    };

    var prev = function () {
      goTo(index - 1);
    };

    var startAutoplay = function () {
      if (prefersReducedMotion) return;
      stopAutoplay();
      autoplayId = window.setInterval(next, AUTOPLAY_MS);
    };

    var stopAutoplay = function () {
      if (autoplayId) {
        window.clearInterval(autoplayId);
        autoplayId = null;
      }
    };

    var restartAutoplay = function () {
      stopAutoplay();
      startAutoplay();
    };

    prevBtn.addEventListener("click", function () {
      prev();
      restartAutoplay();
    });
    nextBtn.addEventListener("click", function () {
      next();
      restartAutoplay();
    });

    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);
    carousel.addEventListener("focusin", stopAutoplay);
    carousel.addEventListener("focusout", startAutoplay);

    /* Touch / swipe */
    var touchStartX = 0;
    var touchDeltaX = 0;
    var isTouching = false;

    track.addEventListener(
      "touchstart",
      function (e) {
        isTouching = true;
        touchStartX = e.touches[0].clientX;
        touchDeltaX = 0;
        stopAutoplay();
      },
      { passive: true }
    );

    track.addEventListener(
      "touchmove",
      function (e) {
        if (!isTouching) return;
        touchDeltaX = e.touches[0].clientX - touchStartX;
      },
      { passive: true }
    );

    track.addEventListener("touchend", function () {
      if (!isTouching) return;
      isTouching = false;
      if (Math.abs(touchDeltaX) > 40) {
        if (touchDeltaX < 0) next();
        else prev();
      }
      restartAutoplay();
    });

    window.addEventListener(
      "resize",
      function () {
        var newPerView = getPerView();
        if (newPerView !== perView) {
          perView = newPerView;
          if (index > maxIndex()) index = maxIndex();
          buildDots();
          update();
        }
      },
      { passive: true }
    );

    perView = getPerView();
    buildDots();
    update();
    startAutoplay();
  }

  /* ---------------------------------------------------------
     Reservation form: validation + success state
     No backend is connected yet. On submit, the form:
       1. Validates required fields.
       2. Builds a plain data object (`reservationPayload`).
       3. Shows a success message.
     To connect a real backend, replace the `handleSubmit`
     body's TODO section with a fetch()/API call using
     `reservationPayload`.
     --------------------------------------------------------- */
  var resForm = document.getElementById("resForm");
  var resWrapper = document.getElementById("reservationForm");
  var resSuccess = document.getElementById("resSuccess");

  if (resForm) {
    var dateInput = document.getElementById("resDate");
    var timeInput = document.getElementById("resTime");

    // Bulgarian-format date (dd.mm.yyyy) and 24h time (HH:MM) auto-masking —
    // native <input type="date"/"time"> render in the browser/OS locale
    // (often US mm/dd/yyyy + AM/PM) regardless of the page's lang, so plain
    // text inputs with a manual mask are used to guarantee the BG format.
    var maskDate = function (digits) {
      digits = digits.slice(0, 8);
      var day = digits.slice(0, 2);
      var month = digits.slice(2, 4);
      var year = digits.slice(4, 8);
      var out = day;
      if (month) out += "." + month;
      if (year) out += "." + year;
      return out;
    };

    var maskTime = function (digits) {
      digits = digits.slice(0, 4);
      var hours = digits.slice(0, 2);
      var minutes = digits.slice(2, 4);
      var out = hours;
      if (minutes) out += ":" + minutes;
      return out;
    };

    if (dateInput) {
      dateInput.addEventListener("input", function () {
        var digits = dateInput.value.replace(/\D/g, "");
        dateInput.value = maskDate(digits);
      });
    }

    if (timeInput) {
      timeInput.addEventListener("input", function () {
        var digits = timeInput.value.replace(/\D/g, "");
        timeInput.value = maskTime(digits);
      });
    }

    var isValidCalendarDate = function (day, month, year) {
      var d = new Date(year, month - 1, day);
      return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
    };

    var setError = function (field, message) {
      var wrap = field.closest(".field");
      var errorEl = resForm.querySelector('[data-error-for="' + field.id + '"]');
      if (wrap) wrap.classList.toggle("field--error", Boolean(message));
      if (errorEl) errorEl.textContent = message || "";
    };

    var validate = function () {
      var valid = true;
      var requiredFields = resForm.querySelectorAll("[required]");

      requiredFields.forEach(function (field) {
        var value = field.value.trim();
        if (!value) {
          setError(field, "Моля, попълнете това поле.");
          valid = false;
        } else if (field.type === "tel" && !/^[0-9+()\s-]{6,}$/.test(value)) {
          setError(field, "Моля, въведете валиден телефонен номер.");
          valid = false;
        } else if (field === dateInput) {
          var dateMatch = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
          if (!dateMatch) {
            setError(field, "Моля, въведете дата във формат дд.мм.гггг.");
            valid = false;
          } else {
            var day = parseInt(dateMatch[1], 10);
            var month = parseInt(dateMatch[2], 10);
            var year = parseInt(dateMatch[3], 10);
            if (!isValidCalendarDate(day, month, year)) {
              setError(field, "Моля, въведете валидна дата.");
              valid = false;
            } else {
              var chosen = new Date(year, month - 1, day);
              var today = new Date();
              today.setHours(0, 0, 0, 0);
              if (chosen < today) {
                setError(field, "Датата не може да е в миналото.");
                valid = false;
              } else {
                setError(field, "");
              }
            }
          }
        } else if (field === timeInput) {
          if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
            setError(field, "Моля, въведете час във формат чч:мм (24-часов).");
            valid = false;
          } else {
            setError(field, "");
          }
        } else {
          setError(field, "");
        }
      });

      return valid;
    };

    resForm.querySelectorAll("[required]").forEach(function (field) {
      field.addEventListener("blur", function () {
        validate();
      });
    });

    resForm.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!validate()) {
        var firstInvalid = resForm.querySelector(".field--error input, .field--error select");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var formData = new FormData(resForm);
      var reservationPayload = {
        name: formData.get("name"),
        phone: formData.get("phone"),
        date: formData.get("date"),
        time: formData.get("time"),
        guests: formData.get("guests"),
        note: formData.get("note") || ""
      };

      // TODO: connect to a real reservation backend, e.g.:
      // fetch("/api/reservations", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(reservationPayload)
      // });

      if (resWrapper) resWrapper.classList.add("is-submitted");
      if (resSuccess) {
        resSuccess.classList.add("is-visible");
        resSuccess.focus && resSuccess.focus();
      }
    });
  }
})();

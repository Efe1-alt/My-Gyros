(function () {
  "use strict";

  var grid = document.getElementById("galleryGrid");
  if (!grid) return;

  var moreWrap = document.getElementById("galleryMore");
  var moreBtn = document.getElementById("galleryMoreBtn");
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxCaption = document.getElementById("lightboxCaption");
  var lightboxCount = document.getElementById("lightboxCount");
  var lightboxClose = document.getElementById("lightboxClose");
  var lightboxPrev = document.getElementById("lightboxPrev");
  var lightboxNext = document.getElementById("lightboxNext");

  var base = grid.getAttribute("data-base") || "";
  var manifestUrl = grid.getAttribute("data-manifest");
  var initialCount = parseInt(grid.getAttribute("data-initial"), 10) || 9;

  var photos = [];
  var currentIndex = 0;
  var lastFocused = null;

  var buildItem = function (photo, index) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gallery__item";
    btn.setAttribute("aria-label", photo.alt || "Снимка от My Gyros");

    var img = document.createElement("img");
    img.src = base + photo.file;
    img.alt = photo.alt || "";
    img.loading = "lazy";
    if (photo.width) img.width = photo.width;
    if (photo.height) img.height = photo.height;

    btn.appendChild(img);

    if (photo.alt) {
      var caption = document.createElement("span");
      caption.className = "gallery__caption";
      caption.textContent = photo.alt;
      btn.appendChild(caption);
    }

    btn.addEventListener("click", function () {
      openLightbox(index);
    });

    return btn;
  };

  var renderRange = function (from, to) {
    for (var i = from; i < to && i < photos.length; i++) {
      grid.appendChild(buildItem(photos[i], i));
    }
  };

  var openLightbox = function (index) {
    if (!lightbox || !photos.length) return;
    currentIndex = (index + photos.length) % photos.length;
    updateLightbox();
    lastFocused = document.activeElement;
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    lightboxClose && lightboxClose.focus();
    document.addEventListener("keydown", onKeydown);
  };

  var closeLightbox = function () {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.classList.remove("lightbox-open");
    document.removeEventListener("keydown", onKeydown);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  };

  var updateLightbox = function () {
    var photo = photos[currentIndex];
    if (!photo || !lightboxImg) return;
    lightboxImg.src = base + photo.file;
    lightboxImg.alt = photo.alt || "";
    if (lightboxCaption) lightboxCaption.textContent = photo.alt || "";
    if (lightboxCount) lightboxCount.textContent = currentIndex + 1 + " / " + photos.length;
  };

  var next = function () {
    currentIndex = (currentIndex + 1) % photos.length;
    updateLightbox();
  };

  var prev = function () {
    currentIndex = (currentIndex - 1 + photos.length) % photos.length;
    updateLightbox();
  };

  var onKeydown = function (e) {
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") prev();
  };

  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightboxNext) lightboxNext.addEventListener("click", next);
  if (lightboxPrev) lightboxPrev.addEventListener("click", prev);
  if (lightbox) {
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }

  if (moreBtn) {
    moreBtn.addEventListener("click", function () {
      renderRange(initialCount, photos.length);
      moreWrap.hidden = true;
    });
  }

  if (!manifestUrl) return;

  fetch(manifestUrl)
    .then(function (res) {
      if (!res.ok) throw new Error("manifest fetch failed");
      return res.json();
    })
    .then(function (data) {
      photos = Array.isArray(data) ? data : [];
      if (!photos.length) return;

      renderRange(0, Math.min(initialCount, photos.length));

      if (photos.length > initialCount && moreWrap) {
        moreWrap.hidden = false;
      }
    })
    .catch(function () {
      /* Manifest missing or unreadable (e.g. opened via file://) — the
         gallery grid simply stays empty rather than breaking the page. */
    });
})();

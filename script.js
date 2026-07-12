(() => {
  "use strict";

  const config = {
    eventISO: "2026-08-06T18:00:00+05:00",
    venue: "“BEK” To‘y va tantanalar maskani",
    address: "Jizzax shahri, Jizzax viloyati",
    mapUrl: "https://maps.app.goo.gl/f33AMVssJJhMVUZf6?g_st=atm",
    timeline: [
      ["17:30", "Mehmonlarni kutib olish"],
      ["18:00", "To‘y tantanasining boshlanishi"],
      ["18:30", "Kelin-kuyovning kirib kelishi"],
      ["19:00", "Tabriklar va oq fotiha"],
      ["20:00", "Bayram dasturxoni"],
      ["21:00", "Musiqa, raqs va ko‘ngilochar dastur"]
    ]
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const preloader = $("#preloader");
  const intro = $("#royalIntro");
  const envelope = $("#royalEnvelope");
  const envelopeStage = $("#envelopeStage");
  const invitation = $("#invitation");
  const sealButton = $("#sealButton");
  const arrowOpenButton = $("#arrowOpenButton");
  const music = $("#backgroundMusic");
  const musicToggle = $("#musicToggle");
  const rsvpModal = $("#rsvpModal");
  const rsvpForm = $("#rsvpForm");
  const childrenFields = $("#childrenFields");
  const formStatus = $("#formStatus");
  const savedRsvpNotice = $("#savedRsvpNotice");

  let invitationOpened = false;
  let lastFocused = null;
  let latestDays = null;

  function init() {
    buildTimeline();
    personalizeGuest();
    initCountdown();
    initReveal();
    initOpening();
    initMusic();
    initCalendar();
    initShare();
    initRsvp();
    initProgress();
    initParticles();
    restoreRsvp();

    window.addEventListener("load", () => {
      setTimeout(() => preloader.classList.add("hidden"), 260);
    });
  }

  function buildTimeline() {
    const timeline = $("#timeline");
    timeline.textContent = "";

    config.timeline.forEach(([timeText, title], index) => {
      const item = document.createElement("article");
      item.className = "timeline-item";
      item.dataset.reveal = index % 2 ? "right" : "left";
      item.style.transitionDelay = `${Math.min(index * 75, 300)}ms`;

      const time = document.createElement("time");
      time.className = "timeline-time";
      time.textContent = timeText;

      const dot = document.createElement("i");
      dot.className = "timeline-dot";
      dot.setAttribute("aria-hidden", "true");

      const copy = document.createElement("div");
      copy.className = "timeline-copy";
      copy.textContent = title;

      item.append(time, dot, copy);
      timeline.append(item);
    });
  }

  function sanitize(value) {
    return value
      .replace(/[<>`"'{}[\]\\]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 90);
  }

  function personalizeGuest() {
    const guest = sanitize(new URLSearchParams(location.search).get("guest") || "");
    $("#guestGreeting").textContent = guest ? `Hurmatli ${guest}!` : "Aziz mehmonimiz!";
  }

  function initOpening() {
    const openInvitation = async () => {
      if (invitationOpened) return;
      invitationOpened = true;

      envelope.classList.add("opening");
      envelopeStage.classList.add("opening");
      envelope.setAttribute("aria-disabled", "true");
      envelope.removeAttribute("tabindex");
      arrowOpenButton.disabled = true;

      try {
        music.volume = 0.38;
        await music.play();
        setMusicState(true);
      } catch {
        setMusicState(false);
      }

      setTimeout(() => {
        invitation.setAttribute("aria-hidden", "false");
        intro.classList.add("is-gone");
        musicToggle.hidden = false;
        window.scrollTo({ top: 0, behavior: "instant" });
      }, 2850);
    };

    envelope.addEventListener("click", openInvitation);
    arrowOpenButton.addEventListener("click", event => {
      event.stopPropagation();
      openInvitation();
    }, { once: true });

    envelope.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openInvitation();
      }
    });
  }

  function initCountdown() {
    const target = new Date(config.eventISO).getTime();
    const introDays = $("#introDays");

    function updateNumber(selector, value, pad = true) {
      const element = $(selector);
      const text = pad ? String(value).padStart(2, "0") : String(value);

      if (element.textContent === text) return;
      element.classList.add("flip");

      setTimeout(() => {
        element.textContent = text;
        element.classList.remove("flip");
      }, 125);
    }

    function tick() {
      const now = Date.now();
      const difference = target - now;

      if (difference <= 0) {
        $("#countdown").hidden = true;
        const message = $("#countdownMessage");
        message.hidden = false;
        message.textContent = now <= target + 6 * 60 * 60 * 1000
          ? "Bugun bizning baxtli kunimiz!"
          : "Baxtli kunimiz qalbimizda unutilmas xotira bo‘lib qoldi.";
        if (introDays) introDays.textContent = "0";
        return;
      }

      const days = Math.floor(difference / 86400000);
      const hours = Math.floor((difference % 86400000) / 3600000);
      const minutes = Math.floor((difference % 3600000) / 60000);
      const seconds = Math.floor((difference % 60000) / 1000);

      // Kun raqami ataylab padStart ishlatmaydi: 25, 9, 3 ko‘rinishida chiqadi.
      if (introDays) introDays.textContent = String(days);
      updateNumber("#days", days, false);
      updateNumber("#hours", hours, true);
      updateNumber("#minutes", minutes, true);
      updateNumber("#seconds", seconds, true);

      latestDays = days;
    }

    tick();
    setInterval(tick, 1000);
  }

  function initReveal() {
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion || !("IntersectionObserver" in window)) {
      $$("[data-reveal]").forEach(element => element.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    $$("[data-reveal]").forEach(element => observer.observe(element));

    const mutationObserver = new MutationObserver(() => {
      $$("[data-reveal]:not(.visible)").forEach(element => observer.observe(element));
    });
    mutationObserver.observe($("#timeline"), { childList: true });
  }

  function initMusic() {
    musicToggle.addEventListener("click", async () => {
      if (music.paused) {
        try {
          await music.play();
          setMusicState(true);
        } catch {
          setMusicState(false);
        }
      } else {
        music.pause();
        setMusicState(false);
      }
    });

    music.addEventListener("error", () => {
      musicToggle.hidden = true;
    });
  }

  function setMusicState(isPlaying) {
    musicToggle.classList.toggle("paused", !isPlaying);
    musicToggle.setAttribute("aria-label", isPlaying ? "Musiqani pauza qilish" : "Musiqani ijro etish");
  }

  function initCalendar() {
    $("#calendarButton").addEventListener("click", () => {
      const calendarData = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Urdushbek Durdona Royal Wedding//UZ",
        "BEGIN:VEVENT",
        "UID:urdushbek-durdona-20260806@royal.local",
        "DTSTAMP:20260712T000000Z",
        "DTSTART:20260806T130000Z",
        "DTEND:20260806T180000Z",
        "SUMMARY:Urdushbek va Durdonaning nikoh to‘yi",
        `LOCATION:${config.venue}, ${config.address}`,
        "DESCRIPTION:Nikoh to‘yiga taklifnoma. Boshlanish vaqti 18:00.",
        "END:VEVENT",
        "END:VCALENDAR"
      ].join("\r\n");

      const blob = new Blob([calendarData], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Urdushbek_Durdona_toy_sanasi.ics";
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
  }

  function initShare() {
    const status = $("#shareStatus");

    $("#shareButton").addEventListener("click", async () => {
      const data = {
        title: "Urdushbek & Durdona — Nikoh to‘yiga taklifnoma",
        text: "6-avgust, 2026-yil, soat 18:00. “BEK” To‘y va tantanalar maskani, Jizzax.",
        url: location.href
      };

      try {
        if (navigator.share) {
          await navigator.share(data);
          status.textContent = "Taklifnoma ulashildi.";
        } else if (navigator.clipboard && location.protocol !== "file:") {
          await navigator.clipboard.writeText(location.href);
          status.textContent = "Taklifnoma havolasi nusxalandi.";
        } else {
          status.textContent = "Sayt internetga joylangandan keyin ulashish tugmasi havolani yuboradi.";
        }
      } catch (error) {
        if (error.name !== "AbortError") status.textContent = "Ulashishni yakunlab bo‘lmadi.";
      }
    });
  }

  function initRsvp() {
    const openButton = $("#openRsvp");
    const closeButton = $("#closeRsvp");

    const openModal = () => {
      lastFocused = document.activeElement;
      rsvpModal.hidden = false;
      document.body.classList.add("modal-open");
      setTimeout(() => $("#fullName").focus(), 60);
    };

    const closeModal = () => {
      rsvpModal.hidden = true;
      document.body.classList.remove("modal-open");
      formStatus.textContent = "";
      lastFocused?.focus();
    };

    openButton.addEventListener("click", openModal);
    closeButton.addEventListener("click", closeModal);
    $("[data-close-modal]").addEventListener("click", closeModal);

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !rsvpModal.hidden) closeModal();
      if (event.key === "Tab" && !rsvpModal.hidden) trapFocus(event);
    });

    $$('input[name="children"]').forEach(input => {
      input.addEventListener("change", () => {
        childrenFields.hidden = !(input.checked && input.value === "yes");
      });
    });

    rsvpForm.addEventListener("submit", event => {
      event.preventDefault();
      clearErrors();

      let valid = true;
      const fullName = $("#fullName");
      if (!fullName.value.trim()) {
        fullName.parentElement.querySelector(".field-error").textContent = "Iltimos, ismingizni kiriting.";
        valid = false;
      }

      const attendance = $('input[name="attendance"]:checked', rsvpForm);
      if (!attendance) {
        $('input[name="attendance"]', rsvpForm)
          .closest("fieldset")
          .querySelector(".field-error").textContent = "Iltimos, qatnashishingizni belgilang.";
        valid = false;
      }

      if (!valid) {
        formStatus.textContent = "Majburiy maydonlarni to‘ldiring.";
        return;
      }

      const data = new FormData(rsvpForm);
      const payload = {
        fullName: sanitize(String(data.get("fullName") || "")),
        attendance: String(data.get("attendance") || ""),
        guestCount: Number(data.get("guestCount") || 1),
        children: String(data.get("children") || "no"),
        childrenCount: Number(data.get("childrenCount") || 0),
        childrenInfo: String(data.get("childrenInfo") || "").trim().slice(0, 150),
        wish: String(data.get("wish") || "").trim().slice(0, 500),
        savedAt: new Date().toISOString()
      };

      try {
        localStorage.setItem("urdushbek-durdona-royal-rsvp", JSON.stringify(payload));
        savedRsvpNotice.hidden = false;
        formStatus.textContent = "Rahmat! Javobingiz ushbu qurilmada saqlandi.";
        setTimeout(closeModal, 1600);
      } catch {
        formStatus.textContent = "Brauzer xotirasiga saqlashning imkoni bo‘lmadi.";
      }
    });

    function clearErrors() {
      $$(".field-error", rsvpForm).forEach(element => element.textContent = "");
      formStatus.textContent = "";
    }

    function trapFocus(event) {
      const focusable = $$(
        'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[href]',
        rsvpModal
      ).filter(element => element.offsetParent !== null);

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  function restoreRsvp() {
    try {
      const saved = JSON.parse(localStorage.getItem("urdushbek-durdona-royal-rsvp") || "null");
      if (!saved) return;

      savedRsvpNotice.hidden = false;
      $("#fullName").value = saved.fullName || "";

      const attendance = $(`input[name="attendance"][value="${saved.attendance}"]`);
      if (attendance) attendance.checked = true;

      $("#guestCount").value = String(saved.guestCount || 1);

      const children = $(`input[name="children"][value="${saved.children || "no"}"]`);
      if (children) children.checked = true;

      childrenFields.hidden = saved.children !== "yes";
      $('[name="childrenCount"]', rsvpForm).value = String(saved.childrenCount || 1);
      $('[name="childrenInfo"]', rsvpForm).value = saved.childrenInfo || "";
      $('[name="wish"]', rsvpForm).value = saved.wish || "";
    } catch {}
  }

  function initProgress() {
    const progress = $("#scrollProgress");

    const update = () => {
      const maximum = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = maximum > 0 ? (window.scrollY / maximum) * 100 : 0;
      progress.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
    };

    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  function initParticles() {
    const canvas = $("#particleCanvas");
    const context = canvas.getContext("2d");
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!context || reducedMotion) return;

    let particles = [];

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      particles = Array.from(
        { length: Math.min(42, Math.ceil(window.innerWidth / 10)) },
        () => ({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          radius: Math.random() * 1.6 + 0.4,
          speed: Math.random() * 0.22 + 0.05,
          drift: Math.random() * 0.18 - 0.09,
          alpha: Math.random() * 0.38 + 0.07
        })
      );
    }

    function draw() {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);

      particles.forEach(particle => {
        particle.y -= particle.speed;
        particle.x += particle.drift;

        if (particle.y < -8) {
          particle.y = window.innerHeight + 8;
          particle.x = Math.random() * window.innerWidth;
        }
        if (particle.x < -8) particle.x = window.innerWidth + 8;
        if (particle.x > window.innerWidth + 8) particle.x = -8;

        context.beginPath();
        context.fillStyle = `rgba(213,170,76,${particle.alpha})`;
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      });

      requestAnimationFrame(draw);
    }

    window.addEventListener("resize", resize);
    resize();
    draw();
  }

  init();
})();
(() => {
  "use strict";

  const config = {
    eventISO: "2026-08-06T19:00:00+05:00",
    timeline: [
  ["18:30", "Mehmonlarni kutib olish"],
  ["19:00", "To‘y tantanasining boshlanishi"],
  ["19:30", "Kelin-kuyovning kirib kelishi"],
  ["20:00", "Tabriklar va oq fotiha"],
  ["21:00", "Bayram dasturxoni"],
  ["22:00", "Musiqa, raqs va ko‘ngilochar dastur"]
]
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const preloader = $("#preloader");
  const intro = $("#royalIntro");
  const envelope = $("#royalEnvelope");
  const envelopeStage = $("#envelopeStage");
  const invitation = $("#invitation");
  const arrowOpenButton = $("#arrowOpenButton");
  const music = $("#backgroundMusic");
  const musicToggle = $("#musicToggle");

  let invitationOpened = false;

  function init() {
    buildTimeline();
    personalizeGuest();
    initCountdown();
    initReveal();
    initOpening();
    initMusic();
    initShare();
    initProgress();
    initParticles();

    window.addEventListener("load", () => {
      window.setTimeout(() => preloader.classList.add("hidden"), 260);
    });
  }

  function buildTimeline() {
    const timeline = $("#timeline");
    if (!timeline) return;

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
    const guest = sanitize(new URLSearchParams(window.location.search).get("guest") || "");
    const mainGreeting = $("#guestGreeting");
    const introGuest = $("#introGuestMessage");

    if (mainGreeting) {
      mainGreeting.textContent = guest ? `Hurmatli ${guest}!` : "Aziz mehmonimiz!";
    }

    if (introGuest) {
      const nameLine = introGuest.querySelector("span");
      const messageLine = introGuest.querySelector("strong");

      nameLine.textContent = guest ? `HURMATLI ${guest.toLocaleUpperCase("uz-UZ")}` : "HURMATLI MEHMONIMIZ";
      messageLine.textContent = "Ushbu taklifnoma Siz uchun";
    }
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

      window.setTimeout(() => {
        invitation.setAttribute("aria-hidden", "false");
        intro.classList.add("is-gone");
        musicToggle.hidden = false;
        window.scrollTo({ top: 0, behavior: "instant" });
      }, 3150);
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

    function updateNumber(selector, value, pad = true) {
      const element = $(selector);
      if (!element) return;

      const text = pad ? String(value).padStart(2, "0") : String(value);
      if (element.textContent === text) return;

      element.classList.add("flip");
      window.setTimeout(() => {
        element.textContent = text;
        element.classList.remove("flip");
      }, 125);
    }

    function tick() {
      const now = Date.now();
      const difference = target - now;

      if (difference <= 0) {
        const countdown = $("#countdown");
        const message = $("#countdownMessage");
        if (countdown) countdown.hidden = true;
        if (message) {
          message.hidden = false;
          message.textContent = now <= target + 6 * 60 * 60 * 1000
            ? "Bugun bizning baxtli kunimiz!"
            : "Baxtli kunimiz qalbimizda unutilmas xotira bo‘lib qoldi.";
        }
        return;
      }

      const days = Math.floor(difference / 86400000);
      const hours = Math.floor((difference % 86400000) / 3600000);
      const minutes = Math.floor((difference % 3600000) / 60000);
      const seconds = Math.floor((difference % 60000) / 1000);

      // Kunlar 025 emas, 25 / 9 / 3 ko‘rinishida chiqadi.
      updateNumber("#days", days, false);
      updateNumber("#hours", hours, true);
      updateNumber("#minutes", minutes, true);
      updateNumber("#seconds", seconds, true);
    }

    tick();
    window.setInterval(tick, 1000);
  }

  function initReveal() {
    if (!("IntersectionObserver" in window)) {
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
    musicToggle.setAttribute(
      "aria-label",
      isPlaying ? "Musiqani pauza qilish" : "Musiqani ijro etish"
    );
  }

  function initShare() {
    const button = $("#shareButton");
    const status = $("#shareStatus");
    if (!button || !status) return;

    button.addEventListener("click", async () => {
      const data = {
        title: "Urdushbek & Durdona — Nikoh to‘yiga taklifnoma",
        text: "6-avgust, 2026-yil, soat 19:00. “BEK” To‘y va tantanalar maskani, Jizzax.",
        url: window.location.href
      };

      try {
        if (navigator.share) {
          await navigator.share(data);
          status.textContent = "Taklifnoma ulashildi.";
        } else if (navigator.clipboard && window.location.protocol !== "file:") {
          await navigator.clipboard.writeText(window.location.href);
          status.textContent = "Taklifnoma havolasi nusxalandi.";
        } else {
          status.textContent = "GitHub Pages havolasini brauzer menyusi orqali ulashing.";
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          status.textContent = "Ulashishni yakunlab bo‘lmadi.";
        }
      }
    });
  }

  function initProgress() {
    const progress = $("#scrollProgress");
    if (!progress) return;

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
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

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

      window.requestAnimationFrame(draw);
    }

    window.addEventListener("resize", resize);
    resize();
    draw();
  }

  init();
})();

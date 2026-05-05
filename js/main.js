/* ATDRATE — site interactions */
(function () {
  "use strict";

  /* ============================================================
     CONFIG — backend
     ------------------------------------------------------------
     Both forms (Apply + Newsletter) POST JSON to the same Google
     Apps Script Web App. The script routes each submission to the
     correct sheet tab based on the `formType` field.

     After deploying the Apps Script (instructions in chat), paste
     the Web App URL here. Until then, forms run in "dev mode":
     UI behaves the same but no data is sent.
     ============================================================ */
  const CONFIG = {
    SHEETS_WEBAPP_URL: "https://script.google.com/macros/s/AKfycbysUuaps4qdiKIEoAAuIvw4OXiTMrPZe6AGEHBGuyIJ7rTgdYPUwfip9LliibIztMiGtg/exec"
  };

  function postToSheets(payload) {
    return new Promise((resolve) => {
      if (!CONFIG.SHEETS_WEBAPP_URL) {
        console.warn("[atdrate] SHEETS_WEBAPP_URL not configured — running in dev mode.");
        resolve();
        return;
      }

      // Hidden-iframe form POST. This is the only approach guaranteed to
      // bypass Chrome/Edge/Firefox/Safari tracking-prevention layers,
      // because it goes through the same path a normal HTML <form submit>
      // would — which no browser blocks.
      const iframeName = "atdrate_post_target";
      let iframe = document.querySelector('iframe[name="' + iframeName + '"]');
      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.name = iframeName;
        iframe.style.display = "none";
        document.body.appendChild(iframe);
      }

      const form = document.createElement("form");
      form.method = "POST";
      form.action = CONFIG.SHEETS_WEBAPP_URL;
      form.target = iframeName;
      form.acceptCharset = "utf-8";

      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "payload";
      input.value = JSON.stringify(payload);
      form.appendChild(input);

      document.body.appendChild(form);

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        if (form.parentNode) form.parentNode.removeChild(form);
        iframe.onload = null;
        resolve();
      };

      iframe.onload = finish;
      // Safety net: resolve after 4s even if onload never fires
      // (Apps Script's 302 redirect to googleusercontent.com may
      // be silently halted by tracking prevention; the POST itself
      // has already reached the script by then).
      setTimeout(finish, 4000);

      form.submit();
    });
  }

  /* ---- Mobile nav toggle ---- */
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll(".nav-links a").forEach(a => {
      a.addEventListener("click", () => nav.classList.remove("open"));
    });
  }

  /* ---- Mark active nav link by current path ---- */
  const here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".nav-links a").forEach(a => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (!href || href.startsWith("#")) return;
    if (href === here || (here === "" && href === "index.html")) {
      a.classList.add("active");
    }
  });

  /* ---- Approach accordion (homepage) ---- */
  const steps = document.querySelectorAll(".steps .step");
  steps.forEach(step => {
    step.addEventListener("click", () => {
      steps.forEach(s => s.classList.remove("open"));
      step.classList.add("open");
    });
    step.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        step.click();
      }
    });
  });

  /* ---- Services pillar tabs (smooth-scroll to section) ---- */
  document.querySelectorAll(".tabs .tab").forEach(tab => {
    tab.addEventListener("click", (e) => {
      const target = tab.getAttribute("data-target");
      if (!target) return;
      e.preventDefault();
      document.querySelectorAll(".tabs .tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const el = document.querySelector(target);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* ---- Insights filter tabs (filter by data-category) ---- */
  const filterTabs = document.querySelectorAll(".filterbar .tab");
  if (filterTabs.length) {
    filterTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        filterTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const cat = tab.getAttribute("data-filter");
        document.querySelectorAll("[data-category]").forEach(card => {
          const match = cat === "all" || card.getAttribute("data-category") === cat;
          card.style.display = match ? "" : "none";
        });
      });
    });
  }

  /* ---- Insights search ---- */
  const searchInput = document.querySelector(".search input");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.trim().toLowerCase();
      document.querySelectorAll("[data-category]").forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = !q || text.includes(q) ? "" : "none";
      });
    });
  }

  /* ---- Apply form: validate + POST to Google Sheets ---- */
  const form = document.querySelector("#apply-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      let ok = true;

      // Required fields
      form.querySelectorAll("[required]").forEach(input => {
        const wrap = input.closest(".field");
        const valid = input.checkValidity() && String(input.value).trim() !== "";
        input.classList.toggle("invalid", !valid);
        if (wrap) wrap.classList.toggle("has-error", !valid);
        if (!valid) ok = false;
      });

      // Pillars: at least one checked
      const pillars = form.querySelectorAll('input[name="pillars"]');
      const pillarWrap = form.querySelector("#pillars-field");
      if (pillars.length) {
        const any = Array.from(pillars).some(p => p.checked);
        if (pillarWrap) pillarWrap.classList.toggle("has-error", !any);
        if (!any) ok = false;
      }

      if (!ok) {
        const firstErr = form.querySelector(".has-error");
        if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      const original = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = "Submitting…"; }

      const fd = new FormData(form);
      const payload = {
        formType: "application",
        full_name: fd.get("full_name") || "",
        company:   fd.get("company")   || "",
        website:   fd.get("website")   || "",
        industry:  fd.get("industry")  || "",
        revenue:   fd.get("revenue")   || "",
        pillars:   fd.getAll("pillars"),
        challenge: fd.get("challenge") || "",
        success:   fd.get("success")   || "",
        referral:  fd.get("referral")  || ""
      };

      try {
        await postToSheets(payload);
        form.innerHTML =
          '<div style="padding:36px;text-align:center">' +
          '<h2 style="margin-bottom:8px">Application received.</h2>' +
          '<p class="muted">We review every application personally and reply within 48 hours if there is a strong fit.</p>' +
          '<p><a class="btn btn-primary" href="index.html">Back to home</a></p>' +
          '</div>';
      } catch (err) {
        console.error("[atdrate] application submit failed:", err);
        if (btn) { btn.disabled = false; btn.textContent = original || "Submit My Application"; }
        alert("We couldn't submit your application right now. Please email hello@atdrate.com or try again in a moment.");
      }
    });

    // Clear error state on edit
    form.addEventListener("input", (e) => {
      const t = e.target;
      const wrap = t.closest(".field");
      if (wrap) wrap.classList.remove("has-error");
      t.classList && t.classList.remove("invalid");
    });
  }

  /* ---- Newsletter: POST to Google Sheets ---- */
  const news = document.querySelector("#newsletter-form");
  if (news) {
    news.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = news.querySelector("input");
      const btn = news.querySelector("button");
      if (!input || !input.value.includes("@")) { input && input.focus(); return; }

      const original = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = "Subscribing…"; }

      try {
        await postToSheets({ formType: "newsletter", email: input.value.trim() });
        if (btn) btn.textContent = "Subscribed";
        input.disabled = true;
      } catch (err) {
        console.error("[atdrate] newsletter submit failed:", err);
        if (btn) { btn.disabled = false; btn.textContent = original || "Subscribe"; }
        alert("Subscription failed. Please try again in a moment.");
      }
    });
  }

  /* ---- Year in footer ---- */
  document.querySelectorAll("[data-year]").forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  /* ---- Welcome modal: opens 2s after first arrival, once per session ---- */
  const welcome = document.getElementById("welcome-modal");
  if (welcome) {
    const STORAGE_KEY = "atdrate_welcome_shown";
    let opened = false;
    let openTimer;

    const openWelcome = () => {
      if (opened) return;
      opened = true;
      welcome.classList.add("is-open");
      welcome.setAttribute("aria-hidden", "false");
      // Focus the first field after the slide-in finishes
      setTimeout(() => {
        const first = welcome.querySelector("input");
        if (first) first.focus();
      }, 380);
    };

    const closeWelcome = () => {
      welcome.classList.remove("is-open");
      welcome.setAttribute("aria-hidden", "true");
      try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch (e) {}
    };

    // Don't re-show on subsequent navigations within the same browser session
    let alreadyShown = false;
    try { alreadyShown = !!sessionStorage.getItem(STORAGE_KEY); } catch (e) {}

    if (!alreadyShown) {
      openTimer = setTimeout(openWelcome, 2000);
    }

    // Close on backdrop click, X, or Esc
    welcome.querySelectorAll("[data-close]").forEach(el => {
      el.addEventListener("click", closeWelcome);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && welcome.classList.contains("is-open")) {
        closeWelcome();
      }
    });

    // Form submit -> Google Sheets via the existing postToSheets pipeline
    const wForm = welcome.querySelector("#welcome-form");
    if (wForm) {
      wForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        let ok = true;
        wForm.querySelectorAll("[required]").forEach(input => {
          const wrap = input.closest(".field");
          const valid = input.checkValidity() && String(input.value).trim() !== "";
          input.classList.toggle("invalid", !valid);
          if (wrap) wrap.classList.toggle("has-error", !valid);
          if (!valid) ok = false;
        });
        if (!ok) {
          const firstErr = wForm.querySelector(".has-error input");
          if (firstErr) firstErr.focus();
          return;
        }

        const btn = wForm.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }

        const fd = new FormData(wForm);
        const payload = {
          formType: "welcome",
          name:    fd.get("name")    || "",
          contact: fd.get("contact") || "",
          email:   fd.get("email")   || "",
          reason:  fd.get("reason")  || ""
        };

        try {
          await postToSheets(payload);
          const card = welcome.querySelector(".welcome-modal__card");
          if (card) {
            card.innerHTML =
              '<div class="welcome-modal__success">' +
              '<h2>Thanks — we have you.</h2>' +
              '<p>A team member will be in touch within 48 hours.</p>' +
              '</div>';
          }
          try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch (e) {}
          setTimeout(closeWelcome, 2400);
        } catch (err) {
          console.error("[atdrate] welcome submit failed:", err);
          if (btn) { btn.disabled = false; btn.textContent = "Continue"; }
          alert("Something went wrong. Please try again or email hello@atdrate.com.");
        }
      });

      // Clear field-level errors on edit
      wForm.addEventListener("input", (e) => {
        const wrap = e.target.closest(".field");
        if (wrap) wrap.classList.remove("has-error");
        e.target.classList && e.target.classList.remove("invalid");
      });
    }
  }

  /* ---- Scroll reveal (IntersectionObserver) ---- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length) {
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
      revealEls.forEach(el => io.observe(el));
    } else {
      // Fallback: just show
      revealEls.forEach(el => el.classList.add("is-visible"));
    }
  }
})();

/* ============================================================
   THE COURSE LEDGER — app logic
   Storage: localStorage only. No backend required.
   Keys used:
     ledger_visits        -> total visit count (number)
     ledger_today         -> { date: 'YYYY-MM-DD', count: n }
     ledger_session_seen  -> sessionStorage flag so refresh doesn't
                             inflate "unique sessions" in one sitting
     ledger_reviews       -> JSON array of review objects
   ============================================================ */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     1. COURSE CATALOG DATA
     Real, well-known free resources. Links go straight to the
     relevant section where possible.
  --------------------------------------------------------- */
  const CATALOG = {
    fop: [
      {
        title: "CS50: Introduction to Computer Science",
        source: "Harvard / edX",
        desc: "The gold-standard intro course. Covers programming fundamentals in C, then Python — free to audit, certificate is paid.",
        tags: ["free", "cert"],
        url: "https://cs50.harvard.edu/x/"
      },
      {
        title: "Learn Python — Full Course for Beginners",
        source: "freeCodeCamp",
        desc: "A complete, free walkthrough of programming fundamentals using Python: variables, loops, functions, and basic data structures.",
        tags: ["free"],
        url: "https://www.freecodecamp.org/news/python-programming-for-beginners/"
      },
      {
        title: "Programming Fundamentals (C/C++ track)",
        source: "W3Schools",
        desc: "Reference-style lessons with a live editor — useful for working through FOP syntax and small exercises at your own pace.",
        tags: ["free"],
        url: "https://www.w3schools.com/cpp/"
      },
      {
        title: "Introduction to Programming",
        source: "Coursera (audit mode)",
        desc: "University-built fundamentals courses from partners like Duke and the University of Michigan — audit the full course for free.",
        tags: ["free", "cert"],
        url: "https://www.coursera.org/courses?query=introduction%20to%20programming"
      }
    ],
    oop: [
      {
        title: "Object Oriented Programming in Java",
        source: "freeCodeCamp (YouTube)",
        desc: "A full-length, free video course covering classes, objects, inheritance, polymorphism, and encapsulation in Java.",
        tags: ["free"],
        url: "https://www.youtube.com/c/Freecodecamp"
      },
      {
        title: "Java Tutorial — OOP Concepts",
        source: "W3Schools",
        desc: "Bite-sized lessons on classes, objects, inheritance, and interfaces with an in-browser code editor to test as you go.",
        tags: ["free"],
        url: "https://www.w3schools.com/java/java_oop.asp"
      },
      {
        title: "Object-Oriented Design",
        source: "Coursera (audit mode) — University of Alberta",
        desc: "Goes beyond syntax into OOP design principles — useful once you're comfortable writing classes and want to write them well.",
        tags: ["free", "cert"],
        url: "https://www.coursera.org/learn/object-oriented-design"
      },
      {
        title: "Python OOP Tutorial",
        source: "Programiz",
        desc: "Clear, example-driven explanations of OOP concepts in Python with runnable code snippets for every topic.",
        tags: ["free"],
        url: "https://www.programiz.com/python-programming/object-oriented-programming"
      }
    ],
    more: [
      {
        title: "The Odin Project",
        source: "theodinproject.com",
        desc: "A complete, free, project-based full-stack web development curriculum — great after you've covered FOP/OOP basics.",
        tags: ["free"],
        url: "https://www.theodinproject.com/"
      },
      {
        title: "freeCodeCamp Curriculum",
        source: "freeCodeCamp",
        desc: "Hundreds of free hours covering web development, data structures and algorithms, and more — certificates included, all free.",
        tags: ["free", "cert"],
        url: "https://www.freecodecamp.org/learn"
      },
      {
        title: "CS Courses Index",
        source: "MIT OpenCourseWare",
        desc: "Full lecture notes, assignments, and sometimes video for MIT's actual computer science courses, free to work through at your pace.",
        tags: ["free"],
        url: "https://ocw.mit.edu/search/?d=Electrical%20Engineering%20and%20Computer%20Science"
      },
      {
        title: "Khan Academy — Computer Programming",
        source: "Khan Academy",
        desc: "Friendly, visual introductions to programming concepts — a gentle on-ramp before diving into FOP/OOP proper.",
        tags: ["free"],
        url: "https://www.khanacademy.org/computing/computer-programming"
      }
    ]
  };

  /* ---------------------------------------------------------
     2. CATALOG RENDERING
  --------------------------------------------------------- */
  const ledgerListEl = document.getElementById("ledger-list");
  const tabs = document.querySelectorAll(".track-tab");

  function renderTrack(trackKey) {
    const entries = CATALOG[trackKey] || [];
    ledgerListEl.innerHTML = entries.map((entry, i) => {
      const tagHtml = entry.tags.map(t => {
        const label = t === "free" ? "Free" : t === "cert" ? "Cert available" : t;
        return `<span class="tag ${t}">${label}</span>`;
      }).join("");
      return `
        <div class="ledger-entry">
          <div class="entry-index">${String(i + 1).padStart(2, "0")}</div>
          <div class="entry-main">
            <h3>${escapeHtml(entry.title)}</h3>
            <p>${escapeHtml(entry.desc)} <strong>— ${escapeHtml(entry.source)}</strong></p>
            <div class="entry-tags">${tagHtml}</div>
          </div>
          <div class="entry-action">
            <a class="entry-link" href="${entry.url}" target="_blank" rel="noopener noreferrer">Visit source →</a>
          </div>
        </div>`;
    }).join("");
  }

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => { t.classList.remove("is-active"); t.setAttribute("aria-selected", "false"); });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
      renderTrack(tab.dataset.track);
    });
  });

  renderTrack("fop");

  // Update hero counts
  const totalCourses = Object.values(CATALOG).reduce((sum, arr) => sum + arr.length, 0);
  const uniqueSources = new Set(Object.values(CATALOG).flat().map(e => e.source));
  document.getElementById("hero-course-count").textContent = totalCourses;
  document.getElementById("hero-source-count").textContent = uniqueSources.size;

  /* ---------------------------------------------------------
     3. VISIT COUNTER (localStorage based, no backend)
  --------------------------------------------------------- */
  function pad(n) { return String(n).padStart(7, "0"); }
  function todayStr() { return new Date().toISOString().slice(0, 10); }

  function bumpVisitCount() {
    let total = parseInt(localStorage.getItem("ledger_visits") || "0", 10);

    // Only count once per browser session (tab lifetime) to avoid
    // inflating numbers on every page refresh.
    const alreadyCountedThisSession = sessionStorage.getItem("ledger_session_seen");
    if (!alreadyCountedThisSession) {
      total += 1;
      localStorage.setItem("ledger_visits", String(total));
      sessionStorage.setItem("ledger_session_seen", "1");

      // unique sessions = count of distinct browser sessions ever seen
      let sessions = parseInt(localStorage.getItem("ledger_unique_sessions") || "0", 10);
      sessions += 1;
      localStorage.setItem("ledger_unique_sessions", String(sessions));

      // today's count
      let todayData = JSON.parse(localStorage.getItem("ledger_today") || "null");
      if (!todayData || todayData.date !== todayStr()) {
        todayData = { date: todayStr(), count: 0 };
      }
      todayData.count += 1;
      localStorage.setItem("ledger_today", JSON.stringify(todayData));
    }

    return {
      total: total,
      sessions: parseInt(localStorage.getItem("ledger_unique_sessions") || "0", 10),
      today: (JSON.parse(localStorage.getItem("ledger_today") || "null") || { count: 0 }).count
    };
  }

  /* ---------------------------------------------------------
     4. REVIEWS (localStorage based)
  --------------------------------------------------------- */
  function getReviews() {
    try {
      return JSON.parse(localStorage.getItem("ledger_reviews") || "[]");
    } catch (e) {
      return [];
    }
  }

  function saveReviews(reviews) {
    localStorage.setItem("ledger_reviews", JSON.stringify(reviews));
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderReviews() {
    const reviews = getReviews();
    const listEl = document.getElementById("recent-list");

    if (reviews.length === 0) {
      listEl.innerHTML = `<p class="review-empty">No reviews filed yet on this device. Be the first to add one above.</p>`;
    } else {
      listEl.innerHTML = reviews.slice().reverse().slice(0, 25).map(r => {
        const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
        return `
          <div class="review-card">
            <div class="review-top">
              <span class="review-name">${escapeHtml(r.name)}</span>
              <span class="review-course">${escapeHtml(r.course)}</span>
            </div>
            <span class="review-stars">${stars}</span>
            <p class="review-msg">${escapeHtml(r.message)}</p>
          </div>`;
      }).join("");
    }

    updateStatsDisplay();
  }

  function updateStatsDisplay() {
    const reviews = getReviews();
    const total = parseInt(localStorage.getItem("ledger_visits") || "0", 10);
    const sessions = parseInt(localStorage.getItem("ledger_unique_sessions") || "0", 10);
    const today = (JSON.parse(localStorage.getItem("ledger_today") || "null") || { count: 0 }).count;

    const avg = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)
      : 0;

    document.getElementById("stat-visits").textContent = pad(total);
    document.getElementById("stat-sessions").textContent = pad(sessions);
    document.getElementById("stat-reviews").textContent = pad(reviews.length);
    document.getElementById("stat-avg").textContent = reviews.length ? avg.toFixed(1) : "--";

    document.getElementById("card-visits").textContent = total.toLocaleString();
    document.getElementById("card-reviews").textContent = reviews.length.toLocaleString();
    document.getElementById("card-rating").textContent = reviews.length ? avg.toFixed(1) : "0.0";
    document.getElementById("card-today").textContent = today.toLocaleString();
  }

  /* ---------------------------------------------------------
     5. FEEDBACK FORM WIRING
  --------------------------------------------------------- */
  const starButtons = document.querySelectorAll(".star");
  const ratingInput = document.getElementById("f-rating");

  starButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const val = parseInt(btn.dataset.val, 10);
      ratingInput.value = val;
      starButtons.forEach(b => {
        b.classList.toggle("is-on", parseInt(b.dataset.val, 10) <= val);
      });
    });
  });

  const form = document.getElementById("feedback-form");
  const statusEl = document.getElementById("form-status");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("f-name").value.trim();
    const course = document.getElementById("f-course").value.trim();
    const message = document.getElementById("f-message").value.trim();
    const rating = parseInt(ratingInput.value, 10);

    if (!name || !course || !message) {
      statusEl.textContent = "Please fill in your name, the course, and a short review.";
      statusEl.classList.add("is-error");
      return;
    }
    if (!rating || rating < 1) {
      statusEl.textContent = "Please choose a star rating before submitting.";
      statusEl.classList.add("is-error");
      return;
    }

    const reviews = getReviews();
    reviews.push({
      name: name.slice(0, 40),
      course: course.slice(0, 60),
      message: message.slice(0, 400),
      rating: rating,
      ts: Date.now()
    });
    saveReviews(reviews);

    statusEl.classList.remove("is-error");
    statusEl.textContent = "Thanks — your review has been filed in the ledger.";

    form.reset();
    ratingInput.value = "0";
    starButtons.forEach(b => b.classList.remove("is-on"));

    renderReviews();

    setTimeout(() => { statusEl.textContent = ""; }, 4000);
  });

  document.getElementById("clear-reviews").addEventListener("click", () => {
    if (confirm("Remove all reviews stored in this browser? This can't be undone.")) {
      saveReviews([]);
      renderReviews();
    }
  });

  /* ---------------------------------------------------------
     6. INIT
  --------------------------------------------------------- */
  document.getElementById("footer-year").textContent = new Date().getFullYear();
  bumpVisitCount();
  renderReviews(); // also calls updateStatsDisplay
})();

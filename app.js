(function () {

  "use strict";

  /* =====================================================
     ⚠️ SINGLE SOURCE OF TRUTH ⚠️

     Every page must load ONLY this script (plus its own
     page markup). Do NOT add extra inline <script> blocks
     that write to localStorage directly — that is exactly
     what caused user data to leak between accounts.

     Storage model:

       skillbridge_users   -> { [email]: { name, email, password,
                                 profile, course, mentor, target,
                                 goals, preferences, registeredAt } }

       skillbridge_session -> { email, loggedInAt }

     There are NO other top-level keys. Course, mentor,
     profile, target and goals all live INSIDE the current
     user's object, keyed by their email. That is what makes
     the data per-user instead of per-device.
  ===================================================== */

  const USERS_KEY = "skillbridge_users";
  const SESSION_KEY = "skillbridge_session";

  const $ = (selector) => document.querySelector(selector);

  /* =====================================================
     LOW LEVEL STORAGE HELPERS
  ===================================================== */

  function getUsers() {
    try {
      const stored = localStorage.getItem(USERS_KEY);
      if (!stored) return {};
      const users = JSON.parse(stored);
      return users && typeof users === "object" && !Array.isArray(users)
        ? users
        : {};
    } catch (error) {
      console.error("Unable to read users:", error);
      return {};
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function getSession() {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  function getCurrentUser() {
    const session = getSession();
    if (!session || !session.email) return null;
    const users = getUsers();
    return users[session.email] || null;
  }

  function saveCurrentUser(updatedUser) {
    const session = getSession();
    if (!session || !session.email) return;
    const users = getUsers();
    users[session.email] = updatedUser;
    saveUsers(users);
  }

  /* =====================================================
     PAGE PROTECTION
     Any page other than index.html / register.html requires
     a valid logged-in user whose email exists in the users
     table. If not, bounce back to sign in.
  ===================================================== */

  const isAuthPage =
    location.pathname.endsWith("index.html") ||
    location.pathname.endsWith("register.html") ||
    location.pathname === "/" ||
    location.pathname.endsWith("/");

  let user = getCurrentUser();

  if (!user && !isAuthPage) {
    location.replace("index.html");
    return;
  }

  /* Backfill any missing sub-objects so older accounts don't crash */
  if (user) {
    user.profile = user.profile || { phone: "", college: "", focus: "", bio: "" };
    user.goals = Array.isArray(user.goals) ? user.goals : [];
    user.preferences = user.preferences || { reminder: false, mentor: true };
  }

  /* =====================================================
     TOAST
  ===================================================== */

  function toast(message) {
    const element = $("#toast");
    if (!element) return;
    element.textContent = message;
    element.classList.add("show");
    setTimeout(() => element.classList.remove("show"), 2600);
  }

  /* =====================================================
     INITIALS / SHELL (name, avatar, email, mobile menu)
  ===================================================== */

  function initials(name) {
    return (name || "Student")
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  function shell() {
    if (!user) return;

    document.querySelectorAll(".user-name").forEach((el) => {
      el.textContent = user.name || "Student";
    });

    document.querySelectorAll(".user-initial").forEach((el) => {
      el.textContent = initials(user.name);
    });

    document.querySelectorAll(".user-email").forEach((el) => {
      el.textContent = user.email || "";
    });

    const menuButton = $("#menuButton");
    const sidebar = $("#sidebar");

    if (menuButton && sidebar) {
      menuButton.onclick = () => sidebar.classList.toggle("open");

      sidebar.querySelectorAll(".nav-item").forEach((link) => {
        link.addEventListener("click", () => sidebar.classList.remove("open"));
      });
    }
  }

  shell();

  /* =====================================================
     COURSES
  ===================================================== */

  const courses = [
    { id: "web", title: "Web Development", kind: "software", icon: "</>", color: "violet",
      level: "Beginner friendly", time: "6 weeks",
      desc: "Build responsive websites with HTML, CSS and JavaScript.",
      mentor: "Riya Krishnan", specialty: "Full-stack development" },

    { id: "frontend", title: "Frontend Development", kind: "software", icon: "UI", color: "blue",
      level: "Beginner friendly", time: "5 weeks",
      desc: "Learn HTML, CSS, JavaScript and modern frontend development.",
      mentor: "Karthik Rao", specialty: "Software engineering" },

    { id: "backend", title: "Backend Development", kind: "software", icon: "BE", color: "violet",
      level: "Intermediate", time: "7 weeks",
      desc: "Build APIs, server-side applications and database-driven systems.",
      mentor: "Karthik Rao", specialty: "Software engineering" },

    { id: "fullstack", title: "Full-Stack Development", kind: "software", icon: "FS", color: "teal",
      level: "Intermediate", time: "10 weeks",
      desc: "Master frontend, backend, APIs and databases to build complete applications.",
      mentor: "Riya Krishnan", specialty: "Full-stack development" },

    { id: "javascript", title: "JavaScript Programming", kind: "software", icon: "JS", color: "orange",
      level: "Beginner friendly", time: "5 weeks",
      desc: "Learn JavaScript fundamentals, DOM manipulation and modern programming.",
      mentor: "Priya Sharma", specialty: "Interview coaching" },

    { id: "python", title: "Python Programming", kind: "software", icon: "PY", color: "blue",
      level: "Beginner friendly", time: "6 weeks",
      desc: "Learn Python programming, problem solving and practical application development.",
      mentor: "Vikram Shah", specialty: "Data & analytics" },

    { id: "data", title: "Data Analytics", kind: "software", icon: "⌁", color: "blue",
      level: "Beginner friendly", time: "5 weeks",
      desc: "Learn to find insights with spreadsheets, SQL and dashboards.",
      mentor: "Vikram Shah", specialty: "Data & analytics" },

    { id: "cloud", title: "Cloud Computing", kind: "software", icon: "☁", color: "blue",
      level: "Intermediate", time: "6 weeks",
      desc: "Understand cloud services, deployment, storage and scalable applications.",
      mentor: "Ananya Das", specialty: "Cloud computing" },

    { id: "cybersecurity", title: "Cybersecurity", kind: "software", icon: "⌾", color: "coral",
      level: "Intermediate", time: "7 weeks",
      desc: "Learn cybersecurity fundamentals, network security and secure applications.",
      mentor: "Rahul Verma", specialty: "Cybersecurity" },

    { id: "ai", title: "Artificial Intelligence", kind: "software", icon: "AI", color: "violet",
      level: "Intermediate", time: "8 weeks",
      desc: "Explore AI concepts, machine learning fundamentals and intelligent systems.",
      mentor: "Divya Menon", specialty: "Artificial intelligence" },

    { id: "embedded", title: "Embedded Systems", kind: "hardware", icon: "⚙", color: "orange",
      level: "Hands-on pathway", time: "7 weeks",
      desc: "Create real devices using Arduino, sensors and C basics.",
      mentor: "Arun Menon", specialty: "Embedded systems" },

    { id: "iot", title: "IoT & Smart Devices", kind: "hardware", icon: "◉", color: "teal",
      level: "Hands-on pathway", time: "6 weeks",
      desc: "Connect sensors and devices to solve everyday problems.",
      mentor: "Meera Nair", specialty: "IoT prototyping" },

    { id: "robotics", title: "Robotics", kind: "hardware", icon: "RB", color: "orange",
      level: "Intermediate", time: "8 weeks",
      desc: "Learn robotics fundamentals, sensors, motors and robotic control.",
      mentor: "Sanjay Kumar", specialty: "Robotics" },

    { id: "electronics", title: "Digital Electronics", kind: "hardware", icon: "DE", color: "gold",
      level: "Beginner friendly", time: "5 weeks",
      desc: "Understand digital circuits, logic gates, multiplexers and digital systems.",
      mentor: "Meena Iyer", specialty: "IoT & electronics" },

    { id: "vlsi", title: "VLSI Design", kind: "hardware", icon: "VL", color: "violet",
      level: "Advanced", time: "8 weeks",
      desc: "Learn digital VLSI concepts, HDL basics and chip design fundamentals.",
      mentor: "Naveen Raj", specialty: "VLSI design" }
  ];

  let selectedCourse = null;

  function courseCard(course) {
    return `
      <article class="course-card" data-kind="${course.kind}" data-course="${course.id}">
        <div class="course-icon ${course.color}">${course.icon}</div>
        <span class="kind-pill">${course.kind}</span>
        <h2>${course.title}</h2>
        <p>${course.desc}</p>
        <div class="course-meta">
          <span>${course.level}</span>
          <span>${course.time}</span>
        </div>
        <button class="course-open" type="button">Explore pathway <b>→</b></button>
      </article>
    `;
  }

  function initCourses() {
    const grid = $("#courseGrid");
    if (!grid) return;

    const search = $("#courseSearch");
    const filters = document.querySelectorAll("[data-filter]");

    const render = () => {
      const query = search ? search.value.toLowerCase() : "";
      const active = document.querySelector(".filter.active");
      const filter = active ? active.dataset.filter : "all";

      const filtered = courses.filter((course) => {
        const matchesFilter = filter === "all" || course.kind === filter;
        const text = `${course.title} ${course.desc} ${course.specialty}`.toLowerCase();
        const matchesSearch = !query || text.includes(query);
        return matchesFilter && matchesSearch;
      });

      grid.innerHTML = filtered.length
        ? filtered.map(courseCard).join("")
        : `<p class="empty">No pathways found. Try another search.</p>`;

      grid.querySelectorAll(".course-card").forEach((card) => {
        card.onclick = () => {
          const course = courses.find((item) => item.id === card.dataset.course);
          openCourse(course);
        };
      });
    };

    render();

    if (search) search.oninput = render;

    filters.forEach((button) => {
      button.onclick = () => {
        filters.forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        render();
      };
    });

    document.querySelectorAll(".modal-close").forEach((button) => {
      button.onclick = () => {
        const modal = $("#courseModal");
        if (modal) modal.hidden = true;
      };
    });

    const enrolButton = $("#enrolButton");
    if (enrolButton) {
      enrolButton.onclick = () => {
        if (!selectedCourse || !user) return;

        /* Saved ONLY onto the logged-in user's own record */
        user.course = {
          id: selectedCourse.id,
          title: selectedCourse.title,
          kind: selectedCourse.kind
        };

        user.mentor = {
          name: selectedCourse.mentor,
          specialty: selectedCourse.specialty
        };

        saveCurrentUser(user);

        const modal = $("#courseModal");
        if (modal) modal.hidden = true;

        toast(`${selectedCourse.title} added. ${selectedCourse.mentor} is now your mentor.`);
      };
    }
  }

  function openCourse(course) {
    if (!course) return;
    selectedCourse = course;

    const title = $("#modalTitle");
    const text = $("#modalText");
    const extra = $("#hardwareExtra");
    const modal = $("#courseModal");

    if (title) title.textContent = course.title;
    if (text) text.textContent = course.desc;

    if (extra) {
      extra.innerHTML = `
        <div class="hardware-note">
          <strong>✓ Mentor guidance included</strong>
          <p>Get guidance, feedback and practical learning support from ${course.mentor}.</p>
        </div>
      `;
    }

    if (modal) modal.hidden = false;
  }

  /* =====================================================
     MENTORS
  ===================================================== */

  const mentors = [
    { id: "riya-krishnan", name: "Riya Krishnan", initial: "RK", area: "Full-stack development", kind: "software",
      about: "Build portfolio-ready web projects and develop strong full-stack skills.", color: "teal" },
    { id: "karthik-rao", name: "Karthik Rao", initial: "KR", area: "Software engineering", kind: "software",
      about: "Practical guidance for software engineering, Git and application development.", color: "violet" },
    { id: "priya-sharma", name: "Priya Sharma", initial: "PS", area: "Interview coaching", kind: "software",
      about: "Practice technical interviews, communication and professional confidence.", color: "coral" },
    { id: "vikram-shah", name: "Vikram Shah", initial: "VS", area: "Data & analytics", kind: "software",
      about: "Build analytical thinking and learn how to present data insights clearly.", color: "blue" },
    { id: "meera-nair", name: "Meera Nair", initial: "MN", area: "IoT prototyping", kind: "hardware",
      about: "Create connected prototypes using sensors, controllers and IoT platforms.", color: "teal" },
    { id: "arun-menon", name: "Arun Menon", initial: "AM", area: "Embedded systems", kind: "hardware",
      about: "Turn embedded concepts into practical Arduino and microcontroller projects.", color: "gold" },
    { id: "ananya-das", name: "Ananya Das", initial: "AD", area: "Cloud computing", kind: "software",
      about: "Learn cloud architecture, deployment and scalable application development.", color: "blue" },
    { id: "rahul-verma", name: "Rahul Verma", initial: "RV", area: "Cybersecurity", kind: "software",
      about: "Learn security fundamentals, secure coding and network protection.", color: "coral" },
    { id: "divya-menon", name: "Divya Menon", initial: "DM", area: "Artificial intelligence", kind: "software",
      about: "Explore AI, machine learning and intelligent application development.", color: "violet" },
    { id: "sanjay-kumar", name: "Sanjay Kumar", initial: "SK", area: "Robotics", kind: "hardware",
      about: "Build robotics projects using sensors, motors and control systems.", color: "orange" },
    { id: "meena-iyer", name: "Meena Iyer", initial: "MI", area: "IoT & electronics", kind: "hardware",
      about: "Mentoring for IoT, electronics and connected device projects.", color: "teal" },
    { id: "naveen-raj", name: "Naveen Raj", initial: "NR", area: "VLSI design", kind: "hardware",
      about: "Learn digital design, HDL and VLSI fundamentals.", color: "violet" }
  ];

  function initMentors() {
    const grid = $("#mentorGrid");
    if (!grid) return;

    const search = $("#mentorSearch");

    const renderAssigned = () => {
      const panel = $("#assignedMentorPanel");
      if (!panel) return;

      const mentor = user ? user.mentor : null;

      if (mentor) {
        panel.innerHTML = `
          <span class="mentor-avatar teal">${initials(mentor.name)}</span>
          <div>
            <p class="eyebrow">YOUR ASSIGNED MENTOR</p>
            <h2>${mentor.name}</h2>
            <p>${mentor.specialty} · Available for guidance</p>
          </div>
          <a href="courses.html" class="text-button">Change pathway →</a>
        `;
      } else {
        panel.innerHTML = `
          <div>
            <p class="eyebrow">NO MENTOR ASSIGNED YET</p>
            <h2>Choose a mentor to start your guidance journey.</h2>
          </div>
          <a href="courses.html" class="primary-inline">Explore courses →</a>
        `;
      }
    };

    const render = () => {
      const query = search ? search.value.toLowerCase() : "";
      const active = document.querySelector(".filter.active");
      const kind = active ? active.dataset.specialty || "all" : "all";
      const assignedMentor = user ? user.mentor : null;

      const filtered = mentors.filter((mentor) => {
        const matchesKind = kind === "all" || mentor.kind === kind;
        const text = `${mentor.name} ${mentor.area} ${mentor.about}`.toLowerCase();
        const matchesSearch = !query || text.includes(query);
        return matchesKind && matchesSearch;
      });

      grid.innerHTML = filtered.length
        ? filtered.map((mentor) => {
            const isSelected = assignedMentor && assignedMentor.name === mentor.name;
            return `
              <article class="mentor-person ${isSelected ? "mentor-selected" : ""}">
                <span class="mentor-avatar ${mentor.color}">${mentor.initial}</span>
                <span class="availability">Available</span>
                <h2>${mentor.name}</h2>
                <p class="mentor-area">${mentor.area}</p>
                <p>${mentor.about}</p>
                ${isSelected ? `<span class="mentor-assigned-label">✓ Your assigned mentor</span>` : ""}
                <button class="mentor-select" data-name="${mentor.name}" type="button">
                  ${isSelected ? "Assigned ✓" : "Choose mentor →"}
                </button>
              </article>
            `;
          }).join("")
        : `<p class="empty">No mentors found.</p>`;

      grid.querySelectorAll(".mentor-select").forEach((button) => {
        button.onclick = () => {
          const mentor = mentors.find((item) => item.name === button.dataset.name);
          if (!mentor || !user) return;

          /* Saved ONLY onto the logged-in user's own record */
          user.mentor = { name: mentor.name, specialty: mentor.area };
          saveCurrentUser(user);

          render();
          renderAssigned();
          toast(`${mentor.name} is now your assigned mentor.`);
        };
      });
    };

    renderAssigned();
    render();

    if (search) search.oninput = render;

    document.querySelectorAll("[data-specialty]").forEach((button) => {
      button.onclick = () => {
        document.querySelectorAll("[data-specialty]").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        render();
      };
    });
  }

  /* =====================================================
     DASHBOARD SUMMARY (mentor card + profile dropdown)
  ===================================================== */

  function initDashboard() {
    if (!user) return;

    const mentorName = $("#dashboardMentorName");
    const mentorSpecialty = $("#dashboardMentorSpecialty");
    const mentorAvatar = $("#dashboardMentorAvatar");

    if (user.mentor) {
      if (mentorName) mentorName.textContent = user.mentor.name;
      if (mentorSpecialty) mentorSpecialty.textContent = user.mentor.specialty;
      if (mentorAvatar) mentorAvatar.textContent = initials(user.mentor.name);
    } else {
      if (mentorName) mentorName.textContent = "No mentor selected";
      if (mentorSpecialty) mentorSpecialty.textContent = "Choose a mentor to start your journey";
      if (mentorAvatar) mentorAvatar.textContent = "?";
    }

    const courseName = $("#dashboardCourseName");
    if (courseName) {
      courseName.textContent = user.course ? user.course.title : "No pathway selected yet";
    }

    /* Profile dropdown, if present on this page */
    const dropdownName = $("#dropdownName");
    const dropdownFullName = $("#dropdownFullName");
    const dropdownEmail = $("#dropdownEmail");
    const dropdownAvatar = $("#dropdownAvatar");
    const dropdownPhone = $("#dropdownPhone");
    const dropdownCollege = $("#dropdownCollege");
    const dropdownFocus = $("#dropdownFocus");
    const dropdownBio = $("#dropdownBio");
    const savedProfileDetails = $("#savedProfileDetails");
    const greetingName = $("#greetingName");

    if (greetingName) greetingName.textContent = (user.name || "Student").split(" ")[0];
    if (dropdownName) dropdownName.textContent = user.name || "Student";
    if (dropdownFullName) dropdownFullName.textContent = user.name || "Student";
    if (dropdownEmail) dropdownEmail.textContent = user.email || "Not available";
    if (dropdownAvatar) dropdownAvatar.textContent = initials(user.name);

    const hasProfile = user.profile && (user.profile.phone || user.profile.college || user.profile.focus || user.profile.bio);

    if (savedProfileDetails) {
      savedProfileDetails.classList.toggle("show", !!hasProfile);
    }

    if (dropdownPhone) dropdownPhone.textContent = (user.profile && user.profile.phone) || "Not provided";
    if (dropdownCollege) dropdownCollege.textContent = (user.profile && user.profile.college) || "Not provided";
    if (dropdownFocus) dropdownFocus.textContent = (user.profile && user.profile.focus) || "Not selected";
    if (dropdownBio) dropdownBio.textContent = (user.profile && user.profile.bio) || "No introduction added";

    const profileButton = $("#profileButton");
    const profileDropdown = $("#profileDropdown");
    const profileArrow = $("#profileArrow");

    if (profileButton && profileDropdown) {
      profileButton.onclick = (event) => {
        event.stopPropagation();
        const isOpen = profileDropdown.classList.contains("show");
        profileDropdown.classList.toggle("show", !isOpen);
        profileButton.setAttribute("aria-expanded", isOpen ? "false" : "true");
        if (profileArrow) profileArrow.textContent = isOpen ? "⌄" : "⌃";
      };

      document.addEventListener("click", (event) => {
        if (!profileDropdown.contains(event.target) && !profileButton.contains(event.target)) {
          profileDropdown.classList.remove("show");
          profileButton.setAttribute("aria-expanded", "false");
          if (profileArrow) profileArrow.textContent = "⌄";
        }
      });
    }
  }

  /* =====================================================
     PROFILE PAGE
  ===================================================== */

  function initProfile() {
    const form = $("#profileForm");
    if (!form || !user) return;

    const profile = user.profile;

    const nameInput = $("#profileName");
    const phoneInput = $("#profilePhone");
    const collegeInput = $("#profileCollege");
    const focusInput = $("#profileFocus");
    const bioInput = $("#profileBio");

    if (nameInput) nameInput.value = user.name || "";
    if (phoneInput) phoneInput.value = profile.phone || "";
    if (collegeInput) collegeInput.value = profile.college || "";
    if (focusInput) focusInput.value = profile.focus || "";
    if (bioInput) bioInput.value = profile.bio || "";

    const summaryName = $("#summaryName");
    const summaryEmail = $("#summaryEmail");
    const profileAvatar = $("#profileAvatar");
    const profilePath = $("#profilePath");

    function updateSummary() {
      if (summaryName) summaryName.textContent = user.name || "Student";
      if (summaryEmail) summaryEmail.textContent = user.email || "";
      if (profileAvatar) profileAvatar.textContent = initials(user.name);
      if (profilePath) profilePath.textContent = user.profile.focus || "Exploring pathways";
    }

    updateSummary();

    form.onsubmit = (event) => {
      event.preventDefault();

      const name = nameInput ? nameInput.value.trim() : user.name;

      if (!name || name.length < 2) {
        const message = $("#profileMessage");
        if (message) {
          message.textContent = "Enter your full name.";
          message.className = "form-message error";
        }
        return;
      }

      user.name = name;

      user.profile = {
        phone: phoneInput ? phoneInput.value.trim() : "",
        college: collegeInput ? collegeInput.value.trim() : "",
        focus: focusInput ? focusInput.value : "",
        bio: bioInput ? bioInput.value.trim() : ""
      };

      saveCurrentUser(user);

      shell();
      updateSummary();

      const message = $("#profileMessage");
      if (message) {
        message.textContent = "Profile saved successfully.";
        message.className = "form-message success";
      }

      toast("Your profile has been saved.");
    };
  }

  /* =====================================================
     TARGETS
  ===================================================== */

  function initTargets() {
    const form = $("#targetForm");
    if (!form || !user) return;

    const target = user.target || {};

    const roleInput = $("#targetRole");
    const dateInput = $("#targetDate");
    const whyInput = $("#targetWhy");
    const titleEl = $("#targetTitle");
    const descriptionEl = $("#targetDescription");

    if (roleInput) roleInput.value = target.role || "";
    if (dateInput) dateInput.value = target.date || "";
    if (whyInput) whyInput.value = target.why || "";

    if (target.role) {
      if (titleEl) titleEl.textContent = target.role;
      if (descriptionEl) descriptionEl.textContent = target.why || "Your career direction is set.";
    }

    form.onsubmit = (event) => {
      event.preventDefault();

      user.target = {
        role: roleInput ? (roleInput.value.trim() || "Land a meaningful opportunity") : "Land a meaningful opportunity",
        date: dateInput ? dateInput.value : "",
        why: whyInput ? whyInput.value.trim() : ""
      };

      saveCurrentUser(user);

      if (titleEl) titleEl.textContent = user.target.role;
      if (descriptionEl) descriptionEl.textContent = user.target.why || "Your career direction is set.";

      toast("Career target saved.");
    };
  }

  /* =====================================================
     GOALS
  ===================================================== */

  function initGoals() {
    const list = $("#goalList");
    if (!list || !user) return;

    if (!user.goals.length) {
      user.goals = [
        { text: "Practice 5 interview questions", done: false },
        { text: "Complete one course lesson", done: false },
        { text: "Spend 30 minutes on aptitude", done: false }
      ];
    }

    const render = () => {
      list.innerHTML = user.goals.map((goal, index) => {
        const item = typeof goal === "string" ? { text: goal, done: false } : goal;
        if (typeof goal === "string") user.goals[index] = item;

        return `
          <article class="goal-item ${item.done ? "done" : ""}">
            <button class="goal-check" data-i="${index}" type="button" aria-label="Complete goal">
              ${item.done ? "✓" : ""}
            </button>
            <span>${item.text}</span>
            <button class="goal-delete" data-d="${index}" type="button" aria-label="Delete goal">×</button>
          </article>
        `;
      }).join("");

      list.querySelectorAll(".goal-check").forEach((button) => {
        button.onclick = () => {
          const index = Number(button.dataset.i);
          user.goals[index].done = !user.goals[index].done;
          saveCurrentUser(user);
          render();
        };
      });

      list.querySelectorAll(".goal-delete").forEach((button) => {
        button.onclick = () => {
          const index = Number(button.dataset.d);
          user.goals.splice(index, 1);
          saveCurrentUser(user);
          render();
        };
      });
    };

    const addGoal = $("#addGoal");
    const goalInput = $("#goalInput");

    if (addGoal) {
      addGoal.onclick = () => {
        const text = goalInput ? goalInput.value.trim() : "";
        if (!text) return;

        user.goals.push({ text, done: false });
        saveCurrentUser(user);

        if (goalInput) goalInput.value = "";
        render();
      };
    }

    render();
  }

  /* =====================================================
     SETTINGS / LOGOUT
  ===================================================== */

  function initSettings() {
    const logoutButton = $("#logoutButton");
    if (!logoutButton || !user) return;

    const reminderToggle = $("#reminderToggle");
    const mentorToggle = $("#mentorToggle");

    if (reminderToggle) reminderToggle.checked = !!user.preferences.reminder;
    if (mentorToggle) mentorToggle.checked = !!user.preferences.mentor;

    function savePreferences() {
      user.preferences = {
        reminder: reminderToggle ? reminderToggle.checked : false,
        mentor: mentorToggle ? mentorToggle.checked : true
      };
      saveCurrentUser(user);
      toast("Preference saved.");
    }

    if (reminderToggle) reminderToggle.onchange = savePreferences;
    if (mentorToggle) mentorToggle.onchange = savePreferences;

    logoutButton.onclick = () => {

      /* Only the session needs to be removed — course, mentor,
         profile, target and goals all live inside the user's
         own record in skillbridge_users, so nothing leaks to
         the next person who logs in on this device. */

      localStorage.removeItem(SESSION_KEY);

      /* Defensive cleanup: remove any stray keys left behind by
         an older/broken version of this app, in case this browser
         still has them from before. Safe no-ops if absent. */

      [
        "skillbridge_selected_course",
        "skillbridge_selected_mentor",
        "skillbridge_profile",
        "skillbridgeProfile",
        "skillbridgeUser",
        "skillbridge_data_owner",
        "skillbridge_active_owner"
      ].forEach((key) => localStorage.removeItem(key));

      location.href = "index.html";
    };
  }

  /* =====================================================
     INITIALIZE EVERYTHING (each init() is a no-op if the
     relevant elements aren't on the current page)
  ===================================================== */

  initCourses();
  initMentors();
  initDashboard();
  initProfile();
  initTargets();
  initGoals();
  initSettings();

})();
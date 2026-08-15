(function () {

  "use strict";

  /* =====================================================
     STORAGE
  ===================================================== */

  const USERS_KEY = "skillbridge_users";
  const SESSION_KEY = "skillbridge_session";


  /* =====================================================
     HELPERS
  ===================================================== */

  const $ = (selector) => document.querySelector(selector);


  function getUsers() {
    try {
      const stored = localStorage.getItem(USERS_KEY);

      if (!stored) return {};

      const users = JSON.parse(stored);

      return (
        users &&
        typeof users === "object" &&
        !Array.isArray(users)
      )
        ? users
        : {};

    } catch (error) {
      console.error("Unable to read users:", error);
      return {};
    }
  }


  function saveUsers(users) {
    localStorage.setItem(
      USERS_KEY,
      JSON.stringify(users)
    );
  }


  function getSession() {
    try {
      const stored =
        localStorage.getItem(SESSION_KEY);

      if (!stored) return null;

      const session = JSON.parse(stored);

      if (!session || !session.email) {
        return null;
      }

      return session;

    } catch (error) {
      return null;
    }
  }


  function getCurrentUser() {

    const session = getSession();

    if (!session || !session.email) {
      return null;
    }

    const users = getUsers();

    return users[session.email] || null;
  }


  function saveCurrentUser(user) {

    const session = getSession();

    if (!session || !session.email || !user) {
      return false;
    }

    const users = getUsers();

    /*
      IMPORTANT:
      Save ONLY inside the currently logged-in
      user's email record.
    */

    users[session.email] = user;

    saveUsers(users);

    return true;
  }


  /* =====================================================
     CREATE DEFAULT USER STRUCTURE
  ===================================================== */

  function normalizeUser(user) {

    if (!user) return null;

    user.profile = user.profile || {
      phone: "",
      college: "",
      focus: "",
      bio: ""
    };

    user.course = user.course || null;

    user.mentor = user.mentor || null;

    user.target = user.target || null;

    user.goals = Array.isArray(user.goals)
      ? user.goals
      : [];

    user.preferences = user.preferences || {
      reminder: false,
      mentor: true
    };

    return user;
  }


  /* =====================================================
     CURRENT USER
  ===================================================== */

  let user = getCurrentUser();


  if (user) {
    user = normalizeUser(user);
  }


  /* =====================================================
     PAGE PROTECTION
  ===================================================== */

  const isAuthPage =
    location.pathname.endsWith("index.html") ||
    location.pathname.endsWith("register.html") ||
    location.pathname === "/" ||
    location.pathname.endsWith("/");


  if (!user && !isAuthPage) {

    location.replace("index.html");

    return;
  }


  /* =====================================================
     TOAST
  ===================================================== */

  function toast(message) {

    const element = $("#toast");

    if (!element) return;

    element.textContent = message;

    element.classList.add("show");

    setTimeout(() => {
      element.classList.remove("show");
    }, 2600);
  }


  /* =====================================================
     INITIALS
  ===================================================== */

  function initials(name) {

    return (name || "Student")
      .split(/\s+/)
      .map(part => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }


  /* =====================================================
     USER SHELL
  ===================================================== */

  function shell() {

    if (!user) return;


    document
      .querySelectorAll(".user-name")
      .forEach(element => {

        element.textContent =
          user.name || "Student";

      });


    document
      .querySelectorAll(".user-initial")
      .forEach(element => {

        element.textContent =
          initials(user.name);

      });


    document
      .querySelectorAll(".user-email")
      .forEach(element => {

        element.textContent =
          user.email || "";

      });


    const menuButton =
      $("#menuButton");

    const sidebar =
      $("#sidebar");


    if (menuButton && sidebar) {

      menuButton.onclick = () => {

        sidebar.classList.toggle("open");

      };


      sidebar
        .querySelectorAll(".nav-item")
        .forEach(link => {

          link.addEventListener(
            "click",
            () => {
              sidebar.classList.remove("open");
            }
          );

        });

    }
  }


  shell();


  /* =====================================================
     COURSES
  ===================================================== */

  const courses = [

    {
      id: "web",
      title: "Web Development",
      kind: "software",
      icon: "</>",
      color: "violet",
      level: "Beginner friendly",
      time: "6 weeks",
      desc:
        "Build responsive websites with HTML, CSS and JavaScript.",
      mentor: "Riya Krishnan",
      specialty: "Full-stack development"
    },

    {
      id: "data",
      title: "Data Analytics",
      kind: "software",
      icon: "⌁",
      color: "blue",
      level: "Beginner friendly",
      time: "5 weeks",
      desc:
        "Learn to find insights with spreadsheets, SQL and dashboards.",
      mentor: "Vikram Shah",
      specialty: "Data & analytics"
    },

    {
      id: "embedded",
      title: "Embedded Systems",
      kind: "hardware",
      icon: "⚙",
      color: "orange",
      level: "Hands-on pathway",
      time: "7 weeks",
      desc:
        "Create real devices using Arduino, sensors and C basics.",
      mentor: "Arun Menon",
      specialty: "Embedded systems"
    },

    {
      id: "iot",
      title: "IoT & Smart Devices",
      kind: "hardware",
      icon: "◉",
      color: "teal",
      level: "Hands-on pathway",
      time: "6 weeks",
      desc:
        "Connect sensors and devices to solve everyday problems.",
      mentor: "Meera Nair",
      specialty: "IoT prototyping"
    }

  ];


  let selectedCourse = null;


  function courseCard(course) {

    return `
      <article
        class="course-card"
        data-kind="${course.kind}"
        data-course="${course.id}">

        <div class="course-icon ${course.color}">
          ${course.icon}
        </div>

        <span class="kind-pill">
          ${course.kind}
        </span>

        <h2>${course.title}</h2>

        <p>${course.desc}</p>

        <div class="course-meta">
          <span>${course.level}</span>
          <span>${course.time}</span>
        </div>

        <button
          class="course-open"
          type="button">

          Explore pathway <b>→</b>

        </button>

      </article>
    `;
  }


  function initCourses() {

    const grid = $("#courseGrid");

    if (!grid) return;


    const search = $("#courseSearch");

    const filters =
      document.querySelectorAll("[data-filter]");


    function render() {

      const query =
        search
          ? search.value.toLowerCase()
          : "";


      const active =
        document.querySelector(".filter.active");


      const filter =
        active
          ? active.dataset.filter
          : "all";


      const filtered =
        courses.filter(course => {

          const categoryMatch =
            filter === "all" ||
            course.kind === filter;


          const text =
            (
              course.title +
              " " +
              course.desc +
              " " +
              course.specialty
            ).toLowerCase();


          return (
            categoryMatch &&
            text.includes(query)
          );

        });


      grid.innerHTML =
        filtered.length
          ? filtered.map(courseCard).join("")
          : `
            <p class="empty">
              No pathways found.
            </p>
          `;


      grid
        .querySelectorAll(".course-card")
        .forEach(card => {

          card.onclick = () => {

            const course =
              courses.find(
                item =>
                  item.id ===
                  card.dataset.course
              );

            openCourse(course);

          };

        });

    }


    render();


    if (search) {
      search.oninput = render;
    }


    filters.forEach(button => {

      button.onclick = () => {

        filters.forEach(item => {
          item.classList.remove("active");
        });

        button.classList.add("active");

        render();

      };

    });


    document
      .querySelectorAll(".modal-close")
      .forEach(button => {

        button.onclick = () => {

          const modal =
            $("#courseModal");

          if (modal) {
            modal.hidden = true;
          }

        };

      });


    const enrolButton =
      $("#enrolButton");


    if (enrolButton) {

      enrolButton.onclick = () => {

        if (!selectedCourse || !user) {
          return;
        }


        /*
          IMPORTANT:
          Store only required course information
          inside CURRENT USER.
        */

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


        const modal =
          $("#courseModal");

        if (modal) {
          modal.hidden = true;
        }


        toast(
          selectedCourse.title +
          " added. " +
          selectedCourse.mentor +
          " is now your mentor."
        );

      };

    }

  }


  function openCourse(course) {

    if (!course) return;

    selectedCourse = course;


    const title =
      $("#modalTitle");

    const text =
      $("#modalText");

    const extra =
      $("#hardwareExtra");

    const modal =
      $("#courseModal");


    if (title) {
      title.textContent =
        course.title;
    }


    if (text) {
      text.textContent =
        course.desc;
    }


    if (extra) {

      extra.innerHTML = `

        <div class="hardware-note">

          <strong>Course skills</strong>

          <p>
            ${course.specialty}
          </p>

          <strong>Duration</strong>

          <p>
            ${course.time}
          </p>

        </div>

      `;

    }


    if (modal) {
      modal.hidden = false;
    }

  }


  initCourses();


  /* =====================================================
     MENTORS
  ===================================================== */

  const mentors = [

    {
      name: "Riya Krishnan",
      initial: "RK",
      area: "Full-stack development",
      kind: "software",
      about:
        "Build portfolio-ready web projects and develop interview confidence.",
      color: "teal"
    },

    {
      name: "Arun Menon",
      initial: "AM",
      area: "Embedded systems",
      kind: "hardware",
      about:
        "Turn hardware concepts into practical Arduino and sensor projects.",
      color: "gold"
    },

    {
      name: "Priya Sharma",
      initial: "PS",
      area: "Interview coaching",
      kind: "software",
      about:
        "Practice structured answers, communication and professional presence.",
      color: "coral"
    },

    {
      name: "Meera Nair",
      initial: "MN",
      area: "IoT prototyping",
      kind: "hardware",
      about:
        "Create connected prototypes that solve real community problems.",
      color: "violet"
    },

    {
      name: "Vikram Shah",
      initial: "VS",
      area: "Data & analytics",
      kind: "software",
      about:
        "Build an analytical mindset and present insights clearly.",
      color: "blue"
    }

  ];


  function initMentors() {

    const grid =
      $("#mentorGrid");

    if (!grid) return;


    const search =
      $("#mentorSearch");


    function renderAssigned() {

      const panel =
        $("#assignedMentorPanel");

      if (!panel) return;


      /*
        IMPORTANT:
        Read mentor ONLY from current logged-in user.
      */

      const mentor =
        user
          ? user.mentor
          : null;


      if (mentor) {

        panel.innerHTML = `

          <span class="mentor-avatar teal">
            ${initials(mentor.name)}
          </span>

          <div>

            <p class="eyebrow">
              YOUR ASSIGNED MENTOR
            </p>

            <h2>${mentor.name}</h2>

            <p>
              ${mentor.specialty}
              · Available for guidance
            </p>

          </div>

          <a
            href="courses.html"
            class="text-button">

            Change pathway →

          </a>

        `;

      } else {

        panel.innerHTML = `

          <div>

            <p class="eyebrow">
              NO MENTOR ASSIGNED YET
            </p>

            <h2>
              Choose a course to find your
              best mentor match.
            </h2>

          </div>

          <a
            href="courses.html"
            class="primary-inline">

            Explore courses →

          </a>

        `;

      }

    }


    function render() {

      const query =
        search
          ? search.value.toLowerCase()
          : "";


      const active =
        document.querySelector(".filter.active");


      const kind =
        active
          ? active.dataset.specialty
          : "all";


      const filtered =
        mentors.filter(mentor => {

          const typeMatch =
            kind === "all" ||
            mentor.kind === kind;


          const text =
            (
              mentor.name +
              " " +
              mentor.area
            ).toLowerCase();


          return (
            typeMatch &&
            text.includes(query)
          );

        });


      grid.innerHTML =
        filtered
          .map(mentor => {

            const selected =
              user &&
              user.mentor &&
              user.mentor.name ===
              mentor.name;


            return `

              <article
                class="mentor-person
                ${selected ? "mentor-selected" : ""}">

                <span
                  class="mentor-avatar ${mentor.color}">

                  ${mentor.initial}

                </span>

                <span class="availability">
                  Available
                </span>

                <h2>${mentor.name}</h2>

                <p class="mentor-area">
                  ${mentor.area}
                </p>

                <p>
                  ${mentor.about}
                </p>

                ${
                  selected
                    ? `
                      <span
                        class="mentor-assigned-label">

                        ✓ Your assigned mentor

                      </span>
                    `
                    : ""
                }

                <button
                  class="mentor-select"
                  data-name="${mentor.name}"
                  type="button">

                  ${
                    selected
                      ? "Assigned ✓"
                      : "Choose mentor →"
                  }

                </button>

              </article>

            `;

          })
          .join("");


      grid
        .querySelectorAll(".mentor-select")
        .forEach(button => {

          button.onclick = () => {

            const mentor =
              mentors.find(
                item =>
                  item.name ===
                  button.dataset.name
              );


            if (!mentor || !user) {
              return;
            }


            user.mentor = {

              name:
                mentor.name,

              specialty:
                mentor.area

            };


            saveCurrentUser(user);


            render();

            renderAssigned();


            toast(
              mentor.name +
              " is now your assigned mentor."
            );

          };

        });

    }


    renderAssigned();

    render();


    if (search) {
      search.oninput = render;
    }


    document
      .querySelectorAll("[data-specialty]")
      .forEach(button => {

        button.onclick = () => {

          document
            .querySelectorAll(
              "[data-specialty]"
            )
            .forEach(item => {

              item.classList.remove(
                "active"
              );

            });


          button.classList.add("active");

          render();

        };

      });

  }


  initMentors();


  /* =====================================================
     PROFILE
  ===================================================== */

  function initProfile() {

    const form =
      $("#profileForm");

    if (!form || !user) return;


    user.profile =
      user.profile || {
        phone: "",
        college: "",
        focus: "",
        bio: ""
      };


    const profile =
      user.profile;


    const name =
      $("#profileName");

    const phone =
      $("#profilePhone");

    const college =
      $("#profileCollege");

    const focus =
      $("#profileFocus");

    const bio =
      $("#profileBio");


    if (name) {
      name.value =
        user.name || "";
    }

    if (phone) {
      phone.value =
        profile.phone || "";
    }

    if (college) {
      college.value =
        profile.college || "";
    }

    if (focus) {
      focus.value =
        profile.focus || "";
    }

    if (bio) {
      bio.value =
        profile.bio || "";
    }


    form.onsubmit = event => {

      event.preventDefault();


      const newName =
        name
          ? name.value.trim()
          : user.name;


      if (!newName || newName.length < 2) {

        const message =
          $("#profileMessage");

        if (message) {
          message.textContent =
            "Enter your full name.";
        }

        return;
      }


      user.name =
        newName;


      user.profile = {

        phone:
          phone
            ? phone.value.trim()
            : "",

        college:
          college
            ? college.value.trim()
            : "",

        focus:
          focus
            ? focus.value
            : "",

        bio:
          bio
            ? bio.value.trim()
            : ""

      };


      saveCurrentUser(user);

      shell();


      toast(
        "Your profile has been saved."
      );

    };

  }


  initProfile();


  /* =====================================================
     TARGETS
  ===================================================== */

  function initTargets() {

    const form =
      $("#targetForm");

    if (!form || !user) return;


    const target =
      user.target || {};


    const role =
      $("#targetRole");

    const date =
      $("#targetDate");

    const why =
      $("#targetWhy");


    if (role) {
      role.value =
        target.role || "";
    }

    if (date) {
      date.value =
        target.date || "";
    }

    if (why) {
      why.value =
        target.why || "";
    }


    form.onsubmit = event => {

      event.preventDefault();


      user.target = {

        role:
          role
            ? (
                role.value.trim() ||
                "Land a meaningful opportunity"
              )
            : "Land a meaningful opportunity",

        date:
          date
            ? date.value
            : "",

        why:
          why
            ? why.value.trim()
            : ""

      };


      saveCurrentUser(user);


      const title =
        $("#targetTitle");

      const description =
        $("#targetDescription");


      if (title) {
        title.textContent =
          user.target.role;
      }


      if (description) {
        description.textContent =
          user.target.why ||
          "Your career direction is set.";
      }


      toast(
        "Career target saved."
      );

    };

  }


  initTargets();


  /* =====================================================
     GOALS
  ===================================================== */

  function initGoals() {

    const list =
      $("#goalList");

    if (!list || !user) return;


    user.goals =
      Array.isArray(user.goals)
        ? user.goals
        : [];


    function render() {

      if (!user.goals.length) {

        list.innerHTML = `
          <p class="empty">
            No goals added yet.
          </p>
        `;

        return;
      }


      list.innerHTML =
        user.goals
          .map((goal, index) => {

            const item =
              typeof goal === "string"
                ? {
                    text: goal,
                    done: false
                  }
                : goal;


            if (
              typeof goal ===
              "string"
            ) {
              user.goals[index] =
                item;
            }


            return `

              <article
                class="goal-item
                ${item.done ? "done" : ""}">

                <button
                  class="goal-check"
                  data-i="${index}"
                  type="button">

                  ${item.done ? "✓" : ""}

                </button>

                <span>
                  ${item.text}
                </span>

                <button
                  class="goal-delete"
                  data-d="${index}"
                  type="button">

                  ×

                </button>

              </article>

            `;

          })
          .join("");


      list
        .querySelectorAll(".goal-check")
        .forEach(button => {

          button.onclick = () => {

            const index =
              Number(button.dataset.i);


            user.goals[index].done =
              !user.goals[index].done;


            saveCurrentUser(user);

            render();

          };

        });


      list
        .querySelectorAll(".goal-delete")
        .forEach(button => {

          button.onclick = () => {

            const index =
              Number(button.dataset.d);


            user.goals.splice(index, 1);

            saveCurrentUser(user);

            render();

          };

        });

    }


    const addGoal =
      $("#addGoal");

    const goalInput =
      $("#goalInput");


    if (addGoal) {

      addGoal.onclick = () => {

        const text =
          goalInput
            ? goalInput.value.trim()
            : "";


        if (!text) return;


        user.goals.push({
          text: text,
          done: false
        });


        saveCurrentUser(user);


        if (goalInput) {
          goalInput.value = "";
        }


        render();

      };

    }


    render();

  }


  initGoals();


  /* =====================================================
     DASHBOARD
  ===================================================== */

  function initDashboard() {

    if (!user) return;


    const courseName =
      $("#dashboardCourseName");


    if (courseName) {

      courseName.textContent =
        user.course
          ? user.course.title
          : "No pathway selected yet";

    }


    const mentorName =
      $("#dashboardMentorName");

    const mentorSpecialty =
      $("#dashboardMentorSpecialty");

    const mentorAvatar =
      $("#dashboardMentorAvatar");


    if (user.mentor) {

      if (mentorName) {
        mentorName.textContent =
          user.mentor.name;
      }

      if (mentorSpecialty) {
        mentorSpecialty.textContent =
          user.mentor.specialty;
      }

      if (mentorAvatar) {
        mentorAvatar.textContent =
          initials(user.mentor.name);
      }

    } else {

      if (mentorName) {
        mentorName.textContent =
          "No mentor selected";
      }

      if (mentorSpecialty) {
        mentorSpecialty.textContent =
          "Choose a mentor to start your journey";
      }

      if (mentorAvatar) {
        mentorAvatar.textContent =
          "?";
      }

    }


    const greetingName =
      $("#greetingName");

    if (greetingName) {

      greetingName.textContent =
        (user.name || "Student")
          .split(" ")[0];

    }


    const dropdownName =
      $("#dropdownName");

    const dropdownFullName =
      $("#dropdownFullName");

    const dropdownEmail =
      $("#dropdownEmail");

    const dropdownAvatar =
      $("#dropdownAvatar");


    if (dropdownName) {
      dropdownName.textContent =
        user.name || "Student";
    }

    if (dropdownFullName) {
      dropdownFullName.textContent =
        user.name || "Student";
    }

    if (dropdownEmail) {
      dropdownEmail.textContent =
        user.email || "";
    }

    if (dropdownAvatar) {
      dropdownAvatar.textContent =
        initials(user.name);
    }

  }


  initDashboard();


  /* =====================================================
     SETTINGS / LOGOUT
  ===================================================== */

  function initSettings() {

    const logoutButton =
      $("#logoutButton");

    if (!logoutButton) return;


    if (!user) return;


    user.preferences =
      user.preferences || {
        reminder: false,
        mentor: true
      };


    const reminderToggle =
      $("#reminderToggle");

    const mentorToggle =
      $("#mentorToggle");


    if (reminderToggle) {
      reminderToggle.checked =
        !!user.preferences.reminder;
    }


    if (mentorToggle) {
      mentorToggle.checked =
        !!user.preferences.mentor;
    }


    function savePreferences() {

      user.preferences = {

        reminder:
          reminderToggle
            ? reminderToggle.checked
            : false,

        mentor:
          mentorToggle
            ? mentorToggle.checked
            : true

      };


      saveCurrentUser(user);

      toast(
        "Preference saved."
      );

    }


    if (reminderToggle) {
      reminderToggle.onchange =
        savePreferences;
    }


    if (mentorToggle) {
      mentorToggle.onchange =
        savePreferences;
    }


    /* =====================================================
       LOGOUT

       DO NOT DELETE skillbridge_users.

       Only remove the current session.
       This keeps User A's data safe under User A's email,
       while User B gets only User B's record.
    ===================================================== */

    logoutButton.onclick = () => {

      /*
        Remove ONLY login session.
      */

      localStorage.removeItem(
        SESSION_KEY
      );


      /*
        Clear in-memory reference.
      */

      user = null;


      /*
        Go to login page.
      */

      location.replace(
        "index.html"
      );

    };

  }


  initSettings();


})();
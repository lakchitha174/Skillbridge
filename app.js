(function () {
  'use strict';

  /*
   * SkillBridge feature pages
   * -------------------------
   * All feature data is stored through SkillBridge's account
   * store. Nothing belonging to User A is copied into User B's
   * account.
   */

  const SB = window.SkillBridge;

  if (!SB) {
    console.error('SkillBridge data layer is missing. Load script.js first.');
    return;
  }

  const $ = selector => document.querySelector(selector);

  let user = SB.getCurrentSession();

  /*
   * Do not allow protected feature pages to run without a
   * logged-in account.
   */
  const publicPage =
    location.pathname.toLowerCase().endsWith('index.html') ||
    location.pathname.toLowerCase().endsWith('register.html') ||
    location.pathname === '/' ||
    location.pathname === '';

  if (!user && !publicPage) {
    window.location.replace('index.html');
    return;
  }

  function refreshUser() {
    user = SB.getCurrentSession();
    return user;
  }

  function toast(message) {
    const element = $('#toast');

    if (!element) return;

    element.textContent = message;
    element.classList.add('show');

    window.setTimeout(
      () => element.classList.remove('show'),
      2600
    );
  }

  function initials(name) {
    return SB.initials(name);
  }

  /*
   * Update all common user UI elements.
   */
  function shell() {
    refreshUser();

    if (!user) return;

    document.querySelectorAll('.user-name').forEach(
      element => {
        element.textContent = user.name || 'Student';
      }
    );

    document.querySelectorAll('.user-initial').forEach(
      element => {
        element.textContent = initials(user.name);
      }
    );

    document.querySelectorAll('.user-email').forEach(
      element => {
        element.textContent = user.email || '';
      }
    );

    /*
     * Some pages use explicit IDs instead of common classes.
     */
    const named = [
      'mentorPageUserName',
      'studentName',
      'dropdownName',
      'dropdownFullName',
      'greetingName'
    ];

    named.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = user.name || 'Student';
      }
    });

    const avatarIds = [
      'mentorPageAvatar',
      'avatarInitial',
      'dropdownAvatar'
    ];

    avatarIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = initials(user.name);
      }
    });

    const emailElement =
      document.getElementById('dropdownEmail');

    if (emailElement) {
      emailElement.textContent = user.email || '';
    }

    /*
     * Mobile menu
     */
    const menuButton = $('#menuButton');
    const sidebar = $('#sidebar');

    if (
      menuButton &&
      sidebar &&
      !menuButton.dataset.bound
    ) {
      menuButton.dataset.bound = 'true';

      menuButton.addEventListener('click', () => {
        const open = sidebar.classList.toggle('open');

        menuButton.setAttribute(
          'aria-expanded',
          String(open)
        );
      });

      sidebar.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', () => {
          sidebar.classList.remove('open');
          menuButton.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  shell();

  /*
   * --------------------------------------------------------
   * COURSES
   * --------------------------------------------------------
   */

  const courses = [
    {
      id: 'web',
      title: 'Web Development',
      kind: 'software',
      icon: '</>',
      color: 'violet',
      level: 'Beginner friendly',
      time: '6 weeks',
      desc: 'Build responsive websites with HTML, CSS and JavaScript.',
      mentor: 'Riya Krishnan',
      specialty: 'Full-stack development'
    },
    {
      id: 'data',
      title: 'Data Analytics',
      kind: 'software',
      icon: '⌁',
      color: 'blue',
      level: 'Beginner friendly',
      time: '5 weeks',
      desc: 'Learn to find insights with spreadsheets, SQL and dashboards.',
      mentor: 'Vikram Shah',
      specialty: 'Data & analytics'
    },
    {
      id: 'embedded',
      title: 'Embedded Systems',
      kind: 'hardware',
      icon: '⚙',
      color: 'orange',
      level: 'Hands-on pathway',
      time: '7 weeks',
      desc: 'Create real devices using Arduino, sensors and C basics.',
      mentor: 'Arun Menon',
      specialty: 'Embedded systems',
      video: 'Arduino foundations: build your first sensor project'
    },
    {
      id: 'iot',
      title: 'IoT & Smart Devices',
      kind: 'hardware',
      icon: '◉',
      color: 'teal',
      level: 'Hands-on pathway',
      time: '6 weeks',
      desc: 'Connect sensors and devices to solve everyday problems.',
      mentor: 'Meera Nair',
      specialty: 'IoT prototyping',
      video: 'IoT basics: from sensor to smart device'
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

        <h2>
          ${course.title}
        </h2>

        <p>
          ${course.desc}
        </p>

        <div class="course-meta">
          <span>${course.level}</span>
          <span>${course.time}</span>
        </div>

        <button
          class="course-open"
          type="button">

          Explore pathway
          <b>→</b>

        </button>

      </article>
    `;
  }

  function saveAccountPatch(patch) {
    refreshUser();

    if (!user) return false;

    const account =
      SB.getAccount(user.email) || {
        email: user.email,
        profile: {},
        preferences: {}
      };

    const updated = {
      ...account,
      ...patch,
      email: user.email
    };

    SB.saveAccount(updated);
    refreshUser();

    /*
     * Keep the common header in sync immediately.
     */
    shell();

    return true;
  }

  function initCourses() {
    const grid = $('#courseGrid');

    if (!grid) return;

    const search =
      $('#courseSearch');

    const filters =
      document.querySelectorAll('[data-filter]');

    const render = () => {
      const query =
        (search?.value || '').trim().toLowerCase();

      const activeFilter =
        $('.filter.active')?.dataset.filter || 'all';

      const filtered =
        courses.filter(course => {
          const matchesFilter =
            activeFilter === 'all' ||
            course.kind === activeFilter;

          const text = (
            course.title +
            ' ' +
            course.desc +
            ' ' +
            course.specialty
          ).toLowerCase();

          return (
            matchesFilter &&
            (!query || text.includes(query))
          );
        });

      grid.innerHTML =
        filtered.length
          ? filtered.map(courseCard).join('')
          : '<p class="empty">No pathways found. Try another search.</p>';

      grid.querySelectorAll('.course-card').forEach(card => {
        card.addEventListener('click', event => {
          if (event.target.closest('button')) {
            event.stopPropagation();
          }

          const course =
            courses.find(
              item => item.id === card.dataset.course
            );

          openCourse(course);
        });

        const button =
          card.querySelector('.course-open');

        if (button) {
          button.addEventListener('click', event => {
            event.stopPropagation();

            const course =
              courses.find(
                item => item.id === card.dataset.course
              );

            openCourse(course);
          });
        }
      });
    };

    render();

    if (search) {
      search.addEventListener('input', render);
    }

    filters.forEach(button => {
      button.addEventListener('click', () => {
        filters.forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        render();
      });
    });

    document.querySelectorAll('.modal-close').forEach(button => {
      button.addEventListener('click', () => {
        const modal = $('#courseModal');
        if (modal) modal.hidden = true;
      });
    });

    const enrolButton =
      $('#enrolButton');

    if (enrolButton) {
      enrolButton.addEventListener('click', () => {
        if (!selectedCourse) return;

        /*
         * Course selection belongs only to the current account.
         */
        saveAccountPatch({
          course: selectedCourse,

          /*
           * Existing behavior: choosing a course also assigns
           * its suggested mentor.
           */
          mentor: {
            name: selectedCourse.mentor,
            specialty: selectedCourse.specialty
          }
        });

        const modal = $('#courseModal');
        if (modal) modal.hidden = true;

        toast(
          `${selectedCourse.title} added. ${selectedCourse.mentor} is now your mentor.`
        );
      });
    }
  }

  function openCourse(course) {
    if (!course) return;

    selectedCourse = course;

    const title = $('#modalTitle');
    const text = $('#modalText');
    const extra = $('#hardwareExtra');
    const modal = $('#courseModal');

    if (title) title.textContent = course.title;
    if (text) text.textContent = course.desc;

    if (extra) {
      extra.innerHTML = course.video
        ? `
          <div class="hardware-note">
            <strong>▶ Video lesson included</strong>
            <p>${course.video}</p>

            <strong>▣ Mentor-evaluated project</strong>
            <p>
              Complete a practical mini-project and submit it for feedback.
            </p>
          </div>
        `
        : '';
    }

    if (modal) modal.hidden = false;
  }

  /*
   * --------------------------------------------------------
   * MENTORS
   * --------------------------------------------------------
   */

  const mentors = [
    {
      name: 'Riya Krishnan',
      initial: 'RK',
      area: 'Full-stack development',
      kind: 'software',
      about: 'Build portfolio-ready web projects and develop interview confidence.',
      color: 'teal'
    },
    {
      name: 'Arun Menon',
      initial: 'AM',
      area: 'Embedded systems',
      kind: 'hardware',
      about: 'Turn hardware concepts into practical Arduino and sensor projects.',
      color: 'gold'
    },
    {
      name: 'Priya Sharma',
      initial: 'PS',
      area: 'Interview coaching',
      kind: 'software',
      about: 'Practice structured answers, communication and professional presence.',
      color: 'coral'
    },
    {
      name: 'Meera Nair',
      initial: 'MN',
      area: 'IoT prototyping',
      kind: 'hardware',
      about: 'Create connected prototypes that solve real community problems.',
      color: 'violet'
    },
    {
      name: 'Vikram Shah',
      initial: 'VS',
      area: 'Data & analytics',
      kind: 'software',
      about: 'Build an analytical mindset and present insights clearly.',
      color: 'blue'
    }
  ];

  function renderAssignedMentor() {
    refreshUser();

    const panel =
      $('#assignedMentorPanel');

    if (!panel) return;

    const mentor =
      user && user.mentor;

    if (!mentor) {
      panel.innerHTML = `
        <div>
          <p class="eyebrow">
            NO MENTOR ASSIGNED YET
          </p>

          <h2>
            Choose a course to find your best mentor match.
          </h2>
        </div>

        <a
          href="courses.html"
          class="primary-inline">
          Explore courses →
        </a>
      `;

      return;
    }

    panel.innerHTML = `
      <span class="mentor-avatar teal">
        ${initials(mentor.name)}
      </span>

      <div>
        <p class="eyebrow">
          YOUR ASSIGNED MENTOR
        </p>

        <h2>
          ${mentor.name}
        </h2>

        <p>
          ${mentor.specialty || mentor.area || ''}
          · Available for guidance
        </p>
      </div>

      <a
        href="courses.html"
        class="text-button">
        Change pathway →
      </a>
    `;
  }

  function initMentors() {
    const grid =
      $('#mentorGrid');

    if (!grid) return;

    const search =
      $('#mentorSearch');

    const filters =
      document.querySelectorAll('[data-specialty]');

    const render = () => {
      refreshUser();

      const query =
        (search?.value || '').trim().toLowerCase();

      const activeFilter =
        $('.filter.active')?.dataset.specialty || 'all';

      const filtered =
        mentors.filter(mentor => {
          const matchesFilter =
            activeFilter === 'all' ||
            mentor.kind === activeFilter;

          const text = (
            mentor.name +
            ' ' +
            mentor.area +
            ' ' +
            mentor.about
          ).toLowerCase();

          return (
            matchesFilter &&
            (!query || text.includes(query))
          );
        });

      const selected =
        user && user.mentor;

      grid.innerHTML =
        filtered.length
          ? filtered.map(mentor => {
              const isSelected =
                selected &&
                selected.name === mentor.name;

              return `
                <article class="mentor-person">

                  <span class="mentor-avatar ${mentor.color}">
                    ${mentor.initial}
                  </span>

                  <span class="availability">
                    Available
                  </span>

                  <h2>
                    ${mentor.name}
                  </h2>

                  <p class="mentor-area">
                    ${mentor.area}
                  </p>

                  <p>
                    ${mentor.about}
                  </p>

                  <button
                    type="button"
                    class="mentor-select"
                    data-name="${mentor.name}">

                    ${isSelected
                      ? 'Assigned ✓'
                      : 'Choose mentor →'}

                  </button>

                </article>
              `;
            }).join('')
          : '<p class="empty">No mentors found. Try another search.</p>';

      grid.querySelectorAll('.mentor-select').forEach(button => {
        button.addEventListener('click', () => {
          const mentor =
            mentors.find(
              item => item.name === button.dataset.name
            );

          if (!mentor) return;

          saveAccountPatch({
            mentor: {
              name: mentor.name,
              specialty: mentor.area
            }
          });

          renderAssignedMentor();
          render();

          toast(
            `${mentor.name} is now your assigned mentor.`
          );
        });
      });
    };

    renderAssignedMentor();
    render();

    if (search) {
      search.addEventListener('input', render);
    }

    filters.forEach(button => {
      button.addEventListener('click', () => {
        filters.forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        render();
      });
    });
  }

  /*
   * --------------------------------------------------------
   * PROFILE
   * --------------------------------------------------------
   */

  function initProfile() {
    const form =
      $('#profileForm');

    if (!form) return;

    refreshUser();

    if (!user) return;

    const profile =
      user.profile || {};

    const nameInput =
      $('#profileName');

    if (nameInput) {
      nameInput.value =
        user.name || '';
    }

    $('#profilePhone').value =
      profile.phone || '';

    $('#profileCollege').value =
      profile.college || '';

    $('#profileFocus').value =
      profile.focus || '';

    $('#profileBio').value =
      profile.bio || '';

    const updateSummary = current => {
      const currentProfile =
        current.profile || {};

      document.querySelectorAll('.user-name').forEach(
        element => {
          element.textContent =
            current.name || 'Student';
        }
      );

      document.querySelectorAll('.user-email').forEach(
        element => {
          element.textContent =
            current.email || '';
        }
      );

      document.querySelectorAll('.user-initial').forEach(
        element => {
          element.textContent =
            initials(current.name);
        }
      );

      const path =
        $('#profilePath');

      if (path) {
        path.textContent =
          currentProfile.focus ||
          'Exploring pathways';
      }
    };

    updateSummary(user);

    form.addEventListener('submit', event => {
      event.preventDefault();

      const name =
        $('#profileName').value.trim();

      const phone =
        $('#profilePhone').value.trim();

      const college =
        $('#profileCollege').value.trim();

      const focus =
        $('#profileFocus').value;

      const bio =
        $('#profileBio').value.trim();

      const message =
        $('#profileMessage');

      if (name.length < 2) {
        if (message) {
          message.textContent =
            'Please enter your full name.';
          message.className =
            'form-message error';
        }

        $('#profileName').focus();
        return;
      }

      try {
        /*
         * This updates:
         * 1. skillbridge_account_<email>
         * 2. skillbridge_users
         * 3. skillbridge_session
         * 4. compatibility skillbridgeUser
         */
        const updated =
          SB.updateProfile({
            name,
            phone,
            college,
            focus,
            bio
          });

        if (!updated) {
          throw new Error(
            'Unable to update the current account.'
          );
        }

        user = updated;

        updateSummary(user);
        shell();

        if (message) {
          message.textContent =
            'Profile saved successfully.';
          message.className =
            'form-message success';
        }

        toast(
          'Profile saved successfully ✓'
        );

      } catch (error) {
        console.error(error);

        if (message) {
          message.textContent =
            error.message ||
            'Unable to save profile. Please try again.';
          message.className =
            'form-message error';
        }
      }
    });
  }

  /*
   * --------------------------------------------------------
   * TARGETS
   * --------------------------------------------------------
   */

  function initTargets() {
    const form =
      $('#targetForm');

    if (!form) return;

    refreshUser();

    const target =
      user?.target || {};

    $('#targetRole').value =
      target.role || '';

    $('#targetDate').value =
      target.date || '';

    $('#targetWhy').value =
      target.why || '';

    if (target.role) {
      $('#targetTitle').textContent =
        target.role;

      $('#targetDescription').textContent =
        target.why ||
        'Your career direction is set.';
    }

    form.addEventListener('submit', event => {
      event.preventDefault();

      const savedTarget = {
        role:
          $('#targetRole').value.trim() ||
          'Land a meaningful opportunity',

        date:
          $('#targetDate').value,

        why:
          $('#targetWhy').value.trim()
      };

      saveAccountPatch({
        target: savedTarget
      });

      $('#targetTitle').textContent =
        savedTarget.role;

      $('#targetDescription').textContent =
        savedTarget.why ||
        'Your career direction is set.';

      toast('Career target saved.');
    });
  }

  /*
   * --------------------------------------------------------
   * GOALS
   * --------------------------------------------------------
   */

  function initGoals() {
    const list =
      $('#goalList');

    if (!list) return;

    refreshUser();

    let goals =
      Array.isArray(user?.goals)
        ? user.goals
        : [
            'Practice 5 interview questions',
            'Complete one course lesson',
            'Spend 30 minutes on aptitude'
          ];

    function normalizeGoals() {
      goals = goals.map(goal => {
        if (typeof goal === 'string') {
          return {
            text: goal,
            done: false
          };
        }

        return {
          text: goal.text || '',
          done: !!goal.done
        };
      });
    }

    normalizeGoals();

    function saveGoals() {
      saveAccountPatch({
        goals
      });
    }

    function render() {
      list.innerHTML =
        goals.map((goal, index) => `
          <article
            class="goal-item ${goal.done ? 'done' : ''}">

            <button
              class="goal-check"
              data-i="${index}"
              type="button"
              aria-label="Complete goal">

              ${goal.done ? '✓' : ''}

            </button>

            <span>
              ${goal.text}
            </span>

            <button
              class="goal-delete"
              data-d="${index}"
              type="button"
              aria-label="Delete goal">

              ×

            </button>

          </article>
        `).join('');

      list.querySelectorAll('.goal-check').forEach(button => {
        button.addEventListener('click', () => {
          const index =
            Number(button.dataset.i);

          goals[index].done =
            !goals[index].done;

          saveGoals();
          render();
        });
      });

      list.querySelectorAll('.goal-delete').forEach(button => {
        button.addEventListener('click', () => {
          const index =
            Number(button.dataset.d);

          goals.splice(index, 1);

          saveGoals();
          render();
        });
      });
    }

    const addGoal =
      $('#addGoal');

    if (addGoal) {
      addGoal.addEventListener('click', () => {
        const input =
          $('#goalInput');

        const value =
          input?.value.trim();

        if (!value) return;

        goals.push({
          text: value,
          done: false
        });

        if (input) {
          input.value = '';
        }

        saveGoals();
        render();
      });
    }

    saveGoals();
    render();
  }

  /*
   * --------------------------------------------------------
   * SETTINGS
   * --------------------------------------------------------
   */

  function initSettings() {
    const logoutButton =
      $('#logoutButton');

    if (!logoutButton) return;

    refreshUser();

    const preferences =
      user?.preferences || {};

    const reminder =
      $('#reminderToggle');

    const mentorToggle =
      $('#mentorToggle');

    if (reminder) {
      reminder.checked =
        !!preferences.reminder;
    }

    if (mentorToggle) {
      mentorToggle.checked =
        !!preferences.mentor;
    }

    const savePreferences = () => {
      saveAccountPatch({
        preferences: {
          reminder: !!reminder?.checked,
          mentor: !!mentorToggle?.checked
        }
      });

      toast('Preference saved.');
    };

    reminder?.addEventListener(
      'change',
      savePreferences
    );

    mentorToggle?.addEventListener(
      'change',
      savePreferences
    );

    logoutButton.addEventListener(
      'click',
      () => SB.logout()
    );
  }

  /*
   * --------------------------------------------------------
   * GLOBAL ACCOUNT CHANGE HANDLING
   * --------------------------------------------------------
   */

  function refreshFeaturePage() {
    user = SB.getCurrentSession();

    if (!user) return;

    shell();
    renderAssignedMentor();
  }

  window.addEventListener(
    'skillbridge:profilechange',
    refreshFeaturePage
  );

  window.addEventListener(
    'skillbridge:accountchange',
    refreshFeaturePage
  );

  window.addEventListener(
    'storage',
    event => {
      const current = SB.getCurrentSession();

      if (!current) return;

      if (
        event.key === SB.USERS_KEY ||
        event.key === SB.SESSION_KEY ||
        event.key === SB.accountKey(current.email)
      ) {
        refreshFeaturePage();
      }
    }
  );

  /*
   * Initialize only the page-specific feature present in the DOM.
   */
  initCourses();
  initMentors();
  initProfile();
  initTargets();
  initGoals();
  initSettings();
})();

(function () {
  'use strict';

  /*
   * SkillBridge authentication + account data layer
   * ------------------------------------------------
   * Registration/login behavior is kept the same.
   *
   * Auth accounts:
   *   skillbridge_users
   *
   * Logged-in session:
   *   skillbridge_session
   *
   * One private data record per account:
   *   skillbridge_account_<email>
   *
   * The legacy "skillbridgeUser" key is kept only as a
   * compatibility mirror for the existing dashboard HTML.
   * It is always overwritten from the current account and
   * removed on logout.
   */

  const USERS_KEY = 'skillbridge_users';
  const SESSION_KEY = 'skillbridge_session';
  const LEGACY_USER_KEY = 'skillbridgeUser';
  const ACCOUNT_PREFIX = 'skillbridge_account_';

  const $ = (selector) => document.querySelector(selector);

  function readJSON(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.error('SkillBridge: unable to read', key, error);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getUsers() {
    const users = readJSON(USERS_KEY, []);
    return Array.isArray(users) ? users : [];
  }

  function setUsers(users) {
    writeJSON(USERS_KEY, users);
  }

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function accountKey(email) {
    return ACCOUNT_PREFIX + encodeURIComponent(normalizeEmail(email));
  }

  function initials(name) {
    const parts = String(name || 'S').trim().split(/\s+/).filter(Boolean);
    return (parts.slice(0, 2).map(part => part.charAt(0)).join('') || 'S').toUpperCase();
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[char]));
  }

  function defaultAccount(user) {
    return {
      email: normalizeEmail(user.email),
      profile: {
        phone: '',
        college: '',
        focus: '',
        bio: ''
      },
      course: null,
      mentor: null,
      target: null,
      goals: null,
      preferences: {
        reminder: false,
        mentor: false
      }
    };
  }

  /*
   * Converts the old nested session format into the new
   * per-account record when an older version of the project
   * is opened for the first time.
   */
  function migrateLegacyAccount(user) {
    const email = normalizeEmail(user && user.email);
    if (!email) return null;

    const existing = readJSON(accountKey(email), null);
    if (existing && typeof existing === 'object') {
      return {
        ...defaultAccount(user),
        ...existing,
        profile: {
          ...defaultAccount(user).profile,
          ...(existing.profile || {})
        },
        preferences: {
          ...defaultAccount(user).preferences,
          ...(existing.preferences || {})
        }
      };
    }

    const legacySession = readJSON(SESSION_KEY, null);
    const legacyUser = readJSON(LEGACY_USER_KEY, null);

    const old = (
      legacySession &&
      normalizeEmail(legacySession.email) === email
    ) ? legacySession : (
      legacyUser &&
      normalizeEmail(legacyUser.email) === email
    ) ? legacyUser : null;

    const account = defaultAccount(user);

    if (old && typeof old === 'object') {
      account.profile = {
        phone: old.profile?.phone || old.phone || '',
        college: old.profile?.college || old.college || '',
        focus: old.profile?.focus || old.focus || '',
        bio: old.profile?.bio || old.bio || ''
      };

      account.course = old.course || null;
      account.mentor = old.mentor || null;
      account.target = old.target || null;
      account.goals = old.goals || null;
      account.preferences = {
        ...account.preferences,
        ...(old.preferences || {})
      };
    }

    writeJSON(accountKey(email), account);
    return account;
  }

  function getAccount(email) {
    const normalized = normalizeEmail(email);
    if (!normalized) return null;

    const user = getUsers().find(
      item => normalizeEmail(item.email) === normalized
    );

    if (!user) return null;

    return migrateLegacyAccount(user);
  }

  function getCurrentSession() {
    const session = readJSON(SESSION_KEY, null);

    if (!session || typeof session !== 'object') {
      return null;
    }

    const email = normalizeEmail(session.email);
    if (!email) return null;

    const user = getUsers().find(
      item => normalizeEmail(item.email) === email
    );

    if (!user) return null;

    const account = getAccount(email) || defaultAccount(user);

    return {
      ...user,
      ...session,
      name: user.name || session.name || 'Student',
      email,
      profile: account.profile,
      course: account.course,
      mentor: account.mentor,
      target: account.target,
      goals: account.goals,
      preferences: account.preferences,
      scores: user.scores || session.scores || {
        interview: 35,
        aptitude: 68,
        technical: 52
      }
    };
  }

  function setCurrentSession(user, account) {
    const session = {
      ...user,
      email: normalizeEmail(user.email),
      profile: account.profile || defaultAccount(user).profile,
      course: account.course || null,
      mentor: account.mentor || null,
      target: account.target || null,
      goals: account.goals || null,
      preferences: account.preferences || defaultAccount(user).preferences
    };

    writeJSON(SESSION_KEY, session);

    /*
     * Compatibility mirror used by the existing dashboard.
     * This is NOT the source of truth.
     */
    writeJSON(LEGACY_USER_KEY, {
      name: session.name,
      email: session.email,
      scores: session.scores
    });

    return session;
  }

  function updateUsersRecord(email, changes) {
    const normalized = normalizeEmail(email);
    const users = getUsers();

    const index = users.findIndex(
      item => normalizeEmail(item.email) === normalized
    );

    if (index === -1) return null;

    users[index] = {
      ...users[index],
      ...changes,
      email: normalized
    };

    setUsers(users);
    return users[index];
  }

  function saveAccount(account) {
    if (!account || !account.email) return null;

    const normalized = normalizeEmail(account.email);
    const currentUser = getUsers().find(
      item => normalizeEmail(item.email) === normalized
    );

    if (!currentUser) return null;

    const cleanAccount = {
      ...defaultAccount(currentUser),
      ...account,
      email: normalized,
      profile: {
        ...defaultAccount(currentUser).profile,
        ...(account.profile || {})
      },
      preferences: {
        ...defaultAccount(currentUser).preferences,
        ...(account.preferences || {})
      }
    };

    writeJSON(accountKey(normalized), cleanAccount);

    const updatedUser = updateUsersRecord(normalized, {
      name: currentUser.name
    });

    if (updatedUser) {
      setCurrentSession(updatedUser, cleanAccount);
    }

    window.dispatchEvent(new CustomEvent('skillbridge:accountchange', {
      detail: {
        email: normalized,
        account: cleanAccount,
        user: updatedUser
      }
    }));

    return cleanAccount;
  }

  function updateProfile(profileFields) {
    const session = getCurrentSession();
    if (!session) return null;

    const name = String(profileFields.name || '').trim();

    if (name.length < 2) {
      throw new Error('Please enter your full name.');
    }

    const account = getAccount(session.email) || defaultAccount(session);

    account.profile = {
      ...account.profile,
      phone: String(profileFields.phone || '').trim(),
      college: String(profileFields.college || '').trim(),
      focus: String(profileFields.focus || '').trim(),
      bio: String(profileFields.bio || '').trim()
    };

    /*
     * The profile name is part of the account identity, so it
     * must be written to BOTH the registered user and the
     * current session.
     */
    const updatedUser = updateUsersRecord(session.email, {
      name
    });

    if (!updatedUser) {
      throw new Error('Unable to update the current account.');
    }

    account.email = session.email;
    writeJSON(accountKey(session.email), account);
    setCurrentSession(updatedUser, account);

    window.dispatchEvent(new CustomEvent('skillbridge:profilechange', {
      detail: {
        name,
        email: session.email,
        profile: account.profile
      }
    }));

    return getCurrentSession();
  }

  function login(email, password) {
    const normalized = normalizeEmail(email);

    const user = getUsers().find(
      item =>
        normalizeEmail(item.email) === normalized &&
        item.password === password
    );

    if (!user) return null;

    const account = getAccount(normalized) || defaultAccount(user);

    return setCurrentSession(user, account);
  }

  function register(name, email, password) {
    const normalized = normalizeEmail(email);
    const users = getUsers();

    if (users.some(item => normalizeEmail(item.email) === normalized)) {
      return null;
    }

    const user = {
      name: String(name).trim(),
      email: normalized,
      password,
      scores: {
        interview: 35,
        aptitude: 68,
        technical: 52
      }
    };

    users.push(user);
    setUsers(users);

    const account = defaultAccount(user);
    writeJSON(accountKey(normalized), account);

    return setCurrentSession(user, account);
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);

    window.dispatchEvent(new CustomEvent('skillbridge:logout'));

    window.location.href = 'index.html';
  }

  /*
   * Public API used by app.js and any existing page scripts.
   */
  window.SkillBridge = {
    USERS_KEY,
    SESSION_KEY,
    ACCOUNT_PREFIX,
    accountKey,
    readJSON,
    writeJSON,
    getUsers,
    getAccount,
    getCurrentSession,
    setCurrentSession,
    saveAccount,
    updateProfile,
    login,
    register,
    logout,
    initials,
    escapeHtml
  };

  function setMessage(message, success) {
    const el = $('#formMessage');

    if (el) {
      el.textContent = message;
      el.style.color = success ? '#278260' : '#ca4d4d';
    }
  }

  function showToast(message) {
    const toast = $('#toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    window.setTimeout(
      () => toast.classList.remove('show'),
      2800
    );
  }

  /*
   * Password visibility
   */
  document.querySelectorAll('.visibility-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const input = button.previousElementSibling;
      if (!input) return;

      const showing = input.type === 'text';

      input.type = showing ? 'password' : 'text';
      button.textContent = showing ? 'Show' : 'Hide';
      button.setAttribute(
        'aria-label',
        showing ? 'Show password' : 'Hide password'
      );
      button.setAttribute(
        'aria-pressed',
        String(!showing)
      );
    });
  });

  /*
   * LOGIN
   * Existing registration/login behavior is preserved.
   */
  const loginForm = $('#loginForm');

  if (loginForm) {
    loginForm.addEventListener('submit', event => {
      event.preventDefault();

      const email = $('#loginEmail').value.trim().toLowerCase();
      const password = $('#loginPassword').value;

      if (!email || !password) {
        setMessage('Please enter your email and password.');
        return;
      }

      const session = login(email, password);

      if (!session) {
        setMessage(
          'We could not find a matching account. Please register or check your details.'
        );
        return;
      }

      window.location.href = 'dashboard.html';
    });
  }

  /*
   * REGISTER
   * Existing validation and messages are preserved.
   */
  const registerForm = $('#registerForm');

  if (registerForm) {
    registerForm.addEventListener('submit', event => {
      event.preventDefault();

      const name = $('#registerName').value.trim();
      const email = $('#registerEmail').value.trim().toLowerCase();
      const password = $('#registerPassword').value;
      const confirm = $('#confirmPassword').value;

      if (name.length < 2) {
        setMessage('Please enter your full name.');
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setMessage('Enter a valid email address.');
        return;
      }

      if (password.length < 6) {
        setMessage('Your password needs at least 6 characters.');
        return;
      }

      if (password !== confirm) {
        setMessage('Passwords do not match.');
        return;
      }

      if (getUsers().some(
        user => normalizeEmail(user.email) === normalizeEmail(email)
      )) {
        setMessage(
          'An account already uses this email. Please sign in.'
        );
        return;
      }

      register(name, email, password);

      window.location.href = 'dashboard.html';
    });
  }

  /*
   * Protect dashboard pages.
   *
   * app.js also checks the session for feature pages.
   * Keeping this here makes dashboard access safe even when
   * app.js changes later.
   */
  if (location.pathname.toLowerCase().endsWith('dashboard.html')) {
    const session = getCurrentSession();

    if (!session || !session.name) {
      window.location.replace('index.html');
      return;
    }

    function renderDashboardIdentity() {
      const current = getCurrentSession();
      if (!current) return;

      const name = current.name || 'Student';

      ['studentName', 'greetingName', 'dropdownName', 'dropdownFullName']
        .forEach(id => {
          const el = document.getElementById(id);
          if (el) el.textContent = name;
        });

      const avatar = initials(name);

      ['avatarInitial', 'dropdownAvatar']
        .forEach(id => {
          const el = document.getElementById(id);
          if (el) el.textContent = avatar;
        });

      const emailEl = document.getElementById('dropdownEmail');
      if (emailEl) emailEl.textContent = current.email || '';

      const pathwayEl =
        document.querySelector('.profile-detail-content strong');

      /*
       * The existing dashboard has several profile detail
       * elements. Update the pathway only when profile focus
       * is available; otherwise leave the existing design text.
       */
      const detailBlocks =
        document.querySelectorAll('.profile-detail-content');

      if (detailBlocks.length >= 4 && current.profile?.focus) {
        const pathwayStrong =
          detailBlocks[3].querySelector('strong');

        if (pathwayStrong) {
          pathwayStrong.textContent = current.profile.focus;
        }
      }
    }

    renderDashboardIdentity();

    /*
     * The existing dashboard contains its own logout button
     * creation. We expose the current logout implementation
     * globally so that code can call SkillBridge.logout().
     */
    window.SkillBridge.renderDashboardIdentity =
      renderDashboardIdentity;
  }

  /*
   * Update an already-open dashboard when Profile is saved
   * in another tab.
   */
  window.addEventListener('storage', event => {
    const current = getCurrentSession();
    if (!current) return;

    if (
      event.key === accountKey(current.email) ||
      event.key === USERS_KEY ||
      event.key === SESSION_KEY ||
      event.key === LEGACY_USER_KEY
    ) {
      if (window.SkillBridge.renderDashboardIdentity) {
        window.SkillBridge.renderDashboardIdentity();
      }
    }
  });

  window.addEventListener('skillbridge:profilechange', () => {
    if (window.SkillBridge.renderDashboardIdentity) {
      window.SkillBridge.renderDashboardIdentity();
    }
  });
})();

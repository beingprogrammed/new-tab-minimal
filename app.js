/**
 * Minimal Firefox New Tab
 * Supports:
 * - Basic Gray Themes (Charcoal, Slate, OLED, Paper)
 * - Scattered Cards View (organic up/down baseline offsets + keyboard shortcuts 1-8)
 * - Apple Style Clock View (StandBy Clock, Stopwatch, Timer + Right Dock + Bottom Quick Launch)
 */

// --- Default Quick Launch Sites ---
const DEFAULT_SITES = [
  { id: '1', title: 'GitHub', url: 'https://github.com', icon: '󰊤', domain: 'github.com' },
  { id: '2', title: 'YouTube', url: 'https://youtube.com', icon: '󰗃', domain: 'youtube.com' },
  { id: '3', title: 'Reddit', url: 'https://reddit.com', icon: '󰑍', domain: 'reddit.com' },
  { id: '4', title: 'Gmail', url: 'https://mail.google.com', icon: '󰇮', domain: 'mail.google.com' },
  { id: '5', title: 'ChatGPT', url: 'https://chatgpt.com', icon: '󰚩', domain: 'chatgpt.com' },
  { id: '6', title: 'Gemini', url: 'https://gemini.google.com', icon: '󰭻', domain: 'gemini.google.com' },
  { id: '7', title: 'X / Twitter', url: 'https://x.com', icon: '󰕄', domain: 'x.com' },
  { id: '8', title: 'Spotify', url: 'https://open.spotify.com', icon: '󰓇', domain: 'spotify.com' },
];

const SCATTER_PATTERNS = [
  'scatter-up-deep',
  'scatter-down-mid',
  'scatter-up-mid',
  'scatter-down-deep',
  'scatter-up-shallow',
  'scatter-down-shallow',
  'scatter-up-deep',
  'scatter-down-mid'
];

const THEMES = ['charcoal', 'slate', 'oled', 'paper'];

// --- Application State ---
const state = {
  theme: localStorage.getItem('nft_theme') || 'charcoal',
  view: localStorage.getItem('nft_view') || 'cards', // 'cards' | 'clock'
  searchEngine: localStorage.getItem('nft_search_engine') || 'ddg', // 'ddg' | 'google'
  sites: JSON.parse(localStorage.getItem('nft_sites')) || DEFAULT_SITES,
  activeClockPanel: 'panel-clock',
  // Stopwatch
  stopwatch: {
    running: false,
    startTime: 0,
    elapsedTime: 0,
    timerId: null,
    laps: []
  },
  // Timer
  timer: {
    running: false,
    totalSeconds: 15 * 60,
    remainingSeconds: 15 * 60,
    timerId: null
  }
};

// --- DOM Elements ---
const body = document.body;
const navTime = document.getElementById('nav-time');
const navDate = document.getElementById('nav-date');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeLabel = document.getElementById('theme-label');
const viewToggleBtn = document.getElementById('view-toggle-btn');
const viewLabel = document.getElementById('view-label');
const searchInput = document.getElementById('search-input');
const searchEngineBadge = document.getElementById('search-engine-badge');
const cardsTrack = document.getElementById('cards-track');
const bottomDockItems = document.getElementById('bottom-dock-items');

// Clock Elements
const appleClockDigits = document.getElementById('apple-clock-digits');
const appleClockSeconds = document.getElementById('apple-clock-seconds');
const appleClockAmpm = document.getElementById('apple-clock-ampm');
const appleClockDate = document.getElementById('apple-clock-date');

// Modal Elements
const addModal = document.getElementById('add-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const addShortcutForm = document.getElementById('add-shortcut-form');

// --- Initialization ---
function init() {
  applyTheme(state.theme);
  applyView(state.view);
  updateSearchEngineBadge();
  renderCards();
  renderBottomDock();
  startClock();
  initStopwatch();
  initTimer();
  bindEvents();
}

// --- Theme Management ---
function applyTheme(theme) {
  state.theme = theme;
  body.setAttribute('data-theme', theme);
  localStorage.setItem('nft_theme', theme);
  themeLabel.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
}

function cycleTheme() {
  const currentIndex = THEMES.indexOf(state.theme);
  const nextTheme = THEMES[(currentIndex + 1) % THEMES.length];
  applyTheme(nextTheme);
}

// --- View Switcher (Cards <-> Apple Clock Mode) ---
function applyView(view) {
  state.view = view;
  body.setAttribute('data-view', view);
  localStorage.setItem('nft_view', view);

  if (view === 'cards') {
    viewLabel.textContent = 'StandBy Clock';
    viewToggleBtn.classList.remove('active-highlight');
  } else {
    viewLabel.textContent = 'Dashboard';
    viewToggleBtn.classList.add('active-highlight');
  }
}

function toggleView() {
  const nextView = state.view === 'cards' ? 'clock' : 'cards';
  applyView(nextView);
}

// --- Clock Logic ---
function startClock() {
  function update() {
    const now = new Date();
    
    // Top Nav Time
    let hours24 = now.getHours();
    let hours12 = hours24 % 12 || 12;
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours24 >= 12 ? 'PM' : 'AM';

    navTime.textContent = `${String(hours24).padStart(2, '0')}:${minutes}`;
    
    // Date formatting
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonths = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    navDate.textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;

    // Big Apple Style Clock
    appleClockDigits.textContent = `${String(hours12).padStart(2, '0')}:${minutes}`;
    appleClockSeconds.textContent = seconds;
    appleClockAmpm.textContent = ampm;
    appleClockDate.textContent = `${fullDays[now.getDay()]}, ${fullMonths[now.getMonth()]} ${now.getDate()}`;
  }

  update();
  setInterval(update, 1000);
}

// --- Render Scattered Cards ---
function renderCards() {
  cardsTrack.innerHTML = '';

  state.sites.forEach((site, index) => {
    const scatterClass = SCATTER_PATTERNS[index % SCATTER_PATTERNS.length];
    const card = document.createElement('a');
    card.className = `quick-card ${scatterClass}`;
    card.href = site.url;
    card.setAttribute('data-index', index + 1);

    // Shortcut badge [1], [2], etc.
    const shortcutBadge = index < 9 
      ? `<span class="card-shortcut-badge">${index + 1}</span>` 
      : '';

    // Icon or Nerd Font Symbol
    const iconDisplay = site.icon || site.title.charAt(0);

    card.innerHTML = `
      ${shortcutBadge}
      <div class="card-icon-container">${iconDisplay}</div>
      <div class="card-title">${site.title}</div>
      <div class="card-domain">${site.domain || ''}</div>
    `;

    cardsTrack.appendChild(card);
  });

  // Append "+ Add Site" Card
  const addCard = document.createElement('div');
  addCard.className = 'quick-card add-card scatter-up-shallow';
  addCard.innerHTML = `
    <div class="card-icon-container">+</div>
    <div class="card-title">Add Site</div>
  `;
  addCard.addEventListener('click', () => openModal());
  cardsTrack.appendChild(addCard);
}

// --- Render Bottom Dock (For Clock View) ---
function renderBottomDock() {
  bottomDockItems.innerHTML = '';

  state.sites.forEach((site) => {
    const dockItem = document.createElement('a');
    dockItem.className = 'bottom-dock-item';
    dockItem.href = site.url;
    dockItem.title = site.title;

    const iconDisplay = site.icon || site.title.charAt(0);
    dockItem.innerHTML = `
      ${iconDisplay}
      <span class="bottom-dock-tooltip">${site.title}</span>
    `;

    bottomDockItems.appendChild(dockItem);
  });
}

// --- Search Handler ---
function updateSearchEngineBadge() {
  searchEngineBadge.textContent = state.searchEngine.toUpperCase();
}

function handleSearch(query) {
  if (!query || !query.trim()) return;
  const q = query.trim();

  // If user typed a direct URL or localhost
  if (/^(https?:\/\/|localhost[:\/]|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})(\/.*)?$/.test(q)) {
    const targetUrl = q.startsWith('http://') || q.startsWith('https://') ? q : `https://${q}`;
    window.location.href = targetUrl;
    return;
  }

  // Bang searches
  if (q.startsWith('!gh ')) {
    window.location.href = `https://github.com/search?q=${encodeURIComponent(q.slice(4))}`;
    return;
  }
  if (q.startsWith('!yt ')) {
    window.location.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(q.slice(4))}`;
    return;
  }
  if (q.startsWith('!w ')) {
    window.location.href = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q.slice(3))}`;
    return;
  }
  if (q.startsWith('!r ')) {
    window.location.href = `https://www.reddit.com/search/?q=${encodeURIComponent(q.slice(3))}`;
    return;
  }

  // Default engines
  if (state.searchEngine === 'google') {
    window.location.href = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  } else {
    window.location.href = `https://duckduckgo.com/?q=${encodeURIComponent(q)}`;
  }
}

// --- Stopwatch Sub-screen ---
function initStopwatch() {
  const display = document.getElementById('stopwatch-display');
  const startBtn = document.getElementById('sw-start-btn');
  const lapBtn = document.getElementById('sw-lap-btn');
  const resetBtn = document.getElementById('sw-reset-btn');
  const lapsContainer = document.getElementById('sw-laps-container');

  function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
  }

  function tick() {
    const current = Date.now() - state.stopwatch.startTime + state.stopwatch.elapsedTime;
    display.textContent = formatTime(current);
  }

  startBtn.addEventListener('click', () => {
    if (!state.stopwatch.running) {
      // Start
      state.stopwatch.running = true;
      state.stopwatch.startTime = Date.now();
      state.stopwatch.timerId = setInterval(tick, 30);
      startBtn.textContent = 'Pause';
      lapBtn.disabled = false;
      resetBtn.disabled = false;
    } else {
      // Pause
      state.stopwatch.running = false;
      state.stopwatch.elapsedTime += Date.now() - state.stopwatch.startTime;
      clearInterval(state.stopwatch.timerId);
      startBtn.textContent = 'Resume';
    }
  });

  resetBtn.addEventListener('click', () => {
    state.stopwatch.running = false;
    clearInterval(state.stopwatch.timerId);
    state.stopwatch.startTime = 0;
    state.stopwatch.elapsedTime = 0;
    state.stopwatch.laps = [];
    display.textContent = '00:00.00';
    startBtn.textContent = 'Start';
    lapBtn.disabled = true;
    resetBtn.disabled = true;
    lapsContainer.innerHTML = '';
  });

  lapBtn.addEventListener('click', () => {
    const current = Date.now() - state.stopwatch.startTime + state.stopwatch.elapsedTime;
    const lapNum = state.stopwatch.laps.length + 1;
    state.stopwatch.laps.unshift({ num: lapNum, time: formatTime(current) });

    lapsContainer.innerHTML = state.stopwatch.laps
      .slice(0, 10)
      .map(l => `<div class="lap-row"><span>Lap ${l.num}</span><span>${l.time}</span></div>`)
      .join('');
  });
}

// --- Timer Sub-screen ---
function initTimer() {
  const display = document.getElementById('timer-display');
  const startBtn = document.getElementById('timer-start-btn');
  const pauseBtn = document.getElementById('timer-pause-btn');
  const resetBtn = document.getElementById('timer-reset-btn');
  const presetBtns = document.querySelectorAll('.preset-btn');

  function formatTimer(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function playChime() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      // Audio context restricted or unavailable
    }
  }

  function tick() {
    if (state.timer.remainingSeconds <= 0) {
      clearInterval(state.timer.timerId);
      state.timer.running = false;
      display.textContent = '00:00';
      startBtn.textContent = 'Start';
      pauseBtn.disabled = true;
      playChime();
      return;
    }
    state.timer.remainingSeconds--;
    display.textContent = formatTimer(state.timer.remainingSeconds);
  }

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mins = parseInt(btn.getAttribute('data-mins'), 10);
      clearInterval(state.timer.timerId);
      state.timer.running = false;
      state.timer.totalSeconds = mins * 60;
      state.timer.remainingSeconds = mins * 60;
      display.textContent = formatTimer(state.timer.remainingSeconds);
      startBtn.textContent = 'Start';
      pauseBtn.disabled = true;
    });
  });

  startBtn.addEventListener('click', () => {
    if (!state.timer.running) {
      state.timer.running = true;
      state.timer.timerId = setInterval(tick, 1000);
      startBtn.textContent = 'Running';
      pauseBtn.disabled = false;
    }
  });

  pauseBtn.addEventListener('click', () => {
    if (state.timer.running) {
      clearInterval(state.timer.timerId);
      state.timer.running = false;
      startBtn.textContent = 'Resume';
      pauseBtn.disabled = true;
    }
  });

  resetBtn.addEventListener('click', () => {
    clearInterval(state.timer.timerId);
    state.timer.running = false;
    state.timer.remainingSeconds = state.timer.totalSeconds;
    display.textContent = formatTimer(state.timer.remainingSeconds);
    startBtn.textContent = 'Start';
    pauseBtn.disabled = true;
  });
}

// --- Right Dock Switcher (Clock / Stopwatch / Timer) ---
function initRightDock() {
  const dockBtns = document.querySelectorAll('.dock-btn');
  const panels = document.querySelectorAll('.clock-panel');

  dockBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetPanelId = btn.getAttribute('data-panel');
      
      dockBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      panels.forEach(p => {
        p.classList.remove('active');
        if (p.id === targetPanelId) {
          p.classList.add('active');
        }
      });
      state.activeClockPanel = targetPanelId;
    });
  });
}

// --- Modal Logic ---
function openModal() {
  addModal.classList.add('open');
  document.getElementById('shortcut-name').focus();
}

function closeModal() {
  addModal.classList.remove('open');
  addShortcutForm.reset();
}

// --- Global Event Listeners & Keybindings ---
function bindEvents() {
  // Theme Toggle
  themeToggleBtn.addEventListener('click', cycleTheme);

  // View Toggle
  viewToggleBtn.addEventListener('click', toggleView);

  // Search Toggle Engine (DDG <-> Google)
  searchEngineBadge.addEventListener('click', () => {
    state.searchEngine = state.searchEngine === 'ddg' ? 'google' : 'ddg';
    localStorage.setItem('nft_search_engine', state.searchEngine);
    updateSearchEngineBadge();
  });

  // Search Input Enter
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSearch(searchInput.value);
    }
  });

  // Modal events
  modalCloseBtn.addEventListener('click', closeModal);
  modalCancelBtn.addEventListener('click', closeModal);
  addModal.addEventListener('click', (e) => {
    if (e.target === addModal) closeModal();
  });

  addShortcutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('shortcut-name').value.trim();
    let url = document.getElementById('shortcut-url').value.trim();
    let icon = document.getElementById('shortcut-icon').value.trim();

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    try {
      const parsed = new URL(url);
      const domain = parsed.hostname;
      if (!icon) icon = name.charAt(0).toUpperCase();

      const newSite = {
        id: String(Date.now()),
        title: name,
        url: url,
        icon: icon,
        domain: domain
      };

      state.sites.push(newSite);
      localStorage.setItem('nft_sites', JSON.stringify(state.sites));
      renderCards();
      renderBottomDock();
      closeModal();
    } catch (err) {
      alert('Please enter a valid URL.');
    }
  });

  initRightDock();

  // Keyboard Shortcuts:
  // - Tab: Toggle between Cards and Apple Clock
  // - /: Focus search input
  // - Escape: Blur input or close modal
  // - 1-8: Open corresponding card shortcut (when not typing in search)
  window.addEventListener('keydown', (e) => {
    const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);

    if (e.key === 'Escape') {
      if (addModal.classList.contains('open')) {
        closeModal();
      } else if (isTyping) {
        document.activeElement.blur();
      }
      return;
    }

    if (isTyping) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      toggleView();
      return;
    }

    if (e.key === '/') {
      e.preventDefault();
      if (state.view !== 'cards') applyView('cards');
      searchInput.focus();
      return;
    }

    // Number keys 1-8 for quick shortcuts
    const num = parseInt(e.key, 10);
    if (!isNaN(num) && num >= 1 && num <= state.sites.length) {
      const targetSite = state.sites[num - 1];
      if (targetSite && targetSite.url) {
        window.location.href = targetSite.url;
      }
    }
  });
}

// Run init on DOMContentLoaded
document.addEventListener('DOMContentLoaded', init);

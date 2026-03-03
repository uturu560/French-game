(function () {
  "use strict";

  let wordSets = [];
  let dailyWords = [];
  let currentSet = null;
  let currentLevel = 1;
  let cards = [];
  let firstCard = null;
  let secondCard = null;
  let lockBoard = false;
  let matchedCount = 0;
  let uiLang = "en";
  let roundScore = 0;
  let sessionScore = 0;
  let roundStartTime = 0;
  let timerInterval = null;
  let currentLevelCompleted = false;
  let highestLevelPassed = 0;
  let matchStreak = 0;

  const gameArea = document.getElementById("game-area");
  const gameBoardWrap = document.querySelector(".game-board-wrap");
  const setSelect = document.getElementById("set-select");
  const levelSelect = document.getElementById("level-select");
  const levelLabel = document.getElementById("level-label");
  const levelSelectRow = document.getElementById("level-select-row");
  const practiceLevelStrip = document.getElementById("practice-level-strip");
  const dailyLevelWrap = document.getElementById("daily-level-wrap");
  const dailyLevelDisplay = document.getElementById("daily-level-display");
  const nextBtn = document.getElementById("next-btn");
  const winMessage = document.getElementById("win-message");
  const winNextBtn = document.getElementById("win-next-btn");
  const winReplayBtn = document.getElementById("win-replay-btn");
  const winBackBtn = document.getElementById("win-back-btn");
  const winText = document.getElementById("win-text");
  const timerText = document.getElementById("timer-text");
  const scoreValue = document.getElementById("score-value");
  const progressText = document.getElementById("progress-text");
  const scoreLabel = document.getElementById("score-label");

  const UI = {
    en: {
      title: "French & English Matching Game",
      heading: "Match the Words!",
      instruction: "Click two cards to find matching pairs — French and English.",
      options: "OPTIONS",
      chooseSet: "Choose a set:",
      level: "Level:",
      next: "Next",
      replay: "Replay",
      backToStart: "Back to start",
      score: "SCORE:",
      time: "TIME:",
      youDidIt: "You did it! Great job!",
      progress: "Level {level}/{maxLevel} · {pairs} pairs",
      loading: "Loading...",
      memorize: "Remember the cards!",
      go: "Go!",
      modeDaily: "Daily (3/day)",
      modePractice: "Practice (unlimited)",
      dailyProgress: "Daily {n}/3",
      doneForToday: "You've completed today's 3 levels! Come back tomorrow or switch to Practice.",
      doneForTodayShort: "Today's challenge complete!",
      switchToPractice: "Practice mode",
      backToStart: "Back to start",
      partners: "Our partners",
      sponsors: "Support the game",
      supportTheGame: "Support the game",
      redirectHint: "You'll be redirected to a new tab.",
      thankYouSponsor: "Thank you for supporting us...",
      yourStreak: "Your streak",
      darkMode: "Dark mode"
    },
    fr: {
      title: "Jeu d'association français-anglais",
      heading: "Associez les mots !",
      instruction: "Cliquez sur deux cartes pour trouver les paires français–anglais.",
      options: "Options",
      chooseSet: "Choisir un thème :",
      level: "Niveau :",
      next: "Suivant",
      replay: "Rejouer",
      backToStart: "Retour au début",
      score: "Score :",
      time: "Temps :",
      youDidIt: "Bravo ! Bien joué !",
      progress: "Niveau {level}/{maxLevel} · {pairs} paires",
      loading: "Chargement...",
      memorize: "Mémorisez les cartes !",
      go: "C'est parti !",
      modeDaily: "Quotidien (3/jour)",
      modePractice: "Entraînement (illimité)",
      dailyProgress: "Aujourd'hui {n}/3",
      doneForToday: "Vous avez terminé les 3 niveaux du jour ! Revenez demain ou passez en mode Entraînement.",
      doneForTodayShort: "Défi du jour terminé !",
      switchToPractice: "Mode entraînement",
      backToStart: "Retour au début",
      partners: "Nos partenaires",
      sponsors: "Soutenir le jeu",
      supportTheGame: "Soutenir le jeu",
      redirectHint: "Vous serez redirigé vers un nouvel onglet.",
      thankYouSponsor: "Merci de nous soutenir...",
      yourStreak: "Votre série",
      darkMode: "Mode sombre"
    }
  };

  const PARTNERS_URL = "https://omg10.com/4/10629150";

  const setNames = {
    en: { animals: "Animals", colors: "Colors", numbers: "Numbers", family: "Family", verbs: "Verbs", daily: "Today's challenge" },
    fr: { animals: "Animaux", colors: "Couleurs", numbers: "Nombres", family: "Famille", verbs: "Verbes", daily: "Défi du jour" }
  };

  const PAIRS_PER_LEVEL = 6;
  const POINTS_PER_MATCH = 10;
  const STREAK_BONUS_PER_MATCH = 5;
  const ROUND_TIME_SECONDS = 180;
  const PREVIEW_SECONDS = 6;
  const TIME_BONUS_MAX = 50;
  const TIME_BONUS_UNDER_SECONDS = 30;
  let previewTimeoutId = null;
  let previewCountdownInterval = null;
  const STARS_REQUIRED_TO_UNLOCK = 2;
  const DAILY_CHALLENGE_LEVELS = 3;
  /* Separate save namespace so this copy does not share data with other folders */
  const STORAGE_PREFIX = "matchingGameCopy";
  const STORAGE_KEY_MODE = STORAGE_PREFIX + "Mode";
  const STORAGE_KEY_DAILY_PREFIX = STORAGE_PREFIX + "Daily_";
  const STORAGE_KEY_LANG = STORAGE_PREFIX + "Lang";
  const STORAGE_KEY_SPONSOR_DATE = STORAGE_PREFIX + "SponsorClickDate";
  const STORAGE_KEY_LAST_DAILY_DATE = STORAGE_PREFIX + "LastDailyDate";
  const STORAGE_KEY_STREAK = STORAGE_PREFIX + "Streak";
  const STORAGE_KEY_CELEBRATION_MILESTONES = STORAGE_PREFIX + "CelebrationMilestones";
  const STORAGE_KEY_THEME = STORAGE_PREFIX + "Theme";
  const CELEBRATION_MILESTONES = [1, 7, 30, 100, 200, 365, 500, 1000];
  const STREAK_EMOJI = "🔥";
  const TITLE_TIERS = [
    { min: 0, en: "Learner", fr: "Apprenant", badges: "" },
    { min: 100, en: "Bronze Learner", fr: "Apprenant de bronze", badges: "🥉" },
    { min: 500, en: "Silver Scholar", fr: "Savant d'argent", badges: "🥉🥈" },
    { min: 1000, en: "Gold Master", fr: "Maître d'or", badges: "🥉🥈🥇" },
    { min: 2000, en: "Language Major", fr: "Expert en langues", badges: "🥉🥈🥇🎖️" },
    { min: 5000, en: "Grandmaster General", fr: "Grand maître", badges: "🥉🥈🥇🎖️⚔️" }
  ];

  const BG_MUSIC_SOURCES = ["bg1.mp3", "bg2.mp3", "bg3.mp3"];
  let bgMusicIndex = 0;
  let bgAudio = null;
  let bgMusicStarted = false;

  function playNextBgTrack() {
    if (!bgAudio || !BG_MUSIC_SOURCES.length) return;
    const src = BG_MUSIC_SOURCES[bgMusicIndex];
    bgAudio.src = src;
    bgAudio.volume = 0.35;
    bgAudio.loop = false;
    bgAudio.onended = function () {
      bgMusicIndex = (bgMusicIndex + 1) % BG_MUSIC_SOURCES.length;
      playNextBgTrack();
    };
    bgAudio.onerror = function () {
      bgMusicIndex = (bgMusicIndex + 1) % BG_MUSIC_SOURCES.length;
      playNextBgTrack();
    };
    bgAudio.play().catch(function () {});
  }

  function startBgMusic() {
    if (bgMusicStarted) return;
    bgMusicStarted = true;
    try {
      bgAudio = new Audio();
      playNextBgTrack();
    } catch (_) {}
  }

  function playSound(type) {
    try {
      const ctx = window.audioCtx || (window.audioCtx = new (window.AudioContext || window.webkitAudioContext)());
      if (ctx.state === "suspended") {
        ctx.resume().then(function () { playSound(type); }).catch(function () {});
        return;
      }
      const osc = ctx.createOscillator();
      osc.type = "sine";
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      if (type === "flip") {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === "match") {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === "win") {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.24);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (_) {}
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    roundStartTime = Date.now();
    timerText.textContent = formatTime(ROUND_TIME_SECONDS);
    timerInterval = setInterval(function () {
      const elapsed = Math.floor((Date.now() - roundStartTime) / 1000);
      const remaining = Math.max(0, ROUND_TIME_SECONDS - elapsed);
      timerText.textContent = formatTime(remaining);
      if (remaining <= 0) {
        stopTimer();
        if (matchedCount < PAIRS_PER_LEVEL) handleTimeUp();
      }
    }, 500);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function getElapsedSeconds() {
    return roundStartTime ? Math.floor((Date.now() - roundStartTime) / 1000) : 0;
  }

  function clearPreview() {
    if (previewTimeoutId) { clearTimeout(previewTimeoutId); previewTimeoutId = null; }
    if (previewCountdownInterval) { clearInterval(previewCountdownInterval); previewCountdownInterval = null; }
    const overlay = gameBoardWrap && gameBoardWrap.querySelector(".preview-overlay");
    if (overlay) overlay.remove();
    const optionsPanel = document.querySelector(".options-panel");
    if (optionsPanel) optionsPanel.classList.remove("preview-active");
  }

  function startPlay() {
    cards.forEach(function (card) { card.classList.remove("flipped"); });
    lockBoard = false;
    startTimer();
  }

  function computeTimeBonus(seconds) {
    if (seconds <= TIME_BONUS_UNDER_SECONDS) {
      return Math.max(0, TIME_BONUS_MAX - Math.floor((seconds / TIME_BONUS_UNDER_SECONDS) * TIME_BONUS_MAX));
    }
    return 0;
  }

  function getTitleForScore(score) {
    let tier = TITLE_TIERS[0];
    for (let i = TITLE_TIERS.length - 1; i >= 0; i--) {
      if (score >= TITLE_TIERS[i].min) {
        tier = TITLE_TIERS[i];
        break;
      }
    }
    return tier;
  }

  function updateTitleDisplay() {
    const el = document.getElementById("title-display");
    if (!el) return;
    const tier = getTitleForScore(sessionScore);
    const name = uiLang === "fr" ? tier.fr : tier.en;
    const badgeStr = tier.badges ? " " + tier.badges : "";
    el.textContent = name + badgeStr;
    el.setAttribute("aria-label", name);
  }

  function updateProgress() {
    if (!progressText) return;
    const level = currentLevel || 1;
    const maxLevel = currentSet ? getMaxLevel(currentSet) : 10;
    progressText.textContent = (UI[uiLang].progress || UI.en.progress)
      .replace("{level}", level)
      .replace("{maxLevel}", maxLevel)
      .replace("{pairs}", matchedCount + "/" + PAIRS_PER_LEVEL);
    const levelFill = document.getElementById("level-progress-fill");
    const levelBar = document.querySelector(".level-progress-bar");
    if (levelFill && levelBar) {
      const levelPct = maxLevel ? (level / maxLevel) * 100 : 0;
      levelFill.style.width = levelPct + "%";
      levelBar.setAttribute("aria-valuenow", level);
      levelBar.setAttribute("aria-valuemax", maxLevel);
    }
    const pairsFill = document.getElementById("progress-bar-fill");
    const pairsBar = document.getElementById("pairs-progress-bar");
    if (pairsFill && pairsBar) {
      const pct = PAIRS_PER_LEVEL ? (matchedCount / PAIRS_PER_LEVEL) * 100 : 0;
      pairsFill.style.width = pct + "%";
      pairsBar.setAttribute("aria-valuenow", matchedCount);
      pairsBar.setAttribute("aria-valuemax", PAIRS_PER_LEVEL);
    }
  }

  function updateScoreDisplay() {
    if (scoreValue) scoreValue.textContent = sessionScore;
    updateTitleDisplay();
    try {
      sessionStorage.setItem(STORAGE_PREFIX + "Score", String(sessionScore));
    } catch (_) {}
  }

  function loadSessionScore() {
    try {
      const saved = sessionStorage.getItem(STORAGE_PREFIX + "Score");
      if (saved !== null) sessionScore = parseInt(saved, 10) || 0;
    } catch (_) {}
  }

  function getHighestLevelPassed(setId) {
    try {
      const key = STORAGE_PREFIX + "Level_" + setId;
      const s = localStorage.getItem(key);
      return s !== null ? Math.max(0, Math.min(10, parseInt(s, 10) || 0)) : 0;
    } catch (_) { return 0; }
  }

  function setHighestLevelPassed(setId, level) {
    try {
      const key = STORAGE_PREFIX + "Level_" + setId;
      const prev = getHighestLevelPassed(setId);
      localStorage.setItem(key, String(Math.max(prev, level)));
    } catch (_) {}
  }

  function getLevelStars(setId, level) {
    try {
      const key = STORAGE_PREFIX + "Stars_" + setId + "_" + level;
      const s = localStorage.getItem(key);
      return s !== null ? Math.min(3, Math.max(0, parseInt(s, 10) || 0)) : 0;
    } catch (_) { return 0; }
  }

  function setLevelStars(setId, level, stars) {
    try {
      const key = STORAGE_PREFIX + "Stars_" + setId + "_" + level;
      const val = Math.min(3, Math.max(0, stars));
      localStorage.setItem(key, String(val));
    } catch (_) {}
  }

  function getSavedSetAndLevel() {
    try {
      const setId = localStorage.getItem(STORAGE_PREFIX + "CurrentSet");
      const level = parseInt(localStorage.getItem(STORAGE_PREFIX + "CurrentLevel"), 10);
      return { setId: setId || null, level: (level >= 1 && level <= 10) ? level : 1 };
    } catch (_) { return { setId: null, level: 1 }; }
  }

  function saveSetAndLevel(setId, level) {
    try {
      localStorage.setItem(STORAGE_PREFIX + "CurrentSet", String(setId));
      localStorage.setItem(STORAGE_PREFIX + "CurrentLevel", String(level));
    } catch (_) {}
  }

  function getTodayKey() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function getDailyCountToday() {
    try {
      const key = STORAGE_KEY_DAILY_PREFIX + getTodayKey();
      const s = localStorage.getItem(key);
      return s !== null ? Math.max(0, parseInt(s, 10) || 0) : 0;
    } catch (_) { return 0; }
  }

  function incrementDailyCount() {
    try {
      const key = STORAGE_KEY_DAILY_PREFIX + getTodayKey();
      const n = getDailyCountToday() + 1;
      localStorage.setItem(key, String(Math.min(DAILY_CHALLENGE_LEVELS, n)));
      updateStreakFromDailyPlay();
      return n;
    } catch (_) { return 0; }
  }

  function getYesterdayKey() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function updateStreakFromDailyPlay() {
    try {
      const today = getTodayKey();
      const yesterday = getYesterdayKey();
      const lastDate = localStorage.getItem(STORAGE_KEY_LAST_DAILY_DATE);
      const current = parseInt(localStorage.getItem(STORAGE_KEY_STREAK), 10) || 0;
      let next = 1;
      if (lastDate === today) next = current;
      else if (lastDate === yesterday) next = current + 1;
      localStorage.setItem(STORAGE_KEY_LAST_DAILY_DATE, today);
      localStorage.setItem(STORAGE_KEY_STREAK, String(next));
    } catch (_) {}
  }

  function getStreak() {
    try {
      const lastDate = localStorage.getItem(STORAGE_KEY_LAST_DAILY_DATE);
      const today = getTodayKey();
      const yesterday = getYesterdayKey();
      if (lastDate !== today && lastDate !== yesterday) return 0;
      return Math.max(0, parseInt(localStorage.getItem(STORAGE_KEY_STREAK), 10) || 0);
    } catch (_) { return 0; }
  }

  function getCelebrationShownMilestones() {
    try {
      const s = localStorage.getItem(STORAGE_KEY_CELEBRATION_MILESTONES);
      if (!s) return [];
      const arr = JSON.parse(s);
      return Array.isArray(arr) ? arr : [];
    } catch (_) { return []; }
  }

  function setCelebrationShownForMilestone(streak) {
    try {
      const arr = getCelebrationShownMilestones();
      if (arr.indexOf(streak) >= 0) return;
      arr.push(streak);
      arr.sort(function (a, b) { return a - b; });
      localStorage.setItem(STORAGE_KEY_CELEBRATION_MILESTONES, JSON.stringify(arr));
    } catch (_) {}
  }

  function shouldShowCelebrationOverlay() {
    const streak = getStreak();
    if (CELEBRATION_MILESTONES.indexOf(streak) < 0) return false;
    return getCelebrationShownMilestones().indexOf(streak) < 0;
  }

  function getGameMode() {
    try {
      const s = localStorage.getItem(STORAGE_KEY_MODE);
      return s === "practice" ? "practice" : "daily";
    } catch (_) { return "daily"; }
  }

  function setGameMode(mode) {
    try {
      localStorage.setItem(STORAGE_KEY_MODE, mode === "practice" ? "practice" : "daily");
    } catch (_) {}
  }

  function getSavedLang() {
    try {
      const s = localStorage.getItem(STORAGE_KEY_LANG);
      return s === "fr" ? "fr" : "en";
    } catch (_) { return "en"; }
  }

  function setSavedLang(lang) {
    try {
      localStorage.setItem(STORAGE_KEY_LANG, lang === "fr" ? "fr" : "en");
    } catch (_) {}
  }

  function getSavedTheme() {
    try {
      const s = localStorage.getItem(STORAGE_KEY_THEME);
      return s === "light" ? "light" : "dark";
    } catch (_) { return "dark"; }
  }

  function setSavedTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme === "dark" ? "dark" : "light");
    } catch (_) {}
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    if (!root) return;
    root.classList.remove("theme-light", "theme-dark");
    root.classList.add(theme === "dark" ? "theme-dark" : "theme-light");
    setSavedTheme(theme);
    const toggle = document.getElementById("dark-mode-toggle");
    if (toggle) {
      toggle.classList.toggle("active", theme === "dark");
      toggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    }
  }

  function getSponsorClickedToday() {
    try {
      return localStorage.getItem(STORAGE_KEY_SPONSOR_DATE) === getTodayKey();
    } catch (_) { return false; }
  }

  function setSponsorClickedToday() {
    try {
      localStorage.setItem(STORAGE_KEY_SPONSOR_DATE, getTodayKey());
    } catch (_) {}
  }

  function updateSponsorButton() {
    const el = document.getElementById("contribute-link");
    const hintEl = document.getElementById("redirect-hint");
    if (!el) return;
    const clicked = getSponsorClickedToday();
    const lang = uiLang || "en";
    if (clicked) {
      el.classList.add("clicked");
      el.textContent = (UI[lang] && UI[lang].thankYouSponsor) ? UI[lang].thankYouSponsor : "Thank you for supporting us...";
      el.setAttribute("aria-label", el.textContent);
      if (hintEl) hintEl.classList.add("hidden");
    } else {
      el.classList.remove("clicked");
      el.textContent = (UI[lang] && UI[lang].supportTheGame) ? UI[lang].supportTheGame : "Support the game";
      el.setAttribute("aria-label", el.textContent);
      if (hintEl) {
        hintEl.textContent = (UI[lang] && UI[lang].redirectHint) ? UI[lang].redirectHint : "You'll be redirected to a new tab.";
        hintEl.classList.remove("hidden");
      }
    }
  }

  function isPracticeMode() {
    return getGameMode() === "practice";
  }

  function getLevelsLeftToday() {
    if (isPracticeMode()) return 999;
    return Math.max(0, DAILY_CHALLENGE_LEVELS - getDailyCountToday());
  }

  function getDayOfYear() {
    const d = new Date();
    const start = new Date(d.getFullYear(), 0, 0);
    const diff = d - start;
    return Math.floor(diff / (24 * 60 * 60 * 1000));
  }

  function getTodayDailyStartIndex() {
    if (!dailyWords || dailyWords.length < 18) return 0;
    const numBlocks = Math.floor(dailyWords.length / 18);
    const todayKey = getTodayKey();
    let seed = 0;
    for (let i = 0; i < todayKey.length; i++) {
      seed = ((seed << 5) - seed + todayKey.charCodeAt(i)) | 0;
    }
    const blockIndex = Math.abs(seed) % Math.max(1, numBlocks);
    return blockIndex * 18;
  }

  function getTodayDailySet() {
    const start = getTodayDailyStartIndex();
    const pairs = (dailyWords || []).slice(start, start + 18);
    return { id: "daily", name: "Daily", pairs: pairs.length >= 18 ? pairs : (dailyWords || []).slice(0, 18) };
  }

  function showDailyLimitMessage() {
    const el = document.getElementById("daily-limit-message");
    if (el) el.classList.remove("hidden");
    const gameAreaEl = document.getElementById("game-area");
    if (gameAreaEl) gameAreaEl.classList.add("hidden");
    const optionsPanel = document.querySelector(".options-panel");
    if (optionsPanel) optionsPanel.classList.add("daily-complete-view");
  }

  function hideDailyLimitMessage() {
    const el = document.getElementById("daily-limit-message");
    if (el) el.classList.add("hidden");
    const gameAreaEl = document.getElementById("game-area");
    if (gameAreaEl) gameAreaEl.classList.remove("hidden");
    const optionsPanel = document.querySelector(".options-panel");
    if (optionsPanel) optionsPanel.classList.remove("daily-complete-view");
  }

  function updateDailyProgressDisplay() {
    const wrap = document.getElementById("daily-progress-wrap");
    const text = document.getElementById("daily-progress-text");
    const streakEl = document.getElementById("streak-display");
    if (!wrap || !text) return;
    if (isPracticeMode()) {
      wrap.classList.add("hidden");
      return;
    }
    wrap.classList.remove("hidden");
    const n = getDailyCountToday();
    const tpl = (UI[uiLang] && UI[uiLang].dailyProgress) ? UI[uiLang].dailyProgress : "Daily {n}/3";
    text.textContent = tpl.replace("{n}", String(n));
    if (streakEl) {
      const streak = getStreak();
      const numEl = streakEl.querySelector(".streak-number");
      const emojiEl = streakEl.querySelector(".streak-emoji");
      if (numEl) numEl.textContent = streak;
      if (emojiEl) emojiEl.textContent = STREAK_EMOJI;
      streakEl.setAttribute("aria-label", (uiLang === "fr" ? "Série de jours " : "Streak ") + streak);
    }
  }

  function updateModeSwitcherUI() {
    const mode = getGameMode();
    document.querySelectorAll(".btn-mode[data-mode]").forEach((btn) => {
      const dataMode = btn.getAttribute("data-mode");
      btn.classList.toggle("active", dataMode === mode);
      const label = dataMode === "daily" ? (UI[uiLang].modeDaily || "Daily (3/day)") : (UI[uiLang].modePractice || "Practice (unlimited)");
      btn.textContent = label;
    });
  }

  function updateDailyLimitMessageText() {
    const textEl = document.querySelector(".daily-limit-text");
    const practiceBtn = document.getElementById("daily-limit-practice-btn");
    const backBtn = document.getElementById("daily-limit-back-btn");
    if (textEl && UI[uiLang].doneForToday) textEl.textContent = UI[uiLang].doneForToday;
    if (practiceBtn && UI[uiLang].switchToPractice) practiceBtn.textContent = UI[uiLang].switchToPractice;
    if (backBtn && UI[uiLang].backToStart) backBtn.textContent = UI[uiLang].backToStart;
  }

  function getMaxUnlockedLevel(setId) {
    if (setId === "daily") return Math.min(3, Math.max(1, getDailyCountToday() + 1));
    const highestPassed = getHighestLevelPassed(setId);
    const maxUnlocked = Math.max(1, Math.min(10, highestPassed + 1));
    return maxUnlocked;
  }

  function computeStars(roundScoreVal, elapsedSeconds) {
    if (roundScoreVal >= 80 || elapsedSeconds <= 25) return 3;
    if (roundScoreVal >= 60 || elapsedSeconds <= 45) return 2;
    return 1;
  }

  function triggerConfetti() {
    const colors = ["#2563eb", "#3b82f6", "#60a5fa", "#22c55e", "#fbbf24", "#0ea5e9"];
    const container = document.createElement("div");
    container.className = "confetti-container";
    container.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 55; i++) {
      const p = document.createElement("div");
      p.className = "confetti-piece";
      p.style.left = Math.random() * 100 + "vw";
      p.style.animationDelay = Math.random() * 0.8 + "s";
      p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      p.style.width = (6 + Math.random() * 6) + "px";
      p.style.height = p.style.width;
      container.appendChild(p);
    }
    document.body.appendChild(container);
    setTimeout(function () { container.remove(); }, 2800);
  }

  function updateLevelDropdown() {
    const setId = currentSet ? currentSet.id : null;
    const maxUnlocked = setId ? getMaxUnlockedLevel(setId) : 1;
    const maxLevel = currentSet ? getMaxLevel(currentSet) : 10;
    const maxSelectable = Math.min(maxUnlocked, maxLevel);
    for (let i = 0; i < levelSelect.options.length; i++) {
      const opt = levelSelect.options[i];
      const val = parseInt(opt.value, 10);
      opt.disabled = val > maxSelectable;
    }
  }

  function updateLevelControlVisibility() {
    const isDaily = currentSet && currentSet.id === "daily" && !isPracticeMode();
    if (levelLabel) levelLabel.classList.toggle("hidden", isDaily);
    if (levelSelectRow) levelSelectRow.classList.toggle("hidden", isDaily);
    if (practiceLevelStrip) practiceLevelStrip.classList.toggle("hidden", isDaily);
    if (dailyLevelWrap) {
      dailyLevelWrap.classList.toggle("hidden", !isDaily);
      if (isDaily && dailyLevelDisplay) dailyLevelDisplay.textContent = (currentLevel || 1) + " / 3";
    }
    if (!isDaily && practiceLevelStrip) updatePracticeLevelStrip();
  }

  function buildPracticeLevelStrip() {
    if (!practiceLevelStrip) return;
    practiceLevelStrip.innerHTML = "";
    const maxLevel = 10;
    for (let n = 1; n <= maxLevel; n++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "practice-level-btn";
      btn.setAttribute("aria-label", "Level " + n);
      btn.dataset.level = String(n);
      btn.textContent = n;
      btn.addEventListener("click", () => {
        const level = parseInt(btn.dataset.level, 10);
        const set = currentSet && currentSet.id !== "daily" ? currentSet : (wordSets[0] || null);
        if (!set) return;
        const maxUnlocked = getMaxUnlockedLevel(set.id);
        if (level > maxUnlocked) return;
        levelSelect.value = String(level);
        currentLevel = level;
        startSet(set.id);
      });
      practiceLevelStrip.appendChild(btn);
    }
  }

  function updatePracticeLevelStrip() {
    if (!practiceLevelStrip || !currentSet || currentSet.id === "daily") return;
    const maxUnlocked = getMaxUnlockedLevel(currentSet.id);
    const maxLevel = getMaxLevel(currentSet);
    const buttons = practiceLevelStrip.querySelectorAll(".practice-level-btn");
    buttons.forEach((btn) => {
      const level = parseInt(btn.dataset.level, 10);
      const unlocked = level <= maxUnlocked && level <= maxLevel;
      btn.disabled = !unlocked;
      btn.classList.toggle("current", level === currentLevel);
      btn.setAttribute("aria-current", level === currentLevel ? "true" : "false");
    });
  }

  function shuffle(array) {
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function createCard(pairId, text, isChinese, emoji) {
    const card = document.createElement("div");
    card.className = "card" + (isChinese ? " chinese" : "");
    card.dataset.pairId = String(pairId);
    card.dataset.text = text;
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", "Card: " + text);

    const frontContent = escapeHtml(text) + (emoji ? '<span class="card-emoji">' + escapeHtml(emoji) + "</span>" : "");
    card.innerHTML =
      '<div class="card-inner">' +
      '<div class="card-face card-back"></div>' +
      '<div class="card-face card-front">' + frontContent + "</div>" +
      "</div>";

    card.addEventListener("click", () => handleCardClick(card));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleCardClick(card);
      }
    });

    return card;
  }

  function getMaxLevel(set) {
    if (!set || !set.pairs) return 1;
    return Math.min(10, Math.floor(set.pairs.length / PAIRS_PER_LEVEL));
  }

  function buildCardsFromSet(set, level) {
    // Each level uses a unique block of 6 pairs: L1 = 0-5, L2 = 6-11, ... L10 = 54-59. No overlap between levels.
    const levelNum = Math.max(1, parseInt(level, 10) || 1);
    const start = (levelNum - 1) * PAIRS_PER_LEVEL;
    const pairs = set.pairs || [];
    const pairList = pairs.slice(start, start + PAIRS_PER_LEVEL);
    const cardData = [];
    pairList.forEach((pair, index) => {
      const chinese = pair[0];
      const english = pair[1];
      const emoji = pair[2] || null;
      cardData.push({ pairId: index, text: chinese, isChinese: true, emoji: emoji });
      cardData.push({ pairId: index, text: english, isChinese: false, emoji: null });
    });
    return shuffle(cardData).map((c) =>
      createCard(c.pairId, c.text, c.isChinese, c.emoji)
    );
  }

  function updateNextButtonState() {
    nextBtn.disabled = !currentLevelCompleted;
    nextBtn.setAttribute("aria-disabled", currentLevelCompleted ? "false" : "true");
  }

  function handleTimeUp() {
    lockBoard = true;
    const timeupMessage = document.getElementById("timeup-message");
    const timeupText = document.getElementById("timeup-text");
    const timeupRetry = document.getElementById("timeup-retry-btn");
    const timeupBack = document.getElementById("timeup-back-btn");
    const timeupHint = document.querySelector(".timeup-hint");
    if (timeupText) timeupText.textContent = uiLang === "fr" ? "Le temps est écoulé !" : "Time's up!";
    if (timeupHint) timeupHint.textContent = uiLang === "fr" ? "Réessayez et associez toutes les paires avant la fin du temps !" : "Try again and match all pairs before the timer runs out!";
    if (timeupRetry) timeupRetry.textContent = uiLang === "fr" ? "Réessayer" : "Retry";
    if (timeupBack) timeupBack.textContent = UI[uiLang].backToStart || UI.en.backToStart;
    if (timeupMessage) timeupMessage.classList.remove("hidden");
  }

  function updateOptionsPanelPracticeView() {
    const optionsPanel = document.querySelector(".options-panel");
    if (!optionsPanel) return;
    if (isPracticeMode()) optionsPanel.classList.add("practice-mode-view");
    else optionsPanel.classList.remove("practice-mode-view");
  }

  function renderGame(set, level) {
    gameArea.innerHTML = "";
    clearSupportSpotlight();
    winMessage.classList.add("hidden");
    const timeupMessage = document.getElementById("timeup-message");
    if (timeupMessage) timeupMessage.classList.add("hidden");
    stopTimer();
    clearPreview();
    const optionsPanel = document.querySelector(".options-panel");
    if (optionsPanel) optionsPanel.classList.remove("round-complete");
    roundScore = 0;
    currentLevelCompleted = false;
    matchStreak = 0;
    updateNextButtonState();
    cards = buildCardsFromSet(set, level);
    cards.forEach(function (el) {
      el.classList.add("flipped");
      gameArea.appendChild(el);
    });
    firstCard = null;
    secondCard = null;
    lockBoard = true;
    matchedCount = 0;
    updateProgress();
    updateScoreDisplay();

    const memorizeText = UI[uiLang].memorize || UI.en.memorize;
    const goText = UI[uiLang].go || UI.en.go;
    if (optionsPanel) optionsPanel.classList.add("preview-active");
    const overlay = document.createElement("div");
    overlay.className = "preview-overlay";
    overlay.setAttribute("aria-live", "polite");
    const msg = document.createElement("p");
    msg.className = "preview-overlay-msg";
    msg.textContent = memorizeText;
    const countEl = document.createElement("p");
    countEl.className = "preview-overlay-count";
    countEl.textContent = String(PREVIEW_SECONDS);
    overlay.appendChild(msg);
    overlay.appendChild(countEl);
    if (gameBoardWrap) gameBoardWrap.appendChild(overlay);

    let remaining = PREVIEW_SECONDS;
    previewCountdownInterval = setInterval(function () {
      remaining -= 1;
      if (remaining > 0) countEl.textContent = String(remaining);
      else {
        if (previewCountdownInterval) { clearInterval(previewCountdownInterval); previewCountdownInterval = null; }
        countEl.textContent = goText;
      }
    }, 1000);

    previewTimeoutId = setTimeout(function () {
      previewTimeoutId = null;
      if (previewCountdownInterval) { clearInterval(previewCountdownInterval); previewCountdownInterval = null; }
      if (optionsPanel) optionsPanel.classList.remove("preview-active");
      overlay.remove();
      startPlay();
    }, PREVIEW_SECONDS * 1000);
  }

  function handleCardClick(card) {
    if (lockBoard) return;
    if (card === firstCard) return;
    if (card.classList.contains("matched")) return;

    card.classList.add("flipped");
    startBgMusic();
    playSound("flip");

    if (!firstCard) {
      firstCard = card;
      return;
    }

    secondCard = card;
    lockBoard = true;

    const match = firstCard.dataset.pairId === secondCard.dataset.pairId;

    if (match) {
      firstCard.classList.remove("flipped");
      secondCard.classList.remove("flipped");
      firstCard.classList.add("matched");
      secondCard.classList.add("matched");
      matchedCount += 1;
      matchStreak += 1;
      const matchPoints = POINTS_PER_MATCH + (matchStreak > 1 ? (matchStreak - 1) * STREAK_BONUS_PER_MATCH : 0);
      roundScore += matchPoints;
      sessionScore += matchPoints;
      updateProgress();
      updateScoreDisplay();
      playSound("match");
      lockBoard = false;
      firstCard = null;
      secondCard = null;

      if (matchedCount === PAIRS_PER_LEVEL) {
        currentLevelCompleted = true;
        setHighestLevelPassed(currentSet.id, currentLevel);
        if (!isPracticeMode()) incrementDailyCount();
        updateLevelDropdown();
        updateNextButtonState();
        updateDailyProgressDisplay();
        setTimeout(function () {
          stopTimer();
          const elapsed = getElapsedSeconds();
          const timeBonus = computeTimeBonus(elapsed);
          roundScore += timeBonus;
          sessionScore += timeBonus;
          updateScoreDisplay();
          const stars = computeStars(roundScore, elapsed);
          setLevelStars(currentSet.id, currentLevel, stars);
          updateLevelDropdown();
          playSound("win");
          const optionsPanel = document.querySelector(".options-panel");
          if (optionsPanel) optionsPanel.classList.add("round-complete");
          const dailyLimitReached = !isPracticeMode() && getDailyCountToday() >= DAILY_CHALLENGE_LEVELS;
          if (dailyLimitReached) {
            if (shouldShowCelebrationOverlay()) {
              setCelebrationShownForMilestone(getStreak());
              showDailyCompleteCelebration(function () { showWin(elapsed, stars, true); });
            } else {
              triggerConfetti();
              showWin(elapsed, stars, true);
            }
          } else {
            triggerConfetti();
            showWin(elapsed, stars, false);
          }
        }, 400);
      }
    } else {
      matchStreak = 0;
      setTimeout(() => {
        firstCard.classList.remove("flipped");
        secondCard.classList.remove("flipped");
        lockBoard = false;
        firstCard = null;
        secondCard = null;
      }, 800);
    }
  }

  function showDailyCompleteCelebration(onDone) {
    const overlay = document.getElementById("daily-complete-celebration");
    const labelEl = document.getElementById("daily-complete-streak-label");
    const numEl = document.querySelector(".daily-complete-num");
    const emojiEl = document.querySelector(".daily-complete-emoji");
    if (!overlay) {
      if (onDone) onDone();
      return;
    }
    const streak = getStreak();
    const lang = uiLang || "en";
    if (labelEl) labelEl.textContent = (UI[lang] && UI[lang].yourStreak) ? UI[lang].yourStreak : "Your streak";
    if (numEl) numEl.textContent = streak;
    if (emojiEl) emojiEl.textContent = STREAK_EMOJI;
    overlay.classList.remove("hidden");
    overlay.classList.add("visible");
    const reveal = overlay.querySelector(".daily-complete-streak-reveal");
    if (reveal) reveal.classList.remove("revealed");
    triggerConfetti();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (reveal) reveal.classList.add("revealed");
      });
    });
    setTimeout(function () {
      overlay.classList.remove("visible");
      overlay.classList.add("hidden");
      if (reveal) reveal.classList.remove("revealed");
      if (onDone) onDone();
    }, 1400);
  }

  function clearSupportSpotlight() {
    if (window._supportSpotlightTimeout) {
      clearTimeout(window._supportSpotlightTimeout);
      window._supportSpotlightTimeout = null;
    }
    if (window._supportSpotlightEndTimeout) {
      clearTimeout(window._supportSpotlightEndTimeout);
      window._supportSpotlightEndTimeout = null;
    }
    const overlay = document.getElementById("highlight-overlay");
    const supportLink = document.getElementById("contribute-link");
    if (overlay) {
      overlay.classList.add("hidden");
      overlay.setAttribute("aria-hidden", "true");
    }
    if (supportLink) supportLink.classList.remove("cta-highlight");
  }

  function showWin(elapsedSeconds, stars, dailyLimitReached) {
    document.getElementById("win-score-value").textContent = roundScore;
    const remaining = Math.max(0, ROUND_TIME_SECONDS - (elapsedSeconds || 0));
    document.getElementById("win-time-value").textContent = formatTime(remaining);
    const starsEl = document.getElementById("win-stars");
    const earned = typeof stars === "number" ? Math.min(3, Math.max(0, stars)) : 1;
    if (starsEl) {
      starsEl.innerHTML = "";
      starsEl.setAttribute("aria-label", earned + " star" + (earned !== 1 ? "s" : ""));
      for (let i = 0; i < 3; i++) {
        const span = document.createElement("span");
        span.className = "win-star" + (i < earned ? " win-star-filled" : " win-star-empty");
        span.textContent = i < earned ? "★" : "☆";
        span.style.animationDelay = (i * 0.28) + "s";
        starsEl.appendChild(span);
      }
    }
    const winTextEl = document.getElementById("win-text");
    const winNextBtnEl = document.getElementById("win-next-btn");
    const winPracticeBtnEl = document.getElementById("win-practice-btn");
    if (dailyLimitReached) {
      if (winTextEl) winTextEl.textContent = (UI[uiLang] && UI[uiLang].doneForTodayShort) ? UI[uiLang].doneForTodayShort : "Today's challenge complete!";
      if (winNextBtnEl) winNextBtnEl.classList.add("hidden");
      if (winPracticeBtnEl) winPracticeBtnEl.classList.remove("hidden");
    } else {
      if (winTextEl) winTextEl.textContent = UI[uiLang].youDidIt;
      if (winNextBtnEl) winNextBtnEl.classList.remove("hidden");
      if (winPracticeBtnEl) winPracticeBtnEl.classList.add("hidden");
    }
    winMessage.classList.remove("hidden");
    if (dailyLimitReached) {
      const streak = getStreak();
      const showSpotlight = streak === 1 || (streak >= 7 && streak % 7 === 0);
      if (showSpotlight) {
        if (window._supportSpotlightTimeout) clearTimeout(window._supportSpotlightTimeout);
        if (window._supportSpotlightEndTimeout) clearTimeout(window._supportSpotlightEndTimeout);
        window._supportSpotlightTimeout = setTimeout(function () {
          const overlay = document.getElementById("highlight-overlay");
          const supportLink = document.getElementById("contribute-link");
          if (overlay && supportLink) {
            overlay.classList.remove("hidden");
            overlay.setAttribute("aria-hidden", "false");
            supportLink.classList.add("cta-highlight");
            window._supportSpotlightEndTimeout = setTimeout(function () {
              overlay.classList.add("hidden");
              overlay.setAttribute("aria-hidden", "true");
              supportLink.classList.remove("cta-highlight");
            }, 2000);
          }
        }, 500);
      }
    }
  }

  function startSet(setId) {
    const set = setId === "daily" ? getTodayDailySet() : wordSets.find((s) => s.id === setId);
    if (!set || !set.pairs || set.pairs.length < PAIRS_PER_LEVEL) return;
    currentSet = set;
    hideDailyLimitMessage();
    if (!isPracticeMode() && getLevelsLeftToday() === 0) {
      showDailyLimitMessage();
      updateDailyProgressDisplay();
      return;
    }
    updateLevelDropdown();
    const maxUnlocked = getMaxUnlockedLevel(set.id);
    const maxLevel = getMaxLevel(set);
    const maxSelectable = Math.min(maxUnlocked, maxLevel);
    let requested = parseInt(levelSelect.value, 10) || 1;
    currentLevel = requested > maxSelectable ? maxSelectable : Math.max(1, Math.min(10, requested));
    if (currentLevel !== requested) levelSelect.value = currentLevel;
    saveSetAndLevel(set.id, currentLevel);
    updateLevelControlVisibility();
    renderGame(set, currentLevel);
  }

  function applyLanguage(lang) {
    uiLang = lang;
    setSavedLang(lang);
    document.title = UI[lang].title;
    document.documentElement.lang = lang === "fr" ? "fr" : "en";
    document.getElementById("page-title").textContent = UI[lang].heading;
    document.getElementById("instruction").textContent = UI[lang].instruction;
    document.getElementById("options-title").textContent = UI[lang].options;
    document.getElementById("set-label").textContent = UI[lang].chooseSet;
    if (levelLabel) levelLabel.textContent = UI[lang].level;
    nextBtn.textContent = UI[lang].next;
    winText.textContent = UI[lang].youDidIt;
    winNextBtn.textContent = UI[lang].next;
    winReplayBtn.textContent = UI[lang].replay;
    winBackBtn.textContent = UI[lang].backToStart;
    if (scoreLabel) scoreLabel.textContent = UI[lang].score + " ";
    const timeLabelEl = document.getElementById("time-label");
    if (timeLabelEl) timeLabelEl.textContent = UI[lang].time + " ";
    updateSponsorButton();
    updateModeSwitcherUI();
    updateDailyProgressDisplay();
    updateDailyLimitMessageText();
    updateOptionsPanelPracticeView();
    const savedSet = setSelect.value;
    refreshSetSelector();
    if (setSelect.querySelector('option[value="' + savedSet + '"]')) setSelect.value = savedSet;
    updateTitleDisplay();
    updateProgress();
    document.querySelectorAll(".btn-lang").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
    });
    const darkModeBtn = document.getElementById("dark-mode-toggle");
    if (darkModeBtn) darkModeBtn.textContent = UI[lang].darkMode;
  }

  function refreshSetSelector() {
    setSelect.innerHTML = "";
    if (isPracticeMode()) {
      wordSets.forEach((set) => {
        const opt = document.createElement("option");
        opt.value = set.id;
        opt.textContent = setNames[uiLang][set.id] || set.name;
        setSelect.appendChild(opt);
      });
    } else {
      const opt = document.createElement("option");
      opt.value = "daily";
      opt.textContent = setNames[uiLang].daily || "Today's challenge";
      setSelect.appendChild(opt);
    }
  }

  function initSelector() {
    if (getDailyCountToday() < DAILY_CHALLENGE_LEVELS) {
      setGameMode("daily");
    }
    updateModeSwitcherUI();
    updateOptionsPanelPracticeView();
    refreshSetSelector();
    buildPracticeLevelStrip();
    updateLevelDropdown();
    if (isPracticeMode()) {
      if (wordSets.length > 0) {
        const saved = getSavedSetAndLevel();
        const setExists = saved.setId && wordSets.some((s) => s.id === saved.setId);
        const setId = setExists ? saved.setId : wordSets[0].id;
        const set = wordSets.find((s) => s.id === setId);
        const maxUnlocked = set ? getMaxUnlockedLevel(set.id) : 1;
        const maxLevel = set ? getMaxLevel(set) : 10;
        const maxSelectable = Math.min(maxUnlocked, maxLevel);
        const level = setExists && saved.level >= 1 && saved.level <= maxSelectable ? saved.level : 1;
        setSelect.value = setId;
        levelSelect.value = String(level);
        currentLevel = level;
        startSet(setId);
      }
    } else {
      setSelect.value = "daily";
      const level = Math.min(3, Math.max(1, getDailyCountToday() + 1));
      levelSelect.value = String(level);
      currentLevel = level;
      startSet("daily");
    }
    updateDailyProgressDisplay();
  }

  function goToNextLevel() {
    if (!currentSet || !currentLevelCompleted) return;
    clearSupportSpotlight();
    winMessage.classList.add("hidden");
    updateLevelDropdown();
    const maxLevelThisSet = getMaxLevel(currentSet);
    const nextLevel = currentLevel >= 10 ? 1 : currentLevel + 1;
    const idx = currentSet.id === "daily" ? -1 : wordSets.findIndex((s) => s.id === currentSet.id);
    const nextSet = idx >= 0 && idx < wordSets.length - 1 ? wordSets[idx + 1] : null;
    if (nextLevel > maxLevelThisSet && nextSet) {
      setSelect.value = nextSet.id;
      levelSelect.value = "1";
      currentLevel = 1;
      startSet(nextSet.id);
      return;
    }
    if (currentLevel >= 10 && nextSet) {
      setSelect.value = nextSet.id;
      levelSelect.value = "1";
      currentLevel = 1;
      startSet(nextSet.id);
      return;
    }
    currentLevel = Math.min(nextLevel, maxLevelThisSet);
    levelSelect.value = String(currentLevel);
    startSet(currentSet.id);
  }

  nextBtn.addEventListener("click", goToNextLevel);
  winNextBtn.addEventListener("click", goToNextLevel);

  winReplayBtn.addEventListener("click", () => {
    if (!currentSet) return;
    clearSupportSpotlight();
    winMessage.classList.add("hidden");
    renderGame(currentSet, currentLevel);
  });

  winBackBtn.addEventListener("click", () => {
    clearSupportSpotlight();
    winMessage.classList.add("hidden");
    levelSelect.value = "1";
    currentLevel = 1;
    if (currentSet) startSet(currentSet.id);
  });

  const timeupRetryBtn = document.getElementById("timeup-retry-btn");
  const timeupBackBtn = document.getElementById("timeup-back-btn");
  if (timeupRetryBtn) {
    timeupRetryBtn.addEventListener("click", () => {
      const timeupMessage = document.getElementById("timeup-message");
      if (timeupMessage) timeupMessage.classList.add("hidden");
      if (currentSet) renderGame(currentSet, currentLevel);
    });
  }
  if (timeupBackBtn) {
    timeupBackBtn.addEventListener("click", () => {
      const timeupMessage = document.getElementById("timeup-message");
      if (timeupMessage) timeupMessage.classList.add("hidden");
      levelSelect.value = "1";
      currentLevel = 1;
      if (currentSet) startSet(currentSet.id);
    });
  }

  setSelect.addEventListener("change", () => {
    startSet(setSelect.value);
  });

  levelSelect.addEventListener("change", () => {
    const requested = parseInt(levelSelect.value, 10) || 1;
    const maxUnlocked = currentSet ? getMaxUnlockedLevel(currentSet.id) : 1;
    const maxLevel = currentSet ? getMaxLevel(currentSet) : 10;
    const maxSelectable = Math.min(maxUnlocked, maxLevel);
    if (requested > maxSelectable) {
      levelSelect.value = currentLevel;
      return;
    }
    currentLevel = requested;
    if (currentSet) startSet(currentSet.id);
  });

  document.getElementById("mode-daily").addEventListener("click", () => {
    setGameMode("daily");
    updateModeSwitcherUI();
    updateOptionsPanelPracticeView();
    updateDailyProgressDisplay();
    refreshSetSelector();
    setSelect.value = "daily";
    levelSelect.value = "1";
    currentLevel = 1;
    startSet("daily");
  });
  document.getElementById("mode-practice").addEventListener("click", () => {
    setGameMode("practice");
    updateModeSwitcherUI();
    updateOptionsPanelPracticeView();
    updateDailyProgressDisplay();
    hideDailyLimitMessage();
    refreshSetSelector();
    let setId = wordSets.length > 0 ? wordSets[0].id : setSelect.value;
    if (setId === "daily") setId = wordSets.length > 0 ? wordSets[0].id : null;
    setSelect.value = setId || "";
    levelSelect.value = "1";
    currentLevel = 1;
    if (setId) startSet(setId);
  });

  const dailyLimitPracticeBtn = document.getElementById("daily-limit-practice-btn");
  const dailyLimitBackBtn = document.getElementById("daily-limit-back-btn");
  if (dailyLimitPracticeBtn) {
    dailyLimitPracticeBtn.addEventListener("click", () => {
      setGameMode("practice");
      updateModeSwitcherUI();
      updateOptionsPanelPracticeView();
      updateDailyProgressDisplay();
      hideDailyLimitMessage();
      refreshSetSelector();
      let setId = wordSets.length > 0 ? wordSets[0].id : setSelect.value;
      if (setId === "daily") setId = wordSets.length > 0 ? wordSets[0].id : null;
      setSelect.value = setId || "";
      levelSelect.value = "1";
      currentLevel = 1;
      if (setId) startSet(setId);
    });
  }
  if (dailyLimitBackBtn) {
    dailyLimitBackBtn.addEventListener("click", () => {
      hideDailyLimitMessage();
      levelSelect.value = "1";
      currentLevel = 1;
      if (currentSet) startSet(currentSet.id);
    });
  }

  const winPracticeBtn = document.getElementById("win-practice-btn");
  if (winPracticeBtn) {
    winPracticeBtn.addEventListener("click", () => {
      setGameMode("practice");
      updateModeSwitcherUI();
      updateOptionsPanelPracticeView();
      updateDailyProgressDisplay();
      clearSupportSpotlight();
    winMessage.classList.add("hidden");
      hideDailyLimitMessage();
      refreshSetSelector();
      const setId = wordSets.length > 0 ? wordSets[0].id : null;
      if (setId) {
        setSelect.value = setId;
        levelSelect.value = "1";
        currentLevel = 1;
        startSet(setId);
      }
    });
  }

  const supportLinkEl = document.getElementById("contribute-link");
  if (supportLinkEl) {
    supportLinkEl.addEventListener("click", function (e) {
      if (getSponsorClickedToday()) {
        e.preventDefault();
        return;
      }
      window.open(PARTNERS_URL, "_blank", "noopener,noreferrer");
      setSponsorClickedToday();
      updateSponsorButton();
      e.preventDefault();
    });
  }
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") updateSponsorButton();
  });

  document.getElementById("lang-en").addEventListener("click", () => { applyLanguage("en"); startBgMusic(); });
  document.getElementById("lang-fr").addEventListener("click", () => { applyLanguage("fr"); startBgMusic(); });
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  if (darkModeToggle) {
    darkModeToggle.addEventListener("click", function () {
      applyTheme(getSavedTheme() === "dark" ? "light" : "dark");
    });
  }

  loadSessionScore();

  const builtinSets = { sets: (function () {
    try {
      return JSON.parse('{"sets":[{"id":"animals","name":"Animals","pairs":[["chien","dog","🐶"],["chat","cat","🐱"],["oiseau","bird","🐦"],["poisson","fish","🐟"],["lapin","rabbit","🐰"],["cheval","horse","🐴"],["vache","cow","🐄"],["mouton","sheep","🐑"],["cochon","pig","🐷"],["poule","chicken","🐔"],["canard","duck","🦆"],["souris","mouse","🐭"],["tigre","tiger","🐯"],["dragon","dragon","🐉"],["serpent","snake","🐍"],["singe","monkey","🐵"],["ours","bear","🐻"],["loup","wolf","🐺"],["éléphant","elephant","🐘"],["cerf","deer","🦌"],["renard","fox","🦊"],["panda","panda","🐼"],["lion","lion","🦁"],["abeille","bee","🐝"],["papillon","butterfly","🦋"],["fourmi","ant","🐜"],["araignée","spider","🕷️"],["crabe","crab","🦀"],["grenouille","frog","🐸"],["tortue","turtle","🐢"],["crocodile","crocodile","🐊"],["pingouin","penguin","🐧"],["hibou","owl","🦉"],["chauve-souris","bat","🦇"],["hérisson","hedgehog","🦔"],["kangourou","kangaroo","🦘"],["koala","koala","🐨"],["girafe","giraffe","🦒"],["zèbre","zebra","🦓"],["hippopotame","hippo","🦛"],["rhinocéros","rhino","🦏"],["orang-outan","orangutan","🦧"],["écureuil","squirrel","🐿️"],["dauphin","dolphin","🐬"],["baleine","whale","🐋"],["requin","shark","🦈"],["étoile de mer","starfish","⭐"],["poulpe","octopus","🐙"],["escargot","snail","🐌"],["ver de terre","earthworm","🪱"],["coccinelle","ladybug","🐞"],["libellule","dragonfly","🦋"],["criquet","cricket","🦗"],["luciole","firefly","✨"]]},{"id":"colors","name":"Colors","pairs":[["rouge","red","🔴"],["bleu","blue","🔵"],["jaune","yellow","🟡"],["vert","green","🟢"],["noir","black","⚫"],["blanc","white","⚪"],["orange","orange","🟠"],["violet","purple","🟣"],["rose","pink","🌸"],["marron","brown","🟤"],["gris","grey","◻️"],["or","gold","✨"],["argent","silver","⚪"],["cyan","cyan","💎"],["beige","beige","🍚"],["bleu foncé","dark blue","🔵"],["vert clair","light green","🟢"],["rouge foncé","dark red","🔴"],["bleu ciel","sky blue","🔵"],["jaune citron","lemon yellow","🟡"],["vert olive","olive green","🟢"],["rose","rose red","🔴"],["bleu marine","navy blue","🔵"],["vert menthe","mint green","🟢"],["pêche","peach","🍑"],["lavande","lavender","🟣"],["corail","coral","🪸"],["indigo","indigo","🟣"],["tan","tan","🟤"],["crème","cream","🥛"],["bordeaux","maroon","🔴"],["citron vert","lime","🟢"],["ambre","amber","🟡"],["émeraude","emerald","💎"],["vermillon","vermilion","🔴"],["bleu marine","navy","🔵"],["ivoire","ivory","⚪"],["charbon","charcoal","◻️"],["auburn","auburn","🟤"],["magenta","magenta","🟣"],["sarcelle","teal","🟢"],["abricot","apricot","🟡"],["écarlate","scarlet","🔴"],["bleu cobalt","cobalt blue","🔵"],["olive","olive","🟢"],["violet","violet","🟣"],["blé","wheat","🟡"],["ardoise","slate grey","◻️"]]},{"id":"numbers","name":"Numbers","pairs":[["un","one","1️⃣"],["deux","two","2️⃣"],["trois","three","3️⃣"],["quatre","four","4️⃣"],["cinq","five","5️⃣"],["six","six","6️⃣"],["sept","seven","7️⃣"],["huit","eight","8️⃣"],["neuf","nine","9️⃣"],["dix","ten","🔟"],["zéro","zero","0️⃣"],["cent","hundred","💯"],["mille","thousand","🔢"],["moitié","half","➗"],["deux (comptage)","two (counting)","2️⃣"],["premier","first","1️⃣"],["deuxième","second","2️⃣"],["troisième","third","3️⃣"],["combien","how many","❓"],["beaucoup","many","📦"],["peu","few","📉"],["paire","pair","2️⃣"],["douzaine","dozen","1️⃣2️⃣"],["fois","times","✖️"],["plus","plus","➕"],["moins","minus","➖"],["multiplier","multiply","✖️"],["diviser","divide","➗"],["égale","equals","🟰"],["nombre","number","🔢"],["impair","odd number","1️⃣"],["pair","even number","2️⃣"],["fraction","fraction","½"],["décimal","decimal","1.5"],["pour cent","percent","%"],["multiple","multiple","✖️"],["quantité","quantity","📊"],["ordre","order","1️⃣2️⃣3️⃣"],["compte à rebours","countdown","⏱️"],["entier","whole number","🔢"],["double","double","2️⃣"],["simple","single","1️⃣"],["adolescents","teens","1️⃣🔟"],["dizaines","tens","🔟"],["reste","odd","🔢"],["entier","whole","1️⃣"],["reste","remainder","➗"],["environ","approximately","≈"]]},{"id":"family","name":"Family","pairs":[["maman","mom","👩"],["papa","dad","👨"],["frère aîné","older brother","👦"],["sœur aînée","older sister","👧"],["frère cadet","younger brother","👦"],["sœur cadette","younger sister","👧"],["papi","grandpa","👴"],["mamie","grandma","👵"],["bébé","baby","👶"],["famille","family","🏠"],["grand-père (maternel)","grandpa (maternal)","👴"],["grand-mère (maternelle)","grandma (maternal)","👵"],["oncle","uncle","👨"],["tante","aunt","👩"],["ami","friend","👫"],["fils","son","👦"],["fille","daughter","👧"],["mari","husband","👨"],["femme","wife","👩"],["parents","parents","👨👩"],["frères","brothers","👦👦"],["sœurs","sisters","👧👧"],["grands-parents","grandparents","👴👵"],["petit-fils","grandson","👦"],["petite-fille","granddaughter","👧"],["cousin","male cousin","👦"],["cousine","female cousin","👧"],["neveu","nephew","👦"],["nièce","niece","👧"],["cousin (paternel)","cousin (paternal)","👦"],["parents","relatives","👨👩"],["voisin","neighbor","🏠"],["camarade","classmate","📚"],["professeur","teacher","👩‍🏫"],["élève","student","📖"],["adulte","adult","👨"],["enfant","child","👶"],["homme","man","👨"],["femme","woman","👩"],["garçon","boy","👦"],["fille","girl","👧"],["jumeaux","twins","👫"],["marié","groom","👨"],["mariée","bride","👩"],["beau-père","stepfather","👨"],["belle-mère","stepmother","👩"],["fils adoptif","adopted son","👦"],["famille","family members","👨👩👧👦"]]},{"id":"verbs","name":"Verbs","pairs":[["courir","run","🏃"],["marcher","walk","🚶"],["manger","eat","🍽️"],["boire","drink","🥤"],["dormir","sleep","😴"],["voir","see","👀"],["écouter","listen","👂"],["dire","say","🗣️"],["lire","read","📖"],["écrire","write","✍️"],["chanter","sing","🎤"],["jouer","play","🎮"],["étudier","study","📚"],["travailler","work","💼"],["aimer","love","❤️"],["aimer","like","👍"],["penser","think","🤔"],["venir","come","👉"],["aller","go","👋"],["acheter","buy","🛒"],["ouvrir","open","📂"],["fermer","close","❌"],["demander","ask","❓"],["aider","help","🆘"],["donner","give","🎁"],["prendre","take","✋"],["mettre","put","📍"],["s\'asseoir","sit","🪑"],["debout","stand","🧍"],["voler","fly","✈️"],["nager","swim","🏊"],["grimper","climb","🧗"],["sauter","jump","⬆️"],["attendre","wait","⏳"],["enseigner","teach","👩‍🏫"],["apprendre","learn","📖"],["commencer","start","▶️"],["finir","finish","🏁"],["oublier","forget","🤷"],["se souvenir","remember","🧠"],["essayer","try","💪"],["avoir besoin","need","📌"],["vouloir","want","🙏"],["faire","do","✅"],["trouver","find","🔍"],["utiliser","use","🔧"],["appeler","call","📞"],["répondre","answer","💬"],["rire","laugh","😄"],["pleurer","cry","😢"],["dessiner","draw","🖌️"],["danser","dance","💃"],["cuisiner","cook","👨‍🍳"],["laver","wash","🧼"]]}]}').sets;
    } catch (e) {
      return [
        { id: "animals", name: "Animals", pairs: [["chien", "dog", "🐶"], ["chat", "cat", "🐱"], ["oiseau", "bird", "🐦"], ["poisson", "fish", "🐟"], ["lapin", "rabbit", "🐰"], ["cheval", "horse", "🐴"], ["vache", "cow", "🐄"], ["mouton", "sheep", "🐑"], ["cochon", "pig", "🐷"], ["poule", "chicken", "🐔"], ["canard", "duck", "🦆"], ["souris", "mouse", "🐭"], ["tigre", "tiger", "🐯"], ["dragon", "dragon", "🐉"], ["serpent", "snake", "🐍"]] },
        { id: "colors", name: "Colors", pairs: [["rouge", "red", "🔴"], ["bleu", "blue", "🔵"], ["jaune", "yellow", "🟡"], ["vert", "green", "🟢"], ["noir", "black", "⚫"], ["blanc", "white", "⚪"], ["orange", "orange", "🟠"], ["violet", "purple", "🟣"], ["rose", "pink", "🌸"], ["marron", "brown", "🟤"], ["gris", "grey", "◻️"], ["or", "gold", "✨"], ["argent", "silver", "⚪"], ["cyan", "cyan", "💎"], ["beige", "beige", "🍚"]] },
        { id: "numbers", name: "Numbers", pairs: [["un", "one", "1️⃣"], ["deux", "two", "2️⃣"], ["trois", "three", "3️⃣"], ["quatre", "four", "4️⃣"], ["cinq", "five", "5️⃣"], ["six", "six", "6️⃣"], ["sept", "seven", "7️⃣"], ["huit", "eight", "8️⃣"], ["neuf", "nine", "9️⃣"], ["dix", "ten", "🔟"], ["zéro", "zero", "0️⃣"], ["cent", "hundred", "💯"], ["mille", "thousand", "🔢"], ["moitié", "half", "➗"], ["deux (comptage)", "two (counting)", "2️⃣"]] },
        { id: "family", name: "Family", pairs: [["maman", "mom", "👩"], ["papa", "dad", "👨"], ["frère aîné", "older brother", "👦"], ["sœur aînée", "older sister", "👧"], ["frère cadet", "younger brother", "👦"], ["sœur cadette", "younger sister", "👧"], ["papi", "grandpa", "👴"], ["mamie", "grandma", "👵"], ["bébé", "baby", "👶"], ["famille", "family", "🏠"], ["grand-père (maternel)", "grandpa (maternal)", "👴"], ["grand-mère (maternelle)", "grandma (maternal)", "👵"], ["oncle", "uncle", "👨"], ["tante", "aunt", "👩"], ["ami", "friend", "👫"]] },
        { id: "verbs", name: "Verbs", pairs: [["courir", "run", "🏃"], ["marcher", "walk", "🚶"], ["manger", "eat", "🍽️"], ["boire", "drink", "🥤"], ["dormir", "sleep", "😴"], ["voir", "see", "👀"], ["écouter", "listen", "👂"], ["dire", "say", "🗣️"], ["lire", "read", "📖"], ["écrire", "write", "✍️"], ["chanter", "sing", "🎤"], ["jouer", "play", "🎮"], ["étudier", "study", "📚"], ["travailler", "work", "💼"], ["aimer", "love", "❤️"]] }
      ];
    }
  })() };

  const builtinDailyPairs = [
    ["table", "table", "🪑"], ["chaise", "chair", "🪑"], ["lit", "bed", "🛏️"], ["canapé", "sofa", "🛋️"], ["porte", "door", "🚪"], ["fenêtre", "window", "🪟"],
    ["lampe", "lamp", "💡"], ["livre", "book", "📖"], ["stylo", "pen", "🖊️"], ["téléphone", "phone", "📱"], ["ordinateur", "computer", "💻"], ["tasse", "cup", "🥤"],
    ["bol", "bowl", "🥣"], ["assiette", "plate", "🍽️"], ["couteau", "knife", "🔪"], ["fourchette", "fork", "🍴"], ["cuillère", "spoon", "🥄"], ["clé", "key", "🔑"]
  ];

  function loadDailyWords() {
    return fetch("daily-words.json")
      .then((r) => r.json())
      .then((data) => {
        dailyWords = (data && data.pairs && data.pairs.length >= 18) ? data.pairs : builtinDailyPairs;
      })
      .catch(() => {
        dailyWords = builtinDailyPairs;
      });
  }

  Promise.all([
    fetch("words.json").then((r) => r.json()).then((data) => {
      wordSets = (data && data.sets && data.sets.length) ? data.sets : builtinSets.sets;
    }).catch(() => { wordSets = builtinSets.sets; }),
    loadDailyWords()
  ]).then(() => {
    uiLang = getSavedLang();
    initSelector();
    applyLanguage(uiLang);
    applyTheme(getSavedTheme());
    updateSponsorButton();
  });
})();

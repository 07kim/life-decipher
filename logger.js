// ステルスログ収集エンジン
// プレイヤーの行動を無音で収集する
window.LD = window.LD || {};

window.LD.Logger = (function () {
  const log = {
    sessionStart: Date.now(),
    clicks: [],
    anomalyClickCount: 0,
    pointerRoughness: 0,
    fileOpenOrder: [],
    totalFilesOpened: new Set(),
    scrollAttempts: 0,
    audioReplays: {},
    escCount: 0,
    windowCloseCount: 0,
    idleStart: Date.now(),
    maxIdleTime: 0,
    folderCreated: false,
    notesMoved: 0,
    passwordAttempts: []
  };

  let lastClickTime = 0;
  let consecutiveClicks = 0;
  let idleTimer = null;

  // ===========================
  // アノマリークリック検出
  // 400ms以内の連続クリックを「焦り」として計測
  // ===========================
  function detectAnomalyClick(e) {
    const now = Date.now();
    const diff = now - lastClickTime;

    if (diff < 400) {
      consecutiveClicks++;
      if (consecutiveClicks >= 3) {
        log.anomalyClickCount++;
        window.LD.Assessment && window.LD.Assessment.update('frustration', 1);
      }
    } else {
      consecutiveClicks = 1;
    }

    lastClickTime = now;
    log.clicks.push({
      x: e.clientX,
      y: e.clientY,
      target: e.target.id || e.target.className || e.target.tagName,
      time: now - log.sessionStart,
      isAnomaly: consecutiveClicks >= 3
    });
  }

  // ===========================
  // ポインター軌跡ラフネス計測
  // 方向転換の多さ = 迷い・苛立ちの指標
  // ===========================
  function initPointerTracking() {
    let lastX = 0, lastY = 0, lastAngle = null;
    let totalMoves = 0, dirChanges = 0;

    document.addEventListener('mousemove', (e) => {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 8) {
        const angle = Math.atan2(dy, dx);
        if (lastAngle !== null) {
          let diff = Math.abs(angle - lastAngle);
          if (diff > Math.PI) diff = 2 * Math.PI - diff;
          if (diff > Math.PI / 3) dirChanges++;
        }
        lastAngle = angle;
        totalMoves++;

        if (totalMoves > 20) {
          log.pointerRoughness = dirChanges / totalMoves;
          if (log.pointerRoughness > 0.55) {
            window.LD.Assessment && window.LD.Assessment.update('frustration', 0.3);
          }
        }
        lastX = e.clientX;
        lastY = e.clientY;
      }
    });
  }

  // ===========================
  // アイドル時間管理
  // ===========================
  function resetIdle() {
    const now = Date.now();
    const idleTime = now - log.idleStart;
    if (idleTime > log.maxIdleTime) log.maxIdleTime = idleTime;
    log.idleStart = now;

    if (idleTimer) clearTimeout(idleTimer);
    // 5分間操作なし → Level3 トリガー
    idleTimer = setTimeout(() => {
      window.LD.Effects && window.LD.Effects.triggerLevel3();
    }, 5 * 60 * 1000);
  }

  // ===========================
  // キーボードイベント
  // ===========================
  function initKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'F1') {
        log.escCount++;
        window.LD.Assessment && window.LD.Assessment.update('frustration', 2);
        window.LD.Effects && window.LD.Effects.checkThresholds(log);
      }
      resetIdle();
    });
  }

  return {
    init() {
      document.addEventListener('click', (e) => {
        detectAnomalyClick(e);
        window.LD.Effects && window.LD.Effects.checkThresholds(log);
        resetIdle();
      });
      initPointerTracking();
      initKeyboard();
      resetIdle();
    },

    logFileOpen(fileId, fileName) {
      if (!log.totalFilesOpened.has(fileId)) {
        log.fileOpenOrder.push({
          id: fileId,
          name: fileName,
          time: Date.now() - log.sessionStart
        });
        log.totalFilesOpened.add(fileId);
      }
      window.LD.Assessment && window.LD.Assessment.update('openness', 1);
    },

    logCensoredScroll() {
      log.scrollAttempts++;
      if (log.scrollAttempts > 3) {
        window.LD.Assessment && window.LD.Assessment.update('openness', 0.5);
      }
    },

    logAudioReplay(audioId) {
      log.audioReplays[audioId] = (log.audioReplays[audioId] || 0) + 1;
      if (log.audioReplays[audioId] > 1) {
        window.LD.Assessment && window.LD.Assessment.update('openness', 1);
      }
    },

    logWindowClose() {
      log.windowCloseCount++;
      window.LD.Assessment && window.LD.Assessment.update('frustration', 1.5);
      window.LD.Effects && window.LD.Effects.checkThresholds(log);
    },

    logNoteMoved() {
      log.notesMoved++;
      window.LD.Assessment && window.LD.Assessment.update('planning', 3);
    },

    logPasswordAttempt(attempt, success) {
      log.passwordAttempts.push({
        attempt,
        success,
        time: Date.now() - log.sessionStart
      });
      if (success) {
        window.LD.Assessment && window.LD.Assessment.update('immersion', 5);
      } else {
        window.LD.Assessment && window.LD.Assessment.update('immersion', 1);
        window.LD.Effects && window.LD.Effects.checkThresholds(log);
      }
    },

    getLog() {
      return {
        ...log,
        totalFilesOpened: log.totalFilesOpened,
        elapsedMs: Date.now() - log.sessionStart
      };
    }
  };
})();

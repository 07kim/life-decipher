// ステルスログ収集エンジン
// プレイヤーの行動を無音で収集する
window.LD = window.LD || {};

window.LD.Logger = (function () {
  const log = {
    sessionStart: Date.now(),
    clicks: [],
    clickCount: 0,
    dragDistance: 0,
    fileOpens: {},
    totalFilesOpened: new Set(),
    audioPlays: 0,
    passwordAttempts: [], // { pass: string, success: bool }
    // 新アセスメント指標
    noteDrags: { red: 0, yellow: 0, blue: 0, green: 0 },
    sameColorArrangement: false,
    tricolorArrangement: false,
    diaryReads: [], // 開いた順序の記録
    audioStops: 0,
    audioCompletes: 0,
    // Anomalies
    anomalyClickCount: 0,
    escCount: 0,
    idleStart: Date.now(),
    glitchTriggers: 0,
    pointerRoughness: 0,
    scrollAttempts: 0,
    windowCloseCount: 0,
    maxIdleTime: 0,
    folderCreated: false,
    fileOpenOrder: [],
    diaryReorderCount: 0,
    diaryChronological: false,
    browserSearches: [],
    systemUnlocked: false,
    unlockType: null,
    terminalCommands: [],
    browserSiteVisits: {},
    mailsRead: [],
    mailDraftSent: false,
    mailDraftContent: '',
    twitxLoggedIn: false,
    mailboxLoggedIn: false,
    twitxDmRead: false,
    twitxDmSent: false,
    twitxMessages: [],
    twitxReplies: [],
    goalsReached: [],
    recycleRestored: [],
    shutdown: false,
    resonanceMessages: {},
    resonanceLikes: [],
    resonancePasses: [],
    gameResults: { g2048: [], sweep: [], typing: [] }
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
    // 1分間操作なし → Level3 トリガー
    idleTimer = setTimeout(() => {
      window.LD.Effects && window.LD.Effects.triggerLevel3();
    }, 1 * 60 * 1000);
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

    logFileOpen(id, name) {
      if (!log.totalFilesOpened.has(id)) {
        log.fileOpenOrder.push({
          id: id,
          name: name,
          time: Date.now() - log.sessionStart
        });
        log.totalFilesOpened.add(id);
      }
      log.fileOpens[id] = (log.fileOpens[id] || 0) + 1;
      
      // 日記の閲覧順序を記録
      if (id.startsWith('diary-d')) {
        log.diaryReads.push(id.replace('diary-d', '')); // '1', '2' などのIDを保存
      }
    },

    logCensoredScroll() {
      log.scrollAttempts++;
      if (log.scrollAttempts > 3) {
        window.LD.Assessment && window.LD.Assessment.update('openness', 0.5);
      }
    },

    logAudioReplay(id) { log.audioPlays++; },
    logAudioStop() { log.audioStops++; },
    logAudioComplete() { log.audioCompletes++; },

    logWindowClose() {
      log.windowCloseCount++;
      window.LD.Assessment && window.LD.Assessment.update('frustration', 1.5);
      window.LD.Effects && window.LD.Effects.checkThresholds(log);
    },

    logNoteMoved(type) {
      if (type && log.noteDrags[type] !== undefined) {
        log.noteDrags[type]++;
      }
    },

    logDiaryReorder() {
      log.diaryReorderCount++;
      window.LD.Assessment && window.LD.Assessment.update('conscientiousness', 1);
    },

    logDiaryChronological() {
      log.diaryChronological = true;
      window.LD.Assessment && window.LD.Assessment.update('conscientiousness', 20);
      // 日記を時系列で全読みした → 行動ベース自動解錠をトリガー
      document.dispatchEvent(new CustomEvent('ld:auto-unlock', { detail: { type: 'linguistic' } }));
    },

    logUnlock(type) {
      log.systemUnlocked = true;
      log.unlockType = type;
    },

    logTerminalCommand(cmd) {
      log.terminalCommands.push({ cmd, time: Date.now() - log.sessionStart });
      window.LD.Assessment && window.LD.Assessment.update('openness', 0.5);
    },

    logBrowserSearch(q) {
      log.browserSearches.push({ q, time: Date.now() - log.sessionStart });
      window.LD.Assessment && window.LD.Assessment.update('openness', 1);
    },

    logSameColorArrangement() {
      log.sameColorArrangement = true;
      window.LD.Assessment && window.LD.Assessment.update('spatial', 10);
      window.LD.Assessment && window.LD.Assessment.update('openness', 5);
    },

    logTricolorArrangement() {
      log.tricolorArrangement = true;
      window.LD.Assessment && window.LD.Assessment.update('integration', 15);
      window.LD.Assessment && window.LD.Assessment.update('spatial', 5);
    },

    logPasswordAttempt(pass, success) {
      log.passwordAttempts.push({ pass, success });
      if (success) {
        window.LD.Assessment && window.LD.Assessment.update('immersion', 5);
      } else {
        window.LD.Assessment && window.LD.Assessment.update('immersion', 1);
        window.LD.Effects && window.LD.Effects.checkThresholds(log);
      }
    },

    logBrowserSiteVisit(site) {
      log.browserSiteVisits[site] = (log.browserSiteVisits[site] || 0) + 1;
      if (log.browserSiteVisits[site] === 1) {
        window.LD.Assessment && window.LD.Assessment.update('info_seeking', 8);
      }
    },

    logMailRead(mailId) {
      if (!log.mailsRead.includes(mailId)) {
        log.mailsRead.push(mailId);
        window.LD.Assessment && window.LD.Assessment.update('info_seeking', 5);
        window.LD.Assessment && window.LD.Assessment.update('conscientiousness', 2);
      }
    },

    logMailDraftSent(content) {
      log.mailDraftSent = true;
      log.mailDraftContent = content;
      window.LD.Assessment && window.LD.Assessment.update('info_seeking', 20);
      window.LD.Assessment && window.LD.Assessment.update('openness', 10);
    },

    logTwitxDmRead() {
      log.twitxDmRead = true;
      window.LD.Assessment && window.LD.Assessment.update('info_seeking', 10);
      window.LD.Assessment && window.LD.Assessment.update('linguistic', 5);
    },

    logTwitxDmSent(msg) {
      log.twitxDmSent = true;
      log.twitxMessages.push(msg);
      window.LD.Assessment && window.LD.Assessment.update('info_seeking', 20);
      window.LD.Assessment && window.LD.Assessment.update('linguistic', 10);
    },

    logTwitxReply(postId, handle, body, watcherReply) {
      log.twitxReplies.push({ postId, handle, body, watcherReply, time: Date.now() - log.sessionStart });
      window.LD.Assessment && window.LD.Assessment.update('info_seeking', 8);
      window.LD.Assessment && window.LD.Assessment.update('linguistic', 5);
    },

    logTwitXLogin(route) {
      log.twitxLoggedIn = true;
      window.LD.Assessment && window.LD.Assessment.update('info_seeking', 15);
      window.LD.Assessment && window.LD.Assessment.update('integration', 10);
    },

    logResonanceMessage(profileId, text, reply) {
      if (!log.resonanceMessages[profileId]) log.resonanceMessages[profileId] = [];
      log.resonanceMessages[profileId].push({ text, reply });
      window.LD.Assessment && window.LD.Assessment.update('info_seeking', 5);
    },

    logGoalReached(goal) {
      if (!log.goalsReached.includes(goal)) {
        log.goalsReached.push(goal);
      }
    },

    logRecycleRestore(id) {
      if (!log.recycleRestored.includes(id)) {
        log.recycleRestored.push(id);
        window.LD.Assessment && window.LD.Assessment.update('conscientiousness', 5);
        window.LD.Assessment && window.LD.Assessment.update('immersion', 3);
      }
    },

    logShutdown() {
      log.shutdown = true;
      window.LD.Assessment && window.LD.Assessment.update('chaos', 10);
      window.LD.Assessment && window.LD.Assessment.update('immersion', 15);
    },

    logGame2048(result) {
      log.gameResults.g2048.push({ ...result, time: Date.now() - log.sessionStart });
    },

    logGameSweep(result) {
      log.gameResults.sweep.push({ ...result, time: Date.now() - log.sessionStart });
    },

    logGameTyping(result) {
      log.gameResults.typing.push({ ...result, time: Date.now() - log.sessionStart });
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

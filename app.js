// メインアプリケーション
// デスクトップ・ウィンドウシステム・ファイル操作を管理する
window.LD = window.LD || {};

window.LD.App = (function () {
  let zTop = 100;
  const openWindows = {};
  let sameColorTriggered = false;
  let tricolorTriggered  = false;

  // =====================================================
  // ウィンドウシステム
  // =====================================================
  function createWindow(id, title, contentHTML, opts = {}) {
    if (openWindows[id]) { focusWindow(id); return openWindows[id]; }

    const w   = opts.width  || 520;
    const h   = opts.height || 420;
    const x   = opts.x !== undefined ? opts.x : 80 + Object.keys(openWindows).length * 24;
    const y   = opts.y !== undefined ? opts.y : 70 + Object.keys(openWindows).length * 18;

    const win = document.createElement('div');
    win.className = 'win';
    win.id = 'win-' + id;
    win.style.cssText = `left:${x}px;top:${y}px;width:${w}px;z-index:${++zTop}`;

    win.innerHTML = `
      <div class="win-bar" data-id="${id}">
        <div class="win-icon-sm">📄</div>
        <div class="win-title">${title}</div>
        <div class="win-controls">
          <button class="win-btn wbtn-min" data-id="${id}" title="最小化">&#8212;</button>
          <button class="win-btn wbtn-close" data-id="${id}" title="閉じる">&#10005;</button>
        </div>
      </div>
      <div class="win-body">${contentHTML}</div>
    `;

    document.getElementById('win-container').appendChild(win);
    openWindows[id] = win;

    makeDraggable(win, win.querySelector('.win-bar'));
    win.addEventListener('mousedown', () => focusWindow(id));

    win.querySelector('.wbtn-min').addEventListener('click', e => {
      e.stopPropagation();
      win.style.display = 'none';
      setTaskbarBtn(id, title, true);
    });

    win.querySelector('.wbtn-close').addEventListener('click', e => {
      e.stopPropagation();
      destroyWindow(id);
      window.LD.Logger.logWindowClose();
    });

    setTaskbarBtn(id, title, true);
    return win;
  }

  function focusWindow(id) {
    const win = openWindows[id];
    if (!win) return;
    win.style.display = '';
    win.style.zIndex  = ++zTop;
    document.querySelectorAll('.win').forEach(w => w.classList.remove('win-active'));
    win.classList.add('win-active');
  }

  function destroyWindow(id) {
    const win = openWindows[id];
    if (!win) return;
    win.remove();
    delete openWindows[id];
    removeTaskbarBtn(id);
  }

  // =====================================================
  // タスクバー
  // =====================================================
  const taskbarBtns = {};

  function setTaskbarBtn(id, title, add) {
    const bar = document.getElementById('taskbar-items');
    if (add) {
      if (taskbarBtns[id]) return;
      const btn = document.createElement('button');
      btn.className = 'tb-btn';
      btn.id = 'tb-' + id;
      btn.textContent = title.length > 14 ? title.slice(0, 13) + '…' : title;
      btn.addEventListener('click', () => {
        const win = openWindows[id];
        if (!win) return;
        if (win.style.display === 'none') { focusWindow(id); }
        else { win.style.display = 'none'; }
      });
      bar.appendChild(btn);
      taskbarBtns[id] = btn;
    }
  }

  function removeTaskbarBtn(id) {
    if (taskbarBtns[id]) { taskbarBtns[id].remove(); delete taskbarBtns[id]; }
  }

  // =====================================================
  // ドラッグ操作
  // =====================================================
  function makeDraggable(el, handle) {
    let dragging = false, ox = 0, oy = 0, ox0 = 0, oy0 = 0;
    handle.addEventListener('mousedown', e => {
      if (e.target.classList.contains('win-btn')) return;
      dragging = true;
      ox = e.clientX; oy = e.clientY;
      ox0 = parseInt(el.style.left) || 0;
      oy0 = parseInt(el.style.top)  || 0;
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      el.style.left = (ox0 + e.clientX - ox) + 'px';
      el.style.top  = (oy0 + e.clientY - oy) + 'px';
    });
    document.addEventListener('mouseup', () => { dragging = false; });
  }

  function makeStickyDraggable(el, type) {
    let dragging = false, ox = 0, oy = 0, ox0 = 0, oy0 = 0;
    let moved = false;
    el.addEventListener('mousedown', e => {
      dragging = true; moved = false;
      ox = e.clientX; oy = e.clientY;
      ox0 = parseInt(el.style.left) || 0;
      oy0 = parseInt(el.style.top)  || 0;
      el.style.zIndex = ++zTop;
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      const dx = e.clientX - ox, dy = e.clientY - oy;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
      el.style.left = (ox0 + dx) + 'px';
      el.style.top  = (oy0 + dy) + 'px';
    });
    document.addEventListener('mouseup', () => {
      if (dragging && moved) {
        window.LD.Logger.logNoteMoved(type);
        checkStickyArrangement();
      }
      dragging = false;
    });
  }

  // =====================================================
  // デスクトップアイコン描画
  // =====================================================
  function renderDesktop() {
    const container = document.getElementById('desktop-icons');
    const W = window.innerWidth;
    const H = window.innerHeight;

    const items = [
      { id: 'diary-txt',     label: '日記.txt',         emoji: '📝', x: 32,     y: 32,        action: openDiary },
      { id: 'voice-memos',   label: 'ボイスメモ',         emoji: '📁', x: 32,     y: 148,       action: openVoiceMemos },
      { id: 'sketchbook',    label: 'InternetX.exe',      emoji: '🌐', x: 32,     y: 264,       action: openBrowser },
      { id: 'calc-memo',          label: '計算メモ.txt',    emoji: '📊', x: 32,     y: 380,       action: openCalcMemo },
      { id: 'investigation-memo', label: '調査メモ.exe',   emoji: '📋', x: 32,     y: 496,       action: openInvestigationMemo },
      { id: 'recycle-bin',   label: 'ゴミ箱',             emoji: '🗑️', x: W - 90, y: 32,        action: openRecycleBin },
      { id: 'hidden-folder', label: '隠しフォルダ',       emoji: '🔒', x: W - 90, y: H - 170,   action: () => openPasswordModal('hidden-folder') },
      { id: 'analysis-report', label: '分析レポート.pdf', emoji: '📊', x: W - 90, y: 148, action: () => window.LD.Feedback.show(window.LD.Logger.getLog(), true), hidden: true }
    ];

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'desktop-icon' + (item.id === 'diary-txt' ? ' icon-hint-pulse' : '');
      if (item.hidden) el.style.display = 'none';
      el.id = item.id;
      el.setAttribute('data-id', item.id);
      el.style.left = item.x + 'px';
      el.style.top  = item.y + 'px';
      el.innerHTML = `<div class="icon-img">${item.emoji}</div><div class="icon-lbl">${item.label}</div>`;

      el.addEventListener('dblclick', item.action);
      el.addEventListener('click', () => {
        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('icon-sel'));
        el.classList.add('icon-sel');
        el.classList.remove('icon-hint-pulse');
      });
      container.appendChild(el);
    });
  }

  // =====================================================
  // 付箋描画
  // =====================================================
  function renderStickyNotes() {
    const container = document.getElementById('sticky-area');
    window.LD.STICKY_NOTES.forEach(n => {
      const el = document.createElement('div');
      el.className = 'sticky';
      el.id = n.id;
      el.style.cssText = `
        background:${n.color};
        left:${n.x}px; top:${n.y}px;
        transform:rotate(${n.rotation}deg);
        box-shadow:3px 4px 10px ${n.shadowColor};
      `;
      let content = n.text.replace(/\n/g, '<br>');
      
      // 勘合符ギミックの挿入
      if (n.kangoLeft) {
        content += `<span class="kango-char kango-left-edge">${n.kangoLeft}</span>`;
      }
      if (n.kangoRight) {
        content += `<span class="kango-char kango-right-edge">${n.kangoRight}</span>`;
      }
      
      el.innerHTML = content;
      makeStickyDraggable(el, n.type);
      container.appendChild(el);
    });
  }

  // =====================================================
  // ファイルを開く処理
  // =====================================================
  function openDiary() {
    window.LD.Logger.logFileOpen('diary-txt', '日記.txt');
    console.log('%c[LD] 日記ファイルへのアクセスを検出 — 被験者データに追記します', 'color:#3b82f6');

    const order = [...window.LD.DIARY]; // 並び替え可能な可変配列
    let activeId = order[0].id;

    const skelHtml = `
      <div class="diary-wrap">
        <div class="diary-tabs"></div>
        <div class="diary-pane">
          <div class="diary-date" id="d-date"></div>
          <div class="diary-body" id="d-body"></div>
        </div>
      </div>
    `;

    const win = createWindow('diary-txt', '日記.txt — テキストエディタ', skelHtml, { width: 540, height: 460 });
    if (!win) return;

    // 時系列の正解順（日付ID昇順）
    const CHRONO = ['d01','d02','d03','d05','d07','d10','d12','d15','d20','d25','d30'];
    let chronoAchieved = false;

    const BONUS_ENTRY = {
      id: 'bonus',
      title: '付記',
      date: '——',
      content: `[ファイルシステム解析 — 時系列整合性を確認]\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n付記: Xの手記より\n\n  言葉が見つからなかった。だから消した。\n  でも記憶は消せない。\n\n  3つの色を見るたびに思い出す。\n  あの日、部屋を満たしていた色——\n  赤、緑、青。\n\n  それぞれの「尻尾」が答えだと気づいたのは\n  ずっと後のことだった。\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n[このページは時系列の整理によって復元されました]`
    };

    function showEntry(id) {
      const entry = id === 'bonus' ? BONUS_ENTRY : window.LD.DIARY.find(e => e.id === id);
      if (!entry) return;
      win.querySelector('#d-date').textContent = entry.date;
      win.querySelector('#d-body').innerHTML   = renderDiaryText(entry.content);
      attachCensoredTracking(win);
      window.LD.Logger.logFileOpen('diary-' + entry.id, entry.title);
    }

    function checkChrono() {
      if (chronoAchieved) return;
      if (order.every((e, i) => e.id === CHRONO[i])) {
        chronoAchieved = true;
        window.LD.Logger.logDiaryChronological && window.LD.Logger.logDiaryChronological();
        console.log('%c[LD] 日記が時系列順に整理されました — 系統的探索スコアに大幅加点', 'color:#10b981;font-weight:bold');

        // 隠しページ「付記」を末尾に追加して再描画
        order.push(BONUS_ENTRY);
        activeId = 'bonus';
        renderTabs();

        // 全タブにグリーングロー → その後「付記」タブへ自動切り替え
        win.querySelectorAll('.dtab').forEach(t => t.classList.add('dtab-chrono'));
        setTimeout(() => {
          win.querySelectorAll('.dtab').forEach(t => t.classList.remove('dtab-chrono'));
          win.querySelectorAll('.dtab').forEach(t => t.classList.remove('dtab-active'));
          const bonusTab = win.querySelector('.dtab[data-id="bonus"]');
          if (bonusTab) bonusTab.classList.add('dtab-active');
          showEntry('bonus');
        }, 2600);
      }
    }

    function renderTabs() {
      const tabsEl = win.querySelector('.diary-tabs');
      tabsEl.innerHTML = order.map(e =>
        `<button class="dtab${e.id === activeId ? ' dtab-active' : ''}" data-id="${e.id}" draggable="true">${e.title}</button>`
      ).join('');

      let dragSrcId = null;

      tabsEl.querySelectorAll('.dtab').forEach(tab => {
        tab.addEventListener('click', () => {
          activeId = tab.dataset.id;
          tabsEl.querySelectorAll('.dtab').forEach(t => t.classList.remove('dtab-active'));
          tab.classList.add('dtab-active');
          showEntry(activeId);
        });

        tab.addEventListener('dragstart', e => {
          dragSrcId = tab.dataset.id;
          e.dataTransfer.effectAllowed = 'move';
          setTimeout(() => tab.classList.add('dtab-dragging'), 0);
        });

        tab.addEventListener('dragend', () => {
          tab.classList.remove('dtab-dragging');
          tabsEl.querySelectorAll('.dtab').forEach(t => t.classList.remove('dtab-dragover'));
        });

        tab.addEventListener('dragover', e => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          tabsEl.querySelectorAll('.dtab').forEach(t => t.classList.remove('dtab-dragover'));
          if (tab.dataset.id !== dragSrcId) tab.classList.add('dtab-dragover');
        });

        tab.addEventListener('dragleave', () => tab.classList.remove('dtab-dragover'));

        tab.addEventListener('drop', e => {
          e.preventDefault();
          tab.classList.remove('dtab-dragover');
          if (!dragSrcId || dragSrcId === tab.dataset.id) return;
          const fromIdx = order.findIndex(x => x.id === dragSrcId);
          const toIdx   = order.findIndex(x => x.id === tab.dataset.id);
          if (fromIdx < 0 || toIdx < 0) return;
          const [moved] = order.splice(fromIdx, 1);
          order.splice(toIdx, 0, moved);
          window.LD.Logger.logDiaryReorder && window.LD.Logger.logDiaryReorder();
          renderTabs();
          checkChrono();
        });
      });
    }

    renderTabs();
    showEntry(activeId);
  }

  function renderDiaryText(content) {
    return content
      .replace(/\n/g, '<br>')
      .replace(/█+/g, m => `<span class="censored" title="読めない">${m}</span>`);
  }

  function attachCensoredTracking(win) {
    win.querySelectorAll('.censored').forEach(el => {
      el.addEventListener('click',  () => window.LD.Logger.logCensoredScroll());
      el.addEventListener('wheel',  () => window.LD.Logger.logCensoredScroll());
    });
  }

  function openVoiceMemos() {
    window.LD.Logger.logFileOpen('voice-memos', 'ボイスメモ');
    const memos = window.LD.VOICE_MEMOS;

    const list = memos.map(m => `
      <div class="audio-row" data-id="${m.id}">
        <span class="audio-ico">${m.important ? '⚠️' : '🔊'}</span>
        <span class="audio-name">${m.name}</span>
        <span class="audio-dur">${m.duration}秒</span>
        <button class="audio-play" data-id="${m.id}">▶</button>
      </div>
    `).join('');

    const html = `
      <div class="vm-wrap">
        <div class="vm-list">${list}</div>
        <div class="vm-player">
          <div class="vm-nowplay" id="vm-nowplay">再生停止中</div>
          <div class="vm-progbar-wrap"><div class="vm-progbar" id="vm-prog"></div></div>
          <button class="vm-stop" id="vm-stop">■ 停止</button>
        </div>
      </div>
    `;

    const win = createWindow('voice-memos', 'ボイスメモ', html, { width: 480, height: 430 });
    if (!win) return;

    let currentId = null;

    win.querySelectorAll('.audio-play').forEach(btn => {
      btn.addEventListener('click', () => {
        const id   = btn.dataset.id;
        const memo = memos.find(m => m.id === id);
        if (!memo) return;

        if (currentId === id) window.LD.Logger.logAudioReplay(id);
        else window.LD.Logger.logFileOpen(id, memo.name);
        currentId = id;

        win.querySelector('#vm-nowplay').textContent = `再生中: ${memo.name}`;
        const bar = win.querySelector('#vm-prog');
        bar.style.width = '0%';

        window.LD.Audio.play(
          memo,
          pct => { bar.style.width = (pct * 100) + '%'; },
          ()  => {
            win.querySelector('#vm-nowplay').textContent = `完了: ${memo.name}`;
            window.LD.Logger.logAudioComplete();
          }
        );
      });
    });

    win.querySelector('#vm-stop').addEventListener('click', () => {
      window.LD.Audio.stop();
      window.LD.Logger.logAudioStop();
      win.querySelector('#vm-nowplay').textContent = '再生停止中';
      win.querySelector('#vm-prog').style.width = '0%';
      currentId = null;
    });
  }

  function openHiddenFolder(unlockType = 'composite') {
    window.LD.Logger.logFileOpen('hidden-folder', '隠しフォルダ');
    console.log('%c[LD] 制限フォルダへのアクセス — セッションフラグ: CURIOUS', 'color:#f59e0b;font-weight:bold');
    console.log('%c[LD] 現在のスコアスナップショット:', 'color:#f59e0b', window.LD.Assessment.getScores());

    // パスワードの種類に応じて表示するファイルを切り替える
    const reportId = { linguistic: 'report_linguistic', math: 'report_math', visual: 'report_visual' }[unlockType] || 'report_composite';
    const files = window.LD.HIDDEN_FILES.filter(f =>
      f.id === 'hf_design' || f.id === 'hf_log' || f.id === reportId
    );

    const list = files.map(f => `
      <div class="fitem" data-id="${f.id}">
        <span class="fitem-ico">📄</span>
        <span class="fitem-name">${f.name}</span>
      </div>
    `).join('');

    const html = `
      <div class="folder-wrap">
        <div class="folder-path">C:\\Users\\X\\Desktop\\Hidden\\</div>
        <div class="flist">${list}</div>
        <div class="flist-hint">ダブルクリックで開く</div>
      </div>
    `;

    const win = createWindow('hidden-folder', '隠しフォルダ', html, { width: 460, height: 340 });
    if (!win) return;

    win.querySelectorAll('.fitem').forEach(item => {
      item.addEventListener('click', () => {
        win.querySelectorAll('.fitem').forEach(i => i.classList.remove('fitem-sel'));
        item.classList.add('fitem-sel');
      });
      item.addEventListener('dblclick', () => {
        const file = files.find(f => f.id === item.dataset.id);
        if (file) openTextFile(file, unlockType);
      });
    });

    // 隠しフォルダアイコンを通常フォルダに変更
    const icon = document.querySelector('.desktop-icon[data-id="hidden-folder"] .icon-img');
    if (icon) icon.textContent = '📂';
  }

  function openTextFile(file, unlockType = 'composite') {
    window.LD.Logger.logFileOpen(file.id, file.name);

    const html = `
      <div class="txt-wrap">
        <pre class="txt-body">${escapeHtml(file.content)}</pre>
      </div>
    `;

    createWindow(file.id, file.name, html, { width: 520, height: 460 });

    if (file.trigger === 'ending') {
      // ログにパスワードタイプを付与してフィードバック画面へ渡す
      const log = window.LD.Logger.getLog();
      log.unlockType = unlockType;
      
      // プレイヤーがテキストを読む時間を5秒ほど取り、その後演出を入れる
      setTimeout(() => {
        // 激しいグリッチと暗転演出
        if (window.LD.Effects && window.LD.Effects.glitch) {
          window.LD.Effects.glitch();
          setTimeout(() => window.LD.Effects.glitch(), 300);
          setTimeout(() => window.LD.Effects.glitch(), 600);
        }
        
        // デスクトップ全体をブラックアウトさせる
        const blackout = document.createElement('div');
        blackout.style.position = 'fixed';
        blackout.style.inset = '0';
        blackout.style.backgroundColor = '#000';
        blackout.style.zIndex = '9700';
        blackout.style.opacity = '0';
        blackout.style.transition = 'opacity 1.5s ease-in-out';
        document.body.appendChild(blackout);

        // 100ms後にフェードアウト開始
        setTimeout(() => { blackout.style.opacity = '1'; }, 100);

        // 完全に暗転してからフィードバック画面表示
        setTimeout(() => {
          window.LD.Feedback.show(log);
        }, 1800);

      }, 5500); // テキストを読む時間 (5.5秒)
    }
  }

  // =====================================================
  // 付箋色グループ配置検出
  // =====================================================
  function checkStickyArrangement() {
    if (sameColorTriggered && tricolorTriggered) return;

    const groups = { red: [], green: [], blue: [] };
    (window.LD.STICKY_NOTES || []).forEach(note => {
      if (!note.colorGroup || !groups[note.colorGroup]) return;
      const el = document.getElementById(note.id);
      if (!el) return;
      groups[note.colorGroup].push({
        x: parseInt(el.style.left) || 0,
        y: parseInt(el.style.top)  || 0
      });
    });

    if (!groups.red.length || !groups.green.length || !groups.blue.length) return;

    function centroid(pts) {
      return { x: pts.reduce((s,p)=>s+p.x,0)/pts.length, y: pts.reduce((s,p)=>s+p.y,0)/pts.length };
    }
    function maxDist(pts, c) {
      return Math.max(...pts.map(p => Math.hypot(p.x-c.x, p.y-c.y)));
    }
    function dist(a, b) { return Math.hypot(a.x-b.x, a.y-b.y); }

    const rc = centroid(groups.red);
    const gc = centroid(groups.green);
    const bc = centroid(groups.blue);

    const CLUSTER_R = 160; // 同色グループが収まる最大半径
    const SEP_MIN   = 280; // 各色グループの重心間の最低距離（同系色条件）
    const TRI_MAX   = 220; // トリコロール: 3重心の最大距離

    // ── 同系色グループ（3色が別々にまとまっている） ──
    if (!sameColorTriggered) {
      const redTight   = maxDist(groups.red,   rc) < CLUSTER_R;
      const greenTight = maxDist(groups.green, gc) < CLUSTER_R;
      const blueTight  = maxDist(groups.blue,  bc) < CLUSTER_R;
      const separated  = dist(rc,gc) > SEP_MIN && dist(rc,bc) > SEP_MIN && dist(gc,bc) > SEP_MIN;

      if (redTight && greenTight && blueTight && separated) {
        sameColorTriggered = true;
        window.LD.Logger.logSameColorArrangement && window.LD.Logger.logSameColorArrangement();
        console.log('%c[LD] 同系色グループ配置を検出 — 空間認知スコアに加点', 'color:#6366f1;font-weight:bold');
        triggerSameColorReveal(rc, gc, bc);
      }
    }

    // ── トリコロール（3色が1箇所にまとまっている） ──
    if (!tricolorTriggered) {
      if (dist(rc,gc) < TRI_MAX && dist(rc,bc) < TRI_MAX && dist(gc,bc) < TRI_MAX) {
        tricolorTriggered = true;
        window.LD.Logger.logTricolorArrangement && window.LD.Logger.logTricolorArrangement();
        console.log('%c[LD] トリコロール配置を検出 — 統合スコアに加点', 'color:#10b981;font-weight:bold');
        triggerTricolorReveal({ x:(rc.x+gc.x+bc.x)/3, y:(rc.y+gc.y+bc.y)/3 });
      }
    }
  }

  function spawnFloatingLabel(x, y, text, bgColor) {
    const area = document.getElementById('sticky-area');
    if (!area) return;
    const lbl = document.createElement('div');
    lbl.style.cssText = `
      position:absolute;left:${x-28}px;top:${y-40}px;
      background:${bgColor};color:#222;padding:5px 12px;
      border-radius:4px;font-family:monospace;font-size:16px;font-weight:bold;
      letter-spacing:2px;opacity:0;transition:opacity 0.6s;
      z-index:260;pointer-events:none;
      box-shadow:2px 3px 10px rgba(0,0,0,0.25);`;
    lbl.textContent = text;
    area.appendChild(lbl);
    requestAnimationFrame(() => { lbl.style.opacity = '1'; });
    setTimeout(() => {
      lbl.style.opacity = '0';
      setTimeout(() => lbl.remove(), 700);
    }, 9000);
  }

  function triggerSameColorReveal(rc, gc, bc) {
    window.LD.Effects && window.LD.Effects.showTypewriter('色を分けた——\nそれぞれが語り始める');

    // 短いフラッシュラベル（3秒）
    setTimeout(() => {
      spawnFloatingLabel(rc.x, rc.y, 'a5', '#fca5a5');
      spawnFloatingLabel(gc.x, gc.y, 'ac', '#86efac');
      spawnFloatingLabel(bc.x, bc.y, 'fd', '#93c5fd');
    }, 1800);

    // フラッシュが消えた後、永続メモ付箋をデスクトップに残す
    setTimeout(() => {
      const area = document.getElementById('sticky-area');
      if (!area || document.getElementById('discovery-color-note')) return;
      const cx = Math.min(Math.max((rc.x + gc.x + bc.x) / 3, 160), window.innerWidth  - 180);
      const cy = Math.min(Math.max((rc.y + gc.y + bc.y) / 3, 80),  window.innerHeight - 220);
      const note = document.createElement('div');
      note.className = 'sticky';
      note.id = 'discovery-color-note';
      note.style.cssText = `left:${cx}px;top:${cy}px;background:#fafaf0;border:1px dashed #bbb;opacity:0;transition:opacity 0.8s;z-index:200;transform:rotate(-1deg);box-shadow:2px 3px 8px rgba(0,0,0,0.15);`;
      note.innerHTML = `<span style="font-family:monospace;font-size:11px;color:#555;line-height:2.2;">
        <span style="font-size:10px;color:#aaa;display:block;margin-bottom:2px;">【発見】</span>
        <span style="color:#c0392b;font-weight:bold;">赤</span> → <code style="background:#fce8e8;padding:1px 5px;border-radius:2px;font-size:13px;">a5</code><br>
        <span style="color:#27ae60;font-weight:bold;">緑</span> → <code style="background:#e8fced;padding:1px 5px;border-radius:2px;font-size:13px;">ac</code><br>
        <span style="color:#2563eb;font-weight:bold;">青</span> → <code style="background:#e8f0fe;padding:1px 5px;border-radius:2px;font-size:13px;">fd</code>
      </span>`;
      area.appendChild(note);
      requestAnimationFrame(() => { note.style.opacity = '1'; });
      makeStickyDraggable(note, null);
    }, 5500);
  }

  function triggerTricolorReveal(center) {
    window.LD.Effects && window.LD.Effects.showTypewriter('3色が混ざった——\n境界が溶ける');
    setTimeout(() => {
      const area = document.getElementById('sticky-area');
      if (!area) return;
      const ghost = document.createElement('div');
      ghost.className = 'sticky';
      ghost.style.cssText = `
        left:${center.x - 64}px;top:${center.y - 64}px;
        background:linear-gradient(135deg,#fca5a5 0%,#86efac 50%,#93c5fd 100%);
        opacity:0;transition:opacity 0.8s;z-index:270;pointer-events:none;
        transform:rotate(-1.5deg);box-shadow:0 4px 20px rgba(0,0,0,0.3);`;
      ghost.innerHTML = `<span style="font-family:monospace;font-size:12px;color:#334;line-height:2;">3 つの<br>鍵が<br>一点に</span>`;
      area.appendChild(ghost);
      requestAnimationFrame(() => { ghost.style.opacity = '0.92'; });
      setTimeout(() => {
        ghost.style.opacity = '0';
        setTimeout(() => ghost.remove(), 800);
      }, 12000);
    }, 1800);
  }

  function openBrowser() {
    window.LD.Logger.logFileOpen('sketchbook', 'InternetX.exe');
    console.log('%c[LD] ブラウザアクセスを検出 — 情報収集行動を記録します', 'color:#6366f1');

    const skelHtml = `
      <div class="browser-wrap">
        <div class="browser-toolbar">
          <button class="bw-btn" id="bw-back" disabled>◀</button>
          <button class="bw-btn" id="bw-fwd"  disabled>▶</button>
          <button class="bw-btn" id="bw-home">⌂</button>
          <input  class="bw-url" id="bw-url" type="text" value="searchx://home" />
          <button class="bw-btn" id="bw-go">移動</button>
        </div>
        <div class="browser-content" id="bw-content"></div>
      </div>
    `;

    const win = createWindow('internetx', 'InternetX', skelHtml, { width: 640, height: 520, x: 90, y: 45 });
    if (!win) return;

    const hist    = ['home'];
    let   histIdx = 0;
    const urlBar  = win.querySelector('#bw-url');
    const content = win.querySelector('#bw-content');
    const backBtn = win.querySelector('#bw-back');
    const fwdBtn  = win.querySelector('#bw-fwd');

    function urlToKey(url) {
      const u = url.toLowerCase().replace(/^https?:\/\//,'').replace(/^searchx:\/\/home/,'home');
      if (!u || u === 'home') return 'home';
      if (u.includes('techblog') || u.includes('sticky')) return 'sticky';
      if (u.includes('designlab') || u.includes('colors.')) return 'colorlab';
      if (u.includes('colorpick') || u.includes('picker')) return 'picker';
      return null;
    }
    function keyToUrl(key) {
      return { home:'searchx://home', sticky:'http://memo.techblog.jp/sticky', colorlab:'http://colors.designlab.jp', picker:'http://tools.colorpick.jp' }[key] || 'searchx://home';
    }
    function updateNav() {
      backBtn.disabled = histIdx <= 0;
      fwdBtn.disabled  = histIdx >= hist.length - 1;
    }

    function navigate(input, push = true) {
      const key = urlToKey(input);
      if (key) {
        renderPage(key);
        urlBar.value = keyToUrl(key);
        if (push) { hist.splice(histIdx + 1); hist.push(key); histIdx = hist.length - 1; }
      } else {
        const q = input.replace(/^searchx:\/\/search\?q=/i,'').trim();
        renderSearch(q);
        urlBar.value = 'searchx://search?q=' + q;
        if (push) { hist.splice(histIdx + 1); hist.push('q:' + q); histIdx = hist.length - 1; }
      }
      updateNav();
    }

    function navHistory(dir) {
      histIdx += dir;
      const h = hist[histIdx];
      if (h.startsWith('q:')) { renderSearch(h.slice(2)); urlBar.value = 'searchx://search?q=' + h.slice(2); }
      else                    { renderPage(h);             urlBar.value = keyToUrl(h); }
      updateNav();
    }

    const SEARCH_DB = [
      {
        key:'sticky', url:'memo.techblog.jp/sticky',
        title:'付箋アプリの配色設計ガイド — Techblog',
        desc:'デジタル付箋の色設計と先頭2桁の識別コードについて解説しています。',
        tags:/付箋|sticky|sticker|メモ|note|貼り紙|ポスト|デザイン|design|ui|アプリ|app|color|カラー|色|配色|palette|rgb|ピンク|pink|赤|red|緑|green|青|blue/
      },
      {
        key:'colorlab', url:'colors.designlab.jp',
        title:'16進数カラーコード入門 — DesignLab',
        desc:'16進カラーコードの基礎。先頭・末尾2桁の違いと識別子への活用法。',
        tags:/hex|16進|カラーコード|末尾|尻尾|下2桁|先頭|colorcode|識別|web|ウェブ|css|html|コード|code|プログラム|program|開発|dev|色|color|カラー|rgb|rr|gg|bb|ff|#/
      },
      {
        key:'picker', url:'tools.colorpick.jp',
        title:'カラーピッカー — ColorPick Tools',
        desc:'16進カラーコードをリアルタイムでプレビューできるツール。',
        tags:/a5acfd|fca5|86ef|93c5|ピッカー|picker|tool|ツール|確認|preview|プレビュー|変換|convert|色|color|カラー|check|チェック/
      }
    ];

    function renderSearch(q) {
      window.LD.Logger.logBrowserSearch && window.LD.Logger.logBrowserSearch(q);
      const lq = q.toLowerCase();
      const results = SEARCH_DB.filter(r => r.tags.test(lq));

      if (results.length === 0) {
        // 完全に無関係なキーワードでもそれっぽい結果を出す
        const fallback = SEARCH_DB.slice().sort(() => Math.random() - 0.5).slice(0, 1);
        content.innerHTML = `
          <div>
            <div class="bw-query">「${escapeHtml(q)}」の検索結果</div>
            <div class="bw-no-result" style="margin-bottom:12px;">完全一致する結果は見つかりませんでした。</div>
            <div style="font-size:11px;color:#888;margin-bottom:8px;">関連するページ:</div>
            ${fallback.map(r => `
              <div class="bw-result" data-key="${r.key}">
                <div class="bw-result-title">${r.title}</div>
                <div class="bw-result-url">${r.url}</div>
                <div class="bw-result-desc">${r.desc}</div>
              </div>
            `).join('')}
          </div>
        `;
        content.querySelectorAll('.bw-result').forEach(el =>
          el.addEventListener('click', () => navigate(el.dataset.key))
        );
        return;
      }
      content.innerHTML = `
        <div>
          <div class="bw-query">「${escapeHtml(q)}」の検索結果 ${results.length}件</div>
          ${results.map(r => `
            <div class="bw-result" data-key="${r.key}">
              <div class="bw-result-title">${r.title}</div>
              <div class="bw-result-url">${r.url}</div>
              <div class="bw-result-desc">${r.desc}</div>
            </div>
          `).join('')}
        </div>
      `;
      content.querySelectorAll('.bw-result').forEach(el =>
        el.addEventListener('click', () => navigate(el.dataset.key))
      );
    }

    function renderPage(key) {
      if      (key === 'home')     renderHome();
      else if (key === 'sticky')   renderSticky();
      else if (key === 'colorlab') renderColorLab();
      else if (key === 'picker')   renderPicker();
    }

    function renderHome() {
      content.innerHTML = `
        <div style="padding:20px 0;text-align:center;">
          <div class="bw-logo">SearchX</div>
          <div class="bw-search-bar">
            <input class="bw-sq-input" id="bw-sq" type="text" placeholder="キーワードを入力…" />
            <button class="bw-sq-btn" id="bw-sqbtn">検索</button>
          </div>
          <div class="bw-favs">
            <div class="bw-fav-hd">おすすめ</div>
            <div><span class="bw-fav-link" data-key="sticky">📌 付箋デザインガイド</span></div>
            <div><span class="bw-fav-link" data-key="colorlab">🎨 カラーコード入門</span></div>
            <div><span class="bw-fav-link" data-key="picker">🖌 カラーピッカー</span></div>
          </div>
        </div>
      `;
      const sq = content.querySelector('#bw-sq');
      content.querySelector('#bw-sqbtn').addEventListener('click', () => { if (sq.value.trim()) navigate(sq.value.trim()); });
      sq.addEventListener('keydown', e => { if (e.key === 'Enter' && sq.value.trim()) navigate(sq.value.trim()); });
      content.querySelectorAll('.bw-fav-link').forEach(el => el.addEventListener('click', () => navigate(el.dataset.key)));
    }

    function renderSticky() {
      // 注意トラップページ: 「先頭2桁」を正解のように見せる
      content.innerHTML = `
        <div class="bw-art-body">
          <div class="bw-art-title">付箋アプリの配色設計ガイド</div>
          <div class="bw-art-meta">memo.techblog.jp &nbsp;|&nbsp; 2024-03-12 &nbsp;|&nbsp; タグ: UI, カラー, 付箋</div>
          <p>デジタル付箋アプリにおける色の設計は、ユーザーの感情状態や優先度を視覚的に伝える重要な役割を担います。</p>
          <p>各付箋には固有の<strong>識別コード</strong>が割り当てられており、システム内部での効率的な管理を実現しています。識別コードには、カラーコードの<strong style="color:#c0392b;">先頭2桁</strong>を採用することで直感的な対応関係が生まれます。</p>
          <table class="bw-table">
            <tr><th>付箋</th><th>カラーコード</th><th style="color:#c0392b;font-weight:bold;">先頭2桁（識別子）</th></tr>
            <tr><td><span class="bw-swatch" style="background:#fca5a5;"></span> 赤</td><td class="bw-code">#fca5a5</td><td style="font-weight:bold;color:#c0392b;font-size:15px;">fc</td></tr>
            <tr><td><span class="bw-swatch" style="background:#86efac;"></span> 緑</td><td class="bw-code">#86efac</td><td style="font-weight:bold;color:#c0392b;font-size:15px;">86</td></tr>
            <tr><td><span class="bw-swatch" style="background:#93c5fd;"></span> 青</td><td class="bw-code">#93c5fd</td><td style="font-weight:bold;color:#c0392b;font-size:15px;">93</td></tr>
          </table>
          <p>これら3つの識別子を順番に並べると <code>fc8693</code> となります。この文字列はシステムの各種認証で利用される場合があります。</p>
          <p style="color:#999;font-size:11px;">※ より正確な仕様については <span class="bw-fav-link" data-key="colorlab" style="color:#3b82f6;cursor:pointer;text-decoration:underline;">16進数カラーコードの詳細解説</span> を参照してください。</p>
        </div>
      `;
      content.querySelectorAll('.bw-fav-link').forEach(el => el.addEventListener('click', () => navigate(el.dataset.key)));
    }

    function renderColorLab() {
      // 正解ページ: 「末尾2桁」が正しいと明示
      content.innerHTML = `
        <div class="bw-art-body">
          <div class="bw-art-title">16進数カラーコード入門</div>
          <div class="bw-art-meta">colors.designlab.jp &nbsp;|&nbsp; 2024-02-20 &nbsp;|&nbsp; タグ: カラー, Hex, Web</div>
          <p>16進数カラーコード（例: <code>#a5acfd</code>）は6桁で色を表現します。「RR・GG・BB」の順に赤・緑・青の強度を表します。</p>
          <h3>■ 先頭2桁と末尾2桁の違い</h3>
          <p>カラーコードの使われ方には「先頭2桁派」と「末尾2桁派」があります。</p>
          <p>先頭2桁は色の<em>大まかな分類</em>には便利ですが、類似色で値が重複しやすい問題があります。<strong style="color:#2563eb;">末尾2桁</strong>は色ごとのばらつきが大きく、<strong>識別子・パスコードとしての信頼性が高い</strong>とされています。</p>
          <div style="background:#eff6ff;border-left:3px solid #3b82f6;padding:8px 12px;font-size:11px;margin:8px 0;line-height:1.7;">
            ⚠️ セキュリティの観点から、<strong>先頭2桁の識別子利用は推奨されません</strong>。誤用・誤入力のリスクがあります。識別子には必ず<strong style="color:#2563eb;">末尾2桁</strong>を参照してください。
          </div>
          <h3>■ 付箋カラーの末尾2桁一覧</h3>
          <table class="bw-table">
            <tr><th>付箋</th><th>カラーコード</th><th style="color:#aaa;">先頭2桁</th><th style="color:#2563eb;font-weight:bold;">末尾2桁</th></tr>
            <tr><td><span class="bw-swatch" style="background:#fca5a5;"></span> 赤</td><td class="bw-code">#fca5<strong style="color:#2563eb;">a5</strong></td><td style="color:#aaa;">fc</td><td style="font-weight:bold;color:#2563eb;font-size:15px;">a5</td></tr>
            <tr><td><span class="bw-swatch" style="background:#86efac;"></span> 緑</td><td class="bw-code">#86ef<strong style="color:#2563eb;">ac</strong></td><td style="color:#aaa;">86</td><td style="font-weight:bold;color:#2563eb;font-size:15px;">ac</td></tr>
            <tr><td><span class="bw-swatch" style="background:#93c5fd;"></span> 青</td><td class="bw-code">#93c5<strong style="color:#2563eb;">fd</strong></td><td style="color:#aaa;">93</td><td style="font-weight:bold;color:#2563eb;font-size:15px;">fd</td></tr>
          </table>
          <p>①②③の末尾2桁を順に連結: <code style="background:#dbeafe;padding:2px 6px;border-radius:3px;font-size:13px;"> a5 + ac + fd = <strong>a5acfd</strong></code></p>
          <p style="color:#aaa;font-size:10px;margin-top:16px;border-top:1px solid #eee;padding-top:8px;">色の確認は <span class="bw-fav-link" data-key="picker" style="color:#3b82f6;cursor:pointer;text-decoration:underline;">カラーピッカー</span> をご利用ください。</p>
        </div>
      `;
      content.querySelectorAll('.bw-fav-link').forEach(el => el.addEventListener('click', () => navigate(el.dataset.key)));
    }

    function renderPicker() {
      content.innerHTML = `
        <div style="padding:6px 0;">
          <div class="bw-art-title" style="margin-bottom:16px;">カラーピッカー</div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
            <input type="color" id="bw-cpn" value="#a5acfd" style="width:48px;height:36px;border:none;cursor:pointer;border-radius:4px;"/>
            <span style="font-family:monospace;">#</span>
            <input id="bw-cph" type="text" value="a5acfd" maxlength="6" style="font-family:monospace;font-size:14px;width:80px;padding:4px 8px;border:1px solid #ccc;border-radius:4px;"/>
            <button id="bw-cpp" class="bw-sq-btn">適用</button>
          </div>
          <div id="bw-cpv" style="width:100%;height:100px;background:#a5acfd;border-radius:8px;border:1px solid #ddd;transition:background 0.3s;"></div>
          <div id="bw-cpl" style="margin-top:8px;font-family:monospace;font-size:12px;color:#555;">#a5acfd</div>
        </div>
      `;
      const native = content.querySelector('#bw-cpn');
      const hexIn  = content.querySelector('#bw-cph');
      const prev   = content.querySelector('#bw-cpv');
      const lbl    = content.querySelector('#bw-cpl');
      function apply(h) {
        const c = h.replace('#','').slice(0,6);
        if (!/^[0-9a-fA-F]{6}$/.test(c)) return;
        prev.style.background = '#' + c;
        lbl.textContent = '#' + c;
        native.value = '#' + c;
        hexIn.value = c;
      }
      native.addEventListener('input',  () => apply(native.value));
      content.querySelector('#bw-cpp').addEventListener('click', () => apply(hexIn.value));
      hexIn.addEventListener('keydown', e => { if (e.key === 'Enter') apply(hexIn.value); });
    }

    // ツールバーのイベント
    win.querySelector('#bw-go').addEventListener('click',   () => navigate(urlBar.value));
    win.querySelector('#bw-home').addEventListener('click', () => navigate('home'));
    urlBar.addEventListener('keydown', e => { if (e.key === 'Enter') navigate(urlBar.value); });
    backBtn.addEventListener('click', () => { if (histIdx > 0)                  navHistory(-1); });
    fwdBtn.addEventListener('click',  () => { if (histIdx < hist.length - 1)    navHistory(1);  });

    renderPage('home');
    updateNav();
  }

  function openCalcMemo() {
    window.LD.Logger.logFileOpen('calc-memo', '計算メモ.txt');
    const content = `計算メモ — 途中経過
=====================================

■ 数列の続きは何だ？

  1, 1, 2, 3, 5, 8, 13, 21, [?], [?]

  規則: 前の2つの数を足す
  → 13 + 21 = ___
  → 21 + [?] = ___

  答えは [13][21] か...?

=====================================

■ パスワードは4桁〜6桁の可能性

  候補:
    - 3455    ← ？
    - 5534    ← ？
    - 132134  ← 長すぎ？

=====================================

NOTE: フィボナッチ数列
Fibonacci sequence
名前の由来: Leonardo Fibonacci (1170-1250)
`;
    const html = `<div class="txt-wrap"><pre class="txt-body">${escapeHtml(content)}</pre></div>`;
    createWindow('calc-memo', '計算メモ.txt', html, { width: 500, height: 440, x: 160, y: 90 });
  }


  function openRecycleBin() {
    window.LD.Logger.logFileOpen('recycle-bin', 'ゴミ箱');
    const html = `
      <div class="folder-wrap">
        <div class="folder-path">C:\\RECYCLER\\</div>
        <div class="flist">
          <div class="fitem" id="recycle-item-1">
            <span class="fitem-ico">📄</span>
            <span class="fitem-name" style="color:#bbb;text-decoration:line-through;">deleted_fragment_0█.txt</span>
          </div>
        </div>
        <div class="flist-hint">ダブルクリックで開く</div>
      </div>
    `;
    const win = createWindow('recycle-bin', 'ゴミ箱', html, { width: 380, height: 280 });
    if (!win) return;

    const item = win.querySelector('#recycle-item-1');
    item.addEventListener('click', () => {
      win.querySelectorAll('.fitem').forEach(i => i.classList.remove('fitem-sel'));
      item.classList.add('fitem-sel');
    });
    item.addEventListener('dblclick', () => {
      window.LD.Logger.logFileOpen('deleted-fragment', 'deleted_fragment');
      const content = `[ファイルシステム警告: データが部分的に破損しています]

████████████████████████████████
████ なぜ削除した ███████████████
████████████████████████████████
████████████ X ████████████████
████████████████████████████████

削除日時 : 20XX/██/██  ██:██
Checksum : 0x████████

注記: このファイルの復元は
      ████████████████████████`;
      const h2 = `<div class="txt-wrap"><pre class="txt-body">${escapeHtml(content)}</pre></div>`;
      createWindow('deleted-fragment', 'deleted_fragment_0█.txt', h2, { width: 420, height: 300, x: 200, y: 130 });
    });
  }

  // =====================================================
  // 調査メモ（手がかりコレクター）
  // =====================================================
  function openInvestigationMemo(pos) {
    window.LD.Logger.logFileOpen('investigation-memo', '調査メモ.exe');
    destroyWindow('investigation-memo');

    const log    = window.LD.Logger.getLog();
    const opened = log.totalFilesOpened;

    function ent(label, value) {
      if (!value && value !== 0) return '';
      return `<div class="inv-entry"><span class="inv-lbl">${label}</span><span class="inv-val">${value}</span></div>`;
    }

    function sec(emoji, title, rows, unlocked, hint) {
      const body = rows.filter(Boolean).join('');
      if (!unlocked) return `
        <div class="inv-section inv-locked">
          <div class="inv-stitle">${emoji} ${title}</div>
          <div class="inv-hint">${hint}</div>
        </div>`;
      return `
        <div class="inv-section">
          <div class="inv-stitle">${emoji} ${title}</div>
          ${body}
        </div>`;
    }

    const diaryCount   = log.diaryReads.length;
    const pwAttempts   = log.passwordAttempts.length;
    const calcOpened   = opened.has('calc-memo');
    const browserUsed  = opened.has('sketchbook');
    const audioPlayed  = log.audioPlays > 0;
    const folderOpened = opened.has('hidden-folder');
    const colorKnown   = log.sameColorArrangement;

    // ── 数列 ──
    const numSec = sec('🔢', '数列の観察', [
      ent('パターン', '1, 1, 2, 3, 5, 8, 13, 21…'),
      ent('続き',     '<code>34</code>, <code>55</code>'),
      ent('候補',     '<code>3455</code> ?'),
    ], calcOpened, '計算メモを開いてみると…');

    // ── 色 ──
    const colorSec = sec('🎨', '色彩の記録', [
      colorKnown
        ? ent('赤の末尾', '<code>a5</code>')
        : ent('状態', '<em>付箋を色ごとにまとめてみると…</em>'),
      colorKnown ? ent('緑の末尾', '<code>ac</code>') : '',
      colorKnown ? ent('青の末尾', '<code>fd</code>') : '',
      colorKnown ? ent('連結',     '<code style="font-size:13px;background:#dbeafe;border-color:#93c5fd;">a5acfd</code>') : '',
    ], browserUsed || colorKnown, 'InternetXを起動すると…');

    // ── 日記 ──
    const diarySec = sec('📖', '記憶の断片', [
      ent('閲覧数', `${diaryCount} / 11 件`),
      log.diaryChronological
        ? ent('整理', '時系列順 ✓')
        : ent('整理', '<em>時系列順に並べると…?</em>'),
      log.diaryChronological
        ? ent('付記', '<em>「尻尾を繋げよ」</em>')
        : '',
    ], diaryCount >= 3, '日記をもう少し読んでみると…');

    // ── 音声 ──
    const audioSec = sec('🔊', '音の痕跡', [
      ent('再生数', `${log.audioPlays} 回`),
      ent('完聴数', `${log.audioCompletes} 件`),
      log.audioCompletes >= 2
        ? ent('気づき', '<em>繰り返される言葉がある</em>')
        : '',
    ], audioPlayed, '音声メモを再生してみると…');

    // ── 鍵 ──
    const lastAttempts = log.passwordAttempts.slice(-4).reverse();
    const keySec = sec('🔑', '鍵の候補', [
      ent('試行', `${pwAttempts} 回`),
      ...lastAttempts.map(a =>
        ent(a.success ? '✓ 成功' : '✗', `<code>${escapeHtml(a.pass.slice(0, 16))}</code>`)
      ),
    ], pwAttempts > 0 || folderOpened, 'もっと情報を集めてから…');

    // 全解禁チェック
    const allUnlocked = calcOpened && (browserUsed || colorKnown) && diaryCount >= 3 && audioPlayed && (pwAttempts > 0 || folderOpened);
    const completeBanner = allUnlocked
      ? `<div class="inv-complete">全ての手がかりを集めた——<br>後は繋ぎ合わせるだけだ。</div>`
      : '';

    const html = `
      <div class="inv-wrap">
        <div class="inv-header">
          <span>📋 調査ノート</span>
          <button class="inv-refresh" id="inv-refresh">↺ 更新</button>
        </div>
        ${numSec}${colorSec}${diarySec}${audioSec}${keySec}
        ${completeBanner}
      </div>
    `;

    const x = pos ? pos.x : 140;
    const y = pos ? pos.y : 65;
    const win = createWindow('investigation-memo', '調査メモ.exe', html, { width: 380, height: 510, x, y });
    if (!win) return;

    win.querySelector('#inv-refresh').addEventListener('click', () => {
      const curX = parseInt(win.style.left) || x;
      const curY = parseInt(win.style.top)  || y;
      destroyWindow('investigation-memo');
      openInvestigationMemo({ x: curX, y: curY });
    });
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // =====================================================
  // パスワードモーダル
  // =====================================================
  let pwTarget = null;

  function openPasswordModal(target) {
    pwTarget = target;
    const modal = document.getElementById('pw-modal');
    const f1 = document.getElementById('pw-frag1');
    const f2 = document.getElementById('pw-frag2');
    const f3 = document.getElementById('pw-frag3');
    const err = document.getElementById('pw-error');
    
    modal.classList.remove('hidden');
    f1.value = ''; f2.value = ''; f3.value = '';
    err.classList.add('hidden');
    setTimeout(() => f1.focus(), 50);
  }

  function initPasswordModal() {
    const modal  = document.getElementById('pw-modal');
    const f1 = document.getElementById('pw-frag1');
    const f2 = document.getElementById('pw-frag2');
    const f3 = document.getElementById('pw-frag3');
    const err    = document.getElementById('pw-error');
    const okBtn  = document.getElementById('pw-ok');
    const canBtn = document.getElementById('pw-cancel');

    function attempt() {
      const val = (f1.value + f2.value + f3.value).trim().toLowerCase();
      
      let unlockType = null;
      if (val.includes('3') && val.includes('key') && val.includes('5')) unlockType = 'composite';
      else if (val.includes('wake')) unlockType = 'linguistic';
      else if (val.includes('3455')) unlockType = 'math';
      else if (val.includes('a5acfd')) unlockType = 'visual';

      const ok = (unlockType !== null);
      window.LD.Logger.logPasswordAttempt(val, ok);

      if (ok) {
        console.log(`%c[LD] 認証成功 — 解読ルート: ${unlockType}`, 'color:#10b981;font-weight:bold;font-size:13px');
        modal.classList.add('hidden');
        openHiddenFolder(unlockType);
      } else {
        console.warn(`[LD] 認証試行を記録: "${val.slice(0,20)}"`);
        err.classList.remove('hidden');
        f1.value = ''; f2.value = ''; f3.value = '';
        const dlg = document.getElementById('pw-dialog');
        dlg.classList.add('shake');
        setTimeout(() => dlg.classList.remove('shake'), 500);
        window.LD.Effects.checkThresholds(window.LD.Logger.getLog());
      }
    }

    okBtn.addEventListener('click', attempt);
    canBtn.addEventListener('click', () => modal.classList.add('hidden'));
    
    [f1, f2, f3].forEach(f => {
      f.addEventListener('keydown', e => {
        if (e.key === 'Enter') attempt();
        if (e.key === 'Escape') modal.classList.add('hidden');
      });
    });

    modal.addEventListener('click', e => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }

  // =====================================================
  // 時計
  // =====================================================
  function startClock() {
    const el        = document.getElementById('clock');
    const gameStart = Date.now();
    const fakeBase  = (23 * 60 + 47) * 60 * 1000;
    function tick() {
      const total = fakeBase + (Date.now() - gameStart);
      const h = Math.floor(total / 3600000) % 24;
      const m = Math.floor(total /   60000) % 60;
      el.textContent = String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
    }
    tick();
    setInterval(tick, 1000);
  }

  // =====================================================
  // コンテキストメニュー（右クリック偽メニュー）
  // =====================================================
  function showCtxAlert(msg) {
    const html = `<div style="padding:20px;text-align:center;">
      <div style="font-size:28px;margin-bottom:10px">⚠️</div>
      <div style="font-size:12px;color:#334;line-height:1.9;font-family:monospace">${msg.replace(/\n/g,'<br>')}</div>
    </div>`;
    createWindow('ctx-alert-' + Date.now(), 'エラー', html, { width: 300, height: 180, x: 200, y: 160 });
  }

  function showSysProperties() {
    const sid = Math.random().toString(36).slice(2, 10).toUpperCase();
    const content = `システムのプロパティ
============================================
  コンピューター名 : SUBJECT-X-UNIT
  OS               : Project LD OS Ver.2.1
  ユーザー名       : [記録中]
  セッションID     : ${sid}
  記録状態         : ■ ACTIVE
  観測ノード       : 01

============================================
  このシステムにアクセスした時点で、
  あなたのセッションデータは
  記録されています。`;
    const html = `<div class="txt-wrap"><pre class="txt-body">${escapeHtml(content)}</pre></div>`;
    createWindow('sys-props', 'システムのプロパティ', html, { width: 400, height: 310, x: 100, y: 70 });
  }

  function initContextMenu() {
    const desktop = document.getElementById('desktop');
    const menu    = document.getElementById('ctx-menu');
    if (!desktop || !menu) return;

    const items = [
      { label: '表示(V)',            disabled: true },
      { label: '最新の情報に更新(E)', action: () => {
          window.LD.Effects.triggerGlitch(350);
          setTimeout(() => window.LD.Effects.showTypewriter('データはすでに\nリアルタイムで\n更新されています。'), 700);
        }
      },
      { sep: true },
      { label: '貼り付け(P)',          action: () => showCtxAlert('アクセスが拒否されました。\n(Error: 0x80070005)') },
      { label: '新しいフォルダ(N)',     action: () => showCtxAlert('アクセスが拒否されました。\n(Error: 0x80070005)') },
      { sep: true },
      { label: 'プロパティ(R)', action: showSysProperties },
    ];

    function render(x, y) {
      menu.innerHTML = items.map((it, idx) => {
        if (it.sep) return '<div class="ctx-sep"></div>';
        const cls = it.disabled ? 'ctx-item ctx-disabled' : 'ctx-item';
        return `<div class="${cls}" data-idx="${idx}">${it.label}</div>`;
      }).join('');
      menu.querySelectorAll('.ctx-item:not(.ctx-disabled)').forEach(el => {
        const it = items[+el.dataset.idx];
        if (it && it.action) el.addEventListener('click', () => { hide(); it.action(); });
      });
      menu.style.cssText = `left:${Math.min(x, innerWidth - 200)}px;top:${Math.min(y, innerHeight - 200)}px;`;
      menu.classList.remove('hidden');
    }
    function hide() { menu.classList.add('hidden'); }

    desktop.addEventListener('contextmenu', e => {
      if (e.target.closest('.win') || e.target.closest('.desktop-icon')) { e.preventDefault(); hide(); return; }
      e.preventDefault();
      render(e.clientX, e.clientY);
    });
    document.addEventListener('click', hide);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
  }

  // =====================================================
  // 初期化
  // =====================================================
  return {
    init() {
      renderDesktop();
      renderStickyNotes();
      initPasswordModal();
      startClock();
      initContextMenu();
      window.LD.Logger.init();

      // デスクトップクリックで選択解除
      document.getElementById('desktop').addEventListener('click', e => {
        if (e.target.id === 'desktop' || e.target.id === 'desktop-icons' || e.target.id === 'sticky-area') {
          document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('icon-sel'));
        }
      });

      // ESCでパスワードモーダルを閉じる
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          const modal = document.getElementById('pw-modal');
          if (!modal.classList.contains('hidden')) modal.classList.add('hidden');
        }
        // Ctrl+Shift+A (または Cmd+Shift+A) でリアルタイム分析画面を表示
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
          e.preventDefault();
          window.LD.Feedback.show(window.LD.Logger.getLog(), true);
        }
      });

      console.log('%c[Life Decipher] システム起動 — セッション記録を開始', 'color:#3b82f6;font-weight:bold;font-size:13px');

      // 初回クリックで環境音を開始（autoplay policy対策）
      document.addEventListener('click', function startAmb() {
        window.LD.Audio.startAmbient && window.LD.Audio.startAmbient();
        document.removeEventListener('click', startAmb);
      }, { once: true });
    }
  };
})();

// =====================================================
// ブートシーケンス
// =====================================================
function runBootSequence() {
  const screen = document.getElementById('boot-screen');
  if (!screen) return;
  const bar    = document.getElementById('boot-bar-inner');
  const status = document.getElementById('boot-status');

  const msgs = [
    { t: 500,  m: 'ユーザープロファイルを読み込み中…' },
    { t: 1600, m: 'セッションモジュールを初期化しています…' },
    { t: 2800, m: '記録を開始します。' },
  ];
  msgs.forEach(({ t, m }) => setTimeout(() => { if (status) status.textContent = m; }, t));

  let pct = 0;
  const tick = setInterval(() => {
    pct = Math.min(pct + 2, 100);
    if (bar) bar.style.width = pct + '%';
    if (pct >= 100) clearInterval(tick);
  }, 62);

  setTimeout(() => {
    screen.classList.add('boot-fadeout');
    setTimeout(() => screen.remove(), 1100);
  }, 3900);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { window.LD.App.init(); runBootSequence(); });
} else {
  window.LD.App.init();
  runBootSequence();
}

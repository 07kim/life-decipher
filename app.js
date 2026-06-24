// メインアプリケーション
// デスクトップ・ウィンドウシステム・ファイル操作を管理する
window.LD = window.LD || {};

window.LD.App = (function () {
  let zTop = 100;
  const openWindows = {};
  let sameColorTriggered = false;
  let tricolorTriggered  = false;
  let memoContent = '';

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
      { id: 'diary-txt',       label: '日記.txt',          emoji: '📝', x: 32,     y: 32,        action: openDiary },
      { id: 'voice-memos',     label: 'ボイスメモ',          emoji: '📁', x: 32,     y: 148,       action: openVoiceMemos },
      { id: 'browser',         label: 'SearchX',             emoji: '🌐', x: 32,     y: 264,       action: openBrowser },
      { id: 'my-files',        label: 'ドキュメント',          emoji: '📁', x: 32,     y: 380,       action: openFileManager },
      { id: 'game-2048',       label: '2048',                emoji: '🔢', x: 140,    y: 32,        action: open2048 },
      { id: 'game-sweep',      label: 'マインスイーパー',     emoji: '💣', x: 140,    y: 148,       action: openMinesweeper },
      { id: 'game-typing',     label: 'タイピング',           emoji: '⌨️', x: 140,    y: 264,       action: openTypingGame },
      { id: 'settings',        label: '設定',                 emoji: '⚙️', x: 32,     y: H - 170,   action: openSettings },
      { id: 'resonance-app',   label: 'Resonance',            emoji: '💜', x: 32,     y: H - 280,   action: openResonanceApp },
      { id: 'recycle-bin',     label: 'ゴミ箱',              emoji: '🗑️', x: W - 90, y: 32,        action: openRecycleBin },
      { id: 'twitx-app',       label: 'TwitX',               emoji: '🐦', x: W - 90, y: 148,       action: openTwitXApp },
      { id: 'mailbox-app',     label: 'MailBox',             emoji: '📧', x: W - 90, y: 264,       action: openMailBoxApp },
      { id: 'terminal',        label: 'ターミナル',            emoji: '🖥️', x: W - 90, y: 380,       action: openTerminal },
      { id: 'system-folder',   label: 'system',              emoji: '🔒', x: W - 90, y: H - 170,   action: openSystemFolder },
      { id: 'analysis-report', label: '分析レポート.pdf',     emoji: '📊', x: W - 90, y: H - 170,  action: () => window.LD.Feedback.show(window.LD.Logger.getLog(), true), hidden: true }
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
  // メッセージ内容の分析（共通ユーティリティ）
  // =====================================================
  function analyzeMessageContent(text) {
    const len = text.length;
    // 長文ほど没入度・言語力を加算
    if (len > 20)  window.LD.Assessment && window.LD.Assessment.update('immersion', 3);
    if (len > 60)  window.LD.Assessment && window.LD.Assessment.update('linguistic', 4);
    if (len > 120) window.LD.Assessment && window.LD.Assessment.update('immersion', 4);
    // 質問 → 情報収集力
    if (/[?？]|ですか|でしょうか|かな|だろう/.test(text)) {
      window.LD.Assessment && window.LD.Assessment.update('info_seeking', 5);
    }
    // 感情・内省語 → 言語理解
    if (/心配|不思議|驚|おかしい|気になる|なぜ|もしか/.test(text)) {
      window.LD.Assessment && window.LD.Assessment.update('linguistic', 3);
    }
    // 分析・推測語 → 統合力
    if (/つまり|ということ|原因|理由|推測|思うに|考え/.test(text)) {
      window.LD.Assessment && window.LD.Assessment.update('integration', 5);
    }
    // 短文連投傾向（3文字以下）→ カオス
    if (len <= 3) {
      window.LD.Assessment && window.LD.Assessment.update('chaos', 3);
    }
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
      win.querySelector('#d-body').innerHTML   = renderDiaryText(entry.content, entry.id);
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

  function renderDiaryText(content, diaryId) {
    if (diaryId === 'd30') {
      const scores = window.LD.Assessment.getScores();
      const top = Object.entries(scores)
        .filter(([k]) => k !== 'frustration')
        .sort((a, b) => b[1] - a[1])[0];
      const dynamicLines = {
        immersion:         '次の被験者は——あなたのことだ。',
        chaos:             '次の被験者は、まだ気づいていない。',
        info_seeking:      '次の被験者は、すでに答えを持っている。',
        linguistic:        'この行を読んでいる。今、声に出しているかもしれない。',
        math:              '次の被験者は、数字を数えながらここを読んでいる。',
        spatial:           '次の被験者は、画面の端を見ている。',
        conscientiousness: '次の被験者は、順番に全てを調べた。',
        integration:       '次の被験者は、全ての断片を繋ぎ合わせた。',
      };
      const dynamic = dynamicLines[top ? top[0] : 'immersion'] || '次の被験者は、もう動き始めている。';
      content = content.replace('次の被験者は、もう動き始めている。', dynamic);
    }
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
    window.LD.Logger.logFileOpen('browser', 'SearchX');
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
      if (u.includes('twitx') || u.includes('subject_x')) return 'twitx';
      if (u.includes('mail.ldnet') || u.includes('mailbox')) return 'mailbox';
      if (u.includes('dailynet') || u.includes('daily')) return 'dailynet';
      if (u.includes('darkdl') || u.includes('0x') || u.includes('unredact') || u.includes('black')) return 'darkdl';
      return null;
    }
    function keyToUrl(key) {
      return {
        home:     'searchx://home',
        sticky:   'http://memo.techblog.jp/sticky',
        colorlab: 'http://colors.designlab.jp',
        picker:   'http://tools.colorpick.jp',
        twitx:    'http://twitx.social/@subject_x',
        mailbox:  'http://mail.ldnet.jp',
        dailynet: 'http://dailynet.news/local',
        darkdl:   'http://0x7f.darkdl.onion/tools'
      }[key] || 'searchx://home';
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
      },
      {
        key:'twitx', url:'twitx.social/@subject_x',
        title:'TwitX — @subject_x のプロフィール',
        desc:'最終ログイン: 3日前。最後のポスト: 「もうすぐ終わる」',
        tags:/twitter|twit|twitx|sns|ソーシャル|social|subject|被験者|x|プロフィール|profile|アカウント|account|失踪|ダイレクト|dm|メッセージ|message|チャット|chat/
      },
      {
        key:'mailbox', url:'mail.ldnet.jp',
        title:'MailBox — 受信トレイ (3)',
        desc:'未読メールが3件あります。',
        tags:/mail|メール|受信|inbox|message|メッセージ|連絡|contact|送信|send|下書き|draft|緊急|urgent/
      },
      {
        key:'dailynet', url:'dailynet.news/local',
        title:'DailyNet — ローカルニュース',
        desc:'地元で不審な研究施設が発見か。住民が語る「夜中に光が見えた」',
        tags:/news|ニュース|新聞|記事|article|daily|地元|local|施設|研究|報道|report|事件/
      },
      {
        key:'darkdl', url:'0x7f.darkdl.onion/tools',
        title:'[非公開] Unredact Tools — 黒塗り解除ユーティリティ',
        desc:'政府・機関文書の黒塗り部分を解析・復元するツール。v2.1 公開中。',
        tags:/黒塗り|redact|unredact|解除|復元|機密|秘密|hidden|file|ファイル|ツール|tool|exe|ダウンロード|download|解析|analyze|暗号|decrypt/
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
      else if (key === 'twitx')    renderTwitX();
      else if (key === 'mailbox')  renderMailBox();
      else if (key === 'dailynet') renderDailyNet();
      else if (key === 'darkdl')   renderDarkDL();
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
            <div><span class="bw-fav-link" data-key="dailynet">📰 DailyNet — ローカルニュース</span></div>
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

    // TwitX タブ状態
    let txTab = 'posts';

    const TX_POSTS = [
      { id: 'p1', handle: '@subject_x', time: '3日前', body: 'もうすぐ終わる。全ての記録は残してある。', replies: [] },
      { id: 'p2', handle: '@subject_x', time: '5日前', body: '誰かがここを見ているとしたら——\n日記を読め。順番に。', replies: [] },
      { id: 'p3', handle: '@subject_x', time: '8日前', body: 'W.A.K.E. — これが最後のヒントになる。\n#ProjectLD', replies: [] },
      { id: 'p4', handle: '@subject_x', time: '10日前', body: 'Project LDの設計は完璧だ。被験者は気づかない。\n#ProjectLD #実験', replies: [] },
    ];

    const WATCHER_REPLIES = [
      'そうですか…。',
      '記録しました。',
      'あなたは気づいている。',
      '続けてください。',
    ];

    function renderTwitX() {
      window.LD.Logger.logBrowserSiteVisit && window.LD.Logger.logBrowserSiteVisit('twitx');
      const logData = window.LD.Logger.getLog();
      const hasDmSent = logData.twitxDmSent;
      const replies = logData.twitxReplies || [];

      content.innerHTML = `
        <div class="bw-tx-page">
          <div class="bw-tx-banner"></div>
          <div class="bw-tx-profile-header">
            <div class="bw-tx-avatar">👤</div>
            <button class="bw-sq-btn bw-tx-dm-btn" id="bw-tx-dm-btn" style="margin-left:auto;font-size:11px;">
              💬 DM ${!logData.twitxDmRead ? '<span style="color:#ef4444;font-size:9px;">●</span>' : ''}
            </button>
          </div>
          <div class="bw-tx-identity">
            <div class="bw-tx-name">被験者X</div>
            <div class="bw-tx-handle">@subject_x &nbsp;·&nbsp; <span style="color:#9ca3af;">フォロワー: 3</span></div>
            <div class="bw-tx-bio" style="font-size:11px;color:#6b7280;margin-top:4px;">最終ログイン: 3日前</div>
          </div>
          <div class="bw-tx-tabs">
            <div class="bw-tx-tab ${txTab === 'posts' ? 'bw-tx-tab-active' : ''}" data-tab="posts">ポスト</div>
            <div class="bw-tx-tab ${txTab === 'replies' ? 'bw-tx-tab-active' : ''}" data-tab="replies">返信 ${replies.length > 0 ? `(${replies.length})` : ''}</div>
          </div>
          <div class="bw-tx-feed" id="bw-tx-feed"></div>
          ${hasDmSent ? `<div class="bw-tx-sent-badge">✓ メッセージ送信済み</div>` : ''}
        </div>
      `;

      content.querySelectorAll('.bw-tx-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          txTab = tab.dataset.tab;
          renderTwitX();
        });
      });

      content.querySelector('#bw-tx-dm-btn').addEventListener('click', () => {
        window.LD.Logger.logBrowserSiteVisit && window.LD.Logger.logBrowserSiteVisit('twitx-dm');
        window.LD.Logger.logTwitxDmRead && window.LD.Logger.logTwitxDmRead();
        renderTwitXDm();
      });

      const feed = content.querySelector('#bw-tx-feed');
      if (txTab === 'posts') renderPostFeed(feed);
      else renderRepliesFeed(feed);
    }

    function renderPostFeed(feed) {
      const logData = window.LD.Logger.getLog();
      const replies = logData.twitxReplies || [];

      feed.innerHTML = TX_POSTS.map(p => {
        const myReplies = replies.filter(r => r.postId === p.id);
        return `
          <div class="bw-tx-post" data-post-id="${p.id}">
            <div class="bw-tx-post-avatar">👤</div>
            <div class="bw-tx-post-body">
              <div class="bw-tx-meta">${escapeHtml(p.handle)} &nbsp;<span style="color:#9ca3af;">· ${p.time}</span></div>
              <div class="bw-tx-body" style="white-space:pre-wrap;">${escapeHtml(p.body)}</div>
              ${myReplies.map(r => `
                <div class="bw-tx-reply-item">
                  <span class="bw-tx-reply-you">あなた:</span> ${escapeHtml(r.body)}
                </div>
                ${r.watcherReply ? `<div class="bw-tx-reply-item bw-tx-reply-watcher"><span class="bw-tx-reply-who">@watcher_0:</span> ${escapeHtml(r.watcherReply)}</div>` : ''}
              `).join('')}
              <div class="bw-tx-actions">
                <button class="bw-tx-reply-btn" data-post-id="${p.id}">💬 返信</button>
              </div>
              <div class="bw-tx-reply-form" id="reply-form-${p.id}" style="display:none;"></div>
            </div>
          </div>
        `;
      }).join('');

      bindReplyBtns(feed);
    }

    function renderRepliesFeed(feed) {
      const logData = window.LD.Logger.getLog();
      const replies = logData.twitxReplies || [];
      if (replies.length === 0) {
        feed.innerHTML = `<div style="padding:20px;text-align:center;color:#9ca3af;font-size:11px;">まだ返信はありません</div>`;
        return;
      }
      feed.innerHTML = replies.map(r => `
        <div class="bw-tx-post">
          <div class="bw-tx-post-avatar">🧑</div>
          <div class="bw-tx-post-body">
            <div class="bw-tx-meta" style="color:#3b82f6;">あなた &nbsp;<span style="color:#9ca3af;">· 投稿#${r.postId}</span></div>
            <div class="bw-tx-body">${escapeHtml(r.body)}</div>
            ${r.watcherReply ? `
              <div class="bw-tx-reply-item bw-tx-reply-watcher" style="margin-top:8px;">
                <span class="bw-tx-reply-who">@watcher_0:</span> ${escapeHtml(r.watcherReply)}
              </div>
            ` : ''}
          </div>
        </div>
      `).join('');
    }

    function bindReplyBtns(feed) {
      feed.querySelectorAll('.bw-tx-reply-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const postId = btn.dataset.postId;
          const form = feed.querySelector('#reply-form-' + postId);
          if (!form) return;
          if (form.style.display !== 'none') { form.style.display = 'none'; return; }
          form.style.display = 'block';
          renderReplyCompose(form, postId);
        });
      });
    }

    function renderReplyCompose(form, postId) {
      form.innerHTML = `
        <div class="bw-tx-compose">
          <textarea class="bw-tx-compose-input" placeholder="返信を入力…" rows="2"></textarea>
          <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:4px;">
            <button class="bw-sq-btn bw-tx-compose-send" style="font-size:11px;">送信</button>
          </div>
        </div>
      `;
      const textarea = form.querySelector('.bw-tx-compose-input');
      const sendBtn  = form.querySelector('.bw-tx-compose-send');

      function submitReply() {
        const body = textarea.value.trim();
        if (!body) return;
        const watcherReply = WATCHER_REPLIES[Math.floor(Date.now() % WATCHER_REPLIES.length)];
        window.LD.Logger.logTwitxReply && window.LD.Logger.logTwitxReply(postId, '@subject_x', body, watcherReply);
        document.dispatchEvent(new CustomEvent('ld:goal-reached', { detail: { goal: 'twitx-reply' } }));
        txTab = 'replies';
        renderTwitX();
      }
      sendBtn.addEventListener('click', submitReply);
      textarea.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') submitReply(); });
    }

    function renderTwitXDm() {
      window.LD.Logger.logBrowserSiteVisit && window.LD.Logger.logBrowserSiteVisit('twitx-dm');
      const logData = window.LD.Logger.getLog();
      const messages = logData.twitxMessages || [];
      const alreadySent = logData.twitxDmSent;

      content.innerHTML = `
        <div class="bw-dm-wrap">
          <div class="bw-dm-header">
            <button class="bw-sq-btn" id="bw-dm-back" style="font-size:10px;padding:3px 8px;">← 戻る</button>
            <div class="bw-dm-title">
              <span class="bw-dm-avatar">👁</span>
              <span>@watcher_0</span>
              <span class="bw-dm-online">● オンライン</span>
            </div>
          </div>
          <div class="bw-dm-body" id="bw-dm-msgs">
            <div class="bw-dm-msg bw-dm-them">
              <div class="bw-dm-name">@watcher_0</div>
              <div class="bw-dm-bubble">まだいますか？</div>
            </div>
            <div class="bw-dm-msg bw-dm-them">
              <div class="bw-dm-bubble">あなたが誰なのかは知っています。<br>Xが残した記録を調べているんでしょう？</div>
            </div>
            <div class="bw-dm-msg bw-dm-them">
              <div class="bw-dm-bubble" style="background:#fff3cd;border:1px solid #fde68a;">解錠コードを見つけましたか？<br><span style="color:#9ca3af;font-size:10px;">— このメッセージは自動送信されました</span></div>
            </div>
            ${messages.map(m => `
              <div class="bw-dm-msg bw-dm-me">
                <div class="bw-dm-bubble">${escapeHtml(m)}</div>
              </div>
            `).join('')}
            ${alreadySent && messages.length > 0 ? `
              <div class="bw-dm-msg bw-dm-them">
                <div class="bw-dm-bubble">…そうですか。<br>では、あなたも「記録」の一部になりました。<br><span style="color:#9ca3af;font-size:10px;">— Project LD, participant log updated</span></div>
              </div>
            ` : ''}
          </div>
          <div class="bw-dm-footer">
            ${!alreadySent ? `
              <input type="text" id="bw-dm-input" class="bw-dm-input" placeholder="メッセージを入力… (Enterで送信)" />
              <button class="bw-sq-btn" id="bw-dm-send" style="flex-shrink:0;">送信</button>
            ` : `
              <div style="flex:1;text-align:center;font-size:10px;color:#9ca3af;">送信済み — 返信を待っています</div>
            `}
          </div>
        </div>
      `;

      content.querySelector('#bw-dm-back').addEventListener('click', () => renderTwitX());
      const dmInput = content.querySelector('#bw-dm-input');
      const dmSend  = content.querySelector('#bw-dm-send');
      if (dmSend) {
        let dmSending = false;
        function sendDm() {
          if (dmSending) return;
          const msg = dmInput ? dmInput.value.trim() : '';
          if (!msg) return;
          dmSending = true;
          dmSend.disabled = true;
          dmSend.style.opacity = '0.5';
          if (dmInput) dmInput.disabled = true;
          analyzeMessageContent(msg);
          window.LD.Logger.logTwitxDmSent && window.LD.Logger.logTwitxDmSent(msg);
          document.dispatchEvent(new CustomEvent('ld:goal-reached', { detail: { goal: 'twitx-reply', msg } }));
          setTimeout(() => {
            dmSending = false;
            renderTwitXDm(true);
          }, 1200);
        }
        dmSend.addEventListener('click', sendDm);
        if (dmInput) dmInput.addEventListener('keydown', e => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendDm(); }
        });
      }
      setTimeout(() => {
        const msgs = content.querySelector('#bw-dm-msgs');
        if (msgs) msgs.scrollTop = msgs.scrollHeight;
      }, 50);
    }

    function renderMailBox() {
      window.LD.Logger.logBrowserSiteVisit && window.LD.Logger.logBrowserSiteVisit('mailbox');
      const logData = window.LD.Logger.getLog();
      const readMails = logData.mailsRead || [];
      const mails = [
        { id:'m1', from:'unknown@ldnet.jp',      subject:'緊急：実験について',     preview:'あなたはまだそこにいますか。実験は…', important: true },
        { id:'m2', from:'noreply@ldarchive.jp',  subject:'Re: お願いがあります',   preview:'メッセージを受け取りました。しかし——', important: true },
        { id:'m3', from:'info@coupon-mail.jp',   subject:'クーポンが届いています', preview:'お得な情報をお届けします！今すぐチェック', important: false },
        { id:'m4', from:'system@ldnet.jp',       subject:'配信停止確認',           preview:'このアドレスへの配信を停止しますか？', important: false },
        { id:'m5', from:'',                      subject:'（件名なし）',           preview:'3  key  ███', important: true },
      ];
      content.innerHTML = `
        <div class="bw-art-body" style="padding:0;">
          <div style="padding:8px 12px;background:#f1f5f9;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;">
            <span style="font-weight:bold;font-size:13px;">📧 MailBox</span>
            <span style="font-size:10px;color:#888;">受信トレイ</span>
          </div>
          <div style="display:flex;justify-content:flex-end;padding:6px 12px;border-bottom:1px solid #e2e8f0;">
            <button class="bw-sq-btn" id="bw-mail-draft-btn" style="font-size:11px;">📝 下書き (1)</button>
          </div>
          <div id="bw-mail-list">
            ${mails.map(m => `
              <div class="bw-mail-item ${readMails.includes(m.id) ? '' : 'bw-mail-unread'}" data-mail-id="${m.id}">
                <div class="bw-mail-from">${escapeHtml(m.from || '（送信者不明）')} ${m.important ? '<span style="color:#ef4444;font-size:10px;">●</span>' : ''}</div>
                <div class="bw-mail-subject">${escapeHtml(m.subject)}</div>
                <div class="bw-mail-preview">${escapeHtml(m.preview)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      content.querySelectorAll('.bw-mail-item').forEach(el => {
        el.addEventListener('click', () => {
          const mailId = el.dataset.mailId;
          const mail = mails.find(m => m.id === mailId);
          if (mail) {
            window.LD.Logger.logMailRead && window.LD.Logger.logMailRead(mailId);
            el.classList.remove('bw-mail-unread');
            renderMailDetail(mail);
          }
        });
      });
      content.querySelector('#bw-mail-draft-btn').addEventListener('click', () => {
        window.LD.Logger.logBrowserSiteVisit && window.LD.Logger.logBrowserSiteVisit('mailbox-draft');
        renderMailDraft();
      });
    }

    function renderMailDetail(mail) {
      const bodies = {
        m1: `差出人: unknown@ldnet.jp\n\nあなたはまだそこにいますか。\n\n実験は終わっていません。\nXが設計したシステムは今も動いています。\n\nあなたが「被験者」であることに、気づきましたか？\n\nもし気づいたなら——下書きフォルダを確認してください。\n送るべきメッセージが残っています。`,
        m2: `差出人: noreply@ldarchive.jp\n\nメッセージを受け取りました。\nしかし、このアドレスは自動返信専用です。\n\n記録ID: LD-2024-SUBJ-NEXT\nステータス: 観測中\n\nこのメールに返信しないでください。`,
        m3: `差出人: info@coupon-mail.jp\n\nお得なクーポンをお届けします！\n\n✨ 今すぐ登録で500ポイント！\n✨ 限定セール開催中！\n\n配信停止はこちら`,
        m4: `差出人: system@ldnet.jp\n\nこのメールアドレスへの配信を停止しますか？\n\n[はい] [いいえ]\n\n※ 配信停止後も重要なシステム通知は送信されます。`,
        m5: `差出人: （不明）\n\n3  key  ███\n\n███████████████\n███ 5 ███████\n\n---\nこのメッセージは自動的に削除されます。`,
      };
      content.innerHTML = `
        <div class="bw-art-body">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
            <button class="bw-sq-btn" id="bw-mail-back" style="font-size:10px;padding:3px 8px;">← 戻る</button>
            <span style="font-weight:bold;font-size:12px;">${escapeHtml(mail.subject)}</span>
          </div>
          <pre style="white-space:pre-wrap;font-family:var(--font-mono);font-size:11px;line-height:1.8;color:#334;background:#f8fafc;padding:12px;border-radius:4px;border:1px solid #e2e8f0;">${escapeHtml(bodies[mail.id] || '（内容を読み込めませんでした）')}</pre>
        </div>
      `;
      content.querySelector('#bw-mail-back').addEventListener('click', () => renderMailBox());
    }

    function renderMailDraft() {
      const logData = window.LD.Logger.getLog();
      const sent = logData.mailDraftSent;
      content.innerHTML = `
        <div class="bw-art-body">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
            <button class="bw-sq-btn" id="bw-draft-back" style="font-size:10px;padding:3px 8px;">← 戻る</button>
            <span style="font-weight:bold;font-size:12px;">📝 下書き</span>
          </div>
          ${sent ? `
            <div style="padding:12px;background:#f0fdf4;border:1px solid #86efac;border-radius:6px;font-size:11px;color:#15803d;margin-bottom:12px;">
              ✓ 送信済み — あなたの報告は記録されました。
            </div>
          ` : ''}
          <div style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
            <div style="padding:8px 12px;background:#f1f5f9;border-bottom:1px solid #e2e8f0;font-size:11px;">
              <div>宛先: report@ld-oversight.jp</div>
              <div>件名: 【報告】Project LD — 異常を検知</div>
            </div>
            <textarea id="bw-draft-body" style="width:100%;height:120px;padding:10px;border:none;outline:none;font-size:11px;font-family:var(--font-mono);resize:none;box-sizing:border-box;" ${sent ? 'disabled' : ''}>${sent ? escapeHtml(logData.mailDraftContent || '') : 'ここに報告内容を記入してください。\n\n観測されたこと:\n'}</textarea>
          </div>
          ${!sent ? `
            <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px;">
              <button class="bw-sq-btn" id="bw-draft-discard" style="font-size:11px;">破棄</button>
              <button class="bw-sq-btn" id="bw-draft-send" style="font-size:11px;background:#3b82f6;color:white;border-color:#2563eb;">送信</button>
            </div>
          ` : ''}
        </div>
      `;
      content.querySelector('#bw-draft-back').addEventListener('click', () => renderMailBox());
      const sendBtn    = content.querySelector('#bw-draft-send');
      const discardBtn = content.querySelector('#bw-draft-discard');
      const bodyArea   = content.querySelector('#bw-draft-body');
      if (sendBtn) {
        sendBtn.addEventListener('click', () => {
          const body = bodyArea ? bodyArea.value : '';
          window.LD.Logger.logMailDraftSent && window.LD.Logger.logMailDraftSent(body);
          document.dispatchEvent(new CustomEvent('ld:goal-reached', { detail: { goal: 'mail-report' } }));
          renderMailDraft();
        });
      }
      if (discardBtn) {
        discardBtn.addEventListener('click', () => {
          window.LD.Logger.logBrowserSiteVisit && window.LD.Logger.logBrowserSiteVisit('mailbox-draft-discard');
          renderMailBox();
        });
      }
    }

    function renderDailyNet() {
      window.LD.Logger.logBrowserSiteVisit && window.LD.Logger.logBrowserSiteVisit('dailynet');
      content.innerHTML = `
        <div class="bw-art-body">
          <div class="bw-art-title" style="font-size:16px;">DailyNet ローカルニュース</div>
          <div style="border-bottom:1px solid #e5e7eb;margin-bottom:12px;"></div>
          <div class="bw-news-item" data-key="dailynet-1">
            <div class="bw-news-title">地元で不審な研究施設が発見か — 住民「夜中に光が見えた」</div>
            <div class="bw-news-meta">2日前 &nbsp;·&nbsp; ローカル</div>
            <div class="bw-news-preview">近隣住民によると、廃工場跡地に設置されたとみられる機器から深夜に光が漏れていたという。</div>
          </div>
          <div style="border-top:1px solid #f3f4f6;margin:8px 0;"></div>
          <div class="bw-news-item" data-key="dailynet-2">
            <div class="bw-news-title">心理学者が語る「なぜ人は謎を追うのか」— 行動観察の最前線</div>
            <div class="bw-news-meta">5日前 &nbsp;·&nbsp; サイエンス</div>
            <div class="bw-news-preview">「人は意味のない情報の中に、意味を見出そうとする」。探索行動そのものが診断ツールになり得ることが示唆されている。</div>
          </div>
        </div>
      `;
      content.querySelectorAll('.bw-news-item').forEach(el => {
        el.addEventListener('click', () => {
          window.LD.Logger.logBrowserSiteVisit && window.LD.Logger.logBrowserSiteVisit(el.dataset.key);
          renderDailyNetArticle(el.dataset.key);
        });
      });
    }

    function renderDailyNetArticle(key) {
      const articles = {
        'dailynet-1': {
          title: '地元で不審な研究施設が発見か',
          body: `近隣住民によると、廃工場跡地に設置されたとみられる機器から、深夜に光が漏れていたという。\n\n当局は「民間の研究活動の可能性がある」としているが、建物の所有者は特定されていない。\n\n周辺で目撃された機材の中には、「LD-2.1」というラベルの貼られたサーバーラックが含まれていたとの証言もある。\n\n住民A氏（仮名）:「ドアに貼り紙があった。"実験中 — 入室禁止"と書いてあった」`
        },
        'dailynet-2': {
          title: '心理学者が語る「なぜ人は謎を追うのか」',
          body: `「人は意味のない情報の中に、意味を見出そうとする。これは認知の本能です」\n\n心理学者・田中博士（仮名）はこう語る。\n\n最新の研究では、特定の環境に置かれた被験者の探索パターンが、その人物の認知特性を精度高く反映することが示された。\n\n特に注目すべきは「何もない空間での最初の3分間の行動」だという。\n\n「最初にどこへ目をやり、何を触り、何を無視するか——それだけで多くのことがわかります」\n\n——この記事を読んでいるあなたも、今、誰かに観察されているかもしれない。`
        }
      };
      const art = articles[key];
      if (!art) return;
      content.innerHTML = `
        <div class="bw-art-body">
          <button class="bw-sq-btn" id="bw-news-back" style="font-size:10px;padding:3px 8px;margin-bottom:12px;">← 一覧に戻る</button>
          <div class="bw-art-title">${escapeHtml(art.title)}</div>
          <div class="bw-art-meta">DailyNet</div>
          <pre style="white-space:pre-wrap;font-family:inherit;font-size:12px;line-height:1.9;color:#334;">${escapeHtml(art.body)}</pre>
        </div>
      `;
      content.querySelector('#bw-news-back').addEventListener('click', () => renderDailyNet());
    }

    function renderDarkDL() {
      window.LD.Assessment && window.LD.Assessment.update('info_seeking', 12);
      window.LD.Assessment && window.LD.Assessment.update('chaos', 8);
      const alreadyDl = window._ldUnredactInstalled;
      content.innerHTML = `
        <div class="bw-art-body" style="background:#0a0a0a;color:#b0ffb0;font-family:monospace;padding:16px;">
          <div style="color:#ff4444;font-size:10px;letter-spacing:2px;margin-bottom:8px;">[WARNING] このサイトは暗号化接続を使用していません</div>
          <div style="font-size:16px;font-weight:bold;color:#00ff88;margin-bottom:4px;">Unredact Tools v2.1</div>
          <div style="font-size:10px;color:#666;margin-bottom:16px;">0x7f.darkdl.onion/tools — 匿名アップロード / 無保証</div>
          <p style="font-size:12px;color:#ccc;line-height:1.8;">
            政府・機関発行の機密文書に施された黒塗り処理を解析し、<br>
            PDF/TXTファイルの隠蔽された部分を可視化するユーティリティ。<br>
            <span style="color:#ff8800;">※ 使用は自己責任。配布・再利用禁止。</span>
          </p>
          <div style="border:1px solid #333;padding:12px;border-radius:4px;margin:12px 0;">
            <div style="font-size:11px;color:#888;margin-bottom:8px;">ファイル情報</div>
            <div style="font-size:12px;">unredact_v2.1.exe &nbsp; <span style="color:#666;">4.7 MB &nbsp; SHA256: 7f3a...</span></div>
          </div>
          ${alreadyDl
            ? `<div style="color:#00ff88;font-size:12px;">✔ インストール済み — デスクトップのアイコンから起動できます</div>`
            : `<button id="darkdl-btn" style="background:#00ff88;color:#000;border:none;border-radius:4px;padding:10px 24px;font-size:13px;font-weight:bold;cursor:pointer;">ダウンロード &amp; インストール</button>
               <div id="darkdl-prog" style="display:none;margin-top:10px;">
                 <div style="font-size:11px;color:#888;margin-bottom:4px;">ダウンロード中...</div>
                 <div style="background:#222;height:6px;border-radius:3px;overflow:hidden;">
                   <div id="darkdl-bar" style="height:100%;background:#00ff88;width:0%;transition:width 0.1s;"></div>
                 </div>
               </div>`
          }
        </div>
      `;
      if (!alreadyDl) {
        content.querySelector('#darkdl-btn').addEventListener('click', () => {
          window.LD.Assessment && window.LD.Assessment.update('chaos', 15);
          window.LD.Assessment && window.LD.Assessment.update('openness', 10);
          const btn = content.querySelector('#darkdl-btn');
          const prog = content.querySelector('#darkdl-prog');
          const bar = content.querySelector('#darkdl-bar');
          btn.style.display = 'none';
          prog.style.display = '';
          let pct = 0;
          const t = setInterval(() => {
            pct = Math.min(pct + Math.random() * 8 + 2, 100);
            bar.style.width = pct + '%';
            if (pct >= 100) {
              clearInterval(t);
              window._ldUnredactInstalled = true;
              prog.querySelector('div').textContent = '完了 — デスクトップにインストールしました';
              bar.style.background = '#00ff88';
              // デスクトップにアイコンを追加
              addUnredactIcon();
              document.dispatchEvent(new CustomEvent('ld:goal-reached', { detail: { goal: 'darkdl-install' } }));
            }
          }, 80);
        });
      }
    }

    function addUnredactIcon() {
      const desk = document.getElementById('desktop');
      if (!desk || document.getElementById('ico-unredact')) return;
      const ico = document.createElement('div');
      ico.className = 'desktop-icon'; ico.id = 'ico-unredact';
      ico.style.cssText = 'position:absolute;left:248px;top:32px;';
      ico.innerHTML = `<div class="di-emoji">🔓</div><div class="di-label">Unredact.exe</div>`;
      ico.addEventListener('dblclick', openUnredactApp);
      desk.appendChild(ico);
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

  function openRecycleBin() {
    window.LD.Logger.logFileOpen('recycle-bin', 'ゴミ箱');

    const deletedFiles = [
      {
        id: 'df_report',
        name: 'final_report_DRAFT.txt',
        size: '3.2 KB',
        deleted: '20XX/10/30',
        content: `最終報告書（草稿）
=====================================

Project LD — 観察記録まとめ

観察期間: 20XX年6月〜10月

主要な発見:
  1. 被験者は「目的のない空間」で平均2.3分間、何も行動しない
  2. 最初に触れるオブジェクトが、その後の探索パターンを決定する
  3. 「誰かに見られている」という感覚は、行動を変容させる

=====================================

注記: この草稿はXが意図的に削除した。
なぜ削除されたのかは不明。
完成版は ████████████████████`
      },
      {
        id: 'df_voice',
        name: '音声_011(削除済み).wav.txt',
        size: '0.4 KB',
        deleted: '20XX/10/29',
        content: `[音声ファイルのトランスクリプト — 自動生成]

「...聞こえていますか。これを再生している人へ。

私はXです。
このシステムを設計したのは私ですが——
今は、このシステムの外にいます。

あなたが今感じている「誰かに見られている感覚」は、
正しいです。

でも、それはもう関係ない。

...鍵は3つあります。
3と、key と、5。
でも本当の答えは、パスワードじゃない。」

[音声終了]`
      },
      {
        id: 'df_photo',
        name: 'photo_encrypted.jpg.txt',
        size: '1.8 KB',
        deleted: '20XX/10/28',
        content: `[破損した画像ファイル — テキストデータのみ復元可能]

EXIF Data:
  撮影日時: 20XX/10/15  03:47:22
  撮影場所: [データ削除済み]
  デバイス: Project LD Terminal Unit

画像の説明（メタデータより）:
  "デスクトップのスクリーンショット。
   付箋が3色——赤、緑、青——に分類されて
   配置されている。中央には空白がある。
   空白の形は、文字のように見える。"

注記: このファイルはProjectLDシステムが
自動的にゴミ箱に移動しました。`
      },
      {
        id: 'df_calc',
        name: '数列メモ.txt',
        size: '0.6 KB',
        deleted: '20XX/10/27',
        content: `数列メモ — X の走り書き
=====================================

  1, 1, 2, 3, 5, 8, 13, 21, [  ], [  ]

  ルール: 前の2つの数を足す
    13 + 21 = 34
    21 + 34 = 55

  → 続きは 34 と 55

=====================================

Xが好んだのは「小さい順」だ。
  34 を先に、55 を後に——
  つまり「3455」。`
      }
    ];

    let restored = new Set(window.LD.Logger.getLog().recycleRestored || []);

    function renderBin(win) {
      const list = win.querySelector('#recycle-list');
      if (!list) return;

      list.innerHTML = deletedFiles.map(f => `
        <div class="fitem ${restored.has(f.id) ? 'fitem-restored' : ''}" data-id="${f.id}">
          <span class="fitem-ico">${restored.has(f.id) ? '📄' : '🗑️'}</span>
          <div class="fitem-info">
            <div class="fitem-name" style="${restored.has(f.id) ? '' : 'color:#bbb;text-decoration:line-through;'}">${escapeHtml(f.name)}</div>
            <div class="fitem-meta">削除日: ${f.deleted} &nbsp;|&nbsp; ${f.size}</div>
          </div>
          <div class="fitem-actions">
            ${restored.has(f.id)
              ? `<button class="recycle-btn recycle-open" data-id="${f.id}">開く</button>`
              : `<button class="recycle-btn recycle-restore" data-id="${f.id}">復元</button>
                 <button class="recycle-btn recycle-delete" data-id="${f.id}" style="color:#ef4444;">完全削除</button>`
            }
          </div>
        </div>
      `).join('');

      list.querySelectorAll('.recycle-restore').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          restored.add(id);
          window.LD.Logger.logRecycleRestore && window.LD.Logger.logRecycleRestore(id);
          renderBin(win);
          if (restored.size >= deletedFiles.length) {
            setTimeout(() => {
              document.dispatchEvent(new CustomEvent('ld:goal-reached', { detail: { goal: 'recycle-restore-all' } }));
            }, 500);
          }
        });
      });

      list.querySelectorAll('.recycle-open').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const f = deletedFiles.find(x => x.id === id);
          if (!f) return;
          window.LD.Logger.logFileOpen(id, f.name);
          const h = `<div class="txt-wrap"><pre class="txt-body">${escapeHtml(f.content)}</pre></div>`;
          createWindow(id, f.name, h, { width: 460, height: 340, x: 180, y: 100 });
        });
      });

      list.querySelectorAll('.recycle-delete').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const idx = deletedFiles.findIndex(x => x.id === id);
          if (idx !== -1) deletedFiles.splice(idx, 1);
          window.LD.Assessment && window.LD.Assessment.update('frustration', 2);
          renderBin(win);
        });
      });
    }

    const html = `
      <div class="folder-wrap">
        <div class="folder-path">🗑️ ゴミ箱 — 削除されたファイル</div>
        <div class="flist" id="recycle-list"></div>
        <div class="flist-hint">復元: ファイルをデスクトップに戻す &nbsp;|&nbsp; 完全削除: 永久に失われます</div>
      </div>
    `;
    const win = createWindow('recycle-bin', 'ゴミ箱', html, { width: 500, height: 320 });
    if (!win) return;

    renderBin(win);
  }

  // =====================================================
  // TwitX 独立アプリ
  // =====================================================
  function openTwitXApp() {
    window.LD.Logger.logFileOpen('twitx-app', 'TwitX');
    window.LD.Assessment && window.LD.Assessment.update('info_seeking', 5);
    if (document.getElementById('win-twitx-app')) { focusWindow('twitx-app'); return; }
    const alreadyLoggedIn = false;
    const loginHtml = `
      <div class="tx-app-wrap">
        <div class="tx-app-header">
          <span class="tx-logo">𝕏</span>
          <span class="tx-logo-text">TwitX</span>
        </div>
        <div class="tx-login-box" id="tx-login-box">
          <div class="tx-login-title">アカウントにログイン</div>
          <div class="tx-login-desc">@subject_x のアカウントにアクセスするには<br>パスワードが必要です。</div>
          <div class="tx-field-wrap">
            <label class="tx-label">ユーザー名</label>
            <input class="tx-input" value="@subject_x" readonly style="color:#9ca3af;" />
          </div>
          <div class="tx-field-wrap">
            <label class="tx-label">パスワード</label>
            <input class="tx-input" type="password" id="tx-pw-input" placeholder="パスワードを入力…" />
          </div>
          <div class="tx-login-err hidden" id="tx-login-err">パスワードが正しくありません。</div>
          <button class="tx-login-btn" id="tx-login-btn">ログイン</button>
          <div class="tx-forgot-link" id="tx-forgot-link">パスワードを忘れた場合</div>
        </div>
        <div class="tx-recover-box hidden" id="tx-recover-box">
          <div class="tx-login-title">アカウントの復元</div>
          <div class="tx-login-desc">@subject_x のアカウントを復元するには<br>以下の情報を入力してください。</div>
          <div class="tx-field-wrap">
            <label class="tx-label">登録メールアドレス</label>
            <input class="tx-input" id="tx-recover-mail" placeholder="メールアドレスを入力…" />
          </div>
          <div class="tx-field-wrap">
            <label class="tx-label">生年月日（MMDD形式）</label>
            <input class="tx-input" id="tx-recover-bday" placeholder="例: 1023" maxlength="4" />
          </div>
          <div class="tx-login-err hidden" id="tx-recover-err">情報が一致しません。</div>
          <button class="tx-login-btn" id="tx-recover-btn">復元する</button>
          <div class="tx-forgot-link" id="tx-back-link">← ログインに戻る</div>
        </div>
        <div class="tx-public-posts">
          <div class="tx-public-hd">@subject_x の最近の投稿（公開）</div>
          <div class="tx-public-post">「もうすぐ終わる。全ての記録は残してある。」— 3日前</div>
          <div class="tx-public-post">「誰かがここを見ているとしたら——日記を読め。」— 5日前</div>
        </div>
      </div>
    `;
    const win = createWindow('twitx-app', 'TwitX', alreadyLoggedIn ? '<div id="tx-timeline-wrap" style="height:100%;"></div>' : loginHtml, { width: 520, height: 500, x: 120, y: 50 });
    if (!win) return;
    if (alreadyLoggedIn) {
      renderTwitXTimeline(win.querySelector('#tx-timeline-wrap'));
      return;
    }
    function tryLogin(pw) {
      const k = pw.toLowerCase().trim();
      const valid = (k === '3key5') || (k.includes('3') && k.includes('key') && k.includes('5'));
      window.LD.Logger.logPasswordAttempt(pw, valid);
      if (valid) { onTwitXLoginSuccess('composite'); }
      else {
        win.querySelector('#tx-login-err').classList.remove('hidden');
        window.LD.Effects && window.LD.Effects.checkThresholds(window.LD.Logger.getLog());
      }
    }
    function tryRecover(mail, bday) {
      const validMail = mail.toLowerCase().includes('subject') || mail.toLowerCase().includes('x@') || mail.toLowerCase().includes('ldnet') || mail.trim() === '';
      const validBday = bday.trim() === '1023';
      if (validBday) { onTwitXLoginSuccess('recover'); }
      else { win.querySelector('#tx-recover-err').classList.remove('hidden'); }
    }
    function onTwitXLoginSuccess(route) {
      window.LD.Logger.logTwitXLogin && window.LD.Logger.logTwitXLogin(route);
      window.LD.Assessment && window.LD.Assessment.update('info_seeking', 20);
      window.LD.Assessment && window.LD.Assessment.update('integration', 10);
      window.LD.Effects.triggerGlitch(300);
      if (!window.LD.Logger.getLog().systemUnlocked) window.LD.Logger.logUnlock(route);
      setTimeout(() => {
        const body = win.querySelector('.win-body');
        body.innerHTML = '<div id="tx-timeline-wrap" style="height:100%;"></div>';
        renderTwitXTimeline(body.querySelector('#tx-timeline-wrap'));
        document.dispatchEvent(new CustomEvent('ld:goal-reached', { detail: { goal: 'twitx-login', route } }));
      }, 600);
    }
    win.querySelector('#tx-login-btn').addEventListener('click', () => tryLogin(win.querySelector('#tx-pw-input').value));
    win.querySelector('#tx-pw-input').addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(win.querySelector('#tx-pw-input').value); });
    win.querySelector('#tx-forgot-link').addEventListener('click', () => {
      win.querySelector('#tx-login-box').classList.add('hidden');
      win.querySelector('#tx-recover-box').classList.remove('hidden');
    });
    win.querySelector('#tx-back-link').addEventListener('click', () => {
      win.querySelector('#tx-recover-box').classList.add('hidden');
      win.querySelector('#tx-login-box').classList.remove('hidden');
    });
    win.querySelector('#tx-recover-btn').addEventListener('click', () => tryRecover(win.querySelector('#tx-recover-mail').value, win.querySelector('#tx-recover-bday').value));
  }

  function renderTwitXTimeline(container) {
    const log = window.LD.Logger.getLog();
    const msgs = log.twitxMessages || [];
    function escH(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function getWatcherReply(msg) {
      const m = msg.toLowerCase();
      if (m.includes('誰') || m.includes('who') || m.includes('何')) return 'それは答えられません。\nでも、日記の続きを読めばわかります。';
      if (m.includes('名前') || m.includes('name')) return '私の名前は関係ない。\n重要なのは、あなたが気づいたかどうかだ。';
      if (m.includes('助け') || m.includes('help') || m.includes('ヒント')) return '助けを求める前に、\nデスクトップを全部調べましたか？';
      return 'そうですか。\nでは——あなたもすでに記録の一部です。';
    }
    container.innerHTML = `
      <div class="tx-tl-wrap">
        <div class="tx-tl-header">
          <div class="tx-tl-avatar">👤</div>
          <div><div class="tx-tl-name">被験者X</div><div class="tx-tl-handle">@subject_x</div></div>
          <div class="tx-tl-badge">✓ ログイン中</div>
        </div>
        <div class="tx-tl-tabs">
          <div class="tx-tab tx-tab-active" data-tab="feed">タイムライン</div>
          <div class="tx-tab" data-tab="dm">DM ${log.twitxDmRead ? '' : '<span class="tx-notif-dot">●</span>'}</div>
          <div class="tx-tab" data-tab="notif">通知</div>
        </div>
        <div class="tx-tl-body" id="tx-tl-body"></div>
      </div>
    `;
    function showTab(tab) {
      container.querySelectorAll('.tx-tab').forEach(t => t.classList.toggle('tx-tab-active', t.dataset.tab === tab));
      const body = container.querySelector('#tx-tl-body');
      if (tab === 'feed') {
        body.innerHTML = [
          { handle: '@subject_x', time: '3日前', text: 'もうすぐ終わる。全ての記録は残してある。', likes:0 },
          { handle: '@subject_x', time: '5日前', text: '誰かがここを見ているとしたら——\n日記を読め。順番に。', likes:1 },
          { handle: '@subject_x', time: '6日前', text: 'W.A.K.E.\nこれは何の略か、わかるか。', likes:0 },
          { handle: '@watcher_0', time: '2日前', text: 'Xはどこへ行った？\n返事がない。誰か知らないか。', likes:0 },
        ].map(p => `
          <div class="tx-post">
            <div class="tx-post-av">${p.handle === '@subject_x' ? '👤' : '❓'}</div>
            <div class="tx-post-main">
              <div class="tx-post-hd"><strong>${escH(p.handle)}</strong> <span class="tx-time">· ${p.time}</span></div>
              <div class="tx-post-body">${escH(p.text).replace(/\n/g,'<br>')}</div>
              <div class="tx-post-actions"><span>💬</span> <span>❤️ ${p.likes}</span></div>
            </div>
          </div>
        `).join('');
      } else if (tab === 'dm') {
        window.LD.Logger.logTwitxDmRead && window.LD.Logger.logTwitxDmRead();
        body.innerHTML = `
          <div class="tx-dm-wrap">
            <div class="tx-dm-header">@watcher_0 <span class="tx-online">● オンライン</span></div>
            <div class="tx-dm-messages" id="tx-dm-msgs">
              <div class="tx-sys-msg">このDMはエンドツーエンドで保護されていません。</div>
              <div class="tx-dm-them"><div class="tx-dm-bubble">まだいますか？</div></div>
              <div class="tx-dm-them"><div class="tx-dm-bubble">あなたが誰なのかは知っています。<br>Xが残した記録を見ているんでしょう？</div></div>
              <div class="tx-dm-them"><div class="tx-dm-bubble">何か聞きたいことがあれば、どうぞ。<br><span style="color:#93c5fd;font-size:10px;">ただし、答えられることには限りがある。</span></div></div>
              ${msgs.map(m => `
                <div class="tx-dm-me"><div class="tx-dm-bubble">${escH(m)}</div></div>
                <div class="tx-dm-them"><div class="tx-dm-bubble">${escH(getWatcherReply(m)).replace(/\n/g,'<br>')}</div></div>
              `).join('')}
            </div>
            <div class="tx-dm-footer">
              <textarea class="tx-dm-input" id="tx-dm-text" placeholder="メッセージを入力… (Enter で送信)" rows="2"></textarea>
              <button class="tx-send-btn" id="tx-dm-send">送信</button>
            </div>
          </div>
        `;
        const dmMsgs = body.querySelector('#tx-dm-msgs');
        if (dmMsgs) dmMsgs.scrollTop = dmMsgs.scrollHeight;
        let txSending = false;
        function sendDm() {
          if (txSending) return;
          const ta  = body.querySelector('#tx-dm-text');
          const btn = body.querySelector('#tx-dm-send');
          const msg = ta ? ta.value.trim() : '';
          if (!msg) return;
          txSending = true;
          if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }
          if (ta)  { ta.disabled = true; ta.value = ''; }
          analyzeMessageContent(msg);
          window.LD.Logger.logTwitxDmSent && window.LD.Logger.logTwitxDmSent(msg);
          document.dispatchEvent(new CustomEvent('ld:goal-reached', { detail: { goal: 'twitx-reply', msg } }));
          setTimeout(() => { txSending = false; showTab('dm'); }, 1000);
        }
        body.querySelector('#tx-dm-send').addEventListener('click', sendDm);
        body.querySelector('#tx-dm-text').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendDm(); } });
      } else if (tab === 'notif') {
        body.innerHTML = `
          <div class="tx-notif-list">
            <div class="tx-notif-item">❓ @watcher_0 があなたをフォローしました</div>
            <div class="tx-notif-item">❤️ @ld_observer があなたの投稿をいいねしました</div>
            <div class="tx-notif-item" style="color:#ef4444;">⚠️ ログイン試行が3回以上失敗しました（3日前）</div>
          </div>
        `;
      }
    }
    container.querySelectorAll('.tx-tab').forEach(t => t.addEventListener('click', () => showTab(t.dataset.tab)));
    showTab('feed');
  }

  // =====================================================
  // MailBox 独立アプリ
  // =====================================================
  function openMailBoxApp() {
    window.LD.Logger.logFileOpen('mailbox-app', 'MailBox');
    window.LD.Assessment && window.LD.Assessment.update('info_seeking', 5);
    if (document.getElementById('win-mailbox-app')) { focusWindow('mailbox-app'); return; }
    const alreadyLoggedIn = false;
    const loginHtml = `
      <div class="mb-app-wrap">
        <div class="mb-header">
          <span class="mb-logo">📧</span>
          <span class="mb-logo-text">MailBox</span>
        </div>
        <div class="mb-login-box">
          <div class="mb-login-title">メールにログイン</div>
          <div class="mb-field-wrap">
            <label class="mb-label">メールアドレス</label>
            <input class="mb-input" id="mb-mail-input" placeholder="メールアドレスを入力…" />
          </div>
          <div class="mb-field-wrap">
            <label class="mb-label">パスワード</label>
            <input class="mb-input" type="password" id="mb-pw-input" placeholder="パスワードを入力…" />
          </div>
          <div class="mb-login-err hidden" id="mb-login-err">メールアドレスまたはパスワードが正しくありません。</div>
          <button class="mb-login-btn" id="mb-login-btn">ログイン</button>
          <div style="font-size:10px;color:#9ca3af;text-align:center;margin-top:8px;">ヒント: 日記の中に隠されている言葉</div>
        </div>
      </div>
    `;
    const win = createWindow('mailbox-app', 'MailBox', alreadyLoggedIn ? '<div id="mb-inbox-wrap" style="height:100%;"></div>' : loginHtml, { width: 560, height: 480, x: 140, y: 60 });
    if (!win) return;
    if (alreadyLoggedIn) { renderMailBoxInbox(win.querySelector('#mb-inbox-wrap')); return; }
    function tryMailLogin(mail, pw) {
      const validPw = pw.toLowerCase().trim() === 'wake';
      window.LD.Logger.logPasswordAttempt(pw, validPw);
      if (validPw) {
        log.mailboxLoggedIn = true;
        if (!log.systemUnlocked) window.LD.Logger.logUnlock('linguistic');
        window.LD.Assessment && window.LD.Assessment.update('linguistic', 20);
        window.LD.Assessment && window.LD.Assessment.update('info_seeking', 20);
        window.LD.Effects.triggerGlitch(300);
        document.dispatchEvent(new CustomEvent('ld:goal-reached', { detail: { goal: 'mailbox-login' } }));
        setTimeout(() => {
          const body = win.querySelector('.win-body');
          body.innerHTML = '<div id="mb-inbox-wrap" style="height:100%;"></div>';
          renderMailBoxInbox(body.querySelector('#mb-inbox-wrap'));
        }, 600);
      } else {
        win.querySelector('#mb-login-err').classList.remove('hidden');
        window.LD.Effects && window.LD.Effects.checkThresholds(window.LD.Logger.getLog());
      }
    }
    win.querySelector('#mb-login-btn').addEventListener('click', () => tryMailLogin(win.querySelector('#mb-mail-input').value, win.querySelector('#mb-pw-input').value));
    win.querySelector('#mb-pw-input').addEventListener('keydown', e => { if (e.key === 'Enter') tryMailLogin(win.querySelector('#mb-mail-input').value, win.querySelector('#mb-pw-input').value); });
  }

  function renderMailBoxInbox(container) {
    function escH(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    const emails = [
      { id:'m1', from:'watcher_0@ldnet.jp', subject:'Re: Project LD — 最終報告', date:'3日前', unread:true,
        body:`X、\n\n最終報告書はまだですか。\n締切は過ぎています。\n\n「3」「KEY」「5」——全て揃いましたか？\nシステムフォルダを確認してください。\n\n— W` },
      { id:'m2', from:'system@ldnet.jp', subject:'[自動通知] セッション記録 #047', date:'5日前', unread:true,
        body:`自動システム通知\n\nセッション #047 の記録が完了しました。\n\n被験者: 匿名\n記録時間: 47分12秒\n解析スコア: 解析中...\n\nこのメールに返信しないでください。` },
      { id:'m3', from:'no-reply@twitx.social', subject:'TwitX: 新しいフォロワーがいます', date:'1週間前', unread:false,
        body:`@watcher_0 があなたをフォローし始めました。\n\n確認はこちら: twitx.social/@watcher_0\n\nTwitXチーム` },
      { id:'m_draft', from:'（下書き）', subject:'[重要] 最終報告書', date:'下書き', unread:false, isDraft:true,
        body:`件名: 最終報告書\n宛先: watcher_0@ldnet.jp\n\n---\n\nProject LD の実験結果を報告します。\n\n被験者は予想通りの行動をとりました。\n詳細は添付ファイルを参照してください。\n\n— X` },
    ];
    container.innerHTML = `
      <div class="mb-inbox-wrap">
        <div class="mb-sidebar">
          <div class="mb-folder mb-folder-active" id="mb-inbox-tab">📥 受信トレイ <span class="mb-count">${emails.filter(e=>!e.isDraft&&e.unread).length}</span></div>
          <div class="mb-folder" id="mb-drafts-tab">📝 下書き <span class="mb-count">${emails.filter(e=>e.isDraft).length}</span></div>
          <div class="mb-folder">📤 送信済み</div>
          <div class="mb-folder">🗑️ ゴミ箱</div>
        </div>
        <div class="mb-main">
          <div class="mb-list" id="mb-list"></div>
          <div class="mb-detail" id="mb-detail"><div class="mb-empty">メールを選択してください</div></div>
        </div>
      </div>
    `;
    function showMail(email) {
      window.LD.Logger.logMailRead && window.LD.Logger.logMailRead(email.id);
      const det = container.querySelector('#mb-detail');
      det.innerHTML = `
        <div class="mb-mail-full">
          <div class="mb-mail-full-subject">${escH(email.subject)}</div>
          <div class="mb-mail-full-from">差出人: ${escH(email.from)}</div>
          <div class="mb-mail-full-date">${email.date}</div>
          <hr>
          <pre class="mb-mail-full-body">${escH(email.body)}</pre>
          ${email.isDraft ? '<button class="mb-send-btn" id="mb-send-draft">送信する</button>' : ''}
        </div>
      `;
      if (email.isDraft) {
        det.querySelector('#mb-send-draft').addEventListener('click', () => {
          window.LD.Logger.logMailDraftSent && window.LD.Logger.logMailDraftSent(email.body);
          document.dispatchEvent(new CustomEvent('ld:goal-reached', { detail: { goal: 'mail-report' } }));
          det.innerHTML = '<div class="mb-empty" style="color:#22c55e;">✓ 送信しました</div>';
        });
      }
    }
    function renderList(items) {
      const list = container.querySelector('#mb-list');
      list.innerHTML = items.map(e => `
        <div class="mb-mail-item ${e.unread ? 'mb-unread' : ''} ${e.isDraft ? 'mb-draft-item' : ''}" data-id="${e.id}">
          <div class="mb-mail-from">${escH(e.from)}</div>
          <div class="mb-mail-subject">${escH(e.subject)}</div>
          <div class="mb-mail-date">${e.date}</div>
        </div>
      `).join('');
      list.querySelectorAll('.mb-mail-item').forEach(item => {
        item.addEventListener('click', () => {
          list.querySelectorAll('.mb-mail-item').forEach(i => i.classList.remove('mb-selected'));
          item.classList.add('mb-selected');
          item.classList.remove('mb-unread');
          showMail(emails.find(e => e.id === item.dataset.id));
        });
      });
    }
    renderList(emails.filter(e=>!e.isDraft));
    container.querySelector('#mb-inbox-tab').addEventListener('click', () => {
      container.querySelectorAll('.mb-folder').forEach(f=>f.classList.remove('mb-folder-active'));
      container.querySelector('#mb-inbox-tab').classList.add('mb-folder-active');
      renderList(emails.filter(e=>!e.isDraft));
    });
    container.querySelector('#mb-drafts-tab').addEventListener('click', () => {
      container.querySelectorAll('.mb-folder').forEach(f=>f.classList.remove('mb-folder-active'));
      container.querySelector('#mb-drafts-tab').classList.add('mb-folder-active');
      renderList(emails.filter(e=>e.isDraft));
    });
  }

  // =====================================================
  // 設定アプリ
  // =====================================================
  function openSettings() {
    window.LD.Logger.logFileOpen('settings', '設定');
    if (document.getElementById('win-settings')) { focusWindow('settings'); return; }
    const html = `
      <div class="cfg-wrap">
        <div class="cfg-sidebar">
          <div class="cfg-item cfg-active" data-tab="general">⚙️ 一般</div>
          <div class="cfg-item" data-tab="account">👤 アカウント</div>
          <div class="cfg-item" data-tab="security">🔐 セキュリティ</div>
          <div class="cfg-item" data-tab="system">💾 システム</div>
          <div class="cfg-item" data-tab="advanced">🔧 詳細</div>
        </div>
        <div class="cfg-main" id="cfg-main"></div>
      </div>
    `;
    const win = createWindow('settings', '設定', html, { width: 560, height: 440, x: 100, y: 80 });
    if (!win) return;
    const sessId = Math.random().toString(36).slice(2,10).toUpperCase();
    const pages = {
      general: () => `
        <div class="cfg-page">
          <div class="cfg-section-title">表示</div>
          <div class="cfg-row"><span class="cfg-label">テーマ</span>
            <select class="cfg-select" id="cfg-theme">
              <option value="light">ライト（現在）</option>
              <option value="dark">ダーク</option>
              <option value="mono">モノクロ</option>
            </select></div>
          <div class="cfg-row"><span class="cfg-label">壁紙</span><span class="cfg-value">デフォルト（変更不可）</span></div>
          <div class="cfg-section-title">言語と地域</div>
          <div class="cfg-row"><span class="cfg-label">言語</span><span class="cfg-value">日本語</span></div>
          <div class="cfg-row"><span class="cfg-label">タイムゾーン</span><span class="cfg-value">Asia/Tokyo (UTC+9)</span></div>
        </div>`,
      account: () => `
        <div class="cfg-page">
          <div class="cfg-account-card">
            <div class="cfg-account-avatar">👤</div>
            <div><div class="cfg-account-name">[記録中]</div><div class="cfg-account-id">セッションID: ${sessId}</div></div>
          </div>
          <div class="cfg-section-title">アカウント情報</div>
          <div class="cfg-row"><span class="cfg-label">ユーザータイプ</span><span class="cfg-value">OBSERVER</span></div>
          <div class="cfg-row"><span class="cfg-label">権限レベル</span><span class="cfg-value" style="color:#ef4444;">RESTRICTED</span></div>
          <div class="cfg-row"><span class="cfg-label">記録状態</span><span class="cfg-value" style="color:#22c55e;">■ ACTIVE</span></div>
          <div class="cfg-note">※ このセッションのデータはリアルタイムで収集されています。</div>
        </div>`,
      security: () => `
        <div class="cfg-page">
          <div class="cfg-section-title">システムアクセス</div>
          <div class="cfg-row"><span class="cfg-label">systemフォルダ</span><span class="cfg-value" id="cfg-sys-status" style="color:#ef4444;">🔒 アクセス制限中</span></div>
          <div class="cfg-security-block">
            <div class="cfg-sec-desc">管理者コードを入力してsystemフォルダのロックを解除します。<br>コードはシステム内のファイルに隠されています。</div>
            <div class="cfg-field-row">
              <input class="cfg-code-input" id="cfg-code" placeholder="認証コードを入力…" type="text" />
              <button class="cfg-code-btn" id="cfg-code-btn">解錠</button>
            </div>
            <div class="cfg-code-err hidden" id="cfg-code-err">コードが正しくありません。</div>
            <div class="cfg-code-ok hidden" id="cfg-code-ok">✓ 解錠しました</div>
          </div>
          <div class="cfg-section-title">セキュリティログ</div>
          <div class="cfg-log-entry">✗ 不正アクセス試行 — 3日前</div>
          <div class="cfg-log-entry">✗ パスワード認証失敗 (×3) — 3日前</div>
          <div class="cfg-log-entry">✓ セッション開始 — 現在</div>
        </div>`,
      system: () => `
        <div class="cfg-page">
          <div class="cfg-section-title">システム情報</div>
          <div class="cfg-row"><span class="cfg-label">OS</span><span class="cfg-value">Project LD OS Ver.2.1</span></div>
          <div class="cfg-row"><span class="cfg-label">コンピューター名</span><span class="cfg-value">SUBJECT-X-UNIT</span></div>
          <div class="cfg-row"><span class="cfg-label">観測ノード</span><span class="cfg-value">01</span></div>
          <div class="cfg-section-title">バックアップと復元</div>
          <div class="cfg-security-block">
            <div class="cfg-sec-desc">以前のバックアップからシステムを復元します。<br>復元日付を入力してください（YYYY-MM-DD形式）。</div>
            <div class="cfg-field-row">
              <input class="cfg-code-input" id="cfg-restore-date" placeholder="例: 20XX-10-23" type="text" />
              <button class="cfg-code-btn" id="cfg-restore-btn">復元</button>
            </div>
            <div class="cfg-code-err hidden" id="cfg-restore-err">指定された日付のバックアップが見つかりません。</div>
            <div class="cfg-code-ok hidden" id="cfg-restore-ok">バックアップを復元しています...</div>
          </div>
        </div>`,
      advanced: () => `
        <div class="cfg-page">
          <div class="cfg-section-title">詳細設定</div>
          <div class="cfg-row"><span class="cfg-label">アクセシビリティ</span>
            <label class="cfg-toggle-wrap"><input type="checkbox" id="cfg-hc" /> <span class="cfg-toggle-label">ハイコントラストモード</span></label></div>
          <div class="cfg-row"><span class="cfg-label">開発者モード</span>
            <label class="cfg-toggle-wrap"><input type="checkbox" id="cfg-dev" /> <span class="cfg-toggle-label">有効にする</span></label></div>
          <div class="cfg-section-title">システムリセット</div>
          <div class="cfg-security-block">
            <div class="cfg-sec-desc" style="color:#ef4444;">⚠️ この操作は取り消せません。<br>セッションデータが記録され、システムが終了します。</div>
            <button class="cfg-code-btn" id="cfg-reset-btn" style="background:#ef4444;color:white;margin-top:8px;">システムをリセットする</button>
          </div>
        </div>`
    };
    function showPage(tab) {
      win.querySelectorAll('.cfg-item').forEach(i => i.classList.toggle('cfg-active', i.dataset.tab === tab));
      win.querySelector('#cfg-main').innerHTML = pages[tab]();
      if (tab === 'general') {
        win.querySelector('#cfg-theme').addEventListener('change', e => {
          const v = e.target.value;
          document.body.classList.remove('theme-dark','theme-mono');
          if (v === 'dark') document.body.classList.add('theme-dark');
          if (v === 'mono') {
            document.body.classList.add('theme-mono');
            setTimeout(() => window.LD.Effects.showTypewriter('モノクロにすると\n見えるものがある。\n\n隠れた文字を\n探してみろ。'), 800);
          }
          window.LD.Assessment && window.LD.Assessment.update('openness', 5);
        });
      }
      if (tab === 'security') {
        if (window.LD.Logger.getLog().systemUnlocked) {
          const el = win.querySelector('#cfg-sys-status');
          if (el) { el.textContent = '🔓 解錠済み'; el.style.color = '#22c55e'; }
        }
        function doUnlock() {
          const code = win.querySelector('#cfg-code').value.trim().toLowerCase();
          let unlockType = null;
          if (code === '3key5' || (code.includes('3') && code.includes('key') && code.includes('5'))) unlockType = 'composite';
          else if (code === 'wake')   unlockType = 'linguistic';
          else if (code === '3455')   unlockType = 'math';
          else if (code === 'a5acfd') unlockType = 'visual';
          window.LD.Logger.logPasswordAttempt(code, !!unlockType);
          if (unlockType) {
            win.querySelector('#cfg-code-err').classList.add('hidden');
            win.querySelector('#cfg-code-ok').classList.remove('hidden');
            const st = win.querySelector('#cfg-sys-status');
            if (st) { st.textContent = '🔓 解錠済み'; st.style.color = '#22c55e'; }
            window.LD.Logger.logUnlock(unlockType);
            window.LD.Effects.triggerGlitch(300);
            setTimeout(() => openHiddenFolder(unlockType), 1000);
          } else {
            win.querySelector('#cfg-code-err').classList.remove('hidden');
            window.LD.Effects && window.LD.Effects.checkThresholds(window.LD.Logger.getLog());
          }
        }
        win.querySelector('#cfg-code-btn').addEventListener('click', doUnlock);
        win.querySelector('#cfg-code').addEventListener('keydown', e => { if (e.key === 'Enter') doUnlock(); });
      }
      if (tab === 'system') {
        win.querySelector('#cfg-restore-btn').addEventListener('click', () => {
          const d = win.querySelector('#cfg-restore-date').value.trim();
          const valid = d.includes('1023') || d.endsWith('-10-23') || d === '20XX-10-23';
          if (valid) {
            win.querySelector('#cfg-restore-err').classList.add('hidden');
            win.querySelector('#cfg-restore-ok').classList.remove('hidden');
            window.LD.Assessment && window.LD.Assessment.update('conscientiousness', 15);
            document.dispatchEvent(new CustomEvent('ld:goal-reached', { detail: { goal: 'system-restore' } }));
            window.LD.Effects.triggerGlitch(500);
            setTimeout(() => window.LD.Effects.showTypewriter('バックアップを\n復元中…\n\n記録が\n書き換えられる。'), 800);
          } else {
            win.querySelector('#cfg-restore-err').classList.remove('hidden');
          }
        });
      }
      if (tab === 'advanced') {
        win.querySelector('#cfg-hc').addEventListener('change', e => {
          document.body.classList.toggle('hc-mode', e.target.checked);
          if (e.target.checked) {
            window.LD.Assessment && window.LD.Assessment.update('openness', 8);
            window.LD.Effects.showTypewriter('ハイコントラスト有効\n\n隠された文字が\n見える。');
          }
        });
        win.querySelector('#cfg-dev').addEventListener('change', e => {
          if (e.target.checked) {
            window.LD.Assessment && window.LD.Assessment.update('openness', 10);
            window.LD.Effects.showTypewriter('開発者モード有効\n\nコンソールに\n追加情報が出力される。');
            console.log('%c[DEV MODE] セッション生データ:', 'color:#22c55e;font-weight:bold', window.LD.Logger.getLog());
          }
        });
        win.querySelector('#cfg-reset-btn').addEventListener('click', () => {
          if (confirm('本当にシステムをリセットしますか？\nこの操作は取り消せません。')) triggerShutdown();
        });
      }
    }
    win.querySelectorAll('.cfg-item').forEach(item => item.addEventListener('click', () => showPage(item.dataset.tab)));
    showPage('general');
  }

  // =====================================================
  // シャットダウン（実験を拒否するゴール）
  // =====================================================
  function triggerShutdown() {
    window.LD.Logger.logShutdown && window.LD.Logger.logShutdown();
    document.dispatchEvent(new CustomEvent('ld:goal-reached', { detail: { goal: 'shutdown' } }));

    const overlay = document.createElement('div');
    overlay.id = 'shutdown-overlay';
    overlay.innerHTML = `
      <div id="shutdown-inner">
        <div id="shutdown-icon">⏻</div>
        <div id="shutdown-msg">セッションを終了しています…</div>
        <div id="shutdown-sub"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    const sub = overlay.querySelector('#shutdown-sub');
    const msgs = [
      { t: 1200, m: '記録を保存しています…' },
      { t: 2400, m: 'セッションデータを転送中…' },
      { t: 3600, m: '実験は継続されます。' },
      { t: 4800, m: '次の被験者が選定されました。' },
    ];
    msgs.forEach(({ t, m }) => setTimeout(() => { sub.textContent = m; }, t));

    setTimeout(() => {
      window.LD.Feedback.show(window.LD.Logger.getLog(), false, 'shutdown');
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 1000);
    }, 6000);
  }

  // =====================================================
  // メモ帳（自由入力）
  // =====================================================
  function openMemo() {
    window.LD.Logger.logFileOpen('memo', 'メモ帳.txt');
    const html = `<textarea id="memo-ta" spellcheck="false"></textarea>`;
    const win  = createWindow('memo', 'メモ帳.txt', html, { width: 340, height: 420, x: 160, y: 80 });
    if (!win) return;
    const ta = win.querySelector('#memo-ta');
    ta.value = memoContent;
    ta.addEventListener('input', () => { memoContent = ta.value; });
    setTimeout(() => ta.focus(), 40);
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // =====================================================
  // systemフォルダ（アクセス拒否演出）
  // =====================================================
  function openSystemFolder() {
    const logData = window.LD.Logger.getLog();
    if (logData.systemUnlocked) {
      openHiddenFolder(logData.unlockType || 'composite');
      return;
    }
    window.LD.Effects.triggerGlitch(300);
    window.LD.Logger.logFileOpen('system-folder', 'system');
    const html = `<div style="padding:24px 20px;text-align:center;font-family:monospace;">
      <div style="font-size:32px;margin-bottom:12px;">🔒</div>
      <div style="font-size:13px;color:#cc4444;font-weight:bold;margin-bottom:10px;">アクセスが拒否されました</div>
      <div style="font-size:11px;color:#888;line-height:1.9;margin-bottom:16px;">
        [Error 0x80070005]<br>
        このフォルダへのアクセス権がありません。<br>
        認証コードが必要です。
      </div>
      <div style="font-size:10px;color:#555;border-top:1px solid #333;padding-top:12px;">
        ヒント: TERMINAL.exe から <span style="color:#6cf;">unlock</span> コマンドを試してください
      </div>
    </div>`;
    createWindow('sys-access-err-' + Date.now(), 'アクセスエラー', html, { width: 320, height: 210, x: 220, y: 160 });
  }

  // =====================================================
  // 端末エミュレーター（TERMINAL.exe）
  // =====================================================
  function openTerminal() {
    window.LD.Logger.logFileOpen('terminal', 'TERMINAL.exe');

    if (document.getElementById('win-terminal')) {
      focusWindow('terminal');
      return;
    }

    const sessionId = Math.random().toString(36).slice(2, 10).toUpperCase();

    const html = `<div class="term-wrap">
      <div class="term-header">LIFE DECIPHER — TERMINAL v1.0 &nbsp;|&nbsp; SESSION: ${sessionId} &nbsp;|&nbsp; <span style="color:#4ade80;">● REC</span></div>
      <div class="term-output" id="term-output"></div>
      <div class="term-input-row">
        <span class="term-prompt">$ </span>
        <input type="text" class="term-input" id="term-input" autocomplete="off" spellcheck="false" placeholder="コマンドを入力 (help で一覧)" />
      </div>
    </div>`;

    const win = createWindow('terminal', 'TERMINAL.exe', html, { width: 560, height: 380, x: 80, y: 60 });
    if (!win) return;

    const output = win.querySelector('#term-output');
    const input  = win.querySelector('#term-input');
    const history = [];
    let histIdx = -1;

    function print(text, cls) {
      const line = document.createElement('div');
      line.className = 'term-line' + (cls ? ' ' + cls : '');
      line.textContent = text;
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    }

    function printSep() {
      const line = document.createElement('div');
      line.className = 'term-sep';
      output.appendChild(line);
    }

    function cmdHelp() {
      output.innerHTML = '';
      const hdr = document.createElement('div');
      hdr.className = 'term-line term-section';
      hdr.textContent = '═══ TERMINAL コマンドヘルプ ═══';
      output.appendChild(hdr);
      print('');
      print('■ 基本コマンド', 'term-info');
      print('  ls              ファイル一覧を表示');
      print('  whoami          ユーザー情報を表示');
      print('  status          システムステータス確認');
      print('  history         コマンド履歴を表示');
      print('  clear           画面をクリア');
      print('');
      print('■ アクセス制御', 'term-info');
      print('  unlock [code]   認証コードで system を解錠');
      print('                  例: unlock XXXXXX');
      print('');
      print('■ ヒントシステム', 'term-info');
      print('  hint 1          軽いヒントを表示');
      print('  hint 2          より詳しいヒントを表示');
      print('  hint 3          全ルートのコードを開示');
      print('');
      print('  [!] 先に自力で試すことを推奨します。', 'term-warn');
      printSep();
    }

    function cmdHint(level) {
      const n = parseInt(level, 10);
      if (!n || n < 1 || n > 3) {
        print('使用法: hint [1|2|3]', 'term-err');
        return;
      }
      printSep();
      if (n === 1) {
        print('ドキュメントフォルダを調べたか？', 'term-warn');
        print('  Xは几帳面にメモを残す習慣があった。');
      } else if (n === 2) {
        print('ゴミ箱には捨てられた記録がある。', 'term-warn');
        print('  削除されたものは本当に消えているのか？');
      } else {
        print('日記を時系列で読んだか？', 'term-warn');
        print('  順番に読むと、見えないものが見える。');
      }
      printSep();
      window.LD.Assessment && window.LD.Assessment.update('openness', 2);
    }

    function cmdLs() {
      printSep();
      print('C:\\Users\\subject_x\\Desktop', 'term-path');
      print('');
      const files = [
        { name: '日記.txt',       size: '11.2 KB', attr: 'A' },
        { name: 'ボイスメモ\\',    size: '<DIR>',   attr: 'D' },
        { name: 'InternetX.exe',  size: '1.4 MB',  attr: 'A' },
        { name: 'メモ帳.txt',      size: '0.8 KB',  attr: 'A' },
        { name: 'ゴミ箱\\',        size: '<DIR>',   attr: 'D' },
        { name: 'TERMINAL.exe',   size: '896 KB',  attr: 'A' },
        { name: 'system\\',       size: '<DIR>',   attr: 'S', locked: true },
      ];
      files.forEach(f => {
        const line = document.createElement('div');
        line.className = 'term-line';
        if (f.locked) {
          line.innerHTML = `  <span style="color:#888;">[${f.attr}]</span>  <span style="color:#f87171;">${f.name.padEnd(20)}</span>  <span style="color:#888;">${f.size.padStart(8)}  [アクセス制限]</span>`;
        } else {
          line.innerHTML = `  <span style="color:#888;">[${f.attr}]</span>  <span style="color:#e2e8f0;">${f.name.padEnd(20)}</span>  <span style="color:#888;">${f.size.padStart(8)}</span>`;
        }
        output.appendChild(line);
      });
      print('');
      print('  8 個のファイル', 'term-muted');
      printSep();
      output.scrollTop = output.scrollHeight;
    }

    function cmdWhoami() {
      printSep();
      print('ユーザー情報:', 'term-info');
      print('  ユーザー名   : [記録中]');
      print('  権限レベル   : OBSERVER');
      print('  セッション   : ACTIVE');
      print('  記録状態     : ■ RECORDING');
      print('');
      print('  注記: このセッションはリアルタイムで監視されています。', 'term-warn');
      printSep();
    }

    function cmdStatus() {
      const logData = window.LD.Logger.getLog();
      const elapsed = Math.floor(logData.elapsedMs / 1000);
      const min = Math.floor(elapsed / 60);
      const sec = elapsed % 60;
      printSep();
      print('システムステータス:', 'term-info');
      print(`  セッション経過    : ${min}分 ${sec}秒`);
      print(`  解析ファイル数    : ${logData.totalFilesOpened.size}`);
      print(`  システムフォルダ  : ${logData.systemUnlocked ? '🔓 解錠済み' : '🔒 アクセス制限中'}`);
      print(`  記録エントリ数    : ${logData.clicks.length}`);
      printSep();
    }

    function cmdUnlock(code) {
      if (!code) {
        print('使用法: unlock [認証コード]', 'term-warn');
        return;
      }
      const k = code.toLowerCase().trim();
      let unlockType = null;

      if ((k.includes('3') && k.includes('key') && k.includes('5')) || k === '3key5') unlockType = 'composite';
      else if (k === 'wake') unlockType = 'linguistic';
      else if (k === '3455') unlockType = 'math';
      else if (k === 'a5acfd') unlockType = 'visual';

      window.LD.Logger.logPasswordAttempt(code, !!unlockType);

      if (unlockType) {
        print('');
        print('認証コードを照合中...', 'term-info');
        const bar = document.createElement('div');
        bar.className = 'term-line term-progress';
        bar.textContent = '[                    ] 0%';
        output.appendChild(bar);
        output.scrollTop = output.scrollHeight;

        let pct = 0;
        const iv = setInterval(() => {
          pct += 5;
          const filled = Math.floor(pct / 5);
          bar.textContent = '[' + '█'.repeat(filled) + ' '.repeat(20 - filled) + '] ' + pct + '%';
          if (pct >= 100) {
            clearInterval(iv);
            print('');
            print('認証成功 — アクセスが許可されました。', 'term-ok');
            print('解錠ルート: ' + unlockType.toUpperCase(), 'term-ok');
            printSep();
            window.LD.Logger.logUnlock(unlockType);
            window.LD.Effects.triggerGlitch(300);
            setTimeout(() => openHiddenFolder(unlockType), 1200);
          }
        }, 80);
      } else {
        print('');
        print('エラー: 認証コードが無効です。', 'term-err');
        print('[Error 0x80004005] ACCESS DENIED', 'term-err');
        print('');
        window.LD.Effects && window.LD.Effects.checkThresholds(window.LD.Logger.getLog());
      }
    }

    function showHistory() {
      printSep();
      if (history.length === 0) {
        print('コマンド履歴はありません。', 'term-muted');
      } else {
        history.forEach((c, i) => print('  ' + String(i + 1).padStart(3) + '  ' + c));
      }
      printSep();
    }

    function processCommand(raw) {
      const trimmed = raw.trim();
      if (!trimmed) return;
      history.push(trimmed);
      histIdx = -1;

      window.LD.Logger.logTerminalCommand && window.LD.Logger.logTerminalCommand(trimmed);

      const echo = document.createElement('div');
      echo.className = 'term-line term-echo';
      echo.textContent = '$ ' + trimmed;
      output.appendChild(echo);

      const parts = trimmed.split(/\s+/);
      const verb  = parts[0].toLowerCase();
      const args  = parts.slice(1);

      switch (verb) {
        case 'help':    cmdHelp(); break;
        case 'ls':      cmdLs(); break;
        case 'whoami':  cmdWhoami(); break;
        case 'status':  cmdStatus(); break;
        case 'unlock':  cmdUnlock(args[0]); break;
        case 'hint':    cmdHint(args[0]); break;
        case 'history': showHistory(); break;
        case 'clear':   output.innerHTML = ''; break;
        default:
          print(`'${verb}' は内部コマンドまたは外部コマンドとして認識されません。`, 'term-err');
          print('「help」でコマンド一覧を表示します。', 'term-muted');
      }
      output.scrollTop = output.scrollHeight;
    }

    // 初期メッセージ
    printSep();
    print('LIFE DECIPHER OS — Shell v1.0', 'term-info');
    print('Copyright (c) Project LD. All rights reserved.');
    print('');
    print('このセッションの記録が開始されています。', 'term-warn');
    print('「help」でコマンド一覧を表示します。');
    printSep();

    // 自動解錠通知
    document.addEventListener('ld:terminal-notify', (e) => {
      print('');
      print('[システム通知] ' + e.detail.message, 'term-ok');
      print('');
      output.scrollTop = output.scrollHeight;
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = input.value;
        input.value = '';
        processCommand(val);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (histIdx < history.length - 1) histIdx++;
        input.value = history[history.length - 1 - histIdx] || '';
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (histIdx > 0) { histIdx--; input.value = history[history.length - 1 - histIdx] || ''; }
        else { histIdx = -1; input.value = ''; }
      }
    });

    setTimeout(() => input.focus(), 100);
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
      { label: 'シャットダウン(S)', action: () => {
          if (confirm('セッションを終了しますか？\n記録はすべて保存されます。')) {
            triggerShutdown();
          }
        }
      },
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
  // =====================================================
  // Resonance — マッチングアプリ
  // =====================================================
  function openResonanceApp() {
    window.LD.Logger.logFileOpen('resonance-app', 'Resonance');
    window.LD.Assessment && window.LD.Assessment.update('info_seeking', 5);

    if (document.getElementById('win-resonance-app')) { focusWindow('resonance-app'); return; }

    // イニシャルアバター生成
    function makeAvatar(initials, hue) {
      const el = document.createElement('div');
      el.className = 'rs-avatar-circle';
      el.style.background = `linear-gradient(135deg, hsl(${hue},60%,40%), hsl(${hue+30},55%,55%))`;
      el.textContent = initials;
      return el;
    }
    function avatarHtml(initials, hue, size) {
      const cls = size === 'sm' ? 'rs-avatar-sm' : 'rs-avatar-circle';
      return `<div class="${cls}" style="background:linear-gradient(135deg,hsl(${hue},60%,40%),hsl(${hue+30},55%,55%))">${initials}</div>`;
    }

    const PROFILES = [
      {
        id: 'p_watcher', name: '観察者_0', age: '—', initials: '??', hue: 220,
        tags: ['静観', '分析', '記録'],
        bio: '見ている。いつも。あなたのことも。',
        detail: '長い沈黙の後でだけ話す。\n問われたことには必ず答えるが、\n問い返すことはない。',
        matched: true, matchScore: { info_seeking: 10, integration: 8 }
      },
      {
        id: 'p_math', name: 'アキラ', age: '28', initials: 'AK', hue: 210,
        tags: ['論理的', '慎重', '好奇心旺盛'],
        bio: '問題を見たとき、まずパターンを探す。規則性があれば美しいと思う。',
        detail: '物事を順序立てて考えるのが好き。\n「なぜ」を追いかけていくうちに\n気づくと深くはまっている。',
        matched: false, matchScore: { math: 12, conscientiousness: 5 }
      },
      {
        id: 'p_linguistic', name: 'コトネ', age: '25', initials: 'KT', hue: 140,
        tags: ['細やか', '言葉好き', '観察眼'],
        bio: '文章を読むとき、意味より「構造」が気になる。行間に何かがある気がして。',
        detail: '声に出さないことの方が多い。\nでも書かれた言葉には敏感で、\nちょっとした言い回しの違いが気になる。',
        matched: false, matchScore: { linguistic: 12, openness: 5 }
      },
      {
        id: 'p_visual', name: 'ハルカ', age: '27', initials: 'HR', hue: 320,
        tags: ['感覚的', '審美眼', '直感'],
        bio: '色を見たとき、名前より「数値」が浮かぶ。視覚的な情報の方が言葉より早く入ってくる。',
        detail: 'デザインを見ると細部が気になる。\n全体の印象より、端のピクセルや\n微妙な色ずれに目がいく。',
        matched: false, matchScore: { spatial: 12, openness: 5 }
      },
      {
        id: 'p_chaos', name: 'レン', age: '23', initials: 'RN', hue: 25,
        tags: ['即興', '自由', '衝動的'],
        bio: 'ルールは後から考える。計画通りに動けたためしがない。',
        detail: '飽きるのも早いが熱中するのも早い。\n整合性より「今この瞬間」の方が大事。\nバグのある世界の方が面白い。',
        matched: false, matchScore: { chaos: 10, immersion: 5 }
      },
      {
        id: 'p_systematic', name: 'ソウ', age: '31', initials: 'SO', hue: 170,
        tags: ['几帳面', '計画的', '徹底的'],
        bio: '全体を把握してから動く。途中で手順を飛ばすのが苦手。',
        detail: '何かを始める前に必ずリストを作る。\n順序が崩れると不安になる。\n古い記録も全部取ってある。',
        matched: false, matchScore: { conscientiousness: 12, integration: 5 }
      },
      {
        id: 'p_detective', name: 'サラ', age: '29', initials: 'SR', hue: 45,
        tags: ['探究心', '執着', '情報感度'],
        bio: '捨てられた情報ほど面白い。「もう不要なもの」に本質が残ることがある。',
        detail: '見落としが気になって何度も確認する。\n一度引っかかったことは\n解決するまで頭から離れない。',
        matched: false, matchScore: { info_seeking: 12, openness: 8 }
      },
      {
        id: 'p_x', name: 'X', age: '—', initials: 'X', hue: 270,
        tags: ['観察', '実験', '記録'],
        bio: 'これは実験だ。あなたもその一部だ。',
        detail: '職業: 不明\n趣味: 不明\n\n「このプロフィールを見ているあなたは、\nすでに記録されている」',
        matched: false, matchScore: { chaos: 5, immersion: 15, openness: 5 }
      }
    ];

    const QUIZ = [
      {
        q: '問題が目の前にあるとき、最初にすることは？',
        opts: [
          { label: 'まず全体像を把握して、計画を立てる', axes: { conscientiousness: 8, integration: 3 } },
          { label: 'とりあえず動いてみる。考えるのは後', axes: { chaos: 8, openness: 3 } },
          { label: '誰かに聞くか、情報を集めてから動く', axes: { info_seeking: 8, linguistic: 3 } },
          { label: '問題を小さく分解して、一つずつ解く', axes: { math: 8, conscientiousness: 4 } }
        ]
      },
      {
        q: '何かを「理解した」と感じるのはどんなとき？',
        opts: [
          { label: '言葉で説明できるようになったとき', axes: { linguistic: 10, integration: 3 } },
          { label: '全体のパターンや構造が見えたとき', axes: { integration: 10, spatial: 3 } },
          { label: '自分なりのルールや数式に落とし込めたとき', axes: { math: 9, conscientiousness: 3 } },
          { label: '体が動いていた。直感で「わかった」とき', axes: { chaos: 6, openness: 5 } }
        ]
      },
      {
        q: '情報が多すぎるとき、どうする？',
        opts: [
          { label: '優先度をつけて整理してから判断する', axes: { integration: 10, conscientiousness: 5 } },
          { label: '全部読んでから、頭の中でまとめる', axes: { conscientiousness: 8, info_seeking: 4 } },
          { label: '重要そうなものだけ選んで深く読む', axes: { info_seeking: 6, openness: 4 } },
          { label: 'とりあえず全部保存。後で見ればいい', axes: { immersion: 6, chaos: 4 } }
        ]
      },
      {
        q: '新しい場所や環境に入ったとき、最初にすることは？',
        opts: [
          { label: 'まわりをよく観察して、ルールを把握する', axes: { conscientiousness: 8, info_seeking: 5 } },
          { label: '気になったものに近づいてみる', axes: { openness: 8, spatial: 4 } },
          { label: '人と話して、何が大事か聞いてみる', axes: { linguistic: 8, info_seeking: 5 } },
          { label: '雰囲気に慣れるまで、とりあえず様子を見る', axes: { immersion: 6, chaos: 3 } }
        ]
      },
      {
        q: '謎や秘密を見つけたとき、どう感じる？',
        opts: [
          { label: '解かないと気が済まない。とことん調べる', axes: { info_seeking: 10, immersion: 5 } },
          { label: '面白そうなら追う。興味がなければ放置', axes: { openness: 7, chaos: 5 } },
          { label: '周囲の反応を見て、必要なら動く', axes: { integration: 7, conscientiousness: 4 } },
          { label: '見つけたことが嬉しい。解けなくても満足', axes: { immersion: 7, spatial: 4 } }
        ]
      }
    ];

    const likedProfiles  = [];
    const passedProfiles = [];

    const html = `
      <div class="rs-wrap">
        <div class="rs-header">
          <span class="rs-logo">💜</span>
          <span class="rs-title">Resonance</span>
          <span class="rs-tagline">共鳴する誰かを探して</span>
        </div>
        <div class="rs-tabs">
          <div class="rs-tab rs-tab-active" data-tab="discover">おすすめ</div>
          <div class="rs-tab" data-tab="matches">マッチ <span class="rs-notif-dot">●</span></div>
          <div class="rs-tab" data-tab="quiz">診断</div>
          <div class="rs-tab" data-tab="profile">プロフィール</div>
        </div>
        <div class="rs-body" id="rs-body"></div>
      </div>
    `;

    const win = createWindow('resonance-app', 'Resonance', html, { width: 420, height: 560, x: 180, y: 40 });
    if (!win) return;

    let quizStep = 0;
    const quizAnswers = [];

    function showTab(tab) {
      win.querySelectorAll('.rs-tab').forEach(t => t.classList.toggle('rs-tab-active', t.dataset.tab === tab));
      const body = win.querySelector('#rs-body');
      if      (tab === 'discover') renderDiscover(body);
      else if (tab === 'matches')  renderMatches(body);
      else if (tab === 'quiz')     renderQuiz(body);
      else if (tab === 'profile')  renderProfileTab(body);
    }

    function renderDiscover(body) {
      const remaining = PROFILES.filter(p => !p.matched && !likedProfiles.includes(p.id) && !passedProfiles.includes(p.id));
      if (remaining.length === 0) {
        body.innerHTML = `<div class="rs-done"><div class="rs-done-icon">💜</div><div class="rs-done-text">全員のプロフィールを確認しました</div><div class="rs-done-sub">マッチタブでマッチした相手を確認できます</div></div>`;
        return;
      }
      const p = remaining[0];
      body.innerHTML = `
        <div class="rs-card-area">
          <div class="rs-card" id="rs-card">
            ${avatarHtml(p.initials, p.hue, 'lg')}
            <div class="rs-card-name">${escapeHtml(p.name)}${p.age !== '—' ? `<span class="rs-card-age"> ${p.age}</span>` : ''}</div>
            <div class="rs-card-tags">${p.tags.map(t => `<span class="rs-tag">${escapeHtml(t)}</span>`).join('')}</div>
            <div class="rs-card-bio">${escapeHtml(p.bio)}</div>
            <div class="rs-card-detail">${escapeHtml(p.detail).replace(/\n/g,'<br>')}</div>
          </div>
          <div class="rs-card-counter">${PROFILES.indexOf(p) + 1} / ${PROFILES.length}</div>
          <div class="rs-actions">
            <button class="rs-pass-btn" id="rs-pass">✕ パス</button>
            <button class="rs-like-btn" id="rs-like">💜 いいね</button>
          </div>
        </div>
      `;
      win.querySelector('#rs-pass').addEventListener('click', () => {
        passedProfiles.push(p.id);
        window.LD.Assessment && window.LD.Assessment.update('chaos', 2);
        animateCard(body, 'pass', () => renderDiscover(body));
      });
      win.querySelector('#rs-like').addEventListener('click', () => {
        likedProfiles.push(p.id);
        if (p.matchScore) {
          Object.entries(p.matchScore).forEach(([axis, delta]) => {
            window.LD.Assessment && window.LD.Assessment.update(axis, delta);
          });
        }
        const doMatch = p.id === 'p_watcher' || Math.random() > 0.3;
        if (doMatch) { p.matched = true; showMatchFlash(p, body); }
        else { animateCard(body, 'like', () => renderDiscover(body)); }
      });
    }

    function animateCard(body, type, cb) {
      const card = body.querySelector('#rs-card');
      if (!card) { cb(); return; }
      card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
      card.style.transform  = type === 'like' ? 'translateX(120px) rotate(15deg)' : 'translateX(-120px) rotate(-15deg)';
      card.style.opacity    = '0';
      setTimeout(cb, 320);
    }

    function showMatchFlash(p, body) {
      body.innerHTML = `
        <div class="rs-match-flash">
          <div class="rs-match-hearts">💜 💜 💜</div>
          <div class="rs-match-title">マッチしました！</div>
          ${avatarHtml(p.initials, p.hue, 'lg')}
          <div class="rs-match-name">${escapeHtml(p.name)} とマッチ！</div>
          <div class="rs-match-actions">
            <button class="rs-msg-btn" id="rs-send-msg">メッセージを送る</button>
            <button class="rs-continue-btn" id="rs-continue">次を見る</button>
          </div>
        </div>
      `;
      win.querySelector('#rs-send-msg').addEventListener('click', () => showTab('matches'));
      win.querySelector('#rs-continue').addEventListener('click', () => renderDiscover(body));
      document.dispatchEvent(new CustomEvent('ld:goal-reached', { detail: { goal: 'resonance-match', profile: p.id } }));
    }

    function renderMatches(body) {
      const watcher    = PROFILES.find(p => p.id === 'p_watcher');
      const allMatched = [watcher, ...PROFILES.filter(p => p.id !== 'p_watcher' && p.matched)];

      function renderList() {
        body.innerHTML = `
          <div class="rs-match-list">
            ${allMatched.map(p => `
              <div class="rs-match-item" data-id="${p.id}">
                ${avatarHtml(p.initials, p.hue, 'sm')}
                <div class="rs-match-info">
                  <div class="rs-match-item-name">${escapeHtml(p.name)}</div>
                  <div class="rs-match-preview">${p.id === 'p_watcher' ? '「まだいますか？」' : 'マッチしました！'}</div>
                </div>
                ${p.id === 'p_watcher' ? '<div class="rs-match-unread">1</div>' : ''}
              </div>
            `).join('')}
          </div>
        `;
        body.querySelectorAll('.rs-match-item').forEach(item => {
          item.addEventListener('click', () => {
            renderChat(allMatched.find(p => p.id === item.dataset.id));
          });
        });
      }

      function renderChat(p) {
        const log      = window.LD.Logger.getLog();
        const messages = (log.resonanceMessages || {})[p.id] || [];

        function getReply(msg) {
          const m = msg.toLowerCase();
          const pick = arr => arr[Math.floor(Math.random() * arr.length)];
          if (p.id === 'p_watcher') {
            if (m.includes('誰') || m.includes('who') || m.includes('あなた'))
              return pick(['それは言えません。でも——あなたのことは知っています。', 'なぜそれを聞きますか？', '重要な質問ですね。でも答える立場にありません。']);
            if (m.includes('x') || m.includes('被験者') || m.includes('実験'))
              return 'Xはもういません。でも記録は残っています。日記を最初から読みましたか？';
            if (m.includes('こんにちは') || m.includes('hello') || m.includes('はじめ'))
              return pick(['はじめまして。ではないですよ。ずっと見ていました。', 'こちらこそ。もっと早く話しかけてくれると思っていました。']);
            if (m.includes('日記') || m.includes('diary'))
              return '日記は必ず「古い順」から読むべきです。順番に意味があります。';
            if (m.includes('パスワード') || m.includes('コード') || m.includes('鍵'))
              return '直接聞くのですか。面白いアプローチです。でも教えません。';
            if (m.includes('なぜ') || m.includes('why') || m.includes('どうして'))
              return pick(['それが実験の本質です。', 'なぜ、だと思いますか？', '答えを知りたいなら、探してください。']);
            if (m.length > 40) return 'たくさん話してくれましたね。長く考えてから打ち込む人です。';
            return pick(['あなたの選択は、すでに記録されました。', '続けてください。聞いています。', '...', 'なるほど。']);
          }
          if (p.id === 'p_math') {
            if (m.includes('数') || m.includes('計算') || m.includes('数列'))
              return '数字って美しいですよね。規則性を見つけたときの感覚、わかりますか？';
            if (m.includes('パターン') || m.includes('規則') || m.includes('法則'))
              return 'そういう人、好きです。表面より構造を見る人。';
            if (m.includes('好き') || m.includes('興味') || m.includes('面白'))
              return '自然の中にある数学的なパターンが一番好きです。ランダムに見えて、実は規則的なもの。';
            return pick(['論理的に話せる人はいいですね。', 'なるほど、なるほど。', 'それについてもっと聞かせてください。']);
          }
          if (p.id === 'p_linguistic') {
            if (m.includes('言葉') || m.includes('文章') || m.includes('詩') || m.includes('読'))
              return '言葉の構造って面白いですよね。表面の意味より「なぜこの順番なのか」が気になる。';
            if (m.includes('日記') || m.includes('メモ') || m.includes('書く'))
              return '書かれたものには、書いた人の無意識が出ます。どんな文字から始まるか、とか。';
            if (m.includes('隠') || m.includes('秘密') || m.includes('仕掛'))
              return '隠すより、「見えにくい場所に置く」方が面白いと思っています。';
            return pick(['その言い方、好きです。', 'なるほど。', 'もう少し詳しく聞かせてほしいです。']);
          }
          if (p.id === 'p_visual') {
            if (m.includes('色') || m.includes('デザイン') || m.includes('カラー') || m.includes('ビジュアル'))
              return '色の数値が好きで。16進数の6桁って、無限の可能性がある感じがしませんか？';
            if (m.includes('きれい') || m.includes('美し') || m.includes('見た目') || m.includes('センス'))
              return '美しさって、細部に宿ると思うんです。端のピクセル1つが全体を変える。';
            if (m.includes('付箋') || m.includes('ノート') || m.includes('ステッカー'))
              return '付箋の色を揃えるのが好きです。赤・緑・青って、ちょうど光の三原色で。';
            return pick(['センスのある人ですね。', 'なるほど。', 'それ、どういう意味合いで使いましたか？']);
          }
          if (p.id === 'p_chaos') {
            if (m.includes('計画') || m.includes('順番') || m.includes('手順'))
              return '計画通りに動けたことが一度もない。でもなんとかなってる（笑）';
            if (m.includes('ルール') || m.includes('規則') || m.includes('決まり'))
              return 'ルールって後付けじゃないですか。最初に動いた人が作るものだと思う。';
            return pick(['おもしろい！', '全然想定してなかった返し。好き。', 'そういう考え方もあるか。']);
          }
          if (p.id === 'p_systematic') {
            if (m.includes('整理') || m.includes('リスト') || m.includes('順'))
              return 'リストは正義です。とにかく全部書き出すと頭がすっきりする。';
            if (m.includes('手順') || m.includes('方法') || m.includes('やり方'))
              return '物事には「正しい順番」があります。焦って飛ばすと後で詰まる。';
            if (m.includes('記録') || m.includes('メモ') || m.includes('ノート'))
              return '記録は古い順から振り返るのが基本です。最初の状態を知らないと変化がわからない。';
            return pick(['そうですね。', '整合性がありますね。', '一歩一歩が大事です。']);
          }
          if (p.id === 'p_detective') {
            if (m.includes('探') || m.includes('調べ') || m.includes('見つけ'))
              return '探すのが好きです。特に、誰も気にしていないところにあるものが。';
            if (m.includes('ゴミ') || m.includes('削除') || m.includes('捨て'))
              return '捨てられたものほど、本質が残っている気がします。いらなくなったから捨てる、つまり最初は必要だった。';
            if (m.includes('隠') || m.includes('秘密') || m.includes('謎'))
              return '謎って、解ける謎と解けない謎があります。解けない謎は、まだ情報が足りていないだけ。';
            return pick(['面白い視点ですね。', 'なるほど、なるほど。', '続けてください。']);
          }
          return 'こちらこそよろしく。';
        }

        body.innerHTML = `
          <div class="rs-chat-wrap">
            <div class="rs-chat-header">
              <button class="rs-chat-back">←</button>
              ${avatarHtml(p.initials, p.hue, 'sm')}
              <div class="rs-chat-name">${escapeHtml(p.name)}</div>
              ${p.id === 'p_watcher' ? '<div class="rs-online">● オンライン</div>' : ''}
            </div>
            <div class="rs-chat-messages" id="rs-chat-msgs">
              <div class="rs-sys-msg">マッチしました。メッセージを送りましょう。</div>
              ${p.id === 'p_watcher' ? `
                <div class="rs-msg-them"><div class="rs-bubble">まだいますか？</div></div>
                <div class="rs-msg-them"><div class="rs-bubble">あなたのことは知っています。</div></div>
              ` : ''}
              ${messages.map(m => `
                <div class="rs-msg-me"><div class="rs-bubble">${escapeHtml(m.text)}</div></div>
                <div class="rs-msg-them"><div class="rs-bubble">${escapeHtml(m.reply)}</div></div>
              `).join('')}
            </div>
            <div class="rs-chat-footer">
              <input class="rs-chat-input" id="rs-chat-input" placeholder="メッセージを入力…" />
              <button class="rs-chat-send" id="rs-chat-send">送信</button>
            </div>
          </div>
        `;

        const msgs = body.querySelector('#rs-chat-msgs');
        msgs.scrollTop = msgs.scrollHeight;
        body.querySelector('.rs-chat-back').addEventListener('click', renderList);

        let rsSending = false;
        function sendMsg() {
          if (rsSending) return;
          const input = body.querySelector('#rs-chat-input');
          const btn   = body.querySelector('#rs-chat-send');
          const text  = input ? input.value.trim() : '';
          if (!text) return;
          rsSending = true;
          if (btn)   { btn.disabled = true; btn.style.opacity = '0.5'; }
          if (input) { input.disabled = true; input.value = ''; }
          analyzeMessageContent(text);
          const reply = getReply(text);
          window.LD.Logger.logResonanceMessage && window.LD.Logger.logResonanceMessage(p.id, text, reply);
          window.LD.Assessment && window.LD.Assessment.update('info_seeking', 4);
          if (p.id === 'p_watcher') {
            document.dispatchEvent(new CustomEvent('ld:goal-reached', { detail: { goal: 'resonance-watcher-chat' } }));
          }
          const me = document.createElement('div');
          me.className = 'rs-msg-me';
          me.innerHTML = `<div class="rs-bubble">${escapeHtml(text)}</div>`;
          msgs.appendChild(me);
          msgs.scrollTop = msgs.scrollHeight;
          // 入力中インジケーター
          const typing = document.createElement('div');
          typing.className = 'rs-msg-them rs-typing';
          typing.innerHTML = `<div class="rs-bubble rs-typing-bubble">…</div>`;
          msgs.appendChild(typing);
          msgs.scrollTop = msgs.scrollHeight;
          setTimeout(() => {
            typing.remove();
            const them = document.createElement('div');
            them.className = 'rs-msg-them';
            them.innerHTML = `<div class="rs-bubble">${escapeHtml(reply)}</div>`;
            msgs.appendChild(them);
            msgs.scrollTop = msgs.scrollHeight;
            rsSending = false;
            if (btn)   { btn.disabled = false; btn.style.opacity = ''; }
            if (input) { input.disabled = false; input.focus(); }
          }, 1100);
        }

        body.querySelector('#rs-chat-send').addEventListener('click', sendMsg);
        body.querySelector('#rs-chat-input').addEventListener('keydown', e => {
          if (e.key === 'Enter') { e.preventDefault(); sendMsg(); }
        });
      }

      renderList();
    }

    function renderQuiz(body) {
      if (quizStep >= QUIZ.length) {
        const scores = window.LD.Assessment ? window.LD.Assessment.getScores() : {};
        const top = Object.entries(scores).sort((a,b)=>b[1]-a[1]).slice(0,3);
        const labels = { chaos:'カオス耐性', openness:'開放性', conscientiousness:'計画性', math:'数理思考', spatial:'空間認知', linguistic:'言語理解', integration:'統合力', immersion:'没入度', info_seeking:'情報収集' };
        body.innerHTML = `
          <div class="rs-quiz-result">
            <div class="rs-quiz-result-icon">✨</div>
            <div class="rs-quiz-result-title">診断完了</div>
            <div class="rs-quiz-result-sub">あなたの傾向</div>
            <div class="rs-quiz-result-bars">
              ${top.map(([k,v])=>`
                <div class="rs-result-row">
                  <div class="rs-result-label">${labels[k]||k}</div>
                  <div class="rs-result-bar-wrap"><div class="rs-result-bar" style="width:${v}%"></div></div>
                  <div class="rs-result-val">${Math.round(v)}</div>
                </div>
              `).join('')}
            </div>
            <button class="rs-quiz-retry-btn" id="rs-quiz-retry">もう一度</button>
          </div>
        `;
        body.querySelector('#rs-quiz-retry').addEventListener('click', () => { quizStep = 0; quizAnswers.length = 0; renderQuiz(body); });
        return;
      }
      const q = QUIZ[quizStep];
      body.innerHTML = `
        <div class="rs-quiz-wrap">
          <div class="rs-quiz-header">
            <div class="rs-quiz-progress">${QUIZ.map((_,i)=>`<div class="rs-quiz-dot${i<quizStep?' done':i===quizStep?' active':''}"></div>`).join('')}</div>
            <div class="rs-quiz-step">${quizStep+1} / ${QUIZ.length}</div>
          </div>
          <div class="rs-quiz-q">${escapeHtml(q.q)}</div>
          <div class="rs-quiz-opt">
            ${q.opts.map((opt,i)=>`<button class="rs-quiz-btn" data-idx="${i}">${escapeHtml(opt.label)}</button>`).join('')}
          </div>
        </div>
      `;
      body.querySelectorAll('.rs-quiz-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const opt = q.opts[parseInt(btn.dataset.idx)];
          quizAnswers.push(opt);
          if (opt.axes) {
            Object.entries(opt.axes).forEach(([axis, delta]) => {
              window.LD.Assessment && window.LD.Assessment.update(axis, delta);
            });
          }
          quizStep++;
          renderQuiz(body);
        });
      });
    }

    function renderProfileTab(body) {
      const INTERESTS = ['論理的思考', '創造性', '計画性', '直感', '言語感覚', '視覚的感性'];
      const interestAxes = { '論理的思考': 'math', '創造性': 'openness', '計画性': 'conscientiousness', '直感': 'chaos', '言語感覚': 'linguistic', '視覚的感性': 'spatial' };
      let savedBio = '';
      let savedSlider = 50;
      const savedInterests = new Set();

      body.innerHTML = `
        <div class="rs-my-profile">
          ${avatarHtml('X', 270, 'lg')}
          <div class="rs-my-name">被験者X <span style="font-size:11px;color:#9ca3af;">（あなた）</span></div>
          <div class="rs-my-stats">
            <div class="rs-stat"><div class="rs-stat-n">${likedProfiles.length}</div><div class="rs-stat-l">いいね</div></div>
            <div class="rs-stat"><div class="rs-stat-n">${PROFILES.filter(p=>p.matched).length}</div><div class="rs-stat-l">マッチ</div></div>
            <div class="rs-stat"><div class="rs-stat-n">${passedProfiles.length}</div><div class="rs-stat-l">パス</div></div>
          </div>
        </div>
        <div class="rs-edit-wrap">
          <div class="rs-edit-section">
            <div class="rs-edit-label">自己紹介</div>
            <textarea class="rs-edit-textarea" id="rs-edit-bio" placeholder="自分について書いてみてください…">${savedBio}</textarea>
          </div>
          <div class="rs-edit-section">
            <div class="rs-edit-label">行動スタイル — 計画派 ↔ 即興派</div>
            <div class="rs-slider-row">
              <span class="rs-slider-label">計画</span>
              <input type="range" class="rs-edit-slider" id="rs-edit-slider" min="0" max="100" value="${savedSlider}" />
              <span class="rs-slider-label">即興</span>
            </div>
          </div>
          <div class="rs-edit-section">
            <div class="rs-edit-label">興味・関心（複数選択）</div>
            <div class="rs-edit-checks" id="rs-edit-checks">
              ${INTERESTS.map(i=>`<label class="rs-edit-check-item" data-key="${i}"><input type="checkbox" value="${i}" />${i}</label>`).join('')}
            </div>
          </div>
          <button class="rs-edit-save-btn" id="rs-edit-save">プロフィールを保存</button>
          <div class="rs-edit-saved hidden" id="rs-edit-saved">✓ 保存しました</div>
        </div>
      `;

      // チェックボックスのトグル
      body.querySelectorAll('.rs-edit-check-item').forEach(item => {
        item.addEventListener('click', () => {
          item.classList.toggle('checked');
          const key = item.dataset.key;
          if (item.classList.contains('checked')) savedInterests.add(key);
          else savedInterests.delete(key);
        });
      });

      body.querySelector('#rs-edit-save').addEventListener('click', () => {
        const bio = body.querySelector('#rs-edit-bio').value.trim();
        const slider = parseInt(body.querySelector('#rs-edit-slider').value);

        // bioの長さ → 没入度
        window.LD.Assessment && window.LD.Assessment.update('immersion', Math.min(bio.length / 8, 15));

        // スライダー位置 → 計画性 vs カオス
        if (slider < 35) window.LD.Assessment && window.LD.Assessment.update('conscientiousness', 8);
        else if (slider > 65) window.LD.Assessment && window.LD.Assessment.update('chaos', 8);

        // 興味の選択 → 対応軸
        savedInterests.forEach(key => {
          const axis = interestAxes[key];
          if (axis) window.LD.Assessment && window.LD.Assessment.update(axis, 5);
        });

        window.LD.Assessment && window.LD.Assessment.update('info_seeking', 5);

        body.querySelector('#rs-edit-saved').classList.remove('hidden');
        setTimeout(() => body.querySelector('#rs-edit-saved') && body.querySelector('#rs-edit-saved').classList.add('hidden'), 2000);
      });
    }

    win.querySelectorAll('.rs-tab').forEach(t => t.addEventListener('click', () => showTab(t.dataset.tab)));
    showTab('discover');

  }

  // =====================================================
  // 黒塗り解除アプリ
  // =====================================================
  function openUnredactApp() {
    if (document.getElementById('win-unredact')) { focusWindow('unredact'); return; }
    window.LD.Assessment && window.LD.Assessment.update('info_seeking', 15);
    window.LD.Assessment && window.LD.Assessment.update('chaos', 10);

    // 段階的に解除（初回: アクセスコード文書 / 2回目以降: プロファイル文書も解放）
    const stage2 = !!window._ldUnredactStage2;
    window._ldUnredactStage2 = true;

    const html = `
      <div class="unr-wrap">
        <div class="unr-tabs">
          <button class="unr-tab unr-tab-active" data-tab="doc1">アクセスレポート</button>
          <button class="unr-tab" data-tab="doc2">プロファイル文書 ${stage2 ? '' : '<span class="unr-lock">🔒</span>'}</button>
        </div>
        <div class="unr-body" id="unr-doc1">
          <div class="unr-doc">
            <div class="unr-doc-header">
              <span class="unr-stamp unr-stamp-red">機密解除済み</span>
              <span class="unr-doc-title">システムアクセスレポート #4471</span>
              <span class="unr-doc-date">2023-09-01</span>
            </div>
            <div class="unr-doc-body">
              <p>本レポートは対象端末（ID: LD-2.1）のアクセス権限管理に関するものである。</p>
              <p>以下のアクセスコードが発行されている:</p>
              <table class="unr-table">
                <tr><td class="unr-label">Level 1 — 言語コード</td><td class="unr-val unr-revealed">wake</td></tr>
                <tr><td class="unr-label">Level 2 — 数値コード</td><td class="unr-val unr-revealed">3455</td></tr>
                <tr><td class="unr-label">Level 3 — 視覚コード</td><td class="unr-val unr-revealed">a5acfd</td></tr>
                <tr><td class="unr-label">Level X — 管理者コード</td><td class="unr-val unr-revealed">fc8693</td></tr>
              </table>
              <p>これらのコードはターミナルから <code>unlock [コード]</code> で使用可能。</p>
            </div>
          </div>
        </div>
        <div class="unr-body unr-hidden" id="unr-doc2">
          ${stage2 ? `
          <div class="unr-doc">
            <div class="unr-doc-header">
              <span class="unr-stamp unr-stamp-orange">要注意人物</span>
              <span class="unr-doc-title">行動プロファイル — Subject X</span>
              <span class="unr-doc-date">2023-09-15</span>
            </div>
            <div class="unr-doc-body">
              <p>対象者は本システムの存在に気づき始めている可能性がある。</p>
              <p>行動特性（記録より）:</p>
              <ul class="unr-list">
                <li>ファイルを体系的に収集・分類する傾向</li>
                <li>不審なリンクやツールを躊躇なくダウンロードする</li>
                <li>███████████████████████████████</li>
                <li>████████████████████████</li>
              </ul>
              <p style="color:#ff8800;margin-top:12px;">⚠ 注意: この文書を読んでいるあなたが対象者です。</p>
            </div>
          </div>
          ` : `
          <div class="unr-locked-msg">
            <div style="font-size:32px;">🔒</div>
            <div>このドキュメントはロックされています</div>
            <div style="font-size:11px;color:#888;margin-top:4px;">アプリを再度開くと解放されます</div>
          </div>
          `}
        </div>
      </div>
    `;

    const winUr = createWindow('unredact', '黒塗り解除ツール v2.1', html, { width: 500, height: 380, x: 120, y: 70 });
    if (!winUr) return;

    winUr.querySelectorAll('.unr-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        winUr.querySelectorAll('.unr-tab').forEach(t => t.classList.remove('unr-tab-active'));
        tab.classList.add('unr-tab-active');
        winUr.querySelectorAll('.unr-body').forEach(b => b.classList.add('unr-hidden'));
        winUr.querySelector('#unr-' + tab.dataset.tab).classList.remove('unr-hidden');
      });
    });

    document.dispatchEvent(new CustomEvent('ld:goal-reached', { detail: { goal: 'unredact-open', stage: stage2 ? 2 : 1 } }));
  }

  // =====================================================
  // 2048ゲーム
  // =====================================================
  function open2048() {
    window.LD.Logger.logFileOpen('game-2048', '2048');
    if (document.getElementById('win-game-2048')) { focusWindow('game-2048'); return; }

    let board = Array(4).fill(null).map(() => Array(4).fill(0));
    let score = 0;
    let startTime = Date.now();
    let moveCount = 0;
    let bestTile = 0;

    function addTile() {
      const empty = [];
      board.forEach((row, r) => row.forEach((v, c) => { if (v === 0) empty.push([r, c]); }));
      if (!empty.length) return;
      const [r, c] = empty[Math.floor(Math.random() * empty.length)];
      board[r][c] = Math.random() < 0.9 ? 2 : 4;
    }

    addTile(); addTile();

    const html2048 = `
      <div class="g2048-wrap">
        <div class="g2048-header">
          <div class="g2048-title">2048</div>
          <div class="g2048-stats">
            <div class="g2048-stat"><div class="g2048-stat-label">スコア</div><div class="g2048-stat-val" id="g2048-score">0</div></div>
            <div class="g2048-stat"><div class="g2048-stat-label">手数</div><div class="g2048-stat-val" id="g2048-moves">0</div></div>
          </div>
        </div>
        <div class="g2048-grid" id="g2048-grid"></div>
        <div class="g2048-hint">矢印キーで操作</div>
      </div>
    `;

    const win2048 = createWindow('game-2048', '2048', html2048, { width: 320, height: 400, x: 200, y: 60 });
    if (!win2048) return;

    function renderBoard() {
      const grid = win2048.querySelector('#g2048-grid');
      grid.innerHTML = '';
      board.forEach(row => row.forEach(v => {
        const cell = document.createElement('div');
        cell.className = 'g2048-cell' + (v ? ` g2048-v${v <= 2048 ? v : 'big'}` : '');
        cell.textContent = v || '';
        grid.appendChild(cell);
      }));
      win2048.querySelector('#g2048-score').textContent = score;
      win2048.querySelector('#g2048-moves').textContent = moveCount;
    }

    function slideRow(row) {
      let arr = row.filter(x => x !== 0);
      let gained = 0;
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) { arr[i] *= 2; gained += arr[i]; arr.splice(i + 1, 1); }
      }
      while (arr.length < 4) arr.push(0);
      return { row: arr, gained };
    }

    function move(dir) {
      let changed = false; let gained = 0;
      const prev = board.map(r => [...r]);
      function processRows(rows) {
        return rows.map(row => { const res = slideRow(row); gained += res.gained; return res.row; });
      }
      if (dir === 'left')  board = processRows(board);
      else if (dir === 'right') board = processRows(board.map(r => [...r].reverse())).map(r => r.reverse());
      else if (dir === 'up') {
        let t = board[0].map((_, c) => board.map(r => r[c]));
        t = processRows(t); board = board.map((_, r) => t.map(col => col[r]));
      } else if (dir === 'down') {
        let t = board[0].map((_, c) => board.map(r => r[c]).reverse());
        t = processRows(t); t = t.map(col => col.reverse());
        board = board.map((_, r) => t.map(col => col[r]));
      }
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (board[r][c] !== prev[r][c]) changed = true;
      if (!changed) return;
      score += gained; moveCount++;
      board.forEach(row => row.forEach(v => { if (v > bestTile) bestTile = v; }));
      addTile(); renderBoard();
      if (bestTile >= 2048) { showResult2048(true); return; }
      let canMove = false;
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
        if (board[r][c] === 0) { canMove = true; break; }
        if (c < 3 && board[r][c] === board[r][c + 1]) { canMove = true; break; }
        if (r < 3 && board[r][c] === board[r + 1][c]) { canMove = true; break; }
      }
      if (!canMove) { showResult2048(false); }
    }

    function showResult2048(won) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const efficiency = moveCount > 0 ? Math.round(score / moveCount) : 0;

      window.LD.Assessment && window.LD.Assessment.update('spatial', Math.min(bestTile / 64, 20));
      window.LD.Assessment && window.LD.Assessment.update('math', Math.min(score / 500, 15));
      window.LD.Assessment && window.LD.Assessment.update('immersion', Math.min(elapsed / 30, 15));
      window.LD.Assessment && window.LD.Assessment.update('conscientiousness', Math.min(moveCount / 20, 10));

      win2048.querySelector('.win-body').innerHTML = `
        <div class="game-result ${won ? 'game-result-win' : 'game-result-lose'}">
          <div class="gr-icon">${won ? '🎉' : '💀'}</div>
          <div class="gr-title">${won ? '2048 達成！' : 'ゲームオーバー'}</div>
          <div class="gr-main-stat">${bestTile}</div>
          <div class="gr-main-label">最大タイル</div>
          <div class="gr-stats">
            <div class="gr-row"><span class="gr-key">スコア</span><span class="gr-val">${score}</span></div>
            <div class="gr-row"><span class="gr-key">手数</span><span class="gr-val">${moveCount}</span></div>
            <div class="gr-row"><span class="gr-key">効率</span><span class="gr-val">${efficiency} pt/手</span></div>
            <div class="gr-row"><span class="gr-key">プレイ時間</span><span class="gr-val">${elapsed} 秒</span></div>
          </div>
          <button class="gr-retry-btn" id="gr-retry-2048">もう一度プレイ</button>
        </div>
      `;
      win2048.querySelector('#gr-retry-2048').addEventListener('click', () => {
        destroyWindow('game-2048');
        open2048();
      });
    }

    function keyHandler(e) {
      if (!document.getElementById('win-game-2048')) { document.removeEventListener('keydown', keyHandler); return; }
      const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
      if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
    }
    document.addEventListener('keydown', keyHandler);

    renderBoard();
  }

  // =====================================================
  // マインスイーパー
  // =====================================================
  function openMinesweeper() {
    window.LD.Logger.logFileOpen('game-sweep', 'マインスイーパー');
    if (document.getElementById('win-game-sweep')) { focusWindow('game-sweep'); return; }

    const ROWS = 9, COLS = 9, MINES = 10;
    let msBoard = [], msGameOver = false, msFirstClick = true;
    let msFlagCount = 0, msRevealCount = 0, msWildClicks = 0;
    let msElapsed = 0, msTimerInt = null, msSolved = false;

    function initMsBoard(safeR, safeC) {
      msBoard = Array(ROWS).fill(null).map(() =>
        Array(COLS).fill(null).map(() => ({ mine: false, revealed: false, flagged: false, adjacent: 0 }))
      );
      let placed = 0;
      while (placed < MINES) {
        const r = Math.floor(Math.random() * ROWS), c = Math.floor(Math.random() * COLS);
        if (!msBoard[r][c].mine && (Math.abs(r - safeR) > 1 || Math.abs(c - safeC) > 1)) {
          msBoard[r][c].mine = true; placed++;
        }
      }
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        if (msBoard[r][c].mine) continue;
        let cnt = 0;
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && msBoard[nr][nc].mine) cnt++;
        }
        msBoard[r][c].adjacent = cnt;
      }
    }

    function msReveal(r, c) {
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
      if (msBoard[r][c].revealed || msBoard[r][c].flagged) return;
      msBoard[r][c].revealed = true; msRevealCount++;
      if (msBoard[r][c].adjacent === 0 && !msBoard[r][c].mine) {
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) msReveal(r + dr, c + dc);
      }
    }

    const htmlSweep = `
      <div class="msw-wrap">
        <div class="msw-header">
          <div class="msw-stat"><span>💣</span><span id="msw-mines">${MINES}</span></div>
          <button class="msw-reset-btn" id="msw-reset">🙂</button>
          <div class="msw-stat"><span>⏱</span><span id="msw-time">0</span></div>
        </div>
        <div class="msw-grid" id="msw-grid"></div>
      </div>
    `;

    const winSweep = createWindow('game-sweep', 'マインスイーパー', htmlSweep, { width: 310, height: 390, x: 220, y: 80 });
    if (!winSweep) return;

    function renderMsGrid() {
      const grid = winSweep.querySelector('#msw-grid');
      grid.innerHTML = '';
      // グリッド全体のcontextmenuを止める（デスクトップメニュー防止）
      grid.oncontextmenu = e => { e.preventDefault(); e.stopPropagation(); };
      msBoard.forEach((row, r) => row.forEach((cell, c) => {
        const el = document.createElement('div');
        el.className = 'msw-cell';
        if (cell.revealed) {
          el.classList.add('msw-revealed');
          if (cell.mine) { el.classList.add('msw-mine'); el.textContent = '💣'; }
          else if (cell.adjacent > 0) { el.textContent = cell.adjacent; el.classList.add('msw-n' + cell.adjacent); }
        } else if (cell.flagged) { el.classList.add('msw-flagged'); el.textContent = '🚩'; }
        el.addEventListener('click', () => msHandleClick(r, c));
        el.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); msHandleFlag(r, c); });
        grid.appendChild(el);
      }));
      winSweep.querySelector('#msw-mines').textContent = MINES - msFlagCount;
    }

    function msHandleClick(r, c) {
      if (msGameOver || msSolved || msBoard[r][c].revealed || msBoard[r][c].flagged) return;
      if (msFirstClick) {
        msFirstClick = false;
        initMsBoard(r, c);
        msTimerInt = setInterval(() => {
          msElapsed++;
          const el = winSweep.querySelector('#msw-time');
          if (el) el.textContent = msElapsed;
        }, 1000);
        const isCorner = (r === 0 || r === ROWS - 1) && (c === 0 || c === COLS - 1);
        if (isCorner) window.LD.Assessment && window.LD.Assessment.update('conscientiousness', 5);
        else if (r !== 0 && r !== ROWS - 1 && c !== 0 && c !== COLS - 1) window.LD.Assessment && window.LD.Assessment.update('openness', 5);
      }
      if (msFlagCount === 0 && msRevealCount > 3) msWildClicks++;
      if (msBoard[r][c].mine) {
        msBoard[r][c].revealed = true; msGameOver = true;
        clearInterval(msTimerInt);
        msBoard.forEach(row => row.forEach(cell => { if (cell.mine) cell.revealed = true; }));
        renderMsGrid();
        winSweep.querySelector('#msw-reset').textContent = '😵';
        msSaveResult(false);
        msShowResult(false);
        return;
      }
      msReveal(r, c); renderMsGrid();
      if (msRevealCount === ROWS * COLS - MINES) {
        clearInterval(msTimerInt); msSolved = true;
        winSweep.querySelector('#msw-reset').textContent = '😎';
        msSaveResult(true);
        msShowResult(true);
      }
    }

    function msShowResult(won) {
      const flagRatio = Math.round((msFlagCount / MINES) * 100);
      const revealed = msRevealCount;
      const totalSafe = ROWS * COLS - MINES;

      winSweep.querySelector('.win-body').innerHTML = `
        <div class="game-result ${won ? 'game-result-win' : 'game-result-lose'}">
          <div class="gr-icon">${won ? '🎉' : '💥'}</div>
          <div class="gr-title">${won ? 'クリア！' : 'ゲームオーバー'}</div>
          <div class="gr-main-stat">${msElapsed}</div>
          <div class="gr-main-label">クリアタイム（秒）</div>
          <div class="gr-stats">
            <div class="gr-row"><span class="gr-key">開いたマス</span><span class="gr-val">${revealed} / ${totalSafe}</span></div>
            <div class="gr-row"><span class="gr-key">フラグ先置き率</span><span class="gr-val">${flagRatio}%</span></div>
          </div>
          <button class="gr-retry-btn" id="gr-retry-sweep">もう一度プレイ</button>
        </div>
      `;
      winSweep.querySelector('#gr-retry-sweep').addEventListener('click', () => {
        destroyWindow('game-sweep');
        openMinesweeper();
      });
    }

    function msHandleFlag(r, c) {
      if (msGameOver || msSolved || msBoard[r][c].revealed) return;
      msBoard[r][c].flagged = !msBoard[r][c].flagged;
      msFlagCount += msBoard[r][c].flagged ? 1 : -1;
      window.LD.Assessment && window.LD.Assessment.update('conscientiousness', msBoard[r][c].flagged ? 3 : -1);
      renderMsGrid();
    }

    function msSaveResult(won) {
      const flagRatio = msFlagCount / MINES;
      window.LD.Assessment && window.LD.Assessment.update('conscientiousness', Math.round(flagRatio * 12));
      window.LD.Assessment && window.LD.Assessment.update('math', won ? 15 : 5);
      window.LD.Assessment && window.LD.Assessment.update('immersion', Math.min(msElapsed / 20, 15));
      if (msWildClicks > 5) window.LD.Assessment && window.LD.Assessment.update('chaos', 8);
      window.LD.Logger.logGameSweep && window.LD.Logger.logGameSweep({
        won,
        elapsed: msElapsed,
        flagCount: msFlagCount,
        wildClicks: msWildClicks,
        revealCount: msRevealCount,
        flagRatio: Math.round(flagRatio * 100)
      });
    }

    winSweep.querySelector('#msw-reset').addEventListener('click', () => {
      clearInterval(msTimerInt);
      msBoard = Array(ROWS).fill(null).map(() =>
        Array(COLS).fill(null).map(() => ({ mine: false, revealed: false, flagged: false, adjacent: 0 }))
      );
      msGameOver = false; msFirstClick = true; msFlagCount = 0;
      msRevealCount = 0; msWildClicks = 0; msElapsed = 0; msSolved = false;
      winSweep.querySelector('#msw-reset').textContent = '🙂';
      winSweep.querySelector('#msw-time').textContent = '0';
      winSweep.querySelector('#msw-mines').textContent = MINES;
      renderMsGrid();
    });

    msBoard = Array(ROWS).fill(null).map(() =>
      Array(COLS).fill(null).map(() => ({ mine: false, revealed: false, flagged: false, adjacent: 0 }))
    );
    renderMsGrid();
  }

  // =====================================================
  // タイピングゲーム
  // =====================================================
  function openTypingGame() {
    window.LD.Logger.logFileOpen('game-typing', 'タイピング');
    if (document.getElementById('win-game-typing')) { focusWindow('game-typing'); return; }

    const SENTENCES = [
      'きょうはいいてんきですね',
      'ねこがひなたぼっこをしている',
      'りんごとみかんをかいました',
      'こうえんでともだちとあそんだ',
      'あおいそらにくもがうかんでいる',
      'いぬがしっぽをふっている',
      'はるになったらはなみをしよう',
      'おかあさんのりょうりはおいしい',
      'でんしゃがえきにとまった',
      'やまのうえからうみがみえた',
    ];

    let typIdx = 0, typStartTime = null, typErrors = 0, typRounds = [], typDone = false;

    const htmlTyp = `
      <div class="typ-wrap">
        <div class="typ-header">
          <div class="typ-stat"><span class="typ-stat-l">WPM</span><span class="typ-stat-v" id="typ-wpm">—</span></div>
          <div class="typ-stat"><span class="typ-stat-l">精度</span><span class="typ-stat-v" id="typ-acc">—</span></div>
          <div class="typ-stat"><span class="typ-stat-l">ラウンド</span><span class="typ-stat-v" id="typ-round">1/${SENTENCES.length}</span></div>
        </div>
        <div class="typ-sentence" id="typ-sentence"></div>
        <input class="typ-input" id="typ-input" type="text" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="入力してください…" />
        <div class="typ-progress-bar"><div class="typ-progress-fill" id="typ-fill" style="width:0%"></div></div>
        <div class="typ-result hidden" id="typ-result"></div>
      </div>
    `;

    const winTyp = createWindow('game-typing', 'タイピング', htmlTyp, { width: 420, height: 290, x: 160, y: 90 });
    if (!winTyp) return;

    function typRenderSentence(typed) {
      const s = SENTENCES[typIdx];
      let h = '';
      for (let i = 0; i < s.length; i++) {
        if (i < typed.length) h += `<span class="${typed[i] === s[i] ? 'typ-correct' : 'typ-wrong'}">${s[i]}</span>`;
        else if (i === typed.length) h += `<span class="typ-cursor">${s[i]}</span>`;
        else h += `<span class="typ-pending">${s[i]}</span>`;
      }
      winTyp.querySelector('#typ-sentence').innerHTML = h;
    }

    function typNext() {
      typIdx++;
      winTyp.querySelector('#typ-input').value = '';
      typStartTime = null; typErrors = 0;
      if (typIdx >= SENTENCES.length) { typShowFinal(); return; }
      winTyp.querySelector('#typ-round').textContent = `${typIdx + 1}/${SENTENCES.length}`;
      winTyp.querySelector('#typ-fill').style.width = (typIdx / SENTENCES.length * 100) + '%';
      typRenderSentence('');
      winTyp.querySelector('#typ-input').focus();
    }

    function typShowFinal() {
      const totalTime = typRounds.reduce((a, r) => a + r.time, 0);
      const totalChars = typRounds.reduce((a, r) => a + r.chars, 0);
      const totalErr = typRounds.reduce((a, r) => a + r.errors, 0);
      const avgWPM = totalTime > 0 ? Math.round(totalChars / 5 / (totalTime / 60)) : 0;
      const accuracy = Math.round((1 - totalErr / Math.max(totalChars, 1)) * 100);

      // ラウンドごとのWPMばらつき（標準偏差）
      const wpmList = typRounds.map(r => r.wpm);
      const meanWPM = wpmList.reduce((a, v) => a + v, 0) / Math.max(wpmList.length, 1);
      const wpmSD = Math.round(Math.sqrt(wpmList.reduce((a, v) => a + (v - meanWPM) ** 2, 0) / Math.max(wpmList.length, 1)));

      window.LD.Assessment && window.LD.Assessment.update('conscientiousness', Math.round(accuracy / 10));
      window.LD.Assessment && window.LD.Assessment.update('immersion', Math.min(SENTENCES.length * 3, 15));
      window.LD.Assessment && window.LD.Assessment.update('linguistic', Math.min(totalChars / 10, 15));
      if (avgWPM > 60) window.LD.Assessment && window.LD.Assessment.update('chaos', 5);
      window.LD.Logger.logGameTyping && window.LD.Logger.logGameTyping({
        avgWPM, accuracy, totalChars, totalErrors: totalErr,
        rounds: typRounds.map(r => ({ wpm: r.wpm, errors: r.errors, time: Math.round(r.time * 10) / 10 }))
      });

      winTyp.querySelector('.win-body').innerHTML = `
        <div class="game-result game-result-win">
          <div class="gr-icon">⌨️</div>
          <div class="gr-title">タイピング完了！</div>
          <div class="gr-triple">
            <div class="gr-triple-item"><div class="gr-triple-n">${avgWPM}</div><div class="gr-triple-l">WPM</div></div>
            <div class="gr-triple-item"><div class="gr-triple-n">${accuracy}%</div><div class="gr-triple-l">精度</div></div>
            <div class="gr-triple-item"><div class="gr-triple-n">${wpmSD}</div><div class="gr-triple-l">ムラ(SD)</div></div>
          </div>
          <div class="gr-stats">
            <div class="gr-row"><span class="gr-key">最速ラウンド</span><span class="gr-val">${Math.max(...wpmList)} WPM</span></div>
            <div class="gr-row"><span class="gr-key">最遅ラウンド</span><span class="gr-val">${Math.min(...wpmList)} WPM</span></div>
            <div class="gr-row"><span class="gr-key">総ミス</span><span class="gr-val">${totalErr} 回</span></div>
            <div class="gr-row"><span class="gr-key">総時間</span><span class="gr-val">${Math.round(totalTime)} 秒</span></div>
          </div>
          <button class="gr-retry-btn" id="gr-retry-typing">もう一度プレイ</button>
        </div>
      `;
      winTyp.querySelector('#gr-retry-typing').addEventListener('click', () => {
        destroyWindow('game-typing');
        openTypingGame();
      });
    }

    winTyp.querySelector('#typ-input').addEventListener('input', e => {
      const val = e.target.value;
      const s = SENTENCES[typIdx];
      if (!typStartTime) typStartTime = Date.now();
      let err = 0;
      for (let i = 0; i < val.length; i++) if (val[i] !== s[i]) err++;
      typErrors = err;
      typRenderSentence(val);
      if (val.length === s.length && err === 0) {
        const time = (Date.now() - typStartTime) / 1000;
        const wpm = Math.round(val.length / 5 / (time / 60));
        typRounds.push({ chars: val.length, errors: typErrors, time, wpm });
        winTyp.querySelector('#typ-wpm').textContent = wpm;
        winTyp.querySelector('#typ-acc').textContent = Math.round((1 - typErrors / val.length) * 100) + '%';
        setTimeout(typNext, 350);
      }
    });

    typRenderSentence('');
    setTimeout(() => winTyp.querySelector('#typ-input').focus(), 100);
  }

  // =====================================================
  // ファイルマネージャー（エクスプローラー風）
  // =====================================================
  function openFileManager() {
    window.LD.Logger.logFileOpen('file-manager', 'ドキュメント');

    if (document.getElementById('win-file-manager')) { focusWindow('file-manager'); return; }

    const FS = {
      'root':         { type: 'folder', name: 'マイファイル',   children: ['documents', 'photos', 'project'] },
      'documents':    { type: 'folder', name: 'ドキュメント',   parent: 'root',      children: ['memo_daily', 'shopping', 'reading_notes', 'idea_memo'] },
      'photos':       { type: 'folder', name: '写真',           parent: 'root',      children: ['photo_room', 'photo_notes'] },
      'project':      { type: 'folder', name: 'プロジェクト',   parent: 'root',      children: ['todo_txt', 'design_notes'] },
      'memo_daily': {
        type: 'text', name: '日常メモ.txt', parent: 'documents', size: '1.2 KB',
        content: `日常メモ — 2023/09/15\n\n今日やること:\n  ・日記を読み返す（古い順から）\n  ・ゴミ箱の中身を確認する（消したファイルが残ってるはず）\n  ・TwitXのDMを確認する\n\n---\nパスワードメモ（忘れないように）\n\n  TwitX ログイン   : 3key5\n  MailBox ログイン  : wake\n\nシステムの解錠コードはプロジェクトフォルダの設計ノートに書いてある。`
      },
      'shopping': {
        type: 'text', name: '買い物リスト.txt', parent: 'documents', size: '0.4 KB',
        content: `買い物リスト\n\n・牛乳\n・パン\n・コーヒー（豆）\n・ポストイット（黄色・赤・青）\n・単3電池\n\n---\n※ 来週の買い物は土曜日`
      },
      'reading_notes': {
        type: 'text', name: '読書メモ.txt', parent: 'documents', size: '2.1 KB',
        content: `読んだ本のメモ\n\n■ 「記号と詩の構造」より\n  アクロスティック詩（頭字詩）について:\n  各行の最初の文字だけを縦に読むと、\n  隠されたメッセージが現れる詩の形式。\n  古くから秘密の伝言や署名に使われてきた。\n\n  例（英語）:\n    Softly falls the morning light\n    Under skies of pale grey dawn\n    Nobody knows the hidden thread\n\n  日本でも「折り句」として和歌に組み込まれてきた。\n  表面の意味と構造の意味が重なるのが醍醐味。\n\n---\n詩を読むときは、表面だけでなく\n構造そのものに目を向けると面白い。\n見え方が、変わることがある。`
      },
      'idea_memo': {
        type: 'text', name: 'アイデアメモ.txt', parent: 'documents', size: '1.6 KB',
        content: `プログラムのアイデアメモ\n\n■ フィボナッチ数列を使ったコード\n\n  1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89...\n  前の2つを足していく。シンプルだけど無限に続く。\n\n  このパターンをパスコードに使うなら\n  どの項を選ぶか、どう並べるかが鍵になる。\n  覚えやすくて、知っている人にはすぐわかる。\n  知らない人には意味不明の数字列に見える。\n\n■ その他アイデア\n  ・タイマーアプリ\n  ・メモ同期ツール`
      },
      'photo_room':   { type: 'image', name: '部屋_写真.png',  parent: 'photos',  size: '1.8 MB', imageType: 'room' },
      'photo_notes':  { type: 'image', name: '配色メモ.png',   parent: 'photos',  size: '0.9 MB', imageType: 'color_notes' },
      'todo_txt': {
        type: 'text', name: 'TODO.txt', parent: 'project', size: '1.1 KB',
        content: `Project LD — TODO リスト\n\n[ ] TwitXアカウントのパスワードを変更する\n    → 今のは短すぎて推測されそう。変えること\n\n[ ] systemフォルダのバックアップ確認\n    設定アプリ > セキュリティ から管理者コードで解錠\n\n[ ] MailBoxのパスワード更新\n    → 単純な英単語。今すぐ変える\n\n[x] 日記のバックアップ 完了\n[x] ゴミ箱の整理 完了（重要ファイルは意図的に残してある）`
      },
      'design_notes': {
        type: 'text', name: '設計ノート.txt', parent: 'project', size: '3.4 KB',
        content: `Project LD — 設計メモ\n\n■ systemフォルダのアクセスコード一覧\n\n  ターミナル（Terminal）から以下のいずれかで解錠できる:\n    unlock wake\n    unlock 3455\n    unlock a5acfd\n\n■ 各コードの由来\n  wake    → MailBoxのパスワードと同じ単語\n  3455    → フィボナッチ数列の特定の項\n  a5acfd  → カラーピッカーツールで表示される色コード\n\n■ 操作方法\n  スタートメニュー > Terminal を開いて\n  「unlock [コード]」と入力する`
      }
    };

    let currentFolder = 'documents';
    let currentView   = 'grid';
    let historyStack  = ['documents'];

    const html = `
      <div class="fm-wrap">
        <div class="fm-toolbar">
          <button class="fm-back-btn" id="fm-back">←</button>
          <div class="fm-path" id="fm-path">マイファイル &gt; ドキュメント</div>
          <div class="fm-view-btns">
            <button class="fm-view-btn fm-view-active" data-view="grid" title="グリッド">⊞</button>
            <button class="fm-view-btn" data-view="list" title="リスト">≡</button>
          </div>
        </div>
        <div class="fm-body">
          <div class="fm-sidebar" id="fm-sidebar">
            <div class="fm-tree-item fm-tree-folder" data-id="root">📁 マイファイル</div>
            <div class="fm-tree-item fm-tree-folder fm-tree-child fm-tree-active" data-id="documents">📁 ドキュメント</div>
            <div class="fm-tree-item fm-tree-folder fm-tree-child" data-id="photos">🖼️ 写真</div>
            <div class="fm-tree-item fm-tree-folder fm-tree-child" data-id="project">📁 プロジェクト</div>
          </div>
          <div class="fm-content" id="fm-content"></div>
        </div>
      </div>
    `;

    const win = createWindow('file-manager', 'エクスプローラー', html, { width: 620, height: 440, x: 80, y: 60 });
    if (!win) return;

    function getPath(folderId) {
      const parts = [];
      let cur = folderId;
      while (cur && FS[cur]) { parts.unshift(FS[cur].name); cur = FS[cur].parent; }
      parts.unshift('マイファイル');
      return [...new Set(parts)].join(' > ');
    }

    function getKeyById(item) {
      return Object.keys(FS).find(k => FS[k] === item) || '';
    }

    function getIcon(item) {
      if (item.type === 'folder') return '📁';
      if (item.type === 'image')  return '🖼️';
      return '📄';
    }

    function renderFolder(folderId) {
      currentFolder = folderId;
      win.querySelector('#fm-path').textContent = getPath(folderId);
      win.querySelectorAll('.fm-tree-item').forEach(i => i.classList.toggle('fm-tree-active', i.dataset.id === folderId));

      const node = FS[folderId];
      const content = win.querySelector('#fm-content');
      if (!node || !node.children) { content.innerHTML = ''; return; }

      const items = node.children.map(id => FS[id]).filter(Boolean);

      if (currentView === 'grid') {
        content.innerHTML = `<div class="fm-grid">${items.map(item => `
          <div class="fm-item" data-id="${getKeyById(item)}" title="${item.name}">
            <div class="fm-item-icon">${getIcon(item)}</div>
            <div class="fm-item-name">${item.name}</div>
          </div>
        `).join('')}</div>`;
      } else {
        content.innerHTML = `<table class="fm-table">
          <thead><tr><th>名前</th><th>種類</th><th>サイズ</th></tr></thead>
          <tbody>${items.map(item => `
            <tr class="fm-row" data-id="${getKeyById(item)}">
              <td>${getIcon(item)} ${item.name}</td>
              <td>${item.type === 'folder' ? 'フォルダ' : item.type === 'image' ? '画像' : 'テキスト'}</td>
              <td>${item.size || '—'}</td>
            </tr>
          `).join('')}</tbody>
        </table>`;
      }
      bindItemEvents(content);
    }

    function openItem(id) {
      const item = FS[id];
      if (!item) return;
      window.LD.Logger.logFileOpen('fm-' + id, item.name);
      window.LD.Assessment && window.LD.Assessment.update('conscientiousness', 2);

      if (item.type === 'folder') { historyStack.push(id); renderFolder(id); return; }

      if (item.type === 'text') {
        window.LD.Assessment && window.LD.Assessment.update('info_seeking', 3);
        createWindow('fm-file-' + id, item.name,
          `<div class="txt-wrap"><pre class="txt-body">${escapeHtml(item.content)}</pre></div>`,
          { width: 500, height: 400, x: 160, y: 100 });
        if (id === 'reading_notes') window.LD.Assessment && window.LD.Assessment.update('linguistic', 8);
        else if (id === 'idea_memo') window.LD.Assessment && window.LD.Assessment.update('math', 8);
        else if (id === 'todo_txt')  window.LD.Assessment && window.LD.Assessment.update('integration', 8);
        else if (id === 'design_notes') { window.LD.Assessment && window.LD.Assessment.update('integration', 10); window.LD.Assessment && window.LD.Assessment.update('info_seeking', 5); }
      }

      if (item.type === 'image') {
        let imageHtml = '';
        if (item.imageType === 'room') {
          imageHtml = `<div class="fm-img-view">
            <div class="fm-img-caption">部屋の写真（2023年秋）</div>
            <div class="fm-room-art">
              <div class="fm-room-wall"></div>
              <div class="fm-room-furniture">
                <div class="fm-sticky-red" title="#fca5a5">📌</div>
                <div class="fm-sticky-green" title="#86efac">📌</div>
                <div class="fm-sticky-blue" title="#93c5fd">📌</div>
              </div>
              <div class="fm-room-desk"><div class="fm-desk-surface"><div class="fm-desk-item">💻</div><div class="fm-desk-item">📝</div></div></div>
              <div class="fm-room-note">壁に3色の付箋が貼ってある。<br>
                <span style="color:#dc2626;">■ #fca5a5</span>&nbsp;
                <span style="color:#16a34a;">■ #86efac</span>&nbsp;
                <span style="color:#2563eb;">■ #93c5fd</span>
              </div>
            </div>
          </div>`;
        } else if (item.imageType === 'color_notes') {
          imageHtml = `<div class="fm-img-view">
            <div class="fm-img-caption">配色メモ（手書きスキャン）</div>
            <div class="fm-color-notes-art">
              <div class="fm-cn-paper">
                <div class="fm-cn-title">カラーコードメモ</div>
                <div class="fm-cn-row"><span class="fm-cn-swatch" style="background:#fca5a5;"></span> 赤系 → #<span class="fm-cn-code">fca5a5</span> 末尾: <strong>a5</strong></div>
                <div class="fm-cn-row"><span class="fm-cn-swatch" style="background:#86efac;"></span> 緑系 → #<span class="fm-cn-code">86efac</span> 末尾: <strong>ac</strong></div>
                <div class="fm-cn-row"><span class="fm-cn-swatch" style="background:#93c5fd;"></span> 青系 → #<span class="fm-cn-code">93c5fd</span> 末尾: <strong>fd</strong></div>
                <div class="fm-cn-divider"></div>
                <div class="fm-cn-combined">順に繋げると: <code style="font-size:15px;font-weight:bold;">a5acfd</code></div>
                <div class="fm-cn-note">※ 順番は 赤→緑→青</div>
              </div>
            </div>
          </div>`;
        }
        createWindow('fm-img-' + id, item.name, imageHtml, { width: 460, height: 360, x: 150, y: 90 });
      }
    }

    function bindItemEvents(content) {
      content.querySelectorAll('.fm-item, .fm-row').forEach(el => {
        el.addEventListener('click', () => {
          content.querySelectorAll('.fm-item, .fm-row').forEach(i => i.classList.remove('fm-sel'));
          el.classList.add('fm-sel');
        });
        el.addEventListener('dblclick', () => openItem(el.dataset.id));
      });
    }

    win.querySelector('#fm-back').addEventListener('click', () => {
      if (historyStack.length > 1) { historyStack.pop(); renderFolder(historyStack[historyStack.length - 1]); }
    });
    win.querySelectorAll('.fm-view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        win.querySelectorAll('.fm-view-btn').forEach(b => b.classList.remove('fm-view-active'));
        btn.classList.add('fm-view-active');
        currentView = btn.dataset.view;
        renderFolder(currentFolder);
      });
    });
    win.querySelectorAll('.fm-tree-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        historyStack = id === 'root' ? ['root'] : [...historyStack, id];
        renderFolder(id);
      });
    });

    renderFolder('documents');
  }

  function initStartMenu() {
    const btn  = document.getElementById('start-btn');
    const menu = document.getElementById('start-menu');
    if (!btn || !menu) return;
    btn.addEventListener('click', e => { e.stopPropagation(); menu.classList.toggle('hidden'); });
    document.addEventListener('click', () => menu.classList.add('hidden'));
    menu.querySelectorAll('.sm-item').forEach(item => {
      item.addEventListener('click', e => {
        e.stopPropagation();
        menu.classList.add('hidden');
        const act = item.dataset.action;
        if      (act === 'settings') openSettings();
        else if (act === 'terminal') openTerminal();
        else if (act === 'shutdown') { if (confirm('セッションを終了しますか？\n記録はすべて保存されます。')) triggerShutdown(); }
      });
    });
  }

  // =====================================================
  // 初期化
  // =====================================================
  return {
    init() {
      renderDesktop();
      renderStickyNotes();
      startClock();
      initContextMenu();
      initStartMenu();
      window.LD.Logger.init();

      // デスクトップクリックで選択解除
      document.getElementById('desktop').addEventListener('click', e => {
        if (e.target.id === 'desktop' || e.target.id === 'desktop-icons' || e.target.id === 'sticky-area') {
          document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('icon-sel'));
        }
      });

      document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
          e.preventDefault();
          window.LD.Feedback.show(window.LD.Logger.getLog(), true);
        }
      });

      // 行動ベース自動解錠リスナー
      document.addEventListener('ld:auto-unlock', (e) => {
        const type = e.detail.type;
        const logData = window.LD.Logger.getLog();
        if (logData.systemUnlocked) return;
        window.LD.Logger.logUnlock(type);
        window.LD.Effects.showTypewriter('パターンを解析中…\n\nアクセスが\n許可されました。');
        document.dispatchEvent(new CustomEvent('ld:terminal-notify', {
          detail: { message: '行動パターン解析完了。自動認証を開始します...' }
        }));
        setTimeout(() => openHiddenFolder(type), 3500);
      });

      // ゴール達成ハンドラー
      document.addEventListener('ld:goal-reached', (e) => {
        const goal = e.detail.goal;
        window.LD.Logger.logGoalReached && window.LD.Logger.logGoalReached(goal);
        window.LD.Assessment && window.LD.Assessment.update('immersion', 10);
        const messages = {
          'twitx-reply':        'メッセージが\n送信された。\n\n記録が更新される。',
          'twitx-login':        'TwitXに\nログインした。\n\n@watcher_0が\n待っている。',
          'mailbox-login':      'メールボックスに\nアクセスした。\n\n未読メールがある。',
          'mail-report':        '報告書が\n送信された。\n\n何かが変わるかもしれない。',
          'system-restore':     'バックアップを\n復元している。\n\n失われたデータが\n戻ってくる。',
          'recycle-restore-all':'全てのファイルを\n復元した。\n\n断片が\n揃い始める。',
          'shutdown':               '',
          'resonance-match':        '誰かと\n共鳴した。\n\nその選択が\n記録された。',
          'resonance-watcher-chat': '観察者と\n対話した。\n\n彼は何を\n知っているのか。',
        };
        const msg = messages[goal];
        if (msg) {
          setTimeout(() => {
            window.LD.Effects.triggerGlitch(400);
            setTimeout(() => window.LD.Effects.showTypewriter(msg), 500);
          }, 800);
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

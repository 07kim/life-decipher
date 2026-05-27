// メインアプリケーション
// デスクトップ・ウィンドウシステム・ファイル操作を管理する
window.LD = window.LD || {};

window.LD.App = (function () {
  let zTop = 100;
  const openWindows = {};

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
      if (dragging && moved) window.LD.Logger.logNoteMoved(type);
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
      { id: 'sketchbook',    label: '落書き帳.png',        emoji: '🖥️', x: 32,     y: 264,       action: openSketchbook },
      { id: 'calc-memo',     label: '計算メモ.txt',       emoji: '📊', x: 32,     y: 380,       action: openCalcMemo },
      { id: 'cipher-note',   label: '暗号メモ.txt',       emoji: '🔍', x: 32,     y: 496,       action: openCipherNote },
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
      el.innerHTML = n.text.replace(/\n/g, '<br>');
      makeStickyDraggable(el, n.type);
      container.appendChild(el);
    });
  }

  // =====================================================
  // ファイルを開く処理
  // =====================================================
  function openDiary() {
    window.LD.Logger.logFileOpen('diary-txt', '日記.txt');
    const entries = window.LD.DIARY;

    const tabs = entries.map((e, i) =>
      `<button class="dtab${i === 0 ? ' dtab-active' : ''}" data-i="${i}">${e.title}</button>`
    ).join('');

    const html = `
      <div class="diary-wrap">
        <div class="diary-tabs">${tabs}</div>
        <div class="diary-pane">
          <div class="diary-date" id="d-date">${entries[0].date}</div>
          <div class="diary-body" id="d-body">${renderDiaryText(entries[0].content)}</div>
        </div>
      </div>
    `;

    const win = createWindow('diary-txt', '日記.txt — テキストエディタ', html, { width: 540, height: 460 });
    if (!win) return;

    win.querySelectorAll('.dtab').forEach(tab => {
      tab.addEventListener('click', () => {
        win.querySelectorAll('.dtab').forEach(t => t.classList.remove('dtab-active'));
        tab.classList.add('dtab-active');
        const entry = entries[+tab.dataset.i];
        win.querySelector('#d-date').textContent = entry.date;
        win.querySelector('#d-body').innerHTML   = renderDiaryText(entry.content);
        attachCensoredTracking(win);
        window.LD.Logger.logFileOpen('diary-' + entry.id, entry.title);
      });
    });
    attachCensoredTracking(win);
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
    
    // パスワードの種類に応じて表示するファイルを切り替える
    let files = window.LD.HIDDEN_FILES;
    if (unlockType === 'linguistic') files = files.filter(f => f.id === 'report_linguistic');
    else if (unlockType === 'math') files = files.filter(f => f.id === 'report_math');
    else if (unlockType === 'visual') files = files.filter(f => f.id === 'report_visual');
    else files = files.filter(f => f.id === 'report_composite');

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

  function openSketchbook() {
    window.LD.Logger.logFileOpen('sketchbook', '落書き帳.png');
    const html = `
      <div style="padding:8px;height:100%;display:flex;flex-direction:column;align-items:center;background:#e8e0d8;">
        <div style="font-size:10px;color:#888;margin-bottom:6px;font-family:monospace;">落書き帳.png — 画像ビューア</div>
        <img src="assets/sketchbook.png"
             style="max-width:100%;max-height:calc(100% - 28px);object-fit:contain;border:1px solid #bbb;box-shadow:2px 2px 8px rgba(0,0,0,0.2);"
             alt="落書き帳">
      </div>
    `;
    createWindow('sketchbook', '落書き帳.png — 画像ビューア', html, { width: 560, height: 500, x: 120, y: 60 });
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

  function openCipherNote() {
    window.LD.Logger.logFileOpen('cipher-note', '暗号メモ.txt');
    const content = `暗号メモ
=====================================

【縦読み（アクロスティック）について】

  文章の各行の「最初の文字」を
  上から順に読むと、隠されたメッセージが現れる。

  例:
    W ater flows
    A lways downward
    K eeping secrets
    E ternal movement

  → W-A-K-E

=====================================

【カラーコードについて】

  HTMLのカラーコード（16進数）：
  # + 6文字の16進数

  例:
    #ff0000 = 赤
    #00ff00 = 緑
    #0000ff = 青
    #93c5fd = ???

  ブラウザの開発者ツール（F12）で
  要素の色コードを確認できる。

=====================================

このメモは誰が書いたのか。
`;
    const html = `<div class="txt-wrap"><pre class="txt-body">${escapeHtml(content)}</pre></div>`;
    createWindow('cipher-note', '暗号メモ.txt', html, { width: 500, height: 480, x: 200, y: 80 });
  }

  function openRecycleBin() {
    window.LD.Logger.logFileOpen('recycle-bin', 'ゴミ箱');
    const html = `
      <div class="folder-wrap recycle-empty">
        <div style="font-size:48px;margin-bottom:12px">🗑️</div>
        <div style="color:#666">ゴミ箱は空です</div>
        <div style="color:#bbb;font-size:11px;margin-top:8px">……本当に？</div>
      </div>
    `;
    createWindow('recycle-bin', 'ゴミ箱', html, { width: 380, height: 280 });
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
    const input = document.getElementById('pw-input');
    const err   = document.getElementById('pw-error');
    modal.classList.remove('hidden');
    input.value = '';
    err.classList.add('hidden');
    setTimeout(() => input.focus(), 50);
  }

  function initPasswordModal() {
    const modal  = document.getElementById('pw-modal');
    const input  = document.getElementById('pw-input');
    const err    = document.getElementById('pw-error');
    const okBtn  = document.getElementById('pw-ok');
    const canBtn = document.getElementById('pw-cancel');

    function attempt() {
      const val = input.value.trim().toLowerCase();
      
      let unlockType = null;
      if (val.includes('3') && val.includes('key') && val.includes('5')) unlockType = 'composite';
      else if (val.includes('wake')) unlockType = 'linguistic';
      else if (val.includes('3455')) unlockType = 'math';
      else if (val.includes('93c5fd')) unlockType = 'visual';

      const ok = (unlockType !== null);
      window.LD.Logger.logPasswordAttempt(val, ok);

      if (ok) {
        modal.classList.add('hidden');
        openHiddenFolder(unlockType);
      } else {
        err.classList.remove('hidden');
        input.value = '';
        const dlg = document.getElementById('pw-dialog');
        dlg.classList.add('shake');
        setTimeout(() => dlg.classList.remove('shake'), 500);
        window.LD.Effects.checkThresholds(window.LD.Logger.getLog());
      }
    }

    okBtn.addEventListener('click', attempt);
    canBtn.addEventListener('click', () => modal.classList.add('hidden'));
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') attempt();
      if (e.key === 'Escape') modal.classList.add('hidden');
    });
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }

  // =====================================================
  // 時計
  // =====================================================
  function startClock() {
    const el = document.getElementById('clock');
    function tick() {
      const d = new Date();
      el.textContent = String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
    }
    tick();
    setInterval(tick, 1000);
  }

  // =====================================================
  // デスクトップ右クリック無効化
  // =====================================================
  function disableContextMenu() {
    document.getElementById('desktop').addEventListener('contextmenu', e => e.preventDefault());
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
      disableContextMenu();
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
    }
  };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.LD.App.init());
} else {
  window.LD.App.init();
}

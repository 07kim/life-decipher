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

  function makeStickyDraggable(el) {
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
      if (dragging && moved) window.LD.Logger.logNoteMoved();
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
      { id: 'diary-txt',     label: '日記.txt',     emoji: '📝', x: 32, y: 32,   action: openDiary },
      { id: 'voice-memos',   label: 'ボイスメモ',   emoji: '📁', x: 32, y: 148,  action: openVoiceMemos },
      { id: 'recycle-bin',   label: 'ゴミ箱',       emoji: '🗑️', x: W - 90, y: 32, action: openRecycleBin },
      { id: 'hidden-folder', label: '隠しフォルダ', emoji: '🔒', x: W - 90, y: H - 170, action: () => openPasswordModal('hidden-folder') }
    ];

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'desktop-icon' + (item.id === 'diary-txt' ? ' icon-hint-pulse' : '');
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
      makeStickyDraggable(el);
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
          ()  => { win.querySelector('#vm-nowplay').textContent = `完了: ${memo.name}`; }
        );
      });
    });

    win.querySelector('#vm-stop').addEventListener('click', () => {
      window.LD.Audio.stop();
      win.querySelector('#vm-nowplay').textContent = '再生停止中';
      win.querySelector('#vm-prog').style.width = '0%';
      currentId = null;
    });
  }

  function openHiddenFolder() {
    window.LD.Logger.logFileOpen('hidden-folder', '隠しフォルダ');
    const files = window.LD.HIDDEN_FILES;

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
        if (file) openTextFile(file);
      });
    });

    // 隠しフォルダアイコンを通常フォルダに変更
    const icon = document.querySelector('.desktop-icon[data-id="hidden-folder"] .icon-img');
    if (icon) icon.textContent = '📂';
  }

  function openTextFile(file) {
    window.LD.Logger.logFileOpen(file.id, file.name);

    const html = `
      <div class="txt-wrap">
        <pre class="txt-body">${escapeHtml(file.content)}</pre>
      </div>
    `;

    createWindow(file.id, file.name, html, { width: 520, height: 460 });

    // report.txt を開いたらゲーム終了トリガー
    if (file.trigger === 'ending') {
      setTimeout(() => window.LD.Feedback.show(window.LD.Logger.getLog()), 3500);
    }
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
      const ok  = (val === '3key5' || val === '3key005');
      window.LD.Logger.logPasswordAttempt(val, ok);

      if (ok) {
        modal.classList.add('hidden');
        openHiddenFolder();
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

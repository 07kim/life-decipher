// グリッチエフェクト・動的UX適応エンジン
// イラつき閾値に応じて段階的に世界観を壊さない範囲で介入する
window.LD = window.LD || {};

window.LD.Effects = (function () {
  const triggered = new Set();
  let glitchRafId = null;

  // ===========================
  // Lv.1: 画面ノイズグリッチ
  // ===========================
  function triggerGlitch(durationMs) {
    const desktop = document.getElementById('desktop');
    const overlay = document.getElementById('noise-overlay');
    if (!desktop || !overlay) return;

    desktop.classList.add('glitching');
    overlay.style.display = 'block';
    drawNoise(overlay, durationMs);

    setTimeout(() => {
      desktop.classList.remove('glitching');
      setTimeout(() => { overlay.style.display = 'none'; }, 200);
    }, durationMs);
  }

  function drawNoise(canvas, durationMs) {
    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    let elapsed = 0;
    const startTime = performance.now();

    function frame(now) {
      elapsed = now - startTime;
      if (elapsed > durationMs) return;

      const img = ctx.createImageData(canvas.width, canvas.height);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255 | 0;
        img.data[i]   = v;
        img.data[i+1] = v;
        img.data[i+2] = v;
        img.data[i+3] = Math.random() * 100 | 0;
      }
      ctx.putImageData(img, 0, 0);
      glitchRafId = requestAnimationFrame(frame);
    }
    glitchRafId = requestAnimationFrame(frame);
  }

  // ===========================
  // Lv.2: 隠しフォルダ明滅
  // ===========================
  function flickerHiddenFolder() {
    const icon = document.querySelector('.desktop-icon[data-id="hidden-folder"]');
    if (!icon) return;

    let count = 0;
    const iv = setInterval(() => {
      icon.style.opacity = (count % 2 === 0) ? '0.1' : '1';
      count++;
      if (count >= 12) {
        clearInterval(iv);
        icon.style.opacity = '1';
        icon.classList.add('icon-glow');
      }
    }, 140);
  }

  // ===========================
  // Lv.3: タイプライターメッセージ
  // ===========================
  function showTypewriter(message) {
    const overlay = document.getElementById('typewriter-overlay');
    const text    = document.getElementById('typewriter-text');
    if (!overlay || !text) return;

    overlay.classList.remove('hidden', 'tw-fadeout');
    text.textContent = '';

    let i = 0;
    const chars = message.split('');

    function typeNext() {
      if (i >= chars.length) {
        setTimeout(() => {
          overlay.classList.add('tw-fadeout');
          setTimeout(() => overlay.classList.add('hidden'), 800);
        }, 3200);
        return;
      }
      const ch = chars[i++];
      text.textContent += ch;
      const delay = ch === '\n' ? 450 : 50 + Math.random() * 70;
      setTimeout(typeNext, delay);
    }

    setTimeout(typeNext, 600);
  }

  // ===========================
  // 閾値チェック（クリックごとに呼ばれる）
  // ===========================
  return {
    checkThresholds(log) {
      const frustration   = window.LD.Assessment ? window.LD.Assessment.getFrustration() : 0;
      const anomaly       = log.anomalyClickCount || 0;
      const esc           = log.escCount           || 0;
      const pwFailed      = (log.passwordAttempts || []).filter(a => !a.success).length;

      // Lv.1-a: 連打が20回以上 → グリッチ
      if (anomaly >= 20 && !triggered.has('lv1a')) {
        triggered.add('lv1a');
        setTimeout(() => triggerGlitch(700), 800);
      }

      // Lv.1-b: フラストレーション15以上 → 軽めのグリッチ
      if (frustration >= 15 && !triggered.has('lv1b')) {
        triggered.add('lv1b');
        setTimeout(() => triggerGlitch(350), 1500);
      }

      // Lv.2: ESCキー5回以上 or パスワード失敗3回以上 → 隠しフォルダ明滅
      if ((esc >= 5 || pwFailed >= 3) && !triggered.has('lv2')) {
        triggered.add('lv2');
        setTimeout(() => {
          triggerGlitch(300);
          setTimeout(() => flickerHiddenFolder(), 400);
        }, 600);
      }

      // Lv.1-c: フラストレーション30以上 → もう一度グリッチ（強め）
      if (frustration >= 30 && !triggered.has('lv1c')) {
        triggered.add('lv1c');
        setTimeout(() => triggerGlitch(1000), 500);
      }
    },

    // Lv.3: 5分間アイドル → タイプライター
    triggerLevel3() {
      if (triggered.has('lv3')) return;
      triggered.add('lv3');
      triggerGlitch(400);
      setTimeout(() => {
        showTypewriter('迷っているのか？\n\n……大丈夫。\nみんな、そうする。');
      }, 1000);
    },

    // 外部から直接呼び出せるよう公開
    triggerGlitch,
    showTypewriter
  };
})();

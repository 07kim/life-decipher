// フィードバック生成・表示モジュール
// ゲーム終了時にプレイヤーの分析レポートを表示する
window.LD = window.LD || {};

window.LD.Feedback = (function () {

  // ===========================
  // パーソナリティ評価文生成
  // ===========================
  function buildProfiles(scores) {
    return [
      buildProfile('カオス耐性', scores.chaos, [
        [70, '高', '目的のない状況でも動揺せず、自分のペースで探索を続けました。曖昧さの中に可能性を見出せるタイプです。'],
        [40, '中', '一時的な迷いや焦りは見せましたが、最終的には自分の道を切り開きました。'],
        [ 0, '低', '「指示がない」という状況に強いストレスを感じていました。明確なゴールがある環境で力を発揮するタイプです。']
      ]),
      buildProfile('知的開放性', scores.openness, [
        [70, '高', '黒塗りのテキスト、ノイズ混じりの音声——それでも諦めず「何かがある」と信じて掘り続けました。謎の前で燃えるタイプです。'],
        [40, '中', '気になる部分は調べましたが、すべての謎に執着するわけではありませんでした。バランス型の探索者です。'],
        [ 0, '低', '不明瞭な情報への深入りより、明確な手がかりを優先する傾向があります。実用的な判断力を持つタイプです。']
      ]),
      buildProfile('系統的探索', scores.conscientiousness, [
        [70, '高', 'ファイルを1つひとつ確認していく、網羅的で几帳面な探索スタイルでした。「見落とし」が許せないタイプです。'],
        [40, '中', '興味を引くものから順に調べる、直感先行型の探索スタイルでした。'],
        [ 0, '低', 'いくつかの手がかりに絞って深く掘り下げました。選択と集中型の思考者です。']
      ]),
      buildProfile('論理・数理思考', scores.math, [
        [60, '高', '隠された数理的パターンを素早く見抜く力があります。感情より論理を信じるタイプです。'],
        [30, '中', '数字の規則性にある程度気づき、論理的なアプローチを試みました。'],
        [ 0, '低', '計算や論理の組み立てよりも、直感やひらめきを重視するタイプです。']
      ]),
      buildProfile('空間・視覚認知', scores.spatial, [
        [60, '高', '画面上のオブジェクトの配置や断片的な視覚情報を繋ぎ合わせる、高い空間認識能力を持っています。'],
        [30, '中', '視覚的な手がかりに気づき、配置を意識した探索を行いました。'],
        [ 0, '低', '視覚情報よりも、言語情報や論理的な手がかりを優先するタイプです。']
      ]),
      buildProfile('言語・文脈理解', scores.linguistic, [
        [60, '高', 'テキストの細かな違和感や文脈のズレを察知する、高い言語的感性を持っています。'],
        [30, '中', '文章の中に隠された意味をある程度読み取る力があります。'],
        [ 0, '低', 'テキストの深読みよりも、直感的な情報処理を好むタイプです。']
      ]),
      buildProfile('情報統合力', scores.integration, [
        [60, '高', '散らばった断片的な情報を一つの結論に結びつける、高いメタ認知能力を持っています。'],
        [30, '中', '複数の情報を関連付けようとする努力が見られました。'],
        [ 0, '低', '目の前の単一の課題に集中する傾向があり、情報を広く結びつけるのは苦手かもしれません。']
      ]),
      buildProfile('没入深度', scores.immersion, [
        [70, '深', '物語世界に完全に引き込まれていました。隠しフォルダへの挑戦がその証拠です。'],
        [40, '中', '一定の没入感を保ちながらも、どこかで「これは体験だ」という冷静さも持ち合わせていました。'],
        [ 0, '浅', '観察者の立場を保ちながら、客観的に体験を楽しみました。']
      ])
    ];
  }

  function buildProfile(label, score, tiers) {
    for (const [threshold, grade, desc] of tiers) {
      if (score >= threshold) return { label, grade, score, desc };
    }
    return { label, grade: '—', score, desc: '' };
  }

  // ===========================
  // 行動ナレーション生成
  // ===========================
  function buildNarrative(logData, scores) {
    const min = Math.floor(logData.elapsedMs / 60000);
    const sec = Math.floor((logData.elapsedMs % 60000) / 1000);
    const timeStr = min > 0 ? `${min}分${sec}秒` : `${sec}秒`;
    const audioTotal = logData.audioPlays || 0;
    const pwFail = logData.passwordAttempts.filter(a => !a.success).length;

    let lines = [];
    lines.push(`総プレイ時間： ${timeStr}`);
    lines.push(`開封ファイル数： ${logData.totalFilesOpened.size} 件`);
    lines.push('');

    if (logData.fileOpenOrder && logData.fileOpenOrder.length > 0) {
      const first = logData.fileOpenOrder[0];
      const sec0 = Math.floor(first.time / 1000);
      lines.push(`最初に手を伸ばしたのは「${first.name}」でした（開始から ${sec0} 秒後）。`);
    } else {
      lines.push('あなたはしばらくの間、何も開かずにデスクトップを眺め続けていました。');
    }

    if (logData.anomalyClickCount >= 10) {
      lines.push(`画面への連打が合計 ${logData.anomalyClickCount} 回検出されました。焦りと闘っていたようです。`);
    }

    if (logData.scrollAttempts >= 3) {
      lines.push(`黒塗り部分へのアクセスが ${logData.scrollAttempts} 回記録されました。その執重さが、答えへの扉を開きました。`);
    }

    if (audioTotal > 0) {
      lines.push(`音声を合計 ${audioTotal} 回再生しました。${(logData.audioStops || 0) > 0 ? 'しかし途中で何度も打ち切るなど、最後まで耳を傾ける余裕はなかったようです。' : '最後まで静かに聴き入っていました。'}`);
    }

    if (logData.escCount > 0) {
      const suffix = logData.escCount >= 5 ? '——しかし、諦めませんでした。' : '';
      lines.push(`「Escape」キーを ${logData.escCount} 回押しました。${suffix}`);
    }

    const noteDrags = logData.noteDrags || { red: 0, yellow: 0, blue: 0 };
    const noteTotal = (noteDrags.red || 0) + (noteDrags.yellow || 0) + (noteDrags.blue || 0);
    if (noteTotal > 0) {
      let fav = 'すべて';
      if (noteDrags.red > noteDrags.yellow && noteDrags.red > noteDrags.blue) fav = '赤い付箋（核心となるヒント）';
      else if (noteDrags.yellow > noteDrags.red && noteDrags.yellow > noteDrags.blue) fav = '黄色い付箋（物語の断片）';
      else if (noteDrags.blue > noteDrags.red && noteDrags.blue > noteDrags.yellow) fav = '青い付箋（システム情報）';
      lines.push(`付箋を ${noteTotal} 回動かしました。特に${fav}に執着し、カオスに秩序を与えようとする傾向が見られました。`);
    }

    if (logData.passwordAttempts.length > 0) {
      const type = logData.unlockType || 'none';
      if (type === 'composite') lines.push(`散らばった複数の情報を正しく組み合わせ、『3key5』を導き出し真相へ到達しました。`);
      else if (type === 'linguistic') lines.push(`日記に隠された縦読みの暗号に気づき、『wake』を入力。細かな言語的違和感を見逃しませんでした。`);
      else if (type === 'math') lines.push(`数列の規則性を見抜き、『3455』を入力。混沌の中でも論理を信じ抜く強さを見せました。`);
      else if (type === 'visual') lines.push(`付箋の番号順に並んだカラーコードの末尾を繋ぎ合わせ、『a5acfd』を導き出しました。ゲームの枠外からシステムを俯瞰する、極めて高いメタ認知能力の証明です。`);
      else lines.push(`隠しフォルダに ${pwFail} 回挑みましたが、まだ鍵は閉ざされています。`);
    }

    return lines.join('\n');
  }

  // ===========================
  // レーダーチャート描画
  // ===========================
  function drawRadar(canvas, scores) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const R  = Math.min(cx, cy) - 48;
    const N  = 8;
    const labels = ['カオス耐性', '知的開放性', '系統的探索', '数理思考', '空間・視覚', '言語・文脈', '情報統合力', '没入深度'];
    const values = [
      scores.chaos             / 100,
      scores.openness          / 100,
      scores.conscientiousness / 100,
      scores.math              / 100,
      scores.spatial           / 100,
      scores.linguistic        / 100,
      scores.integration       / 100,
      scores.immersion         / 100
    ];

    ctx.clearRect(0, 0, W, H);

    // グリッドリング
    for (let ring = 1; ring <= 5; ring++) {
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * Math.PI * 2 - Math.PI / 2;
        const r = (ring / 5) * R;
        const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(90,110,150,${ring === 5 ? 0.5 : 0.2})`;
      ctx.lineWidth = ring === 5 ? 1.5 : 1;
      ctx.stroke();
    }

    // 軸線
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
      ctx.strokeStyle = 'rgba(90,110,150,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // データ面
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const a = ((i % N) / N) * Math.PI * 2 - Math.PI / 2;
      const r = values[i % N] * R;
      const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.fillStyle   = 'rgba(59,130,246,0.22)';
    ctx.strokeStyle = 'rgba(59,130,246,0.85)';
    ctx.lineWidth   = 2.5;
    ctx.fill();
    ctx.stroke();

    // ドット
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2;
      const r = values[i] * R;
      ctx.beginPath();
      ctx.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59,130,246,1)';
      ctx.fill();
    }

    // ラベル
    ctx.font      = '11px "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif';
    ctx.fillStyle = '#334155';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2;
      const r = R + 34;
      ctx.fillText(labels[i], cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
  }

  // ===========================
  // HTML 生成・表示
  // ===========================
  function buildGradeClass(grade) {
    const map = { '高': 'grade-high', '深': 'grade-high', '中': 'grade-mid', '低': 'grade-low', '浅': 'grade-low' };
    return map[grade] || 'grade-mid';
  }

  function getRouteLabel(unlockType) {
    const map = {
      composite:  '🔗 複合・情報統合型',
      linguistic: '📜 言語・暗号解読型',
      math:       '🧠 数理・論理思考型',
      visual:     '👁️ 視覚・メタ認知型',
      none:       '❓ 未解決'
    };
    return map[unlockType || 'none'] || '❓ 未解決';
  }

  function getFrustrationText(frustration) {
    if (frustration >= 15) return 'レベル：高　ESC連打・クリック連打・ウィンドウを閉じる行動が複数検出されました。カオスに強いストレスを感じるタイプです。';
    if (frustration >= 5)  return 'レベル：中　数回の戸惑いや苛立ちが見られました。';
    return 'レベル：低　落ち着いたペースで探索できていました。';
  }

  return {
    show(logData, isShortcut = false) {
      // 暗転divを削除しておく（演出の残骸が残らないように）
      document.querySelectorAll('div[style*="z-index: 9700"]').forEach(el => el.remove());

      // エンディング到達時（ショートカット以外）なら、デスクトップに分析レポートアイコンを出現させる
      if (!isShortcut) {
        const reportIcon = document.getElementById('analysis-report');
        if (reportIcon) {
          reportIcon.style.display = 'flex';
          // 少し光らせる演出
          reportIcon.classList.add('icon-glow');
          setTimeout(() => reportIcon.classList.remove('icon-glow'), 5000);
        }
      }

      let scores;
      try {
        scores = window.LD.Assessment.calculateFinal(logData);
      } catch(e) {
        scores = { chaos: 50, openness: 30, conscientiousness: 30, math: 30, spatial: 30, linguistic: 30, integration: 30, immersion: 20, frustration: 0 };
      }

      let profiles, narrative;
      try {
        profiles  = buildProfiles(scores);
        narrative = buildNarrative(logData, scores);
      } catch(e) {
        profiles  = [];
        narrative = 'データ取得中にエラーが発生しました。';
      }

      const screen = document.getElementById('feedback-screen');
      if (!screen) return;

      const frustration = scores.frustration || 0;
      const frustPct    = Math.min(100, Math.round(frustration));
      const unlockType  = logData.unlockType || 'none';

      screen.innerHTML = `
        <div id="fb-wrap">
          <div id="fb-header">
            <div id="fb-logo">LIFE DECIPHER</div>
            <div id="fb-subtitle">— Behavioral Assessment Report —</div>
          </div>

          <div id="fb-body">
            <div id="fb-left">
              <section class="fb-section">
                <h2 class="fb-section-title">▎ あなたの探索の軌跡</h2>
                <div id="fb-narrative">${narrative.replace(/\n/g, '<br>')}</div>
              </section>
              <section class="fb-section">
                <h2 class="fb-section-title">▎ パーソナリティ診断</h2>
                <div id="fb-profiles">
                  ${profiles.map(p => `
                    <div class="fb-profile">
                      <div class="fb-profile-head">
                        <span class="fb-profile-label">${p.label}</span>
                        <span class="fb-grade ${buildGradeClass(p.grade)}">${p.grade}</span>
                        <span class="fb-score-val">${Math.round(p.score)}</span>
                      </div>
                      <div class="fb-bar-wrap"><div class="fb-bar" style="width:${Math.round(p.score)}%"></div></div>
                      <div class="fb-profile-desc">${p.desc}</div>
                    </div>
                  `).join('')}
                </div>
              </section>
            </div>

            <div id="fb-right">
              <section class="fb-section">
                <h2 class="fb-section-title">▎ 5軸分析レーダー</h2>
                <canvas id="radar-canvas" width="300" height="300"></canvas>
              </section>

              <section class="fb-section">
                <h2 class="fb-section-title">▎ ストレス・苛立ち指数</h2>
                <div class="fb-frustration-wrap">
                  <div class="fb-frustration-bar-bg">
                    <div class="fb-frustration-bar" style="width:${frustPct}%"></div>
                  </div>
                  <div class="fb-frustration-label">${getFrustrationText(frustration)}</div>
                </div>
              </section>

              <section class="fb-section">
                <h2 class="fb-section-title">▎ 解読ルート</h2>
                <div class="fb-route-badge">
                  ${getRouteLabel(unlockType)}
                </div>
              </section>
            </div>
          </div>

          <div id="fb-meta">
            <p>このシステムそのものが、被験者Xの設計した実験でした。</p>
            <p>あなたは今、実験の被験者として記録されました。</p>
            <p class="fb-meta-small">— Project LD Ver.2.1 —</p>
          </div>

          <div id="fb-footer">
            <button id="fb-replay-btn">もう一度プレイ</button>
            <button id="fb-close-btn">画面を閉じる</button>
          </div>
        </div>
      `;

      screen.classList.remove('hidden');

      setTimeout(() => {
        const canvas = document.getElementById('radar-canvas');
        if (canvas) drawRadar(canvas, scores);

        const closeBtn = document.getElementById('fb-close-btn');
        if (closeBtn) closeBtn.addEventListener('click', () => {
          screen.classList.add('hidden');
        });

        const replayBtn = document.getElementById('fb-replay-btn');
        if (replayBtn) replayBtn.addEventListener('click', () => location.reload());
      }, 150);
    }
  };
})();

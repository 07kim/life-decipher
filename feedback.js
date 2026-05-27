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
        [40, '中', '気になる部分は調べましたが、すべての謎に執重するわけではありませんでした。バランス型の探索者です。'],
        [ 0, '低', '不明瞭な情報への深入りより、明確な手がかりを優先する傾向があります。実用的な判断力を持つタイプです。']
      ]),
      buildProfile('系統的探索', scores.conscientiousness, [
        [70, '高', 'ファイルを1つひとつ確認していく、網羅的で几帳面な探索スタイルでした。「見落とし」が許せないタイプです。'],
        [40, '中', '興味を引くものから順に調べる、直感先行型の探索スタイルでした。'],
        [ 0, '低', 'いくつかの手がかりに絞って深く掘り下げました。選択と集中型の思考者です。']
      ]),
      buildProfile('プランニング能力', scores.planning, [
        [60, '高', '散らばった要素を自らの手で整理しようとしました。カオスを「コントロールしたい」という本能が強いタイプです。'],
        [30, '中', '環境の変化に応じて柔軟に行動を調整しました。'],
        [ 0, '低', '与えられた環境をそのまま受け入れて探索しました。適応力の高いタイプです。']
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
    const audioTotal = Object.values(logData.audioReplays).reduce((a, b) => a + b, 0);
    const pwFail = logData.passwordAttempts.filter(a => !a.success).length;
    const pwOk   = logData.passwordAttempts.some(a => a.success);

    let lines = [];
    lines.push(`総プレイ時間： ${timeStr}`);
    lines.push(`開封ファイル数： ${logData.totalFilesOpened.size} 件`);
    lines.push('');

    if (logData.fileOpenOrder.length > 0) {
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
      lines.push(`ノイズ混じりの音声を合計 ${audioTotal} 回再生しました。その向こうに何かを聞こうとしていました。`);
    }

    if (logData.escCount > 0) {
      const suffix = logData.escCount >= 5 ? '——しかし、諦めませんでした。' : '';
      lines.push(`「Escape」キーを ${logData.escCount} 回押しました。${suffix}`);
    }

    if (logData.notesMoved > 0) {
      lines.push(`デスクトップの付箋を ${logData.notesMoved} 回移動させました。カオスに秩序を与えようとする本能が働きました。`);
    }

    if (logData.passwordAttempts.length > 0) {
      if (pwOk) {
        lines.push(`${pwFail > 0 ? pwFail + ' 回の失敗の末、' : ''}隠しフォルダの鍵を解きました。`);
      } else {
        lines.push(`隠しフォルダに ${logData.passwordAttempts.length} 回挑みましたが、まだ鍵は閉ざされています。`);
      }
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
    const N  = 5;
    const labels = ['カオス耐性', '開放性', '系統性', 'プランニング', '没入深度'];
    const values = [
      scores.chaos             / 100,
      scores.openness          / 100,
      scores.conscientiousness / 100,
      scores.planning          / 100,
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
    ctx.font      = '12px "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif';
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

  return {
    show(logData) {
      const scores   = window.LD.Assessment.calculateFinal(logData);
      const profiles = buildProfiles(scores);
      const narrative = buildNarrative(logData, scores);

      const screen = document.getElementById('feedback-screen');
      if (!screen) return;

      screen.innerHTML = `
        <div id="fb-wrap">
          <div id="fb-header">
            <div id="fb-logo">LIFE DECIPHER</div>
            <div id="fb-subtitle">— Assessment Report —</div>
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
                      <div class="fb-profile-desc">${p.desc}</div>
                    </div>
                  `).join('')}
                </div>
              </section>
            </div>

            <div id="fb-right">
              <section class="fb-section">
                <h2 class="fb-section-title">▎ 5軸分析</h2>
                <canvas id="radar-canvas" width="300" height="300"></canvas>
              </section>
            </div>
          </div>

          <div id="fb-meta">
            <p>このシステムそのものが、被験者Xの設計した実験でした。</p>
            <p>あなたは今、実験の被験者として記録されました。</p>
            <p class="fb-meta-small">— Project LD Ver.2.1 —</p>
          </div>

          <div id="fb-footer">
            <button id="fb-close-btn">画面を閉じる</button>
          </div>
        </div>
      `;

      screen.classList.remove('hidden');

      setTimeout(() => {
        const canvas = document.getElementById('radar-canvas');
        if (canvas) drawRadar(canvas, scores);

        document.getElementById('fb-close-btn').addEventListener('click', () => {
          screen.classList.add('hidden');
        });
      }, 120);
    }
  };
})();

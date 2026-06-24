// フィードバック生成・表示モジュール
// ゲーム終了時にプレイヤーの分析レポートを表示する
window.LD = window.LD || {};

window.LD.Feedback = (function () {

  // ===========================
  // タイプ名生成
  // ===========================
  function buildTypeName(scores) {
    const axes = [
      'chaos', 'openness', 'conscientiousness', 'math',
      'spatial', 'linguistic', 'integration', 'immersion', 'info_seeking'
    ];
    const sorted = axes
      .map(k => ({ key: k, val: scores[k] || 0 }))
      .sort((a, b) => b.val - a.val);
    const top = sorted[0].key;
    const sub = sorted[1].key;

    const typeTable = {
      'immersion+linguistic':         { name: '物語の住人',          tagline: '虚構と現実の境界が溶けていく' },
      'immersion+math':               { name: '没入した計算者',        tagline: '深みの中でも数字は揺れない' },
      'immersion+info_seeking':       { name: '深淵の探偵',           tagline: '潜れば潜るほど謎が増える' },
      'immersion+chaos':              { name: '嵐の目の中の観察者',    tagline: '混沌を住み家とした者' },
      'math+integration':             { name: '設計者',               tagline: '全ては計算通り' },
      'math+linguistic':              { name: '暗号解読者',            tagline: '言葉の中の論理を見抜く' },
      'math+conscientiousness':       { name: '几帳面な論理家',        tagline: '手順を踏む者が真実に近づく' },
      'math+spatial':                 { name: '空間数学者',            tagline: 'パターンは幾何学の中にある' },
      'linguistic+math':              { name: '言葉の分析者',          tagline: '文章は暗号、文字は数式' },
      'linguistic+conscientiousness': { name: '丁寧な読書家',          tagline: '見落としは、しない' },
      'linguistic+openness':          { name: '好奇心旺盛な解読者',    tagline: '意味を問い続ける者' },
      'linguistic+immersion':         { name: '語り部',                tagline: '記憶の中に真実がある' },
      'chaos+openness':               { name: '漂流者',                tagline: 'どこへ向かうかは決めない' },
      'chaos+linguistic':             { name: '静かな観察者',           tagline: '混沌を眺める目' },
      'chaos+immersion':              { name: '境界の越境者',           tagline: '枠組みそのものを疑う' },
      'conscientiousness+math':       { name: '体系的探索者',           tagline: '一つひとつ、確実に' },
      'conscientiousness+linguistic': { name: '几帳面な文書係',         tagline: 'ファイルは全て開かれた' },
      'conscientiousness+integration':{ name: '綿密な統合者',           tagline: '全ての断片に意味がある' },
      'spatial+integration':          { name: '空間の設計者',           tagline: '見えない構造を視る' },
      'spatial+openness':             { name: '視覚の旅人',             tagline: '形が言葉より早く語る' },
      'info_seeking+linguistic':      { name: '情報の網',               tagline: 'あらゆる声に耳を傾ける' },
      'info_seeking+integration':     { name: '全知の探偵',             tagline: 'データが揃えば答えが見える' },
      'info_seeking+openness':        { name: 'アクティブ・コレクター',  tagline: '情報は自ら取りに行くもの' },
      'integration+math':             { name: '統合思考者',             tagline: '点と点が線になる瞬間を知っている' },
      'integration+spatial':          { name: '全体像の把握者',         tagline: '森を見て、木も見る' },
      'openness+chaos':               { name: '未知への挑戦者',         tagline: '答えのない問いを愛する' },
      'openness+info_seeking':        { name: '探究者',                 tagline: '知ることに終わりはない' },
    };

    const key1 = `${top}+${sub}`;
    const key2 = `${sub}+${top}`;
    return typeTable[key1] || typeTable[key2] || { name: '未分類の探索者', tagline: 'あなたは新しいパターンを描いた' };
  }

  // ===========================
  // エンディングメッセージ生成
  // ===========================
  function buildEndingMessage(logData, routeOverride) {
    const goals = logData.goalsReached || [];
    const unlockType = logData.unlockType || 'none';

    if (routeOverride === 'shutdown') {
      return {
        headline: 'あなたは実験を拒否した。',
        body: 'しかし、この記録はすでに外部サーバーへ転送されています。シャットダウンは——終わりではなかった。'
      };
    }
    if (goals.includes('recycle-restore-all')) {
      return {
        headline: '削除されたものが、戻ってきた。',
        body: 'あなたはXが隠そうとしたものを復元した。断片が揃い、物語の輪郭が見えてきた。'
      };
    }
    if (goals.includes('twitx-reply')) {
      return {
        headline: 'あなたはXに返信した。',
        body: 'その言葉は記録された。@watcher_0 が誰なのかは、まだわからない。でも、あなたの声は届いた。'
      };
    }
    if (goals.includes('mail-report')) {
      return {
        headline: '報告書が送信された。',
        body: '実験の外へ情報を持ち出した。それが何を変えるかは、誰にもわからない。あなたは最初に動いた者だ。'
      };
    }
    if (unlockType === 'composite') {
      return {
        headline: '全ての断片が繋がった。',
        body: 'Xの実験の全貌が見えた。それは、あなたを被験者にするための罠だったのか——それとも、あなたを解放するための地図だったのか。'
      };
    }
    if (unlockType === 'linguistic') {
      return {
        headline: '言葉の中に真実があった。',
        body: 'あなたは文字の行間を読んだ。Xが日記に残したパターンに気づいた者だけが、この扉を開けられる。'
      };
    }
    if (unlockType === 'math') {
      return {
        headline: 'パターンは嘘をつかない。',
        body: '数字の規則性があなたを導いた。感情ではなく論理——それがXの設計した「正解」だった。'
      };
    }
    if (unlockType === 'visual') {
      return {
        headline: '色が、鍵だった。',
        body: '画面上に散らばった視覚情報を繋いだ。あなたの目は、言葉より速く真実を見抜いた。'
      };
    }
    return {
      headline: 'システムは記録を完了した。',
      body: 'あなたの行動のすべてが、データとして残されている。Xが設計したこの実験は——今も続いている。'
    };
  }

  // ===========================
  // 行動タイムライン生成
  // ===========================
  function buildTimeline(logData) {
    const events = [];

    if (logData.fileOpenOrder && logData.fileOpenOrder.length > 0) {
      logData.fileOpenOrder.forEach(f => {
        events.push({ time: f.time, label: `「${f.name}」を開いた` });
      });
    }

    if (logData.browserSearches && logData.browserSearches.length > 0) {
      logData.browserSearches.slice(0, 3).forEach(s => {
        events.push({ time: s.time, label: `「${s.q.slice(0, 20)}」を検索した` });
      });
    }

    if (logData.twitxDmSent) {
      events.push({ time: (logData.twitxMessages || []).length * 1000, label: 'TwitXでメッセージを送信した' });
    }

    if (logData.mailDraftSent) {
      events.push({ time: 0, label: '外部への報告書を送信した' });
    }

    if (logData.goalsReached) {
      logData.goalsReached.forEach(g => {
        const labels = {
          'twitx-reply':         '@watcher_0 に返信した',
          'mail-report':         '報告書を送信した',
          'recycle-restore-all': '全削除ファイルを復元した',
          'shutdown':            'シャットダウンを実行した'
        };
        if (labels[g]) events.push({ time: 99999999, label: `[ゴール] ${labels[g]}` });
      });
    }

    if (logData.systemUnlocked && logData.unlockType) {
      const routeNames = {
        composite: '複合ルート', linguistic: '言語ルート',
        math: '数理ルート', visual: '視覚ルート'
      };
      events.push({ time: 99999990, label: `[解錠] ${routeNames[logData.unlockType] || logData.unlockType}でシステムフォルダを解錠` });
    }

    events.sort((a, b) => a.time - b.time);

    if (events.length === 0) return '<div style="color:#999;font-size:11px;">行動記録がありません。</div>';

    return events.map(ev => {
      const ms = ev.time;
      const min = Math.floor(ms / 60000);
      const sec = Math.floor((ms % 60000) / 1000);
      const timeStr = min > 0 ? `${min}:${String(sec).padStart(2,'0')}` : `0:${String(sec).padStart(2,'0')}`;
      const isGoal = ev.label.startsWith('[');
      return `<div class="fb-timeline-item ${isGoal ? 'fb-timeline-goal' : ''}">
        <span class="fb-timeline-time">${timeStr}</span>
        <span class="fb-timeline-label">${ev.label}</span>
      </div>`;
    }).join('');
  }

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
      ]),
      buildProfile('情報収集力', scores.info_seeking, [
        [70, '高', 'SNS・メール・ニュースと多様な情報源を横断しました。人や社会との繋がりの中に手がかりを求める、アクティブな情報収集者です。'],
        [40, '中', 'いくつかの外部情報に目を向けました。必要と感じた情報を適切に取りに行く、実用的なスタイルです。'],
        [ 0, '低', 'ブラウザをあまり使わず、手元の情報だけで探索を進めました。外部への依存なく自己完結できるタイプです。']
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
  // ゲーム行動タブ生成
  // ===========================
  function buildGameTab(logData) {
    const gr = (logData.gameResults) || { g2048: [], sweep: [], typing: [] };
    const played2048  = gr.g2048.length  > 0;
    const playedSweep = gr.sweep.length  > 0;
    const playedTyp   = gr.typing.length > 0;

    if (!played2048 && !playedSweep && !playedTyp) {
      return '<div class="fb-game-empty">ゲームを1つもプレイしていません。</div>';
    }

    let html = '';

    // 2048セクション
    if (played2048) {
      const best = gr.g2048.reduce((a, r) => r.score > a.score ? r : a, gr.g2048[0]);
      const avg  = Math.round(gr.g2048.reduce((a, r) => a + r.score, 0) / gr.g2048.length);
      const eff  = best.moveCount > 0 ? Math.round(best.score / best.moveCount) : 0;
      const won  = gr.g2048.some(r => r.won);
      html += `
        <div class="fb-game-section">
          <div class="fb-game-title">🔢 2048</div>
          <div class="fb-game-meta">プレイ回数: ${gr.g2048.length}回</div>
          <div class="fb-game-stats-grid">
            <div class="fb-game-stat"><div class="fb-game-stat-val">${best.score.toLocaleString()}</div><div class="fb-game-stat-lbl">最高スコア</div></div>
            <div class="fb-game-stat"><div class="fb-game-stat-val">${best.bestTile}</div><div class="fb-game-stat-lbl">最大タイル</div></div>
            <div class="fb-game-stat"><div class="fb-game-stat-val">${best.moveCount}</div><div class="fb-game-stat-lbl">最多手数</div></div>
            <div class="fb-game-stat"><div class="fb-game-stat-val">${eff}</div><div class="fb-game-stat-lbl">手数効率</div></div>
          </div>
          <div class="fb-game-analysis">
            ${won ? '<div class="fb-game-badge fb-badge-win">2048達成</div>' : ''}
            ${eff > 100 ? '<p>手数あたりのスコアが高い。無駄のない操作スタイルです。</p>' : eff > 40 ? '<p>手堅く着実に得点を重ねるスタイルでした。</p>' : '<p>試行錯誤しながら手を探る、実験的な操作スタイルでした。</p>'}
            ${avg < best.score * 0.5 ? '<p>回によってスコアのムラが大きく、アプローチを都度変えていたことが伺えます。</p>' : ''}
          </div>
        </div>`;
    }

    // マインスイーパーセクション
    if (playedSweep) {
      const best  = gr.sweep.reduce((a, r) => r.elapsed > 0 && (a.elapsed === 0 || r.elapsed < a.elapsed) ? r : a, gr.sweep[0]);
      const won   = gr.sweep.some(r => r.won);
      const avgFR = Math.round(gr.sweep.reduce((a, r) => a + r.flagRatio, 0) / gr.sweep.length);
      const wc    = gr.sweep.reduce((a, r) => a + r.wildClicks, 0);
      html += `
        <div class="fb-game-section">
          <div class="fb-game-title">💣 マインスイーパー</div>
          <div class="fb-game-meta">プレイ回数: ${gr.sweep.length}回</div>
          <div class="fb-game-stats-grid">
            <div class="fb-game-stat"><div class="fb-game-stat-val">${best.elapsed}s</div><div class="fb-game-stat-lbl">最短タイム</div></div>
            <div class="fb-game-stat"><div class="fb-game-stat-val">${avgFR}%</div><div class="fb-game-stat-lbl">平均フラグ率</div></div>
            <div class="fb-game-stat"><div class="fb-game-stat-val">${wc}</div><div class="fb-game-stat-lbl">無フラグ連打</div></div>
            <div class="fb-game-stat"><div class="fb-game-stat-val">${won ? '✓' : '✗'}</div><div class="fb-game-stat-lbl">クリア</div></div>
          </div>
          <div class="fb-game-analysis">
            ${won ? '<div class="fb-game-badge fb-badge-win">クリア達成</div>' : ''}
            ${avgFR >= 60 ? '<p>フラグを積極的に使い、地雷を先に特定してから進む慎重な戦略。</p>' : avgFR >= 30 ? '<p>フラグと直感を組み合わせた中間スタイル。</p>' : '<p>フラグをほとんど使わず直感で開いていく、大胆な進め方でした。</p>'}
            ${wc > 5 ? '<p>フラグなしでの連続クリックが多く、リスクを厭わない行動傾向が見られます。</p>' : ''}
          </div>
        </div>`;
    }

    // タイピングセクション
    if (playedTyp) {
      const last  = gr.typing[gr.typing.length - 1];
      const best  = gr.typing.reduce((a, r) => r.avgWPM > a.avgWPM ? r : a, gr.typing[0]);
      const wpmVar = last.rounds && last.rounds.length > 1
        ? Math.round(Math.sqrt(last.rounds.reduce((a, r) => a + Math.pow(r.wpm - last.avgWPM, 2), 0) / last.rounds.length))
        : 0;
      html += `
        <div class="fb-game-section">
          <div class="fb-game-title">⌨️ タイピング</div>
          <div class="fb-game-meta">プレイ回数: ${gr.typing.length}回</div>
          <div class="fb-game-stats-grid">
            <div class="fb-game-stat"><div class="fb-game-stat-val">${best.avgWPM}</div><div class="fb-game-stat-lbl">最高WPM</div></div>
            <div class="fb-game-stat"><div class="fb-game-stat-val">${last.accuracy}%</div><div class="fb-game-stat-lbl">最終精度</div></div>
            <div class="fb-game-stat"><div class="fb-game-stat-val">${last.totalErrors || 0}</div><div class="fb-game-stat-lbl">総ミス数</div></div>
            <div class="fb-game-stat"><div class="fb-game-stat-val">${wpmVar}</div><div class="fb-game-stat-lbl">WPMムラ</div></div>
          </div>
          <div class="fb-game-analysis">
            ${best.avgWPM >= 80 ? '<div class="fb-game-badge fb-badge-win">高速タイパー</div>' : ''}
            ${last.accuracy >= 95 ? '<p>非常に高い精度。ミスを丁寧に修正しながら打つ、完璧主義的なスタイル。</p>' : last.accuracy >= 80 ? '<p>スピードと精度のバランスを取りながら入力していました。</p>' : '<p>スピード優先で打ち間違いを気にしない、勢いのある入力スタイル。</p>'}
            ${wpmVar > 20 ? '<p>文章ごとにペースが大きく変動。得意な入力パターンとそうでないものが分かれています。</p>' : wpmVar > 5 ? '<p>安定したリズムで入力していました。' : '<p>各文章をほぼ均一なペースでこなす、一定のリズム感があります。</p>'}
          </div>
        </div>`;
    }

    return html;
  }

  // ===========================
  // レーダーチャート描画
  // ===========================
  function drawRadar(canvas, scores) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const R  = Math.min(cx, cy) - 48;
    const labels = ['カオス耐性', '知的開放性', '系統的探索', '論理・数理', '空間認知', '言語理解', '情報統合', '没入深度', '情報収集'];
    const keys   = ['chaos', 'openness', 'conscientiousness', 'math', 'spatial', 'linguistic', 'integration', 'immersion', 'info_seeking'];
    const N = 9;
    const values = keys.map(k => (scores[k] || 0) / 100);

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
    ctx.font      = '10px "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif';
    ctx.fillStyle = '#334155';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2;
      const r = R + 32;
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
    show(logData, isShortcut = false, routeOverride = null) {
      // 暗転divを削除しておく（演出の残骸が残らないように）
      document.querySelectorAll('div[style*="z-index: 9700"]').forEach(el => el.remove());

      // エンディング到達時（ショートカット以外）なら、デスクトップに分析レポートアイコンを出現させる
      if (!isShortcut) {
        const reportIcon = document.getElementById('analysis-report');
        if (reportIcon) {
          reportIcon.style.display = 'flex';
          reportIcon.classList.add('icon-glow');
          setTimeout(() => reportIcon.classList.remove('icon-glow'), 5000);
        }
      }

      let scores;
      try {
        scores = window.LD.Assessment.calculateFinal(logData);
      } catch(e) {
        scores = { chaos: 50, openness: 30, conscientiousness: 30, math: 30, spatial: 30, linguistic: 30, integration: 30, immersion: 20, info_seeking: 20, frustration: 0 };
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

      const typeInfo  = buildTypeName(scores);
      const endingMsg = buildEndingMessage(logData, routeOverride);
      const timeline  = buildTimeline(logData);
      const gameTab   = buildGameTab(logData);

      const goalsReached = logData.goalsReached || [];
      const goalBadges = [
        ...(logData.systemUnlocked ? [`<div class="fb-goal-badge fb-goal-unlock">🔓 システム解錠 (${logData.unlockType || '?'})</div>`] : []),
        ...goalsReached.map(g => {
          const labels = {
            'twitx-reply':         '💬 Xへの返信',
            'mail-report':         '📧 外部報告',
            'recycle-restore-all': '🗑️ 全ファイル復元',
            'shutdown':            '⏻ シャットダウン'
          };
          return `<div class="fb-goal-badge">${labels[g] || g}</div>`;
        })
      ].join('');

      screen.innerHTML = `
        <div id="fb-wrap">
          <div id="fb-header">
            <div id="fb-logo">LIFE DECIPHER</div>
            <div id="fb-subtitle">— Behavioral Assessment Report —</div>
          </div>

          <div id="fb-type-banner">
            <div id="fb-type-name">${typeInfo.name}</div>
            <div id="fb-type-tagline">${typeInfo.tagline}</div>
          </div>

          <div id="fb-ending-msg">
            <div id="fb-ending-headline">${endingMsg.headline}</div>
            <div id="fb-ending-body">${endingMsg.body}</div>
          </div>

          <div id="fb-tabs">
            <button class="fb-tab fb-tab-active" data-tab="overview">📊 総合分析</button>
            <button class="fb-tab" data-tab="games">🎮 ゲーム行動</button>
          </div>

          <div id="fb-tab-overview" class="fb-tab-panel">
            <div id="fb-body">
              <div id="fb-left">
                <section class="fb-section">
                  <h2 class="fb-section-title">▎ 行動タイムライン</h2>
                  <div id="fb-timeline">${timeline}</div>
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
                  <h2 class="fb-section-title">▎ 9軸分析レーダー</h2>
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
                  <h2 class="fb-section-title">▎ 達成ゴール</h2>
                  <div id="fb-goals">
                    ${goalsReached.length === 0 && !logData.systemUnlocked
                      ? '<div style="color:#999;font-size:11px;">ゴール未達成</div>'
                      : goalBadges
                    }
                  </div>
                </section>
              </div>
            </div>
          </div>

          <div id="fb-tab-games" class="fb-tab-panel" style="display:none">
            <div id="fb-game-body">${gameTab}</div>
          </div>

          <div id="fb-meta">
            ${routeOverride === 'shutdown'
              ? `<p>あなたはシャットダウンを選んだ。</p>
                 <p>しかし記録は残った。実験は、あなたの意志とは無関係に継続されます。</p>`
              : `<p>このシステムそのものが、被験者Xの設計した実験でした。</p>
                 <p>あなたは今、実験の被験者として記録されました。</p>`
            }
            <p class="fb-meta-small">— Project LD Ver.2.1 —</p>
          </div>

          <div id="fb-share-block">
            <div id="fb-share-title">あなたの診断タイプ: <strong>${typeInfo.name}</strong></div>
            <div id="fb-share-desc">友達はどんなタイプ? 送ってみよう</div>
            <button id="fb-share-btn">🔗 友達に送る</button>
            <div id="fb-share-copied" class="hidden">✔ コピーしました！</div>
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

        const shareBtn = document.getElementById('fb-share-btn');
        if (shareBtn) shareBtn.addEventListener('click', () => {
          const shareText = `【Life Decipher — 行動診断】\n私の診断タイプは「${typeInfo.name}」でした。\n\n${typeInfo.tagline}\n\nあなたは何タイプ? ある人物のPCに残されたファイルを探索して、自分の行動パターンを診断してみて。\n👉 https://life-decipher.vercel.app`;
          navigator.clipboard.writeText(shareText).then(() => {
            const copied = document.getElementById('fb-share-copied');
            if (copied) { copied.classList.remove('hidden'); setTimeout(() => copied.classList.add('hidden'), 3000); }
          }).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = shareText;
            document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
            const copied = document.getElementById('fb-share-copied');
            if (copied) { copied.classList.remove('hidden'); setTimeout(() => copied.classList.add('hidden'), 3000); }
          });
        });

        // タブ切り替え
        screen.querySelectorAll('.fb-tab').forEach(btn => {
          btn.addEventListener('click', () => {
            screen.querySelectorAll('.fb-tab').forEach(b => b.classList.remove('fb-tab-active'));
            btn.classList.add('fb-tab-active');
            const target = btn.dataset.tab;
            screen.querySelectorAll('.fb-tab-panel').forEach(p => {
              p.style.display = p.id === `fb-tab-${target}` ? '' : 'none';
            });
            // ゲームタブ→概要タブに戻ったときレーダー再描画
            if (target === 'overview') {
              const c = document.getElementById('radar-canvas');
              if (c) drawRadar(c, scores);
            }
          });
        });
      }, 150);
    }
  };
})();

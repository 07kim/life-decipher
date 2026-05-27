// スコアリングエンジン
// 5軸のスコアをリアルタイムで管理する
window.LD = window.LD || {};

window.LD.Assessment = (function () {
  // リアルタイムスコア（0〜100）
  const scores = {
    chaos:             50,  // カオス耐性
    openness:          30,  // 開放性・知的好奇心
    conscientiousness: 30,  // 誠実性・系統性
    planning:          30,  // プランニング能力
    immersion:         20   // 没入深度
  };

  // 内部フラストレーション累積値
  let frustration = 0;

  return {
    // リアルタイム更新
    update(dimension, delta) {
      if (dimension === 'frustration') {
        frustration = Math.max(0, frustration + delta);
        // フラストレーションが上がるほどカオス耐性が下がる
        scores.chaos = Math.max(0, Math.min(100, 100 - frustration * 1.8));
        return;
      }
      if (scores[dimension] !== undefined) {
        scores[dimension] = Math.max(0, Math.min(100, scores[dimension] + delta));
      }
    },

    getFrustration() { return frustration; },

    getScores() { return { ...scores }; },

    // セッション終了時に最終スコアを算出
    calculateFinal(logData) {
      const elapsedMin = logData.elapsedMs / 60000;
      const filesOpened  = logData.totalFilesOpened.size;
      const audioReplays = Object.values(logData.audioReplays).reduce((a, b) => a + b, 0);
      const pwSuccess    = logData.passwordAttempts.some(a => a.success);
      const pwAttempts   = logData.passwordAttempts.length;

      // カオス耐性（ESC・連打・ウィンドウ閉じの少なさ）
      const rawChaos = 100
        - logData.anomalyClickCount * 1.5
        - logData.escCount          * 4
        - logData.windowCloseCount  * 3;
      scores.chaos = Math.max(0, Math.min(100, rawChaos));

      // 開放性（黒塗りへのこだわり、音声再生の多さ）
      scores.openness = Math.min(100,
        20
        + logData.scrollAttempts * 6
        + audioReplays            * 7
        + pwAttempts              * 4
      );

      // 誠実性（ファイル網羅度）
      scores.conscientiousness = Math.min(100,
        20
        + filesOpened * 5
        + (filesOpened >= 8 ? 20 : 0)
      );

      // プランニング（付箋移動）
      scores.planning = Math.min(100,
        20
        + logData.notesMoved * 15
        + (logData.folderCreated ? 30 : 0)
      );

      // 没入深度（パスワード試行・プレイ時間）
      scores.immersion = Math.min(100,
        Math.min(40, elapsedMin * 3.5)
        + pwAttempts * 8
        + (pwSuccess ? 25 : 0)
      );

      return { ...scores, frustration };
    }
  };
})();

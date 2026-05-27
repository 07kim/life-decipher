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
      const pwAttempts   = logData.passwordAttempts.length;
      const unlockType   = logData.unlockType || 'none';

      // 1. 日記の閲覧順序がシーケンシャルか（誠実性）
      let sequentialDiaryReads = 0;
      for (let i = 1; i < logData.diaryReads.length; i++) {
        if (parseInt(logData.diaryReads[i]) === parseInt(logData.diaryReads[i-1]) + 1) {
          sequentialDiaryReads++;
        }
      }

      // 2. 付箋のドラッグ分析
      const redDrags = logData.noteDrags.red || 0;
      const yellowDrags = logData.noteDrags.yellow || 0;
      const blueDrags = logData.noteDrags.blue || 0;

      // カオス耐性（ESC・連打・ウィンドウ閉じの少なさ、visual突破で特大ボーナス）
      const rawChaos = 100
        - logData.anomalyClickCount * 1.5
        - logData.escCount          * 4
        - logData.windowCloseCount  * 3
        + (logData.audioStops       * 5)  // 途中で切る＝カオス傾向
        + (unlockType === 'visual' ? 40 : 0);
      scores.chaos = Math.max(0, Math.min(100, rawChaos));

      // 開放性（黒塗りへのこだわり、音声再生の多さ、visual突破）
      scores.openness = Math.min(100,
        20
        + logData.scrollAttempts * 6
        + logData.audioPlays      * 5
        + pwAttempts              * 2
        + (unlockType === 'visual' ? 30 : 0)
      );

      // 誠実性（音声完走、順序読解、blue付箋、linguistic/math突破）
      scores.conscientiousness = Math.min(100,
        20
        + logData.audioCompletes * 8
        + sequentialDiaryReads   * 5
        + blueDrags              * 4
        + (unlockType === 'linguistic' ? 30 : 0)
        + (unlockType === 'math' ? 20 : 0)
      );

      // プランニング（red付箋、math/composite突破、当てずっぽうペナルティ）
      const bruteForcePenalty = pwAttempts > 5 && unlockType !== 'composite' ? 20 : 0;
      scores.planning = Math.min(100,
        20
        + redDrags * 5
        + (unlockType === 'math' ? 40 : 0)
        + (unlockType === 'composite' ? 30 : 0)
        - bruteForcePenalty
      );

      // 没入深度（プレイ時間、yellow付箋、linguistic/composite突破）
      scores.immersion = Math.min(100,
        Math.min(30, elapsedMin * 4)
        + filesOpened * 2
        + yellowDrags * 5
        + (unlockType === 'linguistic' ? 40 : 0)
        + (unlockType === 'composite' ? 20 : 0)
      );

      return { ...scores, frustration };
    }
  };
})();

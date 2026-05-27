// スコアリングエンジン
// 5軸のスコアをリアルタイムで管理する
window.LD = window.LD || {};

window.LD.Assessment = (function () {
  // リアルタイムスコア（0〜100）
  const scores = {
    chaos:             50,  // カオス耐性
    openness:          30,  // 知的開放性
    conscientiousness: 30,  // 系統的探索
    math:              30,  // 論理・数理思考
    spatial:           30,  // 空間・視覚認知
    linguistic:        30,  // 言語・文脈理解
    integration:       30,  // 情報統合力
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

      // 1. 日記の閲覧順序がシーケンシャルか（系統的探索）
      let sequentialDiaryReads = 0;
      for (let i = 1; i < logData.diaryReads.length; i++) {
        if (parseInt(logData.diaryReads[i]) === parseInt(logData.diaryReads[i-1]) + 1) {
          sequentialDiaryReads++;
        }
      }

      // 2. 付箋のドラッグ分析
      const redDrags    = logData.noteDrags.red    || 0;
      const yellowDrags = logData.noteDrags.yellow  || 0;
      const blueDrags   = logData.noteDrags.blue    || 0;
      const greenDrags  = logData.noteDrags.green   || 0;
      const kangoDrags  = logData.noteDrags.kango   || 0;

      // カオス耐性（連打・ESC回避、無意味な探索の少なさ）
      const rawChaos = 100
        - logData.anomalyClickCount * 1.5
        - logData.escCount          * 4
        - logData.windowCloseCount  * 3
        + (logData.audioStops       * 5);
      scores.chaos = Math.max(0, Math.min(100, rawChaos));

      // 知的開放性（黒塗り、音声への関心）
      scores.openness = Math.min(100,
        20
        + logData.scrollAttempts * 6
        + logData.audioPlays      * 5
        + pwAttempts              * 2
      );

      // 系統的探索（順序読解、整理された行動、日記時系列整理）
      scores.conscientiousness = Math.min(100,
        20
        + logData.audioCompletes * 8
        + sequentialDiaryReads   * 5
        + (logData.diaryChronological ? 25 : 0)
      );

      // 論理・数理思考（math突破、計算メモ）
      scores.math = Math.min(100,
        20
        + (unlockType === 'math' ? 60 : 0)
        + (logData.passwordAttempts.some(a => /\d/.test(a.val)) ? 15 : 0)
      );

      // 空間・視覚認知（visual突破、blue付箋操作、色グループ配置）
      scores.spatial = Math.min(100,
        20
        + blueDrags * 3
        + (unlockType === 'visual' ? 60 : 0)
        + (logData.sameColorArrangement ? 10 : 0)
      );

      // 言語・文脈理解（linguistic突破、赤付箋操作、日記熟読）
      scores.linguistic = Math.min(100,
        20
        + redDrags * 4
        + sequentialDiaryReads * 4
        + (unlockType === 'linguistic' ? 60 : 0)
      );

      // 情報統合力（composite突破、複数の付箋の整理、色グループ配置）
      const bruteForcePenalty = pwAttempts > 5 && unlockType !== 'composite' ? 20 : 0;
      scores.integration = Math.min(100,
        20
        + (yellowDrags + redDrags + blueDrags + greenDrags) * 2
        + (unlockType === 'composite' ? 60 : 0)
        + (logData.tricolorArrangement  ? 15 : 0)
        - bruteForcePenalty
      );

      // 没入深度（プレイ時間、黄色付箋）
      scores.immersion = Math.min(100,
        Math.min(30, elapsedMin * 4)
        + filesOpened * 2
        + yellowDrags * 4
      );

      return { ...scores, frustration };
    }
  };
})();

// ボイスメモ設定・隠しフォルダコンテンツ
window.LD = window.LD || {};

window.LD.VOICE_MEMOS = [
  { id: 'vm001', name: '音声_001.wav',       duration: 4,  noiseType: 'white', hasVoice: true,  voiceGain: 0.30 },
  { id: 'vm002', name: '音声_002.wav',       duration: 2,  noiseType: 'brown', hasVoice: false, voiceGain: 0.00 },
  { id: 'vm003', name: '音声_003.wav',       duration: 8,  noiseType: 'white', hasVoice: true,  voiceGain: 0.15 },
  { id: 'vm004', name: '音声_004.wav',       duration: 3,  noiseType: 'pink',  hasVoice: true,  voiceGain: 0.50 },
  { id: 'vm005', name: '音声_005(重要).wav', duration: 7,  noiseType: 'white', hasVoice: true,  voiceGain: 0.60, important: true },
  { id: 'vm006', name: '音声_006.wav',       duration: 3,  noiseType: 'brown', hasVoice: false, voiceGain: 0.00 },
  { id: 'vm007', name: '音声_007.wav',       duration: 6,  noiseType: 'pink',  hasVoice: true,  voiceGain: 0.20 },
  { id: 'vm008', name: '音声_008.wav',       duration: 4,  noiseType: 'white', hasVoice: true,  voiceGain: 0.40 },
  { id: 'vm009', name: '音声_009.wav',       duration: 2,  noiseType: 'white', hasVoice: false, voiceGain: 0.00 },
  { id: 'vm010', name: '音声_010.wav',       duration: 9,  noiseType: 'brown', hasVoice: true,  voiceGain: 0.80 }
];

window.LD.HIDDEN_FILES = [
  {
    id: 'hf_design',
    name: 'system_design.txt',
    content: `Project LD — システム設計書
Version : 2.1
作成日  : 20XX年5月
作成者  : X

=====================================

概要：
「目的のない空間」に置かれた被験者の行動パターンを
リアルタイムで分析・記録するシステム。

技術仕様：
  - 被験者の行動はすべてリアルタイムで記録される
  - クリック位置、マウス軌跡、アイドル時間
  - キーボード入力（パスワード含む）
  - ファイルアクセス順序・滞在時間

=====================================

重要：
このシステムを今閲覧している者は、
既に「被験者」として記録が開始されています。

このファイルを開いた時点で、
あなたのデータは「好奇心が強く、
隠されたものへの探求意欲が高い」
タイプとして分類されています。

=====================================

判定フェーズ：
最終レポートは「report.txt」に記録されます。
`
  },
  {
    id: 'hf_log',
    name: 'participant_log_DRAFT.txt',
    content: `参加者ログ（草稿）
=====================================

セッション開始  : [記録中]
経過時間        : [計測中]

行動ログ：
  - システム起動を確認
  - デスクトップへのアクセスを確認
  - ファイル探索行動を確認
  - この行を読んでいることを確認

=====================================

注記：
このファイルはあなたの行動を
リアルタイムで記録したものではありません。

しかし、本当にそうでしょうか？

=====================================`
  },
  {
    id: 'report_composite',
    name: '最終報告書(複合).txt',
    content: `【アセスメント終了】\n\nパスワード『3key5』による突破を確認。\n\n散らばった断片（付箋、日記、音声）を横断して情報を組み合わせる能力。\nあなたは情報を俯瞰し、全体像を構築する「プランニング能力」に非常に長けています。\n\n――シミュレーションを終了します。`,
    trigger: 'ending'
  },
  {
    id: 'report_linguistic',
    name: '最終報告書(言語).txt',
    content: `【アセスメント終了】\n\nパスワード『wake』による突破を確認。\n\n日記に隠された縦読みの暗号（アクロスティック）に気づく能力。\nテキストの細かな違和感や言語的パターンを見逃さない「誠実性」と「没入感」が証明されました。\n\n――シミュレーションを終了します。`,
    trigger: 'ending'
  },
  {
    id: 'report_math',
    name: '最終報告書(数理).txt',
    content: `【アセスメント終了】\n\nパスワード『1321』による突破を確認。\n\nフィボナッチ数列の規則性を見抜く能力。\n感情や不確実な情報よりも、確固たる「論理」と「数理的パターン」を信頼する傾向があります。\n\n――シミュレーションを終了します。`,
    trigger: 'ending'
  },
  {
    id: 'report_visual',
    name: '最終報告書(視覚).txt',
    content: `【アセスメント終了】\n\nパスワード『93c5fd』による突破を確認。\n\n「紙の色」というUIのメタ情報（カラーコード）を直接調べる能力。\n与えられたゲーム世界の枠組みに縛られない、極めて高い「知的好奇心（開放性）」と「カオス耐性」を示しました。\n\n――シミュレーションを終了します。`,
    trigger: 'ending'
  }
];

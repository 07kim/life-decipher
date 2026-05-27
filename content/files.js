// ボイスメモ設定・隠しフォルダコンテンツ
window.LD = window.LD || {};

window.LD.VOICE_MEMOS = [
  { id: 'vm001', name: '音声_001.wav',       duration: 47,  noiseType: 'white', hasVoice: true,  voiceGain: 0.30 },
  { id: 'vm002', name: '音声_002.wav',       duration: 23,  noiseType: 'brown', hasVoice: false, voiceGain: 0.00 },
  { id: 'vm003', name: '音声_003.wav',       duration: 89,  noiseType: 'white', hasVoice: true,  voiceGain: 0.15 },
  { id: 'vm004', name: '音声_004.wav',       duration: 12,  noiseType: 'pink',  hasVoice: true,  voiceGain: 0.50 },
  { id: 'vm005', name: '音声_005(重要).wav', duration: 156, noiseType: 'white', hasVoice: true,  voiceGain: 0.60, important: true },
  { id: 'vm006', name: '音声_006.wav',       duration: 34,  noiseType: 'brown', hasVoice: false, voiceGain: 0.00 },
  { id: 'vm007', name: '音声_007.wav',       duration: 67,  noiseType: 'pink',  hasVoice: true,  voiceGain: 0.20 },
  { id: 'vm008', name: '音声_008.wav',       duration: 45,  noiseType: 'white', hasVoice: true,  voiceGain: 0.40 },
  { id: 'vm009', name: '音声_009.wav',       duration: 8,   noiseType: 'white', hasVoice: false, voiceGain: 0.00 },
  { id: 'vm010', name: '音声_010(最後).wav', duration: 203, noiseType: 'brown', hasVoice: true,  voiceGain: 0.80, important: true }
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
    id: 'hf_report',
    name: 'report.txt',
    content: `最終報告書 — Project LD
=====================================

被験者へ：

あなたは今まで、「被験者X」という
架空の人物の痕跡を追っていました。

しかし、真実を告げます。

被験者Xは——存在しません。

このシステム全体——
日記、音声メモ、付箋、隠しフォルダ——
すべてが、あなたのために設計されたものです。

あなたの行動、迷い、焦り、
そして「真相を知りたい」という衝動。

それが、この実験の答えです。

「目的がない」という空間で、
あなたは「意味を探した」。

それだけで十分なデータになります。

=====================================

間もなく、あなた自身の分析レポートが
表示されます。

お疲れ様でした。
`,
    trigger: 'ending'
  }
];

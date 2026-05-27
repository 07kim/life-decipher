// 付箋コンテンツ
// 各ルートへのヒントは断片的に・多段階で
window.LD = window.LD || {};

window.LD.STICKY_NOTES = [
  // ━━ 世界観・感情 ━━
  {
    id: 'note1',
    type: 'yellow',
    text: '私は被験者X。\nここはどこだ？\n思い出せない。',
    color: '#fef08a',
    shadowColor: 'rgba(200,180,50,0.2)',
    x: 100,
    y: 80,
    rotation: -3.5
  },
  {
    id: 'note2',
    type: 'yellow',
    text: '記憶は\n断片化\nする',
    color: '#fef9c3',
    shadowColor: 'rgba(180,160,0,0.15)',
    x: 370,
    y: 290,
    rotation: 1.8
  },

  // ━━ 複合ルート（3key5）へのヒント ━━
  {
    id: 'note3',
    type: 'red',
    text: '①\n鍵は3つ。\n全ての断片を\n集めよ。',
    color: '#fca5a5',
    shadowColor: 'rgba(180,50,50,0.2)',
    x: 680,
    y: 75,
    rotation: 2.2
  },

  // ━━ 数理ルート（3455）へのヒント Step1 ━━
  {
    id: 'note4',
    type: 'yellow',
    text: '1  1  2  3\n  5  8  ?\n\nパターンは？',
    color: '#fef08a',
    shadowColor: 'rgba(200,180,50,0.2)',
    x: 820,
    y: 340,
    rotation: -2.1
  },

  // ━━ 視覚ルート（a5acfd）へのヒント Step1 ━━
  {
    id: 'note5',
    type: 'blue',
    text: '③\n色には\n意味がある。',
    color: '#93c5fd',
    shadowColor: 'rgba(50,100,180,0.2)',
    x: 720,
    y: 430,
    rotation: -2.8
  },

  // ━━ 言語ルート（wake）へのヒント Step1 ━━
  {
    id: 'note6',
    type: 'red',
    text: '彼の詩の中に\n何かが\n隠されている',
    color: '#fcd4a5',
    shadowColor: 'rgba(180,100,20,0.2)',
    x: 450,
    y: 70,
    rotation: -1.4
  },

  // ━━ 世界観 ━━
  {
    id: 'note7',
    type: 'yellow',
    text: 'なぜ\nここに\n私がいる',
    color: '#d9f99d',
    shadowColor: 'rgba(80,140,20,0.15)',
    x: 130,
    y: 450,
    rotation: 2.6
  },

  // ━━ 複合ルート Step2への誘導 ━━
  {
    id: 'note8',
    type: 'blue',
    text: '音声の中に\n答えがある\nと思っていた',
    color: '#bae6fd',
    shadowColor: 'rgba(30,120,180,0.18)',
    x: 540,
    y: 400,
    rotation: 1.2
  },

  // ━━ 視覚ルート Step2への誘導 ━━
  {
    id: 'note9',
    type: 'blue',
    text: '②\nWebは全て\n数字と記号で\n動いている',
    color: '#86efac', // 緑色に変更
    shadowColor: 'rgba(20,140,60,0.2)',
    x: 870,
    y: 200,
    rotation: 3.1
  },

  // ━━ 視覚ルート Step3への誘導（新規） ━━
  {
    id: 'note10',
    type: 'yellow',
    text: '3つの色の\n「尻尾」を\n繋げ',
    color: '#fef08a',
    shadowColor: 'rgba(200,180,50,0.2)',
    x: 350,
    y: 120,
    rotation: -1.5
  }
];

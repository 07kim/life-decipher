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

  // ━━ 空間・視覚ルート（勘合符パズル） ━━
  {
    id: 'kango1', type: 'blue', text: '何か足りない', color: '#bae6fd', shadowColor: 'rgba(50,100,180,0.2)', x: 120, y: 350, rotation: -2.8,
    kangoRight: 'V'
  },
  {
    id: 'kango2', type: 'blue', text: '繋がらない', color: '#93c5fd', shadowColor: 'rgba(50,100,180,0.2)', x: 800, y: 150, rotation: 1.4,
    kangoLeft: 'V', kangoRight: 'O'
  },
  {
    id: 'kango3', type: 'blue', text: '見えない', color: '#7dd3fc', shadowColor: 'rgba(50,100,180,0.2)', x: 400, y: 380, rotation: -1.5,
    kangoLeft: 'O', kangoRight: 'I'
  },
  {
    id: 'kango4', type: 'blue', text: '意味がない', color: '#38bdf8', shadowColor: 'rgba(50,100,180,0.2)', x: 650, y: 430, rotation: 2.1,
    kangoLeft: 'I', kangoRight: 'D'
  },
  {
    id: 'kango5', type: 'blue', text: 'ここはどこだ', color: '#0ea5e9', shadowColor: 'rgba(50,100,180,0.2)', x: 250, y: 90, rotation: -0.5,
    kangoLeft: 'D'
  }
];

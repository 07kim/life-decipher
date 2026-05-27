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
    colorGroup: 'red',
    text: '①\n鍵は3つ。\n全ての断片を\n集めよ。',
    color: '#fca5a5',
    shadowColor: 'rgba(180,50,50,0.2)',
    x: 680,
    y: 75,
    rotation: 2.2
  },
  {
    id: 'note-r2',
    type: 'red',
    colorGroup: 'red',
    text: '赤は\nはじまりの色\n——それとも終わり?',
    color: '#fecaca',
    shadowColor: 'rgba(180,50,50,0.15)',
    x: 740,
    y: 220,
    rotation: -1.8
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

  // ━━ 緑付箋（色グループ配置ギミック用） ━━
  {
    id: 'note-g1',
    type: 'green',
    colorGroup: 'green',
    text: '②\n混ざれば\n新しい何かに\nなる',
    color: '#86efac',
    shadowColor: 'rgba(50,160,80,0.2)',
    x: 500,
    y: 155,
    rotation: 1.3
  },
  {
    id: 'note-g2',
    type: 'green',
    colorGroup: 'green',
    text: '分けるか\n混ぜるか\nそれが問いだ',
    color: '#bbf7d0',
    shadowColor: 'rgba(50,160,80,0.15)',
    x: 330,
    y: 400,
    rotation: -2.2
  },

  // ━━ 青付箋（色グループ配置ギミック用、勘合符とは別） ━━
  {
    id: 'note-b1',
    type: 'blue',
    colorGroup: 'blue',
    text: '③\n青は静かに\n全てを映す',
    color: '#93c5fd',
    shadowColor: 'rgba(50,100,180,0.2)',
    x: 190,
    y: 230,
    rotation: 2.6
  },
  {
    id: 'note-b2',
    type: 'blue',
    colorGroup: 'blue',
    text: '深く潜れば\n答えが見える',
    color: '#bfdbfe',
    shadowColor: 'rgba(50,100,180,0.15)',
    x: 560,
    y: 380,
    rotation: -0.9
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

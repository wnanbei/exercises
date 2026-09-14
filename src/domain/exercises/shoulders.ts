import type { Exercise } from '../types'

export const shoulderExercises: Exercise[] = [
  {
    id: 'cross-body-shoulder',
    name: { zh: '横臂肩部拉伸', en: 'Cross-Body Shoulder Stretch' },
    position: 'standing',
    sides: 'both',
    duration: 30,
    instruction: {
      setup: '站立，双脚与肩同宽，双臂自然下垂。',
      action: '一侧手臂横过胸前，另一侧手扶住其上臂，轻轻向身体方向拉。',
      feel: '肩膀后侧与外侧（三角肌后束）的牵拉感。',
    },
    muscles: [
      { id: 'deltoid-rear-left', intensity: 8 },
      { id: 'deltoid-rear-right', intensity: 8 },
      { id: 'shoulder-side-left', intensity: 5 },
      { id: 'shoulder-side-right', intensity: 5 },
    ],
    pose: {
      start: {},
      end: {
        armL: { shoulder: -100, elbow: 0 },
        armR: { shoulder: -70, elbow: -130 },
      },
    },
    arrows: [{ anchor: 'handL', dx: -26, dy: 0, label: '向对侧' }],
  },
  {
    id: 'overhead-triceps',
    name: { zh: '过头三头肌拉伸', en: 'Overhead Triceps Stretch' },
    position: 'standing',
    sides: 'both',
    duration: 30,
    instruction: {
      setup: '站立或坐直，核心微微收紧。',
      action: '一侧手臂举过头顶并弯曲，手摸到上背部；另一侧手轻推肘部向头后加深。',
      feel: '上臂后侧（肱三头肌）与腋下周缘的拉伸。',
    },
    muscles: [
      { id: 'triceps-long-left', intensity: 8 },
      { id: 'triceps-long-right', intensity: 8 },
      { id: 'lats-upper-left', intensity: 4 },
      { id: 'lats-upper-right', intensity: 4 },
    ],
    pose: {
      start: {},
      end: { armL: { shoulder: -172, elbow: -155 } },
    },
    arrows: [{ anchor: 'elbowL', dx: -18, dy: -14 }],
  },
  {
    id: 'chest-opener',
    name: { zh: '站立胸部伸展', en: 'Standing Chest Opener' },
    position: 'standing',
    sides: 'none',
    duration: 30,
    instruction: {
      setup: '站立，双脚与肩同宽，双手在身后交握。',
      action: '伸直双臂缓慢向后向上抬，同时挺胸、肩胛骨向中间夹。',
      feel: '胸前与肩膀前侧的舒展感。',
    },
    muscles: [
      { id: 'chest-upper-left', intensity: 7 },
      { id: 'chest-upper-right', intensity: 7 },
      { id: 'shoulder-front-left', intensity: 6 },
      { id: 'shoulder-front-right', intensity: 6 },
    ],
    pose: {
      start: {},
      end: { armL: { shoulder: 38 }, armR: { shoulder: 42 }, neck: -8 },
    },
    arrows: [{ anchor: 'handL', dx: -22, dy: -16 }],
  },
  {
    id: 'shoulder-rolls',
    name: { zh: '肩部绕环', en: 'Shoulder Rolls' },
    position: 'standing',
    sides: 'none',
    duration: 30,
    instruction: {
      setup: '站立，双臂自然下垂，全身放松。',
      action: '双肩缓慢向上提、向后转、再向下沉，做流畅的大绕环，配合呼吸。',
      feel: '肩颈区域逐渐发热放松。',
    },
    muscles: [
      { id: 'traps-upper-left', intensity: 6 },
      { id: 'traps-upper-right', intensity: 6 },
      { id: 'shoulder-side-left', intensity: 4 },
      { id: 'shoulder-side-right', intensity: 4 },
    ],
    pose: { start: {}, end: { armL: { shoulder: -8 }, armR: { shoulder: -8 } } },
    arrows: [
      { anchor: 'shoulderL', dx: -10, dy: -20, label: '向后绕环' },
    ],
  },
  {
    id: 'eagle-arms',
    name: { zh: '鹰式手臂', en: 'Eagle Arms' },
    position: 'standing',
    sides: 'both',
    duration: 30,
    instruction: {
      setup: '站立或坐直，双臂向前平举。',
      action: '一侧手臂从上方交叉缠绕另一侧，掌心尽量相合，手肘向上抬至与肩同高。',
      feel: '上背部、肩胛骨之间与肩膀后侧的拉伸。',
    },
    muscles: [
      { id: 'traps-mid-left', intensity: 7 },
      { id: 'traps-mid-right', intensity: 7 },
      { id: 'deltoid-rear-left', intensity: 6 },
      { id: 'deltoid-rear-right', intensity: 6 },
    ],
    pose: {
      start: {},
      end: { armL: { shoulder: -95, elbow: -70 }, armR: { shoulder: -85, elbow: -80 } },
    },
    arrows: [{ anchor: 'elbowL', dx: 0, dy: -22 }],
  },
  {
    id: 'thread-the-needle',
    name: { zh: '穿针式', en: 'Thread the Needle' },
    position: 'kneeling',
    sides: 'both',
    duration: 30,
    instruction: {
      setup: '四足跪姿，双手在肩膀正下方，膝盖在髋部正下方。',
      action: '一侧手臂从身体下方穿过伸向对侧，肩膀与太阳穴轻轻落地，保持呼吸。',
      feel: '上背部、肩膀后侧与胸椎旋转处的深层舒展。',
    },
    muscles: [
      { id: 'traps-mid-left', intensity: 7 },
      { id: 'traps-mid-right', intensity: 7 },
      { id: 'deltoid-rear-left', intensity: 6 },
      { id: 'deltoid-rear-right', intensity: 6 },
      { id: 'spine', intensity: 4 },
    ],
    pose: {
      start: {},
      end: { torso: 35, armL: { shoulder: -60, elbow: -10 }, armR: { shoulder: -20, elbow: -30 } },
    },
    arrows: [{ anchor: 'handL', dx: -24, dy: 10 }],
  },
]

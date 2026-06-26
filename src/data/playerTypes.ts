export interface PlayerDetail {
  name: string
  pos: string
  posLabel: string
  team: string
  ovr: number
  num: number
  yr: string
  ht: number // inches
  wt: number // lbs
  home: string
  attrs: Record<string, number>
}

export interface AttrGroup {
  title: string
  attrs: [key: string, label: string][]
}

// Grouped to mirror EA's player ratings page layout.
export const ATTR_GROUPS: AttrGroup[] = [
  {
    title: 'General',
    attrs: [
      ['speed', 'Speed'], ['acceleration', 'Acceleration'], ['strength', 'Strength'],
      ['agility', 'Agility'], ['awareness', 'Awareness'], ['jumping', 'Jumping'],
      ['injury', 'Injury'], ['stamina', 'Stamina'], ['toughness', 'Toughness'],
    ],
  },
  {
    title: 'Ballcarrier',
    attrs: [
      ['carrying', 'Carrying'], ['breakTackle', 'Break Tackle'], ['trucking', 'Trucking'],
      ['changeOfDirection', 'Change of Direction'], ['bCVision', 'BC Vision'], ['stiffArm', 'Stiff Arm'],
      ['spinMove', 'Spin Move'], ['jukeMove', 'Juke Move'], ['breakSack', 'Break Sack'],
    ],
  },
  {
    title: 'Passing',
    attrs: [
      ['throwPower', 'Throw Power'], ['throwUnderPressure', 'Throw Under Pressure'],
      ['throwAccuracyShort', 'Throw Accuracy Short'], ['throwAccuracyMid', 'Throw Accuracy Mid'],
      ['throwAccuracyDeep', 'Throw Accuracy Deep'], ['throwOnTheRun', 'Throw on the Run'],
      ['playAction', 'Play Action'],
    ],
  },
  {
    title: 'Receiving',
    attrs: [
      ['catching', 'Catching'], ['spectacularCatch', 'Spectacular Catch'],
      ['catchInTraffic', 'Catch in Traffic'], ['shortRouteRunning', 'Short Route Running'],
      ['mediumRouteRunning', 'Medium Route Running'], ['deepRouteRunning', 'Deep Route Running'],
    ],
  },
  {
    title: 'Blocking',
    attrs: [
      ['runBlock', 'Run Block'], ['passBlock', 'Pass Block'], ['impactBlocking', 'Impact Blocking'],
      ['runBlockPower', 'Run Block Power'], ['runBlockFinesse', 'Run Block Finesse'],
      ['passBlockPower', 'Pass Block Power'], ['passBlockFinesse', 'Pass Block Finesse'],
      ['leadBlock', 'Lead Block'],
    ],
  },
  {
    title: 'Defense',
    attrs: [
      ['tackle', 'Tackle'], ['hitPower', 'Hit Power'], ['powerMoves', 'Power Moves'],
      ['finesseMoves', 'Finesse Moves'], ['blockShedding', 'Block Shedding'], ['pursuit', 'Pursuit'],
      ['playRecognition', 'Play Recognition'], ['manCoverage', 'Man Coverage'],
      ['zoneCoverage', 'Zone Coverage'], ['press', 'Press'],
    ],
  },
  {
    title: 'Kicking',
    attrs: [['kickPower', 'Kick Power'], ['kickAccuracy', 'Kick Accuracy'], ['kickReturn', 'Kick Return']],
  },
]

export function attrColor(v: number): string {
  if (v >= 90) return '#1a7f37'
  if (v >= 80) return '#34a853'
  if (v >= 70) return '#e0a008'
  if (v >= 60) return '#e8833a'
  return '#d23b3b'
}

export function formatHeight(inches: number): string {
  if (!inches) return ''
  return `${Math.floor(inches / 12)}'${inches % 12}"`
}

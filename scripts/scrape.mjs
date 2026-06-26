// Scrapes teamcrafters.net CFB27 launch ratings: team OVRs + top 5 offense/defense
// players per school. Keyed by the names used in src/data/schools.ts.
import { writeFileSync } from 'node:fs'

// my schools.ts name -> teamcrafters team id
const IDS = {
  Alabama: 625, Georgia: 656, Texas: 726, Oklahoma: 702, LSU: 677, 'Texas A&M': 727,
  Tennessee: 725, Arkansas: 629, Auburn: 632, Florida: 653, 'Ole Miss': 705,
  'South Carolina': 718, Missouri: 688, Kentucky: 671, 'Mississippi State': 687, Vanderbilt: 745,
  'Ohio State': 701, Oregon: 706, Michigan: 683, 'Penn State': 708, Wisconsin: 754, Iowa: 664,
  USC: 740, Washington: 749, Illinois: 662, Nebraska: 691, UCLA: 736, 'Arizona State': 628,
  Maryland: 679, 'Michigan State': 684, Minnesota: 686, Purdue: 710, Indiana: 663,
  Northwestern: 698, Rutgers: 712,
  Clemson: 644, 'Notre Dame': 699, 'Florida State': 654, 'Miami FL': 681, 'North Carolina': 695,
  Louisville: 676, 'NC State': 690, California: 640, Stanford: 721, SMU: 716, 'Boston College': 636,
  'Georgia Tech': 659, Syracuse: 722, 'Virginia Tech': 747, Pittsburgh: 709, Virginia: 746,
  'Wake Forest': 748, Duke: 648,
  Utah: 743, 'Oklahoma State': 703, 'Kansas State': 669, TCU: 723, 'Texas Tech': 729, Baylor: 634,
  Kansas: 668, 'West Virginia': 751, 'Iowa State': 665, Colorado: 646, UCF: 735, Cincinnati: 643,
  Houston: 661, Arizona: 627, BYU: 639,
  'Oregon State': 707, 'Washington State': 750,
  Memphis: 680, Tulane: 732, Army: 631, UTSA: 742, USF: 719, Navy: 689, Temple: 724,
  'East Carolina': 649, 'Florida Atlantic': 651, 'North Texas': 696, UAB: 734, Tulsa: 733,
  Rice: 711, Charlotte: 642,
  Liberty: 672, 'Jacksonville State': 666, 'Western Kentucky': 752, 'Middle Tennessee': 685,
  'Louisiana Tech': 675, 'Sam Houston': 713, FIU: 652, UTEP: 741, 'New Mexico State': 694,
  'Kennesaw State': 26517,
  Toledo: 730, 'Miami OH': 682, 'Western Michigan': 753, 'Central Michigan': 641,
  'Northern Illinois': 697, 'Bowling Green': 637, 'Eastern Michigan': 650, 'Kent State': 670,
  Akron: 624, Buffalo: 638, Ohio: 700, 'Ball State': 633, UMass: 738,
  'Boise State': 635, 'Fresno State': 655, UNLV: 739, 'San Jose State': 715, 'Colorado State': 647,
  'San Diego State': 714, 'Utah State': 744, 'Air Force': 623, Wyoming: 755, Nevada: 692,
  Hawaii: 660, 'New Mexico': 693,
  'James Madison': 667, 'Appalachian State': 626, Louisiana: 673, Marshall: 678, 'Texas State': 728,
  Troy: 731, 'Coastal Carolina': 645, 'Georgia Southern': 657, 'Georgia State': 658,
  'South Alabama': 717, 'Southern Miss': 720, 'Old Dominion': 704, 'Arkansas State': 630,
  'UL Monroe': 674,
  UConn: 737,
}

const OFF = new Set(['QB', 'HB', 'FB', 'WR', 'TE', 'LT', 'LG', 'C', 'RG', 'RT'])
const DEF = new Set(['LE', 'RE', 'DT', 'MLB', 'ROLB', 'LOLB', 'CB', 'FS', 'SS'])

const playerRe =
  /"firstName":"(.*?)","lastName":"(.*?)","number":(\d+),.*?"POS":"(.*?)","OVR":(\d+),.*?"SPD":(\d+)/g
const teamRe = /"offenseOVR":(\d+),"defenseOVR":(\d+),"specialTeamsOVR":(\d+),"teamOVR":(\d+)/

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function scrapeOne(name, id) {
  const url = `https://www.teamcrafters.net/rosters/CFB27/launch-ratings/${id}`
  let html
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url)
    if (res.ok) {
      html = (await res.text()).replace(/\\"/g, '"')
      break
    }
    if (attempt >= 8) throw new Error(`${name} ${id} -> HTTP ${res.status}`)
    await sleep(1200 * attempt) // back off on rate limiting
  }

  const tm = html.match(teamRe)
  const team = tm
    ? { offOvr: +tm[1], defOvr: +tm[2], stOvr: +tm[3], ovr: +tm[4] }
    : { offOvr: 0, defOvr: 0, stOvr: 0, ovr: 0 }

  const seen = new Set()
  const players = []
  for (const m of html.matchAll(playerRe)) {
    const [, first, last, num, pos, ovr, spd] = m
    const key = `${first} ${last} ${num} ${pos}`
    if (seen.has(key)) continue
    seen.add(key)
    players.push({ name: `${first} ${last}`.trim(), pos, ovr: +ovr, num: +num, spd: +spd })
  }

  const top = (set) =>
    players
      .filter((p) => set.has(p.pos))
      .sort((a, b) => b.ovr - a.ovr || a.name.localeCompare(b.name))
      .slice(0, 5)
      .map(({ name, pos, ovr }) => ({ name, pos, ovr }))

  const topSpeed = players
    .slice()
    .sort((a, b) => b.spd - a.spd || b.ovr - a.ovr || a.name.localeCompare(b.name))
    .slice(0, 5)
    .map(({ name, pos, spd }) => ({ name, pos, spd }))

  const roster = players
    .slice()
    .sort((a, b) => b.ovr - a.ovr || a.name.localeCompare(b.name))
    .map(({ name, pos, ovr, num }) => ({ name, pos, ovr, num }))

  return {
    ...team,
    topOffense: top(OFF),
    topDefense: top(DEF),
    topSpeed,
    roster,
    playerCount: players.length,
  }
}

async function run() {
  const entries = Object.entries(IDS)
  const out = {}
  const CONCURRENCY = 2
  let i = 0
  let failures = []

  async function worker() {
    while (i < entries.length) {
      const idx = i++
      const [name, id] = entries[idx]
      try {
        out[name] = await scrapeOne(name, id)
        process.stdout.write('.')
      } catch (e) {
        failures.push(e.message)
        process.stdout.write('x')
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  writeFileSync('/tmp/players.json', JSON.stringify(out, null, 2))
  console.log(`\nDone: ${Object.keys(out).length}/${entries.length} teams`)
  if (failures.length) console.log('FAILURES:\n' + failures.join('\n'))
}

run()

// Scrapes EA's official CFB27 ratings (authoritative) for every team:
// full rosters with all 54 attributes + bio, keyed by schools.ts names.
import { writeFileSync } from 'node:fs'

// EA label differs from our school name for a handful of teams.
const ALIAS = {
  California: 'Cal',
  'Miami FL': 'Miami',
  'Miami OH': 'Miami (Ohio)',
  UConn: 'Connecticut',
  'Middle Tennessee': 'Middle Tennessee State',
  'Florida Atlantic': 'FAU',
}
// EA team id by label (from the ratings filter list).
const LABEL_ID = {
  'Air Force': 1, Akron: 2, Alabama: 3, Arizona: 4, 'Arizona State': 5, Arkansas: 6,
  'Arkansas State': 7, Army: 8, Auburn: 9, 'Ball State': 10, Baylor: 11, 'Boise State': 12,
  'Boston College': 13, 'Bowling Green': 14, Buffalo: 15, BYU: 16, Cal: 17, 'Central Michigan': 18,
  Cincinnati: 19, Clemson: 20, Colorado: 21, 'Colorado State': 22, Connecticut: 23, Duke: 24,
  'Eastern Michigan': 25, 'East Carolina': 26, FIU: 27, FAU: 28, Florida: 29, 'Florida State': 30,
  'Fresno State': 31, Georgia: 32, 'Georgia State': 33, 'Georgia Tech': 34, Hawaii: 35, Houston: 36,
  Illinois: 37, Indiana: 38, Iowa: 39, 'Iowa State': 40, Kansas: 41, 'Kansas State': 42,
  'Kennesaw State': 43, 'Kent State': 44, Kentucky: 45, 'Louisiana Tech': 46, Louisville: 47,
  LSU: 48, Marshall: 49, Maryland: 50, Memphis: 51, Miami: 52, 'Miami (Ohio)': 53, Michigan: 54,
  'Michigan State': 55, 'Middle Tennessee State': 56, Minnesota: 57, 'Mississippi State': 58,
  Missouri: 59, Navy: 60, 'NC State': 61, Nebraska: 62, Nevada: 63, 'New Mexico': 64,
  'New Mexico State': 65, 'North Carolina': 66, 'North Texas': 67, 'Northern Illinois': 68,
  Northwestern: 69, 'Notre Dame': 70, Ohio: 71, 'Ohio State': 72, Oklahoma: 73, 'Oklahoma State': 74,
  'Old Dominion': 75, 'Ole Miss': 76, Oregon: 77, 'Oregon State': 78, 'Penn State': 79,
  Pittsburgh: 80, Purdue: 81, Rice: 82, Rutgers: 83, 'San Diego State': 84, 'San Jose State': 85,
  SMU: 86, 'South Alabama': 87, 'South Carolina': 88, 'Southern Miss': 89, Stanford: 90,
  Syracuse: 91, TCU: 92, Temple: 93, Tennessee: 94, 'Texas A&M': 95, Texas: 96, 'Texas State': 97,
  'Texas Tech': 98, Toledo: 99, Troy: 100, Tulane: 101, Tulsa: 102, UAB: 103, UCF: 104, UCLA: 105,
  Louisiana: 106, 'UL Monroe': 107, UMass: 108, UNLV: 109, USC: 110, USF: 111, Utah: 112,
  'Utah State': 113, UTEP: 114, UTSA: 115, Vanderbilt: 116, Virginia: 117, 'Virginia Tech': 118,
  'Wake Forest': 119, Washington: 120, 'Washington State': 121, 'West Virginia': 122,
  'Western Kentucky': 123, 'Western Michigan': 124, Wisconsin: 125, Wyoming: 126,
  'Appalachian State': 127, Charlotte: 128, 'Coastal Carolina': 129, 'Georgia Southern': 130,
  'Jacksonville State': 131, 'James Madison': 132, Liberty: 133, 'Sam Houston': 134,
}
// EA slug overrides where slugify(label) isn't the canonical slug.
const SLUG_OVERRIDE = {
  'Miami (Ohio)': 'miami-ohio',
  'Texas A&M': 'texas-a-m',
  UMass: 'u-mass',
}

function slugify(label) {
  return label
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[()'.]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const ua = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function parsePlayers(html) {
  const players = []
  const seen = new Set()
  // Each player record starts at "id":N,"avatarUrl"
  const starts = [...html.matchAll(/"id":(\d+),"avatarUrl"/g)]
  for (let k = 0; k < starts.length; k++) {
    const i = starts[k].index
    const j = k + 1 < starts.length ? starts[k + 1].index : i + 6000
    const seg = html.slice(i, j)
    const pid = +starts[k][1]
    if (seen.has(pid)) continue
    seen.add(pid)
    const g = (re) => (seg.match(re) || [])[1]
    const first = g(/"firstName":"([^"]*)"/) || ''
    const last = g(/"lastName":"([^"]*)"/) || ''
    const ovr = +(g(/"overallRating":(\d+)/) || 0)
    const num = +(g(/"jerseyNum":(\d+)/) || 0)
    const schoolYear = g(/"schoolYear":"([^"]*)"/) || ''
    const redshirt = g(/"redShirtStatus":"([^"]*)"/) || ''
    const pos = g(/"position":\{"id":"([^"]*)"/) || ''
    const posLabel = g(/"position":\{"id":"[^"]*","shortLabel":"[^"]*","label":"([^"]*)"/) || ''
    const height = +(g(/"height":(\d+)/) || 0)
    const weight = +(g(/"weight":(\d+)/) || 0)
    const homeTown = g(/"homeTown":"([^"]*)"/) || ''
    const homeState = g(/"homeState":"([^"]*)"/) || ''
    // all numeric attributes
    const attrs = {}
    for (const m of seg.matchAll(/"([a-zA-Z]+)":\{"value":(-?\d+),"diff":-?\d+\}/g)) {
      attrs[m[1]] = +m[2]
    }
    delete attrs.overall
    players.push({
      pid, name: `${first} ${last}`.trim(), num, pos, posLabel, ovr,
      schoolYear, redshirt, height, weight, homeTown, homeState, attrs,
    })
  }
  return players
}

async function scrapeTeam(name) {
  const eaLabel = ALIAS[name] || name
  const id = LABEL_ID[eaLabel]
  if (!id) throw new Error(`no EA id for ${name} (${eaLabel})`)
  const slug = SLUG_OVERRIDE[eaLabel] || slugify(eaLabel)
  const url = `https://www.ea.com/games/ea-sports-college-football/ratings/teams-ratings/${slug}/${id}`
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: ua })
    if (res.ok) {
      const players = parsePlayers(await res.text())
      if (players.length === 0) throw new Error(`${name}: 0 players parsed`)
      return { id, slug, players }
    }
    if (attempt >= 5) throw new Error(`${name} ${slug}/${id} -> HTTP ${res.status}`)
    await sleep(1000 * attempt)
  }
}

async function run() {
  const names = Object.keys(JSON.parse(process.env.NAMES))
  const out = {}
  const fails = []
  const CONC = 4
  let i = 0
  async function worker() {
    while (i < names.length) {
      const name = names[i++]
      try {
        out[name] = await scrapeTeam(name)
        process.stdout.write('.')
      } catch (e) {
        fails.push(e.message)
        process.stdout.write('x')
      }
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker))
  writeFileSync('/tmp/ea_players.json', JSON.stringify(out))
  console.log(`\nDone: ${Object.keys(out).length}/${names.length}`)
  if (fails.length) console.log('FAILS:\n' + fails.join('\n'))
}
run()

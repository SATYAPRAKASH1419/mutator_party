/* settings.js - room settings: defaults + server-side validation (reference implementation, no dependencies).
   Never trust the client: the server runs sanitize() on every settings:update from the host. */
const MODES = ['brawl', 'bomb', 'crown'];
const TWISTS = ['low','heavy','tiny','giant','lotto','reverse','ice','speed','flap','crumble','wind','dark','bounce'];
const ITEMS = ['mega', 'freeze', 'swap', 'shield'];
const THEMES = ['sunny','neon','candy','frozen','desert','space','diwali'];
const DEFAULTS = {
  version: 1,
  room:   { name:'', visibility:'private', password:'', chat:'emotes', spectators:true },
  match:  { maxPlayers:8, fillBots:true, botSkill:'normal', rounds:5, roundTime:'auto', scoring:'standard' },
  arena:  { platformCount:4, islandSize:'M', layout:'every_round', mirror:true, shuffleSpawns:true },
  modes:  { pool:[...MODES], order:'shuffle_bag', fixedList:[], twistPicker:'last_place' },
  twists: { allowed:[...TWISTS], perRound:'ramp', themeLinked:false },
  respawn:{ mode:'lives', lives:3, delaySec:2, shieldSec:1.5 },
  items:  { enabled:true, allowed:[...ITEMS], spots:3, firstTouch:true, keepOnKO:false },
  theme:  { mode:'rotate', fixed:'sunny', perRound:[] },
};
const clamp = (v, a, b, d) => (Number.isFinite(+v) ? Math.min(b, Math.max(a, +v)) : d);
const oneOf = (v, list, d) => (list.includes(v) ? v : d);
const subset = (arr, list, d) => { const a = Array.isArray(arr) ? [...new Set(arr.filter(x => list.includes(x)))] : []; return a.length ? a : d.slice(); };
function sanitize(input = {}, base = DEFAULTS){
  const i = input, o = JSON.parse(JSON.stringify(base)), g = k => (i[k] && typeof i[k] === 'object' ? i[k] : {});
  const r = g('room'), m = g('match'), a = g('arena'), md = g('modes'), t = g('twists'), rs = g('respawn'), it = g('items'), th = g('theme');
  o.room.name = String(r.name ?? o.room.name).replace(/[^\p{L}\p{N} _'-]/gu, '').trim().slice(0, 24);
  o.room.visibility = oneOf(r.visibility, ['private', 'public'], o.room.visibility);
  o.room.password = String(r.password ?? '').slice(0, 12);
  o.room.chat = oneOf(r.chat, ['off', 'emotes', 'filtered'], o.room.chat);
  o.room.spectators = r.spectators !== false;
  o.match.maxPlayers = clamp(m.maxPlayers, 2, 12, 8);
  o.match.fillBots = m.fillBots !== false;
  o.match.botSkill = oneOf(m.botSkill, ['easy', 'normal', 'hard'], 'normal');
  o.match.rounds = clamp(m.rounds, 1, 15, 5);
  o.match.roundTime = m.roundTime === 'auto' || m.roundTime == null ? 'auto' : clamp(m.roundTime, 30, 120, 'auto');
  o.match.scoring = oneOf(m.scoring, ['standard', 'winner_plus', 'kills'], 'standard');
  o.arena.platformCount = Math.round(clamp(a.platformCount, 2, 8, 4));
  o.arena.islandSize = oneOf(a.islandSize, ['S', 'M', 'L'], 'M');
  o.arena.layout = oneOf(a.layout, ['every_round', 'per_match', 'classic'], 'every_round');
  o.arena.mirror = a.mirror !== false;
  o.arena.shuffleSpawns = a.shuffleSpawns !== false;
  o.modes.pool = subset(md.pool, MODES, MODES);
  o.modes.order = oneOf(md.order, ['shuffle_bag', 'random', 'fixed'], 'shuffle_bag');
  o.modes.fixedList = Array.isArray(md.fixedList) ? md.fixedList.filter(x => MODES.includes(x)).slice(0, 15) : [];
  o.modes.twistPicker = oneOf(md.twistPicker, ['last_place', 'vote', 'host', 'random', 'round_robin'], 'last_place');
  o.twists.allowed = Array.isArray(t.allowed) ? [...new Set(t.allowed.filter(x => TWISTS.includes(x)))] : TWISTS.slice(); // empty = no twists, allowed
  o.twists.perRound = oneOf(t.perRound, ['1', '2', '3', 'ramp'], 'ramp');
  o.twists.themeLinked = t.themeLinked === true;
  o.respawn.mode = oneOf(rs.mode, ['off', 'lives', 'unlimited'], 'lives');
  o.respawn.lives = Math.round(clamp(rs.lives, 1, 9, 3));
  o.respawn.delaySec = clamp(rs.delaySec, 1, 5, 2);
  o.respawn.shieldSec = clamp(rs.shieldSec, 0, 3, 1.5);
  o.items.enabled = it.enabled !== false;
  o.items.allowed = Array.isArray(it.allowed) ? [...new Set(it.allowed.filter(x => ITEMS.includes(x)))] : ITEMS.slice();
  o.items.spots = Math.round(clamp(it.spots, 0, 5, 3));
  o.items.firstTouch = it.firstTouch !== false;
  o.items.keepOnKO = it.keepOnKO === true;
  o.theme.mode = oneOf(th.mode, ['fixed', 'rotate', 'random', 'custom'], 'rotate');
  o.theme.fixed = oneOf(th.fixed, THEMES, 'sunny');
  o.theme.perRound = Array.isArray(th.perRound) ? th.perRound.filter(x => THEMES.includes(x)).slice(0, 15) : [];
  return o;
}
if (typeof module !== 'undefined') module.exports = { DEFAULTS, sanitize, MODES, TWISTS, ITEMS, THEMES };

import LIST from './aircraft.json'
const ZOOM = [6, 4, 2.8, 2, 1.4, 1]
const $ = id => document.getElementById(id)
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const strip = h => { const d = document.createElement('div'); d.innerHTML = h || ''; return d.textContent.trim() }
const start = Date.UTC(2026, 9, 11)
const now = new Date()
const dayNum = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - start) / 864e5)
const today = 'd' + dayNum
const params = new URLSearchParams(location.search)
const PRACTICE = params.has('practice') || params.has('unlimited')
const mod = (a, n) => ((a % n) + n) % n
// spread days across the list so neighbours differ
let idx = mod(dayNum * 17, LIST.length)
const fresh = () => ({ guesses: [], done: false, won: false })
let state = PRACTICE ? fresh() : JSON.parse(localStorage.getItem('pl-' + today) || 'null') || fresh()
let stats = JSON.parse(localStorage.getItem('pl-stats') || 'null') || { played: 0, wins: 0, streak: 0, best: 0, last: null, dist: [0, 0, 0, 0, 0, 0] }
let item = null, picked = null, matches = [], active = -1, focus = [50, 50]
const save = () => PRACTICE || localStorage.setItem('pl-' + today, JSON.stringify(state))
const say = m => { $('status').textContent = m }
const step = () => state.done ? 5 : Math.min(state.guesses.length, 5)
const seed = n => { const x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x) }

$('seg').innerHTML = ZOOM.map(() => '<div class="s" style="flex:1"><i></i></div>').join('')

async function load() {
  const i = idx, a = LIST[i]
  $('img').removeAttribute('src'); $('loading').hidden = false
  const u = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1280&titles=' + encodeURIComponent(a.file)
  const j = await (await fetch(u)).json()
  if (i !== idx) return
  const ii = Object.values(j.query.pages)[0].imageinfo?.[0]
  if (!ii) throw new Error('missing image')
  const m = ii.extmetadata || {}
  item = { ...a, src: ii.thumburl || ii.url, page: ii.descriptionurl, author: strip(m.Artist?.value) || 'Unknown', license: m.LicenseShortName?.value || 'See file page', licenseUrl: m.LicenseUrl?.value }
  focus = [35 + seed(i + dayNum) * 30, 35 + seed(i * 7 + 3) * 30]
  const img = $('img')
  img.onload = () => { $('loading').hidden = true }
  img.src = item.src
  render()
}

function render() {
  $('board').innerHTML = ZOOM.map((_, i) => {
    const g = state.guesses[i]
    if (g === undefined) return `<li class="row ${i === state.guesses.length && !state.done ? 'next' : ''}"><span class="n">${i + 1}</span></li>`
    if (g === 'SKIP') return `<li class="row skip"><span class="ic" aria-hidden="true">⏭</span><span>Skipped</span></li>`
    if (g === 'RIGHT') return `<li class="row right"><span class="ic" aria-hidden="true">✓</span><span>${esc(item ? item.answer : 'Correct')}</span></li>`
    return `<li class="row wrong"><span class="ic" aria-hidden="true">✕</span><span>${esc(g)}</span></li>`
  }).join('')
  const s = step()
  ;[...$('seg').children].forEach((el, i) => el.classList.toggle('on', i <= s))
  $('unlocked').textContent = state.done ? 'Full photo' : `Zoom level ${s + 1} of 6`
  const img = $('img')
  img.style.transformOrigin = `${focus[0]}% ${focus[1]}%`
  img.style.transform = `scale(${ZOOM[s]})`
  $('skip').textContent = state.guesses.length >= 5 ? 'Give up' : 'Skip (zoom out)'
  if (state.done && item) showEnd()
}

function finish(won) {
  state.done = true; state.won = won; save()
  if (!PRACTICE) {
    stats.played++
    if (won) {
      stats.wins++; stats.dist[state.guesses.length - 1]++
      stats.streak = stats.last === 'd' + (dayNum - 1) ? stats.streak + 1 : 1
      stats.best = Math.max(stats.best, stats.streak)
    } else stats.streak = 0
    stats.last = today
    localStorage.setItem('pl-stats', JSON.stringify(stats))
  }
  render()
}

function guess(g) {
  if (state.done || !item) return
  state.guesses.push(g); save()
  if (g === 'RIGHT') return finish(true)
  if (state.guesses.length >= 6) return finish(false)
  say(g === 'SKIP' ? 'Skipped' : 'Not quite'); render()
}

const squares = () => state.guesses.map(g => g === 'RIGHT' ? '🟩' : g === 'SKIP' ? '⬛' : '🟥').join('') + '⬜'.repeat(6 - state.guesses.length)
const statsHtml = () => {
  const max = Math.max(1, ...stats.dist)
  return `<div class="nums"><div><b>${stats.played}</b>Played</div><div><b>${stats.played ? Math.round(stats.wins / stats.played * 100) : 0}%</b>Won</div><div><b>${stats.streak}</b>Streak</div><div><b>${stats.best}</b>Best</div></div>
  <div class="dist">${stats.dist.map((n, i) => `<div><span>${i + 1}</span><i style="width:${8 + n / max * 92}%">${n}</i></div>`).join('')}</div>`
}
function countdown() {
  const d = new Date(), t = new Date(d); t.setHours(24, 0, 0, 0)
  const s = Math.floor((t - d) / 1000), el = $('cd')
  if (el) el.textContent = [s / 3600, s / 60 % 60, s % 60].map(x => String(Math.floor(x)).padStart(2, '0')).join(':')
}

function showEnd() {
  $('game').hidden = true
  const e = $('end'); e.hidden = false
  const lic = item.licenseUrl ? `<a href="${esc(item.licenseUrl)}" target="_blank" rel="noopener">${esc(item.license)}</a>` : esc(item.license)
  e.innerHTML = `<p class="verdict ${state.won ? 'win' : 'lose'}">${state.won ? `You got it in ${state.guesses.length}!` : "Not today. Here's the answer."}</p>
  <div class="card"><h2>${esc(item.answer)}</h2>
  <p class="credit">Photo by ${esc(item.author)}, ${lic}, via <a href="${esc(item.page)}" target="_blank" rel="noopener">Wikimedia Commons</a></p></div>
  <p class="sq" aria-label="Your result">${squares()}</p>
  <button id="share" class="btn primary wide">Share result</button>
  ${PRACTICE ? '<p class="next">Practice round. Stats are not saved.</p>' : `${statsHtml()}<p class="next">Next aircraft in <b id="cd">--:--:--</b></p>`}`
  $('share').onclick = async () => {
    const txt = `Planedle ${PRACTICE ? 'practice' : '#' + (dayNum + 1)}\n✈️${squares()}\n${location.origin + location.pathname}`
    try { if (navigator.share && matchMedia('(pointer:coarse)').matches) await navigator.share({ text: txt }); else { await navigator.clipboard.writeText(txt); $('share').textContent = 'Copied to clipboard' } } catch {}
  }
  if (!PRACTICE) { countdown(); clearInterval(window.cdT); window.cdT = setInterval(countdown, 1000) }
}

// autocomplete from local list
const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
const NAMES = LIST.map(a => a.answer).sort()
const input = $('guess'), list = $('sugg')
function setActive(i) {
  active = i
  ;[...list.children].forEach((li, j) => { li.setAttribute('aria-selected', j === i); if (j === i) li.scrollIntoView({ block: 'nearest' }) })
  input.setAttribute('aria-activedescendant', i >= 0 ? 'opt' + i : '')
}
function close() { list.innerHTML = ''; matches = []; active = -1; $('combo').setAttribute('aria-expanded', 'false') }
function pick(n) { picked = n; input.value = n; close(); $('submit').disabled = false; $('submit').focus() }
input.oninput = () => {
  picked = null; $('submit').disabled = !input.value.trim()
  const q = norm(input.value)
  if (!q) return close()
  matches = LIST.filter(a => [a.answer, ...a.aliases].some(x => norm(x).includes(q))).map(a => a.answer).sort().slice(0, 8)
  list.innerHTML = ''; active = -1
  matches.forEach((n, i) => {
    const li = document.createElement('li'); li.id = 'opt' + i; li.setAttribute('role', 'option')
    li.innerHTML = `<span><b>${esc(n)}</b></span>`
    li.onmousedown = e => { e.preventDefault(); pick(n) }
    list.appendChild(li)
  })
  $('combo').setAttribute('aria-expanded', matches.length > 0)
}
input.onkeydown = e => {
  if (e.key === 'ArrowDown' && matches.length) { e.preventDefault(); setActive((active + 1) % matches.length) }
  else if (e.key === 'ArrowUp' && matches.length) { e.preventDefault(); setActive((active - 1 + matches.length) % matches.length) }
  else if (e.key === 'Enter') { e.preventDefault(); if (active >= 0) pick(matches[active]); else submit() }
  else if (e.key === 'Escape') close()
}
input.onblur = () => setTimeout(close, 100)

function submit() {
  const v = input.value.trim(); if (!v || !item) return
  const q = norm(v)
  const right = [item.answer, ...item.aliases].some(x => norm(x) === q)
  input.value = ''; picked = null; $('submit').disabled = true; close()
  guess(right ? 'RIGHT' : v)
}
$('submit').onclick = submit
$('skip').onclick = () => guess('SKIP')
$('helpBtn').onclick = () => $('help').showModal()
$('statsBtn').onclick = () => { $('statsBody').innerHTML = statsHtml(); $('statsD').showModal() }
document.querySelectorAll('dialog').forEach(d => d.onclick = e => { if (e.target === d) d.close() })
if (!localStorage.getItem('pl-seen')) { localStorage.setItem('pl-seen', '1'); $('help').showModal() }

function newOne() {
  const others = LIST.map((_, i) => i).filter(i => i !== idx)
  idx = others[Math.floor(Math.random() * others.length)]
  state = fresh(); item = null
  $('end').hidden = true; $('end').innerHTML = ''; $('game').hidden = false
  render(); load().then(() => say('New aircraft loaded')).catch(() => say('Could not load the photo. Try again.'))
}
if (PRACTICE) {
  $('mode').hidden = false; $('newOne').hidden = false; $('newOne').onclick = newOne
  newOne()
} else {
  render()
  load().catch(() => say("Could not load today's photo. Try again later."))
}

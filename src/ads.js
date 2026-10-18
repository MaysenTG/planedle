// Banner ads. Fill in the AdSense client and slot ids to serve Google ads.
// Until then, the labeled house banners below are what players see.
// When you add a client id, also add public/ads.txt:
// google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0
//
// Ads are off while Ko-fi is shown in the same slots. Set ADS.enabled back to
// true (and KOFI.enabled to false) to bring ads back without rewriting this file.
export const ADS = {
  enabled: false,
  adsense: {
    client: '',
    slots: { top: '', end: '' }
  },
  banners: [
    {
      places: ['top', 'end'],
      show: 'daily',
      href: '?practice=1',
      title: 'Keep spotting',
      text: 'Unlimited aircraft after today’s round. Stats stay on the daily game.',
      cta: 'Play'
    },
    {
      places: ['top', 'end'],
      show: 'practice',
      href: './',
      title: 'Today’s aircraft',
      text: 'One plane for everyone, with a streak that resets at midnight.',
      cta: 'Play'
    }
  ]
}

export const KOFI = {
  enabled: true,
  text: 'Ko-fi',
  color: '#3a3f4a',
  id: 'P0L528ZW9A',
  script: 'https://storage.ko-fi.com/cdn/widget/Widget_2.js'
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

function houseBanner(banner) {
  return `<a class="ad-banner" href="${esc(banner.href)}"><span class="ad-kicker">Ad</span><span class="ad-copy"><b>${esc(banner.title)}</b><small>${esc(banner.text)}</small></span><span class="ad-cta">${esc(banner.cta)}</span></a>`
}

let adsenseScriptStarted = false
function renderAdsense(el, client, slot) {
  el.innerHTML = `<span class="ad-label">Advertisement</span><ins class="adsbygoogle" style="display:block" data-ad-client="${esc(client)}" data-ad-slot="${esc(slot)}" data-ad-format="auto" data-full-width-responsive="true"></ins>`
  if (!adsenseScriptStarted) {
    adsenseScriptStarted = true
    const script = document.createElement('script')
    script.async = true
    script.crossOrigin = 'anonymous'
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(client)
    document.head.appendChild(script)
  }
  window.adsbygoogle = window.adsbygoogle || []
  window.adsbygoogle.push({})
}

function fill(el, practice) {
  const place = el.dataset.ad
  const client = ADS.adsense.client.trim()
  const slot = (ADS.adsense.slots[place] || '').trim()
  if (client && slot) {
    renderAdsense(el, client, slot)
    return
  }
  const mode = practice ? 'practice' : 'daily'
  const banners = ADS.banners.filter(b => (!b.places || b.places.includes(place)) && (!b.show || b.show === 'all' || b.show === mode))
  if (!banners.length) {
    el.hidden = true
    return
  }
  const pick = banners[Math.floor(Date.now() / 864e5) % banners.length]
  el.innerHTML = houseBanner(pick)
}

let kofiLoad = null
function loadKofiWidget() {
  if (window.kofiwidget2) return Promise.resolve(window.kofiwidget2)
  if (kofiLoad) return kofiLoad
  kofiLoad = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = KOFI.script
    script.onload = () => resolve(window.kofiwidget2)
    script.onerror = () => reject(new Error('Could not load Ko-fi widget'))
    document.head.appendChild(script)
  })
  return kofiLoad
}

async function fillKofi(el) {
  try {
    const widget = await loadKofiWidget()
    // Prefer getHTML over draw(): draw() uses document.writeln and would wipe the page.
    widget.init(KOFI.text, KOFI.color, KOFI.id)
    el.innerHTML = widget.getHTML()
  } catch {
    el.innerHTML = `<div class="btn-container"><a class="kofi-button" style="background-color:${esc(KOFI.color)}" href="https://ko-fi.com/${esc(KOFI.id)}" target="_blank" rel="noopener">${esc(KOFI.text)}</a></div>`
  }
}

export function mountAds(practice) {
  const slots = document.querySelectorAll('[data-ad]')
  const support = document.querySelector('[data-kofi]')

  if (ADS.enabled) {
    if (support) support.hidden = true
    slots.forEach(el => fill(el, practice))
    return
  }

  slots.forEach(el => { el.hidden = true })
  if (KOFI.enabled && support) {
    support.hidden = false
    fillKofi(support)
    return
  }
  if (support) support.hidden = true
}

// Banner ads. Fill in the AdSense client and slot ids to serve Google ads.
// Until then, the labeled house banners below are what players see.
// When you add a client id, also add public/ads.txt:
// google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0
export const ADS = {
  enabled: true,
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

export function mountAds(practice) {
  document.querySelectorAll('[data-ad]').forEach(el => {
    if (!ADS.enabled) {
      el.hidden = true
      return
    }
    fill(el, practice)
  })
}

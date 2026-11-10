
const ENTRY = { url: 'https://github.com/zhounian6688-like/dsh-postman-desktop' };
const HOSTS = new Set(['raw.githubusercontent.com','user-images.githubusercontent.com','camo.githubusercontent.com','github.com']);
function decompose(url){ const r=url.replace('https://github.com/','').replace(/\/$/,''); return { repo:r.split('/').slice(0,2).join('/'), sub: r.includes('/tree/') ? r.split('/tree/')[1].replace(/^[^/]+\//,'') : null }; }
const { repo, sub } = decompose(ENTRY.url);
const base = `https://raw.githubusercontent.com/${repo}/HEAD/${sub ? sub + '/' : ''}`;
const res = await fetch(base + 'screenshots.json', { headers: { 'user-agent': 'awesome-dsh-plugin-screenshot-probe' } });
console.log('screenshots.json status', res.status);
const doc = await res.json();
const list = Array.isArray(doc) ? doc : (Array.isArray(doc?.screenshots) ? doc.screenshots : null);
console.log('list', list);
const shots = list.map(s => base + s.split('/').map(encodeURIComponent).join('/'));
for (const s of shots) {
  const r = await fetch(s, { headers: { range: 'bytes=0-0', 'user-agent': 'probe' }, redirect: 'follow' });
  console.log(r.status, s.replace('https://raw.githubusercontent.com/',''));
}

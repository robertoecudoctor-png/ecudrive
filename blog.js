/* Blog ECU DRIVE: citește articolele din blog/posts.json (editat din panoul /admin) */
(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = d => new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });
  const minutes = body => Math.max(1, Math.round(String(body || '').split(/\s+/).length / 200));
  const url = p => `articol.html?p=${encodeURIComponent(p.slug)}`;
  const cover = p => {
    const fb = '<div class="cover-fb"><span>ECU <b>DRIVE</b></span></div>';
    if (!p.cover) return fb;
    // dacă imaginea lipsește, rămâne coperta de rezervă dedesubt
    return `${fb}<img src="${esc(p.cover)}" alt="${esc(p.title)}" loading="lazy" style="position:relative" onerror="this.remove()">`;
  };

  const load = () => fetch('blog/posts.json', { cache: 'no-store' })
    .then(r => r.json())
    .then(d => (d.posts || []).filter(p => p.title && p.slug).sort((a, b) => new Date(b.date) - new Date(a.date)));

  const card = (p, i, feat) => `
    <a class="pcard${feat ? ' pcard--feat' : ''}" href="${url(p)}" style="--d:${i * 0.07}s">
      <div class="pcard__img">${cover(p)}</div>
      <div class="pcard__body">
        <div class="pcard__meta">${p.category ? `<span class="tag">${esc(p.category)}</span>` : ''}<span>${fmt(p.date)}</span></div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.excerpt)}</p>
        <span class="more">Citește articolul <i>→</i></span>
      </div>
    </a>`;

  const fail = el => { el.innerHTML = '<p class="empty">Articolele nu au putut fi încărcate.</p>'; };

  /* Ultimele articole pe prima pagină */
  const latest = $('#latestPosts');
  if (latest) load().then(ps => {
    if (!ps.length) { latest.closest('section').remove(); return; }
    latest.innerHTML = ps.slice(0, 3).map((p, i) => card(p, i)).join('');
  }).catch(() => latest.closest('section').remove());

  /* Lista de articole */
  const list = $('#blogList');
  if (list) load().then(ps => {
    const chips = $('#chips'), q = $('#q');
    let cat = 'Toate';
    const cats = ['Toate', ...new Set(ps.map(p => p.category).filter(Boolean))];
    chips.innerHTML = cats.map(c => `<button type="button" class="${c === cat ? 'on' : ''}">${esc(c)}</button>`).join('');
    const render = () => {
      const term = q.value.trim().toLowerCase();
      const shown = ps.filter(p => (cat === 'Toate' || p.category === cat) &&
        (!term || (p.title + ' ' + p.excerpt + ' ' + p.body).toLowerCase().includes(term)));
      list.innerHTML = shown.length
        ? shown.map((p, i) => card(p, i, i === 0 && cat === 'Toate' && !term)).join('')
        : '<p class="empty">Niciun articol găsit.</p>';
    };
    chips.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      cat = b.textContent;
      [...chips.children].forEach(x => x.classList.toggle('on', x === b));
      render();
    });
    q.addEventListener('input', render);
    render();
  }).catch(() => fail(list));

  /* Articol */
  const art = $('#post');
  if (art) load().then(ps => {
    const slug = new URLSearchParams(location.search).get('p');
    const p = ps.find(x => x.slug === slug);
    if (!p) {
      art.innerHTML = '<div class="article__head"><h1>Articolul nu există</h1><p class="sub">Poate a fost mutat sau șters.</p><p style="margin-top:24px"><a class="btn" href="blog.html">Înapoi la blog</a></p></div>';
      return;
    }
    document.title = `${p.title} | Blog ECU DRIVE`;
    const md = window.marked ? marked.parse(p.body || '') : esc(p.body).replace(/\n{2,}/g, '</p><p>').replace(/^/, '<p>') + '</p>';
    const html = window.DOMPurify ? DOMPurify.sanitize(md) : md;
    const link = location.href;
    art.innerHTML = `
      <header class="article__head">
        <p class="crumbs"><a href="index.html">Acasă</a> / <a href="blog.html">Blog</a>${p.category ? ' / ' + esc(p.category) : ''}</p>
        <h1><span class="chrome">${esc(p.title)}</span></h1>
        <div class="article__meta">${p.category ? `<span class="tag">${esc(p.category)}</span>` : ''}<span>${fmt(p.date)}</span><span>· ${minutes(p.body)} min citire</span></div>
      </header>
      ${p.cover ? `<figure class="article__cover"><img src="${esc(p.cover)}" alt="${esc(p.title)}" onerror="this.parentNode.innerHTML='<div class=&quot;cover-fb&quot;><span>ECU <b>DRIVE</b></span></div>'"></figure>` : ''}
      <div class="prose">${html}</div>
      <div class="share">
        <span>Distribuie</span>
        <a href="https://wa.me/?text=${encodeURIComponent(p.title + ' ' + link)}" target="_blank" rel="noopener">WhatsApp</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}" target="_blank" rel="noopener">Facebook</a>
        <button type="button" id="copyLink">Copiază linkul</button>
      </div>
      <div class="cta-box">
        <h2>Ai o problemă <span class="grad">asemănătoare?</span></h2>
        <p>Descrie-ne simptomele și revenim cu o soluție în maximum 24 de ore.</p>
        <div class="hero__cta"><a class="btn btn--lg" href="index.html#contact">Programează-te <i>→</i></a><a class="btn btn--ghost btn--lg" href="tel:+40773492879">Sună acum</a></div>
      </div>`;
    $('#copyLink').addEventListener('click', e => {
      navigator.clipboard?.writeText(link).then(() => { e.target.textContent = 'Link copiat ✓'; });
    });
    const rel = ps.filter(x => x !== p).sort((a, b) => (b.category === p.category) - (a.category === p.category)).slice(0, 3);
    if (rel.length) {
      $('#related').hidden = false;
      $('#relatedList').innerHTML = rel.map((x, i) => card(x, i)).join('');
    }
  }).catch(() => fail(art));
})();

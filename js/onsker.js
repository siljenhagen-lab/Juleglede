(() => {
  'use strict';

  // Ønskelistene er det eneste som deles mellom enheter (via Supabase).
  // Hva man har lagt i Gaver lagres bare lokalt, så den som ønsker seg noe ikke ser det.
  const CFG_KEY = 'juleglede.onsker.supabase';
  const ME_KEY = 'juleglede.onsker.me';
  const CACHE_KEY = 'juleglede.onsker.cache';
  const OPEN_KEY = 'juleglede.onsker.open';
  const TABLE = 'wishes';
  const REFRESH_MS = 30000;

  const J = window.Juleglede;
  const $ = (sel) => document.querySelector(sel);

  const sbForm = $('#sb-form');
  const meForm = $('#me-form');
  const main = $('#wish-main');
  const meLabel = $('#me-label');
  const statusEl = $('#wish-status');
  const listsEl = $('#wish-lists');
  const ownerList = $('#owner-list');

  const read = (k, fallback) => {
    try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? fallback : v; } catch (e) { return fallback; }
  };
  const write = (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignorer */ }
  };

  let wishes = read(CACHE_KEY, []);
  let me = read(ME_KEY, '');
  let open = read(OPEN_KEY, {});
  let timer = null;
  let loading = false;

  const key = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');

  function config() {
    const fileCfg = window.JULEGLEDE_SUPABASE || {};
    if (fileCfg.url && fileCfg.key) return { url: fileCfg.url, key: fileCfg.key, fromFile: true };
    const c = read(CFG_KEY, null);
    return c && c.url && c.key ? c : null;
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // ---------- Supabase (REST) ----------
  async function api(method, query = '', body) {
    const cfg = config();
    const headers = { apikey: cfg.key, 'Content-Type': 'application/json' };
    // Eldre anon-nøkler er JWT-er og sendes også som Bearer. Nye publishable-nøkler sendes bare som apikey.
    if (cfg.key.startsWith('eyJ')) headers.Authorization = `Bearer ${cfg.key}`;
    if (method !== 'GET') headers.Prefer = 'return=representation';
    const res = await fetch(`${cfg.url.replace(/\/+$/, '')}/rest/v1/${TABLE}${query}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      let msg = `${res.status}`;
      try { const j = await res.json(); msg = j.message || j.hint || msg; } catch (e) { /* ignorer */ }
      throw new Error(msg);
    }
    return res.status === 204 ? null : res.json();
  }

  function setStatus(text, isError = false) {
    statusEl.textContent = text;
    statusEl.classList.toggle('error', isError);
  }

  async function refresh() {
    if (!config() || loading) return;
    loading = true;
    setStatus('Henter …');
    try {
      wishes = await api('GET', '?select=id,owner,title,link,note,created_at&order=created_at.asc');
      write(CACHE_KEY, wishes);
      const t = new Date().toLocaleTimeString('no', { hour: '2-digit', minute: '2-digit' });
      setStatus(`Oppdatert ${t}`);
    } catch (e) {
      setStatus(`Fikk ikke kontakt (${e.message}). Viser sist lagrede.`, true);
    } finally {
      loading = false;
      render();
    }
  }

  async function addWish(title, link, note) {
    setStatus('Lagrer …');
    try {
      const [row] = await api('POST', '', { owner: me, title, link: link || null, note: note || null });
      wishes.push(row);
      write(CACHE_KEY, wishes);
      setStatus('Lagret');
      render();
      return true;
    } catch (e) {
      setStatus(`Kunne ikke lagre (${e.message})`, true);
      return false;
    }
  }

  async function deleteWish(id) {
    setStatus('Sletter …');
    try {
      await api('DELETE', `?id=eq.${encodeURIComponent(id)}`);
      wishes = wishes.filter((w) => w.id !== id);
      write(CACHE_KEY, wishes);
      setStatus('Slettet');
      render();
    } catch (e) {
      setStatus(`Kunne ikke slette (${e.message})`, true);
    }
  }

  // ---------- Oppsett ----------
  sbForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = $('#sb-url').value.trim();
    const k = $('#sb-key').value.trim();
    if (!/^https:\/\/[^\s/]+/.test(url)) {
      alert('Adressen må starte med https://, f.eks. https://xxxx.supabase.co');
      return;
    }
    write(CFG_KEY, { url, key: k });
    show();
  });

  $('#sb-reset').addEventListener('click', () => {
    if (config() && config().fromFile) {
      alert('Supabase er satt opp i js/config.js og kan bare endres der.');
      return;
    }
    if (!confirm('Koble denne enheten fra Supabase? Ønskelistene blir liggende i Supabase.')) return;
    localStorage.removeItem(CFG_KEY);
    localStorage.removeItem(CACHE_KEY);
    wishes = [];
    show();
  });

  meForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#me-name').value.trim();
    if (!name) return;
    // Bruk samme skrivemåte som en eksisterende liste hvis navnet finnes.
    const existing = wishes.find((w) => key(w.owner) === key(name));
    me = existing ? existing.owner : name;
    write(ME_KEY, me);
    show();
  });

  $('#me-change').addEventListener('click', () => {
    $('#me-name').value = me;
    me = '';
    write(ME_KEY, '');
    show();
  });

  $('#wish-refresh').addEventListener('click', refresh);

  // ---------- Lister ----------
  listsEl.addEventListener('submit', async (e) => {
    if (!e.target.matches('.wish-form')) return;
    e.preventDefault();
    const f = e.target.elements;
    const title = f.title.value.trim();
    if (!title) return;
    const rawLink = f.link.value.trim();
    const link = J.normalizeLink(rawLink);
    if (rawLink && !link) {
      alert('Lenken ser ikke riktig ut. Den må være en nettadresse, f.eks. https://www.eksempel.no/produkt');
      return;
    }
    f.submit.disabled = true;
    const ok = await addWish(title, link, f.note.value.trim());
    const form = listsEl.querySelector('.wish-form');
    if (form) {
      if (ok) form.reset();
      form.elements.title.focus();
    }
  });

  listsEl.addEventListener('click', (e) => {
    const t = e.target;
    const row = t.closest('.wish');
    const wish = row && wishes.find((w) => String(w.id) === row.dataset.id);

    if (t.closest('.wish-owner-toggle')) {
      const k = t.closest('.wish-list').dataset.owner;
      open[k] = !open[k];
      write(OPEN_KEY, open);
      render();
    } else if (wish && t.closest('.wish-del')) {
      if (confirm(`Slette «${wish.title}» fra ønskelista di?`)) deleteWish(wish.id);
    } else if (wish && t.closest('.wish-to-gift')) {
      J.gaver.addFromWish({ person: wish.owner, name: wish.title, link: wish.link || '', wishId: `wish:${wish.id}` });
      render();
    }
  });

  // Hold «Lagt i Gaver»-merket riktig hvis gaven slettes i Gaver-fanen.
  document.addEventListener('handel:changed', () => { if (main.offsetParent) render(); });

  function renderWish(w, mine) {
    const li = el('li', 'wish');
    li.dataset.id = w.id;
    const text = el('div', 'text');
    text.appendChild(el('span', 'name', w.title));
    if (w.note) text.appendChild(el('span', 'note', w.note));
    const link = w.link && J.normalizeLink(w.link);
    if (link) {
      const a = el('a', 'link', '🔗 Se produkt');
      a.href = link;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      text.appendChild(a);
    }
    li.appendChild(text);

    if (mine) {
      const del = el('button', 'del wish-del', '×');
      del.type = 'button';
      del.setAttribute('aria-label', `Slett ${w.title}`);
      li.appendChild(del);
    } else if (J.gaver.hasWish(`wish:${w.id}`)) {
      li.appendChild(el('span', 'chip on', '✓ I Gaver'));
    } else {
      const btn = el('button', 'chip wish-to-gift', '🎁 Legg til i Gaver');
      btn.type = 'button';
      li.appendChild(btn);
    }
    return li;
  }

  function renderForm() {
    const f = el('form', 'wish-form');
    f.autocomplete = 'off';
    const input = (name, placeholder) => {
      const i = el('input');
      i.name = name;
      i.placeholder = placeholder;
      return i;
    };
    const title = input('title', 'Hva ønsker du deg?');
    title.required = true;
    const link = input('link', 'Lenke (valgfritt)');
    link.inputMode = 'url';
    const note = input('note', 'Kommentar, f.eks. str. M (valgfritt)');
    const btn = el('button', 'btn primary', 'Legg til ønske');
    btn.type = 'submit';
    btn.name = 'submit';
    f.append(title, link, note, btn);
    return f;
  }

  function render() {
    const groups = new Map();
    groups.set(key(me), { name: me, items: [] });
    wishes.forEach((w) => {
      const k = key(w.owner);
      if (!groups.has(k)) groups.set(k, { name: w.owner, items: [] });
      groups.get(k).items.push(w);
    });

    // Behold påbegynt tekst i skjemaet.
    const oldForm = listsEl.querySelector('.wish-form');
    const draft = oldForm && {
      title: oldForm.elements.title.value, link: oldForm.elements.link.value, note: oldForm.elements.note.value,
      focused: oldForm.contains(document.activeElement) ? document.activeElement.name : null,
    };

    listsEl.innerHTML = '';
    const others = [...groups.entries()]
      .filter(([k]) => k !== key(me))
      .sort(([, a], [, b]) => a.name.localeCompare(b.name, 'no'));

    // Min liste først, alltid åpen.
    const mine = groups.get(key(me));
    const myCard = el('article', 'card wish-list mine');
    myCard.appendChild(el('h2', 'wish-owner', `⭐ Min ønskeliste (${mine.items.length})`));
    if (mine.items.length) {
      const ul = el('ul', 'items');
      mine.items.forEach((w) => ul.appendChild(renderWish(w, true)));
      myCard.appendChild(ul);
    }
    myCard.appendChild(renderForm());
    listsEl.appendChild(myCard);

    if (others.length) listsEl.appendChild(el('h3', 'section-title', 'Andres ønskelister'));
    others.forEach(([k, grp]) => {
      const card = el('article', 'card wish-list');
      card.dataset.owner = k;
      const isOpen = !!open[k];
      const head = el('button', 'wish-owner-toggle prod-toggle');
      head.type = 'button';
      head.setAttribute('aria-expanded', isOpen);
      head.appendChild(el('span', 'prod-name', `🎄 ${grp.name}`));
      const added = grp.items.filter((w) => J.gaver.hasWish(`wish:${w.id}`)).length;
      head.appendChild(el('span', 'prod-meta',
        `${grp.items.length} ${grp.items.length === 1 ? 'ønske' : 'ønsker'}${added ? ` · ${added} i Gaver` : ''}`));
      head.appendChild(el('span', 'chevron', isOpen ? '▾' : '▸'));
      card.appendChild(head);
      if (isOpen) {
        const ul = el('ul', 'items');
        grp.items.forEach((w) => ul.appendChild(renderWish(w, false)));
        card.appendChild(ul);
      }
      listsEl.appendChild(card);
    });

    if (draft) {
      const f = listsEl.querySelector('.wish-form');
      f.elements.title.value = draft.title;
      f.elements.link.value = draft.link;
      f.elements.note.value = draft.note;
      if (draft.focused && f.elements[draft.focused]) f.elements[draft.focused].focus();
    }
  }

  function fillOwnerList() {
    ownerList.innerHTML = '';
    const seen = new Set();
    wishes.forEach((w) => {
      if (seen.has(key(w.owner))) return;
      seen.add(key(w.owner));
      const o = el('option');
      o.value = w.owner;
      ownerList.appendChild(o);
    });
  }

  // Viser riktig steg: oppsett → navn → lister.
  function show() {
    const cfg = config();
    sbForm.hidden = !!cfg;
    meForm.hidden = !cfg || !!me;
    main.hidden = !cfg || !me;
    $('#sb-reset').hidden = !!(cfg && cfg.fromFile);
    if (!cfg) return;
    if (!me) {
      fillOwnerList();
      refresh().then(fillOwnerList);
      return;
    }
    meLabel.textContent = me;
    render();
    refresh();
  }

  function isVisible() {
    return $('#tab-onsker').classList.contains('active') && document.visibilityState === 'visible';
  }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => { if (isVisible() && me && config()) refresh(); }, REFRESH_MS);
  }

  document.addEventListener('tab:shown', (e) => {
    if (e.detail === 'onsker') { show(); startTimer(); } else clearInterval(timer);
  });
  document.addEventListener('visibilitychange', () => { if (isVisible() && me && config()) refresh(); });
})();

(() => {
  'use strict';

  const STORAGE_KEY = 'juleglede.takk.v1';
  const $ = (sel) => document.querySelector(sel);

  const form = $('#takk-form');
  const fromInput = $('#takk-from');
  const whatInput = $('#takk-what');
  const toInput = $('#takk-to');
  const fromList = $('#takk-from-list');
  const toList = $('#takk-to-list');
  const hideToggle = $('#takk-hide');
  const summaryEl = $('#takk-summary');
  const listEl = $('#takk-list');
  const emptyEl = $('#takk-empty');

  let state = load();

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (data && Array.isArray(data.gifts)) return { gifts: data.gifts, hideDone: !!data.hideDone };
    } catch (e) { /* ignorer */ }
    return { gifts: [], hideDone: false };
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignorer */ }
  }

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  // Samme giver selv om det er skrevet med ulik stor/liten bokstav eller mellomrom.
  const key = (s) => s.trim().toLowerCase().replace(/\s+/g, ' ');

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function unique(values) {
    const seen = new Map();
    values.filter(Boolean).forEach((v) => { if (!seen.has(key(v))) seen.set(key(v), v); });
    return [...seen.values()].sort((a, b) => a.localeCompare(b, 'no'));
  }

  // ---------- Hendelser ----------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const from = fromInput.value.trim();
    const what = whatInput.value.trim();
    if (!from || !what) return;
    // Bruk samme skrivemåte som før hvis giveren finnes fra før.
    const existing = state.gifts.find((g) => key(g.from) === key(from));
    state.gifts.push({
      id: uid(),
      from: existing ? existing.from : from,
      what,
      to: toInput.value.trim(),
      thanked: false,
    });
    save();
    render();
    // «Fra» og «Til» beholdes, så det er raskt å legge inn flere gaver fra samme person.
    whatInput.value = '';
    whatInput.focus();
  });

  hideToggle.addEventListener('change', () => {
    state.hideDone = hideToggle.checked;
    save();
    render();
  });

  listEl.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('.giver-all')) {
      const giver = t.closest('.giver').dataset.from;
      state.gifts.forEach((g) => { if (key(g.from) === giver) g.thanked = t.checked; });
    } else if (t.matches('.thank-cb')) {
      const g = state.gifts.find((x) => x.id === t.closest('.thank').dataset.id);
      if (!g) return;
      g.thanked = t.checked;
    } else {
      return;
    }
    save();
    render();
  });

  listEl.addEventListener('click', (e) => {
    const del = e.target.closest('.del');
    if (!del) return;
    const g = state.gifts.find((x) => x.id === del.closest('.thank').dataset.id);
    if (!g || !confirm(`Slette «${g.what}» fra ${g.from}?`)) return;
    state.gifts = state.gifts.filter((x) => x !== g);
    save();
    render();
  });

  // ---------- Visning ----------
  function renderGift(g) {
    const li = el('li', 'thank' + (g.thanked ? ' done' : ''));
    li.dataset.id = g.id;
    const cb = el('input', 'thank-cb');
    cb.type = 'checkbox';
    cb.checked = g.thanked;
    cb.title = 'Takket';
    cb.setAttribute('aria-label', `Har takket for ${g.what}`);
    const text = el('span', 'text');
    text.appendChild(el('span', 'name', g.what));
    if (g.to) text.appendChild(el('span', 'note', `til ${g.to}`));
    li.append(cb, text);
    if (g.thanked) li.appendChild(el('span', 'thank-tag', 'Takket'));
    const del = el('button', 'del', '×');
    del.type = 'button';
    del.setAttribute('aria-label', `Slett ${g.what}`);
    li.appendChild(del);
    return li;
  }

  function render() {
    hideToggle.checked = state.hideDone;
    listEl.innerHTML = '';

    const total = state.gifts.length;
    const thanked = state.gifts.filter((g) => g.thanked).length;
    emptyEl.hidden = total > 0;
    summaryEl.textContent = total ? `Takket for ${thanked} av ${total} gaver` : '';

    // Grupper per giver, i den rekkefølgen de ble lagt inn.
    const groups = new Map();
    state.gifts.forEach((g) => {
      const k = key(g.from);
      if (!groups.has(k)) groups.set(k, { name: g.from, gifts: [] });
      groups.get(k).gifts.push(g);
    });

    // Givere man ikke har takket ferdig, vises først.
    const sorted = [...groups.entries()].sort(([, a], [, b]) =>
      a.gifts.every((g) => g.thanked) - b.gifts.every((g) => g.thanked));

    let shown = 0;
    sorted.forEach(([k, grp]) => {
      const left = grp.gifts.filter((g) => !g.thanked).length;
      const allDone = left === 0;
      if (allDone && state.hideDone) return;
      shown++;

      const card = el('article', 'card giver' + (allDone ? ' done' : ''));
      card.dataset.from = k;
      const head = el('div', 'giver-head');
      const all = el('input', 'giver-all');
      all.type = 'checkbox';
      all.checked = allDone;
      all.title = 'Takket for alt';
      all.setAttribute('aria-label', `Takket ${grp.name} for alt`);
      head.appendChild(all);
      head.appendChild(el('span', 'giver-name', `${allDone ? '💚' : '🎁'} ${grp.name}`));
      const n = grp.gifts.length;
      head.appendChild(el('span', 'prod-meta',
        allDone ? 'Takket for alt' : `${n - left} av ${n} takket`));
      card.appendChild(head);

      const ul = el('ul', 'items');
      grp.gifts
        .slice()
        .sort((a, b) => a.thanked - b.thanked)
        .forEach((g) => ul.appendChild(renderGift(g)));
      card.appendChild(ul);
      listEl.appendChild(card);
    });

    if (total && !shown) {
      listEl.appendChild(el('p', 'empty', 'Du har takket alle! 💚'));
    }

    fromList.innerHTML = '';
    unique(state.gifts.map((g) => g.from)).forEach((v) => {
      const o = el('option');
      o.value = v;
      fromList.appendChild(o);
    });
    toList.innerHTML = '';
    unique(state.gifts.map((g) => g.to)).forEach((v) => {
      const o = el('option');
      o.value = v;
      toList.appendChild(o);
    });
  }

  render();
})();

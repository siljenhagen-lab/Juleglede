(() => {
  'use strict';

  // ---------- Faner ----------
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', t === tab);
      });
      document.querySelectorAll('.tab-panel').forEach((p) => {
        p.classList.toggle('active', p.id === 'tab-' + tab.dataset.tab);
      });
    });
  });

  // ---------- Julehandelen ----------
  const STORAGE_KEY = 'juleglede.handel.v1';
  const NO_STORE = 'Ingen butikk valgt';

  const CATEGORIES = [
    { id: 'frukt', name: 'Frukt og grønt', icon: '🥕' },
    { id: 'palegg', name: 'Pålegg', icon: '🧀' },
    { id: 'fisk', name: 'Fisk', icon: '🐟' },
    { id: 'kjott', name: 'Kjøtt', icon: '🥩' },
    { id: 'melk', name: 'Melkeprodukter', icon: '🥛' },
    { id: 'torr', name: 'Tørrvarer', icon: '🌾' },
  ];

  // Enkle stikkord for å foreslå kategori mens man skriver.
  const KEYWORDS = {
    frukt: ['eple', 'appelsin', 'klementin', 'mandarin', 'banan', 'drue', 'pære', 'sitron', 'lime',
      'kål', 'kålrot', 'gulrot', 'potet', 'løk', 'hvitløk', 'salat', 'tomat', 'agurk', 'paprika',
      'brokkoli', 'blomkål', 'rosenkål', 'tyttebær', 'tranebær', 'bær', 'persille', 'dill', 'urter',
      'sopp', 'selleri', 'pastinakk', 'rødbete', 'avokado', 'granateple', 'ananas', 'kiwi', 'frukt'],
    palegg: ['skinke', 'salami', 'leverpostei', 'postei', 'brunost', 'geitost', 'syltetøy', 'nugatti',
      'makrell i tomat', 'kaviar', 'rull', 'sylte', 'fenalår', 'spekepølse', 'pålegg', 'hamburgerrygg',
      'servelat', 'egg'],
    fisk: ['laks', 'torsk', 'lutefisk', 'sild', 'reker', 'krabbe', 'hummer', 'sei', 'kveite', 'ørret',
      'røkelaks', 'gravlaks', 'fiskekaker', 'fiskeboller', 'fisk', 'skrei', 'scampi', 'blåskjell'],
    kjott: ['ribbe', 'pinnekjøtt', 'medisterkake', 'medister', 'pølse', 'julepølse', 'kalkun', 'kylling',
      'svin', 'okse', 'lam', 'vilt', 'reinsdyr', 'elg', 'hjort', 'karbonade', 'kjøttdeig', 'kjøttkaker',
      'bacon', 'and', 'juleskinke', 'kjøtt', 'stek', 'filet', 'lammelår'],
    melk: ['melk', 'fløte', 'kremfløte', 'rømme', 'smør', 'yoghurt', 'ost', 'crème fraîche', 'creme fraiche',
      'kesam', 'cottage', 'kulturmelk', 'cultura', 'iskrem', 'is', 'mascarpone', 'parmesan', 'mozzarella'],
    torr: ['mel', 'hvetemel', 'sukker', 'melis', 'ris', 'risengrynsgrøt', 'grøtris', 'pasta', 'havre',
      'havregryn', 'gryn', 'kaffe', 'te', 'kakao', 'sjokolade', 'marsipan', 'nøtter', 'mandler', 'rosiner',
      'krydder', 'kanel', 'kardemomme', 'nellik', 'pepperkake', 'bakepulver', 'natron', 'gjær', 'salt',
      'pepper', 'olje', 'eddik', 'brød', 'knekkebrød', 'kjeks', 'lefse', 'flatbrød', 'mineralvann', 'brus',
      'julebrus', 'gløgg', 'saft', 'potetgull', 'godteri', 'snop', 'servietter', 'lys'],
  };

  const $ = (sel) => document.querySelector(sel);
  const form = $('#add-form');
  const nameInput = $('#item-name');
  const qtyInput = $('#item-qty');
  const catSelect = $('#item-cat');
  const storeInput = $('#item-store');
  const storeList = $('#store-list');
  const splitToggle = $('#split-store');
  const listEl = $('#list');
  const emptyEl = $('#empty');
  const summaryEl = $('#summary');
  const clearBtn = $('#clear-done');

  let state = load();
  let catTouched = false;

  CATEGORIES.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.icon} ${c.name}`;
    catSelect.appendChild(opt);
  });

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        return { items: Array.isArray(data.items) ? data.items : [], splitByStore: !!data.splitByStore };
      }
    } catch (e) { /* ignorer */ }
    return { items: [], splitByStore: false };
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignorer */ }
    document.dispatchEvent(new CustomEvent('handel:changed'));
  }

  function guessCategory(text) {
    const t = text.toLowerCase().trim();
    if (!t) return null;
    let best = null;
    let bestLen = 0;
    for (const [cat, words] of Object.entries(KEYWORDS)) {
      for (const w of words) {
        const re = new RegExp(`(^|\\s)${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
        if (re.test(t) && w.length > bestLen) { best = cat; bestLen = w.length; }
      }
    }
    return best;
  }

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function knownStores() {
    return [...new Set(state.items.map((i) => i.store).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'no'));
  }

  // ---------- Hendelser ----------
  nameInput.addEventListener('input', () => {
    if (catTouched) return;
    const g = guessCategory(nameInput.value);
    if (g) catSelect.value = g;
  });
  catSelect.addEventListener('change', () => { catTouched = true; });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    state.items.push({
      id: uid(),
      name,
      qty: qtyInput.value.trim(),
      cat: catSelect.value,
      store: storeInput.value.trim(),
      done: false,
    });
    save();
    render();
    nameInput.value = '';
    qtyInput.value = '';
    catTouched = false;
    // Butikk beholdes, slik at det er lett å legge inn flere varer fra samme butikk.
    nameInput.focus();
  });

  splitToggle.addEventListener('change', () => {
    state.splitByStore = splitToggle.checked;
    save();
    render();
  });

  clearBtn.addEventListener('click', () => {
    const n = state.items.filter((i) => i.done).length;
    if (!n) return;
    if (!confirm(`Fjerne ${n} avkrysset${n === 1 ? '' : 'e'} vare${n === 1 ? '' : 'r'}?`)) return;
    state.items = state.items.filter((i) => !i.done);
    save();
    render();
  });

  listEl.addEventListener('change', (e) => {
    if (!e.target.matches('input[type=checkbox]')) return;
    const item = findItem(e.target);
    if (!item) return;
    item.done = e.target.checked;
    save();
    render();
  });

  listEl.addEventListener('click', (e) => {
    const item = findItem(e.target);
    if (!item) return;
    if (e.target.closest('.del')) {
      state.items = state.items.filter((i) => i !== item);
      save();
      render();
    } else if (e.target.closest('.store-tag')) {
      const s = prompt('Hvilken butikk? (la stå tomt for ingen)', item.store || '');
      if (s === null) return;
      item.store = s.trim();
      save();
      render();
    }
  });

  function findItem(el) {
    const li = el.closest('.item');
    return li && state.items.find((i) => i.id === li.dataset.id);
  }

  // ---------- Visning ----------
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function renderItem(item, showStore) {
    const li = el('li', 'item' + (item.done ? ' done' : ''));
    li.dataset.id = item.id;
    const cb = el('input');
    cb.type = 'checkbox';
    cb.checked = item.done;
    cb.setAttribute('aria-label', `Kryss av ${item.name}`);
    li.appendChild(cb);
    const text = el('span', 'text');
    text.appendChild(el('span', 'name', item.name));
    if (item.note) text.appendChild(el('span', 'note', item.note));
    li.appendChild(text);
    if (item.qty) li.appendChild(el('span', 'qty', item.qty));
    if (showStore) {
      const tag = el('button', 'store-tag', item.store || '+ butikk');
      tag.type = 'button';
      tag.title = 'Endre butikk';
      li.appendChild(tag);
    }
    const del = el('button', 'del', '×');
    del.type = 'button';
    del.title = 'Slett';
    del.setAttribute('aria-label', `Slett ${item.name}`);
    li.appendChild(del);
    return li;
  }

  function renderCategories(items, showStore) {
    const frag = document.createDocumentFragment();
    CATEGORIES.forEach((c) => {
      const inCat = items
        .filter((i) => i.cat === c.id)
        .sort((a, b) => a.done - b.done);
      if (!inCat.length) return;
      const box = el('div', 'card cat-group');
      box.appendChild(el('h3', null, `${c.icon} ${c.name}`));
      const ul = el('ul', 'items');
      inCat.forEach((i) => ul.appendChild(renderItem(i, showStore)));
      box.appendChild(ul);
      frag.appendChild(box);
    });
    return frag;
  }

  function render() {
    splitToggle.checked = state.splitByStore;
    listEl.innerHTML = '';

    const total = state.items.length;
    const done = state.items.filter((i) => i.done).length;
    emptyEl.hidden = total > 0;
    summaryEl.textContent = total ? `${done} av ${total} handlet` : '';
    clearBtn.disabled = done === 0;

    if (state.splitByStore) {
      const stores = knownStores();
      const groups = [...stores, ''];
      groups.forEach((store) => {
        const items = state.items.filter((i) => (i.store || '') === store);
        if (!items.length) return;
        const section = el('section', 'store-group');
        const left = items.filter((i) => !i.done).length;
        section.appendChild(el('h2', null, `${store || NO_STORE} (${left})`));
        section.appendChild(renderCategories(items, false));
        listEl.appendChild(section);
      });
    } else {
      listEl.appendChild(renderCategories(state.items, true));
    }

    storeList.innerHTML = '';
    knownStores().forEach((s) => {
      const o = el('option');
      o.value = s;
      storeList.appendChild(o);
    });
  }

  render();

  // Felles API som andre faner (f.eks. Produksjon) bruker.
  window.Juleglede = {
    CATEGORIES,
    guessCategory,
    handel: {
      add({ name, qty = '', cat = 'torr', store = '', note = '' }) {
        const item = { id: uid(), name, qty, cat, store, note, done: false };
        state.items.push(item);
        save();
        render();
        return item.id;
      },
      remove(id) {
        state.items = state.items.filter((i) => i.id !== id);
        save();
        render();
      },
      get(id) {
        return state.items.find((i) => i.id === id) || null;
      },
    },
  };
})();

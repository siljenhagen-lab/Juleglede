(() => {
  'use strict';

  const { handel } = window.Juleglede;
  const STORAGE_KEY = 'juleglede.gaver.v1';

  const form = document.querySelector('#person-form');
  const nameInput = document.querySelector('#person-name');
  const listEl = document.querySelector('#person-list');
  const emptyEl = document.querySelector('#person-empty');
  const summaryEl = document.querySelector('#gift-summary');

  let people = load();

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(people)); } catch (e) { /* ignorer */ }
  }

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // Godtar «elkjop.no/…» og legger på https:// selv. Bare http(s)-lenker tillates.
  function normalizeLink(raw) {
    const t = (raw || '').trim();
    if (!t) return '';
    const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `https://${t}`;
    try {
      const u = new URL(withScheme);
      return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : '';
    } catch (e) {
      return '';
    }
  }

  function linkLabel(href) {
    try { return new URL(href).hostname.replace(/^www\./, ''); } catch (e) { return 'Lenke'; }
  }

  // ---------- Handleliste-kobling ----------
  const onList = (gift) => !!(gift.shopId && handel.get(gift.shopId));

  function addToList(person, gift) {
    if (onList(gift)) return;
    gift.shopId = handel.add({
      name: gift.name,
      cat: 'gaver',
      store: gift.store || '',
      note: `gave til ${person.name}`,
      link: gift.link || '',
    });
    if (gift.bought) handel.update(gift.shopId, { done: true });
  }

  function removeFromList(gift) {
    if (onList(gift)) handel.remove(gift.shopId);
    gift.shopId = null;
  }

  // Når noe krysses av (eller fjernes) i Julehandelen, oppdateres «Kjøpt» her.
  function syncFromList() {
    let changed = false;
    people.forEach((p) => p.gifts.forEach((g) => {
      if (!g.shopId) return;
      const item = handel.get(g.shopId);
      if (!item) {
        g.shopId = null;
        changed = true;
      } else if (item.done !== g.bought) {
        g.bought = item.done;
        if (!g.bought) g.packed = false;
        changed = true;
      }
    }));
    if (changed) save();
  }

  function setBought(gift, value) {
    gift.bought = value;
    if (!value) gift.packed = false;
    if (onList(gift)) handel.update(gift.shopId, { done: value });
  }

  // ---------- Hendelser ----------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    people.push({ id: uid(), name, open: true, gifts: [] });
    save();
    render();
    nameInput.value = '';
    const last = listEl.querySelectorAll('.gift-form input[name=name]');
    if (last.length) last[last.length - 1].focus();
  });

  const findPerson = (node) => {
    const card = node.closest('.person');
    return card && people.find((p) => p.id === card.dataset.id);
  };
  const findGift = (person, node) => {
    const row = node.closest('.gift');
    return row && person.gifts.find((g) => g.id === row.dataset.id);
  };

  listEl.addEventListener('submit', (e) => {
    if (!e.target.matches('.gift-form')) return;
    e.preventDefault();
    const person = findPerson(e.target);
    const f = e.target.elements;
    const name = f.name.value.trim();
    if (!person || !name) return;
    const rawLink = f.link.value.trim();
    const link = normalizeLink(rawLink);
    if (rawLink && !link) {
      alert('Lenken ser ikke riktig ut. Den må være en nettadresse, f.eks. https://www.eksempel.no/produkt');
      f.link.focus();
      return;
    }
    const gift = {
      id: uid(), name, link, store: f.store.value.trim(), bought: false, packed: false, shopId: null,
    };
    f.name.value = '';
    f.link.value = '';
    f.store.value = '';
    person.gifts.push(gift);
    if (f.toList.checked) addToList(person, gift);
    save();
    render();
    const again = listEl.querySelector(`.person[data-id="${person.id}"] .gift-form input[name=name]`);
    if (again) again.focus();
  });

  listEl.addEventListener('change', (e) => {
    const t = e.target;
    const person = findPerson(t);
    const gift = person && findGift(person, t);
    if (!gift) return;
    if (t.matches('.gift-bought')) {
      setBought(gift, t.checked);
    } else if (t.matches('.gift-packed')) {
      gift.packed = t.checked;
      if (t.checked && !gift.bought) setBought(gift, true);
    } else if (t.matches('.gift-shop')) {
      if (t.checked) addToList(person, gift);
      else removeFromList(gift);
    } else {
      return;
    }
    save();
    render();
  });

  listEl.addEventListener('click', (e) => {
    const t = e.target;
    const person = findPerson(t);
    if (!person) return;

    if (t.closest('.prod-toggle')) {
      person.open = !person.open;
    } else if (t.closest('.person-del')) {
      if (!confirm(`Slette «${person.name}» og alle gaveideene? Gaver som ikke er kjøpt, fjernes også fra handlelista.`)) return;
      person.gifts.forEach((g) => { if (!g.bought) removeFromList(g); });
      people = people.filter((p) => p !== person);
    } else if (t.closest('.gift-del')) {
      const gift = findGift(person, t);
      if (!gift) return;
      if (!gift.bought) removeFromList(gift);
      person.gifts = person.gifts.filter((g) => g !== gift);
    } else if (t.closest('.gift-link-edit')) {
      const gift = findGift(person, t);
      if (!gift) return;
      const raw = prompt('Lenke til produktet (la stå tomt for å fjerne):', gift.link || '');
      if (raw === null) return;
      const link = normalizeLink(raw);
      if (raw.trim() && !link) {
        alert('Lenken ser ikke riktig ut. Den må være en nettadresse, f.eks. https://www.eksempel.no/produkt');
        return;
      }
      gift.link = link;
      if (onList(gift)) handel.update(gift.shopId, { link });
    } else {
      return;
    }
    save();
    render();
  });

  document.addEventListener('handel:changed', () => {
    syncFromList();
    render();
  });

  // ---------- Visning ----------
  function chip(cls, checked, label, extraCls = '') {
    const lab = el('label', `chip ${extraCls}${checked ? ' on' : ''}`);
    const cb = el('input', cls);
    cb.type = 'checkbox';
    cb.checked = checked;
    lab.appendChild(cb);
    lab.appendChild(el('span', null, label));
    return lab;
  }

  function renderGift(gift) {
    const li = el('li', 'gift' + (gift.packed ? ' packed' : ''));
    li.dataset.id = gift.id;

    const top = el('div', 'gift-top');
    top.appendChild(el('span', 'name', gift.name));
    if (gift.store) top.appendChild(el('span', 'store-tag', gift.store));
    const del = el('button', 'del gift-del', '×');
    del.type = 'button';
    del.setAttribute('aria-label', `Slett ${gift.name}`);
    top.appendChild(del);
    li.appendChild(top);

    const linkRow = el('div', 'gift-link');
    if (gift.link) {
      const a = el('a', 'link', `🔗 ${linkLabel(gift.link)}`);
      a.href = gift.link;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      linkRow.appendChild(a);
    }
    const edit = el('button', 'text-btn gift-link-edit', gift.link ? 'Endre' : '+ Legg til lenke');
    edit.type = 'button';
    linkRow.appendChild(edit);
    li.appendChild(linkRow);

    const chips = el('div', 'chips');
    const listed = onList(gift);
    chips.appendChild(chip('gift-shop', listed, listed ? '🛒 På lista' : '+ Handleliste', 'shop'));
    chips.appendChild(chip('gift-bought', gift.bought, gift.bought ? '✓ Kjøpt' : 'Kjøpt'));
    chips.appendChild(chip('gift-packed', gift.packed, gift.packed ? '🎁 Pakket' : 'Pakket'));
    li.appendChild(chips);
    return li;
  }

  function renderGiftForm() {
    const f = el('form', 'gift-form');
    f.autocomplete = 'off';
    const input = (name, placeholder, type = 'text') => {
      const i = el('input');
      i.name = name;
      i.type = type;
      i.placeholder = placeholder;
      return i;
    };
    const name = input('name', 'Gaveidé (f.eks. ullsokker)');
    name.required = true;
    const link = input('link', 'Lenke til produktet (valgfritt)', 'url');
    link.inputMode = 'url';
    // type=url avviser adresser uten https://, så vi validerer selv.
    link.type = 'text';
    const store = input('store', 'Butikk (valgfritt)');
    store.setAttribute('list', 'store-list');

    const lab = el('label', 'switch small');
    const toList = el('input');
    toList.type = 'checkbox';
    toList.name = 'toList';
    lab.appendChild(toList);
    lab.appendChild(el('span', null, 'Rett på handlelista'));

    const btn = el('button', 'btn primary', 'Legg til gave');
    btn.type = 'submit';
    f.append(name, link, store, lab, btn);
    return f;
  }

  function countText(gifts) {
    const n = gifts.length;
    if (!n) return 'Ingen gaveideer ennå';
    const bought = gifts.filter((g) => g.bought).length;
    const packed = gifts.filter((g) => g.packed).length;
    return `${n} ${n === 1 ? 'gave' : 'gaver'} · ${bought} kjøpt · ${packed} pakket`;
  }

  function renderPerson(p) {
    const allDone = p.gifts.length > 0 && p.gifts.every((g) => g.packed);
    const card = el('article', 'card product person' + (allDone ? ' done' : ''));
    card.dataset.id = p.id;

    const head = el('div', 'prod-head');
    head.appendChild(el('span', 'person-icon', allDone ? '✅' : '🎅'));
    const toggle = el('button', 'prod-toggle');
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', p.open);
    toggle.appendChild(el('span', 'prod-name', p.name));
    toggle.appendChild(el('span', 'prod-meta', countText(p.gifts)));
    toggle.appendChild(el('span', 'chevron', p.open ? '▾' : '▸'));
    const del = el('button', 'del person-del', '×');
    del.type = 'button';
    del.title = 'Slett';
    del.setAttribute('aria-label', `Slett ${p.name}`);
    head.append(toggle, del);
    card.appendChild(head);

    if (p.open) {
      const body = el('div', 'prod-body');
      if (p.gifts.length) {
        const ul = el('ul', 'items');
        p.gifts.forEach((g) => ul.appendChild(renderGift(g)));
        body.appendChild(ul);
      }
      body.appendChild(renderGiftForm());
      card.appendChild(body);
    }
    return card;
  }

  function render() {
    // Behold påbegynt tekst i skjemaene når lista tegnes på nytt.
    const drafts = {};
    listEl.querySelectorAll('.person').forEach((card) => {
      const f = card.querySelector('.gift-form');
      if (!f) return;
      const { name, link, store, toList } = f.elements;
      drafts[card.dataset.id] = { name: name.value, link: link.value, store: store.value, toList: toList.checked };
    });

    listEl.innerHTML = '';
    emptyEl.hidden = people.length > 0;
    const all = people.flatMap((p) => p.gifts);
    summaryEl.textContent = all.length ? `Totalt: ${countText(all)}` : '';
    people.forEach((p) => listEl.appendChild(renderPerson(p)));

    Object.entries(drafts).forEach(([id, d]) => {
      const f = listEl.querySelector(`.person[data-id="${id}"] .gift-form`);
      if (!f) return;
      f.elements.name.value = d.name;
      f.elements.link.value = d.link;
      f.elements.store.value = d.store;
      f.elements.toList.checked = d.toList;
    });
  }

  syncFromList();
  render();

  // Brukes av fanen Ønsker for å legge et ønske fra noens ønskeliste inn her.
  const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
  window.Juleglede.normalizeLink = normalizeLink;
  window.Juleglede.gaver = {
    hasWish(wishId) {
      return people.some((p) => p.gifts.some((g) => g.wishId === wishId));
    },
    addFromWish({ person: personName, name, link = '', wishId }) {
      if (this.hasWish(wishId)) return;
      let person = people.find((p) => sameName(p.name, personName));
      if (!person) {
        person = { id: uid(), name: personName.trim(), open: true, gifts: [] };
        people.push(person);
      }
      person.gifts.push({
        id: uid(), name, link: normalizeLink(link), store: '', bought: false, packed: false, shopId: null, wishId,
      });
      save();
      render();
    },
  };
})();

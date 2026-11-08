(() => {
  'use strict';

  const { CATEGORIES, guessCategory, handel } = window.Juleglede;
  const STORAGE_KEY = 'juleglede.produksjon.v1';

  const form = document.querySelector('#prod-form');
  const nameInput = document.querySelector('#prod-name');
  const listEl = document.querySelector('#prod-list');
  const emptyEl = document.querySelector('#prod-empty');

  let products = load();

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(products)); } catch (e) { /* ignorer */ }
  }

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // Status for en ingrediens på handlelista: null (ikke på lista), 'list' eller 'bought'.
  function shopStatus(ing) {
    if (!ing.shopId) return null;
    const item = handel.get(ing.shopId);
    if (!item) return null;
    return item.done ? 'bought' : 'list';
  }

  function addToList(product, ing) {
    if (shopStatus(ing)) return;
    ing.shopId = handel.add({ name: ing.name, qty: ing.qty, cat: ing.cat, note: `til ${product.name}` });
  }

  function removeFromList(ing) {
    if (ing.shopId && handel.get(ing.shopId)) handel.remove(ing.shopId);
    ing.shopId = null;
  }

  // ---------- Hendelser ----------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    products.push({ id: uid(), name, done: false, open: true, ingredients: [] });
    save();
    render();
    nameInput.value = '';
    const forms = listEl.querySelectorAll('.ing-form input[name=name]');
    if (forms.length) forms[forms.length - 1].focus();
  });

  const findProduct = (node) => {
    const card = node.closest('.product');
    return card && products.find((p) => p.id === card.dataset.id);
  };
  const findIng = (product, node) => {
    const row = node.closest('.ing');
    return row && product.ingredients.find((i) => i.id === row.dataset.id);
  };

  listEl.addEventListener('submit', (e) => {
    if (!e.target.matches('.ing-form')) return;
    e.preventDefault();
    const product = findProduct(e.target);
    const f = e.target.elements;
    const name = f.name.value.trim();
    if (!product || !name) return;
    const ing = { id: uid(), name, qty: f.qty.value.trim(), cat: f.cat.value, shopId: null };
    f.name.value = '';
    f.qty.value = '';
    delete f.cat.dataset.touched;
    product.ingredients.push(ing);
    if (f.toList.checked) addToList(product, ing);
    save();
    render();
    const again = listEl.querySelector(`.product[data-id="${product.id}"] .ing-form input[name=name]`);
    if (again) again.focus();
  });

  // Foreslå kategori mens man skriver ingrediensnavn.
  listEl.addEventListener('input', (e) => {
    if (!e.target.matches('.ing-form input[name=name]')) return;
    const sel = e.target.form.elements.cat;
    if (sel.dataset.touched) return;
    const g = guessCategory(e.target.value);
    if (g) sel.value = g;
  });

  listEl.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('.ing-form select[name=cat]')) {
      t.dataset.touched = '1';
      return;
    }
    const product = findProduct(t);
    if (!product) return;
    if (t.matches('.prod-done')) {
      product.done = t.checked;
    } else if (t.matches('.ing-shop')) {
      const ing = findIng(product, t);
      if (!ing) return;
      if (t.checked) addToList(product, ing);
      else removeFromList(ing);
    } else {
      return;
    }
    save();
    render();
  });

  listEl.addEventListener('click', (e) => {
    const t = e.target;
    const product = findProduct(t);
    if (!product) return;

    if (t.closest('.prod-toggle')) {
      product.open = !product.open;
    } else if (t.closest('.prod-del')) {
      if (!confirm(`Slette «${product.name}»? Varer som ikke er handlet, fjernes også fra handlelista.`)) return;
      product.ingredients.forEach((ing) => { if (shopStatus(ing) === 'list') removeFromList(ing); });
      products = products.filter((p) => p !== product);
    } else if (t.closest('.ing-del')) {
      const ing = findIng(product, t);
      if (!ing) return;
      if (shopStatus(ing) === 'list') removeFromList(ing);
      product.ingredients = product.ingredients.filter((i) => i !== ing);
    } else if (t.closest('.add-all')) {
      product.ingredients.forEach((ing) => addToList(product, ing));
    } else {
      return;
    }
    save();
    render();
  });

  // Handlelista kan endres i den andre fanen – hold visningen i synk.
  document.addEventListener('handel:changed', () => render());

  // ---------- Visning ----------
  function renderIngredient(ing) {
    const status = shopStatus(ing);
    const li = el('li', 'ing');
    li.dataset.id = ing.id;

    const cat = CATEGORIES.find((c) => c.id === ing.cat);
    li.appendChild(el('span', 'ing-icon', cat ? cat.icon : '•'));
    li.appendChild(el('span', 'name', ing.name));
    if (ing.qty) li.appendChild(el('span', 'qty', ing.qty));

    const lab = el('label', 'shop-toggle' + (status ? ' on' : '') + (status === 'bought' ? ' bought' : ''));
    lab.title = status === 'bought' ? 'Handlet' : 'Skal på handlelista';
    const cb = el('input', 'ing-shop');
    cb.type = 'checkbox';
    cb.checked = !!status;
    lab.appendChild(cb);
    lab.appendChild(el('span', null, status === 'bought' ? '✓ Handlet' : status ? '🛒 På lista' : '+ Handleliste'));
    li.appendChild(lab);

    const del = el('button', 'del ing-del', '×');
    del.type = 'button';
    del.setAttribute('aria-label', `Slett ${ing.name}`);
    li.appendChild(del);
    return li;
  }

  function renderIngForm() {
    const f = el('form', 'ing-form');
    f.autocomplete = 'off';

    const name = el('input');
    name.name = 'name';
    name.placeholder = 'Trenger (f.eks. sirup)';
    name.required = true;
    const qty = el('input');
    qty.name = 'qty';
    qty.placeholder = 'Antall';
    const cat = el('select');
    cat.name = 'cat';
    cat.setAttribute('aria-label', 'Kategori');
    CATEGORIES.forEach((c) => {
      const o = el('option', null, `${c.icon} ${c.name}`);
      o.value = c.id;
      cat.appendChild(o);
    });
    cat.value = 'torr';

    const lab = el('label', 'switch small');
    const toList = el('input');
    toList.type = 'checkbox';
    toList.name = 'toList';
    lab.appendChild(toList);
    lab.appendChild(el('span', null, 'Rett på handlelista'));

    const btn = el('button', 'btn primary', 'Legg til');
    btn.type = 'submit';

    f.append(name, qty, cat, lab, btn);
    return f;
  }

  function renderProduct(p) {
    const card = el('article', 'card product' + (p.done ? ' done' : '') + (p.open ? ' open' : ''));
    card.dataset.id = p.id;

    const head = el('div', 'prod-head');
    const done = el('input', 'prod-done');
    done.type = 'checkbox';
    done.checked = p.done;
    done.title = 'Ferdig laget';
    done.setAttribute('aria-label', `${p.name} er ferdig`);

    const toggle = el('button', 'prod-toggle');
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', p.open);
    toggle.appendChild(el('span', 'prod-name', p.name));
    const n = p.ingredients.length;
    const onList = p.ingredients.filter((i) => shopStatus(i)).length;
    toggle.appendChild(el('span', 'prod-meta',
      n ? `${n} ting · ${onList} på handlelista` : 'Ingen ting lagt inn'));
    toggle.appendChild(el('span', 'chevron', p.open ? '▾' : '▸'));

    const del = el('button', 'del prod-del', '×');
    del.type = 'button';
    del.title = 'Slett';
    del.setAttribute('aria-label', `Slett ${p.name}`);

    head.append(done, toggle, del);
    card.appendChild(head);

    if (p.open) {
      const body = el('div', 'prod-body');
      if (n) {
        const ul = el('ul', 'items');
        p.ingredients.forEach((ing) => ul.appendChild(renderIngredient(ing)));
        body.appendChild(ul);
        if (onList < n) {
          const all = el('button', 'btn ghost add-all', '🛒 Legg alt på handlelista');
          all.type = 'button';
          body.appendChild(all);
        }
      }
      body.appendChild(renderIngForm());
      card.appendChild(body);
    }
    return card;
  }

  function render() {
    // Behold påbegynt tekst i skjemaene når lista tegnes på nytt.
    const drafts = {};
    listEl.querySelectorAll('.product').forEach((card) => {
      const f = card.querySelector('.ing-form');
      if (f) drafts[card.dataset.id] = { name: f.elements.name.value, qty: f.elements.qty.value, cat: f.elements.cat.value, touched: f.elements.cat.dataset.touched, toList: f.elements.toList.checked };
    });

    listEl.innerHTML = '';
    emptyEl.hidden = products.length > 0;
    products
      .slice()
      .sort((a, b) => a.done - b.done)
      .forEach((p) => listEl.appendChild(renderProduct(p)));

    Object.entries(drafts).forEach(([id, d]) => {
      const f = listEl.querySelector(`.product[data-id="${id}"] .ing-form`);
      if (!f) return;
      f.elements.name.value = d.name;
      f.elements.qty.value = d.qty;
      f.elements.toList.checked = d.toList;
      if (d.touched || d.name) f.elements.cat.value = d.cat;
      if (d.touched) f.elements.cat.dataset.touched = d.touched;
    });
  }

  render();
})();

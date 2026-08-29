document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initPortionCalculator();
  initRecipeFilters();
  initWeekTabs();
  initShoppingList();
});

/* 1. MOBILE NAVIGATION */
function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('siteNav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    nav.classList.toggle('open');
  });
}

/* 2. PORTION CALCULATOR (Default: 2 Persons, Base: 1 Person) */
function initPortionCalculator() {
  const portionValEl = document.getElementById('portionValue');
  const portionUnitEl = document.getElementById('portionUnit');
  const btnMinus = document.getElementById('btnPortionMinus');
  const btnPlus = document.getElementById('btnPortionPlus');
  const presetBtns = document.querySelectorAll('.btn-preset');
  const ingredientAmounts = document.querySelectorAll('.ingredient-amount');
  const nutritionBox = document.getElementById('nutritionBox');

  if (!portionValEl || !ingredientAmounts.length) return;

  let currentServings = 2; // Default 2 as requested

  function updateServings(newServings) {
    if (newServings < 1) newServings = 1;
    if (newServings > 12) newServings = 12;
    currentServings = newServings;

    portionValEl.textContent = currentServings;
    portionUnitEl.textContent = currentServings === 1 ? 'Person' : 'Personen';

    // Update preset button active states
    presetBtns.forEach(btn => {
      const s = parseInt(btn.getAttribute('data-servings'), 10);
      if (s === currentServings) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update ingredients amounts
    ingredientAmounts.forEach(el => {
      const base = parseFloat(el.getAttribute('data-base-amount'));
      if (isNaN(base) || base <= 0) {
        return;
      }
      const scaled = base * currentServings;
      el.textContent = formatNumber(scaled);
    });

    // Update Nutrition Display
    if (nutritionBox) {
      const baseCal = parseFloat(nutritionBox.getAttribute('data-base-cal')) || 0;
      const basePro = parseFloat(nutritionBox.getAttribute('data-base-pro')) || 0;
      const baseCarb = parseFloat(nutritionBox.getAttribute('data-base-carb')) || 0;
      const baseFat = parseFloat(nutritionBox.getAttribute('data-base-fat')) || 0;
      const baseFib = parseFloat(nutritionBox.getAttribute('data-base-fib')) || 0;

      const calEl = document.getElementById('nutriCalories');
      const proEl = document.getElementById('nutriProtein');
      const carbEl = document.getElementById('nutriCarbs');
      const fatEl = document.getElementById('nutriFat');
      const fibEl = document.getElementById('nutriFiber');

      if (calEl) calEl.textContent = Math.round(baseCal * currentServings);
      if (proEl) proEl.textContent = Math.round(basePro * currentServings) + 'g';
      if (carbEl) carbEl.textContent = Math.round(baseCarb * currentServings) + 'g';
      if (fatEl) fatEl.textContent = Math.round(baseFat * currentServings) + 'g';
      if (fibEl) fibEl.textContent = Math.round(baseFib * currentServings) + 'g';

      const modeLabel = document.getElementById('nutritionModeLabel');
      if (modeLabel) {
        modeLabel.textContent = `(gesamt für ${currentServings} ${currentServings === 1 ? 'Person' : 'Personen'})`;
      }
    }
  }

  function formatNumber(num) {
    if (Math.abs(num - Math.round(num)) < 0.01) {
      return Math.round(num).toString();
    }
    // format fractions nicely (e.g. 0.5, 1.5)
    return (Math.round(num * 10) / 10).toString().replace('.', ',');
  }

  if (btnMinus) {
    btnMinus.addEventListener('click', () => updateServings(currentServings - 1));
  }
  if (btnPlus) {
    btnPlus.addEventListener('click', () => updateServings(currentServings + 1));
  }

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const s = parseInt(btn.getAttribute('data-servings'), 10);
      if (!isNaN(s)) updateServings(s);
    });
  });

  // Run initial calculation to render 2 portions correctly
  updateServings(2);
}

/* 3. RECIPE LIST FILTERING & SEARCH */
function initRecipeFilters() {
  const searchInput = document.getElementById('recipeSearchInput');
  const clearBtn = document.getElementById('clearSearchBtn');
  const catButtons = document.querySelectorAll('.btn-filter');
  const tagButtons = document.querySelectorAll('.btn-tag-filter');
  const recipeCards = document.querySelectorAll('.recipe-card');
  const noResults = document.getElementById('noResultsMsg');

  if (!recipeCards.length || !searchInput) return;

  let activeCat = 'all';
  let activeTag = '';
  let searchQuery = '';

  // Read URL params if any
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('cat')) {
    activeCat = urlParams.get('cat');
    catButtons.forEach(b => {
      if (b.getAttribute('data-filter-cat') === activeCat) b.classList.add('active');
      else b.classList.remove('active');
    });
  }
  if (urlParams.has('tag')) {
    activeTag = urlParams.get('tag').toLowerCase();
    tagButtons.forEach(b => {
      if (b.getAttribute('data-filter-tag').toLowerCase() === activeTag) b.classList.add('active');
    });
  }

  function applyFilters() {
    let visibleCount = 0;
    const query = searchQuery.trim().toLowerCase();

    recipeCards.forEach(card => {
      const title = card.querySelector('.recipe-card-title')?.textContent.toLowerCase() || '';
      const summary = card.querySelector('.recipe-card-summary')?.textContent.toLowerCase() || '';
      const cardCat = card.getAttribute('data-category') || '';
      const cardTags = (card.getAttribute('data-tags') || '').toLowerCase();

      // Check category match
      const catMatch = (activeCat === 'all') || (cardCat === activeCat);

      // Check tag match
      const tagMatch = !activeTag || cardTags.includes(activeTag) || title.includes(activeTag);

      // Check search text match
      const textMatch = !query || title.includes(query) || summary.includes(query) || cardTags.includes(query);

      if (catMatch && tagMatch && textMatch) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (noResults) {
      noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    if (clearBtn) clearBtn.style.display = searchQuery ? 'block' : 'none';
    applyFilters();
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearBtn.style.display = 'none';
      applyFilters();
      searchInput.focus();
    });
  }

  catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      catButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCat = btn.getAttribute('data-filter-cat');
      applyFilters();
    });
  });

  tagButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('active')) {
        btn.classList.remove('active');
        activeTag = '';
      } else {
        tagButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTag = btn.getAttribute('data-filter-tag').toLowerCase();
      }
      applyFilters();
    });
  });

  // Initial filter run
  applyFilters();
}

/* 4. WOCHENPLAN TABS */
function initWeekTabs() {
  const tabs = document.querySelectorAll('.week-tab');
  const panels = document.querySelectorAll('.week-panel');

  if (!tabs.length || !panels.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-target');

      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });
}

/* 5. SHOPPING LIST GENERATOR */
function initShoppingList() {
  const btnGen = document.getElementById('btnGenerateShoppingList');
  const modal = document.getElementById('shoppingListModal');
  const btnClose = document.getElementById('btnCloseModal');
  const btnClose2 = document.getElementById('btnCloseModal2');
  const modalTitle = document.getElementById('modalWeekTitle');
  const modalContent = document.getElementById('modalShoppingContent');

  if (!btnGen || !modal || !modalContent) return;

  const weeklyShoppingData = {
    'week-1': [
      { cat: 'Gemüse & Frische (Penny)', items: ['2 große Zucchini', '1 Kopf Brokkoli (ca. 500g)', '2 rote & gelbe Paprika', '300g braune Champignons / Shiitake', '1 Bund Lauchzwiebeln (4-5 Stangen)', '1 Packung frische Sojasprossen (150g)', '200g Cherrytomaten / Rispentomaten', '1 Zitrone & 2 Limetten', '1 Knoblauchknolle'] },
      { cat: 'Kühltheke & Proteine', items: ['3 Packungen Naturtofu (je 200-400g)', '1 Schachtel Bio-Eier (6 oder 10 Stück)', '1 Packung Feta / Gouda (gerieben oder am Stück)', '1 Becher griechischer Joghurt, Quark oder Sojajoghurt (500g)'] },
      { cat: 'Vorratskammer & Gewürze', items: ['2 Dosen gehackte Tomaten (je 400g)', '1 Glas Tahini (Sesammus)', '1 Flasche Sojasauce (Tamari)', 'Sesamöl & natives Olivenöl', 'Mandelblättchen (ca. 50g)', 'Gelbe Currypaste (mild)', '1 Dose Kokosmilch (400ml)', 'Sesamsamen & Chia-Samen', 'Kräuter der Provence, Paprikapulver edelsüß, Salz & Pfeffer'] }
    ],
    'week-2': [
      { cat: 'Gemüse & Frische (Penny)', items: ['3 mittelgroße Zucchini', '1 Kopf Blumenkohl', '1 Kopf Brokkoli', '250g braune Champignons', '1 Packung Babyspinat (150g)', '2 rote Paprika', '1 Bund Lauchzwiebeln', '1 Packung Sojasprossen', '1 reife Avocado', '1 Salatgurke', '2 Limetten, 1 Knoblauchknolle & frischer Dill'] },
      { cat: 'Kühltheke & Proteine', items: ['4 Packungen Naturtofu', '1 Packung Feta oder Gouda', '1 Schachtel Eier (6 Stück)', '1 Becher griechischer Joghurt / Quark'] },
      { cat: 'Vorratskammer & Nüsse', items: ['Walnusskerne (50g)', 'Mandelmehl oder gemahlene Mandeln (100g)', 'Weißes Mandelmus (1 Glas)', 'Tomatenmark', 'Sesamsamen, Senf (mild) & mildes geräuchertes Paprikapulver', 'Gemüsebrühe'] }
    ],
    'week-3': [
      { cat: 'Gemüse & Frische (Penny)', items: ['3 große Paprikaschoten (zum Füllen & Spieße)', '1 Aubergine', '2 Zucchini', '1 Kopf Blumenkohl', '200g Champignons', '250g Cherrytomaten', '1 Bund Lauchzwiebeln', '1 Packung Sojasprossen', '1 kleine Dose Mais (sparsam)', '2 Limetten & 2 Zitronen', 'Frischer Knoblauch'] },
      { cat: 'Kühltheke & Proteine', items: ['4 Packungen Naturtofu oder Seidentofu', '1 Schachtel Eier', 'Gouda oder Feta zum Überbacken', 'Ungesüßte Mandelmilch oder Schmand'] },
      { cat: 'Vorratskammer & Gewürze', items: ['2 Dosen gehackte Tomaten', 'Kürbiskerne & Sonnenblumenkerne', 'Holzspieße für Tofu-Spieße', 'Kräuter der Provence, Oregano, Thymian', 'Paprikapulver edelsüß & Sojasauce'] }
    ],
    'week-4': [
      { cat: 'Gemüse & Frische (Penny)', items: ['2 Köpfe Brokkoli', '300g braune Champignons / Shiitake', '3 rote Paprika', '2 Zucchini', '1 Aubergine', '1 Packung Sojasprossen', '1 Salatgurke', '1 reife Avocado', '1 Bund frisches Basilikum & Petersilie', '3 Limetten & 1 Zitrone'] },
      { cat: 'Kühltheke & Proteine', items: ['4 Packungen Naturtofu', 'Gouda / Emmentaler gerieben', 'Griechischer Joghurt oder Quark', 'Mandelmilch ungesüßt'] },
      { cat: 'Vorratskammer & Nüsse', items: ['1 Dose Kokosmilch (400ml)', '1 Glas Erdnussmus (100% Erdnuss)', 'Sonnenblumenkerne & Sesam', 'Hefeflocken (optional)', '2 Dosen gehackte Tomaten', 'Milde gelbe Currypaste'] }
    ]
  };

  btnGen.addEventListener('click', () => {
    const activeTab = document.querySelector('.week-tab.active');
    const weekId = activeTab ? activeTab.getAttribute('data-target') : 'week-1';
    const weekNum = weekId.replace('week-', '');

    modalTitle.textContent = `🛒 Einkaufsliste für Woche ${weekNum} (Standard: 2 Personen)`;

    const data = weeklyShoppingData[weekId] || weeklyShoppingData['week-1'];
    let html = '<div class="shopping-checklist-container">';
    
    data.forEach(sec => {
      html += `<div class="shopping-category-block" style="margin-bottom: 20px;">
        <h4 style="color: var(--primary-dark); margin-bottom: 10px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">${sec.cat}</h4>
        <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px;">`;
      sec.items.forEach(item => {
        html += `<li style="display: flex; align-items: center; gap: 10px;">
          <input type="checkbox" style="width: 18px; height: 18px; accent-color: var(--primary); cursor: pointer;">
          <span style="font-size: 0.95rem;">${item}</span>
        </li>`;
      });
      html += `</ul></div>`;
    });

    html += '</div>';
    modalContent.innerHTML = html;
    modal.style.display = 'flex';
  });

  const closeModal = () => { modal.style.display = 'none'; };
  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (btnClose2) btnClose2.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

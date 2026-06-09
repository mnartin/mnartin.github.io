// food.js – måltidsanmälningar med Firebase Realtime Database

// ================================================================
//  MÅLTIDER – grupperade per dag
// ================================================================
const MEALS = [
  { id: 'middag-torsdag',    title: 'Middag',   day: 'Torsdag',   dayLabel: 'torsdag'   },
  { id: 'frukost-midsommar', title: 'Frukost',  day: 'Midsommar', dayLabel: 'midsommar' },
  { id: 'lunch-midsommar',   title: 'Lunch',    day: 'Midsommar', dayLabel: 'midsommar' },
  { id: 'middag-midsommar',  title: 'Middag',   day: 'Midsommar', dayLabel: 'midsommar' },
  { id: 'frukost-lordag',    title: 'Frukost',  day: 'Lördag',    dayLabel: 'lördag'    },
  { id: 'lunch-lordag',      title: 'Lunch',    day: 'Lördag',    dayLabel: 'lördag'    },
  { id: 'middag-lordag',     title: 'Middag',   day: 'Lördag',    dayLabel: 'lördag'    },
  { id: 'frukost-sondag',    title: 'Frukost',  day: 'Söndag',    dayLabel: 'söndag'    },
  { id: 'lunch-sondag',      title: 'Lunch',    day: 'Söndag',    dayLabel: 'söndag'    }
];

const DAY_IDS = {
  'Torsdag':   'dag-torsdag',
  'Midsommar': 'dag-midsommar',
  'Lördag':    'dag-lordag',
  'Söndag':    'dag-sondag'
};

// ================================================================
//  INTERNALS
// ================================================================
let currentMealId = null;
const mealsContainer = document.getElementById('mealsContainer');
const modalOverlay   = document.getElementById('modalOverlay');
const modalTitle     = document.getElementById('modalTitle');
const dishInput      = document.getElementById('dishInput');
const cookInput      = document.getElementById('cookInput');

if (!window.db) {
  mealsContainer.innerHTML = `
    <p class="setup-notice">
      ⚠️ <strong>Firebase är inte konfigurerat ännu.</strong><br>
      Öppna <code>js/firebase-config.js</code> och följ instruktionerna.
    </p>`;
} else {
  buildMeals();
  listenToAll();
}

// ----------------------------------------------------------------
//  Bygg dag-grupper och kort
// ----------------------------------------------------------------
function buildMeals() {
  const days = [];
  const dayMap = {};
  MEALS.forEach(function (meal) {
    if (!dayMap[meal.day]) { dayMap[meal.day] = []; days.push(meal.day); }
    dayMap[meal.day].push(meal);
  });

  days.forEach(function (day) {
    const dayId = DAY_IDS[day];
    const group = document.createElement('div');
    group.className = 'day-group';

    // Heading row with day-level comment toggle
    const headingRow = document.createElement('div');
    headingRow.className = 'day-heading-row';

    const heading = document.createElement('h3');
    heading.className = 'day-heading';
    heading.textContent = day;

    const dayCommentBtn = document.createElement('button');
    dayCommentBtn.className = 'day-comment-btn';
    dayCommentBtn.title = 'Kommentera dagen';
    dayCommentBtn.innerHTML = '💬 <span class="day-comment-count" id="day-comment-count-' + dayId + '"></span>';
    dayCommentBtn.addEventListener('click', function () {
      toggleCommentSection('day-comments-' + dayId);
    });

    headingRow.appendChild(heading);
    headingRow.appendChild(dayCommentBtn);
    group.appendChild(headingRow);

    // Day comment section
    group.appendChild(buildCommentSection('day-comments-' + dayId, dayId, 'dag'));

    const row = document.createElement('div');
    row.className = 'day-cards';

    dayMap[day].forEach(function (meal) { row.appendChild(buildCard(meal)); });
    group.appendChild(row);
    mealsContainer.appendChild(group);
  });
}

function buildCard(meal) {
  const card = document.createElement('div');
  card.className = 'meal-card';
  card.id = 'meal-' + meal.id;
  card.innerHTML = `
    <div class="meal-header">
      <h2 class="meal-title" id="title-${meal.id}">${meal.title}</h2>
      <div class="meal-header-actions">
        <button class="comment-toggle-btn" data-target="card-comments-${meal.id}" title="Kommentera" aria-label="Visa kommentarer">
          💬<span class="comment-count" id="comment-count-${meal.id}"></span>
        </button>
        <button class="edit-title-btn" aria-label="Redigera rubrik" title="Redigera rubrik">✎</button>
        <button class="add-btn" aria-label="Lägg till maträtt">+</button>
      </div>
    </div>
    <div class="signups-container" id="signups-${meal.id}">
      <span class="no-signups">lägg till maträtter och ditt namn</span>
    </div>
  `;

  // Append comment section
  card.appendChild(buildCommentSection('card-comments-' + meal.id, meal.id, 'rätt'));

  card.querySelector('.add-btn').addEventListener('click', function () {
    openModal(meal.id, meal.dayLabel);
  });

  card.querySelector('.edit-title-btn').addEventListener('click', function () {
    startEditTitle(meal.id);
  });

  card.querySelector('.comment-toggle-btn').addEventListener('click', function () {
    toggleCommentSection('card-comments-' + meal.id);
  });

  return card;
}

// ----------------------------------------------------------------
//  Comment section builder
// ----------------------------------------------------------------
function buildCommentSection(sectionId, refId, label) {
  const section = document.createElement('div');
  section.className = 'comment-section collapsed';
  section.id = sectionId;

  section.innerHTML = `
    <div class="comment-list" id="list-${sectionId}"></div>
    <div class="comment-form">
      <input type="text" class="comment-author-input" placeholder="ditt namn" autocomplete="off">
      <input type="text" class="comment-text-input" placeholder="din kommentar..." autocomplete="off">
      <button class="comment-submit-btn" data-ref="${refId}" data-label="${label}">→</button>
    </div>
  `;

  section.querySelector('.comment-submit-btn').addEventListener('click', function () {
    submitComment(section, refId);
  });

  section.querySelectorAll('input').forEach(function (inp) {
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submitComment(section, refId);
    });
  });

  // Listen for comments
  window.db.ref('midsommar/comments/' + refId).on('value', function (snap) {
    renderComments(sectionId, refId, snap.val());
  });

  return section;
}

function toggleCommentSection(sectionId) {
  const sec = document.getElementById(sectionId);
  if (!sec) return;
  const isOpen = !sec.classList.contains('collapsed');
  sec.classList.toggle('collapsed', isOpen);
  if (!isOpen) {
    // focus author input when opening
    const inp = sec.querySelector('.comment-author-input');
    if (inp) setTimeout(function () { inp.focus(); }, 150);
  }
}

function submitComment(section, refId) {
  const author = section.querySelector('.comment-author-input').value.trim();
  const text   = section.querySelector('.comment-text-input').value.trim();
  if (!text || !window.db) return;
  window.db.ref('midsommar/comments/' + refId).push({
    author: author || 'anonym',
    text:   text,
    ts:     Date.now()
  });
  section.querySelector('.comment-author-input').value = '';
  section.querySelector('.comment-text-input').value   = '';
}

function renderComments(sectionId, refId, data) {
  const list = document.getElementById('list-' + sectionId);
  if (!list) return;

  // Update counts in both card + day badges
  const count = data ? Object.keys(data).length : 0;
  const cardCount = document.getElementById('comment-count-' + refId);
  if (cardCount) cardCount.textContent = count > 0 ? ' ' + count : '';
  const dayCount = document.getElementById('day-comment-count-' + refId);
  if (dayCount) dayCount.textContent = count > 0 ? ' ' + count : '';

  if (!data) { list.innerHTML = ''; return; }

  list.innerHTML = Object.entries(data).map(function ([key, val]) {
    return `
      <div class="comment-item" data-key="${key}" data-ref="${refId}">
        <span class="comment-author">${val.author}</span>
        <span class="comment-text">${val.text}</span>
        <button class="comment-delete" aria-label="Ta bort kommentar">×</button>
      </div>`;
  }).join('');

  list.querySelectorAll('.comment-delete').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const item = btn.closest('.comment-item');
      window.db.ref('midsommar/comments/' + item.dataset.ref + '/' + item.dataset.key).remove();
    });
  });
}

// ----------------------------------------------------------------
//  Inline title editing
// ----------------------------------------------------------------
function startEditTitle(mealId) {
  const titleEl = document.getElementById('title-' + mealId);
  const current = titleEl.textContent;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = current;
  input.className = 'title-edit-input';
  input.setAttribute('aria-label', 'Redigera rubrik');

  titleEl.replaceWith(input);
  input.focus();
  input.select();

  function save() {
    const newTitle = input.value.trim() || current;
    const h2 = document.createElement('h2');
    h2.className = 'meal-title';
    h2.id = 'title-' + mealId;
    h2.textContent = newTitle;
    input.replaceWith(h2);
    window.db.ref('midsommar/meals/' + mealId + '/customTitle').set(newTitle);
  }

  input.addEventListener('blur', save);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter')  { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { input.value = current; input.blur(); }
  });
}

// ----------------------------------------------------------------
//  Firebase listeners
// ----------------------------------------------------------------
function listenToAll() {
  MEALS.forEach(function (meal) {
    window.db.ref('midsommar/meals/' + meal.id + '/customTitle')
      .on('value', function (snap) {
        const titleEl = document.getElementById('title-' + meal.id);
        if (snap.val() && titleEl && titleEl.tagName === 'H2') {
          titleEl.textContent = snap.val();
        }
      });

    window.db.ref('midsommar/meals/' + meal.id + '/signups')
      .on('value', function (snap) { renderSignups(meal.id, snap.val()); });
  });
}

function renderSignups(mealId, data) {
  const container = document.getElementById('signups-' + mealId);
  if (!container) return;

  if (!data) {
    container.innerHTML = '<span class="no-signups">lägg till maträtter och ditt namn</span>';
    return;
  }

  container.innerHTML = Object.entries(data).map(function ([key, val]) {
    const dish = val.dish || val.name || '';
    const cook = val.cook || '';
    return `
      <div class="menu-item" data-key="${key}" data-meal="${mealId}">
        <span class="menu-dish">${dish}</span>
        <span class="menu-leaders" aria-hidden="true"></span>
        <span class="menu-cook">${cook}</span>
        <button class="remove-chip" aria-label="Ta bort">×</button>
      </div>`;
  }).join('');

  container.querySelectorAll('.remove-chip').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      const item = e.currentTarget.closest('.menu-item');
      window.db.ref('midsommar/meals/' + item.dataset.meal + '/signups/' + item.dataset.key).remove();
    });
  });
}

// ----------------------------------------------------------------
//  Modal
// ----------------------------------------------------------------
function openModal(mealId, dayLabel) {
  currentMealId = mealId;
  modalTitle.textContent = 'maträtter till ' + dayLabel;
  dishInput.value = '';
  cookInput.value = '';
  modalOverlay.classList.remove('hidden');
  dishInput.focus();
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  currentMealId = null;
}

function submitEntry() {
  const dish = dishInput.value.trim();
  const cook = cookInput.value.trim();
  if (!dish || !currentMealId || !window.db) return;
  window.db.ref('midsommar/meals/' + currentMealId + '/signups').push({
    dish: dish,
    cook: cook,
    timestamp: Date.now()
  });
  closeModal();
}

document.getElementById('submitEntry').addEventListener('click', submitEntry);

[dishInput, cookInput].forEach(function (inp) {
  inp.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') submitEntry();
  });
});

document.getElementById('modalClose').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', function (e) {
  if (e.target === modalOverlay) closeModal();
});

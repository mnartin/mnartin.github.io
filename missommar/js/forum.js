// forum.js – ämnen och kommentarer med Firebase Realtime Database

const forumList   = document.getElementById('forumList');
const topicAuthor = document.getElementById('topicAuthor');
const topicTitle  = document.getElementById('topicTitle');

if (!window.db) {
  forumList.innerHTML = `<p class="setup-notice">⚠️ Firebase är inte konfigurerat.</p>`;
} else {
  listenToTopics();
}

// ----------------------------------------------------------------
//  Create topic
// ----------------------------------------------------------------
document.getElementById('topicSubmit').addEventListener('click', submitTopic);
[topicAuthor, topicTitle].forEach(function (inp) {
  inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitTopic(); });
});

function submitTopic() {
  const title  = topicTitle.value.trim();
  const author = topicAuthor.value.trim();
  if (!title || !window.db) return;
  window.db.ref('midsommar/forum').push({
    title:  title,
    author: author || 'anonym',
    ts:     Date.now()
  });
  topicTitle.value = '';
}

// ----------------------------------------------------------------
//  Listen to all topics
// ----------------------------------------------------------------
function listenToTopics() {
  window.db.ref('midsommar/forum').on('value', function (snap) {
    forumList.innerHTML = '';
    if (!snap.val()) {
      forumList.innerHTML = '<p class="no-signups" style="padding:.5rem 0">inga ämnen ännu — starta ett!</p>';
      return;
    }
    // Newest first
    const topics = Object.entries(snap.val()).reverse();
    topics.forEach(function ([id, data]) {
      forumList.appendChild(buildTopic(id, data));
    });
  });
}

// ----------------------------------------------------------------
//  Build topic card
// ----------------------------------------------------------------
function buildTopic(id, data) {
  const card = document.createElement('div');
  card.className = 'forum-card';
  card.id = 'topic-' + id;

  card.innerHTML = `
    <div class="forum-card-header">
      <div class="forum-topic-meta">
        <span class="forum-topic-title">${data.title}</span>
        <span class="forum-topic-author">${data.author}</span>
      </div>
      <div class="forum-header-actions">
        <button class="forum-comment-toggle comment-toggle-btn" title="Visa kommentarer">
          💬<span class="comment-count" id="fcount-${id}"></span>
        </button>
        <button class="forum-delete-topic" aria-label="Ta bort ämne">×</button>
      </div>
    </div>
    <div class="forum-comments collapsed" id="fcomments-${id}">
      <div class="comment-list" id="flist-${id}"></div>
      <div class="comment-form">
        <input type="text" class="comment-author-input" placeholder="ditt namn" autocomplete="off">
        <input type="text" class="comment-text-input" placeholder="din kommentar..." autocomplete="off">
        <button class="comment-submit-btn">→</button>
      </div>
    </div>
  `;

  // Toggle comments
  card.querySelector('.forum-comment-toggle').addEventListener('click', function () {
    const sec = document.getElementById('fcomments-' + id);
    const opening = sec.classList.contains('collapsed');
    sec.classList.toggle('collapsed');
    if (opening) {
      const inp = sec.querySelector('.comment-author-input');
      if (inp) setTimeout(function () { inp.focus(); }, 150);
    }
  });

  // Delete topic
  card.querySelector('.forum-delete-topic').addEventListener('click', function () {
    window.db.ref('midsommar/forum/' + id).remove();
    window.db.ref('midsommar/forumComments/' + id).remove();
  });

  // Submit comment
  const section = card.querySelector('.forum-comments');
  card.querySelector('.comment-submit-btn').addEventListener('click', function () {
    submitForumComment(section, id);
  });
  section.querySelectorAll('input').forEach(function (inp) {
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submitForumComment(section, id);
    });
  });

  // Listen to comments
  window.db.ref('midsommar/forumComments/' + id).on('value', function (snap) {
    renderForumComments(id, snap.val());
  });

  return card;
}

// ----------------------------------------------------------------
//  Comments
// ----------------------------------------------------------------
function submitForumComment(section, topicId) {
  const author = section.querySelector('.comment-author-input').value.trim();
  const text   = section.querySelector('.comment-text-input').value.trim();
  if (!text || !window.db) return;
  window.db.ref('midsommar/forumComments/' + topicId).push({
    author: author || 'anonym',
    text:   text,
    ts:     Date.now()
  });
  section.querySelector('.comment-author-input').value = '';
  section.querySelector('.comment-text-input').value   = '';
}

function renderForumComments(topicId, data) {
  const list  = document.getElementById('flist-' + topicId);
  const count = document.getElementById('fcount-' + topicId);
  if (!list) return;

  const n = data ? Object.keys(data).length : 0;
  if (count) count.textContent = n > 0 ? ' ' + n : '';

  if (!data) { list.innerHTML = ''; return; }

  list.innerHTML = Object.entries(data).map(function ([key, val]) {
    return `
      <div class="comment-item" data-key="${key}" data-ref="${topicId}">
        <span class="comment-author">${val.author}</span>
        <span class="comment-text">${val.text}</span>
        <button class="comment-delete" aria-label="Ta bort">×</button>
      </div>`;
  }).join('');

  list.querySelectorAll('.comment-delete').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const item = btn.closest('.comment-item');
      window.db.ref('midsommar/forumComments/' + item.dataset.ref + '/' + item.dataset.key).remove();
    });
  });
}

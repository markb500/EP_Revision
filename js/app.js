// Science Definitions Revision Aid — main UI
import { loadDefinitions } from './definitions.js';

function typesetMath(root) {
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise(root ? [root] : undefined).catch(() => {});
  } else if (window.MathJax && MathJax.Hub) {
    MathJax.Hub.Queue(['Typeset', MathJax.Hub, root || document.body]);
  }
}

const CARD_COUNT = 6;

/** @type {import('./definitions.js').DefinitionPair[]} */
let allPairs = [];
/** @type {number[]} ids shown on the previous screen */
let previousIds = [];
/** @type {number[]} ids on the current screen */
let currentIds = [];

const statusEl = () => document.getElementById('status');
const gridEl = () => document.getElementById('card-grid');
const nextBtn = () => document.getElementById('btn-next');

/**
 * Pick up to `count` pair ids, preferring not to reuse the previous set.
 * If the pool is small, relaxes the constraint rather than looping forever.
 * @param {number} poolSize
 * @param {number[]} avoid
 * @param {number} count
 * @returns {number[]}
 */
function pickIds(poolSize, avoid, count) {
  if (poolSize === 0) return [];

  const want = Math.min(count, poolSize);
  const avoidSet = new Set(avoid);

  // If avoiding previous would leave too few, only avoid what we can
  let usable = [];
  for (let i = 0; i < poolSize; i++) {
    if (!avoidSet.has(i)) usable.push(i);
  }
  if (usable.length < want) {
    usable = Array.from({ length: poolSize }, (_, i) => i);
  }

  const chosen = [];
  const pool = usable.slice();
  while (chosen.length < want && pool.length) {
    const idx = Math.floor(Math.random() * pool.length);
    chosen.push(pool.splice(idx, 1)[0]);
  }
  return chosen;
}

function resetFlips() {
  document.querySelectorAll('.card.flipped').forEach((card) => {
    card.classList.remove('flipped');
    card.setAttribute('aria-pressed', 'false');
    const front = card.querySelector('.card-front');
    const back = card.querySelector('.card-back');
    if (front) front.setAttribute('aria-hidden', 'false');
    if (back) back.setAttribute('aria-hidden', 'true');
  });
}

/**
 * @param {import('./definitions.js').DefinitionPair[]} pairs
 */
function renderCards(pairs) {
  const grid = gridEl();
  if (!grid) return;

  grid.innerHTML = '';

  pairs.forEach((pair, index) => {
    const container = document.createElement('div');
    container.className = 'card-container';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card';
    btn.id = `card-${index}`;
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute(
      'aria-label',
      `${pair.term}. Card ${index + 1} of ${pairs.length}. Activate to show definition.`
    );

    const front = document.createElement('div');
    front.className = 'card-face card-front';
    front.innerHTML = `<div class="term"></div><div class="hint">Space / Enter: reveal · Arrows: move</div>`;
    front.querySelector('.term').innerHTML = pair.term;

    const back = document.createElement('div');
    back.className = 'card-face card-back';
    back.innerHTML = `<div class="term"></div><div class="definition"></div>`;
    back.querySelector('.term').innerHTML = pair.term;
    back.querySelector('.definition').innerHTML = pair.definition;

    btn.appendChild(front);
    btn.appendChild(back);

    btn.addEventListener('click', () => toggleCard(btn, pair.term));

    container.appendChild(btn);
    grid.appendChild(container);
  });
  typesetMath(grid);
}


/** @returns {HTMLButtonElement[]} */
function getCards() {
  return Array.from(document.querySelectorAll('#card-grid .card'));
}

/** Columns in the card grid (matches CSS breakpoints). */
function gridColumnCount() {
  if (window.matchMedia('(max-width: 640px)').matches) return 1;
  if (window.matchMedia('(max-width: 960px)').matches) return 2;
  return 3;
}


/**
 * Move focus to card index if it exists.
 * @param {number} index
 */
function focusCardAt(index) {
  const cards = getCards();
  if (index < 0 || index >= cards.length) return;
  cards[index].focus();
}

/**
 * Arrow / Home / End navigation when a card has focus.
 * Always preventDefault for these keys so the page does not scroll.
 * @param {KeyboardEvent} e
 * @returns {boolean} true if handled
 */
function handleCardNavigation(e) {
  const cards = getCards();
  if (!cards.length) return false;

  const active = document.activeElement;
  const index = cards.indexOf(/** @type {HTMLButtonElement} */ (active));
  if (index === -1) return false;

  const cols = gridColumnCount();
  const total = cards.length;
  let next = index;

  switch (e.key) {
    case 'ArrowRight':
      next = Math.min(index + 1, total - 1);
      break;
    case 'ArrowLeft':
      next = Math.max(index - 1, 0);
      break;
    case 'ArrowDown':
      next = Math.min(index + cols, total - 1);
      break;
    case 'ArrowUp':
      next = Math.max(index - cols, 0);
      break;
    case 'Home':
      next = 0;
      break;
    case 'End':
      next = total - 1;
      break;
    case ' ':
    case 'Enter':
      e.preventDefault();
      {
        const term =
          active.querySelector?.('.card-front .term')?.textContent ||
          active.getAttribute('aria-label') ||
          '';
        toggleCard(/** @type {HTMLButtonElement} */ (active), term);
      }
      return true;
    default:
      return false;
  }

  // Prevent Chrome from scrolling the page
  e.preventDefault();
  if (next !== index) {
    cards[next].focus();
  }
  return true;
}

/**
 * @param {HTMLButtonElement} card
 * @param {string} term
 */

/** Strip HTML to plain text for accessible names (keeps img alt text). */
function plainTextFromHtml(html) {
  const d = document.createElement('div');
  d.innerHTML = html || '';
  d.querySelectorAll('img').forEach((img) => {
    const alt = img.getAttribute('alt') || '';
    img.replaceWith(document.createTextNode(alt ? ` ${alt} ` : ''));
  });
  return (d.textContent || '').replace(/\s+/g, ' ').trim();
}

/**
 * @param {HTMLButtonElement} card
 * @param {import('./definitions.js').DefinitionPair} pair
 * @param {number} index
 * @param {number} total
 */
function toggleCard(card, pair, index, total) {
  const flipped = card.classList.toggle('flipped');
  card.setAttribute('aria-pressed', flipped ? 'true' : 'false');
  syncCardA11y(card, pair, index, total, flipped);
}

/**
 * @param {HTMLButtonElement} card
 * @param {import('./definitions.js').DefinitionPair} pair
 * @param {number} index
 * @param {number} total
 * @param {boolean} flipped
 */
function syncCardA11y(card, pair, index, total, flipped) {
  const front = card.querySelector('.card-front');
  const back = card.querySelector('.card-back');
  if (front) front.setAttribute('aria-hidden', flipped ? 'true' : 'false');
  if (back) back.setAttribute('aria-hidden', flipped ? 'false' : 'true');

  const termText = plainTextFromHtml(pair.term);
  if (flipped) {
    const defText = plainTextFromHtml(pair.definition);
    card.setAttribute(
      'aria-label',
      `${termText}. Definition: ${defText}. Card ${index + 1} of ${total}. Activate to hide.`
    );
  } else {
    card.setAttribute(
      'aria-label',
      `${termText}. Card ${index + 1} of ${total}. Activate to show definition.`
    );
  }
}

function updateStatus() {
  const el = statusEl();
  if (!el) return;
  if (!allPairs.length) {
    el.textContent = '';
    return;
  }
  el.innerHTML =
    `Showing <strong>${currentIds.length}</strong> of <strong>${allPairs.length}</strong> definitions`;
}

/** True while the Next transition is running */
let nextAnimating = false;

/** CSS flip duration on `.card` (ms) — keep in sync with main.css */
const FLIP_MS = 600;

/**
 * Write pair text onto an existing card.
 * @param {HTMLButtonElement} card
 * @param {import('./definitions.js').DefinitionPair} pair
 * @param {{ front?: boolean, back?: boolean }} [faces]
 */
function applyPairToCard(card, pair, faces = { front: true, back: true }) {
  if (faces.front !== false) {
    const frontTerm = card.querySelector('.card-front .term');
    if (frontTerm) frontTerm.innerHTML = pair.term;
  }
  if (faces.back !== false) {
    const backTerm = card.querySelector('.card-back .term');
    const backDef = card.querySelector('.card-back .definition');
    if (backTerm) backTerm.innerHTML = pair.term;
    if (backDef) backDef.innerHTML = pair.definition;
  }
  const index = Number(card.id.replace('card-', '')) || 0;
  const total = getCards().length || 1;
  const flipped = card.classList.contains('flipped');
  card.onclick = () => toggleCard(card, pair, index, total);
  syncCardA11y(card, pair, index, total, flipped);
}

/**
 * Next set: flip remaining cards to the back, then flip all to the front
 * with new terms. Backs (definitions) update only after the front is showing,
 * so new solutions are never visible during the transition.
 */
function nextSet() {
  if (!allPairs.length || nextAnimating) return;

  previousIds = currentIds.slice();
  currentIds = pickIds(allPairs.length, previousIds, CARD_COUNT);
  const pairs = currentIds.map((id) => allPairs[id]);

  const existing = getCards();
  const next = nextBtn();

  // First load: no transition ceremony
  if (!existing.length) {
    renderCards(pairs);
    updateStatus();
    const first = document.getElementById('card-0');
    if (first) first.focus({ preventScroll: true });
    return;
  }

  nextAnimating = true;
  if (next) next.disabled = true;

  // 1) Flip every card that is still showing the front (old backs may show briefly)
  existing.forEach((card) => {
    if (!card.classList.contains('flipped')) {
      card.classList.add('flipped');
      card.setAttribute('aria-pressed', 'true');
      const front = card.querySelector('.card-front');
      const back = card.querySelector('.card-back');
      if (front) front.setAttribute('aria-hidden', 'true');
      if (back) back.setAttribute('aria-hidden', 'false');
    }
  });

  // 2) When all are on the back: update ONLY the hidden front faces, then flip to front
  window.setTimeout(() => {
    const cards = getCards();
    const grid = gridEl();
    const n = Math.min(cards.length, pairs.length);

    for (let i = 0; i < n; i++) {
      // Front is hidden while .flipped — safe to change term now
      applyPairToCard(cards[i], pairs[i], { front: true, back: false });
      // Clear back so a mid-animation flash cannot show the new definition
      const backDef = cards[i].querySelector('.card-back .definition');
      const backTerm = cards[i].querySelector('.card-back .term');
      if (backDef) backDef.innerHTML = '';
      if (backTerm) backTerm.innerHTML = pairs[i].term;
    }

    if (grid) void grid.offsetHeight;

    // 3) Animate to the front — student sees new terms only
    cards.forEach((card) => {
      card.classList.remove('flipped');
      card.setAttribute('aria-pressed', 'false');
      const front = card.querySelector('.card-front');
      const back = card.querySelector('.card-back');
      if (front) front.setAttribute('aria-hidden', 'false');
      if (back) back.setAttribute('aria-hidden', 'true');
    });

    updateStatus();

    // 4) After the front is fully showing, fill the new definitions on the backs
    window.setTimeout(() => {
      const cardsNow = getCards();
      const m = Math.min(cardsNow.length, pairs.length);
      for (let i = 0; i < m; i++) {
        applyPairToCard(cardsNow[i], pairs[i], { front: true, back: true });
      }
      typesetMath(gridEl());

      nextAnimating = false;
      if (next) next.disabled = false;
      const first = document.getElementById('card-0');
      if (first) first.focus({ preventScroll: true });
    }, FLIP_MS);
  }, FLIP_MS);
}

async function init() {
  const status = statusEl();
  const next = nextBtn();

  try {
    allPairs = await loadDefinitions();
  } catch (err) {
    if (status) {
      status.className = 'status error';
      status.setAttribute('role', 'alert');
      status.textContent =
        err instanceof Error ? err.message : 'Failed to load definitions.';
    }
    if (next) next.disabled = true;
    return;
  }

  if (next) {
    next.addEventListener('click', nextSet);
  }

  // Keyboard: card arrows / flip when a card is focused; N for next set
  document.addEventListener('keydown', (e) => {
    const tag = (e.target && /** @type {HTMLElement} */ (e.target).tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (handleCardNavigation(e)) return;

    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      nextSet();
    }
  });

  nextSet();
}

document.addEventListener('DOMContentLoaded', init);

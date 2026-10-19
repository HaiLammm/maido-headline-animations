'use strict';

/*
 * Builds the first-view copy from <template id="copy-template"> into the big
 * stage and into one miniature per animation, splits every [data-line] into
 * characters for css/text-animations.css, and drives the controls.
 */

const ANIMS = [
  { id: 'none', name: '動きなし（現在）', desc: '今のトップページと同じ、動きのない表示です。比べる基準にどうぞ。', loop: 0 },
  { id: 'slide', name: 'スライドイン', desc: '各行が左からすっと滑り込みます。いちばん控えめで上品な動きです。', loop: 4000 },
  { id: 'wipe', name: 'ワイプ', desc: '幕を開けるように、左から右へ文字が現れます。', loop: 4000 },
  { id: 'feather', name: 'にじみ', desc: '墨がにじむように、ぼかした境目が左から右へ進みます。', loop: 4600 },
  { id: 'slash', name: '斜めワイプ', desc: '斜めの切り口が左から右へ走り、文字を切り出します。', loop: 4000 },
  { id: 'bar', name: '帯リビール', desc: '帯が左から伸びて右へ引き、その跡に文字が残ります。', loop: 4200 },
  { id: 'chars', name: '一文字ずつ', desc: '一文字ずつ、左から順にふわっと現れます。', loop: 4800 },
  { id: 'blur', name: 'ぼかしから', desc: 'ぼやけた文字が、左から順にくっきりしていきます。', loop: 5200 },
  { id: 'fly', name: '流れ込み', desc: '文字が左から勢いよく流れ込み、ぴたりと止まります。', loop: 4600 },
  { id: 'flip', name: 'めくり', desc: '一文字ずつ、カードをめくるように立ち上がります。', loop: 4800 },
  { id: 'type', name: 'タイプライター', desc: 'カーソルとともに、一文字ずつ打ち込まれます。', loop: 6500 },
  { id: 'shine', name: '光が走る', desc: '表示のあと、金色の光が左から右へ文字をなぞります。', loop: 4800 },
  { id: 'spread', name: '広がる', desc: '重なった文字が、左から右へほどけるように広がります。', loop: 4200 },
  { id: 'marquee', name: '流れ続ける', desc: '「鹿児島県産A5等級黒毛和牛」が左から右へ流れ続けます。', loop: 0 },
];

const MINI_PHOTO = 'https://maido-ookini-shouten.com/cdn/shop/files/maido-month-2026-10-portrait.jpg?width=550';
const MARQUEE_COPIES = 3;      // per half of the track
const MARQUEE_SPEED = 60;      // px per second, whatever the screen width

const template = document.getElementById('copy-template');
const stage = document.getElementById('stage');
const stageCopy = stage.querySelector('[data-copy]');
const cardList = document.getElementById('cards');
const barNo = document.getElementById('bar-no');
const barName = document.getElementById('bar-name');

let current = 1;

const number = (i) => `No.${String(i).padStart(2, '0')}`;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* ------------------------------------------------------------ building */

function split(copy) {
  let count = 0;
  let lastChar = null;
  const lines = copy.querySelectorAll('[data-line]');

  lines.forEach((source, i) => {
    const text = source.textContent;
    const line = el('span', 'ta-line');
    const chars = el('span', 'ta-chars');
    line.style.setProperty('--i', i);
    chars.setAttribute('aria-hidden', 'true');

    for (const ch of text) {
      lastChar = el('span', 'ta-char', ch);
      lastChar.style.setProperty('--c', count++);
      chars.append(lastChar);
    }

    line.append(el('span', 'ta-sr', text), chars);
    source.replaceChildren(line);
  });

  lastChar?.classList.add('ta-char--last');
  copy.style.setProperty('--ta-count', count);
  copy.style.setProperty('--ta-lines', lines.length);
}

function fillMarquee(copy) {
  const track = copy.querySelector('[data-marquee]');
  for (let n = 0; n < MARQUEE_COPIES * 2; n++) {
    track.append(el('span', '', track.dataset.marquee), el('span', 'ta-marquee__sep', '◆'));
  }
}

function buildCopy(copy) {
  copy.append(template.content.cloneNode(true));
  split(copy);
  fillMarquee(copy);
}

function buildCard(anim, i) {
  const card = el('li', 'card');
  const mini = el('div', 'mini');
  const photo = el('img');
  const copy = el('div', 'fv-copy');
  const body = el('div', 'card__body');
  const show = el('button', 'card__show', '大きく見る');

  mini.setAttribute('aria-hidden', 'true');
  photo.src = MINI_PHOTO;
  photo.alt = '';
  photo.loading = 'lazy';
  photo.decoding = 'async';
  show.type = 'button';
  buildCopy(copy);
  mini.append(photo, copy);

  body.append(
    el('p', 'card__no', number(i)),
    el('h3', 'card__name', anim.name),
    el('p', 'card__desc', anim.desc),
    show,
  );
  card.append(mini, body);
  card.dataset.index = i;
  card.addEventListener('click', () => select(i, { play: true }));
  return card;
}

/* ------------------------------------------------------------- playing */

function play(copy, id) {
  copy.dataset.anim = '';
  void copy.offsetWidth; // flush, so setting the same value starts over
  copy.dataset.anim = id;

  if (id === 'marquee') {
    const track = copy.querySelector('.ta-marquee__track');
    const half = track.scrollWidth / 2;
    track.style.setProperty('--ta-marquee-dur', `${Math.max(8, half / MARQUEE_SPEED)}s`);
  }
}

function stageInView() {
  const rect = stage.getBoundingClientRect();
  return rect.top > -rect.height * 0.3 && rect.top < window.innerHeight * 0.4;
}

function playStage() {
  if (stageInView()) {
    play(stageCopy, ANIMS[current].id);
    return;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => play(stageCopy, ANIMS[current].id), 600);
}

function select(i, { play: shouldPlay = false } = {}) {
  current = (i + ANIMS.length) % ANIMS.length;
  const anim = ANIMS[current];

  barNo.textContent = number(current);
  barName.textContent = anim.name;
  history.replaceState(null, '', `#${String(current).padStart(2, '0')}`);

  for (const card of cardList.children) {
    const isCurrent = Number(card.dataset.index) === current;
    card.setAttribute('aria-current', isCurrent ? 'true' : 'false');
    card.querySelector('.card__show').textContent = isCurrent ? '表示中' : '大きく見る';
  }

  if (shouldPlay) playStage();
}

/* Miniatures play when scrolled into view and repeat while they stay there. */
function watchMinis() {
  const timers = new Map();

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const mini = entry.target;
      const anim = ANIMS[mini.closest('.card').dataset.index];
      const copy = mini.querySelector('.fv-copy');

      clearInterval(timers.get(mini));
      timers.delete(mini);

      if (!entry.isIntersecting) {
        copy.dataset.anim = '';
        continue;
      }
      play(copy, anim.id);
      if (anim.loop) timers.set(mini, setInterval(() => play(copy, anim.id), anim.loop));
    }
  }, { threshold: 0.6 });

  for (const mini of cardList.querySelectorAll('.mini')) observer.observe(mini);
}

/* ----------------------------------------------------------------- init */

function fontsReady() {
  const sample = '今月の和牛鹿児島県産A5等級黒毛全国から、その時に旨い牛を選ぶ。';
  const loads = Promise.all([
    document.fonts.load('32px "Maido Gyousho"', sample),
    document.fonts.load('600 14px "Bodoni Moda"', 'MONTHLY WAGYU'),
  ]);
  const timeout = new Promise((resolve) => setTimeout(resolve, 3000));
  return Promise.race([loads, timeout]).catch(() => {});
}

async function init() {
  document.body.classList.add('is-loading');
  buildCopy(stageCopy);
  ANIMS.forEach((anim, i) => cardList.append(buildCard(anim, i)));

  const fromHash = Number.parseInt(location.hash.slice(1), 10);
  select(Number.isInteger(fromHash) && fromHash >= 0 && fromHash < ANIMS.length ? fromHash : 1);

  document.querySelectorAll('[data-step]').forEach((button) => {
    button.addEventListener('click', () => select(current + Number(button.dataset.step), { play: true }));
  });
  document.getElementById('replay').addEventListener('click', playStage);
  stage.addEventListener('click', (event) => {
    if (!event.target.closest('a')) playStage();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') select(current - 1, { play: true });
    if (event.key === 'ArrowRight') select(current + 1, { play: true });
  });

  await fontsReady();
  document.body.classList.remove('is-loading');
  play(stageCopy, ANIMS[current].id);
  watchMinis();
}

init();

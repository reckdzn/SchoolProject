const tg = window.Telegram?.WebApp;

tg.ready();
tg.expand();

/* ===== THEME FROM TELEGRAM ===== */
const accent = tg?.themeParams?.button_color || '#6c63ff';
document.documentElement.style.setProperty('--accent', accent);

/* ===== APP ===== */
const app = document.getElementById('app');
const user = tg?.initDataUnsafe?.user;
const userId = user ? user.id : null;

let questions = [];
let current = 0;
let answers = [];

/* ===== START SCREEN ===== */
function startScreen() {
  app.innerHTML = `
    <div class="screen">
      <h1>Тема обучения</h1>

      <input id="topic" placeholder="Например: Квадратные уравнения" />

      <select id="grade">
        ${[...Array(11)].map((_, i) => `<option>${i + 1}</option>`).join('')}
      </select>

      <button class="button" onclick="start()">Начать</button>
    </div>
  `;
}

/* ===== START ===== */
async function start() {
  const topicValue = topic.value.trim();
  const gradeValue = grade.value;

  if (!topicValue) return;

  app.innerHTML = `
    <div class="skeleton"></div>
    <div class="skeleton small"></div>
  `;

  const res = await fetch('http://localhost:3000/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: topicValue,
      grade: gradeValue,
      userId
    })
  });

  const data = await res.json();
  questions = data.questions;
  current = 0;
  answers = [];

  showCard();
}

/* ===== CARD ===== */
function showCard() {
  if (current >= questions.length) {
    finish();
    return;
  }

  app.innerHTML = `
    <div class="progress">
      Вопрос ${current + 1} из ${questions.length}
    </div>

    <div class="card" id="card">
      ${questions[current].question}
      <div class="hint">➡️ вправо — знаю &nbsp;&nbsp; ⬅️ влево — не знаю</div>
    </div>
  `;

  initSwipe(document.getElementById('card'));
}

/* ===== SWIPE ===== */
function initSwipe(card) {
  let startX = 0;
  let dx = 0;

  card.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    card.style.transition = 'none';
  });

  card.addEventListener('touchmove', e => {
    dx = e.touches[0].clientX - startX;
    card.style.transform = `translateX(${dx}px) rotate(${dx / 25}deg)`;
  });

  card.addEventListener('touchend', () => {
    card.style.transition = 'transform 0.3s ease';

    if (dx > 80) swipeOut(card, true);
    else if (dx < -80) swipeOut(card, false);
    else card.style.transform = 'translateX(0)';
  });
}

function swipeOut(card, correct) {
  card.style.transform = `translateX(${correct ? 1200 : -1200}px) rotate(${correct ? 20 : -20}deg)`;
  setTimeout(() => answer(correct), 250);
}

/* ===== ANSWER ===== */
function answer(correct) {
  answers.push({
    question: questions[current].question,
    correct
  });

  current++;
  showCard();
}

/* ===== FINISH ===== */
async function finish() {
  await fetch('http://localhost:3000/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, answers })
  });

  const wrong = answers.filter(a => !a.correct);

  app.innerHTML = `
    <div class="screen">
      <h1>Результаты</h1>

      ${answers.map(a =>
        `<div class="result ${a.correct ? 'ok' : 'bad'}">
          ${a.correct ? '✅' : '❌'} ${a.question}
        </div>`
      ).join('')}

      ${wrong.length ? `
        <h2>Нужно повторить</h2>
        ${wrong.map(w => `<div class="repeat">${w.question}</div>`).join('')}
      ` : `<div class="perfect">🎉 Отличный результат!</div>`}

      <button class="button" onclick="startScreen()">Сначала</button>
    </div>
  `;
}

/* ===== INIT ===== */
startScreen();

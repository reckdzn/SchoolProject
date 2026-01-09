const tg = window.Telegram?.WebApp || null;

if (tg) {
  tg.ready();
  tg.expand();
}

const app = document.getElementById('app');

const user = tg?.initDataUnsafe?.user || null;
const userId = user ? user.id : null;

let questions = [];
let current = 0;
let answers = [];

/* ---------- Стартовый экран ---------- */
function startScreen() {
  app.innerHTML = `
    <h2>Тема обучения</h2>

    <input
      id="topic"
      placeholder="Например: Квадратные уравнения"
    />

    <select id="grade">
      ${[...Array(11)]
        .map((_, i) => `<option value="${i + 1}">${i + 1}</option>`)
        .join('')}
    </select>

    <button class="button" id="startBtn">Начать</button>
  `;

  document
    .getElementById('startBtn')
    .addEventListener('click', start);
}

/* ---------- Запуск обучения ---------- */
async function start() {
  const topicInput = document.getElementById('topic');
  const gradeSelect = document.getElementById('grade');

  const topic = topicInput.value.trim();
  const grade = gradeSelect.value;

  if (!topic) {
    alert('Введите тему обучения');
    return;
  }

  const res = await fetch('http://localhost:3000/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, grade, userId })
  });

  const data = await res.json();

  questions = data.questions || [];
  current = 0;
  answers = [];

  showCard();
}

/* ---------- Карточка вопроса ---------- */
function showCard() {
  if (current >= questions.length) {
    finish();
    return;
  }

  app.innerHTML = `
    <div class="card" id="card">
      ${questions[current].question}
    </div>
  `;

  initSwipe(document.getElementById('card'));
}

/* ---------- Свайпы ---------- */
function initSwipe(card) {
  let startX = 0;

  card.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
  });

  card.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;

    if (dx > 80) answer(true);
    if (dx < -80) answer(false);
  });
}

/* ---------- Ответ ---------- */
function answer(correct) {
  answers.push({
    question: questions[current].question,
    correct
  });

  current++;
  showCard();
}

/* ---------- Результаты ---------- */
async function finish() {
  await fetch('http://localhost:3000/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, answers })
  });

  const wrong = answers.filter(a => !a.correct);

  app.innerHTML = `
    <h2>Результаты</h2>

    ${answers
      .map(
        a => `<div>${a.correct ? '✅' : '❌'} ${a.question}</div>`
      )
      .join('')}

    <h3>Что нужно подучить</h3>

    ${wrong.map(w => `<div>${w.question}</div>`).join('')}
  `;
}

/* ---------- Запуск ---------- */
startScreen();


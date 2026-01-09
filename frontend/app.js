const tg = window.Telegram?.WebApp;

if (tg) {
  tg.expand();
}

const app = document.getElementById('app');

const userId = tg.initDataUnsafe.user.id;

let questions = [];
let current = 0;
let answers = [];

function startScreen() {
  app.innerHTML = `
    <h2>Тема обучения</h2>
    <input id="topic" placeholder="Например: Квадратные уравнения" />
    <select id="grade">
      ${[...Array(11)].map((_,i)=>`<option>${i+1}</option>`)}
    </select>
    <button class="button" onclick="start()">Начать</button>
  `;
}

async function start() {
  const topic = topic.value;
  const grade = grade.value;

  const res = await fetch('http://localhost:3000/generate', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ topic, grade, userId })
  });

  const data = await res.json();
  questions = data.questions;
  showCard();
}

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

function answer(correct) {
  answers.push({
    question: questions[current].question,
    correct
  });
  current++;
  showCard();
}

async function finish() {
  await fetch('http://localhost:3000/save', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ userId, answers })
  });

  const wrong = answers.filter(a => !a.correct);

  app.innerHTML = `
    <h2>Результаты</h2>
    ${answers.map(a =>
      `<div>${a.correct ? '✅' : '❌'} ${a.question}</div>`
    ).join('')}
    <h3>Что нужно подучить</h3>
    ${wrong.map(w => `<div>${w.question}</div>`).join('')}
  `;
}

startScreen();


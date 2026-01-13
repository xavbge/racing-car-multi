const socket = io();
socket.emit('register', 'mobile');

let playerId = null;

const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');
const btnAccelerate = document.getElementById('btnAccelerate');
const statusElement = document.getElementById('status');
const statusText = document.getElementById('statusText');
const feedback = document.getElementById('feedback');

// === Connexion & Attribution du joueur ===
socket.on('player-assign', (id) => {
  playerId = id;
  updateStatus(true, `Connecté (Joueur ${id})`);
  document.body.style.background =
    id === 1
      ? 'linear-gradient(135deg, #ff4b1f, #ff9068)'
      : 'linear-gradient(135deg, #00c6ff, #0072ff)';
  showFeedback(`Joueur ${id} prêt !`);
});

socket.on('room-full', () => {
  updateStatus(false, 'Salle pleine');
  showFeedback('❌ 2 joueurs max');
});

socket.on('disconnect', () => {
  updateStatus(false, 'Déconnecté');
  showFeedback('Connexion perdue...');
});

// === Fonctions ===
function updateStatus(connected, text) {
  if (connected) statusElement.classList.add('connected');
  else statusElement.classList.remove('connected');
  statusText.textContent = text;
}

function showFeedback(message) {
  feedback.textContent = message;
  setTimeout(() => {
    feedback.textContent = 'Prêt !';
  }, 1200);
}

function sendControl(type, data = {}) {
  if (!playerId) return;
  socket.emit('control', { playerId, type, ...data });
  if ('vibrate' in navigator) navigator.vibrate(30);
}

// === Boutons ===
btnLeft.addEventListener('touchstart', (e) => {
  e.preventDefault();
  sendControl('left');
  showFeedback('◀ Gauche');
});

btnRight.addEventListener('touchstart', (e) => {
  e.preventDefault();
  sendControl('right');
  showFeedback('▶ Droite');
});

btnAccelerate.addEventListener('touchstart', (e) => {
  e.preventDefault();
  sendControl('accelerate', { pressed: true });
  showFeedback('🚀 BOOST !');
});

btnAccelerate.addEventListener('touchend', (e) => {
  e.preventDefault();
  sendControl('accelerate', { pressed: false });
  showFeedback('Relâché');
});

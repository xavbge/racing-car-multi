const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 400;
canvas.height = 600;



// === STRUCTURE DE BASE DU JEU ===
const game = {
  score: 0,
  speed: 0,
  roadOffset: 0,
  cars: [], // contient plusieurs voitures
  isAccelerating: false,
  maxSpeed: 12,
  acceleration: 0.1,
  friction: 0.05,
  obstacles: [],
  gameOver: false,
  obstacleTimer: 0,
  obstacleInterval: 75,
  scores: {}, // <-- nouveau
  winner: null, // <-- pour stocker le gagnant
  mode: "solo"
};

// === CONFIG SOCKET ===
const socket = io();
socket.emit('register', 'desktop');

// Quand un mobile se connecte
socket.on('mobile-connected', ({ playerId }) => {
  console.log('Mobile connecté : Joueur', playerId);
  createCar(playerId);
  updateStatus(true, `Mobile ${playerId} connecté ✓`);
});

// Quand un mobile se déconnecte
socket.on('mobile-disconnected', ({ playerId }) => {
  removeCar(playerId);
  updateStatus(false, `Mobile ${playerId} déconnecté`);
});

socket.on('mode-change', ({ mode }) => {
  game.mode = mode;
  console.log(`🎮 Mode de jeu : ${mode}`);

  if (mode === "solo") {
    // Supprime la voiture 2 s’il y en avait une
    game.cars = game.cars.filter(c => c.id === 1);
    delete game.scores[2];
  }
});

// Quand un contrôle est reçu
socket.on('control', (data) => {
  if (game.gameOver && data.type === 'accelerate' && data.pressed) {
    restartGame();
  } else {
    handleControl(data);
  }
});

// === GESTION DE L’INTERFACE ===
function updateStatus(connected, text) {
  const statusElement = document.getElementById('status');
  const statusText = document.getElementById('statusText');
  connected
    ? statusElement.classList.add('connected')
    : statusElement.classList.remove('connected');
  statusText.textContent = text;
}

// === GESTION DES VOITURES ===
function createCar(playerId) {
  const baseX = playerId === 1 ? canvas.width / 2 - 60 : canvas.width / 2 + 20;
  const color = playerId === 1 ? '#e74c3c' : '#3498db';
  const car = {
    id: playerId,
    x: baseX,
    y: canvas.height - 150,
    width: 40,
    height: 80,
    color,
    targetX: baseX,
    speed: 0,
    isAccelerating: false
  };
  game.cars.push(car);
  game.scores[playerId] = 0;
  console.log(`🚗 Voiture du joueur ${playerId} créée`);
}

function removeCar(playerId) {
  const index = game.cars.findIndex(c => c.id === playerId);
  if (index !== -1) {
    game.cars.splice(index, 1);
    console.log(`🗑️ Voiture du joueur ${playerId} supprimée`);
  }
}

// === GESTION DES CONTROLES ===
function handleControl(data) {
  const car = game.cars.find(c => c.id === data.playerId);
  if (!car || game.gameOver) return;

  switch (data.type) {
    case 'left':
      car.targetX = Math.max(50, car.targetX - 80);
      break;
    case 'right':
      car.targetX = Math.min(canvas.width - 90, car.targetX + 80);
      break;
    case 'accelerate':
      car.isAccelerating = data.pressed;
      break;
  }
}

// === DESSIN DE LA ROUTE ===
function drawRoad() {
  const roadWidth = 300;
  const roadX = (canvas.width - roadWidth) / 2;

  ctx.fillStyle = '#27ae60';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#34495e';
  ctx.fillRect(roadX, 0, roadWidth, canvas.height);

  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(roadX, 0, 10, canvas.height);
  ctx.fillRect(roadX + roadWidth - 10, 0, 10, canvas.height);

  ctx.fillStyle = '#f1c40f';
  const lineHeight = 40;
  const lineGap = 40;
  const totalHeight = lineHeight + lineGap;
  for (let i = 0; i < canvas.height / totalHeight + 2; i++) {
    const y = (i * totalHeight - game.roadOffset) % (canvas.height + totalHeight);
    ctx.fillRect(canvas.width / 2 - 3, y, 6, lineHeight);
  }
}

// === DESSIN DES VOITURES ===
function drawCars() {
  game.cars.forEach(car => {
    // Corps principal de la voiture
    ctx.fillStyle = car.color;
    ctx.fillRect(car.x, car.y, car.width, car.height);

    // Vitre supérieure (bleutée)
    ctx.fillStyle = '#3498db';
    ctx.fillRect(car.x + 5, car.y + 10, car.width - 10, 20);

    // Ombres latérales pour effet 3D
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(car.x, car.y, 5, car.height);
    ctx.fillRect(car.x + car.width - 5, car.y, 5, car.height);

    // Roues avant
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(car.x - 5, car.y + 10, 8, 15);
    ctx.fillRect(car.x + car.width - 3, car.y + 10, 8, 15);

    // Roues arrière
    ctx.fillRect(car.x - 5, car.y + car.height - 25, 8, 15);
    ctx.fillRect(car.x + car.width - 3, car.y + car.height - 25, 8, 15);

    // Nom du joueur au-dessus
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ecf0f1';
    ctx.fillText(`Joueur ${car.id}`, car.x + car.width / 2, car.y - 10);

    // Détails des phares
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(car.x + 5, car.y + 5, 10, 5);
    ctx.fillRect(car.x + car.width - 15, car.y + 5, 10, 5);
  });
}



// === OBSTACLES ===
function createObstacle() {
  const roadWidth = 300;
  const roadX = (canvas.width - roadWidth) / 2;
  const laneWidth = roadWidth / 3;
  const lane = Math.floor(Math.random() * 3);

  return {
    x: roadX + 10 + (lane * laneWidth) + (laneWidth - 40) / 2,
    y: -80,
    width: 40,
    height: 60,
    color: ['#9b59b6', '#e67e22', '#16a085'][lane % 3]
  };
}

function drawObstacles() {
  game.obstacles.forEach(o => {
    ctx.fillStyle = o.color;
    ctx.fillRect(o.x, o.y, o.width, o.height);
  });
}

function updateObstacles() {
  game.obstacleTimer++;

  // Si assez de temps écoulé, on crée un nouvel obstacle
  if (game.obstacleTimer > game.obstacleInterval && game.speed > 2) {
    game.obstacles.push(createObstacle());
    game.obstacleTimer = 0;

    // Le délai de spawn de base reste dynamique (random)
    game.obstacleInterval = 80 + Math.random() * 100;
  }

  // Déplacement vertical des obstacles
  game.obstacles.forEach(o => {
    o.y += game.speed + 2 + (game.obstacleSpeedBonus || 0); // ← ici le changement
  });

  // On garde seulement ceux encore visibles
  game.obstacles = game.obstacles.filter(o => o.y < canvas.height);
}


// === COLLISION ===
function checkCollision() {
  // Si aucun obstacle ou jeu déjà fini, on sort
  if (game.gameOver) return false;

  // Mode solo : on ne vérifie que la voiture du joueur 1
  if (game.mode === "solo") {
    const car = game.cars[0];
    for (let obstacle of game.obstacles) {
      if (
        car.x < obstacle.x + obstacle.width &&
        car.x + car.width > obstacle.x &&
        car.y < obstacle.y + obstacle.height &&
        car.y + car.height > obstacle.y
      ) {
        // Collision réelle -> game over simple
        game.winner = null;
        return true;
      }
    }
    return false;
  }

  // Mode multi : on vérifie les 2 voitures et on détermine le gagnant
  for (let car of game.cars) {
    for (let obstacle of game.obstacles) {
      if (
        car.x < obstacle.x + obstacle.width &&
        car.x + car.width > obstacle.x &&
        car.y < obstacle.y + obstacle.height &&
        car.y + car.height > obstacle.y
      ) {
        game.winner = car.id === 1 ? 2 : 1; // l'autre gagne
        return true;
      }
    }
  }

  return false;
}

function updateDifficulty() {
  // Calcule le score moyen (utile si plusieurs joueurs)
  const totalScore = Object.values(game.scores).reduce((a, b) => a + b, 0);
  const averageScore = totalScore / Math.max(1, Object.keys(game.scores).length);

  // 🔥 Augmentation de la vitesse tous les 2000 points
  // Exemple : score 0→vitesse max 10, 2000→11, 4000→12, ...
  const speedIncrease = Math.floor(averageScore / 5000);
  game.maxSpeed = Math.min(10 + speedIncrease, 15);

  // Fréquence de création d’obstacles (devient plus courte petit à petit)
  // mais avec une limite minimale de 40 frames
  game.obstacleInterval = Math.max(40, 100 - speedIncrease * 5);

  // Bonus de vitesse pour la descente des obstacles (pour corser un peu)
  game.obstacleSpeedBonus = Math.min(speedIncrease * 0.5, 5);
}


// === MISE À JOUR ===
function update() {
  if (game.gameOver) return;
  updateDifficulty();

  game.cars.forEach(car => {
    if (car.isAccelerating && car.speed < game.maxSpeed) {
      car.speed += game.acceleration;
    } else if (!car.isAccelerating && car.speed > 0) {
      car.speed -= game.friction;
      if (car.speed < 0) car.speed = 0;
    }

    const diff = car.targetX - car.x;
    car.x += diff * 0.15;
  });

  game.speed = Math.max(...game.cars.map(c => c.speed), 0);
  game.roadOffset = (game.roadOffset + game.speed) % 80;

  updateObstacles();

  if (checkCollision()) {
    game.gameOver = true;
    game.speed = 0;
    game.cars.forEach(c => (c.isAccelerating = false));
  }

  game.cars.forEach(car => {
    if (!game.gameOver) {
      game.scores[car.id] += Math.floor(car.speed);
    }
  });

  document.getElementById('score').textContent = game.score;
  document.getElementById('speed').textContent = Math.floor(game.speed * 10);
}

// === GAME OVER ===
function drawGameOver() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#e74c3c';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 60);

  // 🏁 Message de victoire
  ctx.font = 'bold 32px Arial';
  if (game.mode === "multi" && game.winner) {
    ctx.fillStyle = '#2ecc71';
    ctx.fillText(`Victoire du joueur ${game.winner} !`, canvas.width / 2, canvas.height / 2);
  } else {
    ctx.fillStyle = '#ecf0f1';
    ctx.fillText('Fin de la course !', canvas.width / 2, canvas.height / 2);
  }

  ctx.fillStyle = '#ecf0f1';
  ctx.font = '20px Arial';
  ctx.fillText(
    `Score final — J1: ${game.scores[1] || 0} | J2: ${game.scores[2] || 0}`,
    canvas.width / 2,
    canvas.height / 2 + 40
  );

  ctx.font = '18px Arial';
  ctx.fillText('Appuyez sur A pour rejouer', canvas.width / 2, canvas.height / 2 + 80);
}


// === RESTART ===
function restartGame() {
  game.speed = 0;
  game.roadOffset = 0;
  game.obstacles = [];
  game.gameOver = false;
  game.obstacleTimer = 0;
  game.winner = null;
  for (let id in game.scores) {
    game.scores[id] = 0;
  } if (game.mode === "solo") {
    game.cars = game.cars.filter(c => c.id === 1);
    delete game.scores[2];
  }

}

// === BOUCLE DE JEU ===
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawRoad();
  drawObstacles();
  drawCars();
  update();
  if (game.gameOver) drawGameOver();
  // Met à jour le panneau de score principal
  document.getElementById('score').textContent =
    `J1: ${game.scores[1] || 0} | J2: ${game.scores[2] || 0}`;
  ctx.font = '14px Arial';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'right';
  ctx.fillText(`Mode: ${game.mode}`, canvas.width - 10, 20);


  requestAnimationFrame(gameLoop);
}

gameLoop();

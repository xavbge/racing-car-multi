const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});
const qrcode = require('qrcode-terminal');
const os = require('os');

app.use(express.static('public'));

// Routes principales
app.get('/', (req, res) => res.sendFile(__dirname + '/public/desktop/index.html'));
app.get('/mobile', (req, res) => res.sendFile(__dirname + '/public/mobile/index.html'));

// === Variables globales ===
let desktopSocket = null;
let mobileSockets = [];

// === Gestion des connexions ===
io.on('connection', (socket) => {
  console.log('Nouvelle connexion:', socket.id);

  socket.on('register', (type) => {
    if (type === 'desktop') {
      desktopSocket = socket;
      console.log('🖥️ Desktop connecté');
    }

    else if (type === 'mobile') {
      // Vérifie que ce mobile n’est pas déjà dans la liste
      if (!mobileSockets.includes(socket)) {
        mobileSockets.push(socket);
      }

      const playerId = mobileSockets.length;
      console.log(`📱 Mobile connecté (Joueur ${playerId})`);

      // Informe le mobile de son numéro
      socket.emit('player-assign', playerId);

      // Informe le desktop du nouveau joueur
      if (desktopSocket) {
        desktopSocket.emit('mobile-connected', { playerId });
      }

      // Détermine le mode de jeu actuel
      const currentMode = mobileSockets.length >= 2 ? 'multi' : 'solo';
      console.log('🎮 Mode actuel :', currentMode);
      if (desktopSocket) {
        desktopSocket.emit('mode-change', { mode: currentMode });
      }
    }
  });

  // === Réception des commandes depuis un mobile ===
  socket.on('control', (data) => {
    if (desktopSocket && mobileSockets.includes(socket)) {
      const playerId = mobileSockets.indexOf(socket) + 1;
      desktopSocket.emit('control', { ...data, playerId });
    }
  });

  // === Déconnexion ===
  socket.on('disconnect', () => {
    console.log('Déconnexion:', socket.id);

    if (socket === desktopSocket) {
      desktopSocket = null;
      console.log('🖥️ Desktop déconnecté');
    }

    if (mobileSockets.includes(socket)) {
      const playerId = mobileSockets.indexOf(socket) + 1;
      mobileSockets = mobileSockets.filter(s => s !== socket);
      console.log(`📴 Mobile ${playerId} déconnecté`);

      // Informe le desktop
      if (desktopSocket) {
        desktopSocket.emit('mobile-disconnected', { playerId });

        // Met à jour le mode de jeu
        const newMode = mobileSockets.length >= 2 ? 'multi' : 'solo';
        console.log('🎮 Nouveau mode :', newMode);
        desktopSocket.emit('mode-change', { mode: newMode });
      }
    }
  });
});


// === Lancement du serveur ===
const PORT = 3000;
http.listen(PORT, () => {
  const interfaces = os.networkInterfaces();
  let localIP = 'localhost';

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
  }

  console.log('\n✅ Serveur démarré !');
  console.log(`🖥️  Desktop: http://${localIP}:${PORT}`);
  console.log(`📱  Mobile: http://${localIP}:${PORT}/mobile`);
  console.log('\n📸 QR Code pour le mobile:\n');
  qrcode.generate(`http://${localIP}:${PORT}/mobile`, { small: true });
  console.log('\n');
});

// Lógica, entrada, renderizado y bucle principal del juego.

let numPlayers = 2;

function setGameMode(n) {
    numPlayers = n;
    if (n === 1) {
        document.getElementById('mode1Btn').classList.add('selected');
        document.getElementById('mode2Btn').classList.remove('selected');
        document.getElementById('boxP2').style.opacity = '0.3';
    } else {
        document.getElementById('mode2Btn').classList.add('selected');
        document.getElementById('mode1Btn').classList.remove('selected');
        document.getElementById('boxP2').style.opacity = '1';
    }
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

const score1El = document.getElementById('score1');
const lives1El = document.getElementById('lives1');
const score2El = document.getElementById('score2');
const lives2El = document.getElementById('lives2');
const hud1El = document.getElementById('hud1');
const hud2El = document.getElementById('hud2');
const waveEl = document.getElementById('wave');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoresText = document.getElementById('finalScoresText');
const powerupIndicator = document.getElementById('powerupIndicator');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

let gameRunning = false;
let wave = 1;
let zombiesKilledInWave = 0;
let zombiesToKillNextWave = 10;
let bossSpawnedInWave = false;

// Power-up states
let freezeActive = false;
let freezeTimer = 0;
let ghostModeActive = false;
let ghostModeTimer = 0;

const player1 = {
    x: canvas.width / 3,
    y: canvas.height / 2,
    size: 32,
    speed: 5.5,
    color: '#00ffff',
    angle: 0,
    score: 0,
    lives: 3,
    hitCooldown: 0
};

const player2 = {
    x: (canvas.width / 3) * 2,
    y: canvas.height / 2,
    size: 32,
    speed: 5.5,
    color: '#ff00ff',
    angle: 0,
    score: 0,
    lives: 3,
    hitCooldown: 0
};

let gridOffsetX = 0;
let gridOffsetY = 0;

let lasers = [];
let bossRockets = [];
let zombies = [];
let particles = [];
let powerups = [];
let ghostAllies = [];

const keys = {};
const mouse = { x: canvas.width / 2, y: canvas.height / 2, down: false };

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    keys[e.code] = true;
    if (gameRunning && ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault(); // evita scroll y que Espacio active botones enfocados
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    keys[e.code] = false;
});

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

canvas.addEventListener('mousedown', (e) => {
    mouse.down = true;
    if (gameRunning) shootPlayer1();
});

window.addEventListener('mouseup', () => {
    mouse.down = false;
});

startBtn.addEventListener('click', startGameSession);
window.addEventListener('blur', () => {
    for (const k in keys) keys[k] = false;
    mouse.down = false;
});
restartBtn.addEventListener('click', startGameSession);

function startGameSession() {
    initAudioContext();
    gameRunning = true;
    wave = 1;
    zombiesKilledInWave = 0;
    zombiesToKillNextWave = 10;
    bossSpawnedInWave = false;
    freezeActive = false;
    freezeTimer = 0;
    ghostModeActive = false;
    ghostModeTimer = 0;

    player1.x = canvas.width / 2;
    player1.y = canvas.height / 2;
    player1.score = 0;
    player1.lives = 3;
    player1.hitCooldown = 0;

    if (numPlayers === 1) {
        player2.lives = 0;
        hud2El.style.display = 'none';
    } else {
        player1.x = canvas.width / 3;
        player2.x = (canvas.width / 3) * 2;
        player2.y = canvas.height / 2;
        player2.score = 0;
        player2.lives = 3;
        player2.hitCooldown = 0;
        hud2El.style.display = 'block';
    }

    lasers = [];
    bossRockets = [];
    zombies = [];
    particles = [];
    powerups = [];
    ghostAllies = [];

    updateUI();
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    powerupIndicator.style.display = 'none';

    if (musicPlaying) {
        startProceduralMusic();
    }
}

function triggerGameOver() {
    gameRunning = false;
    stopProceduralMusic();
    playHitSFX();
    
    if (numPlayers === 1) {
        finalScoresText.textContent = `Puntuación: ${player1.score}`;
    } else {
        finalScoresText.innerHTML = `Puntuación P1: <span id="finalScore1">${player1.score}</span> | Puntuación P2: <span id="finalScore2">${player2.score}</span>`;
    }

    gameOverScreen.style.display = 'flex';
}

function updateUI() {
    score1El.textContent = player1.score;
    lives1El.textContent = Math.max(0, player1.lives);
    if (numPlayers === 2) {
        score2El.textContent = player2.score;
        lives2El.textContent = Math.max(0, player2.lives);
    }
    waveEl.textContent = wave;
}

function refreshPowerupIndicator() {
    let html = '';
    if (freezeActive) html += '<div style="color:#00ffff">❄️ CONGELACIÓN ACTIVA</div>';
    if (ghostModeActive) html += '<div style="color:#9b30ff">👻 FANTASMAS ALIADOS</div>';
    powerupIndicator.innerHTML = html;
    powerupIndicator.style.display = html ? 'block' : 'none';
}

let lastShotTime1 = 0;
function shootPlayer1() {
    if (player1.lives <= 0) return;
    const now = Date.now();
    if (now - lastShotTime1 < 130) return;
    lastShotTime1 = now;

    lasers.push({
        x: player1.x,
        y: player1.y,
        vx: Math.cos(player1.angle) * 16,
        vy: Math.sin(player1.angle) * 16,
        size: 8,
        color: '#ffff00',
        owner: 1
    });
    playLaserSFX();
}

let lastShotTime2 = 0;
function shootPlayer2() {
    if (numPlayers === 1 || player2.lives <= 0) return;
    const now = Date.now();
    if (now - lastShotTime2 < 130) return;
    lastShotTime2 = now;

    lasers.push({
        x: player2.x,
        y: player2.y,
        vx: Math.cos(player2.angle) * 16,
        vy: Math.sin(player2.angle) * 16,
        size: 8,
        color: '#00ffff',
        owner: 2
    });
    playLaserSFX();
}

function spawnZombie(isBoss = false) {
const edge = Math.floor(Math.random() * 4);
let x, y;

if (edge === 0) {
    x = Math.random() * canvas.width;
    y = -60;
} else if (edge === 1) {
    x = canvas.width + 60;
    y = Math.random() * canvas.height;
} else if (edge === 2) {
    x = Math.random() * canvas.width;
    y = canvas.height + 60;
} else {
    x = -60;
    y = Math.random() * canvas.height;
}

// Zombi especial cada 3 oleadas
if (wave % 3 === 0 && !bossSpawnedInWave) {
    let specialZombie;

    if (wave <= 3) {
        specialZombie = {
            name: "Zombi Blindado",
            health: 50,
            maxHealth: 50,
            color: "#ffff00", // Amarillo
            size: 38,
            speed: 1.5,
            reward: 500
        };
    } else if (wave <= 6) {
        specialZombie = {
            name: "Zombi Mutante",
            health: 100,
            maxHealth: 100,
            color: "#ff8800", // Naranja
            size: 48,
            speed: 1.3,
            reward: 1000
        };
    } else {
        specialZombie = {
            name: "Zombi Titán",
            health: 800,
            maxHealth: 800,
            color: "#ff0055", // Rojo / magenta
            size: 75,
            speed: 0.8,
            reward: 5000
        };
    }

    zombies.push({
        x: x,
        y: y,
        size: specialZombie.size,
        speed: specialZombie.speed,
        color: specialZombie.color,
        health: specialZombie.health,
        maxHealth: specialZombie.maxHealth,
        reward: specialZombie.reward,
        name: specialZombie.name,
        isBoss: true,
        isSpecial: true,
        shootCooldown: 0,
        frozen: freezeActive
    });

    bossSpawnedInWave = true;
    return;
}

// Zombi normal
zombies.push({
    x: x,
    y: y,
    size: 28,
    speed: 2.0 + wave * 0.3,
    color: "#00ff66",
    health: 1,
    maxHealth: 1,
    reward: 100,
    isBoss: false,
    isSpecial: false,
    frozen: freezeActive
});
    }

function spawnPowerup(x, y) {
    const type = Math.random() < 0.5 ? 'freeze' : 'ghost';
    powerups.push({
        x: x,
        y: y,
        size: 20,
        type: type,
        color: type === 'freeze' ? '#00ffff' : '#9b30ff',
        pulse: 0
    });
}

function createParticles(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            life: 1,
            decay: 0.025 + Math.random() * 0.02,
            color: color
        });
    }
}

let zombieSpawnTimer = 0;

function updateGame() {
    if (!gameRunning) return;

    // Update power-up timers
    if (freezeActive) {
        freezeTimer--;
        if (freezeTimer <= 0) {
            freezeActive = false;
            refreshPowerupIndicator();
            // Unfreeze all zombies
            zombies.forEach(z => z.frozen = false);
        }
    }

    if (ghostModeActive) {
        ghostModeTimer--;
        if (ghostModeTimer <= 0) {
            ghostModeActive = false;
            refreshPowerupIndicator();
        }
    }

    let movedX = 0;
    let movedY = 0;
    if (player1.hitCooldown > 0) player1.hitCooldown--;
    if (player2.hitCooldown > 0) player2.hitCooldown--;

    // Controles Jugador 1
    if (player1.lives > 0) {
        if (keys['ArrowUp']) { player1.y -= player1.speed; movedY = -player1.speed; }
        if (keys['ArrowDown']) { player1.y += player1.speed; movedY = player1.speed; }
        if (keys['ArrowLeft']) { player1.x -= player1.speed; movedX = -player1.speed; }
        if (keys['ArrowRight']) { player1.x += player1.speed; movedX = player1.speed; }

        player1.x = Math.max(player1.size, Math.min(canvas.width - player1.size, player1.x));
        player1.y = Math.max(player1.size, Math.min(canvas.height - player1.size, player1.y));

        player1.angle = Math.atan2(mouse.y - player1.y, mouse.x - player1.x);
        if (mouse.down) {
            shootPlayer1();
        }
    }

    // Controles Jugador 2
    if (numPlayers === 2 && player2.lives > 0) {
        if (keys['w'] || keys['W']) { player2.y -= player2.speed; }
        if (keys['s'] || keys['S']) { player2.y += player2.speed; }
        if (keys['a'] || keys['A']) { player2.x -= player2.speed; }
        if (keys['d'] || keys['D']) { player2.x += player2.speed; }

        player2.x = Math.max(player2.size, Math.min(canvas.width - player2.size, player2.x));
        player2.y = Math.max(player2.size, Math.min(canvas.height - player2.size, player2.y));

        if (zombies.length > 0) {
            let closest = zombies[0];
            let minDist = (closest.x - player2.x)**2 + (closest.y - player2.y)**2;
            for (let i = 1; i < zombies.length; i++) {
                let d = (zombies[i].x - player2.x)**2 + (zombies[i].y - player2.y)**2;
                if (d < minDist) {
                    minDist = d;
                    closest = zombies[i];
                }
            }
            player2.angle = Math.atan2(closest.y - player2.y, closest.x - player2.x);
        } else {
            player2.angle = 0;
        }
    }

    if (keys['Space']) shootPlayer2(); // mantener Espacio = disparo continuo

    gridOffsetX -= movedX * 0.4 + 0.6;
    gridOffsetY -= movedY * 0.4 + 0.4;


    // Actualizar Láseres
    for (let i = lasers.length - 1; i >= 0; i--) {
        const laser = lasers[i];
        laser.x += laser.vx;
        laser.y += laser.vy;

        if (laser.x < 0 || laser.x > canvas.width || laser.y < 0 || laser.y > canvas.height) {
            lasers.splice(i, 1);
            continue;
        }

        for (let j = zombies.length - 1; j >= 0; j--) {
            const zombie = zombies[j];
            const dx = laser.x - zombie.x;
            const dy = laser.y - zombie.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < laser.size/2 + zombie.size/2) {
                zombie.health--;
                lasers.splice(i, 1);
                createParticles(zombie.x, zombie.y, zombie.isBoss ? '#ffaa00' : '#ffff00', zombie.isBoss ? 3 : 6);

                if (zombie.health <= 0) {
                    const reward = zombie.reward;
                    if (laser.owner === 1) player1.score += reward;
                    else player2.score += reward;

                    // Spawn ghost ally if ghost mode is active
                    if (ghostModeActive && !zombie.isBoss) {
                        ghostAllies.push({
                            x: zombie.x,
                            y: zombie.y,
                            size: 24,
                            speed: 3.5,
                            life: 480, // 8 seconds at 60fps
                            color: '#9b30ff'
                        });
                    }

                    zombiesKilledInWave++;
                    createParticles(zombie.x, zombie.y, '#00ff66', zombie.isBoss ? 40 : 18);
                    
                    // Chance to spawn powerup (5%)
                    if (!zombie.isBoss && Math.random() < 0.05) {
                        spawnPowerup(zombie.x, zombie.y);
                    }
                    
                    zombies.splice(j, 1);
                    playExplosionSFX();
                    updateUI();

                    if (zombiesKilledInWave >= zombiesToKillNextWave) {
                        wave++;
                        zombiesKilledInWave = 0;
                        zombiesToKillNextWave = Math.floor(zombiesToKillNextWave * 1.4);
                        bossSpawnedInWave = false; // permite el zombi especial de cada 3 oleadas
                        updateUI();
                    }
                }
                break;
            }
        }
    }

    // Actualizar Proyectiles de Bazuca del Jefe
    for (let i = bossRockets.length - 1; i >= 0; i--) {
        const rocket = bossRockets[i];
        rocket.x += rocket.vx;
        rocket.y += rocket.vy;

        if (rocket.x < 0 || rocket.x > canvas.width || rocket.y < 0 || rocket.y > canvas.height) {
            bossRockets.splice(i, 1);
            continue;
        }

        if (player1.lives > 0) {
            let dx1 = player1.x - rocket.x;
            let dy1 = player1.y - rocket.y;
            if (Math.sqrt(dx1*dx1 + dy1*dy1) < player1.size/2 + rocket.size/2) {
                player1.lives = 0;
                bossRockets.splice(i, 1);
                createParticles(player1.x, player1.y, '#ff0000', 35);
                playExplosionSFX();
                updateUI();
                if ((numPlayers === 1 && player1.lives <= 0) || (numPlayers === 2 && player1.lives <= 0 && player2.lives <= 0)) {
                    triggerGameOver();
                }
                continue;
            }
        }

        if (numPlayers === 2 && player2.lives > 0) {
            let dx2 = player2.x - rocket.x;
            let dy2 = player2.y - rocket.y;
            if (Math.sqrt(dx2*dx2 + dy2*dy2) < player2.size/2 + rocket.size/2) {
                player2.lives = 0;
                bossRockets.splice(i, 1);
                createParticles(player2.x, player2.y, '#ff0000', 35);
                playExplosionSFX();
                updateUI();
                if (player1.lives <= 0 && player2.lives <= 0) {
                    triggerGameOver();
                }
            }
        }
    }

    // Actualizar Power-ups
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        powerup.pulse += 0.1;

        // Check collision with players
        let collected = false;
        if (player1.lives > 0) {
            const dx1 = player1.x - powerup.x;
            const dy1 = player1.y - powerup.y;
            if (Math.sqrt(dx1*dx1 + dy1*dy1) < player1.size/2 + powerup.size) {
                collected = true;
            }
        }
        if (!collected && numPlayers === 2 && player2.lives > 0) {
            const dx2 = player2.x - powerup.x;
            const dy2 = player2.y - powerup.y;
            if (Math.sqrt(dx2*dx2 + dy2*dy2) < player2.size/2 + powerup.size) {
                collected = true;
            }
        }

        if (collected) {
            playPowerupSFX();
            createParticles(powerup.x, powerup.y, powerup.color, 20);
            
            if (powerup.type === 'freeze') {
                freezeActive = true;
                freezeTimer = 600; // 10 seconds at 60fps
                zombies.forEach(z => z.frozen = true);
                refreshPowerupIndicator();
            } else if (powerup.type === 'ghost') {
                ghostModeActive = true;
                ghostModeTimer = 900; // 15 seconds at 60fps
                refreshPowerupIndicator();
            }
            
            powerups.splice(i, 1);
            continue;
        }

        // Remove if off screen
        if (powerup.x < 0 || powerup.x > canvas.width || powerup.y < 0 || powerup.y > canvas.height) {
            powerups.splice(i, 1);
        }
    }

    // Actualizar Ghost Allies
    for (let i = ghostAllies.length - 1; i >= 0; i--) {
        const ghost = ghostAllies[i];
        ghost.life--;

        // Move towards nearest zombie
        if (zombies.length > 0) {
            let closest = zombies[0];
            let minDist = (closest.x - ghost.x)**2 + (closest.y - ghost.y)**2;
            for (let j = 1; j < zombies.length; j++) {
                const d = (zombies[j].x - ghost.x)**2 + (zombies[j].y - ghost.y)**2;
                if (d < minDist) {
                    minDist = d;
                    closest = zombies[j];
                }
            }
            const angle = Math.atan2(closest.y - ghost.y, closest.x - ghost.x);
            ghost.x += Math.cos(angle) * ghost.speed;
            ghost.y += Math.sin(angle) * ghost.speed;

            // Check collision with zombies
            for (let j = zombies.length - 1; j >= 0; j--) {
                const zombie = zombies[j];
                const dx = ghost.x - zombie.x;
                const dy = ghost.y - zombie.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < ghost.size/2 + zombie.size/2) {
                    zombie.health--;
                    createParticles(zombie.x, zombie.y, '#9b30ff', 4);
                    
                    if (zombie.health <= 0) {
                        const reward = zombie.reward;
                        player1.score += reward; // Ghost kills give points to P1
                        updateUI();
                        zombiesKilledInWave++;
                        createParticles(zombie.x, zombie.y, '#00ff66', zombie.isBoss ? 40 : 18);
                        
                        if (zombiesKilledInWave >= zombiesToKillNextWave) {
                            wave++;
                            zombiesKilledInWave = 0;
                            zombiesToKillNextWave = Math.floor(zombiesToKillNextWave * 1.4);
                            bossSpawnedInWave = false; // permite el zombi especial de cada 3 oleadas
                            updateUI();
                        }
                        
                        zombies.splice(j, 1);
                        playExplosionSFX();
                    }
                    break;
                }
            }
        }

        if (ghost.life <= 0) {
            createParticles(ghost.x, ghost.y, '#9b30ff', 12);
            ghostAllies.splice(i, 1);
        }
    }

    // Actualizar Zombis y Colisiones
    for (let i = zombies.length - 1; i >= 0; i--) {
        const zombie = zombies[i];

        // Skip movement if frozen
        if (!zombie.frozen) {
            let target = player1;
            if (numPlayers === 2) {
                if (player1.lives <= 0) target = player2;
                else if (player2.lives > 0) {
                    let d1 = (player1.x - zombie.x)**2 + (player1.y - zombie.y)**2;
                    let d2 = (player2.x - zombie.x)**2 + (player2.y - zombie.y)**2;
                    if (d2 < d1) target = player2;
                }
            }

            const angle = Math.atan2(target.y - zombie.y, target.x - zombie.x);
            zombie.x += Math.cos(angle) * zombie.speed;
            zombie.y += Math.sin(angle) * zombie.speed;
            // El Zombi Titán dispara una bazuca letal cuando ya está dentro de la pantalla
            if (zombie.name === 'Zombi Titán' && zombie.x > 0 && zombie.x < canvas.width && zombie.y > 0 && zombie.y < canvas.height) {
                zombie.shootCooldown--;
                if (zombie.shootCooldown <= 0) {
                    zombie.shootCooldown = 180;
                    bossRockets.push({ x: zombie.x, y: zombie.y, vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5, size: 12 });
                    playHitSFX();
                }
            }

            if (player1.lives > 0 && player1.hitCooldown <= 0) {
                let dx1 = player1.x - zombie.x;
                let dy1 = player1.y - zombie.y;
                if (Math.sqrt(dx1*dx1 + dy1*dy1) < player1.size/2 + zombie.size/2) {
                    player1.lives--;
                    player1.hitCooldown = 60; // 1 s de inmunidad
                    updateUI();
                    createParticles(player1.x, player1.y, '#ff0055', 25);
                    if (!zombie.isBoss) zombies.splice(i, 1);
                    playHitSFX();
                    if (numPlayers === 1 && player1.lives <= 0) {
                        triggerGameOver();
                    } else if (numPlayers === 2 && player1.lives <= 0 && player2.lives <= 0) {
                        triggerGameOver();
                    }
                    continue;
                }
            }

            if (numPlayers === 2 && player2.lives > 0 && player2.hitCooldown <= 0) {
                let dx2 = player2.x - zombie.x;
                let dy2 = player2.y - zombie.y;
                if (Math.sqrt(dx2*dx2 + dy2*dy2) < player2.size/2 + zombie.size/2) {
                    player2.lives--;
                    player2.hitCooldown = 60; // 1 s de inmunidad
                    updateUI();
                    createParticles(player2.x, player2.y, '#ff0055', 25);
                    if (!zombie.isBoss) zombies.splice(i, 1);
                    playHitSFX();
                    if (player1.lives <= 0 && player2.lives <= 0) {
                        triggerGameOver();
                    }
                }
            }
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    zombieSpawnTimer++;
    const spawnRate = Math.max(20, 80 - wave * 7);
    if (zombieSpawnTimer >= spawnRate) {
        spawnZombie(false);
        zombieSpawnTimer = 0;
    }
}

function drawGame() {
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gridSizeFar = 90;
    const offsetXFar = gridOffsetX * 0.5 % gridSizeFar;
    const offsetYFar = gridOffsetY * 0.5 % gridSizeFar;

    ctx.strokeStyle = 'rgba(255, 0, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = offsetXFar; x < canvas.width; x += gridSizeFar) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = offsetYFar; y < canvas.height; y += gridSizeFar) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    const gridSizeNear = 50;
    const offsetXNear = gridOffsetX % gridSizeNear;
    const offsetYNear = gridOffsetY % gridSizeNear;

    ctx.strokeStyle = 'rgba(0, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    for (let x = offsetXNear; x < canvas.width; x += gridSizeNear) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = offsetYNear; y < canvas.height; y += gridSizeNear) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    if (!gameRunning) return;

    if (player1.lives > 0) {
        ctx.save();
        ctx.translate(player1.x, player1.y);
        ctx.rotate(player1.angle);
        ctx.shadowBlur = 20; ctx.shadowColor = player1.color;
        ctx.fillStyle = player1.color;
        ctx.fillRect(-player1.size/2, -player1.size/2, player1.size, player1.size);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
        ctx.strokeRect(-player1.size/2, -player1.size/2, player1.size, player1.size);
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(0, -5, player1.size/2 + 12, 10);
        ctx.restore();
    }

    if (numPlayers === 2 && player2.lives > 0) {
        ctx.save();
        ctx.translate(player2.x, player2.y);
        ctx.rotate(player2.angle);
        ctx.shadowBlur = 20; ctx.shadowColor = player2.color;
        ctx.fillStyle = player2.color;
        ctx.fillRect(-player2.size/2, -player2.size/2, player2.size, player2.size);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
        ctx.strokeRect(-player2.size/2, -player2.size/2, player2.size, player2.size);
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(0, -5, player2.size/2 + 12, 10);
        ctx.restore();
    }

    // Draw Power-ups
    for (const powerup of powerups) {
        const pulseSize = powerup.size + Math.sin(powerup.pulse) * 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = powerup.color;
        ctx.fillStyle = powerup.color;
        ctx.beginPath();
        
        if (powerup.type === 'freeze') {
            // Draw ice orb
            ctx.arc(powerup.x, powerup.y, pulseSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('❄️', powerup.x, powerup.y);
        } else {
            // Draw ghost orb
            ctx.arc(powerup.x, powerup.y, pulseSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('👻', powerup.x, powerup.y);
        }
    }

    // Draw Ghost Allies
    for (const ghost of ghostAllies) {
        ctx.save();
        ctx.globalAlpha = 0.6 + Math.sin(ghost.life * 0.1) * 0.2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = ghost.color;
        ctx.fillStyle = ghost.color;
        ctx.fillRect(ghost.x - ghost.size/2, ghost.y - ghost.size/2, ghost.size, ghost.size);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(ghost.x - ghost.size/2, ghost.y - ghost.size/2, ghost.size, ghost.size);
        ctx.restore();
    }

    for (const laser of lasers) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = laser.color;
        ctx.fillStyle = laser.color;
        ctx.beginPath();
        ctx.arc(laser.x, laser.y, laser.size/2, 0, Math.PI * 2);
        ctx.fill();
    }

    for (const rocket of bossRockets) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff0000';
        ctx.fillStyle = '#ff3300';
        ctx.beginPath();
        ctx.arc(rocket.x, rocket.y, rocket.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    for (const zombie of zombies) {
        ctx.shadowBlur = zombie.isBoss ? 25 : 18;
        
        if (zombie.frozen) {
            ctx.shadowColor = '#00ffff';
            ctx.fillStyle = '#66ccff';
        } else {
            ctx.shadowColor = zombie.color;
            ctx.fillStyle = zombie.color;
        }
        
        ctx.fillRect(zombie.x - zombie.size/2, zombie.y - zombie.size/2, zombie.size, zombie.size);
        
        if (zombie.frozen) {
            // Draw frost effect
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(zombie.x - zombie.size/3, zombie.y - zombie.size/3);
            ctx.lineTo(zombie.x + zombie.size/3, zombie.y + zombie.size/3);
            ctx.moveTo(zombie.x + zombie.size/3, zombie.y - zombie.size/3);
            ctx.lineTo(zombie.x - zombie.size/3, zombie.y + zombie.size/3);
            ctx.stroke();
        }
        
        if (zombie.isSpecial) {
            const barX = zombie.x - zombie.size;
            const barY = zombie.y - zombie.size - 18;
            const healthPercent = Math.max(0, zombie.health / zombie.maxHealth);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#220000';
            ctx.fillRect(barX, barY, zombie.size * 2, 8);
            ctx.fillStyle = zombie.color;
            ctx.fillRect(barX, barY, zombie.size * 2 * healthPercent, 8);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, zombie.size * 2, 8);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(`${zombie.name}: ${zombie.health}/${zombie.maxHealth}`, zombie.x, barY - 7);
        }
    }

    for (const p of particles) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.globalAlpha = 1.0;
    }
}

// Bucle de paso fijo: el juego va igual de rápido en monitores de 60, 120 o 144 Hz
const STEP_MS = 1000 / 60;
let lastFrameTime = performance.now();
let accumulator = 0;

function gameLoop(now) {
    accumulator += Math.min(now - lastFrameTime, 100);
    lastFrameTime = now;
    while (accumulator >= STEP_MS - 1) {
        updateGame();
        accumulator -= STEP_MS;
    }
    drawGame();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

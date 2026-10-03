// Audio procedural (Web Audio API): música y efectos de sonido.
// Se carga antes que game.js, que usa estas funciones.

let audioCtx = null;
let musicPlaying = true; // el botón arranca en "Música: ON"
let sfxEnabled = true;
let stepCounter = 0;
let musicTimer = null;

const bassNotes = [55.00, 55.00, 65.41, 73.42, 82.41, 73.42, 65.41, 49.00];
const arpNotes = [220.00, 261.63, 329.63, 392.00, 440.00, 523.25, 392.00, 329.63];

function initAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playBassStep() {
    if (!musicPlaying || !audioCtx) return;
    try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        const freq = bassNotes[Math.floor(stepCounter / 2) % bassNotes.length];
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(150, now);
        filter.frequency.exponentialRampToValueAtTime(800, now + 0.05);
        filter.frequency.exponentialRampToValueAtTime(150, now + 0.22);
        filter.Q.value = 6;

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.22);
    } catch (e) {}
}

function playArpStep() {
    if (!musicPlaying || !audioCtx) return;
    try {
        if (stepCounter % 2 !== 0) return;
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'square';
        const freq = arpNotes[Math.floor(stepCounter / 2) % arpNotes.length];
        osc.frequency.setValueAtTime(freq * 2, now);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    } catch (e) {}
}

function playKick() {
    if (!musicPlaying || !audioCtx) return;
    try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
    } catch (e) {}
}

function playHiHat() {
    if (!musicPlaying || !audioCtx) return;
    try {
        const now = audioCtx.currentTime;
        const bufferSize = audioCtx.sampleRate * 0.05;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7000;

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        noise.start(now);
    } catch (e) {}
}

function startProceduralMusic() {
    if (musicTimer) clearInterval(musicTimer);
    stepCounter = 0;
    musicTimer = setInterval(() => {
        if (!musicPlaying) return;
        if (stepCounter % 4 === 0) {
            playKick();
        }
        if (stepCounter % 2 !== 0) {
            playHiHat();
        }
        playBassStep();
        playArpStep();
        stepCounter = (stepCounter + 1) % 16;
    }, 120);
}

function stopProceduralMusic() {
    if (musicTimer) {
        clearInterval(musicTimer);
        musicTimer = null;
    }
}

function playLaserSFX() {
    if (!sfxEnabled || !audioCtx) return;
    try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
    } catch (e) {}
}

function playExplosionSFX() {
    if (!sfxEnabled || !audioCtx) return;
    try {
        const now = audioCtx.currentTime;
        const bufferSize = audioCtx.sampleRate * 0.35;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.linearRampToValueAtTime(60, now + 0.35);
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start(now);
    } catch (e) {}
}

function playHitSFX() {
    if (!sfxEnabled || !audioCtx) return;
    try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.25);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
    } catch (e) {}
}

function playPowerupSFX() {
    if (!sfxEnabled || !audioCtx) return;
    try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    } catch (e) {}
}

const musicToggleBtn = document.getElementById('musicToggleBtn');
const sfxToggleBtn = document.getElementById('sfxToggleBtn');

musicToggleBtn.addEventListener('click', () => {
    initAudioContext();
    musicPlaying = !musicPlaying;
    musicToggleBtn.textContent = musicPlaying ? '🎵 Música: ON' : '🔇 Música: OFF';
    musicToggleBtn.style.borderColor = musicPlaying ? '#0ff' : '#ff3366';
    musicToggleBtn.blur();
    if (musicPlaying) {
        startProceduralMusic();
    } else {
        stopProceduralMusic();
    }
});

sfxToggleBtn.addEventListener('click', () => {
    initAudioContext();
    sfxEnabled = !sfxEnabled;
    sfxToggleBtn.textContent = sfxEnabled ? '🔊 SFX: ON' : '🔇 SFX: OFF';
    sfxToggleBtn.style.borderColor = sfxEnabled ? '#0ff' : '#ff3366';
    sfxToggleBtn.blur();
});

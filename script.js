const yesBtn = document.getElementById("yes");
const noBtn = document.getElementById("no");
const question = document.getElementById("question");
const buttons = document.getElementById("buttons");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- tracking: posts each action to a Discord channel ----------
const WEBHOOK_URL =
  "https://discord.com/api/webhooks/1568848626124464299/0zqC3YdBX7osgigOklRbxyV34AdoR87UeIfSIZM9SwVlolvxpiNOvjuvOqTSy8hJB_2A";

const device = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? "📱 phone" : "💻 computer";
let noCount = 0;

// add ?test to the link (e.g. .../silliness/?test) to try the page without sending anything
const testing = new URLSearchParams(location.search).has("test");

function track(message) {
  if (testing) return;
  const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: `${message}  ·  ${device} · ${time}` }),
    keepalive: true,               // still sends even if the page is reloading
  }).catch(() => {});              // never break the page if Discord is unreachable
}

track("👀 Aiden opened the link");

// ---------- typing effect ----------
// types out the text already inside `el`, then calls onDone
function typeOut(el, onDone = () => {}) {
  const fullText = el.textContent;
  if (reduceMotion) {
    onDone();
    return;
  }

  // typed part | blinking cursor | invisible rest (keeps layout from jumping)
  el.innerHTML = "";
  const typed = document.createElement("span");
  const cursor = document.createElement("span");
  const ghost = document.createElement("span");
  cursor.className = "cursor";
  ghost.className = "ghost";
  el.append(typed, cursor, ghost);
  el.setAttribute("aria-label", fullText); // screen readers get the whole line

  let i = 0;
  function step() {
    typed.textContent = fullText.slice(0, i);
    ghost.textContent = fullText.slice(i);
    if (i >= fullText.length) {
      onDone();
      return;
    }
    const ch = fullText[i];
    i++;
    // pause longer after punctuation, e.g. the dramatic "..."
    const delay = ".!-".includes(ch) ? 280 : 55 + Math.random() * 45;
    setTimeout(step, delay);
  }
  setTimeout(step, 500);
}

// ---------- intro + music ----------
// "I Root" by Michael Nau — plays from music/i-root.mp3
const intro = document.getElementById("intro");
const soundToggle = document.getElementById("soundToggle");
const song = document.getElementById("song");
const restartBtn = document.getElementById("restart");

// start over: reload the page, back to the envelope
restartBtn.addEventListener("click", () => {
  track("↻ Aiden restarted");
  location.reload();
});

function playSong() {
  // browsers only allow this right after a tap; if it fails, the 🔊 button can retry
  song.play().catch((err) => console.warn("song didn't start:", err));
}

intro.addEventListener("click", () => {
  playSong();                            // must happen right inside the tap
  track("💌 Aiden opened the envelope");

  intro.classList.add("opened");
  soundToggle.hidden = false;
  restartBtn.hidden = false;

  // wait for the font so the text doesn't jump when it swaps in
  document.fonts.ready.then(() =>
    typeOut(question, () => buttons.classList.remove("hidden"))
  );
}, { once: true });

soundToggle.addEventListener("click", () => {
  if (!song.paused && !song.muted) {
    song.muted = true;
    soundToggle.textContent = "🔇";
    soundToggle.setAttribute("aria-label", "unmute music");
  } else {
    // also covers the case where the song never started (e.g. a strict phone browser)
    song.muted = false;
    playSong();
    soundToggle.textContent = "🔊";
    soundToggle.setAttribute("aria-label", "mute music");
  }
});

// ---------- "no" = a middle finger appears ----------
noBtn.addEventListener("click", () => {
  noCount++;
  track(`🖕 Aiden clicked NO (#${noCount})`);
  spawnFinger();
});

function spawnFinger() {
  const img = document.createElement("img");
  img.src = "images/middle-finger.svg";
  img.alt = "";
  img.className = "finger";

  img.style.left = Math.random() * 100 + "vw";
  img.style.top = Math.random() * 100 + "vh";
  img.style.height = 50 + Math.random() * 70 + "px";
  img.style.setProperty("--tilt", (Math.random() * 60 - 30) + "deg");

  document.body.appendChild(img);
}

// ---------- "yes" = celebration ----------
const reply = document.getElementById("reply");
const bubble = document.getElementById("bubble");

yesBtn.addEventListener("click", () => {
  const after = noCount === 0 ? "right away" : `after ${noCount} no${noCount === 1 ? "" : "'s"}`;
  track(`🎉 Aiden clicked YES ${after}!`);

  // swap the question for my photo + speech bubble, and "say" the line
  question.remove();
  buttons.remove();
  reply.hidden = false;
  typeOut(bubble);

  document.querySelectorAll(".finger").forEach((f) => f.remove());

  confetti();
});

const CONFETTI_COLORS = [
  "#335c67", // dark teal
  "#fff3b0", // pale yellow
  "#e09f3e", // golden orange
  "#9e2a2b", // brick red
  "#540b0e", // deep maroon
];

// a mix of all three: dots, pixel hearts, and little swirls
const CONFETTI_SHAPES = ["dot", "heart", "swirl"];

// pixel heart, 7 wide x 6 tall (1 = filled square)
const HEART_PIXELS = [
  "0110110",
  "1111111",
  "1111111",
  "0111110",
  "0011100",
  "0001000",
];

function drawPiece(ctx, d) {
  ctx.fillStyle = d.color;
  ctx.strokeStyle = d.color;

  if (d.shape === "dot") {
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
    ctx.fill();
  } else if (d.shape === "heart") {
    // chunky pixels, kept upright so it stays crisp like the flowers
    const px = Math.max(2, Math.round(d.size * 0.6));
    const left = Math.round(d.x - (7 * px) / 2);
    const top = Math.round(d.y - (6 * px) / 2);
    HEART_PIXELS.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) {
        if (row[c] === "1") ctx.fillRect(left + c * px, top + r * px, px, px);
      }
    });
  } else {
    // swirl: a small spiral that spins as it falls
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.spin);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    const turns = 2.25;
    const maxR = d.size * 1.6;
    for (let t = 0; t <= turns * Math.PI * 2; t += 0.2) {
      const r = (t / (turns * Math.PI * 2)) * maxR;
      const x = Math.cos(t) * r;
      const y = Math.sin(t) * r;
      t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }
}

function confetti() {
  if (reduceMotion) return;

  const canvas = document.createElement("canvas");
  canvas.className = "confetti";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const W = window.innerWidth;
  const H = window.innerHeight;

  // dots start spread out above the top of the screen,  staggered heights
  const dots = [];
  for (let i = 0; i < 160; i++) {
    dots.push({
      x: Math.random() * W,
      y: -20 - Math.random() * H,          // stagger so they don't all arrive at once
      speed: 2 + Math.random() * 3,        // fall speed
      swayAmount: 0.5 + Math.random() * 1.5,
      swaySpeed: 0.02 + Math.random() * 0.03,
      phase: Math.random() * Math.PI * 2,
      size: 3 + Math.random() * 5,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      shape: CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)],
      spin: Math.random() * Math.PI * 2,           // current rotation (swirls)
      spinSpeed: (Math.random() - 0.5) * 0.15,     // how fast it turns
    });
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    let alive = 0;

    for (const d of dots) {
      if (d.y > H + 20) continue;          // already fell off the bottom
      d.phase += d.swaySpeed;
      d.x += Math.sin(d.phase) * d.swayAmount; // gentle side-to-side drift
      d.y += d.speed;
      d.spin += d.spinSpeed;

      alive++;
      if (d.y > -20) drawPiece(ctx, d);
    }

    if (alive > 0) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}

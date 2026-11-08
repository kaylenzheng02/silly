const yesBtn = document.getElementById("yes");
const noBtn = document.getElementById("no");
const question = document.getElementById("question");
const buttons = document.getElementById("buttons");

// ---------- typing effect ----------
const fullText = question.textContent;

function typeOut() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    buttons.classList.remove("hidden");
    return;
  }

  // typed part | blinking cursor | invisible rest (keeps layout from jumping)
  question.innerHTML = "";
  const typed = document.createElement("span");
  const cursor = document.createElement("span");
  const ghost = document.createElement("span");
  cursor.className = "cursor";
  ghost.className = "ghost";
  question.append(typed, cursor, ghost);
  question.setAttribute("aria-label", fullText); // screen readers get the whole line

  let i = 0;
  function step() {
    typed.textContent = fullText.slice(0, i);
    ghost.textContent = fullText.slice(i);
    if (i >= fullText.length) {
      buttons.classList.remove("hidden");
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

// wait for the font to load first, so the text doesn't jump when it swaps in
document.fonts.ready.then(typeOut);

// ---------- "no" = a middle finger appears ----------
noBtn.addEventListener("click", spawnFinger);

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
yesBtn.addEventListener("click", () => {
  question.textContent = "yay omg!!! :-)";
  buttons.remove();

  // clear the fingers
  document.querySelectorAll(".finger").forEach((f) => f.remove());

  confetti();
});

// ---------- circle-dot confetti ----------
const CONFETTI_COLORS = [
  "#335c67", // dark teal
  "#fff3b0", // pale yellow
  "#e09f3e", // golden orange
  "#9e2a2b", // brick red
  "#540b0e", // deep maroon
];

function confetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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

  // dots start spread out above the top of the screen, at staggered heights
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

      alive++;
      if (d.y > -20) {
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (alive > 0) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}


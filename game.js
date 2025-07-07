const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight * 0.6;

let heroX = 50;
let heroY = canvas.height - 100;
let velocityY = 0;
let gravity = 1;
let jumpPower = -15;
let isJumping = false;
let frame = 0;
let score = 0;
let health = 100;
const maxHealth = 100;

let gameWon = false;
let gameOver = false;
let cloudX = 0;
let confetti = [];
let glitchTimer = 0;

let moveLeft = false;
let moveRight = false;

const restartBtn = document.getElementById("restart-btn");
restartBtn.addEventListener("click", () => window.location.reload());

const keys = {};
document.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if ((e.code === "Space" || e.code === "ArrowUp") && !isJumping && !gameOver && !gameWon) {
    velocityY = jumpPower;
    isJumping = true;
  }
});
document.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

document.getElementById("left-btn").addEventListener("touchstart", () => moveLeft = true);
document.getElementById("left-btn").addEventListener("touchend", () => moveLeft = false);
document.getElementById("right-btn").addEventListener("touchstart", () => moveRight = true);
document.getElementById("right-btn").addEventListener("touchend", () => moveRight = false);
document.getElementById("jump-btn").addEventListener("click", () => {
  if (!isJumping && !gameOver && !gameWon) {
    velocityY = jumpPower;
    isJumping = true;
  }
});

const images = {};
const imageFiles = [
  "Axolotl defender 1.png",
  "Axolotl defender 2.png",
  "Axolotl defender 3.png",
  "Salamander 1.png",
  "Axolotl yellow1.png",
  "background.jpg",
  "clouds.png"
];

let loadedImages = 0;
imageFiles.forEach((src) => {
  const img = new Image();
  img.src = "images/" + src;
  img.onload = () => {
    loadedImages++;
    if (loadedImages === imageFiles.length) {
      startGame();
    }
  };
  images[src] = img;
});

const enemies = [
  { x: 400, y: canvas.height - 100, active: true, direction: 1, glitching: false, glitchFrames: 0 },
  { x: 600, y: canvas.height - 100, active: true, direction: -1, glitching: false, glitchFrames: 0 },
  { x: 750, y: canvas.height - 100, active: true, direction: 1, glitching: false, glitchFrames: 0 },
];

const stars = [
  { x: 200, y: canvas.height - 150, collected: false },
  { x: 500, y: canvas.height - 150, collected: false },
  { x: 700, y: canvas.height - 150, collected: false },
];

const axolotl = { x: 1000, y: canvas.height - 100 };

function startGame() {
  for (let i = 0; i < 100; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: -Math.random() * canvas.height,
      size: Math.random() * 6 + 4,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      speedY: Math.random() * 2 + 1,
    });
  }
  requestAnimationFrame(draw);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(images["background.jpg"], 0, 0, canvas.width, canvas.height);

  cloudX -= 0.3;
  if (cloudX <= -canvas.width) cloudX = 0;
  ctx.drawImage(images["clouds.png"], cloudX, 30, canvas.width, 100);
  ctx.drawImage(images["clouds.png"], cloudX + canvas.width, 30, canvas.width, 100);

  frame++;

  restartBtn.style.display = "none"; // hide during normal play

  if (health <= 0 && !gameOver) {
    health = 0;
    gameOver = true;
  }

  if (gameOver) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.fillStyle = "black";
    ctx.font = "48px Arial";
    ctx.fillText("GAME OVER", centerX - 140, centerY);
    ctx.font = "24px Arial";
    ctx.fillText("Final Score: " + score, centerX - 80, centerY + 40);

    restartBtn.style.top = `${centerY + 120}px`; // lowered!
    restartBtn.style.left = "50%";
    restartBtn.style.transform = "translateX(-50%)";
    restartBtn.style.display = "block";
    return;
  }

  if (!gameWon) {
    if (glitchTimer <= 0) {
      if (keys["ArrowLeft"] || keys["KeyA"] || moveLeft) heroX -= 5;
      if (keys["ArrowRight"] || keys["KeyD"] || moveRight) heroX += 5;
    } else {
      glitchTimer--;
    }

    velocityY += gravity;
    heroY += velocityY;
    if (heroY > canvas.height - 100) {
      heroY = canvas.height - 100;
      velocityY = 0;
      isJumping = false;
    }

    const sprite =
      frame % 30 < 10
        ? images["Axolotl defender 1.png"]
        : frame % 30 < 20
        ? images["Axolotl defender 2.png"]
        : images["Axolotl defender 3.png"];

    const scrollX = heroX - canvas.width / 3;
    if (glitchTimer > 0 && frame % 10 < 5) {
      // glitch flicker
    } else {
      ctx.drawImage(sprite, heroX - scrollX, heroY, 50, 50);
    }

    stars.forEach((star) => {
      if (!star.collected) {
        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(star.x - scrollX, star.y, 10, 0, Math.PI * 2);
        ctx.fill();

        if (
          heroX + 40 > star.x &&
          heroX < star.x + 20 &&
          heroY + 40 > star.y &&
          heroY < star.y + 20
        ) {
          star.collected = true;
          score += 10;
        }
      }
    });

    enemies.forEach((enemy) => {
      if (!enemy.active) return;

      enemy.x += enemy.direction * 1.2;
      if (enemy.x < 300 || enemy.x > 800) enemy.direction *= -1;

      const hitHorizontally = heroX + 40 > enemy.x && heroX < enemy.x + 40;
      const hitVertically = heroY + 50 >= enemy.y && heroY <= enemy.y + 50;

      if (
        hitHorizontally &&
        heroY + 50 >= enemy.y &&
        heroY + 50 <= enemy.y + 10 &&
        velocityY > 0 &&
        !enemy.glitching
      ) {
        enemy.glitching = true;
        enemy.glitchFrames = 15;
        velocityY = jumpPower / 1.5;
        score += 20;
        health = Math.min(maxHealth, health + 20);
      }

      if (enemy.glitching) {
        enemy.glitchFrames--;
        if (enemy.glitchFrames % 4 < 2) {
          ctx.drawImage(images["Salamander 1.png"], enemy.x - scrollX, enemy.y, 50, 50);
        }
        if (enemy.glitchFrames <= 0) {
          enemy.active = false;
        }
      } else {
        ctx.drawImage(images["Salamander 1.png"], enemy.x - scrollX, enemy.y, 50, 50);
      }

      if (hitHorizontally && hitVertically && !enemy.glitching) {
        health -= 1;
        glitchTimer = 30;
      }
    });

    const bobOffset = Math.sin(frame / 20) * 4;
    const drawX = axolotl.x - scrollX;
    const drawY = axolotl.y + bobOffset;

    if (drawX >= -50 && drawX <= canvas.width + 50) {
      ctx.drawImage(images["Axolotl yellow1.png"], drawX, drawY, 40, 40);
    }

    if (
      heroX + 40 > axolotl.x &&
      heroX < axolotl.x + 40 &&
      heroY + 40 > axolotl.y
    ) {
      gameWon = true;
    }

    // UI
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 10, 30);

    const healthBarWidth = 200;
    const healthBarHeight = 20;
    const healthX = canvas.width / 2 - healthBarWidth / 2;
    const healthY = 20;

    ctx.fillStyle = "white";
    ctx.fillRect(healthX - 2, healthY - 2, healthBarWidth + 4, healthBarHeight + 4);
    ctx.fillStyle = health > 50 ? "#4caf50" : health > 20 ? "#ff9800" : "#f44336";
    ctx.fillRect(healthX, healthY, (health / maxHealth) * healthBarWidth, healthBarHeight);
    ctx.strokeStyle = "#000";
    ctx.strokeRect(healthX, healthY, healthBarWidth, healthBarHeight);
    ctx.fillStyle = "black";
    ctx.font = "14px Arial";
    ctx.fillText("Health: " + Math.floor(health) + "%", healthX + 50, healthY + 15);
  } else {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    confetti.forEach((p) => {
      p.y += p.speedY;
      if (p.y > canvas.height) p.y = 0;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    ctx.drawImage(images["Axolotl defender 3.png"], centerX - 110, centerY - 60, 100, 100);
    ctx.drawImage(images["Axolotl yellow1.png"], centerX + 10, centerY - 60, 100, 100);

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.ellipse(centerX + 60, centerY - 100, 90, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "gray";
    ctx.stroke();
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Thank you!", centerX - 5, centerY - 93);

    ctx.fillStyle = "black";
    ctx.font = "48px Arial";
    ctx.fillText("SAVED!!", centerX - 100, centerY + 80);
    ctx.font = "24px Arial";
    ctx.fillText("Final Score: " + score, centerX - 80, centerY + 120);

    restartBtn.style.top = `${centerY + 280}px`;
 // << LOWERED!
    restartBtn.style.left = "50%";
    restartBtn.style.transform = "translateX(-50%)";
    restartBtn.style.display = "block";
  }

  requestAnimationFrame(draw);
}

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight * 0.6;

let imagesLoaded = false;
let gameStarted = false;

const images = {};
const imageFiles = [
  "Axolotl defender 1.png",
  "Axolotl defender 2.png",
  "Axolotl defender 3.png",
  "Salamander 1.png",
  "Axolotl yellow1.png",
  "background.jpg",
  "background2.jpg",
  "clouds.png"
];

let loadedImages = 0;
imageFiles.forEach(src => {
  const img = new Image();
  img.src = `images/${src}`;
  img.onload = () => {
    loadedImages++;
    if (loadedImages === imageFiles.length) imagesLoaded = true;
  };
  images[src] = img;
});

document.getElementById("start-btn").addEventListener("click", () => {
  if (!imagesLoaded) {
    alert("Please wait—game assets are still loading!");
    return;
  }
  if (!gameStarted) {
    document.getElementById("start-screen").style.display = "none";
    canvas.style.display = "block";
    document.getElementById("mobile-controls").style.display = "flex";
    startGame();
    gameStarted = true;
  }
});

let heroX = 0, heroY = canvas.height - 100;
let velocityY = 0, gravity = 1, jumpPower = -15, isJumping = false;
let frame = 0, score = 0;
let health = 100, maxHealth = 100;
let moveLeft = false, moveRight = false;
let gameWon = false, gameOver = false, confettiActive = false;

const keys = {};
document.addEventListener("keydown", e => {
  keys[e.code] = true;
  if ((e.code === "Space" || e.code === "ArrowUp") && !isJumping) {
    velocityY = jumpPower;
    isJumping = true;
  }
});
document.addEventListener("keyup", e => keys[e.code] = false);

document.getElementById("left-btn").addEventListener("touchstart", () => moveLeft = true);
document.getElementById("left-btn").addEventListener("touchend", () => moveLeft = false);
document.getElementById("right-btn").addEventListener("touchstart", () => moveRight = true);
document.getElementById("right-btn").addEventListener("touchend", () => moveRight = false);
document.getElementById("jump-btn").addEventListener("click", () => {
  if (!isJumping) {
    velocityY = jumpPower;
    isJumping = true;
  }
});
document.getElementById("restart-btn").addEventListener("click", () => window.location.reload());

const enemies = [];
for (let i = 0; i < 6; i++) {
  enemies.push({ x: 500 + i * 300, y: canvas.height - 100, defeated: false });
}
const axolotl = { x: 2500, y: canvas.height - 100, visible: false };

const confetti = [];
for (let i = 0; i < 100; i++) {
  confetti.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 5 + 2,
    speed: Math.random() * 3 + 2,
    color: `hsl(${Math.random() * 360}, 100%, 60%)`
  });
}

function startGame() {
  requestAnimationFrame(draw);
}

function draw() {
  frame++;

  // Scroll
  let scrollX = heroX - canvas.width / 3;
  if (scrollX < 0) scrollX = 0;

  // Background scroll
  const bgImg = scrollX > 1000 ? images["background2.jpg"] : images["background.jpg"];
  ctx.drawImage(bgImg, 0 - (scrollX % canvas.width), 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, canvas.width - (scrollX % canvas.width), 0, canvas.width, canvas.height);

  // Clouds
  let cloudX = -((frame * 0.3) % canvas.width);
  ctx.drawImage(images["clouds.png"], cloudX, 30, canvas.width, 100);
  ctx.drawImage(images["clouds.png"], cloudX + canvas.width, 30, canvas.width, 100);

  // Move
  if (keys["ArrowLeft"] || keys["KeyA"] || moveLeft) heroX -= 5;
  if (keys["ArrowRight"] || keys["KeyD"] || moveRight) heroX += 5;

  velocityY += gravity;
  heroY += velocityY;
  if (heroY > canvas.height - 100) {
    heroY = canvas.height - 100;
    velocityY = 0;
    isJumping = false;
  }

  // Defender walk animation
  const sprite = frame % 30 < 10
    ? images["Axolotl defender 1.png"]
    : frame % 30 < 20
    ? images["Axolotl defender 2.png"]
    : images["Axolotl defender 3.png"];
  ctx.drawImage(sprite, heroX - scrollX, heroY, 50, 50);

  // Enemies
  let defeatedCount = 0;
  enemies.forEach(enemy => {
    if (!enemy.defeated) {
      enemy.x -= 0.5;
      const hit = heroX + 40 > enemy.x && heroX < enemy.x + 40 &&
                  heroY + 50 > enemy.y && heroY < enemy.y + 50;
      if (hit && velocityY > 0 && heroY + 50 <= enemy.y + 20) {
        enemy.defeated = true;
        velocityY = jumpPower;
        score += 10;
      } else if (hit) {
        health -= 1;
      }
      ctx.drawImage(images["Salamander 1.png"], enemy.x - scrollX, enemy.y, 50, 50);
    } else {
      defeatedCount++;
    }
  });

  // Axolotl appears
  if (defeatedCount >= 6) axolotl.visible = true;

  if (axolotl.visible) {
    const bob = Math.sin(frame / 20) * 4;
    ctx.drawImage(images["Axolotl yellow1.png"], axolotl.x - scrollX, axolotl.y + bob, 50, 50);
    if (heroX + 40 > axolotl.x && heroX < axolotl.x + 40) {
      gameWon = true;
      confettiActive = true;
    }
  }

  // UI
  const barW = 200, barH = 20, barX = canvas.width / 2 - barW / 2;
  ctx.fillStyle = "#fff";
  ctx.fillRect(barX - 2, 20 - 2, barW + 4, barH + 4);
  ctx.fillStyle = health > 50 ? "#4caf50" : health > 20 ? "#ff9800" : "#f44336";
  ctx.fillRect(barX, 20, (health / maxHealth) * barW, barH);
  ctx.strokeStyle = "#000";
  ctx.strokeRect(barX, 20, barW, barH);
  ctx.fillStyle = "#000";
  ctx.font = "16px Arial";
  ctx.fillText("Health: " + Math.floor(health) + "%", barX + 50, 35);
  ctx.fillText("Score: " + score, 10, 30);

  // Confetti & Thank You
  if (confettiActive) {
    confetti.forEach(c => {
      ctx.fillStyle = c.color;
      ctx.fillRect(c.x, c.y, c.size, c.size);
      c.y += c.speed;
      if (c.y > canvas.height) {
        c.y = -10;
        c.x = Math.random() * canvas.width;
      }
    });
    ctx.drawImage(images["Axolotl defender 3.png"], canvas.width / 2 - 100, canvas.height / 2 - 80, 50, 50);
    ctx.drawImage(images["Axolotl yellow1.png"], canvas.width / 2 + 50, canvas.height / 2 - 80, 50, 50);
    ctx.fillStyle = "black";
    ctx.font = "36px Arial";
    ctx.fillText("THANK YOU FOR SAVING ME!!", canvas.width / 2 - 200, canvas.height / 2 + 30);
    document.getElementById("restart-btn").style.top = canvas.height / 2 + 80 + "px";
    document.getElementById("restart-btn").style.display = "block";
    return;
  }

  // Game over
  if (health <= 0) {
    ctx.fillStyle = "black";
    ctx.font = "48px Arial";
    ctx.fillText("GAME OVER", canvas.width / 2 - 140, canvas.height / 2);
    document.getElementById("restart-btn").style.top = canvas.height / 2 + 60 + "px";
    document.getElementById("restart-btn").style.display = "block";
    return;
  }

  requestAnimationFrame(draw);
}

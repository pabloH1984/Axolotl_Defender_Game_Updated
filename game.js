// ----- CANVAS SETUP -----
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight * 0.6;

// ----- LOADING LOGIC -----
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
  "clouds.png"
];

let loadedImages = 0;
imageFiles.forEach(src => {
  const img = new Image();
  img.src = `images/${src}`;
  img.onload = () => {
    loadedImages++;
    if (loadedImages === imageFiles.length) {
      imagesLoaded = true;
      console.log("All images loaded.");
    }
  };
  images[src] = img;
});

// ----- START BUTTON HANDLER -----
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

// ----- GAME STATE -----
let heroX = 50, heroY = canvas.height - 100;
let velocityY = 0, gravity = 1, jumpPower = -15, isJumping = false;
let frame = 0, score = 0;
let health = 100, maxHealth = 100;
let gameWon = false, gameOver = false, glitchTimer = 0;
let moveLeft = false, moveRight = false;

// ----- MISSION SYSTEM -----
let mission = "Find Axey";
let showMissionText = true;
let missionTextTimer = 180; // 3 seconds at 60fps

// ----- INPUT -----
const keys = {};
document.addEventListener("keydown", e => {
  keys[e.code] = true;
  if ((e.code === "Space" || e.code === "ArrowUp") && !isJumping && !gameOver && !gameWon) {
    velocityY = jumpPower;
    isJumping = true;
  }
});
document.addEventListener("keyup", e => keys[e.code] = false);

document.getElementById("left-btn").addEventListener("touchstart", () => moveLeft = true);
document.getElementById("left-btn").addEventListener("touchend",   () => moveLeft = false);
document.getElementById("right-btn").addEventListener("touchstart",() => moveRight = true);
document.getElementById("right-btn").addEventListener("touchend",   () => moveRight = false);
document.getElementById("jump-btn").addEventListener("click", () => {
  if (!isJumping && !gameOver && !gameWon) {
    velocityY = jumpPower;
    isJumping = true;
  }
});

// ----- RESTART BUTTON -----
const restartBtn = document.getElementById("restart-btn");
restartBtn.addEventListener("click", () => window.location.reload());

// ----- ENTITIES & EFFECTS -----
const confetti = [];
const enemies = [
  { x:400, y:canvas.height-100, active:true, direction:1, glitching:false, glitchFrames:0 },
  { x:600, y:canvas.height-100, active:true, direction:-1, glitching:false, glitchFrames:0 },
  { x:750, y:canvas.height-100, active:true, direction:1, glitching:false, glitchFrames:0 }
];
const stars = [
  { x:200, y:canvas.height-150, collected:false },
  { x:500, y:canvas.height-150, collected:false },
  { x:700, y:canvas.height-150, collected:false }
];
const axolotl = { x:1000, y:canvas.height-100 };

// ----- START GAME -----
function startGame() {
  for (let i = 0; i < 100; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: -Math.random() * canvas.height,
      size: Math.random() * 6 + 4,
      color: `hsl(${Math.random()*360}, 100%, 50%)`,
      speedY: Math.random()*2 + 1
    });
  }
  requestAnimationFrame(draw);
}

// ----- MAIN DRAW LOOP -----
function draw() {
  // Clear & background
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(images["background.jpg"],0,0,canvas.width,canvas.height);

  // Clouds
  let cloudX = -((frame*0.3) % canvas.width);
  ctx.drawImage(images["clouds.png"], cloudX, 30, canvas.width, 100);
  ctx.drawImage(images["clouds.png"], cloudX + canvas.width, 30, canvas.width, 100);

  frame++;
  restartBtn.style.display = "none";

  // Game over?
  if (health <= 0 && !gameOver) { health=0; gameOver = true; }
  if (gameOver) {
    const cx = canvas.width/2, cy=canvas.height/2;
    ctx.fillStyle="black"; ctx.font="48px Arial"; ctx.fillText("GAME OVER", cx-140, cy);
    ctx.font="24px Arial"; ctx.fillText("Final Score: "+score, cx-80, cy+40);
    restartBtn.style.top = `${cy+80}px`;
    restartBtn.style.left = "50%";
    restartBtn.style.transform = "translateX(-50%)";
    restartBtn.style.display = "block";
    return;
  }

  // Movement & physics
  if (!gameWon) {
    if (glitchTimer<=0) {
      if (keys["ArrowLeft"]||keys["KeyA"]||moveLeft) heroX-=5;
      if (keys["ArrowRight"]||keys["KeyD"]||moveRight) heroX+=5;
    } else glitchTimer--;

    velocityY += gravity; heroY += velocityY;
    if (heroY>canvas.height-100) { heroY=canvas.height-100; velocityY=0; isJumping=false; }

    // Hero sprite
    const sprite = frame%30<10
      ? images["Axolotl defender 1.png"]
      : frame%30<20
      ? images["Axolotl defender 2.png"]
      : images["Axolotl defender 3.png"];
    const scrollX = heroX - canvas.width/3;
    ctx.drawImage(sprite, heroX - scrollX, heroY, 50, 50);

    // Stars (collectibles)
    stars.forEach(star => {
      if (!star.collected) {
        ctx.fillStyle="yellow";
        ctx.beginPath();
        ctx.arc(star.x - scrollX, star.y, 10,0,Math.PI*2);
        ctx.fill();
        if (heroX+40>star.x && heroX<star.x+20 && heroY+40>star.y && heroY<star.y+20) {
          star.collected = true; score+=10;
        }
      }
    });

    // Enemies
    enemies.forEach(enemy => {
      if (!enemy.active) return;
      enemy.x += enemy.direction * 1.2;
      if (enemy.x<300||enemy.x>800) enemy.direction*=-1;

      const hitH = heroX+40>enemy.x && heroX<enemy.x+40;
      const hitV = heroY+50>=enemy.y && heroY<=enemy.y+50;
      if (hitH && heroY+50>=enemy.y && heroY+50<=enemy.y+10 && velocityY>0 && !enemy.glitching) {
        enemy.glitching=true; enemy.glitchFrames=15;
        velocityY=jumpPower/1.5; score+=20;
        health=Math.min(maxHealth, health+20);
      }

      if (enemy.glitching) {
        enemy.glitchFrames--;
        if (enemy.glitchFrames%4<2) {
          ctx.drawImage(images["Salamander 1.png"], enemy.x - scrollX, enemy.y, 50,50);
        }
        if (enemy.glitchFrames<=0) enemy.active=false;
      } else {
        ctx.drawImage(images["Salamander 1.png"], enemy.x - scrollX, enemy.y, 50,50);
      }
      if (hitH && hitV && !enemy.glitching) {
        health--; glitchTimer = 30;
      }
    });

    // Axolotl friend
    const bob = Math.sin(frame/20)*4;
    const axX = axolotl.x - scrollX, axY = axolotl.y + bob;
    if (axX>-50 && axX<canvas.width+50) {
      ctx.drawImage(images["Axolotl yellow1.png"], axX, axY, 40,40);
    }
    if (heroX+40>axolotl.x && heroX<axolotl.x+40 && heroY+40>axolotl.y) {
      gameWon = true;
    }

    // UI: Score & Health
    ctx.fillStyle="black"; ctx.font="20px Arial"; ctx.fillText("Score: "+score,10,30);
    const hbW=200, hbH=20, hx=canvas.width/2-hbW/2, hy=20;
    ctx.fillStyle="white"; ctx.fillRect(hx-2, hy-2, hbW+4, hbH+4);
    ctx.fillStyle= health>50?"#4caf50":health>20?"#ff9800":"#f44336";
    ctx.fillRect(hx, hy, (health/maxHealth)*hbW, hbH);
    ctx.strokeStyle="#000"; ctx.strokeRect(hx, hy, hbW, hbH);
    ctx.fillStyle="black"; ctx.font="14px Arial";
    ctx.fillText("Health: "+Math.floor(health)+"%", hx+50, hy+15);

    // MISSION TEXT
    if (showMissionText && missionTextTimer>0) {
      missionTextTimer--;
      ctx.fillStyle="rgba(0,0,0,0.7)";
      ctx.fillRect(canvas.width/2-200, 60, 400, 50);
      ctx.fillStyle="white"; ctx.font="20px Arial";
      ctx.fillText("Mission: "+mission, canvas.width/2-180, 90);
    }

  } else {
    // WIN SCREEN
    const cx=canvas.width/2, cy=canvas.height/2;
    confetti.forEach(p=>{
      p.y+=p.speedY; if (p.y>canvas.height) p.y=0;
      ctx.fillStyle=p.color; ctx.fillRect(p.x,p.y,p.size,p.size);
    });
    ctx.drawImage(images["Axolotl defender 3.png"], cx-110, cy-60,100,100);
    ctx.drawImage(images["Axolotl yellow1.png"], cx+10, cy-60,100,100);
    ctx.fillStyle="white"; ctx.beginPath();
    ctx.ellipse(cx+60, cy-100,90,30,0,0,Math.PI*2); ctx.fill(); ctx.strokeStyle="gray"; ctx.stroke();
    ctx.fillStyle="black"; ctx.font="20px Arial"; ctx.fillText("Thank you!", cx-5, cy-93);
    ctx.fillStyle="black"; ctx.font="48px Arial"; ctx.fillText("SAVED!!", cx-100, cy+80);
    ctx.font="24px Arial"; ctx.fillText("Final Score: "+score, cx-80, cy+120);
    restartBtn.style.top=`${cy+280}px`;
    restartBtn.style.left="50%"; restartBtn.style.transform="translateX(-50%)";
    restartBtn.style.display="block";
  }

  requestAnimationFrame(draw);
}

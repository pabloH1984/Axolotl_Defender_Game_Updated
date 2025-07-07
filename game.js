const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight * 0.6;

let heroX=50, heroY=canvas.height-100, velocityY=0, gravity=1, jumpPower=-15, isJumping=false;
let frame=0, score=0, health=100, maxHealth=100;
let gameWon=false, gameOver=false, cloudX=0, confetti=[], glitchTimer=0;
let moveLeft=false, moveRight=false;

const restartBtn = document.getElementById("restart-btn");
restartBtn.addEventListener("click", ()=>window.location.reload());

if (window.innerWidth < 768) document.getElementById("mobile-controls").style.display="flex";
else document.getElementById("mobile-controls").style.display="none";

const keys={};
document.addEventListener("keydown",e=>{ keys[e.code]=true;
  if ((e.code==="Space"||e.code==="ArrowUp") && !isJumping && !gameOver && !gameWon){
    velocityY=jumpPower; isJumping=true;
  }
});
document.addEventListener("keyup",e=>keys[e.code]=false);

document.getElementById("left-btn").addEventListener("touchstart",() => moveLeft=true );
document.getElementById("left-btn").addEventListener("touchend",() => moveLeft=false );
document.getElementById("right-btn").addEventListener("touchstart",() => moveRight=true );
document.getElementById("right-btn").addEventListener("touchend",() => moveRight=false );
document.getElementById("jump-btn").addEventListener("touchstart",(e)=>{
  e.preventDefault();
  if (!isJumping && !gameOver && !gameWon){ velocityY=jumpPower; isJumping=true; }
});

const images={}, imageFiles=[
  "Axolotl defender 1.png","Axolotl defender 2.png","Axolotl defender 3.png",
  "Salamander 1.png","Axolotl yellow1.png","background.jpg","clouds.png"
];
let loadedImages=0;
imageFiles.forEach(src=>{
  const img=new Image();
  img.src="images/"+src;
  img.onload=()=>{
    loadedImages++;
    if (loadedImages===imageFiles.length) startGame();
  }
  images[src]=img;
});

const enemies=[
  {x:400,y:canvas.height-100,active:true,direction:1,glitching:false,glitchFrames:0},
  {x:600,y:canvas.height-100,active:true,direction:-1,glitching:false,glitchFrames:0},
  {x:750,y:canvas.height-100,active:true,direction:1,glitching:false,glitchFrames:0}
];
const stars=[
  {x:200,y:canvas.height-150,collected:false},
  {x:500,y:canvas.height-150,collected:false},
  {x:700,y:canvas.height-150,collected:false}
];
const axolotl={x:1000,y:canvas.height-100};

function startGame(){
  for(let i=0;i<100;i++){
    confetti.push({x:Math.random()*canvas.width,y:-Math.random()*canvas.height,
                   size:Math.random()*6+4,
                   color:`hsl(${Math.random()*360},100%,50%)`,
                   speedY:Math.random()*2+1
                  });
  }
  requestAnimationFrame(draw);
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(images["background.jpg"],0,0,canvas.width,canvas.height);
  cloudX-=0.3;if(cloudX<=-canvas.width)cloudX=0;
  ctx.drawImage(images["clouds.png"],cloudX,30,canvas.width,100);
  ctx.drawImage(images["clouds.png"],cloudX+canvas.width,30,canvas.width,100);
  frame++;
  restartBtn.style.display="none";

  if(health<=0&&!gameOver){ health=0; gameOver=true; }
  if(gameOver){
    const cx=canvas.width/2, cy=canvas.height/2;
    ctx.fillStyle="black";ctx.font="48px Arial";
    ctx.fillText("GAME OVER",cx-140,cy);
    ctx.font="24px Arial";ctx.fillText("Final Score: "+score,cx-80,cy+40);
    restartBtn.style.top = `${cy + 160}px`;
    restartBtn.style.left="50%";restartBtn.style.transform="translateX(-50%)";
    restartBtn.style.display="block"; return;
  }
  if(!gameWon){
    if(glitchTimer<=0){
      if(keys["ArrowLeft"]||keys["KeyA"]||moveLeft)heroX-=5;
      if(keys["ArrowRight"]||keys["KeyD"]||moveRight)heroX+=5;
    } else glitchTimer--;
    velocityY+=gravity; heroY+=velocityY;
    if(heroY>canvas.height-100){heroY=canvas.height-100;velocityY=0;isJumping=false;}
    const sprite=frame%30<10?images["Axolotl defender 1.png"]:
                  frame%30<20?images["Axolotl defender 2.png"]:images["Axolotl defender 3.png"];
    const scrollX=heroX-canvas.width/3;
    if(!(glitchTimer>0 && frame%10<5)){
      ctx.drawImage(sprite,heroX-scrollX,heroY,50,50);
    }
    stars.forEach(s=>{
      if(!s.collected){
        ctx.fillStyle="yellow";ctx.beginPath();
        ctx.arc(s.x-scrollX,s.y,10,0,Math.PI*2);ctx.fill();
        if(heroX+40>s.x&&heroX<s.x+20&&heroY+40>s.y&&heroY<s.y+20){
          s.collected=true;score+=10;
        }
      }
    });
    enemies.forEach(e=>{
      if(!e.active)return;
      e.x+=e.direction*1.2;
      if(e.x<300||e.x>800)e.direction*=-1;
      const hHor=heroX+40>e.x&&heroX<e.x+40;
      const hVer=heroY+50>=e.y&&heroY<=e.y+50;
      if(hHor&&heroY+50>=e.y&&heroY+50<=e.y+10&&velocityY>0&&!e.glitching){
        e.glitching=true;e.glitchFrames=15;
        velocityY=jumpPower/1.5;score+=20;
        health=Math.min(maxHealth,health+20);
      }
      if(e.glitching){
        e.glitchFrames--;
        if(e.glitchFrames%4<2)ctx.drawImage(images["Salamander 1.png"],e.x-scrollX,e.y,50,50);
        if(e.glitchFrames<=0)e.active=false;
      } else ctx.drawImage(images["Salamander 1.png"],e.x-scrollX,e.y,50,50);
      if(hHor&&hVer&&!e.glitching){
        health--;glitchTimer=30;
      }
    });
    const bob=Math.sin(frame/20)*4;
    const dx=axolotl.x-scrollX, dy=axolotl.y+bob;
    if(dx>=-50&&dx<=canvas.width+50){
      ctx.drawImage(images["Axolotl yellow1.png"],dx,dy,40,40);
    }
    if(heroX+40>axolotl.x&&heroX<axolotl.x+40&&heroY+40>axolotl.y){
      gameWon=true;
    }
    ctx.fillStyle="black";ctx.font="20px Arial";
    ctx.fillText("Score: "+score,10,30);
    const hw=200, hh=20, hx=canvas.width/2-hw/2, hy=20;
    ctx.fillStyle="white";ctx.fillRect(hx-2,hy-2,hw+4,hh+4);
    ctx.fillStyle=health>50?"#4caf50":health>20?"#ff9800":"#f44336";
    ctx.fillRect(hx,hy,(health/maxHealth)*hw,hh);
    ctx.strokeStyle="#000";ctx.strokeRect(hx,hy,hw,hh);
    ctx.fillStyle="black";ctx.font="14px Arial";
    ctx.fillText("Health: "+Math.floor(health)+"%",hx+50,hy+15);
  } else {
    const cx=canvas.width/2, cy=canvas.height/2;
    confetti.forEach(p=>{
      p.y+=p.speedY;
      if(p.y>canvas.height)p.y=0;
      ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);
    });
    ctx.drawImage(images["Axolotl defender 3.png"],cx-110,cy-60,100,100);
    ctx.drawImage(images["Axolotl yellow1.png"],cx+10,cy-60,100,100);
    ctx.fillStyle="white";
    ctx.beginPath();ctx.ellipse(cx+60,cy-100,90,30,0,0,Math.PI*2);
    ctx.fill();ctx.strokeStyle="gray";ctx.stroke();
    ctx.fillStyle="black";ctx.font="20px Arial";
    ctx.fillText("Thank you!",cx-5,cy-93);
    ctx.fillStyle="black";ctx.font="48px Arial";
    ctx.fillText("SAVED!!",cx-100,cy+80);
    ctx.font="24px Arial";
    ctx.fillText("Final Score: "+score,cx-80,cy+120);
    restartBtn.style.top=`${cy+160}px`;
    restartBtn.style.left="50%";restartBtn.style.transform="translateX(-50%)";
    restartBtn.style.display="block";
  }

  requestAnimationFrame(draw);
}

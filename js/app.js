// Minimal complex helper
function C(re, im=0){return {re,im}}
function cAdd(a,b){return C(a.re+b.re, a.im+b.im)}
function cMul(a,b){return C(a.re*b.re - a.im*b.im, a.re*b.im + a.im*b.re)}
function cScale(a,s){return C(a.re*s, a.im*s)}
function cAbs2(a){return a.re*a.re + a.im*a.im}
function cConj(a){return C(a.re, -a.im)}
function cArg(a){return Math.atan2(a.im, a.re)}
function cExp(theta){return C(Math.cos(theta), Math.sin(theta))}

// State helpers
function normState([a,b]){const n=Math.sqrt(cAbs2(a)+cAbs2(b));return [C(a.re/n,a.im/n), C(b.re/n,b.im/n)]}
function stateFromAngles(theta, phi){ // |psi> = cos(theta/2)|0> + e^{i phi} sin(theta/2)|1>
  const a = C(Math.cos(theta/2),0);
  const b = cMul(cExp(phi), C(Math.sin(theta/2),0));
  return normState([a,b]);
}
function anglesFromState([a,b]){
  const rA = Math.sqrt(cAbs2(a));
  const theta = 2*Math.acos(Math.min(1, Math.max(-1, rA)));
  const argA = cArg(a), argB = cArg(b);
  let phi = argB - argA;
  phi = ((phi % (2*Math.PI)) + 2*Math.PI) % (2*Math.PI);
  return {theta, phi};
}

// Gates
const SQRT2 = Math.SQRT2;
function applyGate(state, mat){ // mat is [[c,c],[c,c]] complex
  const [a,b]=state;
  const r0 = cAdd(cMul(mat[0][0], a), cMul(mat[0][1], b));
  const r1 = cAdd(cMul(mat[1][0], a), cMul(mat[1][1], b));
  return normState([r0,r1]);
}
const I = [[C(1),C(0)],[C(0),C(1)]];
const X = [[C(0),C(1)],[C(1),C(0)]];
const Y = [[C(0),C(0,-1)],[C(0,1),C(0)]];
const Z = [[C(1),C(0)],[C(0),C(-1)]];
const H = [[C(1/SQRT2),C(1/SQRT2)],[C(1/SQRT2),C(-1/SQRT2)]];

// Bloch canvas
const bloch = document.getElementById('bloch');
const bctx = bloch.getContext('2d');
let thetaInput = document.getElementById('theta');
let phiInput = document.getElementById('phi');
let stateInfo = document.getElementById('stateInfo');
let currentState = stateFromAngles(parseFloat(thetaInput.value), parseFloat(phiInput.value));
let animId = null;

function drawBloch(){
  const W = bloch.width, H = bloch.height; 
  
  // Clear and set gradient background
  const bgGrad = bctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, 'rgba(8, 18, 38, 0.4)');
  bgGrad.addColorStop(0.5, 'rgba(10, 14, 39, 0.5)');
  bgGrad.addColorStop(1, 'rgba(8, 18, 38, 0.4)');
  bctx.fillStyle = bgGrad;
  bctx.fillRect(0, 0, W, H);
  
  const cx = W/2, cy = H/2, R = Math.min(W,H)/2 - 30;
  
  // Outer sphere circle with gradient
  const grad = bctx.createRadialGradient(cx, cy, R*0.5, cx, cy, R);
  grad.addColorStop(0, 'rgba(124, 92, 255, 0.15)');
  grad.addColorStop(0.7, 'rgba(124, 92, 255, 0.3)');
  grad.addColorStop(1, 'rgba(124, 92, 255, 0.4)');
  bctx.strokeStyle = grad;
  bctx.lineWidth = 2;
  bctx.beginPath(); 
  bctx.arc(cx, cy, R, 0, 2*Math.PI); 
  bctx.stroke();
  
  // Vertical reference circle (equator projection)
  bctx.strokeStyle = 'rgba(124, 92, 255, 0.15)'; 
  bctx.lineWidth = 1;
  bctx.setLineDash([4,4]);
  bctx.beginPath(); 
  bctx.ellipse(cx, cy, R*0.8, R*0.4, 0, 0, 2*Math.PI); 
  bctx.stroke();
  bctx.setLineDash([]);
  
  // X, Y, Z axes with colors
  bctx.strokeStyle = 'rgba(255,100,100,0.3)'; // X - red
  bctx.lineWidth = 2;
  bctx.beginPath(); 
  bctx.moveTo(cx-R*0.7, cy); 
  bctx.lineTo(cx+R*0.7, cy); 
  bctx.stroke();
  
  bctx.strokeStyle = 'rgba(100,100,255,0.3)'; // Z - blue
  bctx.beginPath(); 
  bctx.moveTo(cx, cy-R*0.7); 
  bctx.lineTo(cx, cy+R*0.7); 
  bctx.stroke();
  
  // Axis labels
  bctx.fillStyle = 'rgba(255,150,100,0.7)'; 
  bctx.font = 'bold 14px Inter'; 
  bctx.fillText('X', cx+R*0.75-12, cy+15);
  bctx.fillStyle = 'rgba(100,150,255,0.7)'; 
  bctx.fillText('|0⟩', cx-30, cy-R*0.75+10);
  bctx.fillText('|1⟩', cx-30, cy+R*0.75);
  
  // State vector
  const {theta,phi} = anglesFromState(currentState);
  const x = Math.sin(theta)*Math.cos(phi);
  const y = Math.sin(theta)*Math.sin(phi);
  const px = cx + x*R, py = cy - y*R;
  
  // Arrow from origin to point
  bctx.strokeStyle = '#7c5cff';
  bctx.lineWidth = 3;
  bctx.beginPath();
  bctx.moveTo(cx, cy);
  bctx.lineTo(px, py);
  bctx.stroke();
  
  // Arrowhead
  const angle = Math.atan2(py - cy, px - cx);
  const arrowSize = 12;
  bctx.beginPath();
  bctx.moveTo(px, py);
  bctx.lineTo(px - arrowSize * Math.cos(angle - Math.PI/6), py - arrowSize * Math.sin(angle - Math.PI/6));
  bctx.lineTo(px - arrowSize * Math.cos(angle + Math.PI/6), py - arrowSize * Math.sin(angle + Math.PI/6));
  bctx.closePath();
  bctx.fillStyle = '#7c5cff';
  bctx.fill();
  
  // Point on sphere
  bctx.fillStyle = '#7c5cff'; 
  bctx.beginPath(); 
  bctx.arc(px, py, 10, 0, 2*Math.PI); 
  bctx.fill();
  
  // Glow effect
  bctx.fillStyle = 'rgba(124, 92, 255, 0.25)'; 
  bctx.beginPath(); 
  bctx.arc(px, py, 18, 0, 2*Math.PI); 
  bctx.fill();
  
  bctx.fillStyle = 'rgba(124, 92, 255, 0.1)'; 
  bctx.beginPath(); 
  bctx.arc(px, py, 26, 0, 2*Math.PI); 
  bctx.fill();
  
  // Probabilities and state
  const p0 = cAbs2(currentState[0]); 
  const p1 = cAbs2(currentState[1]);
  const a0Str = `${currentState[0].re.toFixed(3)}${currentState[0].im>=0?'+':''} ${currentState[0].im.toFixed(3)}i`;
  const a1Str = `${currentState[1].re.toFixed(3)}${currentState[1].im>=0?'+':''} ${currentState[1].im.toFixed(3)}i`;
  stateInfo.innerHTML = `<strong>|ψ⟩ = (${a0Str}) |0⟩ + (${a1Str}) |1⟩</strong><br><strong>P(0) = ${(p0*100).toFixed(1)}%  |  P(1) = ${(p1*100).toFixed(1)}%</strong><br><small>θ=${theta.toFixed(3)}, φ=${phi.toFixed(3)}</small>`;
  
  // Pulsing animation on active state
  bctx.globalAlpha = 0.15 + 0.1 * Math.sin(Date.now() / 500);
  bctx.fillStyle = 'rgba(124, 92, 255, 0.3)';
  bctx.beginPath();
  bctx.arc(px, py, 32, 0, 2*Math.PI);
  bctx.fill();
  bctx.globalAlpha = 1;
}

thetaInput.addEventListener('input', ()=>{ 
  currentState = stateFromAngles(parseFloat(thetaInput.value), parseFloat(phiInput.value)); 
  drawBloch(); 
});
phiInput.addEventListener('input', ()=>{ 
  currentState = stateFromAngles(parseFloat(thetaInput.value), parseFloat(phiInput.value)); 
  drawBloch(); 
});

// Animate Bloch sphere continuously
function animateBloch() {
  drawBloch();
  requestAnimationFrame(animateBloch);
}
animateBloch();

function applyGateUI(gate){
  currentState = applyGate(currentState, gate); 
  const a = anglesFromState(currentState); 
  thetaInput.value = a.theta.toFixed(4); 
  phiInput.value = a.phi.toFixed(4); 
  drawBloch();
}

document.getElementById('applyX').addEventListener('click', ()=> applyGateUI(X));
document.getElementById('applyY').addEventListener('click', ()=> applyGateUI(Y));
document.getElementById('applyZ').addEventListener('click', ()=> applyGateUI(Z));
document.getElementById('applyH').addEventListener('click', ()=> applyGateUI(H));
document.getElementById('resetState').addEventListener('click', ()=>{ 
  thetaInput.value=1.0; 
  phiInput.value=0.0; 
  currentState = stateFromAngles(1.0,0.0); 
  drawBloch(); 
});

// Double-slit sim
const dsCanvas = document.getElementById('doubleSlit');
const dsCtx = dsCanvas.getContext('2d');
const slitSep = document.getElementById('slitSep');
const wavelength = document.getElementById('wavelength');
const screenD = document.getElementById('screenD');

function renderSlit(){
  const W = dsCanvas.width, H = dsCanvas.height; 
  
  // Background
  const bgGrad = dsCtx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, 'rgba(10, 14, 39, 0.5)');
  bgGrad.addColorStop(0.5, 'rgba(8, 18, 38, 0.6)');
  bgGrad.addColorStop(1, 'rgba(10, 14, 39, 0.5)');
  dsCtx.fillStyle = bgGrad;
  dsCtx.fillRect(0, 0, W, H);
  
  const sep = parseFloat(slitSep.value);
  const lam = parseFloat(wavelength.value);
  const D = parseFloat(screenD.value);
  
  const xs = new Float32Array(W);
  for(let i=0;i<W;i++){
    const x = (i - W/2)/15;
    const r1 = Math.sqrt((x+sep/2)*(x+sep/2) + D*D);
    const r2 = Math.sqrt((x-sep/2)*(x-sep/2) + D*D);
    const k = 2*Math.PI/lam;
    const a1 = Math.cos(k*r1)/r1; 
    const b1 = Math.sin(k*r1)/r1;
    const a2 = Math.cos(k*r2)/r2; 
    const b2 = Math.sin(k*r2)/r2;
    const re = a1 + a2; 
    const im = b1 + b2;
    const I = re*re + im*im;
    xs[i] = I;
  }
  
  let maxI = 0.001; 
  for(let i=0;i<W;i++) if(xs[i]>maxI) maxI=xs[i];
  
  // Draw interference pattern with gradient
  for(let i=0;i<W;i++){
    const val = Math.sqrt(Math.sqrt(xs[i]/maxI));
    const intensity = Math.floor(255 * val);
    
    // Purple-to-blue gradient based on intensity
    const r = Math.floor(intensity * 0.8);
    const g = Math.floor(intensity * 0.4);
    const b = 255;
    
    dsCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.85 + val*0.15})`;
    dsCtx.fillRect(i, 0, 1, H);
  }
  
  // Add subtle top/bottom gradient
  const topGrad = dsCtx.createLinearGradient(0, 0, 0, H/3);
  topGrad.addColorStop(0, 'rgba(0,0,0,0.3)');
  topGrad.addColorStop(1, 'rgba(0,0,0,0)');
  dsCtx.fillStyle = topGrad;
  dsCtx.fillRect(0, 0, W, H/3);
  
  const bottomGrad = dsCtx.createLinearGradient(0, H*2/3, 0, H);
  bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
  bottomGrad.addColorStop(1, 'rgba(0,0,0,0.3)');
  dsCtx.fillStyle = bottomGrad;
  dsCtx.fillRect(0, H*2/3, W, H/3);
}

document.getElementById('rerunSlit').addEventListener('click', renderSlit);
slitSep.addEventListener('change', renderSlit);
wavelength.addEventListener('change', renderSlit);
screenD.addEventListener('change', renderSlit);

// Tabs and quiz with smooth transitions
document.querySelectorAll('.topbar nav button').forEach(btn=>btn.addEventListener('click', e=>{
  document.querySelectorAll('.topbar nav button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const tab = btn.dataset.tab;
  document.querySelectorAll('.tab').forEach(t=>{
    t.style.opacity='0';
    t.style.transform='translateY(10px)';
    setTimeout(()=>t.classList.add('hidden'), 300);
  });
  setTimeout(()=>{
    const target = document.getElementById(tab);
    target.classList.remove('hidden');
    requestAnimationFrame(()=>{
      target.style.opacity='1';
      target.style.transform='translateY(0)';
    });
  }, 300);
}));

// CSS for smooth transitions
const style = document.createElement('style');
style.textContent = `
  .tab { 
    transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
    opacity: 1;
    transform: translateY(0);
  }
`;
document.head.appendChild(style);

// Simple quiz
const quizQ = [
  {q:'Mis on kvbit?', choices:['Tavaline bitt','Kvantolek, mis võib olla superpositsioonis','Spetsiifiline algoritm'], a:1},
  {q:'Mis tekitab interferentsi topel-lõhes?', choices:['Rajaerinevus ja faaside erinevus','Temperatuur','Magnetväli'], a:0},
  {q:'Mis on Hadamardi värav (H)?', choices:['Nurga värav','Superpositsiooni värav','Faasi värav'], a:1},
  {q:'Mis on Blochi sfäär?', choices:['Tavaline sfäär','Kvbiti seisundi visualiseerimine','Gravitatsiooniväli'], a:1}
];
const quizBox = document.getElementById('quizBox');
const quizResult = document.getElementById('quizResult');
let quizScore = 0;

function renderQuiz(){
  quizBox.innerHTML='';
  quizScore = 0;
  quizQ.forEach((item,idx)=>{
    const card=document.createElement('div'); 
    card.className='card';
    const h=document.createElement('h4'); 
    h.innerText=`${idx+1}. ${item.q}`; 
    h.style.marginTop='0';
    card.appendChild(h);
    item.choices.forEach((ch,i)=>{
      const btn=document.createElement('button'); 
      btn.innerText=ch; 
      btn.style.cssText='margin:6px 4px;padding:10px 12px;border-radius:8px;border:1px solid rgba(124,92,255,0.3);background:linear-gradient(135deg,rgba(124,92,255,0.1),rgba(0,212,255,0.05));color:white;cursor:pointer;transition:all 0.3s cubic-bezier(0.4,0,0.2,1);font-weight:600;font-size:13px;position:relative;overflow:hidden';
      
      btn.addEventListener('click', ()=>{ 
        if(i===item.a){
          btn.style.background='linear-gradient(135deg, rgba(46,204,113,0.8), rgba(46,204,113,0.6))';
          btn.style.borderColor='#2ecc71';
          btn.style.boxShadow='0 8px 20px rgba(46,204,113,0.3)';
          quizScore++;
        } else {
          btn.style.background='linear-gradient(135deg, rgba(231,76,60,0.8), rgba(231,76,60,0.6))';
          btn.style.borderColor='#e74c3c';
          btn.style.boxShadow='0 8px 20px rgba(231,76,60,0.3)';
        } 
        btn.disabled=true;
        Array.from(card.querySelectorAll('button')).forEach(b=>b.disabled=true);
        
        if(quizScore === quizQ.length || idx === quizQ.length-1){
          setTimeout(()=>showQuizResult(), 800);
        }
      });
      card.appendChild(btn);
    });
    quizBox.appendChild(card);
  });
}

function showQuizResult(){
  quizBox.classList.add('hidden');
  quizResult.classList.remove('hidden');
  const pct = Math.floor(100*quizScore/quizQ.length);
  const emoji = pct === 100 ? '🎉' : pct >= 75 ? '🎊' : pct >= 50 ? '👍' : '💪';
  quizResult.innerHTML = `
    <div style="text-align:center;animation:fadeInUp 0.6s ease">
      <p style="font-size:64px;margin:0">${emoji}</p>
      <h2 style="margin:12px 0;background:linear-gradient(90deg,#7c5cff,#00d4ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">Tulemused</h2>
      <p style="font-size:48px;font-weight:bold;color:#00d4ff;margin:16px 0">${quizScore}/${quizQ.length}</p>
      <p style="font-size:24px;color:#7c5cff;margin:8px 0">${pct}%</p>
      <p style="color:#a0a8b0;margin:16px 0">${pct===100?'Suurepärane! Olete kvantfüüsika ekspert!':pct>=75?'Väga hea tulemus!':pct>=50?'Hea katse, õppige rohkem!':'Proovige uuesti!'}</p>
      <button onclick="location.reload()" style="margin-top:24px">↺ Uuesti</button>
    </div>
  `;
}

// initial draws
renderSlit(); renderQuiz();

// ==================== GAMES ====================

// Game 1: State Target Challenge
let gameState = {};

function initGame1() {
  gameState = {
    targetTheta: Math.random() * Math.PI,
    targetPhi: Math.random() * 2 * Math.PI,
    score: 0,
    attempts: 0,
    maxAttempts: 5
  };
  
  const container = document.getElementById('gameContainer');
  const targetState = stateFromAngles(gameState.targetTheta, gameState.targetPhi);
  
  container.innerHTML = `
    <div class="game-content">
      <div class="game-score">
        <div>Pokeeriad: ${gameState.attempts}/${gameState.maxAttempts}</div>
        <div class="game-score-value">${gameState.score} p</div>
      </div>
      <p style="color:#a0a8b0;text-align:center">Saavuta target olek! Manipuleeri Theta ja Phi slidereid.</p>
      <div class="game-controls">
        <label style="color:#a0a8b0">Target θ: ${gameState.targetTheta.toFixed(2)} (sin) | φ: ${gameState.targetPhi.toFixed(2)} (rad)</label>
        <canvas id="gameCanvas" class="game-canvas" width="600" height="300"></canvas>
        <label>Sinu θ: <input type="range" id="gameTheta" min="0" max="3.1416" step="0.01" value="1.57" style="flex:1"></label>
        <label>Sinu φ: <input type="range" id="gamePhi" min="0" max="6.2832" step="0.01" value="3.14" style="flex:1"></label>
        <button class="game-button" id="gameCheckBtn">✓ Kontrolli</button>
        <button class="game-button" onclick="initGame1()" style="background:linear-gradient(135deg,rgba(100,100,255,0.2),rgba(0,150,200,0.1))">↻ Uus mäng</button>
      </div>
      <div id="gameMessage"></div>
    </div>
  `;
  
  const gameCanvas = document.getElementById('gameCanvas');
  const gameCtx = gameCanvas.getContext('2d');
  const gameMsgDiv = document.getElementById('gameMessage');
  
  function drawGame1() {
    const W = gameCanvas.width, H = gameCanvas.height;
    gameCtx.clearRect(0, 0, W, H);
    
    // Draw target on left
    gameCtx.fillStyle = 'rgba(124,92,255,0.1)';
    gameCtx.fillRect(10, 10, W/2 - 20, H - 20);
    gameCtx.strokeStyle = 'rgba(124,92,255,0.3)';
    gameCtx.strokeRect(10, 10, W/2 - 20, H - 20);
    
    const R = Math.min(W/4, H/2) - 20;
    const cx1 = W/4, cy1 = H/2;
    
    // Target sphere
    gameCtx.strokeStyle = 'rgba(124,92,255,0.5)';
    gameCtx.lineWidth = 2;
    gameCtx.beginPath();
    gameCtx.arc(cx1, cy1, R, 0, 2*Math.PI);
    gameCtx.stroke();
    
    const targetX = Math.sin(gameState.targetTheta)*Math.cos(gameState.targetPhi);
    const targetY = Math.sin(gameState.targetTheta)*Math.sin(gameState.targetPhi);
    const tpx = cx1 + targetX*R, tpy = cy1 - targetY*R;
    
    gameCtx.fillStyle = '#00d4ff';
    gameCtx.beginPath();
    gameCtx.arc(tpx, tpy, 8, 0, 2*Math.PI);
    gameCtx.fill();
    
    gameCtx.fillStyle = 'rgba(0,212,255,0.3)';
    gameCtx.beginPath();
    gameCtx.arc(tpx, tpy, 14, 0, 2*Math.PI);
    gameCtx.fill();
    
    gameCtx.fillStyle = 'rgba(124,92,255,0.2)';
    gameCtx.font = 'bold 12px Inter';
    gameCtx.fillText('Target', cx1 - 20, 25);
    
    // Draw current on right
    gameCtx.fillStyle = 'rgba(0,212,255,0.1)';
    gameCtx.fillRect(W/2 + 10, 10, W/2 - 20, H - 20);
    gameCtx.strokeStyle = 'rgba(0,212,255,0.3)';
    gameCtx.strokeRect(W/2 + 10, 10, W/2 - 20, H - 20);
    
    const cx2 = 3*W/4, cy2 = H/2;
    gameCtx.strokeStyle = 'rgba(0,212,255,0.5)';
    gameCtx.beginPath();
    gameCtx.arc(cx2, cy2, R, 0, 2*Math.PI);
    gameCtx.stroke();
    
    const userTheta = parseFloat(document.getElementById('gameTheta').value);
    const userPhi = parseFloat(document.getElementById('gamePhi').value);
    
    const userX = Math.sin(userTheta)*Math.cos(userPhi);
    const userY = Math.sin(userTheta)*Math.sin(userPhi);
    const upx = cx2 + userX*R, upy = cy2 - userY*R;
    
    gameCtx.fillStyle = '#7c5cff';
    gameCtx.beginPath();
    gameCtx.arc(upx, upy, 8, 0, 2*Math.PI);
    gameCtx.fill();
    
    gameCtx.fillStyle = 'rgba(124,92,255,0.3)';
    gameCtx.beginPath();
    gameCtx.arc(upx, upy, 14, 0, 2*Math.PI);
    gameCtx.fill();
    
    gameCtx.fillStyle = 'rgba(0,212,255,0.2)';
    gameCtx.fillText('Sinu', 3*W/4 - 15, 25);
  }
  
  document.getElementById('gameTheta').addEventListener('input', drawGame1);
  document.getElementById('gamePhi').addEventListener('input', drawGame1);
  
  document.getElementById('gameCheckBtn').addEventListener('click', ()=> {
    const userTheta = parseFloat(document.getElementById('gameTheta').value);
    const userPhi = parseFloat(document.getElementById('gamePhi').value);
    
    const dTheta = Math.abs(userTheta - gameState.targetTheta);
    const dPhi = Math.abs(userPhi - gameState.targetPhi);
    
    const distance = Math.sqrt(dTheta*dTheta + dPhi*dPhi);
    const tolerance = 0.15;
    
    gameState.attempts++;
    
    if (distance < tolerance) {
      gameState.score += Math.max(10 - Math.floor(distance*30), 1);
      gameMsgDiv.innerHTML = `<div class="game-message" style="background:linear-gradient(135deg, rgba(46,204,113,0.1), rgba(46,204,113,0.05));border-color:rgba(46,204,113,0.3);color:#2ecc71">✓ Õige! +${Math.max(10 - Math.floor(distance*30), 1)} p</div>`;
      document.getElementById('gameCheckBtn').textContent = '✓ Õigesti!';
      document.getElementById('gameCheckBtn').classList.add('success');
      setTimeout(() => initGame1(), 2000);
    } else {
      gameMsgDiv.innerHTML = `<div class="game-message">✗ Vale. Kaugus: ${distance.toFixed(2)} (vajad < 0.15)</div>`;
      if (gameState.attempts >= gameState.maxAttempts) {
        gameMsgDiv.innerHTML += `<div class="game-message" style="margin-top:12px">Mäng läbi! Skoor: ${gameState.score} p</div>`;
        document.getElementById('gameCheckBtn').disabled = true;
      }
    }
  });
  
  drawGame1();
}

// Game 2: Gate Sequence Puzzle
function initGame2() {
  const gates = ['X', 'Y', 'Z', 'H'];
  const targetGate = gates[Math.floor(Math.random()*gates.length)];
  const sequence = [];
  let score = 0;
  
  const container = document.getElementById('gameContainer');
  container.innerHTML = `
    <div class="game-content">
      <div class="game-score">
        <div>Õiged: <span id="game2Correct">0</span></div>
        <div class="game-score-value" id="game2Score">0 p</div>
      </div>
      <p style="color:#a0a8b0;text-align:center">Milline värav on siht-olek? Kontrolli Blochi sfäär!</p>
      <canvas id="gameCanvas2" class="game-canvas" width="600" height="300"></canvas>
      <div class="game-controls" style="flex-direction:row;flex-wrap:wrap;gap:8px;justify-content:center">
        <button class="game-button" onclick="guessGate('X')" style="flex:0">X värav</button>
        <button class="game-button" onclick="guessGate('Y')" style="flex:0">Y värav</button>
        <button class="game-button" onclick="guessGate('Z')" style="flex:0">Z värav</button>
        <button class="game-button" onclick="guessGate('H')" style="flex:0">H värav</button>
      </div>
      <button class="game-button" onclick="initGame2()" style="margin-top:12px;background:linear-gradient(135deg,rgba(100,100,255,0.2),rgba(0,150,200,0.1))">↻ Uus ülesanne</button>
      <div id="gameMessage2"></div>
    </div>
  `;
  
  const gameCanvas = document.getElementById('gameCanvas2');
  const gameCtx = gameCanvas.getContext('2d');
  
  // Apply random starting state
  let state = stateFromAngles(Math.random()*Math.PI, Math.random()*2*Math.PI);
  const startState = [...state];
  
  // Apply target gate
  state = applyGate(state, eval(targetGate));
  
  window.guessGate = function(gateName) {
    const msgDiv = document.getElementById('gameMessage2');
    const isCorrect = gateName === targetGate;
    
    if (isCorrect) {
      score += 10;
      document.getElementById('game2Score').textContent = score + ' p';
      const correct = parseInt(document.getElementById('game2Correct').textContent) + 1;
      document.getElementById('game2Correct').textContent = correct;
      msgDiv.innerHTML = `<div class="game-message" style="background:linear-gradient(135deg, rgba(46,204,113,0.1), rgba(46,204,113,0.05));border-color:rgba(46,204,113,0.3);color:#2ecc71">✓ Õige värav!</div>`;
      setTimeout(() => initGame2(), 1500);
    } else {
      msgDiv.innerHTML = `<div class="game-message">✗ Vale! Õige oli: ${targetGate}</div>`;
    }
  };
  
  function drawGame2() {
    const W = gameCanvas.width, H = gameCanvas.height;
    gameCtx.clearRect(0, 0, W, H);
    
    // Start state
    const R = Math.min(W/4, H/2) - 15;
    const cx1 = W/4, cy1 = H/2;
    gameCtx.strokeStyle = 'rgba(100,150,255,0.3)';
    gameCtx.fillStyle = 'rgba(100,150,255,0.05)';
    gameCtx.lineWidth = 2;
    gameCtx.beginPath();
    gameCtx.arc(cx1, cy1, R, 0, 2*Math.PI);
    gameCtx.stroke();
    gameCtx.fill();
    
    const angles1 = anglesFromState(startState);
    const x1 = Math.sin(angles1.theta)*Math.cos(angles1.phi);
    const y1 = Math.sin(angles1.theta)*Math.sin(angles1.phi);
    gameCtx.fillStyle = 'rgba(100,150,255,0.8)';
    gameCtx.beginPath();
    gameCtx.arc(cx1 + x1*R, cy1 - y1*R, 6, 0, 2*Math.PI);
    gameCtx.fill();
    gameCtx.fillStyle = '#666';
    gameCtx.font = '11px Inter';
    gameCtx.fillText('Start', cx1-15, cy1+R+20);
    
    // Arrow
    gameCtx.strokeStyle = 'rgba(124,92,255,0.4)';
    gameCtx.lineWidth = 2;
    gameCtx.beginPath();
    gameCtx.moveTo(cx1+R+10, cy1);
    gameCtx.lineTo(3*W/4-R-10, cy1);
    gameCtx.stroke();
    gameCtx.fillStyle = 'rgba(124,92,255,0.6)';
    gameCtx.font = 'bold 14px Inter';
    gameCtx.fillText(targetGate, W/2-10, cy1-20);
    
    // Target state
    const R2 = Math.min(W/4, H/2) - 15;
    const cx2 = 3*W/4, cy2 = H/2;
    gameCtx.strokeStyle = 'rgba(0,212,255,0.4)';
    gameCtx.fillStyle = 'rgba(0,212,255,0.05)';
    gameCtx.beginPath();
    gameCtx.arc(cx2, cy2, R2, 0, 2*Math.PI);
    gameCtx.stroke();
    gameCtx.fill();
    
    const angles2 = anglesFromState(state);
    const x2 = Math.sin(angles2.theta)*Math.cos(angles2.phi);
    const y2 = Math.sin(angles2.theta)*Math.sin(angles2.phi);
    gameCtx.fillStyle = '#00d4ff';
    gameCtx.beginPath();
    gameCtx.arc(cx2 + x2*R2, cy2 - y2*R2, 8, 0, 2*Math.PI);
    gameCtx.fill();
    gameCtx.fillStyle = 'rgba(0,212,255,0.3)';
    gameCtx.beginPath();
    gameCtx.arc(cx2 + x2*R2, cy2 - y2*R2, 12, 0, 2*Math.PI);
    gameCtx.fill();
    gameCtx.fillStyle = '#666';
    gameCtx.fillText('Tulemus', cx2-20, cy2+R2+20);
  }
  
  drawGame2();
}

// Game 3: Measurement Prediction
function initGame3() {
  const state = stateFromAngles(Math.random()*Math.PI, Math.random()*2*Math.PI);
  const p0 = cAbs2(state[0]);
  const result = Math.random() < p0 ? '0' : '1';
  let score = 0;
  
  const container = document.getElementById('gameContainer');
  container.innerHTML = `
    <div class="game-content">
      <div class="game-score">
        <div>Õigeid vastuseid: <span id="game3Correct">0</span>/5</div>
        <div class="game-score-value" id="game3Score">0 p</div>
      </div>
      <p style="color:#a0a8b0;text-align:center">Ennusta, mis tulemust saad mõõtmisel!</p>
      <div style="background:linear-gradient(135deg,rgba(124,92,255,0.1),rgba(0,212,255,0.05));padding:20px;border-radius:10px;border:1px solid rgba(124,92,255,0.2);margin:16px 0;text-align:center">
        <p style="color:#a0a8b0;margin:0;font-size:13px">P(0) = <strong style="color:#00d4ff">${(p0*100).toFixed(1)}%</strong></p>
        <p style="color:#a0a8b0;margin:8px 0 0;font-size:13px">P(1) = <strong style="color:#00d4ff">${((1-p0)*100).toFixed(1)}%</strong></p>
      </div>
      <div class="game-controls" style="flex-direction:row;gap:12px;justify-content:center">
        <button class="game-button" onclick="predictMeasure('0')" style="flex:1;background:linear-gradient(135deg,rgba(46,204,113,0.2),rgba(46,204,113,0.1));border-color:rgba(46,204,113,0.4)">Saad 0</button>
        <button class="game-button" onclick="predictMeasure('1')" style="flex:1;background:linear-gradient(135deg,rgba(231,76,60,0.2),rgba(231,76,60,0.1));border-color:rgba(231,76,60,0.4)">Saad 1</button>
      </div>
      <button class="game-button" onclick="initGame3()" style="margin-top:12px;background:linear-gradient(135deg,rgba(100,100,255,0.2),rgba(0,150,200,0.1))">↻ Järgmine</button>
      <div id="gameMessage3"></div>
    </div>
  `;
  
  window.predictMeasure = function(prediction) {
    const msgDiv = document.getElementById('gameMessage3');
    const isCorrect = prediction === result;
    
    if (isCorrect) {
      score += 20;
      const correct = parseInt(document.getElementById('game3Correct').textContent.split('/')[0]) + 1;
      document.getElementById('game3Correct').textContent = correct + '/5';
      document.getElementById('game3Score').textContent = score + ' p';
      msgDiv.innerHTML = `<div class="game-message" style="background:linear-gradient(135deg, rgba(46,204,113,0.1), rgba(46,204,113,0.05));border-color:rgba(46,204,113,0.3);color:#2ecc71">✓ Õige! Mõõtmine andis: ${result}</div>`;
      if (correct >= 5) {
        msgDiv.innerHTML += `<div class="game-message" style="margin-top:12px">Valmis! Skoor: ${score} p</div>`;
      } else {
        setTimeout(() => initGame3(), 1500);
      }
    } else {
      msgDiv.innerHTML = `<div class="game-message">✗ Vale! Saad olid ${result}</div>`;
    }
  };
}

// Game 4: Superposition Collector
function initGame4() {
  const container = document.getElementById('gameContainer');
  container.innerHTML = `
    <div class="game-content">
      <div class="game-score">
        <div>Tahkud: <span id="game4Score">0</span></div>
        <div class="game-score-value" id="game4Timer">30s</div>
      </div>
      <p style="color:#a0a8b0;text-align:center">Klõpsa superpositsiooni osakestel! 5 sekundis võib klikid kaduda!</p>
      <canvas id="gameCanvas4" class="game-canvas" width="600" height="300"></canvas>
      <button class="game-button" onclick="initGame4()" style="margin-top:12px;background:linear-gradient(135deg,rgba(100,100,255,0.2),rgba(0,150,200,0.1))">↻ Uuesti</button>
    </div>
  `;
  
  const gameCanvas = document.getElementById('gameCanvas4');
  const gameCtx = gameCanvas.getContext('2d');
  let score = 0;
  let timeLeft = 30;
  let particles = [];
  
  const W = gameCanvas.width, H = gameCanvas.height;
  
  // Create particles
  for(let i=0; i<12; i++) {
    particles.push({
      x: Math.random()*W,
      y: Math.random()*H,
      vx: (Math.random()-0.5)*2,
      vy: (Math.random()-0.5)*2,
      r: 8,
      active: true,
      fadeTime: 5000
    });
  }
  
  gameCanvas.addEventListener('click', (e) => {
    const rect = gameCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    for(let p of particles) {
      if(p.active) {
        const dx = p.x - mx, dy = p.y - my;
        if(dx*dx + dy*dy < p.r*p.r) {
          score++;
          document.getElementById('game4Score').textContent = score;
          p.active = false;
          p.collected = true;
        }
      }
    }
  });
  
  function animate() {
    gameCtx.clearRect(0, 0, W, H);
    
    for(let p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      
      if(p.x < 0 || p.x > W) p.vx *= -1;
      if(p.y < 0 || p.y > H) p.vy *= -1;
      
      p.x = Math.max(0, Math.min(W, p.x));
      p.y = Math.max(0, Math.min(H, p.y));
      
      if(p.active) {
        gameCtx.fillStyle = 'rgba(124,92,255,0.8)';
        gameCtx.beginPath();
        gameCtx.arc(p.x, p.y, p.r, 0, 2*Math.PI);
        gameCtx.fill();
        gameCtx.fillStyle = 'rgba(124,92,255,0.4)';
        gameCtx.beginPath();
        gameCtx.arc(p.x, p.y, p.r*1.5, 0, 2*Math.PI);
        gameCtx.fill();
      } else if(p.collected) {
        gameCtx.fillStyle = 'rgba(46,204,113,0.6)';
        gameCtx.beginPath();
        gameCtx.arc(p.x, p.y, p.r*0.5, 0, 2*Math.PI);
        gameCtx.fill();
      }
    }
  }
  
  function updateTimer() {
    timeLeft--;
    document.getElementById('game4Timer').textContent = timeLeft + 's';
    if(timeLeft <= 0) {
      gameCtx.fillStyle = 'rgba(0,0,0,0.7)';
      gameCtx.fillRect(0, 0, W, H);
      gameCtx.fillStyle = '#00d4ff';
      gameCtx.font = 'bold 32px Inter';
      gameCtx.fillText('Aeg läbi!', W/2-80, H/2);
      gameCtx.font = '20px Inter';
      gameCtx.fillText('Skoor: ' + score, W/2-60, H/2+40);
      return;
    }
    setTimeout(updateTimer, 1000);
  }
  
  const animInterval = setInterval(animate, 30);
  updateTimer();
  animate();
}

// Tab switching & initialization
document.addEventListener('DOMContentLoaded', () => {
  // Header nav tab switching (data-tab)
  const navButtons = document.querySelectorAll('header nav button[data-tab]');
  const tabs = document.querySelectorAll('main .tab');

  function showTab(name) {
    tabs.forEach(t => t.classList.add('hidden'));
    const target = document.getElementById(name);
    if (target) target.classList.remove('hidden');
    navButtons.forEach(b => b.classList.remove('active'));
    const btn = Array.from(navButtons).find(x => x.dataset.tab === name);
    if (btn) btn.classList.add('active');

    // If user opened Games tab, ensure a game is initialized
    if (name === 'games' && document.getElementById('gameContainer')) {
      const gc = document.getElementById('gameContainer');
      if (gc.innerHTML.trim() === '') {
        // initialize first game
        if (typeof initGame1 === 'function') initGame1();
      }
    }
  }

  navButtons.forEach(btn => btn.addEventListener('click', (e) => {
    showTab(btn.dataset.tab);
  }));

  // Game tab buttons (inside Games section)
  document.querySelectorAll('.game-tab').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.game-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const gameNum = btn.dataset.game;
      const fn = window['initGame' + gameNum];
      if (typeof fn === 'function') fn();
    });
  });

  // Show the header's active tab on load (defaults to the one marked active in HTML)
  const activeHeader = document.querySelector('header nav button.active');
  if (activeHeader) showTab(activeHeader.dataset.tab);
});

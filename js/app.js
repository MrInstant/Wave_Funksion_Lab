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
}

thetaInput.addEventListener('input', ()=>{ 
  currentState = stateFromAngles(parseFloat(thetaInput.value), parseFloat(phiInput.value)); 
  drawBloch(); 
});
phiInput.addEventListener('input', ()=>{ 
  currentState = stateFromAngles(parseFloat(thetaInput.value), parseFloat(phiInput.value)); 
  drawBloch(); 
});

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

// Tabs and quiz
document.querySelectorAll('.topbar nav button').forEach(btn=>btn.addEventListener('click', e=>{
  document.querySelectorAll('.topbar nav button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const tab = btn.dataset.tab;
  document.querySelectorAll('.tab').forEach(t=>{
    t.style.opacity='0';
    setTimeout(()=>t.classList.add('hidden'), 150);
  });
  setTimeout(()=>{
    document.getElementById(tab).classList.remove('hidden');
    setTimeout(()=>document.getElementById(tab).style.opacity='1', 10);
  }, 150);
}));

// Fade in animation for tab content
const style = document.createElement('style');
style.textContent = `.tab { transition: opacity 0.3s ease; opacity: 1; }`;
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
      btn.style.cssText='margin:6px 4px;padding:10px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:white;cursor:pointer;transition:0.2s';
      btn.addEventListener('click', ()=>{ 
        if(i===item.a){
          btn.style.background='#2ecc71';
          btn.style.borderColor='#2ecc71';
          quizScore++;
        } else {
          btn.style.background='#e74c3c';
          btn.style.borderColor='#e74c3c';
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
  quizResult.innerHTML = `<h2>Tulemused</h2><p style="font-size:32px;font-weight:bold;color:#7c5cff">${quizScore}/${quizQ.length}</p><p>${pct}%</p><button onclick="location.reload()">Uuesti</button>`;
}

// initial draws
drawBloch(); renderSlit(); renderQuiz();

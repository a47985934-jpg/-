/* =========================================================
   ARK-FLUID · main.js — immersive ocean experience
   Vanilla JS. No external deps. Everything drawn on canvas/SVG.
   ========================================================= */
(() => {
'use strict';
const $ = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => [...c.querySelectorAll(s)];
const lerp = (a,b,t)=>a+(b-a)*t;
const clamp = (v,a,b)=>Math.min(b,Math.max(a,v));
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
let lenis = null;

/* ---------- PRELOADER ---------- */
const preloader=$('#preloader'), preBar=$('#preBar'), prePct=$('#prePct');
let pp=0;
const preInt=setInterval(()=>{
  pp=Math.min(100, pp + Math.random()*16 + 4);
  preBar.style.width=pp+'%'; prePct.textContent=Math.floor(pp)+'%';
  if(pp>=100){clearInterval(preInt); setTimeout(()=>{preloader.classList.add('done'); startReveals();}, 500);}
},130);

/* ---------- HEADER / MENU ---------- */
const header=$('#siteHeader'), nav=$('#siteNav'), menuToggle=$('#menuToggle');
addEventListener('scroll',()=>header.classList.toggle('scrolled', scrollY>40),{passive:true});
menuToggle.addEventListener('click',()=>{menuToggle.classList.toggle('open');nav.classList.toggle('open');});
$$('#siteNav a').forEach(a=>a.addEventListener('click',()=>{menuToggle.classList.remove('open');nav.classList.remove('open');}));

/* ---------- SMOOTH ANCHOR + WAVE TRANSITION ---------- */
const waveT=$('#waveTransition');
$$('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    const id=a.getAttribute('href'); if(id.length<2)return;
    const t=$(id); if(!t)return; e.preventDefault();
    if(!reduce){waveT.classList.add('play'); setTimeout(()=>waveT.classList.remove('play'),1000);}
    setTimeout(()=>{
      if(lenis) lenis.scrollTo(t,{offset:-64,duration:1.4});
      else t.scrollIntoView({behavior:reduce?'auto':'smooth'});
    }, reduce?0:250);
  });
});

/* ---------- SCROLL REVEAL ---------- */
const io=new IntersectionObserver((entries)=>{
  entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); if(en.target.dataset.once!=='0') io.unobserve(en.target);} });
},{threshold:.16, rootMargin:'0px 0px -8% 0px'});
function startReveals(){ $$('.reveal, .reveal-line, .bars').forEach(el=>io.observe(el)); }

/* ---------- COUNT ANIMATION ---------- */
const countIO=new IntersectionObserver((entries)=>{
  entries.forEach(en=>{
    if(!en.isIntersecting)return; const el=en.target; countIO.unobserve(el);
    const to=+el.dataset.to||0; const dur=1400; const t0=performance.now();
    const tick=(now)=>{ const p=clamp((now-t0)/dur,0,1); const e=1-Math.pow(1-p,3);
      el.textContent=Math.floor(to*e).toLocaleString(); if(p<1)requestAnimationFrame(tick); else el.textContent=to.toLocaleString(); };
    requestAnimationFrame(tick);
  });
},{threshold:.5});
$$('.count').forEach(el=>countIO.observe(el));

/* ---------- DEPTH / PROGRESS / NAV ---------- */
const sections=$$('.section');
const depthMeter=$('#depthMeter'), depthFill=$('#depthFill'), depthValue=$('#depthValue'),
      depthLabel=$('#depthLabel'), dotNav=$('#dotNav'), progressBar=$('#scrollProgress span'),
      depthTint=$('#depthTint'), godrays=$('#godrays');
// build dot nav
sections.forEach((s)=>{
  const a=document.createElement('a'); a.href='#'+s.id; a.dataset.label=s.dataset.nav||s.id; dotNav.appendChild(a);
});
const dots=$$('#dotNav a');

let curDepth=0, targetDepth=0;
function onScroll(){
  const st=scrollY, dh=document.body.scrollHeight-innerHeight;
  const prog=clamp(st/dh,0,1);
  progressBar.style.width=(prog*100)+'%';
  // depth 0->100 mapped over full page
  targetDepth=Math.round(prog*100);
  depthMeter.classList.toggle('show', st>innerHeight*.5);
  dotNav.classList.toggle('show', st>innerHeight*.5);
  // active section
  let active=0;
  sections.forEach((s,i)=>{ if(s.getBoundingClientRect().top<=innerHeight*.4) active=i; });
  dots.forEach((d,i)=>d.classList.toggle('active',i===active));
  const label=sections[active].dataset.label||'OCEAN';
  depthLabel.textContent=label;
  // subtle depth fog on top of the body gradient (which now carries the surface→seabed color)
  depthTint.style.background=`linear-gradient(180deg,rgba(3,9,19,${prog*.05}),rgba(3,9,19,${prog*.32}))`;
  godrays.style.opacity = clamp((prog-0.06)*3,0,1) * (1-clamp((prog-0.55)*3,0,1));
}
addEventListener('scroll',onScroll,{passive:true}); addEventListener('resize',onScroll);

// animate depth number smoothly
(function depthLoop(){
  curDepth=lerp(curDepth,targetDepth,.12);
  depthValue.textContent=Math.round(curDepth);
  depthFill.style.height=curDepth+'%';
  requestAnimationFrame(depthLoop);
})();

/* ---------- HERO WATER (canvas waves) ---------- */
const waterCv=$('#waterCanvas'), wctx=waterCv.getContext('2d');
function sizeWater(){ waterCv.width=innerWidth; waterCv.height=waterCv.offsetHeight; }
sizeWater(); addEventListener('resize',sizeWater);
let wt=0;
function drawWater(){
  const w=waterCv.width,h=waterCv.height; wctx.clearRect(0,0,w,h);
  for(let layer=0;layer<3;layer++){
    wctx.beginPath();
    const amp=10+layer*8, yBase=h*(0.2+layer*0.12), speed=0.02+layer*0.01;
    wctx.moveTo(0,h);
    for(let x=0;x<=w;x+=12){
      const y=yBase+Math.sin(x*0.012+wt*speed+layer)*amp+Math.sin(x*0.03-wt*speed)*amp*0.4;
      wctx.lineTo(x,y);
    }
    wctx.lineTo(w,h); wctx.closePath();
    const g=wctx.createLinearGradient(0,yBase,0,h);
    const alpha=[0.5,0.4,0.85][layer];
    g.addColorStop(0,`rgba(30,120,180,${alpha*0.5})`);
    g.addColorStop(1,`rgba(4,48,79,${alpha})`);
    wctx.fillStyle=g; wctx.fill();
    // sun glints
    if(layer===0){ wctx.fillStyle='rgba(255,255,255,.14)';
      for(let x=0;x<w;x+=40){const y=yBase+Math.sin(x*0.012+wt*speed)*amp; wctx.fillRect(x,y,14,2);}
    }
  }
  wt+=1;
  if(!reduce) requestAnimationFrame(drawWater);
}
drawWater();

// hero parallax + fade on scroll
const heroRay=$('#heroRayWrap'), heroSun=$('#heroSun'), scrollHint=$('#scrollHint'), heroContent=$('.hero__content'),
      heroScrim=$('#heroScrim'), heroVideo=$('#heroVideo');
addEventListener('scroll',()=>{
  const y=scrollY; if(y>innerHeight*1.35)return;
  const p=y/innerHeight;
  if(heroRay)heroRay.style.transform=`translate(-50%,calc(-50% + ${y*0.35}px)) scale(${1-p*0.15})`;
  if(heroSun)heroSun.style.transform=`translateX(-50%) translateY(${y*0.2}px)`;
  heroContent.style.transform=`translateY(${y*0.25}px)`; heroContent.style.opacity=String(1-p*1.3);
  scrollHint.style.opacity=String(1-p*3);
  if(heroVideo) heroVideo.style.transform=`scale(${1+p*0.12})`;         // gentle parallax zoom
  if(heroScrim) heroScrim.style.opacity=clamp(p*1.25,0,1).toFixed(3);   // gradient-fade into the deep
},{passive:true});
// pause the hero video when it scrolls out of view (perf / battery)
if(heroVideo){
  new IntersectionObserver((e)=>{ if(e[0].isIntersecting){ const pr=heroVideo.play&&heroVideo.play(); if(pr&&pr.catch)pr.catch(()=>{}); } else heroVideo.pause&&heroVideo.pause(); },{threshold:.05}).observe($('#hero'));
}

/* ---------- GLOBAL OCEAN PARTICLES (depth atmosphere: bubbles, plankton, fish, ray silhouettes) ---------- */
const ocv=$('#oceanCanvas'), octx=ocv.getContext('2d');
let ow,oh; function sizeOcean(){ ow=ocv.width=innerWidth; oh=ocv.height=innerHeight; }
sizeOcean(); addEventListener('resize',sizeOcean);
const particles=[]; const P=70;
for(let i=0;i<P;i++)particles.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:Math.random()*2.4+.4,sp:Math.random()*.4+.1,drift:Math.random()*.5-.25,o:Math.random()*.4+.1});
// fish school
const fish=[]; for(let i=0;i<10;i++)fish.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,sp:Math.random()*.6+.5,dir:Math.random()>.5?1:-1,size:Math.random()*6+4,ph:Math.random()*6});
// ray silhouettes drifting
const rays=[{x:-200,y:innerHeight*.4,sp:.3,size:120,dir:1},{x:innerWidth+300,y:innerHeight*.7,sp:.22,size:180,dir:-1}];
let mouseX=innerWidth/2,mouseY=innerHeight/2, depthAlpha=0;
function drawOcean(){
  octx.clearRect(0,0,ow,oh);
  depthAlpha=lerp(depthAlpha, clamp((scrollY/innerHeight-0.4),0,1), .05);
  // particles
  particles.forEach(p=>{
    p.y-=p.sp; p.x+=p.drift + Math.sin(p.y*.01)*.3;
    if(p.y<-5){p.y=oh+5;p.x=Math.random()*ow;}
    // mouse repel
    const dx=p.x-mouseX, dy=p.y-mouseY, d=Math.hypot(dx,dy);
    if(d<120){p.x+=dx/d*1.2;p.y+=dy/d*1.2;}
    octx.beginPath(); octx.arc(p.x,p.y,p.r,0,7);
    octx.fillStyle=`rgba(127,215,255,${p.o*(.3+depthAlpha)})`; octx.fill();
  });
  // fish (only when submerged)
  if(depthAlpha>.1){
    fish.forEach(f=>{
      f.x+=f.sp*f.dir; f.ph+=.15;
      if(f.dir>0&&f.x>ow+40)f.x=-40; if(f.dir<0&&f.x<-40)f.x=ow+40;
      const yy=f.y+Math.sin(f.ph)*6;
      octx.save(); octx.globalAlpha=depthAlpha*.5; octx.fillStyle='#4aa9ee';
      octx.beginPath(); octx.ellipse(f.x,yy,f.size,f.size*.4,0,0,7); octx.fill();
      octx.beginPath(); octx.moveTo(f.x-f.dir*f.size,yy); octx.lineTo(f.x-f.dir*f.size*1.7,yy-f.size*.4); octx.lineTo(f.x-f.dir*f.size*1.7,yy+f.size*.4); octx.fill();
      octx.restore();
    });
    // ray silhouettes
    rays.forEach(r=>{
      r.x+=r.sp*r.dir; if(r.dir>0&&r.x>ow+400)r.x=-400; if(r.dir<0&&r.x<-400)r.x=ow+400;
      octx.save(); octx.globalAlpha=depthAlpha*.12; octx.translate(r.x,r.y+Math.sin(r.x*.005)*20); octx.scale(r.dir*r.size/200,r.size/200);
      octx.fillStyle='#0a2a4d';
      octx.beginPath();
      octx.moveTo(0,-40); octx.quadraticCurveTo(90,-30,150,20); octx.quadraticCurveTo(80,0,40,10);
      octx.quadraticCurveTo(20,60,0,90); octx.quadraticCurveTo(-20,60,-40,10);
      octx.quadraticCurveTo(-80,0,-150,20); octx.quadraticCurveTo(-90,-30,0,-40); octx.fill();
      octx.restore();
    });
  }
  requestAnimationFrame(drawOcean);
}
if(!reduce)drawOcean();
addEventListener('mousemove',e=>{mouseX=e.clientX;mouseY=e.clientY;});

/* ---------- CURSOR LIGHT PARTICLES ---------- */
const ccv=$('#cursorCanvas'), cctx=ccv.getContext('2d');
function sizeCur(){ccv.width=innerWidth;ccv.height=innerHeight;} sizeCur(); addEventListener('resize',sizeCur);
const trail=[];
addEventListener('mousemove',e=>{ for(let i=0;i<2;i++)trail.push({x:e.clientX,y:e.clientY,life:1,vx:(Math.random()-.5)*1.5,vy:(Math.random()-.5)*1.5,r:Math.random()*3+1}); });
function drawCursor(){
  cctx.clearRect(0,0,ccv.width,ccv.height);
  for(let i=trail.length-1;i>=0;i--){ const t=trail[i]; t.x+=t.vx;t.y+=t.vy;t.life-=.03; t.vy-=.02;
    if(t.life<=0){trail.splice(i,1);continue;}
    cctx.beginPath(); cctx.arc(t.x,t.y,t.r*t.life,0,7);
    cctx.fillStyle=`rgba(127,215,255,${t.life*.4})`; cctx.fill();
  }
  requestAnimationFrame(drawCursor);
}
if(!reduce)drawCursor();

/* ---------- BUBBLES (5m section) ---------- */
const bubbles=$('#bubbles');
for(let i=0;i<26;i++){ const b=document.createElement('i'); const s=Math.random()*22+6;
  b.style.cssText=`left:${Math.random()*100}%;width:${s}px;height:${s}px;animation-duration:${Math.random()*8+7}s;animation-delay:${Math.random()*8}s`;
  bubbles.appendChild(b);
}

/* ---------- MAGNETIC BUTTONS ---------- */
if(!reduce) $$('[data-magnetic]').forEach(el=>{
  el.addEventListener('mousemove',e=>{ const r=el.getBoundingClientRect();
    const x=e.clientX-r.left-r.width/2, y=e.clientY-r.top-r.height/2;
    el.style.transform=`translate(${x*.3}px,${y*.4}px)`;
  });
  el.addEventListener('mouseleave',()=>el.style.transform='');
});

/* ---------- background cutout: remove the studio grey, keep the product ----------
   Border flood-fill: transparency grows inward from the edges and stops at the
   product silhouette, so the white hull (enclosed) is preserved. Same-origin only. */
function cutoutBackground(img, tol=30){
  const w=img.naturalWidth, h=img.naturalHeight; if(!w||!h) return null;
  const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
  const ctx=cv.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(img,0,0);
  let data; try{ data=ctx.getImageData(0,0,w,h); }catch(_){ return null; } // tainted (file://) → skip
  const px=data.data;
  const corner=(x,y)=>{const i=(y*w+x)*4;return [px[i],px[i+1],px[i+2]];};
  const cs=[corner(3,3),corner(w-4,3),corner(3,h-4),corner(w-4,h-4)];
  const bg=[0,1,2].map(k=>Math.round((cs[0][k]+cs[1][k]+cs[2][k]+cs[3][k])/4));
  const t2=tol*tol*3;
  const lum=(r,g,b)=>0.299*r+0.587*g+0.114*b;
  const bgLum=lum(bg[0],bg[1],bg[2]);
  const LCAP=bgLum+16; // protect anything clearly brighter than the studio grey → keep the white hull
  const near=i=>{ const a=px[i]-bg[0],b=px[i+1]-bg[1],c=px[i+2]-bg[2];
    if(a*a+b*b+c*c>t2) return false;
    return lum(px[i],px[i+1],px[i+2]) <= LCAP; }; // brighter-than-bg (white product) is never background
  const seen=new Uint8Array(w*h); const stack=[];
  for(let x=0;x<w;x++){ stack.push(x,(h-1)*w+x); }
  for(let y=0;y<h;y++){ stack.push(y*w,y*w+w-1); }
  while(stack.length){
    const p=stack.pop(); if(seen[p])continue; seen[p]=1;
    const i=p*4; if(!near(i))continue;
    px[i+3]=0;
    const x=p%w, y=(p/w)|0;
    if(x>0 && !seen[p-1])stack.push(p-1);
    if(x<w-1 && !seen[p+1])stack.push(p+1);
    if(y>0 && !seen[p-w])stack.push(p-w);
    if(y<h-1 && !seen[p+w])stack.push(p+w);
  }
  ctx.putImageData(data,0,0);
  return cv;
}
function applyCutout(img, tol){
  if(img.dataset.cut) return false;
  if(!(img.complete && img.naturalWidth>0)) return false;
  const cv=cutoutBackground(img, tol||30);
  if(cv){ img.dataset.cut='1'; try{ img.src=cv.toDataURL('image/png'); }catch(_){} return true; }
  return false;
}

/* ---------- HERO PRODUCT PHOTO (perspective, background removed) ---------- */
const heroPhoto=$('#heroPhoto'), heroWrap=$('#heroRayWrap');
if(heroPhoto){
  const show=()=>{ heroPhoto.style.display='block'; heroWrap.classList.add('has-photo'); applyCutout(heroPhoto,46); };
  if(heroPhoto.complete && heroPhoto.naturalWidth>0) show();
  heroPhoto.addEventListener('load',()=>{ if(!heroPhoto.dataset.cut) show(); });
  heroPhoto.addEventListener('error',()=>{ heroPhoto.remove(); }); // keep animated SVG mark
}

/* ---------- refine a transparent PNG: clear light-grey haze trapped between fine mesh ----------
   Erodes greyish light pixels that touch transparency (the net-hole fills) over a few passes.
   The solid white hull is safe: its interior pixels never touch transparency, so only a ~few-px
   edge is nibbled. Runs on a same-origin RGBA image. */
function refineNetTransparency(img, T=118, iters=3){
  const w=img.naturalWidth, h=img.naturalHeight; if(!w||!h) return;
  const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
  const ctx=cv.getContext('2d',{willReadFrequently:true}); ctx.drawImage(img,0,0);
  let dt; try{ dt=ctx.getImageData(0,0,w,h); }catch(_){ return; }
  const px=dt.data;
  const lumOf=i=>0.299*px[i]+0.587*px[i+1]+0.114*px[i+2];
  for(let it=0; it<iters; it++){
    const clear=[];
    for(let y=1;y<h-1;y++){ for(let x=1;x<w-1;x++){ const p=y*w+x, i=p*4;
      if(px[i+3]===0) continue;
      if(lumOf(i)<=T) continue;                                   // keep dark net strands / floats
      const mx=Math.max(px[i],px[i+1],px[i+2]), mn=Math.min(px[i],px[i+1],px[i+2]);
      if(mx-mn>45) continue;                                      // keep coloured parts (orange)
      if(px[(p-1)*4+3]===0||px[(p+1)*4+3]===0||px[(p-w)*4+3]===0||px[(p+w)*4+3]===0) clear.push(i);
    }}
    if(!clear.length) break;
    for(const i of clear) px[i+3]=0;
  }
  ctx.putImageData(dt,0,0);
  try{ img.src=cv.toDataURL('image/png'); }catch(_){}
}

/* ---------- PRODUCT INTRO PHOTO (FA.png transparent cutout + net-mesh cleanup) ---------- */
const productPhoto=$('#productPhoto');
if(productPhoto){
  const refine=()=>{ if(productPhoto.dataset.refined) return; if(productPhoto.complete && productPhoto.naturalWidth>0){ productPhoto.dataset.refined='1'; refineNetTransparency(productPhoto,118,3); } };
  refine();
  productPhoto.addEventListener('load',()=>{ if(!productPhoto.dataset.refined) refine(); });
  productPhoto.addEventListener('error',()=>productPhoto.remove());
}

/* ---------- 360 VIEWER VIDEO (autoplay in the studio stage; pause off-screen) ---------- */
const viewerVideo=$('#viewerVideo');
if(viewerVideo){
  new IntersectionObserver((e)=>{ if(e[0].isIntersecting){ const pr=viewerVideo.play&&viewerVideo.play(); if(pr&&pr.catch)pr.catch(()=>{}); } else viewerVideo.pause&&viewerVideo.pause(); },{threshold:.05}).observe(viewerVideo);
}

/* ---------- INTERACTIVE 360° PRODUCT VIEWER (drag / slider / touch, crossfade, lazy) ---------- */
const vStage=$('#viewerStage'), V360=$('#viewer360');
if(V360){
  const imgs=[...V360.querySelectorAll('.v360-img')]; const N=imgs.length;
  const chips=$$('#v360Views .view-chip'); const slider=$('#v360Slider');
  const norm=v=>((v%N)+N)%N;
  let pos=0, zoom=1, loaded=false, animRAF=null;

  function render(){
    const base=Math.floor(pos), frac=pos-base, lo=norm(base), hi=norm(base+1);
    imgs.forEach((im,i)=>{ im.style.opacity = i===lo?(1-frac).toFixed(3) : (i===hi?frac.toFixed(3):'0'); });
    const near=norm(Math.round(pos));
    chips.forEach((c,i)=>c.classList.toggle('is-active',i===near));
    if(document.activeElement!==slider) slider.value=norm(pos);
  }
  function setZoom(z){ zoom=clamp(z,.7,1.9); V360.style.transform=`scale(${zoom})`; }
  function loadAll(){ if(loaded)return; loaded=true; imgs.forEach(im=>{ if(im.dataset.src && !im.getAttribute('src')) im.src=im.dataset.src; }); }
  // Lazy: load the frames only when the viewer scrolls near the viewport
  new IntersectionObserver((e)=>{ if(e[0].isIntersecting) loadAll(); },{rootMargin:'300px'}).observe(vStage);
  // graceful fallback if the product images aren't present yet
  const failFallback=()=>{ const fb=$('#v360Fallback'); if(fb)fb.hidden=false; V360.style.display='none'; };
  imgs[0].addEventListener('error',failFallback);
  if(imgs[0].complete && imgs[0].naturalWidth===0) failFallback();  // already failed before listener attached

  // remove the studio-grey background from every frame → product only
  imgs.forEach(im=>{
    const cut=()=>{ if(!im.dataset.cut){ applyCutout(im,46); render(); } };
    if(im.complete && im.naturalWidth>0) cut();
    im.addEventListener('load',cut);
  });

  // framer-motion-like smooth fade when jumping to a view (chips)
  function animateTo(target){ cancelAnimationFrame(animRAF); loadAll();
    let d=norm(target)-norm(pos); if(d>N/2)d-=N; if(d<-N/2)d+=N;
    const from=pos, end=pos+d, t0=performance.now(), dur=460;
    const step=(now)=>{ const p=clamp((now-t0)/dur,0,1), e=1-Math.pow(1-p,3); pos=from+(end-from)*e; render();
      if(p<1) animRAF=requestAnimationFrame(step); else { pos=norm(end); render(); } };
    animRAF=requestAnimationFrame(step);
  }
  chips.forEach(c=>c.addEventListener('click',()=>animateTo(+c.dataset.idx)));
  slider.addEventListener('input',()=>{ cancelAnimationFrame(animRAF); loadAll(); pos=+slider.value; render(); });

  // drag / swipe to rotate 360° through all views, with momentum (pointer = mouse + touch)
  let dragging=false, lastX=0, vel=0, lastT=0, moved=false, momRAF=null;
  V360.addEventListener('pointerdown',e=>{ dragging=true;moved=false;lastX=e.clientX;vel=0;lastT=performance.now();
    loadAll(); cancelAnimationFrame(animRAF); cancelAnimationFrame(momRAF); try{V360.setPointerCapture(e.pointerId);}catch(_){} });
  V360.addEventListener('pointermove',e=>{ if(!dragging)return; const now=performance.now(), dx=e.clientX-lastX; if(Math.abs(dx)>2)moved=true; lastX=e.clientX;
    const sens=Math.max(70, vStage.clientWidth/4.5), dp=-dx/sens; pos+=dp; const dt=Math.max(1,now-lastT); vel=dp*16/dt; lastT=now; render(); });
  function momentum(){ vel*=0.92; pos+=vel; render(); if(Math.abs(vel)>0.0025) momRAF=requestAnimationFrame(momentum); else animateTo(norm(Math.round(pos))); }
  const endDrag=()=>{ if(!dragging)return; dragging=false; if(!moved)return; if(Math.abs(vel)>0.012) momentum(); else animateTo(norm(Math.round(pos))); };
  V360.addEventListener('pointerup',endDrag);
  V360.addEventListener('pointercancel',endDrag);
  V360.addEventListener('pointerleave',endDrag);

  $('#zoomIn').addEventListener('click',()=>setZoom(zoom+.15));
  $('#zoomOut').addEventListener('click',()=>setZoom(zoom-.15));
  const hudToggle=$('#hudToggle');
  if(hudToggle) hudToggle.addEventListener('click',()=>{ hudToggle.classList.toggle('is-active'); vStage.classList.toggle('show-hud'); });

  imgs[0].complete ? render() : imgs[0].addEventListener('load',render);
  render();
}

/* ---------- COLLECTION FLOW (scroll-driven step highlight) ---------- */
const csteps=$$('.cstep'), collectLine=$('#collectLine'), collectSection=$('#collect'), collectRay=$('.collect__ray');
function collectProgress(){
  const r=collectSection.getBoundingClientRect();
  const p=clamp((innerHeight*.7-r.top)/(r.height*.6),0,1);
  const idx=Math.min(csteps.length-1,Math.floor(p*csteps.length));
  csteps.forEach((c,i)=>c.classList.toggle('active',i<=idx && r.top<innerHeight));
  collectLine.style.width=(p*100)+'%';
  collectRay.style.left=`calc(${p*90}% )`;
}
addEventListener('scroll',collectProgress,{passive:true});

/* ---------- CORE TECH: scan pipeline + point cloud ---------- */
const scanSteps=$$('#scanSteps li'), scanSection=$('#tech'),
      scanReadout=$('#scanReadout'), scanThermal=$('#scanThermal'), scanPoints=$('#scanPoints');
const readouts=['INITIALIZING SENSORS…','THERMAL LOCK ACQUIRED','BUILDING POINT CLOUD…','MESH RECONSTRUCTED','AI CLASSIFYING OBJECTS','POLLUTION MAPPED','ROUTE OPTIMIZED','AUTONOMOUS COLLECTION'];
function scanProgress(){
  const r=scanSection.getBoundingClientRect();
  const p=clamp((innerHeight*.6-r.top)/(r.height*.5),0,1);
  const idx=clamp(Math.floor(p*8),0,7);
  scanSteps.forEach((li,i)=>li.classList.toggle('active',i<=idx && r.top<innerHeight));
  if(r.top<innerHeight&&r.bottom>0){
    scanReadout.textContent=readouts[idx];   // live THERMAL / POINTS are driven by the scan canvas
  }
}
addEventListener('scroll',scanProgress,{passive:true});

// ===== S3V · seafloor digital-twin scan (3D point-cloud terrain + thermal heatmap + scan beam) =====
const pc=$('#pointCloud'), pctx=pc.getContext('2d');
const scanVizEl=document.querySelector('.scan-viz');
let pcW=0,pcH=0; const pcDpr=Math.min(devicePixelRatio||1,2);
function sizePC(){ pcW=pc.offsetWidth; pcH=pc.offsetHeight; pc.width=Math.round(pcW*pcDpr); pc.height=Math.round(pcH*pcDpr); pctx.setTransform(pcDpr,0,0,pcDpr,0,0); }
let pcReady=false, pcFrame=0, scanPulse=0, pointsAcc=18400, mvx=-1, mvy=-1, mvHover=false;
const scanRayWrap=$('#scanRayWrap'); let rayOffX=0, rayOffY=0, rayTX=0, rayTY=0;
if(scanVizEl){
  scanVizEl.addEventListener('pointermove',e=>{ const r=scanVizEl.getBoundingClientRect(); mvx=e.clientX-r.left; mvy=e.clientY-r.top; mvHover=true;
    rayTX=clamp((mvx-r.width/2)*0.18,-r.width*0.22,r.width*0.22); rayTY=clamp((mvy-r.height*0.42)*0.16,-r.height*0.16,r.height*0.22); });
  scanVizEl.addEventListener('pointerleave',()=>{ mvHover=false; mvx=mvy=-1; rayTX=0; rayTY=0; });
}
const COLS=26, ROWS=16;
const HOT=[{x:-0.45,z:0.32,t:29.4,ph:0},{x:0.48,z:0.58,t:32.1,ph:2.1},{x:0.02,z:0.82,t:26.8,ph:4.2}];
const terrainH=(gx,gz,t)=> Math.sin(gx*2.6+gz*3.1)*0.5 + Math.sin(gx*5.1-gz*4.0+t*0.25)*0.2 + Math.cos(gx*1.3-gz*2.2+t*0.14)*0.28;
function proj(gx,gz,hh){ const r=gz, ry=pcH*0.24+(pcH*0.72)*Math.pow(r,1.5), s=0.2+r*0.95; return {x:pcW*0.5+gx*(pcW*0.52)*s, y:ry-hh*s*44, s, d:r}; }
function drawScan(){
  if(!pcReady){ requestAnimationFrame(drawScan); return; }
  const t=performance.now()*0.001; pcFrame++;
  pctx.clearRect(0,0,pcW,pcH);
  scanPulse=(scanPulse+0.006)%1;
  // scan origin (world) — follows cursor on hover, else slow auto-sweep
  let sgx,sgz;
  if(mvHover){ sgz=clamp(Math.pow(clamp((mvy-pcH*0.24)/(pcH*0.72),0,1),1/1.5),0,1); const s=0.2+sgz*0.95; sgx=clamp((mvx-pcW*0.5)/((pcW*0.52)*s),-1,1); }
  else { sgz=0.55+0.28*Math.sin(t*0.5); sgx=0.55*Math.sin(t*0.33); }
  // build terrain vertices
  const V=new Array(ROWS);
  for(let r=0;r<ROWS;r++){ V[r]=new Array(COLS);
    for(let c=0;c<COLS;c++){ const gx=(c/(COLS-1))*2-1, gz=r/(ROWS-1), hh=terrainH(gx,gz,t), p=proj(gx,gz,hh);
      const dd=Math.hypot(gx-sgx,(gz-sgz)*1.5), ring=Math.max(0,1-Math.abs(dd-scanPulse*1.7)*3.5), nearG=Math.max(0,1-dd*1.2);
      let heat=0; for(const hs of HOT){ const hd=Math.hypot(gx-hs.x,(gz-hs.z)*1.5); heat+=Math.max(0,1-hd*2.3)*(0.6+0.4*Math.sin(t*1.4+hs.ph)); }
      p.hh=hh; p.glow=Math.min(1,ring*0.9+nearG*0.5); p.heat=Math.min(1,heat); V[r][c]=p; }
  }
  // wireframe terrain grid (height + scan glow tinted; contour feel)
  pctx.lineWidth=0.7;
  const seg=(a,b)=>{ const d=(a.d+b.d)/2, g=(a.glow+b.glow)/2, ht=(a.heat+b.heat)/2, hn=(a.hh+b.hh)/2; const base=0.04+d*0.16; let R,G,B,A;
    if(ht>0.14){ R=255; G=110+ht*50; B=50; A=base+ht*0.5; } else { const br=0.35+hn*0.3+g*0.65; R=50+br*70; G=165+br*75; B=235; A=base+g*0.6; }
    pctx.strokeStyle='rgba('+(R|0)+','+(G|0)+','+(B|0)+','+Math.min(0.85,A).toFixed(3)+')'; pctx.beginPath(); pctx.moveTo(a.x,a.y); pctx.lineTo(b.x,b.y); pctx.stroke(); };
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){ const a=V[r][c]; if(c<COLS-1)seg(a,V[r][c+1]); if(r<ROWS-1)seg(a,V[r+1][c]); }
  // point cloud vertices
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){ const a=V[r][c], sz=0.6+a.d*1.5;
    pctx.fillStyle = a.heat>0.2 ? 'rgba(255,'+((120+a.heat*60)|0)+',60,'+(0.3+a.heat*0.6).toFixed(2)+')' : 'rgba(127,215,255,'+(0.14+a.d*0.24+a.glow*0.6).toFixed(2)+')';
    pctx.fillRect(a.x-sz/2,a.y-sz/2,sz,sz); }
  // additive: thermal heat blobs + expanding scan ring
  pctx.globalCompositeOperation='lighter';
  for(const hs of HOT){ const p=proj(hs.x,hs.z,terrainH(hs.x,hs.z,t)), rr=28+p.s*58, pu=0.5+0.5*Math.sin(t*1.4+hs.ph);
    const gr=pctx.createRadialGradient(p.x,p.y,0,p.x,p.y,rr); gr.addColorStop(0,'rgba(255,120,40,'+(0.2*pu).toFixed(2)+')'); gr.addColorStop(.5,'rgba(255,60,30,'+(0.07*pu).toFixed(2)+')'); gr.addColorStop(1,'rgba(255,0,0,0)');
    pctx.fillStyle=gr; pctx.beginPath(); pctx.arc(p.x,p.y,rr,0,7); pctx.fill(); }
  const so=proj(sgx,sgz,terrainH(sgx,sgz,t)), rr2=scanPulse*pcW*0.55;
  pctx.strokeStyle='rgba(120,230,255,'+((1-scanPulse)*0.5).toFixed(2)+')'; pctx.lineWidth=1.4; pctx.beginPath(); pctx.ellipse(so.x,so.y,rr2,rr2*0.38,0,0,7); pctx.stroke();
  pctx.globalCompositeOperation='source-over';
  // product drifts toward the cursor; the beam originates from it (kept in sync, smoothed)
  rayOffX=lerp(rayOffX,rayTX,0.1); rayOffY=lerp(rayOffY,rayTY,0.1);
  if(scanRayWrap) scanRayWrap.style.transform='translate(-50%,-50%) translate('+rayOffX.toFixed(1)+'px,'+rayOffY.toFixed(1)+'px)';
  // collection / scan beam from the robot down to the scan origin
  const rayx=pcW*0.5+rayOffX, rayy=pcH*0.42+rayOffY, bA=mvHover?0.55:0.3;
  const gb=pctx.createLinearGradient(rayx,rayy,so.x,so.y); gb.addColorStop(0,'rgba(255,150,60,'+bA+')'); gb.addColorStop(1,'rgba(255,120,40,0.02)');
  pctx.fillStyle=gb; pctx.beginPath(); pctx.moveTo(rayx-5,rayy); pctx.lineTo(so.x-16,so.y); pctx.lineTo(so.x+16,so.y); pctx.lineTo(rayx+5,rayy); pctx.closePath(); pctx.fill();
  pctx.strokeStyle='rgba(255,160,70,'+(bA*0.5).toFixed(2)+')'; pctx.lineWidth=0.7;
  for(let i=-3;i<=3;i++){ pctx.beginPath(); pctx.moveTo(rayx,rayy); pctx.lineTo(so.x+i*5,so.y); pctx.stroke(); }
  pctx.fillStyle='rgba(255,190,90,0.95)'; pctx.beginPath(); pctx.arc(so.x,so.y,2.6,0,7); pctx.fill();
  // hover: targeting reticle + live analysis readout
  if(mvHover){
    pctx.strokeStyle='rgba(127,229,255,0.9)'; pctx.lineWidth=1.2;
    pctx.beginPath(); pctx.arc(so.x,so.y,15,0,7); pctx.stroke();
    pctx.beginPath(); [[-20,0,-7,0],[7,0,20,0],[0,-20,0,-7],[0,7,0,20]].forEach(l=>{pctx.moveTo(so.x+l[0],so.y+l[1]);pctx.lineTo(so.x+l[2],so.y+l[3]);}); pctx.stroke();
    const depth=(38+terrainH(sgx,sgz,t)*7+sgz*6).toFixed(1);
    let tp=24.2; for(const hs of HOT){ if(Math.hypot(sgx-hs.x,(sgz-hs.z)*1.5)<0.5) tp=Math.max(tp,hs.t); } tp=(tp+Math.sin(t*3)*0.3).toFixed(1);
    const bx=Math.min(pcW-122, so.x+22), by=Math.max(8, so.y-48);
    pctx.fillStyle='rgba(4,16,31,0.85)'; roundRect(pctx,bx,by,112,42,6); pctx.fill();
    pctx.strokeStyle='rgba(127,215,255,0.4)'; pctx.lineWidth=1; roundRect(pctx,bx,by,112,42,6); pctx.stroke();
    pctx.font='600 10px "Space Grotesk",system-ui,sans-serif'; pctx.textBaseline='top';
    pctx.fillStyle='#7fd7ff'; pctx.fillText('DEPTH   '+depth+' m', bx+9, by+8);
    pctx.fillStyle='#ffa15c'; pctx.fillText('THERMAL '+tp+' °C', bx+9, by+23);
  }
  // section identity label
  pctx.font='600 9px "Space Grotesk",system-ui,sans-serif'; pctx.textAlign='center'; pctx.textBaseline='alphabetic';
  pctx.fillStyle='rgba(127,215,255,0.32)'; pctx.fillText('S3V · SEAFLOOR DIGITAL TWIN', pcW/2, pcH-14); pctx.textAlign='left';
  // live HUD numbers
  if(pcFrame%4===0){
    pointsAcc += mvHover?260:70; if(pointsAcc>999000)pointsAcc=18400;
    scanPoints.textContent=Math.round(pointsAcc).toLocaleString();
    let temp=24.5+1.8*Math.sin(t*0.7);
    for(const hs of HOT){ if(Math.hypot(sgx-hs.x,(sgz-hs.z))<0.4) temp=hs.t+Math.sin(t*2+hs.ph); }
    scanThermal.textContent=temp.toFixed(1);
  }
  requestAnimationFrame(drawScan);
}
new IntersectionObserver((e)=>{ pcReady=e[0].isIntersecting; if(pcReady)sizePC(); }).observe(pc);
drawScan(); addEventListener('resize',()=>{if(pcReady)sizePC();});

/* ---------- OCEAN SIMULATOR ---------- */
const simCv=$('#simCanvas'), sctx=simCv.getContext('2d');
const wave=$('#wave'),wind=$('#wind'),current=$('#current'),trash=$('#trash');
const wvVal=$('#wvVal'),wdVal=$('#wdVal'),cuVal=$('#cuVal'),trVal=$('#trVal');
const simEff=$('#simEff'),simStab=$('#simStab'),simStatus=$('#simStatus');
let simReady=false;
function sizeSim(){ simCv.width=simCv.offsetWidth; simCv.height=simCv.offsetHeight; }
new IntersectionObserver(e=>{simReady=e[0].isIntersecting;if(simReady)sizeSim();}).observe(simCv);
addEventListener('resize',()=>{if(simReady)sizeSim();});
// trash particles for sim
const simTrash=[]; function seedTrash(){ simTrash.length=0; const n=Math.floor(+trash.value/100*40)+4;
  for(let i=0;i<n;i++)simTrash.push({x:Math.random(),y:Math.random()*.5+.35,vx:0,collected:false});
}
seedTrash();
[wave,wind,current,trash].forEach(inp=>inp.addEventListener('input',updateSim));
const envDescs={harbor:'복잡한 선박 동선 속에서도 정밀 회피 항법으로 부유물을 수거합니다.',
  river:'하천 유속과 부유 쓰레기 흐름을 예측해 상류에서부터 정화합니다.',
  reservoir:'정체된 수역의 녹조·부유물을 넓은 반경으로 순환 수거합니다.',
  coast:'파도와 조류가 강한 연안에서도 유선형 바디로 안정 운항합니다.'};
let simEnv='harbor';
$$('.env-tab').forEach(t=>t.addEventListener('click',()=>{
  $$('.env-tab').forEach(x=>x.classList.remove('is-active')); t.classList.add('is-active');
  simEnv=t.dataset.env; $('#envDesc').textContent=envDescs[simEnv];
}));
function updateSim(){
  const wv=(+wave.value/100*4).toFixed(1); wvVal.textContent=wv+' m';
  wdVal.textContent=Math.round(+wind.value/100*40)+' kn';
  const dirs=['↙ SW','↓ S','↘ SE','→ E','↗ NE','↑ N']; cuVal.textContent=dirs[Math.floor(+current.value/100*(dirs.length-1))];
  trVal.textContent=+trash.value<33?'적음':+trash.value<66?'보통':'많음';
  // efficiency inversely affected by waves+wind, positively by fewer trash
  const eff=Math.round(clamp(99-(+wave.value*.18)-(+wind.value*.12),55,99));
  simEff.textContent=eff+'%';
  const stab=(+wave.value+ +wind.value)/2;
  simStab.textContent=stab<35?'HIGH':stab<65?'MEDIUM':'LOW';
  simStatus.textContent=eff>85?'OPTIMAL':eff>70?'ACTIVE':'CAUTION';
  simStatus.style.color=eff>85?'#7fd7ff':eff>70?'#ffa15c':'#ff7a29';
  seedTrash();
}
updateSim();
// sim ray
const simRay={x:.5,y:.6,tx:.5};
let simT=0;
function drawSim(){
  if(!simReady){requestAnimationFrame(drawSim);return;}
  const w=simCv.width,h=simCv.height; sctx.clearRect(0,0,w,h);
  // env background tint
  const bg={harbor:['#0a3358','#04101f'],river:['#0d3a3a','#04121a'],reservoir:['#123a2a','#04140f'],coast:['#0a4d7a','#041826']}[simEnv];
  const g=sctx.createLinearGradient(0,0,0,h); g.addColorStop(0,bg[0]); g.addColorStop(1,bg[1]); sctx.fillStyle=g; sctx.fillRect(0,0,w,h);
  // water surface waves
  const amp=+wave.value/100*22+4, waterY=h*.28;
  sctx.beginPath(); sctx.moveTo(0,h);
  for(let x=0;x<=w;x+=8){ const y=waterY+Math.sin(x*.02+simT*.05)*amp+Math.sin(x*.05-simT*.03)*amp*.4; sctx.lineTo(x,y); }
  sctx.lineTo(w,h); sctx.closePath();
  sctx.fillStyle='rgba(20,90,150,.35)'; sctx.fill();
  // current arrows
  const cdir=(+current.value/100-.5)*2;
  // trash update
  simTrash.forEach(tp=>{ if(tp.collected)return; tp.x+=cdir*.0008*(+current.value/50)+ .0004;
    if(tp.x>1)tp.x=0; if(tp.x<0)tp.x=1;
    const px=tp.x*w, py=tp.y*h;
    // collect if near ray
    const rx=simRay.x*w, ry=simRay.y*h;
    if(Math.hypot(px-rx,py-ry)<40){tp.collected=true; setTimeout(()=>{tp.collected=false;tp.x=Math.random();},2500);}
    sctx.fillStyle='rgba(255,122,41,.85)'; sctx.beginPath(); sctx.arc(px,py,3,0,7); sctx.fill();
  });
  // ray seeks nearest trash
  let nearest=null,nd=9;
  simTrash.forEach(tp=>{if(tp.collected)return;const d=Math.abs(tp.x-simRay.x); if(d<nd){nd=d;nearest=tp;}});
  if(nearest)simRay.tx=nearest.x;
  simRay.x=lerp(simRay.x,simRay.tx,.02);
  simRay.y=.55+Math.sin(simT*.03)*.04*(+wave.value/50);
  const rx=simRay.x*w, ry=simRay.y*h;
  // detection ring
  sctx.strokeStyle='rgba(127,215,255,.3)';sctx.beginPath();sctx.arc(rx,ry,40,0,7);sctx.stroke();
  // draw ray body
  sctx.save(); sctx.translate(rx,ry); sctx.scale(cdir>=0?1:1,1);
  sctx.fillStyle='#4aa9ee';
  sctx.beginPath();
  sctx.moveTo(0,-10); sctx.quadraticCurveTo(28,-8,44,6); sctx.quadraticCurveTo(20,0,12,4);
  sctx.quadraticCurveTo(8,18,0,26); sctx.quadraticCurveTo(-8,18,-12,4);
  sctx.quadraticCurveTo(-20,0,-44,6); sctx.quadraticCurveTo(-28,-8,0,-10); sctx.fill();
  sctx.restore();
  simT++; requestAnimationFrame(drawSim);
}
drawSim();

/* ---------- BEFORE / AFTER SLIDER ---------- */
const baWrap=$('#baWrap'), baAfter=$('#baAfter'), baHandle=$('#baHandle'), baGrime=$('#baGrime');
let baDrag=false;
// keep the "after" image at full wrapper width so it stays aligned while the panel is clipped
function syncBAWidth(){ baWrap.style.setProperty('--ba-w', baWrap.getBoundingClientRect().width+'px'); }
function setBA(clientX){ const r=baWrap.getBoundingClientRect(); const p=clamp((clientX-r.left)/r.width,0,1);
  baAfter.style.width=(p*100)+'%'; baHandle.style.left=(p*100)+'%'; }
baWrap.addEventListener('pointerdown',e=>{baDrag=true;setBA(e.clientX);});
addEventListener('pointermove',e=>{if(baDrag)setBA(e.clientX);});
addEventListener('pointerup',()=>baDrag=false);

/* --- generate the "polluted" overlay from the SAME frame: murk + floating trash --- */
// seeded RNG so the debris layout is stable across resizes (doesn't reshuffle)
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function drawGrime(){
  if(!baGrime)return; const g=baGrime.getContext('2d');
  const r=baWrap.getBoundingClientRect(); const W=r.width, H=r.height; if(!W||!H)return;
  const dpr=Math.min(devicePixelRatio||1,2);
  baGrime.width=W*dpr; baGrime.height=H*dpr; g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,W,H);
  const rnd=mulberry32(20260701);
  // 1) murky turbidity veil (green-brown algae water)
  const veil=g.createLinearGradient(0,0,0,H);
  veil.addColorStop(0,'rgba(58,66,30,.30)'); veil.addColorStop(.5,'rgba(42,52,28,.42)'); veil.addColorStop(1,'rgba(30,40,22,.52)');
  g.fillStyle=veil; g.fillRect(0,0,W,H);
  // brown algae blotches
  for(let i=0;i<9;i++){ const x=rnd()*W,y=rnd()*H,rad=40+rnd()*90;
    const bl=g.createRadialGradient(x,y,0,x,y,rad); bl.addColorStop(0,'rgba(90,84,36,.28)'); bl.addColorStop(1,'rgba(90,84,36,0)');
    g.fillStyle=bl; g.beginPath(); g.arc(x,y,rad,0,7); g.fill(); }
  // 2) suspended particles (turbidity)
  for(let i=0;i<260;i++){ g.fillStyle=`rgba(${140+rnd()*40|0},${120+rnd()*40|0},${70+rnd()*30|0},${.1+rnd()*.25})`;
    const s=rnd()*2+.4; g.fillRect(rnd()*W,rnd()*H,s,s); }
  // 3) suspended turbidity (the macro trash is now REAL photographic debris in #baDebris)
  const murk=['150,150,118','122,142,112','162,150,110','120,120,120'];
  for(let i=0;i<80;i++){ g.fillStyle='rgba('+murk[(rnd()*murk.length)|0]+','+(.1+rnd()*.28)+')';
    const s=rnd()*3+.6; g.fillRect(rnd()*W,rnd()*H,s,s*(.6+rnd())); }
  g.globalAlpha=1;
  // 4) faint oily surface sheen up top
  const sheen=g.createLinearGradient(0,0,W*.3,H*.15); sheen.addColorStop(0,'rgba(180,140,200,.06)'); sheen.addColorStop(.5,'rgba(120,180,150,.05)'); sheen.addColorStop(1,'rgba(180,140,200,0)');
  g.fillStyle=sheen; g.fillRect(0,0,W,H*.35);
}
function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function syncBA(){ syncBAWidth(); drawGrime(); }
syncBA(); addEventListener('resize',syncBA);
// redraw once images/layout settle and when the section scrolls into view
addEventListener('load',syncBA);
new IntersectionObserver((e)=>{ if(e[0].isIntersecting) drawGrime(); }).observe(baWrap);

// real photographic floating debris (plastic bottles + styrofoam cups) over the polluted side
const baDebris=$('#baDebris');
if(baDebris){
  const items=[
    {t:'bottle',x:58,y:30,w:44,r:38},{t:'bottle',x:80,y:64,w:34,r:-24},{t:'bottle',x:66,y:82,w:38,r:105},
    {t:'cup',x:70,y:46,w:30,r:-14},{t:'cup',x:90,y:26,w:26,r:22},{t:'cup',x:54,y:60,w:26,r:8},
    {t:'bottle',x:94,y:78,w:30,r:70},{t:'cup',x:82,y:88,w:24,r:-30}
  ];
  items.forEach((it,i)=>{
    const d=document.createElement('div');
    d.className='debris debris--'+it.t;
    const h = it.t==='bottle' ? it.w*2.4 : it.w*1.5;   // bottle tall, cup crop ~150x260
    d.style.cssText=`left:${it.x}%;top:${it.y}%;width:${it.w}px;height:${h}px;--r:${it.r}deg;transform:rotate(${it.r}deg);`
      +`animation:debrisFloat ${6+i%4}s ease-in-out ${i*0.4}s infinite`;
    baDebris.appendChild(d);
  });
}

/* ---------- ACCORDION ---------- */
$$('.acc-item').forEach(item=>{
  $('.acc-q',item).addEventListener('click',()=>{
    const open=item.classList.contains('open');
    $$('.acc-item').forEach(x=>{x.classList.remove('open');$('.acc-a',x).style.maxHeight=null;});
    if(!open){item.classList.add('open'); const a=$('.acc-a',item); a.style.maxHeight=a.scrollHeight+'px';}
  });
});

/* ---------- DOWNLOADS (simulated) ---------- */
$$('.dl-item').forEach(d=>d.addEventListener('click',e=>{e.preventDefault();
  const name=d.dataset.dl; const orig=$('span',d).textContent;
  $('span',d).textContent='준비 중… ('+name+')';
  setTimeout(()=>$('span',d).textContent=orig,1600);
}));

/* ---------- QUOTE FORM ---------- */
const quoteForm=$('#quoteForm'), quoteDone=$('#quoteDone');
quoteForm.addEventListener('submit',e=>{ e.preventDefault();
  if(!quoteForm.checkValidity()){quoteForm.reportValidity();return;}
  quoteDone.classList.add('show');
  setTimeout(()=>{quoteDone.classList.remove('show');quoteForm.reset();},3600);
});

/* ---------- BOOKING CALENDAR ---------- */
const calGrid=$('#calGrid'), calTitle=$('#calTitle'), calTimes=$('#calTimes'),
      bookConfirm=$('#bookConfirm'), bookMsg=$('#bookMsg');
let viewY=2026, viewM=6; // July 2026 (0-indexed)
let selDate=null, selTime=null;
const times=['10:00','11:00','13:00','14:00','15:00','16:00'];
function renderCal(){
  calTitle.textContent=`${viewY} · ${viewM+1}월`;
  calGrid.innerHTML='';
  const first=new Date(viewY,viewM,1).getDay();
  const days=new Date(viewY,viewM+1,0).getDate();
  const today=new Date(2026,6,1); // fixed "today"
  for(let i=0;i<first;i++)calGrid.appendChild(document.createElement('span'));
  for(let d=1;d<=days;d++){
    const b=document.createElement('button'); b.textContent=d;
    const date=new Date(viewY,viewM,d); const dow=date.getDay();
    if(date<today || dow===0){ b.disabled=true; }
    b.addEventListener('click',()=>{
      $$('.cal__grid button').forEach(x=>x.classList.remove('selected')); b.classList.add('selected');
      selDate=`${viewY}.${viewM+1}.${d}`; selTime=null; renderTimes(); checkBook();
    });
    calGrid.appendChild(b);
  }
}
function renderTimes(){
  calTimes.innerHTML='';
  times.forEach(t=>{ const b=document.createElement('button'); b.className='time-slot'; b.textContent=t;
    b.addEventListener('click',()=>{$$('.time-slot').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');selTime=t;checkBook();});
    calTimes.appendChild(b);
  });
}
function checkBook(){ bookConfirm.disabled=!(selDate&&selTime); }
$('#calPrev').addEventListener('click',()=>{viewM--;if(viewM<0){viewM=11;viewY--;}renderCal();});
$('#calNext').addEventListener('click',()=>{viewM++;if(viewM>11){viewM=0;viewY++;}renderCal();});
bookConfirm.addEventListener('click',()=>{ bookMsg.textContent=`✓ ${selDate} ${selTime} 상담이 예약되었습니다.`;
  bookConfirm.disabled=true; });
renderCal();

/* ---------- CHAT ---------- */
const chatFab=$('#chatFab'), chatPanel=$('#chatPanel'), chatBody=$('#chatBody'),
      chatInput=$('#chatInput'), chatSend=$('#chatSend');
chatFab.addEventListener('click',()=>chatPanel.classList.toggle('open'));
$('#chatClose').addEventListener('click',()=>chatPanel.classList.remove('open'));
const botReplies={
  '제품 문의':'ARK-FLUID는 가오리 유체역학 구조의 무인 해상 정화 플랫폼입니다. 항만·하천·저수지·연안에서 자율 운항하며 정화합니다. 원하시는 운용 환경을 알려주세요!',
  '견적 문의':'견적은 운용 수역 규모와 대수에 따라 달라집니다. 하단 “견적 문의” 폼을 작성해 주시면 전문 컨설턴트가 24시간 내 연락드립니다.',
  '기술 상담':'AI Vision, 열화상 추적, 3D 해양 매핑, 자율 항법 등 어떤 기술이 궁금하신가요? 데모 세션도 안내해 드릴 수 있습니다.',
  '유지보수 문의':'곡면 바디는 고압수 세척이 용이하며, 내부 배선/카메라 설계로 유지보수가 간편합니다. 정기 점검 패키지도 제공됩니다.'
};
function addMsg(text,who){ const m=document.createElement('div'); m.className='chat-msg chat-msg--'+who; m.textContent=text; chatBody.appendChild(m); chatBody.scrollTop=chatBody.scrollHeight; }
function botReply(q){
  const typing=document.createElement('div'); typing.className='chat-msg chat-msg--bot'; typing.textContent='…'; chatBody.appendChild(typing); chatBody.scrollTop=chatBody.scrollHeight;
  setTimeout(()=>{ typing.remove(); addMsg(botReplies[q]|| '문의 감사합니다! 담당자가 곧 도와드리겠습니다. 견적 문의 폼을 남겨주시면 더 빠르게 안내 가능합니다.','bot'); },700);
}
$$('#chatQuick button').forEach(b=>b.addEventListener('click',()=>{addMsg(b.dataset.q,'user');botReply(b.dataset.q);}));
function sendChat(){ const v=chatInput.value.trim(); if(!v)return; addMsg(v,'user'); chatInput.value=''; botReply(v); }
chatSend.addEventListener('click',sendChat);
chatInput.addEventListener('keydown',e=>{if(e.key==='Enter')sendChat();});

/* ---------- AMBIENT SOUND (WebAudio synthesized ocean) ---------- */
const soundToggle=$('#soundToggle'); let audioCtx=null, soundOn=false, noiseNode=null;
function initAudio(){
  audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  const bufferSize=2*audioCtx.sampleRate;
  const buffer=audioCtx.createBuffer(1,bufferSize,audioCtx.sampleRate);
  const data=buffer.getChannelData(0);
  let lastOut=0;
  for(let i=0;i<bufferSize;i++){ const white=Math.random()*2-1; data[i]=(lastOut+(.02*white))/1.02; lastOut=data[i]; data[i]*=3.5; }
  noiseNode=audioCtx.createBufferSource(); noiseNode.buffer=buffer; noiseNode.loop=true;
  const filter=audioCtx.createBiquadFilter(); filter.type='lowpass'; filter.frequency.value=550;
  const gain=audioCtx.createGain(); gain.gain.value=0;
  // slow LFO for wave swell
  const lfo=audioCtx.createOscillator(); lfo.frequency.value=.12; const lfoGain=audioCtx.createGain(); lfoGain.gain.value=.06;
  lfo.connect(lfoGain); lfoGain.connect(gain.gain);
  noiseNode.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
  noiseNode.start(); lfo.start();
  gain.gain.linearRampToValueAtTime(.11, audioCtx.currentTime+2);
}
soundToggle.addEventListener('click',()=>{
  if(!audioCtx)initAudio();
  soundOn=!soundOn;
  soundToggle.classList.toggle('playing',soundOn);
  if(audioCtx) audioCtx[soundOn?'resume':'suspend']();
});

/* ---------- IMMERSIVE FLOATING DEBRIS (parallax depth) ---------- */
const parallaxEls=[];
function addDebrisField(sel, defs){
  const sec=$(sel); if(!sec)return;
  const field=document.createElement('div'); field.className='debris-field';
  defs.forEach((d,i)=>{
    const wrap=document.createElement('div');            // outer = JS parallax transform
    wrap.style.cssText=`position:absolute;left:${d.x}%;top:${d.y}%;will-change:transform`;
    wrap.dataset.speed=d.sp;
    const el=document.createElement('div');              // inner = slow CSS bob + rotation
    el.className='float-debris debris--'+d.t;
    const h=d.t==='bottle'?d.w*2.4:d.w*1.5;
    el.style.cssText=`width:${d.w}px;height:${h}px;opacity:${d.o};--r:${d.r}deg;`
      +`animation:debrisFloat ${9+i%5}s ease-in-out ${i*0.5}s infinite`;
    wrap.appendChild(el); field.appendChild(wrap); parallaxEls.push(wrap);
  });
  sec.appendChild(field);
}
addDebrisField('#dive',[
  {t:'bottle',x:12,y:22,w:38,r:40,o:.42,sp:0.14},
  {t:'cup',x:82,y:40,w:30,r:-18,o:.36,sp:0.22},
  {t:'bottle',x:70,y:72,w:28,r:120,o:.3,sp:0.08}
]);
addDebrisField('#product',[
  {t:'cup',x:6,y:18,w:26,r:16,o:.28,sp:0.18},
  {t:'bottle',x:91,y:58,w:32,r:-50,o:.32,sp:0.10}
]);
addDebrisField('#points',[
  {t:'bottle',x:5,y:12,w:28,r:70,o:.22,sp:0.2},
  {t:'cup',x:95,y:82,w:24,r:-24,o:.22,sp:0.12}
]);
function updateParallax(){
  const vh=innerHeight;
  for(const w of parallaxEls){
    const r=w.getBoundingClientRect();
    if(r.bottom<-240||r.top>vh+240)continue;
    const fromCenter=(r.top+r.height/2)-vh/2;
    w.style.transform=`translateY(${(-fromCenter*(+w.dataset.speed)).toFixed(1)}px)`;
  }
}
addEventListener('scroll',updateParallax,{passive:true});
addEventListener('resize',updateParallax);

/* ---------- LENIS SMOOTH SCROLL (inertia) ---------- */
if(!reduce && window.Lenis){
  lenis=new Lenis({ lerp:0.085, wheelMultiplier:1, smoothWheel:true, touchMultiplier:1.5 });
  window.arkLenis=lenis;
  const rafLoop=(t)=>{ lenis.raf(t); requestAnimationFrame(rafLoop); };
  requestAnimationFrame(rafLoop);
  // keep every scroll-driven system in sync with the smoothed position
  lenis.on('scroll',()=>{ onScroll(); collectProgress(); scanProgress(); updateParallax(); });
}

/* ---------- INIT PASS ---------- */
onScroll(); collectProgress(); scanProgress(); updateParallax();
})();

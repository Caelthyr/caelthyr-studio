(() => {
  'use strict';
  const canvas = document.querySelector('#canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.querySelector('#score');
  const bestEl = document.querySelector('#best');
  const message = document.querySelector('#message');
  const title = document.querySelector('#message-title');
  const play = document.querySelector('#play');
  const playLabel = document.querySelector('#play-label');
  const pause = document.querySelector('#pause');
  const announcement = document.querySelector('#announcement');
  const dino = [
    '            ########  ', '           ########## ', '           ## ####### ',
    '           ########## ', '           ########## ', '           #####      ',
    '           ########  ', '          #####       ', '         ######       ',
    '#       #########     ', '##     #######  #     ', '###   ########        ',
    '##############        ', '##############        ', ' ############         ',
    '  ###########         ', '   #########          ', '    #######           ',
    '     ### ##           ', '     ##   ##          ', '     ##    ##         ',
    '     ###   ###        '
  ];
  const crouch = [
    '                  ########  ', '                 ## ####### ', '    ####################### ',
    '#  #######################  ', '#####################       ', ' #######################    ',
    '   ################         ', '      ############          ', '       ###    ###           ',
    '       ##      ##           ', '       ###     ###          '
  ];
  const cactus = [
    '     ##      ', '    ####     ', '    ####     ', '    ####  ## ', '##  #### ####',
    '##  #### ####', '##  #### ####', '##  #### ####', '##  #########', '###########  ',
    ' #######     ', '    ####     ', '    ####     ', '    ####     ', '    ####     ',
    '    ####     ', '    ####     ', '    ####     '
  ];
  const bird = [
    '          ##          ', '          ###         ', '          ####        ', '   ##     #####       ',
    '  ####    ######      ', ' #######  #######     ', '###################   ', '      ############### ',
    '        ###########   ', '          #######     '
  ];
  let width = 940, height = 250, mode = 'ready', score = 0, best = 0;
  let offset = 0, speed = 260, elapsed = 0, spawnIn = 1.7, obstacles = [];
  let y = 0, vy = 0, duck = false, lastTime = 0, lastDisplayed = -1;
  const floor = 196, dinoX = 52;
  const dust = Array.from({length:36}, (_, i) => ({x:(i * 97 + 37) % 1200,y:5 + (i * 13) % 14,w:i % 3 === 0 ? 6 : 3}));
  const pad = n => Math.floor(n).toString().padStart(5, '0');
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(520, rect.width);
    height = 250;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    ctx.imageSmoothingEnabled = false;
    draw();
  }
  function sprite(rows, x, top, scale = 2, flip = false) {
    rows.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) {
        if (row[c] === '#') ctx.fillRect(Math.round(x + c * scale), Math.round(top + (flip ? rows.length - r - 1 : r) * scale), scale, scale);
      }
    });
  }
  function cloud(x, top) {
    ctx.strokeStyle = '#dedede'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x,top+16); ctx.lineTo(x+9,top+16); ctx.lineTo(x+9,top+10);
    ctx.lineTo(x+19,top+10); ctx.lineTo(x+19,top+5); ctx.lineTo(x+25,top+5);
    ctx.lineTo(x+25,top); ctx.lineTo(x+36,top); ctx.lineTo(x+36,top+5);
    ctx.lineTo(x+44,top+5);ctx.lineTo(x+44,top+12);ctx.lineTo(x+56,top+12);
    ctx.lineTo(x+56,top+19);ctx.lineTo(x+62,top+19);ctx.lineTo(x+62,top+23);
    ctx.lineTo(x+7,top+23);ctx.stroke();
  }
  function draw() {
    ctx.clearRect(0, 0, width, height);
    cloud(((width * .68 - offset * .12) % (width + 130) + width + 130) % (width + 130) - 40, 39);
    cloud(((width * .18 - offset * .07) % (width + 130) + width + 130) % (width + 130) - 40, 71);
    ctx.strokeStyle = '#777'; ctx.lineWidth = 1;
    ctx.beginPath();ctx.moveTo(0,floor+.5);ctx.lineTo(width,floor+.5);ctx.stroke();
    ctx.fillStyle = '#888';
    for(const d of dust) {const x = ((d.x-offset) % (width+50) + width+50) % (width+50);ctx.fillRect(Math.round(x),floor+d.y,d.w,1);}
    const bump = ((width * .45-offset) % (width+100)+width+100)%(width+100);
    ctx.fillStyle = '#fff';ctx.fillRect(bump-1,floor-1,27,3);
    ctx.strokeStyle = '#777';ctx.beginPath();ctx.moveTo(bump,floor+.5);ctx.lineTo(bump+7,floor-3.5);ctx.lineTo(bump+10,floor-7.5);ctx.lineTo(bump+16,floor-7.5);ctx.lineTo(bump+19,floor-3.5);ctx.lineTo(bump+26,floor+.5);ctx.stroke();
    ctx.fillStyle = '#535353';
    const isDucking = duck && y === 0 && mode === 'running';
    const rows = isDucking ? crouch : dino;
    const top = floor - rows.length * 2 + y;
    sprite(rows, dinoX, top);
    if(mode === 'running' && y === 0 && !isDucking) {
      const leg = Math.floor(elapsed * 12) % 2;
      ctx.fillStyle = '#fff';ctx.fillRect(dinoX+(leg?10:20),floor-6,9,7);
      ctx.fillStyle = '#535353';ctx.fillRect(dinoX+(leg?10:22),floor-8,4,3);
    }
    if(mode === 'over') {
      ctx.fillStyle = '#fff';ctx.fillRect(dinoX+26,top+4,4,4);
      ctx.fillStyle = '#535353';ctx.fillRect(dinoX+27,top+5,2,2);
    }
    ctx.fillStyle = '#535353';
    for(const o of obstacles) {
      if(o.type === 'bird') sprite(bird, o.x, floor-o.h, 2, Math.floor(elapsed*7)%2===1);
      else sprite(cactus, o.x, floor-o.h, o.scale);
    }
  }
  function setMessage(heading, label) {title.textContent=heading;playLabel.textContent=label;message.hidden=false;}
  function updateScore() {const n=Math.floor(score);if(n!==lastDisplayed){scoreEl.textContent=pad(n);lastDisplayed=n;}}
  function start() {
    mode='running';score=0;y=0;vy=0;duck=false;elapsed=0;offset=0;speed=260;spawnIn=1.7;obstacles=[];
    message.hidden=true;pause.disabled=false;pause.innerHTML='<span aria-hidden="true">Ⅱ</span> Pause';pause.setAttribute('aria-label','Pause game');
    updateScore();announcement.textContent='Run started. Jump over cacti and duck under birds.';
  }
  function jump() {
    if(mode==='ready'||mode==='over'){start();vy=-535;return;}
    if(mode==='paused'){togglePause();return;}
    if(y===0){duck=false;vy=-535;}
  }
  function togglePause() {
    if(mode==='running'){mode='paused';duck=false;setMessage('Take your time.','Keep running');pause.innerHTML='<span aria-hidden="true">▶</span> Resume';pause.setAttribute('aria-label','Resume game');announcement.textContent='Game paused.';}
    else if(mode==='paused'){mode='running';message.hidden=true;pause.innerHTML='<span aria-hidden="true">Ⅱ</span> Pause';pause.setAttribute('aria-label','Pause game');announcement.textContent='Game resumed.';}
  }
  function end() {
    mode='over';duck=false;best=Math.max(best,Math.floor(score));bestEl.textContent=pad(best);
    pause.disabled=true;setMessage('Game over. One more?','Run again');
    announcement.textContent=`Game over. Score ${Math.floor(score)}. Best ${best}. Press Space or Run again to restart.`;
  }
  function step(dt) {
    elapsed+=dt;score+=dt*10;speed=Math.min(435,260+elapsed*2.2);offset+=speed*dt;
    if(y<0 || vy<0) {vy+=(duck?2300:1550)*dt;y+=vy*dt;if(y>=0){y=0;vy=0;}}
    spawnIn-=dt;
    if(spawnIn<=0){
      const flying=elapsed>15&&Math.random()<.28;
      const scale=Math.random()<.55?2:2.5;
      obstacles.push(flying?{type:'bird',x:width+30,w:44,h:Math.random()<.45?77:47}:{type:'cactus',x:width+30,w:26*scale/2,h:18*scale,scale});
      spawnIn=(1.3+Math.random()*.7)*(300/speed);
    }
    const dh=duck&&y===0?22:44;
    const dx=dinoX+7,dy=floor-dh+y+4,dw=duck&&y===0?43:29;
    for(const o of obstacles) {
      o.x-=speed*dt;
      const ox=o.x+4,oy=floor-o.h+4,ow=o.w-8,oh=o.type==='bird'?12:o.h-5;
      if(dx<ox+ow&&dx+dw>ox&&dy<oy+oh&&dy+dh-6>oy){end();break;}
    }
    obstacles=obstacles.filter(o=>o.x+o.w>-10);updateScore();
  }
  function frame(now) {const dt=Math.min((now-lastTime)/1000||0,1/30);lastTime=now;if(mode==='running')step(dt);draw();requestAnimationFrame(frame);}
  play.addEventListener('click',()=>{if(mode==='paused')togglePause();else start();canvas.focus({preventScroll:true});});
  pause.addEventListener('click',()=>{togglePause();});
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();canvas.focus({preventScroll:true});jump();});
  window.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
    if(e.code==='Space'||e.code==='ArrowUp'){
      if(e.target instanceof HTMLButtonElement&&e.code==='Space')return;
      e.preventDefault();if(!e.repeat)jump();
    }
    if(e.code==='ArrowDown'){e.preventDefault();if(mode==='running')duck=true;}
    if(e.code==='KeyP'||e.code==='Escape'){if(!e.repeat)togglePause();}
  });
  window.addEventListener('keyup',e=>{if(e.code==='ArrowDown')duck=false;});
  window.addEventListener('blur',()=>{if(mode==='running')togglePause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='running')togglePause();});
  new ResizeObserver(resize).observe(canvas);
  resize();requestAnimationFrame(frame);
  if(document.modelContext?.registerTool) {
    const lifecycle=new AbortController();
    const tool={name:'control_dino_game',title:'Control dinosaur game',description:'Read the current run, start a run, jump, pause, or resume the dinosaur game.',inputSchema:{type:'object',properties:{action:{type:'string',enum:['status','start','jump','pause','resume']}},required:['action'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){
      if(!input||typeof input!=='object'||Object.keys(input).length!==1||!['status','start','jump','pause','resume'].includes(input.action))throw new Error('Provide one valid action.');
      if(input.action==='start'){if(mode==='running'||mode==='paused')throw new Error('A run is already in progress.');start();}
      if(input.action==='jump'){if(mode!=='running')throw new Error('Start or resume the game first.');jump();}
      if(input.action==='pause'){if(mode!=='running')throw new Error('The game is not running.');togglePause();}
      if(input.action==='resume'){if(mode!=='paused')throw new Error('The game is not paused.');togglePause();}
      draw();return {state:mode,score:Math.floor(score),best};
    }};
    try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}
    window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  }
})();

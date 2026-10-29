'use strict';
const $=id=>document.getElementById(id),SAVE='amor-rpg-alpha-1';
let state;try{state=RPG.restore(JSON.parse(localStorage.getItem(SAVE)))}catch{state=RPG.fresh()}
let scene,camera,renderer,player,sword,marker,sparkles,selected=null,path=[],attackCD=0,gatherCD=0,swing=0,elapsed=0,lastSave=0,toastTimer,popTimer,routeTimer=0;
const entities=[],lions=[],resources=[],obstacles=[];
const clock=new THREE.Clock(),ray=new THREE.Raycaster(),mouse=new THREE.Vector2(),focus=new THREE.Vector3(),anchor=new THREE.Vector3(),town=new THREE.Vector3(-4,0,7);
const stick={x:0,y:0,id:null};let gesture=null,bridgeModel,marketLand,marketHouse,trader;
const isEnemy=d=>['lion','bear','rat','dragon'].includes(d.type);
let dragonLand,shieldModel;const damageNumbers=[];
const inTown=p=>Math.hypot(p.x,p.z)<19&&p.z>3.5;
const paused=()=>document.hidden||!!document.querySelector('dialog[open]');
function save(){try{localStorage.setItem(SAVE,JSON.stringify(state))}catch{}}
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3200)}
function pop(title,description,icon='✧'){toast(icon+' '+title+' · '+description)}
function distance(a,b){return Math.hypot(a.x-b.x,a.z-b.z)}
function ui(){const max=RPG.maxHP(state);$('level').textContent='Nv. '+state.level;$('player-level').textContent='♡';$('hp-label').textContent=Math.ceil(state.hp)+'/'+max;$('energy-fill').style.width=state.hp/max*100+'%';$('energy-fill').style.background=state.hp<max*.3?'#e9a09a':'#b5d79b';$('energy-name').textContent='⚔ +'+state.sword+(state.shield?' ⛨':'');for(const k in state.bag){const counter=$(k+'-count');if(counter)counter.textContent=state.bag[k]}updateProgress();$('xp-fill').style.width=state.xp/RPG.threshold(state)*100+'%';$('xp-label').textContent=state.xp+' / '+RPG.threshold(state)+' XP';$('zone').textContent=player&&player.position.x>24&&player.position.z>24?'Sureste · dragones +10':player&&player.position.x<-24?'Mercado · frutos':player&&inTown(player.position)?(state.market?'Pueblo · ratas':'Pueblo · zona segura'):player&&player.position.z<-27?'Bosque · osos +5':'Pradera · leones';$('target-panel').hidden=!selected;if(selected)$('target-name').textContent=selected.userData.name+(isEnemy(selected.userData)?' · '+Math.max(0,Math.ceil(selected.userData.hp))+' / '+selected.userData.max+' PV'+(!RPG.canHurt(state,selected.userData.kind)?' · Mejor espada +'+RPG.requiredSword(selected.userData.kind):''):'');const enemy=selected&&isEnemy(selected.userData);$('target-health').hidden=!enemy;if(enemy){const hp=Math.max(0,selected.userData.hp);$('target-health').setAttribute('aria-valuenow',hp);$('target-health').setAttribute('aria-valuemax',selected.userData.max);$('target-health-fill').style.width=hp/selected.userData.max*100+'%'}}
function inventory(){ $('stats').textContent='Nivel '+state.level+' · '+state.kills+' leones · '+state.bearKills+' osos · '+RPG.damage(state)+' de daño';$('bag-grid').innerHTML=Object.entries(state.bag).map(([k,v])=>`<div class="bag-item">${RPG.names[k]}<b>${v}</b></div>`).join('');$('weapon-title').textContent='Espada del viajero +'+state.sword;showExpedition();$('inventory-dialog').showModal()}
function forge(){const price=RPG.cost(state);$('upgrade-title').textContent=state.sword===10?'Espada al máximo':'Espada +'+state.sword+' → +'+(state.sword+1);$('recipe').innerHTML=Object.entries(price).map(([k,v])=>`<div class="ingredient ${state.bag[k]<v?'missing':''}">${RPG.names[k]}<b>${state.bag[k]} / ${v}</b></div>`).join('');$('upgrade').disabled=!RPG.canUpgrade(state);$('forge-note').textContent=state.sword===10?'Alcanzaste la mejora máxima de esta alfa.':RPG.canUpgrade(state)?'La mejora agrega 7 de daño a tu espada.':'Reuní los materiales que faltan. El cuero se consigue de los leones.';updateBridgeShop();updateMarketShop();updateDragonForge();if(!$('workshop-dialog').open)$('workshop-dialog').showModal()}
$('inventory').onclick=inventory;$('help').onclick=()=>$('help-dialog').showModal();$('start').onclick=()=>$('help-dialog').close();document.querySelectorAll('.close').forEach(b=>b.onclick=()=>b.closest('dialog').close());$('upgrade').onclick=()=>{if(!RPG.upgrade(state))return;save();ui();forge();pop('Espada +'+state.sword,'Tu arma ahora hace '+RPG.damage(state)+' de daño.','⚔')};$('reset').onclick=()=>$('reset-confirm').hidden=false;$('confirm-reset').onclick=()=>{state=RPG.fresh();save();location.reload()};$('cancel').onclick=cancel;
function cancel(){selected=null;path=[];if(marker)marker.visible=false;ui()}
function passable(x,z){return RPG.land(state,x,z)&&!obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+.35)}
// Grid navigation keeps tap-to-walk routes outside the village buildings.
function route(dest){const start=[Math.round(player.position.x),Math.round(player.position.z)],goal=[Math.round(dest.x),Math.round(dest.z)];if(!passable(...goal))return [];const key=(x,z)=>x+','+z,open=[start],prev=new Map([[key(...start),null]]);let end=null;for(let i=0;i<open.length;i++){const p=open[i];if(p[0]===goal[0]&&p[1]===goal[1]){end=p;break}for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const n=[p[0]+dx,p[1]+dz],k=key(...n);if(!prev.has(k)&&passable(...n)){prev.set(k,p);open.push(n)}}}if(!end)return [];const result=[];for(let p=end;prev.get(key(...p));p=prev.get(key(...p)))result.push(new THREE.Vector3(p[0],0,p[1]));result.reverse();if(passable(dest.x,dest.z))result.push(dest.clone().setY(0));return result}
function go(dest){path=route(dest);marker.position.set(dest.x,.08,dest.z);marker.visible=path.length>0;return path.length>0}
function choose(entity){if(!entity||!entity.visible||paused())return;const d=entity.userData;const dest=d.approach||entity.position;if(d.type==='bear'&&!state.bridge){toast('Construí el puente en el taller');return}selected=entity;if(isEnemy(d))toast(RPG.canHurt(state,d.kind)?'Combate automático · retirate con el joystick':'Mejor con espada +'+RPG.requiredSword(d.kind)+' · ahora hacés 1 de daño');go(dest);ui()}
function closest(list){return list.filter(g=>g.visible&&!g.userData.depleted&&g.userData.type!=='dead').sort((a,b)=>distance(a.position,player.position)-distance(b.position,player.position))[0]}
$('hunt').onclick=()=>{const l=closest(lions.filter(e=>e.userData.kind==='lion'));l?choose(l):toast('Los leones volverán pronto')};$('town').onclick=()=>{cancel();go(town);toast('Volvé al pueblo para recuperar vida')};$('workshop').onclick=()=>choose(entities.find(e=>e.userData.type==='workshop'));document.querySelectorAll('[data-resource]').forEach(b=>b.onclick=()=>{const node=closest(resources.filter(r=>r.userData.resource===b.dataset.resource));node?choose(node):toast('Ese recurso se está regenerando')});$('action').onclick=()=>{if(selected)perform(selected)};
function house(x,z,color,name,type){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);mesh(new THREE.BoxGeometry(2.8,2.3,2.6),mat('#d8c9a0'),0,1.15,0,g);const roof=mesh(new THREE.ConeGeometry(2.35,1.7,4),mat(color),0,3,0,g);roof.rotation.y=Math.PI/4;mesh(new THREE.BoxGeometry(.75,1.45,.12),mat('#644936'),0,.74,1.35,g);for(const side of [-1,1])mesh(new THREE.BoxGeometry(.55,.65,.13),mat('#f4d990',{emissive:'#f4c46f',emissiveIntensity:.4}),side*.85,1.35,1.35,g);mesh(new THREE.BoxGeometry(.45,1.6,.5),mat('#77847a'),.8,2.6,-.5,g);const sign=label(name,'#f6dfa5',36);sign.position.set(0,3.9,0);g.add(sign);g.userData={type,name,approach:new THREE.Vector3(x,0,z+3)};entities.push(g);obstacles.push({x,z,r:2});return g}
function resource(kind,x,z){let g;if(kind==='wood'){g=tree(x,z,.9);g.children.slice(1).forEach(m=>m.material=mat('#6c9c6c'));}else{g=new THREE.Group();g.position.set(x,0,z);scene.add(g);const rock=sphere(.75,kind==='gold'?'#7b7f70':'#879896',0,.5,0,g);rock.scale.set(1.2,.8,1);if(kind==='gold')for(let j=0;j<4;j++)sphere(.17,'#e8c46e',Math.sin(j*2)*.5,.7,Math.cos(j*2)*.5,g)}const sign=label(RPG.names[kind],kind==='gold'?'#ffe1a1':'#e1eed0',36);sign.position.y=kind==='wood'?4:1.7;sign.scale.multiplyScalar(.8);g.add(sign);g.userData={type:'resource',resource:kind,name:RPG.names[kind],stock:3,depleted:false,regen:0,baseScale:g.scale.x,sign};resources.push(g);entities.push(g);return g}
function lion(x,z,index){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);const body=sphere(.7,'#c9a268',0,.7,0,g);body.scale.set(.7,.75,1.25);sphere(.6,'#82603e',0,1.05,.7,g);sphere(.36,'#dfb876',0,1.1,.99,g);sphere(.18,'#eed5a0',0,.96,1.23,g);sphere(.075,'#40372e',0,1.05,1.38,g);for(const s of [-1,1]){sphere(.13,'#d1a867',s*.32,1.46,.85,g);sphere(.045,'#242d27',s*.16,1.2,1.28,g)}const legs=[];for(const x1 of [-.35,.35])for(const z1 of [-.5,.4])legs.push(mesh(new THREE.CylinderGeometry(.12,.14,.55,6),mat('#caa76e'),x1,.28,z1,g));const tail=mesh(new THREE.CylinderGeometry(.045,.055,.85,5),mat('#b98f57'),0,.8,-1,g);tail.rotation.x=-.65;sphere(.13,'#74573c',0,1.08,-1.25,g);const sign=label('LEÓN · Nv. 1','#f6d8a0',33);sign.position.y=2;sign.scale.set(2,.5,1);g.add(sign);const bar=new THREE.Group();bar.position.y=1.68;g.add(bar);mesh(new THREE.PlaneGeometry(1,.1),new THREE.MeshBasicMaterial({color:'#443c30'}),0,0,0,bar);const fill=mesh(new THREE.PlaneGeometry(.96,.065),new THREE.MeshBasicMaterial({color:'#dc9a79'}),0,0,.01,bar);g.userData={type:'lion',kind:'lion',name:'León de la pradera',hp:48,max:48,home:new THREE.Vector3(x,0,z),index,attack:0,respawn:0,legs,bar,fill,aggro:false};lions.push(g);entities.push(g);return g}
function bear(x,z,index){
 const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 const body=sphere(.95,'#69503c',0,.85,0,g);body.scale.set(.9,.9,1.2);
 sphere(.63,'#795b42',0,1.25,.87,g);sphere(.31,'#bca17c',0,1.12,1.34,g);sphere(.11,'#292a23',0,1.21,1.57,g);
 for(const side of [-1,1]){sphere(.2,'#654731',side*.42,1.77,.8,g);sphere(.055,'#191f19',side*.22,1.4,1.41,g)}
 const legs=[];for(const xx of [-.55,.55])for(const zz of [-.65,.6])legs.push(mesh(new THREE.CylinderGeometry(.2,.24,.65,7),mat('#604631'),xx,.35,zz,g));
 const tag=label('OSO · ESPADA +5','#edc5a0',32);tag.position.y=2.5;g.add(tag);
 const bar=new THREE.Group();bar.position.y=2.12;g.add(bar);mesh(new THREE.PlaneGeometry(1,.1),new THREE.MeshBasicMaterial({color:'#443c30'}),0,0,0,bar);
 const fill=mesh(new THREE.PlaneGeometry(.96,.065),new THREE.MeshBasicMaterial({color:'#e09678'}),0,0,.01,bar);
 g.userData={type:'bear',kind:'bear',name:'Oso del bosque',hp:360,max:360,home:new THREE.Vector3(x,0,z),index,attack:0,respawn:0,legs,bar,fill,aggro:false};lions.push(g);entities.push(g);return g;
}
function expansion(){
 mesh(new THREE.CylinderGeometry(11.5,10,1.1,48),mat('#577b62'),0,-.6,-38);mesh(new THREE.CylinderGeometry(10,6,5,12),mat('#3a5548'),0,-3.6,-38);
 for(let i=0;i<18;i++){const a=i/18*Math.PI*2;tree(Math.cos(a)*10.5,-38+Math.sin(a)*10.5,1.2+rand()*.4)}
 bridgeModel=new THREE.Group();scene.add(bridgeModel);for(let i=0;i<24;i++){const z=-18-i*.46;mesh(new THREE.BoxGeometry(3.4,.18,.42),mat(i%2?'#a18354':'#b09565'),0,-.03,z,bridgeModel);if(i%3===0)for(const x of [-1.65,1.65])mesh(new THREE.CylinderGeometry(.07,.09,1,6),mat('#826440'),x,.5,z,bridgeModel)}
 for(const x of [-1.65,1.65])mesh(new THREE.BoxGeometry(.08,.08,10.8),mat('#cfb57c'),x,.88,-23.3,bridgeModel);
 bridgeModel.visible=state.bridge;
 const sign=label('BOSQUE DE OSOS · PUENTE EN EL TALLER','#f1d6a3',21);sign.position.set(0,2,-17.3);sign.scale.set(4.5,1.1,1);scene.add(sign);
 bear(-4,-34,5).userData.waveId=0;bear(4,-38,6).userData.waveId=1;bear(-2,-43,7).userData.waveId=2;
}
function updateBridgeShop(){
 $('bridge-recipe').innerHTML=Object.entries(RPG.bridgeCost).map(([k,n])=>`<div class="ingredient ${state.bag[k]<n?'missing':''}">${RPG.names[k]}<b>${state.bag[k]} / ${n}</b></div>`).join('');
 $('build-bridge').disabled=!RPG.canBuildBridge(state);$('build-bridge').textContent=state.bridge?'Puente construido':'Construir puente';$('bridge-note').textContent=state.bridge?'El camino al bosque está abierto. Para los osos se recomienda espada +5.':'Construí una conexión permanente al bosque. Se guarda con tu progreso.';
}
$('build-bridge').onclick=()=>{if(!RPG.buildBridge(state))return;bridgeModel.visible=true;save();forge();toast('Puente construido · el bosque de osos ya está conectado')};
$('bears').onclick=()=>{if(!state.bridge){toast('Construí el puente en el taller para abrir el bosque');return}const enemy=closest(lions.filter(e=>e.userData.kind==='bear'));enemy?choose(enemy):toast('Los osos volverán pronto')};
$('bridge-travel').onclick=()=>{if(!state.bridge){toast('Construí el puente en el taller');return}cancel();go(new THREE.Vector3(0,0,-29));toast('En camino al bosque · espada recomendada +5')};
function perform(e){const d=e.userData;if(d.type==='market'){marketDialog();cancel();return}if(d.type==='trader'){traderDialog();cancel();return}if(d.type==='workshop'){forge();cancel();return}if(d.type==='home'){state.hp=RPG.maxHP(state);save();toast('Descansaste en la posada. Vida recuperada.');cancel();return}if(d.type==='resource'){if(gatherCD>0||d.depleted)return;gatherCD=.9;const amount=d.resource==='gold'?1:2;state.bag[d.resource]+=amount;d.stock--;toast('+'+amount+' '+RPG.names[d.resource]);e.rotation.z=.08;setTimeout(()=>e.rotation.z=0,140);if(d.stock<=0){d.depleted=true;d.regen=elapsed+22;e.scale.setScalar(d.baseScale*.3);d.sign.visible=false;cancel()}save();ui();return}if(isEnemy(d)&&attackCD<=0){attackCD=.65;swing=.28;const hit=RPG.hitDamage(state,d.kind);d.hp-=hit;damageNumber(e,hit,false);d.aggro=true;if(d.hp<=0){const result=RPG.defeat(state,d.kind,d.waveId);d.type='dead';d.respawn=elapsed+(d.kind==='bear'?45:30);e.visible=false;selected=null;path=[];pop((d.kind==='dragon'?'Dragón':d.kind==='bear'?'Oso':d.kind==='rat'?'Rata':'León')+' derrotado', '+'+result.xp+' XP · '+Object.entries(result.items).map(([k,n])=>'+'+n+' '+RPG.names[k]).join(' · ')+(result.levels?' · ¡Nivel '+state.level+'!':''),'⚔');save()}ui()}}
function movePlayer(v,dt){const step=v.clone().multiplyScalar(dt*4.4),p=player.position;if(passable(p.x+step.x,p.z))p.x+=step.x;if(passable(p.x,p.z+step.z))p.z+=step.z;if(v.lengthSq()){player.rotation.y=Math.atan2(v.x,v.z);p.y=Math.abs(Math.sin(elapsed*11))*.065}else p.y=0}
function tick(dt){elapsed+=dt;attackCD=Math.max(0,attackCD-dt);gatherCD=Math.max(0,gatherCD-dt);swing=Math.max(0,swing-dt);sword.rotation.x=swing?Math.sin(swing/.28*Math.PI)*-1.8:0;let v=new THREE.Vector3();if(stick.x||stick.y){if(selected)cancel();v.set(stick.x*.8+stick.y*.6,0,-stick.x*.6+stick.y*.8);if(v.length()>1)v.normalize()}else{if(selected){const d=selected.userData,range=isEnemy(d)?1.75:2;const dest=d.approach||selected.position;if(distance(player.position,dest)<=range){path=[];marker.visible=false;if(d.type==='resource'||isEnemy(d))perform(selected)}else if(isEnemy(d)&&(routeTimer-=dt)<=0){routeTimer=.6;path=route(dest)}}if(path.length){const step=path[0];v.copy(step).sub(player.position).setY(0);if(v.length()<.2){player.position.x=step.x;player.position.z=step.z;path.shift();v.set(0,0,0)}else v.normalize()}}movePlayer(v,dt);if(!path.length)marker.visible=false;
for(const r of resources){if(!r.visible)continue;const d=r.userData;if(d.depleted&&elapsed>d.regen){d.depleted=false;d.stock=3;r.scale.setScalar(d.baseScale);d.sign.visible=true}}
for(const l of lions){const d=l.userData;if(d.kind==='rat'&&!state.market)continue;if(d.kind==='dragon'&&(!state.completed||(!state.shield&&(d.dragonId>0||state.dragonKills>0))))continue;if(d.type==='dead'){const pack=lions.filter(other=>other.userData.kind===d.kind);const waveReady=d.kind==='lion'||d.kind==='dragon'||pack.every(other=>other.userData.type==='dead');if(waveReady&&elapsed>Math.max(...pack.filter(other=>other.userData.type==='dead').map(other=>other.userData.respawn))){for(const mob of (['lion','dragon'].includes(d.kind)?[l]:pack)){const md=mob.userData;md.type=md.kind;md.hp=md.max;md.aggro=false;mob.position.copy(md.home);mob.visible=true}}continue}d.attack=Math.max(0,d.attack-dt);const gap=distance(l.position,player.position),safe=d.kind==='dragon'?Math.hypot(player.position.x-35,player.position.z-35)>12.8:d.kind==='rat'?(!inTown(player.position)||distance(player.position,town)<2):inTown(player.position)||(d.kind==='bear'?player.position.z>-28:player.position.z<-20);if(!safe&&gap<4.5)d.aggro=true;if(safe||distance(l.position,d.home)>7.5)d.aggro=false;let goal=d.aggro?player.position:new THREE.Vector3(d.home.x+Math.sin(elapsed*.3+d.index)*1.3,0,d.home.z+Math.cos(elapsed*.35+d.index)*1.3);const direction=goal.clone().sub(l.position).setY(0);if(direction.length()> (d.aggro?1.35:.2)){direction.normalize();const next=l.position.clone().addScaledVector(direction,dt*(d.aggro?(d.kind==='bear'?2.8:2.25):.7));if((d.kind==='dragon'?Math.hypot(next.x-35,next.z-35)<12:d.kind==='bear'?Math.hypot(next.x,next.z+38)<10.3:d.kind==='rat'?inTown(next)&&distance(next,town)>2:Math.hypot(next.x,next.z)<18.5)&&!obstacles.some(o=>distance(next,o)<o.r+.35))l.position.copy(next);l.rotation.y=Math.atan2(direction.x,direction.z);d.legs.forEach((leg,i)=>leg.rotation.x=Math.sin(elapsed*9+i*Math.PI)*.28)}if(d.aggro&&gap<1.65&&d.attack<=0){if(!selected||!isEnemy(selected.userData)){selected=l;path=[];marker.visible=false;toast(d.name+' te ataca · respondiendo al ataque')}const hit=RPG.incomingDamage(state,d.kind);state.hp-=hit;damageNumber(player,hit,true);d.attack=1.2;player.children[0].material.emissive.set('#6c3025');setTimeout(()=>player.children[0].material.emissive.set('#000000'),170);if(state.hp<=0){const spawn=RPG.respawn(state);player.position.set(spawn.x,spawn.y,spawn.z);releaseStick();cancel();lions.forEach(a=>a.userData.aggro=false);toast('Volviste al pueblo. Conservás tu experiencia y objetos.');save()}}d.fill.scale.x=Math.max(0,d.hp/d.max);d.fill.position.x=-(1-d.hp/d.max)*.48;}
if(inTown(player.position)&&!lions.some(e=>e.visible&&e.userData.aggro&&distance(e.position,player.position)<4))state.hp=Math.min(RPG.maxHP(state),state.hp+dt*9);if(elapsed-lastSave>5){save();lastSave=elapsed}ui();let action=null;if(selected){const d=selected.userData;if(distance(player.position,d.approach||selected.position)<(isEnemy(d)?2:2.2))action=d.type==='market'?'Entrar al mercado':d.type==='trader'?'Hablar con Don Tito':d.type==='workshop'?'Entrar al taller':d.type==='home'?'Descansar':isEnemy(d)?'⚔ Atacar':null}const harvesting=selected&&selected.userData.type==='resource'&&distance(player.position,selected.position)<2.2;$('activity').hidden=!harvesting;$('activity').textContent=harvesting?'Recolectando '+RPG.names[selected.userData.resource]+'…':'';$('action').hidden=!action;$('action').textContent=action||'';}
function cameraFollow(dt=0){const p=player.position.clone().setY(.5);if(dt)focus.lerp(p,1-Math.exp(-dt*6));else focus.copy(p);const view=renderer.domElement.getBoundingClientRect();const landscape=view.width>view.height;const zoom=landscape?Math.max(.46,Math.min(1,view.height/700)):1;camera.position.copy(focus).add(new THREE.Vector3(9,12,12).multiplyScalar(zoom));camera.lookAt(focus);camera.updateMatrixWorld();anchor.copy(player.position).add(new THREE.Vector3(0,2.1,0)).project(camera);const r=renderer.domElement.getBoundingClientRect();document.querySelector('.energy').style.left=(r.left+(anchor.x*.5+.5)*r.width)+'px';document.querySelector('.energy').style.top=(r.top+(-anchor.y*.5+.5)*r.height)+'px';}
function resize(){const r=$('world').getBoundingClientRect();renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.fov=r.width/r.height<.8?48:44;camera.updateProjectionMatrix();cameraFollow()}
function tapWorld(e){const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);const hits=ray.intersectObjects(entities.filter(g=>g.visible&&!g.userData.depleted&&!['dead','taken'].includes(g.userData.type)),true);if(hits.length){let g=hits[0].object;while(g.parent!==scene)g=g.parent;choose(g);return}const p=new THREE.Vector3();if(ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),p)&&passable(p.x,p.z)){cancel();go(p)}}
function releaseStick(){stick.x=stick.y=0;stick.id=null;gesture=null;const b=$('joystick');b.classList.remove('active');b.style.left=b.style.top=b.style.bottom='';$('joystick-knob').style.transform='translate(-50%,-50%)'}
function bindTouch(surface,floating){surface.addEventListener('pointerdown',e=>{if(paused()||stick.id!==null)return;e.preventDefault();surface.setPointerCapture(e.pointerId);const b=$('joystick'),r=b.getBoundingClientRect();stick.id=e.pointerId;gesture={x:e.clientX,y:e.clientY,time:performance.now(),moved:false};if(floating){b.style.left=(e.clientX-r.width/2)+'px';b.style.top=(e.clientY-r.height/2)+'px';b.style.bottom='auto'}b.classList.add('active');cancel()});surface.addEventListener('pointermove',e=>{if(e.pointerId!==stick.id||!gesture)return;const r=$('joystick').getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,len=Math.hypot(dx,dy),limit=r.width*.32,scale=len>limit?limit/len:1;if(Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>3)gesture.moved=true;stick.x=len<3?0:dx*scale/limit;stick.y=len<3?0:dy*scale/limit;$('joystick-knob').style.transform=`translate(calc(-50% + ${dx*scale}px),calc(-50% + ${dy*scale}px))`});surface.addEventListener('pointerup',e=>{if(e.pointerId!==stick.id)return;const tap=floating&&gesture&&!gesture.moved&&performance.now()-gesture.time<350;releaseStick();if(tap)tapWorld(e)});for(const event of ['pointercancel','lostpointercapture'])surface.addEventListener(event,e=>{if(e.pointerId===stick.id)releaseStick()})}
function init(){scene=new THREE.Scene();scene.background=new THREE.Color('#254b47');scene.fog=new THREE.FogExp2('#345a50',.012);camera=new THREE.PerspectiveCamera(48,1,.1,130);renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;$('world').appendChild(renderer.domElement);scene.add(new THREE.HemisphereLight('#ffebbd','#35594f',2));const sun=new THREE.DirectionalLight('#ffe2b0',2.8);sun.position.set(-10,24,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-23,right:23,top:23,bottom:-23});sun.shadow.normalBias=.04;scene.add(sun);
mesh(new THREE.CylinderGeometry(20,18,1.1,64),mat('#849b6b'),0,-.6,0);mesh(new THREE.CylinderGeometry(18,9,6,16),mat('#4d6554'),0,-4,0);const clearing=mesh(new THREE.CircleGeometry(8,48),mat('#a6a37b'),-4,.015,7);clearing.rotation.x=-Math.PI/2;
for(let i=0;i<24;i++){const a=i/24*Math.PI*2;tree(Math.cos(a)*19,Math.sin(a)*19,.8+rand()*.5)}for(let i=0;i<75;i++){const x=(rand()-.5)*36,z=(rand()-.5)*36;if(Math.hypot(x,z)>18||z>3)continue;mesh(new THREE.ConeGeometry(.16,.45,4),mat('#a7b57c'),x,.2,z)}for(let i=0;i<22;i++){const z=10-i*.8;mesh(new THREE.CylinderGeometry(.43,.5,.08,6),mat('#bdba96'),-2+Math.sin(i*.4)*.4,.06,z)}
house(-8,8,'#657d6c','TALLER','workshop');house(-1,12,'#b18b68','POSADA','home');house(5,8,'#78846f','CASA DEL VALLE','home');for(const [kind,x,z]of [['wood',-10,3],['wood',-13,7],['wood',-8,13],['wood',4,13],['wood',-12,-3],['stone',-4,2],['stone',0,1],['stone',-10,-7],['gold',3,2],['gold',8,-1],['gold',1,-9]])resource(kind,x,z);for(const [i,p]of [[-3,-4],[3,-5],[8,-6],[0,-12],[10,-11]].entries())lion(p[0],p[1],i);
expansion();thirdRegion();dragonRegion();player=character('#dbe0b8');player.position.copy(town);sword=new THREE.Group();sword.position.set(-.5,.9,.2);player.add(sword);mesh(new THREE.BoxGeometry(.13,1.1,.055),mat('#d9e4df',{metalness:.7,roughness:.25}),0,.5,0,sword);mesh(new THREE.BoxGeometry(.4,.09,.1),mat('#cfaf6e'),0,0,0,sword);mesh(new THREE.CylinderGeometry(.06,.06,.28,6),mat('#634a34'),0,-.15,0,sword);equipShield();const halo=mesh(new THREE.TorusGeometry(.48,.025,6,32),mat('#e7d9a4'),0,.05,0,player);halo.rotation.x=-Math.PI/2;marker=mesh(new THREE.TorusGeometry(.3,.03,6,32),mat('#fff0ac'));marker.rotation.x=-Math.PI/2;marker.visible=false;
const pos=[];for(let i=0;i<100;i++)pos.push((rand()-.5)*40,1+rand()*6,(rand()-.5)*40);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));sparkles=new THREE.Points(geo,new THREE.PointsMaterial({color:'#ffebb7',size:.06}));scene.add(sparkles);resize();ui();bindTouch(renderer.domElement,true);bindTouch($('joystick'),false);window.addEventListener('resize',resize);window.addEventListener('blur',releaseStick);document.addEventListener('visibilitychange',()=>{releaseStick();save()});document.querySelectorAll('dialog').forEach(d=>new MutationObserver(()=>{if(d.open){releaseStick();setActionsOpen(false)}}).observe(d,{attributes:true,attributeFilter:['open']}));requestAnimationFrame(frame)}
function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05);if(!paused())tick(dt);cameraFollow(dt);renderDamage(dt);checkMission();for(const l of lions)l.userData.bar.quaternion.copy(camera.quaternion);sparkles.rotation.y+=dt*.01;renderer.render(scene,camera)}
function showExpedition(){
 const m=RPG.mission(state);$('expedition-progress').innerHTML=`<h3>${m.title}</h3><p>${m.text}</p><p>${m.progress}</p>${state.shield?'<p>⛨ Escudo de dragón equipado · 70% menos daño recibido</p>':''}${state.market?'<div class="market-travel"><button id="exp-berries">Buscar frutos</button><button id="exp-rats">Cazar ratas</button><button id="exp-trader">Visitar Don Tito</button></div>':''}`;
 if(state.market){$('exp-berries').onclick=()=>{$('inventory-dialog').close();$('find-berries').onclick()};$('exp-rats').onclick=()=>{$('inventory-dialog').close();$('find-rats').onclick()};$('exp-trader').onclick=()=>{$('inventory-dialog').close();$('find-trader').onclick()}}
}
function updateProgress(){
 const m=RPG.mission(state);$('quest-text').textContent=m.title;$('quest-count').textContent=m.progress;$('new-region').hidden=!state.market;$('dragons').hidden=!state.completed;for(const id of ['travel-berries','travel-rats','travel-trader'])$(id).hidden=!state.market;
 if(trader)trader.visible=RPG.traderReady(state);
}
function updateMarketShop(){
 $('market-build-progress').textContent=state.market?'Mercado construido · territorio del oeste abierto':`${state.bag.bearFang} / 30 colmillos de oso`;
 $('build-market').disabled=!RPG.canBuildMarket(state);$('build-market').textContent=state.market?'Mercado construido':'Construir mercado';
}
function showMarketLand(){
 marketLand.visible=state.market;marketHouse.visible=state.market;
 resources.filter(r=>r.userData.resource==='berries').forEach(r=>r.visible=state.market);
 lions.filter(r=>r.userData.kind==='rat').forEach(r=>r.visible=state.market&&r.userData.type!=='dead');
 trader.visible=RPG.traderReady(state);
}
function marketDialog(){
 $('market-gold').textContent='Tu oro: '+state.bag.gold;
 $('market-items').innerHTML=Object.entries(RPG.prices).map(([key,price])=>`<article class="market-item"><div><strong>${RPG.names[key]}</strong><small>Tenés ${state.bag[key]}</small></div><button data-buy="${key}" ${state.bag.gold<price?'disabled':''}>Comprar · ${price} oro</button></article>`).join('');
 document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{if(RPG.buy(state,b.dataset.buy)){save();ui();marketDialog();toast('+1 '+RPG.names[b.dataset.buy]+' comprado')}});
 $('find-trader').disabled=!RPG.traderReady(state);
 if(!$('market-dialog').open)$('market-dialog').showModal();
}
function traderDialog(){
 $('trader-title').textContent=state.completed?'¡Sos un capo!':'Un banquete en el bosque.';
 $('trader-speech').textContent=state.completed?'¡Sos un capo! Gracias por el queso y los frutos. Abrí un camino al sureste. Allí vive un dragón: mejorá tu espada a +10, derrotalo y llevá su piel al taller para fabricar un escudo.':'Traeme 15 quesos de las ratas del pueblo y 240 frutos silvestres del oeste. Después te mostraré un nuevo camino al sureste.';
 $('trader-requirements').innerHTML=state.completed?'':`<div class="ingredient">Queso<b>${state.bag.cheese} / 15</b></div><div class="ingredient">Frutos silvestres<b>${state.bag.berries} / 240</b></div>`;
 $('deliver').hidden=state.completed;$('deliver').disabled=!RPG.canFinish(state);
 if(!$('trader-dialog').open)$('trader-dialog').showModal();
}
// A backdrop click closes the workshop; clicks inside (including empty space) do not.
const workshopDialog=$('workshop-dialog');let workshopBackdropPress=false;
function outsideWorkshop(e){const r=workshopDialog.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom}
workshopDialog.addEventListener('pointerdown',e=>{workshopBackdropPress=e.target===workshopDialog&&outsideWorkshop(e)});
workshopDialog.addEventListener('click',e=>{if(workshopBackdropPress&&e.target===workshopDialog&&outsideWorkshop(e))workshopDialog.close();workshopBackdropPress=false});
workshopDialog.addEventListener('pointercancel',()=>workshopBackdropPress=false);
workshopDialog.addEventListener('close',()=>workshopBackdropPress=false);
$('build-market').onclick=()=>{if(!RPG.buildMarket(state))return;showMarketLand();save();ui();forge();toast('Mercado construido · el territorio del oeste está abierto. Hay ratas en el pueblo.')};
$('new-region').onclick=()=>choose(marketHouse);
$('find-berries').onclick=()=>{$('market-dialog').close();const r=closest(resources.filter(n=>n.userData.resource==='berries'));r?choose(r):toast('Los arbustos se están regenerando')};
$('find-rats').onclick=()=>{$('market-dialog').close();const r=closest(lions.filter(n=>n.userData.kind==='rat'));r?choose(r):toast('Las ratas volverán pronto')};
$('find-trader').onclick=()=>{if(!RPG.traderReady(state))return;$('market-dialog').close();choose(trader)};
$('deliver').onclick=()=>{if(!RPG.finish(state))return;showDragonLand();save();ui();traderDialog();toast('Don Tito abrió el camino al sureste · dragón recomendado para espada +10')};
function bush(x,z){
 const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 for(let i=0;i<3;i++){const leaf=sphere(.42,'#49784d',(i-1)*.35,.35,(i%2)*.2,g);leaf.scale.set(1,.75,1)}
 for(let i=0;i<7;i++)sphere(.09,'#d88794',Math.sin(i*2)*.5,.5+Math.cos(i)*.1,Math.cos(i*2)*.4,g);
 const sign=label('FRUTOS SILVESTRES','#e1eed0',30);sign.position.y=1.2;sign.scale.set(2.5,.62,1);g.add(sign);
 g.userData={type:'resource',resource:'berries',name:'Frutos silvestres',stock:3,depleted:false,regen:0,baseScale:1,sign};resources.push(g);entities.push(g);g.visible=state.market;
}
function rat(x,z,id){
 const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 const body=sphere(.43,'#7c7a73',0,.4,0,g);body.scale.set(.7,.7,1.4);sphere(.27,'#989286',0,.48,.48,g);sphere(.15,'#d6a7a0',0,.4,.73,g);
 for(const side of [-1,1]){sphere(.16,'#b9a29b',side*.2,.75,.35,g);sphere(.035,'#242222',side*.12,.54,.68,g)}
 const legs=[];for(const xx of [-.22,.22])for(const zz of [-.3,.3])legs.push(mesh(new THREE.CylinderGeometry(.065,.08,.24,5),mat('#9d8279'),xx,.12,zz,g));
 const tail=mesh(new THREE.CylinderGeometry(.035,.025,.95,5),mat('#c09b95'),0,.24,-.95,g);tail.rotation.x=Math.PI/2;
 const tag=label('RATA · Nv. 1','#e5d8c6',33);tag.position.y=1.3;tag.scale.set(1.8,.45,1);g.add(tag);
 const bar=new THREE.Group();bar.position.y=1;g.add(bar);mesh(new THREE.PlaneGeometry(1,.1),new THREE.MeshBasicMaterial({color:'#443c30'}),0,0,0,bar);const fill=mesh(new THREE.PlaneGeometry(.96,.065),new THREE.MeshBasicMaterial({color:'#dc9a79'}),0,0,.01,bar);
 g.userData={type:'rat',kind:'rat',waveId:id,name:'Rata del pueblo',hp:48,max:48,home:new THREE.Vector3(x,0,z),index:8+id,attack:0,respawn:0,legs,bar,fill,aggro:false};g.visible=state.market;lions.push(g);entities.push(g);
}
function thirdRegion(){
 marketLand=new THREE.Group();scene.add(marketLand);
 mesh(new THREE.CylinderGeometry(11.5,10,1.1,48),mat('#819369'),-36,-.6,7,marketLand);mesh(new THREE.CylinderGeometry(10,6,5,12),mat('#485e4b'),-36,-3.6,7,marketLand);
 mesh(new THREE.BoxGeometry(12,.35,4),mat('#b9ab7e'),-22,-.16,7,marketLand);
 for(let i=0;i<13;i++){const a=i/13*Math.PI*2;const t=tree(-36+Math.cos(a)*10,7+Math.sin(a)*10,1);marketLand.add(t)}
 marketHouse=house(-38,7,'#b67d62','MERCADO','market');
 for(const [x,z]of [[-31,2],[-33,13],[-40,1],[-43,11],[-29,7],[-34,0],[-38,15],[-44,5]])bush(x,z);
 for(const [id,pos]of [[-8,4],[1,6],[7,11],[-5,13],[3,15],[-12,10],[-10,14],[8,5],[10,9],[0,17]].entries())rat(pos[0],pos[1],id);
 trader=character('#6486a1');trader.position.set(-6,0,-30.5);const tag=label('DON TITO','#ffdda1',34);tag.position.y=2.3;trader.add(tag);trader.userData={type:'trader',name:'Don Tito',approach:new THREE.Vector3(-5.5,0,-30)};entities.push(trader);
 // Preserve unfinished waves across reloads. A full wave starts again after its cooldown.
 for(const e of lions){const d=e.userData;if((d.kind==='bear'&&(state.bearWaveMask&(1<<d.waveId)))||(d.kind==='rat'&&(state.ratWaveMask&(1<<d.waveId)))){d.type='dead';d.respawn=0;e.visible=false}}
 showMarketLand();
}


function checkMission(){
 if(paused())return;const m=RPG.mission(state);if(state.missionSeen===m.id)return;
 $('mission-title').textContent=m.title;$('mission-description').textContent=m.text;$('mission-dialog').showModal();releaseStick();
}
$('mission-accept').onclick=()=>{state.missionSeen=RPG.mission(state).id;save();$('mission-dialog').close()};
$('mission-dialog').addEventListener('cancel',()=>{state.missionSeen=RPG.mission(state).id;save()});
function damageNumber(entity,amount,hurt){
 const node=document.createElement('span');node.className='damage-number '+(hurt?'damage-taken':'damage-dealt');node.textContent='−'+amount;$('damage-layer').appendChild(node);
 damageNumbers.push({node,position:entity.position.clone().add(new THREE.Vector3(0,hurt?2.7:entity.userData.kind==='dragon'?3.4:2.5,0)),age:0});
}
function renderDamage(dt){
 const r=renderer.domElement.getBoundingClientRect();for(let i=damageNumbers.length-1;i>=0;i--){const n=damageNumbers[i];n.age+=dt;if(n.age>.85){n.node.remove();damageNumbers.splice(i,1);continue}const point=n.position.clone();point.y+=n.age*1.2;point.project(camera);n.node.style.left=(r.left+(point.x*.5+.5)*r.width)+'px';n.node.style.top=(r.top+(-point.y*.5+.5)*r.height)+'px';n.node.style.opacity=Math.min(1,(.85-n.age)*3);n.node.hidden=point.z>1||point.z< -1;}
}
function updateDragonForge(){
 $('dragon-forge').hidden=!state.completed;
 $('shield-note').textContent=state.dragonQuestDone?'¡Sos una leyenda! Entregaste las 10 pieles. Podés seguir explorando.':state.shield?'Escudo equipado: recibís 70% menos daño. Aparecieron cinco dragones. Traé 10 pieles al taller. Tenés '+state.bag.dragonHide+'/10.':'Traé 1 piel de dragón para fabricar un escudo. Tenés '+state.bag.dragonHide+'/1. Reduce el daño recibido un 70%.';
 $('craft-shield').hidden=state.shield;$('craft-shield').disabled=state.bag.dragonHide<1;
 $('deliver-hides').hidden=!state.shield||state.dragonQuestDone;$('deliver-hides').disabled=state.bag.dragonHide<10;
}
function equipShield(){
 if(!shieldModel){shieldModel=new THREE.Group();shieldModel.position.set(.55,.95,.12);player.add(shieldModel);
 const face=mesh(new THREE.CylinderGeometry(.48,.37,.13,6),mat('#853f36',{metalness:.5,roughness:.4}),0,0,0,shieldModel);face.rotation.x=Math.PI/2;
 const rim=mesh(new THREE.TorusGeometry(.42,.055,6,6),mat('#e5ba69'),0,0,.09,shieldModel);
 const emblem=mesh(new THREE.ConeGeometry(.16,.43,3),mat('#ffdc91'),0,0,.16,shieldModel);emblem.rotation.z=Math.PI;
 }shieldModel.visible=state.shield;
}
$('craft-shield').onclick=()=>{if(!RPG.craftShield(state))return;equipShield();showDragonLand(true);save();ui();forge();toast('Escudo de dragón equipado · 70% menos daño recibido')};
$('deliver-hides').onclick=()=>{if(!RPG.deliverDragonHides(state))return;save();ui();forge();toast('¡Sos una leyenda! Entregaste las 10 pieles de dragón.')};
$('dragons').onclick=()=>{const enemy=closest(lions.filter(e=>e.userData.kind==='dragon'));enemy?choose(enemy):toast(state.shield?'Los dragones volverán pronto':'Llevá la piel al taller y fabricá tu escudo')};
function showDragonLand(reset=false){
 dragonLand.visible=state.completed;
 for(const e of lions.filter(e=>e.userData.kind==='dragon')){const d=e.userData;if(reset){d.type='dragon';d.hp=d.max;d.aggro=false;d.attack=0;e.position.copy(d.home)}e.visible=state.completed&&d.type!=='dead'&&(state.shield||(d.dragonId===0&&state.dragonKills===0));}
}
function dragon(x,z,id){
 const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);const body=sphere(.9,'#873f37',0,1,0,g);body.scale.set(.8,.8,1.25);
 sphere(.5,'#ae5844',0,1.65,1,g);const snout=sphere(.36,'#bd7454',0,1.47,1.45,g);snout.scale.set(.8,.65,1.3);
 const legs=[];for(const xx of [-.5,.5])for(const zz of [-.6,.55])legs.push(mesh(new THREE.CylinderGeometry(.14,.22,.7,5),mat('#70352f'),xx,.35,zz,g));
 for(const side of [-1,1]){sphere(.07,'#ffe272',side*.25,1.8,1.35,g);mesh(new THREE.ConeGeometry(.13,.65,5),mat('#e5c98b'),side*.36,2.12,.85,g);
 const wing=new THREE.BufferGeometry();wing.setAttribute('position',new THREE.Float32BufferAttribute([side*.45,1.2,-.5,side*2.4,2.8,-.8,side*1.7,1,-1.3],3));wing.computeVertexNormals();mesh(wing,mat('#c17d54',{side:THREE.DoubleSide}),0,0,0,g);}
 const tail=mesh(new THREE.ConeGeometry(.27,2,6),mat('#873f37'),0,.65,-1.7,g);tail.rotation.x=-Math.PI/2;
 for(let j=0;j<4;j++)mesh(new THREE.ConeGeometry(.14,.35,4),mat('#e4b46c'),0,1.7,-.8+j*.4,g);
 const tag=label('DRAGÓN · ESPADA +10','#ffcf8f',30);tag.position.y=3;g.add(tag);
 const bar=new THREE.Group();bar.position.y=2.6;g.add(bar);mesh(new THREE.PlaneGeometry(1.6,.14),new THREE.MeshBasicMaterial({color:'#443c30'}),0,0,0,bar);const fill=mesh(new THREE.PlaneGeometry(.96,.09),new THREE.MeshBasicMaterial({color:'#e09678'}),0,0,.01,bar);
 g.userData={type:'dragon',kind:'dragon',dragonId:id,name:'Dragón del sureste',hp:1100,max:1100,home:g.position.clone(),index:20+id,attack:0,respawn:0,legs,bar,fill,aggro:false};lions.push(g);entities.push(g);
}
function dragonRegion(){
 dragonLand=new THREE.Group();scene.add(dragonLand);
 mesh(new THREE.CylinderGeometry(13.5,12,1.1,48),mat('#92775e'),35,-.6,35,dragonLand);mesh(new THREE.CylinderGeometry(12,7,6,12),mat('#59463d'),35,-3.6,35,dragonLand);
 const road=mesh(new THREE.BoxGeometry(4.4,.35,26),mat('#b6a17c'),20,-.16,20,dragonLand);road.rotation.y=Math.PI/4;
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const rock=sphere(1,'#685b50',35+Math.cos(a)*12,-.1,35+Math.sin(a)*12,dragonLand);rock.scale.y=2;}
 const sign=label('SURESTE · DRAGONES','#ffd99c',30);sign.position.set(23,2,23);dragonLand.add(sign);
 for(const [id,coords]of [[35,32],[29,35],[41,35],[32,41],[40,41]].entries())dragon(coords[0],coords[1],id);
 showDragonLand();
}

// One compact disclosure keeps all travel and gathering shortcuts off the field.
function setActionsOpen(open){
 $('actions-panel').hidden=!open;$('actions-backdrop').hidden=!open;$('actions-toggle').setAttribute('aria-expanded',String(open));
 if(open)releaseStick();
}
$('actions-toggle').onclick=()=>setActionsOpen($('actions-panel').hidden);
$('actions-backdrop').onclick=e=>{e.stopPropagation();setActionsOpen(false)};
$('actions-backdrop').addEventListener('pointerdown',e=>e.stopPropagation());
$('actions-panel').addEventListener('click',e=>{if(e.target.closest('button'))setActionsOpen(false)});
$('actions-menu').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();setActionsOpen(false);$('actions-toggle').focus()}});
$('travel-rats').onclick=()=>$('find-rats').onclick();
$('travel-trader').onclick=()=>$('find-trader').onclick();

try{init()}catch(e){$('error').hidden=false;console.error(e)}

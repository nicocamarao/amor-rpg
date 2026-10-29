const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),THREE=require('./vendor/three.min.js'),RPG=require('./core.js');
const nodes=new Map();function node(id){if(!nodes.has(id))nodes.set(id,{style:{},classList:{add(){},remove(){}},animate(){},hidden:false,events:{},addEventListener(name,fn){this.events[name]=fn},getBoundingClientRect(){return {left:100,right:400,top:100,bottom:400}},close(){this.closed=true}});return nodes.get(id)}
const context=vm.createContext({THREE,RPG,console,localStorage:{getItem(){return null},setItem(){}},document:{getElementById:node,querySelectorAll(){return []},querySelector(){return null}},setTimeout(){return 1},clearTimeout(){},location:{reload(){}}});
let code=fs.readFileSync('game.js','utf8');code=code.slice(0,code.lastIndexOf('try{init()}'));vm.runInContext(code,context);
vm.runInContext(`player={position:new THREE.Vector3(-4,0,7)};marker={visible:false};ui=()=>{};pop=()=>{};toast=()=>{};damageNumber=()=>{};state=RPG.fresh();`,context);
assert.equal(vm.runInContext('route(new THREE.Vector3(0,0,-30)).length',context),0);
vm.runInContext('state.bridge=true',context);assert.ok(vm.runInContext('route(new THREE.Vector3(0,0,-30)).length',context)>0);
vm.runInContext(`state.sword=4;const testBear={visible:true,userData:{type:'bear',kind:'bear',hp:2}};perform(testBear);`,context);assert.equal(vm.runInContext('testBear.userData.hp',context),1);vm.runInContext('state.sword=5;attackCD=0;perform(testBear)',context);assert.equal(vm.runInContext('testBear.visible',context),false);assert.equal(vm.runInContext('state.bag.hide',context),3);assert.equal(vm.runInContext('selected',context),null);assert.equal(vm.runInContext('entities.length',context),0);console.log('PASS: actual route crosses only built bridge; combat does 1 damage below +5 and gives loot without ground entity');
vm.runInContext(`
state=RPG.fresh();state.bridge=true;state.market=true;assertRoute=route(new THREE.Vector3(-36,0,10)).length;
player=new THREE.Group();player.position.set(0,0,-5);player.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial()));sword=new THREE.Group();marker=new THREE.Object3D();selected=null;path=[];lions.length=0;
function mockEnemy(x){const g=new THREE.Group();g.position.set(x,0,-5);g.userData={type:'lion',kind:'lion',name:'León',hp:48,max:48,home:g.position.clone(),index:0,attack:0,respawn:0,legs:[],fill:new THREE.Object3D(),aggro:true};lions.push(g);return g}
const first=mockEnemy(.5),second=mockEnemy(-.5);tick(.01);autoTarget=selected===first;first.userData.attack=0;second.userData.attack=0;tick(.01);stickyTarget=selected===first;choose(second);manualTarget=selected===second;first.userData.attack=0;second.userData.attack=0;tick(.01);manualSticky=selected===second;
`,context);
assert.ok(vm.runInContext('assertRoute',context)>0);for(const k of ['autoTarget','stickyTarget','manualTarget','manualSticky'])assert.equal(vm.runInContext(k,context),true,k);
console.log('PASS: route to market, retaliation, sticky target under multiple attackers and explicit retarget');
vm.runInContext(`selected=null;lions.length=0;path=[];state.market=true;player.position.set(-8,0,11);obstacles.push({x:-8,z:8,r:2},{x:-38,z:7,r:2});const westGoal=new THREE.Vector3(-38,0,10);go(westGoal);for(let frame=0;frame<2000;frame++)tick(.05);reachedWest=distance(player.position,westGoal)<.25;`,context);assert.equal(vm.runInContext('reachedWest',context),true);console.log('PASS: actual movement completes the narrow western passage without boundary stalls');

const dialog=nodes.get('workshop-dialog');dialog.events.pointerdown({target:dialog,clientX:20,clientY:20});dialog.events.click({target:dialog,clientX:20,clientY:20});assert.equal(dialog.closed,true);dialog.closed=false;dialog.events.pointerdown({target:dialog,clientX:200,clientY:200});dialog.events.click({target:dialog,clientX:200,clientY:200});assert.equal(dialog.closed,false);console.log('PASS: workshop backdrop closes, interior does not');
vm.runInContext(`
state=RPG.fresh();state.completed=true;state.bridge=true;state.market=true;state.sword=9;lions.length=0;selected=null;path=[];player.position.copy(town);const dragonGoal=new THREE.Vector3(35,0,32);go(dragonGoal);for(let i=0;i<2500;i++)tick(.05);reachedDragon=distance(player.position,dragonGoal)<.25;
const dragonEnemy=new THREE.Group();dragonEnemy.position.copy(player.position);dragonEnemy.visible=true;dragonEnemy.userData={type:'dragon',kind:'dragon',name:'Dragón',hp:1100,max:1100,home:player.position.clone(),index:20,attack:0,legs:[],fill:new THREE.Object3D(),aggro:true};lions.push(dragonEnemy);choose(dragonEnemy);weakDragonSelected=selected===dragonEnemy;attackCD=0;perform(dragonEnemy);weakDragonHP=dragonEnemy.userData.hp;state.sword=10;attackCD=0;perform(dragonEnemy);strongDragonHP=dragonEnemy.userData.hp;
state.shield=true;state.hp=100;dragonEnemy.userData.attack=0;tick(.01);shieldHP=state.hp;
`,context);
assert.equal(vm.runInContext('reachedDragon',context),true);assert.equal(vm.runInContext('weakDragonSelected',context),true);assert.equal(vm.runInContext('weakDragonHP',context),1099);assert.ok(vm.runInContext('strongDragonHP',context)<1099);assert.equal(vm.runInContext('shieldHP',context),86);
console.log('PASS: actual southeast movement, under-level dragon selection/1 damage, +10 damage and equipped defense in combat');
vm.runInContext(fs.readFileSync('world.js','utf8'),context);
vm.runInContext(`
scene=new THREE.Scene();label=()=>new THREE.Object3D();lions.length=0;entities.length=0;state=RPG.fresh();state.completed=true;dragonRegion();initialDragons=lions.filter(e=>e.visible).length;
state.dragonKills=1;showDragonLand();afterFirst=lions.filter(e=>e.visible).length;
state.shield=true;showDragonLand(true);afterShield=lions.filter(e=>e.visible).length;equipShield();shieldVisible=shieldModel.visible&&shieldModel.parent===player;
`,context);
assert.equal(vm.runInContext('initialDragons',context),1);assert.equal(vm.runInContext('afterFirst',context),0);assert.equal(vm.runInContext('afterShield',context),5);assert.equal(vm.runInContext('shieldVisible',context),true);
console.log('PASS: actual dragon scene switches from one to five and shield mesh attaches to player');
vm.runInContext(`scene=new THREE.Scene();lions.length=0;entities.length=0;resources.length=0;obstacles.length=0;state=RPG.fresh();state.bridge=true;state.market=true;expansion();thirdRegion();player.position.copy(town);selected=null;path=[];titoRoute=route(trader.userData.approach).length;titoZ=trader.position.z;`,context);
assert.ok(vm.runInContext('titoRoute',context)>0);assert.equal(vm.runInContext('titoZ',context),-46);console.log('PASS: Don Tito sits at the back of the bear forest and has a navigable approach');

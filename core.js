(function(root){
const names={wood:'Madera',stone:'Piedra',gold:'Oro',hide:'Cuero',fang:'Colmillo',bearFang:'Colmillo de oso',berries:'Frutos silvestres',cheese:'Queso',dragonHide:'Piel de dragón'};
function fresh(){return {level:1,xp:0,hp:100,sword:0,kills:0,bearKills:0,bridge:false,market:false,completed:false,shield:false,dragonQuestDone:false,dragonKills:0,missionSeen:null,bearWaves:0,bearWaveMask:0,ratWaves:0,ratWaveMask:0,ratKills:0,bag:{wood:0,stone:0,gold:0,hide:0,fang:0,bearFang:0,berries:0,cheese:0,dragonHide:0}}}
function maxHP(s){return 100+(s.level-1)*15}
function damage(s){return 16+(s.level-1)*3+s.sword*7}
function threshold(s){return s.level*60}
function rewardXP(s,n){s.xp+=n;let levels=0;while(s.xp>=threshold(s)){s.xp-=threshold(s);s.level++;levels++}if(levels)s.hp=maxHP(s);return levels}
function cost(s){const n=s.sword+1;return {wood:6*n,stone:4*n,gold:3*n,hide:2*n}}
function canUpgrade(s){return s.sword<10&&Object.entries(cost(s)).every(([k,v])=>s.bag[k]>=v)}
function upgrade(s){if(!canUpgrade(s))return false;for(const [k,v] of Object.entries(cost(s)))s.bag[k]-=v;s.sword++;return true}
function restore(raw){const s=fresh();if(!raw||typeof raw!=='object')return s;for(const k of ['level','xp','sword','kills','bearKills','bearWaves','bearWaveMask','ratWaves','ratWaveMask','ratKills','dragonKills'])if(Number.isFinite(raw[k]))s[k]=Math.max(k==='level'?1:0,Math.min(10000,Math.floor(raw[k])));s.bridge=raw.bridge===true;s.market=raw.market===true;s.completed=raw.completed===true;s.shield=s.completed&&raw.shield===true;s.dragonQuestDone=s.shield&&raw.dragonQuestDone===true;s.missionSeen=typeof raw.missionSeen==='string'?raw.missionSeen:null;s.bearWaveMask&=7;s.ratWaveMask&=1023;s.sword=Math.min(10,s.sword);s.hp=Number.isFinite(raw.hp)?Math.max(1,Math.min(maxHP(s),raw.hp)):maxHP(s);for(const k in s.bag)if(Number.isFinite(raw.bag?.[k]))s.bag[k]=Math.max(0,Math.min(100000,Math.floor(raw.bag[k])));if(raw.bag&&raw.bag.bearFang===undefined){s.bag.bearFang=Math.min(s.bag.fang,s.bearKills*2);s.bag.fang-=s.bag.bearFang;s.bearWaves=Math.floor(s.bearKills/3)}return s}
const bridgeCost={wood:20,stone:12,gold:10};
function canBuildBridge(s){return !s.bridge&&Object.entries(bridgeCost).every(([k,n])=>s.bag[k]>=n)}
function buildBridge(s){if(!canBuildBridge(s))return false;for(const [k,n]of Object.entries(bridgeCost))s.bag[k]-=n;s.bridge=true;return true}
function land(s,x,z){return Math.hypot(x,z)<18.8||(s.bridge&&(Math.abs(x)<1.65&&z<=-18&&z>=-29||Math.hypot(x,z+38)<10.8))||(s.market&&((x<=-16&&x>=-27&&z>=5&&z<=9)||Math.hypot(x+36,z-7)<10.8))||(s.completed&&((x>=10&&x<=29&&Math.abs(z-x)<2.2)||Math.hypot(x-35,z-35)<12.8))}
function canHurt(s,kind){return s.sword>=requiredSword(kind)}
function requiredSword(kind){return kind==='dragon'?10:kind==='bear'?5:0}
function hitDamage(s,kind){return canHurt(s,kind)?damage(s):1}
function incomingDamage(s,kind){const base=kind==='dragon'?48:kind==='bear'?25:8;return s.shield?Math.max(1,Math.round(base*.3)):base}
function recordWave(s,kind,id){if(!Number.isInteger(id))return;const bear=kind==='bear',count=bear?3:10;if(id<0||id>=count)return;const mask=bear?'bearWaveMask':'ratWaveMask',waves=bear?'bearWaves':'ratWaves';s[mask]|=1<<id;if(s[mask]===(1<<count)-1){s[waves]++;s[mask]=0}}
function defeat(s,kind,id){const dragon=kind==='dragon',bear=kind==='bear',rat=kind==='rat';if(dragon)s.dragonKills++;else if(bear)s.bearKills++;else if(rat)s.ratKills++;else s.kills++;if(bear||rat)recordWave(s,kind,id);const items=dragon?{dragonHide:1,gold:20}:bear?{hide:3,gold:6,bearFang:2}:rat?{cheese:1,gold:2}:{hide:1,gold:2,fang:1};for(const [k,n]of Object.entries(items))s.bag[k]+=n;const xp=dragon?240:bear?100:rat?30:30;return {items,xp,levels:rewardXP(s,xp)}}
const marketFangs=30,cheeseRequired=15,berriesRequired=240;
const prices={wood:2,stone:3,hide:5,fang:4,bearFang:12,berries:2,cheese:6};
function canBuildMarket(s){return s.bridge&&!s.market&&s.bag.bearFang>=marketFangs}
function buildMarket(s){if(!canBuildMarket(s))return false;s.bag.bearFang-=marketFangs;s.market=true;return true}
function buy(s,key,count=1){if(!s.market||!Number.isInteger(count)||count<1||count>100||!Object.hasOwn(prices,key))return false;const cost=prices[key]*count;if(s.bag.gold<cost)return false;s.bag.gold-=cost;s.bag[key]+=count;return true}
function traderReady(s){return s.market}
function canFinish(s){return traderReady(s)&&!s.completed&&s.bag.cheese>=cheeseRequired&&s.bag.berries>=berriesRequired}
function finish(s){if(!canFinish(s))return false;s.bag.cheese-=cheeseRequired;s.bag.berries-=berriesRequired;s.completed=true;return true}
function craftShield(s){if(!s.completed||s.shield||s.bag.dragonHide<1)return false;s.bag.dragonHide--;s.shield=true;return true}
function deliverDragonHides(s){if(!s.shield||s.dragonQuestDone||s.bag.dragonHide<10)return false;s.bag.dragonHide-=10;s.dragonQuestDone=true;return true}
function mission(s){
 if(s.dragonQuestDone)return {id:'done',title:'¡Sos una leyenda!',text:'Completaste los encargos. Seguí explorando el valle.',progress:'Aventura completada'};
 if(s.shield)return s.bag.dragonHide>=10?{id:'dragon-delivery',title:'Volvé al taller',text:'Llevá las 10 pieles de dragón al taller para completar el encargo.',progress:'10 pieles listas para entregar'}:{id:'dragon-pack',title:'Reuní 10 pieles de dragón',text:'Ahora hay cinco dragones al sureste. Tu escudo reduce el daño recibido un 70%.',progress:`Pieles ${s.bag.dragonHide}/10`};
 if(s.completed)return s.bag.dragonHide>=1?{id:'shield',title:'Construí tu escudo de dragón',text:'Llevá 1 piel de dragón al taller. Fabricarán un escudo para vos.',progress:'1 piel lista para entregar'}:{id:'dragon',title:'Derrotá al dragón del sureste',text:'Don Tito abrió el camino al sureste. Mejorá tu espada a +10 y conseguí 1 piel de dragón.',progress:`Piel ${s.bag.dragonHide}/1 · Espada +${s.sword}/10`};
 if(s.market){if(s.bag.cheese<15)return {id:'cheese',title:'Matá las ratas y recogé el queso',text:'Las ratas invadieron el pueblo. Reuní 15 quesos para el hombre del bosque de osos.',progress:`Queso ${s.bag.cheese}/15`};if(s.bag.berries<240)return {id:'berries',title:'Recolectá frutos silvestres',text:'Don Tito también necesita 240 frutos. Buscalos al oeste o compralos en el mercado.',progress:`Frutos ${s.bag.berries}/240 · Queso ${s.bag.cheese}/15`};return {id:'trader',title:'Llevá el queso a Don Tito',text:'Buscá al hombre del bosque de osos y entregale los 15 quesos y 240 frutos.',progress:'Queso y frutos listos para entregar'}}
 if(s.bridge)return {id:'market',title:'Construí el mercado del oeste',text:'Reuní 30 colmillos de oso y llevalos al taller. Espada recomendada: +5.',progress:`Colmillos de oso ${s.bag.bearFang}/30`};
 if(s.sword>=1)return {id:'bridge',title:'Abrí el camino al bosque',text:'Llevá 20 maderas, 12 piedras y 10 oros al taller para construir el puente.',progress:`Madera ${s.bag.wood}/20 · Piedra ${s.bag.stone}/12 · Oro ${s.bag.gold}/10`};
 return {id:'sword',title:'Prepará tu primera espada',text:'Recolectá 6 maderas, 4 piedras, 3 oros y 2 cueros de león. Mejorá tu espada en el taller.',progress:`Madera ${s.bag.wood}/6 · Piedra ${s.bag.stone}/4 · Oro ${s.bag.gold}/3 · Cuero ${s.bag.hide}/2`};
}
function respawn(s){s.hp=maxHP(s);return {x:-4,y:0,z:7}}
const api={requiredSword,hitDamage,incomingDamage,craftShield,deliverDragonHides,mission,names,fresh,maxHP,damage,threshold,rewardXP,cost,canUpgrade,upgrade,restore,bridgeCost,canBuildBridge,buildBridge,land,canHurt,defeat,respawn,marketFangs,cheeseRequired,berriesRequired,prices,canBuildMarket,buildMarket,buy,traderReady,canFinish,finish};root.RPG=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);

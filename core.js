(function(root){
const names={wood:'Madera',stone:'Piedra',gold:'Oro',hide:'Cuero',fang:'Colmillo'};
function fresh(){return {level:1,xp:0,hp:100,sword:0,kills:0,bearKills:0,bridge:false,bag:{wood:0,stone:0,gold:0,hide:0,fang:0}}}
function maxHP(s){return 100+(s.level-1)*15}
function damage(s){return 16+(s.level-1)*3+s.sword*7}
function threshold(s){return s.level*60}
function rewardXP(s,n){s.xp+=n;let levels=0;while(s.xp>=threshold(s)){s.xp-=threshold(s);s.level++;levels++}if(levels)s.hp=maxHP(s);return levels}
function cost(s){const n=s.sword+1;return {wood:6*n,stone:4*n,gold:3*n,hide:2*n}}
function canUpgrade(s){return s.sword<5&&Object.entries(cost(s)).every(([k,v])=>s.bag[k]>=v)}
function upgrade(s){if(!canUpgrade(s))return false;for(const [k,v] of Object.entries(cost(s)))s.bag[k]-=v;s.sword++;return true}
function restore(raw){const s=fresh();if(!raw||typeof raw!=='object')return s;for(const k of ['level','xp','sword','kills','bearKills'])if(Number.isFinite(raw[k]))s[k]=Math.max(k==='level'?1:0,Math.min(10000,Math.floor(raw[k])));s.bridge=raw.bridge===true;s.sword=Math.min(5,s.sword);s.hp=Number.isFinite(raw.hp)?Math.max(1,Math.min(maxHP(s),raw.hp)):maxHP(s);for(const k in s.bag)if(Number.isFinite(raw.bag?.[k]))s.bag[k]=Math.max(0,Math.min(100000,Math.floor(raw.bag[k])));return s}
const bridgeCost={wood:20,stone:12,gold:10};
function canBuildBridge(s){return !s.bridge&&Object.entries(bridgeCost).every(([k,n])=>s.bag[k]>=n)}
function buildBridge(s){if(!canBuildBridge(s))return false;for(const [k,n]of Object.entries(bridgeCost))s.bag[k]-=n;s.bridge=true;return true}
function land(s,x,z){return Math.hypot(x,z)<18.8||(s.bridge&&(Math.abs(x)<1.65&&z<=-18&&z>=-29||Math.hypot(x,z+38)<10.8))}
function canHurt(s,kind){return kind!=='bear'||s.sword>=5}
function defeat(s,kind){const bear=kind==='bear';if(bear)s.bearKills++;else s.kills++;const items=bear?{hide:3,gold:6,fang:2}:{hide:1,gold:2,fang:1};for(const [k,n]of Object.entries(items))s.bag[k]+=n;const xp=bear?100:30;return {items,xp,levels:rewardXP(s,xp)}}
function respawn(s){s.hp=maxHP(s);return {x:-4,y:0,z:7}}
const api={names,fresh,maxHP,damage,threshold,rewardXP,cost,canUpgrade,upgrade,restore,bridgeCost,canBuildBridge,buildBridge,land,canHurt,defeat,respawn};root.RPG=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);

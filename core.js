(function(root){
const names={wood:'Madera',stone:'Piedra',gold:'Oro',hide:'Cuero',fang:'Colmillo'};
function fresh(){return {level:1,xp:0,hp:100,sword:0,kills:0,bag:{wood:0,stone:0,gold:0,hide:0,fang:0}}}
function maxHP(s){return 100+(s.level-1)*15}
function damage(s){return 16+(s.level-1)*3+s.sword*7}
function threshold(s){return s.level*60}
function rewardXP(s,n){s.xp+=n;let levels=0;while(s.xp>=threshold(s)){s.xp-=threshold(s);s.level++;levels++}if(levels)s.hp=maxHP(s);return levels}
function cost(s){const n=s.sword+1;return {wood:6*n,stone:4*n,gold:3*n,hide:2*n}}
function canUpgrade(s){return s.sword<5&&Object.entries(cost(s)).every(([k,v])=>s.bag[k]>=v)}
function upgrade(s){if(!canUpgrade(s))return false;for(const [k,v] of Object.entries(cost(s)))s.bag[k]-=v;s.sword++;return true}
function restore(raw){const s=fresh();if(!raw||typeof raw!=='object')return s;for(const k of ['level','xp','sword','kills'])if(Number.isFinite(raw[k]))s[k]=Math.max(k==='level'?1:0,Math.min(10000,Math.floor(raw[k])));s.sword=Math.min(5,s.sword);s.hp=Number.isFinite(raw.hp)?Math.max(1,Math.min(maxHP(s),raw.hp)):maxHP(s);for(const k in s.bag)if(Number.isFinite(raw.bag?.[k]))s.bag[k]=Math.max(0,Math.min(100000,Math.floor(raw.bag[k])));return s}
const api={names,fresh,maxHP,damage,threshold,rewardXP,cost,canUpgrade,upgrade,restore};root.RPG=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);

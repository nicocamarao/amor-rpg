const assert=require('node:assert/strict');const R=require('./core.js');
const s=R.fresh();assert.equal(R.upgrade(s),false);assert.equal(s.sword,0);
Object.assign(s.bag,{wood:6,stone:4,gold:3,hide:2});assert.equal(R.upgrade(s),true);assert.equal(s.sword,1);assert.equal(s.bag.wood,0);assert.equal(R.damage(s),23);assert.equal(R.upgrade(s),false);
s.hp=20;assert.equal(R.rewardXP(s,60),1);assert.equal(s.level,2);assert.equal(s.xp,0);assert.equal(s.hp,115);
const r=R.restore({level:-2,sword:99,hp:999,bag:{wood:-10,stone:NaN,gold:7}});assert.equal(r.level,1);assert.equal(r.sword,5);assert.equal(r.hp,100);assert.equal(r.bag.wood,0);assert.equal(r.bag.gold,7);
assert.equal(R.canUpgrade(r),false);console.log('PASS: recipes, atomic upgrade, damage, XP, healing and save validation');

const assert=require('node:assert/strict'),R=require('./core.js');const s=R.fresh();s.bridge=true;s.sword=5;
for(let wave=0;wave<4;wave++)for(let id=0;id<3;id++)R.defeat(s,'bear',id);
assert.equal(s.bearWaves,4);assert.equal(R.canBuildMarket(s),false);
R.defeat(s,'bear',0);const loaded=R.restore(JSON.parse(JSON.stringify(s)));assert.equal(loaded.bearWaveMask,1);R.defeat(loaded,'bear',1);R.defeat(loaded,'bear',2);assert.equal(loaded.bearWaves,5);assert.equal(loaded.bag.bearFang,30);assert.equal(R.buildMarket(loaded),true);assert.equal(loaded.bag.bearFang,0);assert.equal(R.buildMarket(loaded),false);
assert.equal(R.land(R.fresh(),-36,7),false);assert.equal(R.land(loaded,-36,7),true);assert.equal(R.land(loaded,-22,7),true);
const gold=loaded.bag.gold;assert.equal(R.buy(loaded,'berries',10),true);assert.equal(loaded.bag.gold,gold-20);assert.equal(R.buy(loaded,'gold'),false);assert.equal(R.buy(loaded,'berries',-1),false);assert.equal(R.buy(loaded,'berries',100),false);
for(let wave=0;wave<3;wave++)for(let id=0;id<10;id++)R.defeat(loaded,'rat',id);assert.equal(loaded.ratWaves,3);assert.equal(loaded.bag.cheese,30);assert.equal(R.traderReady(loaded),true);assert.equal(R.canFinish(loaded),false);
loaded.bag.berries=240;assert.equal(R.finish(loaded),true);assert.equal(loaded.bag.cheese,15);assert.equal(loaded.bag.berries,0);assert.equal(R.finish(loaded),false);assert.equal(R.restore(loaded).completed,true);assert.equal(loaded.market,true);
const legacy=R.restore({bearKills:15,bridge:true,bag:{fang:35}});assert.equal(legacy.bearWaves,5);assert.equal(legacy.bag.bearFang,30);assert.equal(legacy.bag.fang,5);
const locked=R.fresh();locked.bag.gold=999;locked.bag.cheese=15;locked.bag.berries=240;assert.equal(R.buy(locked,'wood'),false);assert.equal(R.finish(locked),false);
console.log('PASS: five complete bear waves, save migration, market debit/gating, purchases, three rat hordes, final delivery and replay protection');

const partial=R.fresh();for(let id=0;id<9;id++)R.defeat(partial,'rat',id);assert.equal(partial.ratWaves,0);const resumed=R.restore(JSON.parse(JSON.stringify(partial)));assert.equal(resumed.ratWaveMask,511);R.defeat(resumed,'rat',9);assert.equal(resumed.ratWaves,1);assert.equal(resumed.ratWaveMask,0);assert.equal(resumed.bag.cheese,10);assert.equal(R.restore({ratWaveMask:16}).ratWaveMask,16);console.log('PASS: ten-rat wave completes only on tenth kill; partial and legacy masks survive reload');

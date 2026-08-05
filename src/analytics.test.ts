import { describe, expect, it } from 'vitest';
import { baseline, median, pacing, period, rate, spike, state, used } from './analytics';
import { UsageSample } from './domain';

const sample=(hoursAgo:number, credits:number):UsageSample=>({id:String(hoursAgo),observedAt:new Date(Date.now()-hoursAgo*3600000).toISOString(),credits,quality:'exact',sourceId:'test'});
describe('analytics',()=>{
 it('uses a robust median baseline',()=>expect(median([1,2,3,100])).toBe(2.5));
 it('aggregates only the requested period',()=>{const now=new Date();const [a,b]=period('daily',now);expect(used([sample(1,4),sample(30,8)],a,b)).toBe(4);});
 it('calculates a rolling burn rate',()=>expect(rate([sample(.25,5)],new Date(),30)).toBe(10));
 it('does not call a trivial change a surge',()=>expect(state(3,2,false)).toBe('Active'));
 it('classifies a substantial risky burst as critical',()=>expect(state(4.2,14,true)).toBe('Critical'));
 it('returns zero for an empty baseline',()=>expect(baseline([])).toBe(0));
 it('calculates pacing against elapsed period',()=>{const now=new Date();const start=new Date(now.getTime()-50*3600000);const end=new Date(now.getTime()+50*3600000);expect(pacing({kind:'daily',amount:100,consumed:70,periodStart:start,periodEnd:end},now)).toBeCloseTo(.2);});
 it('detects a substantial burst with enough history',()=>{const samples=[sample(.1,15),...Array.from({length:8},(_,i)=>sample((i+1)*24+.1,1))];expect(spike(samples,new Date(),30,2.5,10,8).triggered).toBe(true);});
});

import { describe, expect, it } from 'vitest';
import { baseline, median, period, rate, state, used } from './analytics';
import { UsageSample } from './domain';

const sample=(hoursAgo:number, credits:number):UsageSample=>({id:String(hoursAgo),observedAt:new Date(Date.now()-hoursAgo*3600000).toISOString(),credits,quality:'exact',sourceId:'test'});
describe('analytics',()=>{
 it('uses a robust median baseline',()=>expect(median([1,2,3,100])).toBe(2.5));
 it('aggregates only the requested period',()=>{const now=new Date();const [a,b]=period('daily',now);expect(used([sample(1,4),sample(30,8)],a,b)).toBe(4);});
 it('calculates a rolling burn rate',()=>expect(rate([sample(.25,5)],new Date(),30)).toBe(10));
 it('does not call a trivial change a surge',()=>expect(state(3,2,false)).toBe('Active'));
 it('classifies a substantial risky burst as critical',()=>expect(state(4.2,14,true)).toBe('Critical'));
 it('returns zero for an empty baseline',()=>expect(baseline([])).toBe(0));
});

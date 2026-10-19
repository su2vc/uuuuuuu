import test from 'node:test';
import assert from 'node:assert/strict';
import {entryDecision,isBirthday} from '../src/entryRules.js';

test('only the complete correct password grants entry',()=>{
 for(const value of ['', '102', '020', '0000', '10200', '1020 ', '0621'])assert.equal(entryDecision(value).granted,false);
 assert.equal(entryDecision('1020').granted,true);
});
test('ordinary dates grant entry without the birthday celebration by default',()=>{
 assert.deepEqual(entryDecision('1020',new Date('2026-10-16T12:00:00+08:00')),{granted:true,birthday:false});
});
test('birthday begins at midnight in Shanghai, not the browser timezone',()=>{
 assert.equal(isBirthday(new Date('2026-10-19T15:59:59Z')),false);
 assert.equal(isBirthday(new Date('2026-10-19T16:00:00Z')),true);
});
test('birthday ends at the next midnight in Shanghai',()=>{
 assert.equal(isBirthday(new Date('2026-10-20T15:59:59Z')),true);
 assert.equal(isBirthday(new Date('2026-10-20T16:00:00Z')),false);
});
test('birthday repeats every year and only celebrates after successful entry',()=>{
 const date=new Date('2027-10-20T12:00:00+08:00');
 assert.deepEqual(entryDecision('1020',date),{granted:true,birthday:true});
 assert.deepEqual(entryDecision('9999',date),{granted:false,birthday:false});
 assert.equal(isBirthday(new Date('invalid')),false);
});

test('default entry only celebrates within October 20 in Shanghai',()=>{
 for(const [instant,birthday] of [
  ['2026-10-19T15:59:59.999Z',false],
  ['2026-10-19T16:00:00.000Z',true],
  ['2026-10-20T15:59:59.999Z',true],
  ['2026-10-20T16:00:00.000Z',false],
 ])assert.deepEqual(entryDecision('1020',new Date(instant)),{granted:true,birthday});
});

test('an explicit review override can still preview the birthday celebration',()=>{
 assert.deepEqual(entryDecision('1020',new Date('2026-10-16T12:00:00+08:00'),{birthdayTestMode:true}),{granted:true,birthday:true});
});

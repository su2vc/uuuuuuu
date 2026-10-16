import test from 'node:test';
import assert from 'node:assert/strict';
import {entryDecision,isBirthday} from '../src/entryRules.js';

test('only the complete correct password grants entry',()=>{
 for(const value of ['', '102', '0000', '10200', '1020 '])assert.equal(entryDecision(value).granted,false);
 assert.equal(entryDecision('1020').granted,true);
});
test('review mode celebrates on ordinary dates after a correct password',()=>{
 assert.deepEqual(entryDecision('1020',new Date('2026-10-16T12:00:00+08:00')),{granted:true,birthday:true});
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

test('turning review mode off restores the October 20 rule',()=>{
 const options={birthdayTestMode:false};
 assert.deepEqual(entryDecision('1020',new Date('2026-10-16T12:00:00+08:00'),options),{granted:true,birthday:false});
 assert.deepEqual(entryDecision('1020',new Date('2026-10-20T12:00:00+08:00'),options),{granted:true,birthday:true});
});

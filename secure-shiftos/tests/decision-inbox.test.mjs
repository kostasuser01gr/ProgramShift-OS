import test from 'node:test';import assert from 'node:assert/strict';
import {decisionInbox} from '../lib/decision-inbox.mjs';
test('high-severity issues stay first, with stable links',()=>{const r=decisionInbox({invalid:1,missing:2,warnings:3,status:'REVIEW'});assert.deepEqual(r.map(x=>x.id),['invalid','missing','checks','approve']);assert(r.slice(0,3).every(x=>x.severity==='high'));});
test('published month suggests backup verification, never implies auto backup',()=>{const r=decisionInbox({status:'PUBLISHED'});assert.equal(r[0].route,'backup');assert.match(r[0].description,/Επιβεβαίωσε/);});
test('missing tenant setup does not invite editing',()=>{const r=decisionInbox({status:'UNCONFIGURED'});assert.equal(r[0].route,'flow');});
test('malformed counts remain bounded and safe',()=>{const r=decisionInbox({missing:NaN,invalid:-99,warnings:Infinity,status:'DRAFT'});assert(!r.some(x=>x.severity==='high'));});
test('inbox output has no personal data or actionable hidden writes',()=>{const r=decisionInbox({missing:3,status:'REVIEW'});assert(r.every(x=>!('employee' in x)&&!('mutation' in x)&&['checks','schedule','flow','backup','release'].includes(x.route)));});

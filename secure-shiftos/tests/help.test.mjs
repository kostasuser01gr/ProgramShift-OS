import test from 'node:test';
import assert from 'node:assert/strict';
import {CONNECTIONS,GUIDE_STEPS,HELP_TOPICS,normalizeGreek,nextStep,searchHelp,topicForSection,sectionForTopic} from '../lib/help-content.mjs';

test('all 9 navigation sections have usable Greek help',()=>{for(const id of ['overview','schedule','coverage','checks','lab','flow','release','backup','security']){assert.ok(HELP_TOPICS[id]?.title);assert.ok(HELP_TOPICS[id]?.detail.length>60);}});
test('every connection points to a documented section',()=>{for(const [id,topic] of Object.entries(HELP_TOPICS))for(const to of topic.connects)assert.ok(HELP_TOPICS[to],`${id} -> ${to}`);});
test('guided walkthrough sections are valid',()=>{for(const step of GUIDE_STEPS){assert.ok(HELP_TOPICS[step.topic]);assert.ok(HELP_TOPICS[topicForSection(step.section)]);}});
test('accent-insensitive Greek help lookup',()=>{assert.deepEqual(normalizeGreek('ΒΆΡΔΙΕΣ'),'βαρδιες');assert.ok(searchHelp('βάρδια').length>0);assert.ok(searchHelp('αναπαυση').some(([k])=>k==='rest'));});
test('search results are bounded by glossary and unknown query returns empty',()=>{assert.equal(searchHelp('').length,Object.keys(HELP_TOPICS).length);assert.equal(searchHelp('doesnotexist_xyz').length,0);});
test('tutorial navigation never escapes bounds',()=>{assert.equal(nextStep(0,-1),0);assert.equal(nextStep(GUIDE_STEPS.length-1,1),GUIDE_STEPS.length-1);assert.equal(nextStep(2,1),3);});
test('connection map starts at inputs and terminates at backup',()=>{assert.equal(CONNECTIONS[0].id,'schedule');assert.equal(CONNECTIONS.at(-1).id,'backup');assert.equal(new Set(CONNECTIONS.map(x=>x.id)).size,CONNECTIONS.length);});
test('privacy description does not claim published means public',()=>{assert.match(HELP_TOPICS.access.detail,/server/);assert.match(HELP_TOPICS.stage.detail,/χωριστ/);});
test('no personal data or hardcoded secrets in help topics',()=>{const s=JSON.stringify(HELP_TOPICS);assert.doesNotMatch(s,/-----BEGIN PRIVATE KEY-----|@europcargreece\.com|sk-proj-/);});

test('every glossary item resolves to a valid app section',()=>{for(const id of Object.keys(HELP_TOPICS))assert.ok(['overview','schedule','coverage','checks','lab','flow','release','backup','security'].includes(sectionForTopic(id)),id);});

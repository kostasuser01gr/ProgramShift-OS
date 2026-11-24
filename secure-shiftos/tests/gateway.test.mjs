import test from 'node:test';
import assert from 'node:assert/strict';
import {executeGateway,toolCatalog,GatewayError,TOOL_NAMES} from '../lib/gateway/core.mjs';
import {syntheticRoster} from '../lib/synthetic-fixture.mjs';
import {runCLI} from '../scripts/shiftos-cli.mjs';
import {mcpDispatch} from '../scripts/shiftos-mcp.mjs';
const month='2026-11',date='2026-11-01';
const roster=syntheticRoster(month);
const ctx={...roster,mode:'synthetic',role:'manager',status:'DRAFT',syntheticConfirmed:true,events:[{time:'09:00',text:'Δοκιμαστική αλλαγή'}]};
const exec=(tool,args,context=ctx)=>executeGateway(tool,{month,...args},context);

test('exact seven tools are read-only and have strict schema',()=>{assert.equal(toolCatalog().length,7);assert.equal(new Set(TOOL_NAMES).size,7);for(const t of toolCatalog()){assert.equal(t.readOnly,true);assert.equal(t.inputSchema.additionalProperties,false);}});
test('denies nonauthenticated user and synthetic mode without explicit consent',()=>{assert.throws(()=>exec('roster.read',{},{}),{code:'DENIED'});assert.throws(()=>exec('roster.read',{}, {...ctx,syntheticConfirmed:false}),{code:'DENIED'});assert.throws(()=>exec('roster.read',{}, {...ctx,role:'guest'}),{code:'DENIED'});});
test('rejects unknown tools and unknown extra input fields',()=>{assert.throws(()=>exec('what.ever',{}),{code:'UNKNOWN_TOOL'});assert.throws(()=>exec('roster.read',{admin:true}),{code:'UNKNOWN_FIELD'});});
test('month and date validation reject impossible date and wrong month',()=>{assert.throws(()=>executeGateway('roster.read',{month:'2026-13'},ctx),{code:'BAD_MONTH'});assert.throws(()=>exec('coverage.analyze',{date:'2026-11-31'}),{code:'BAD_DATE'});assert.throws(()=>exec('coverage.analyze',{date:'2026-12-01'}),{code:'BAD_DATE'});assert.throws(()=>executeGateway('roster.read',{month:'2026-10'},ctx),{code:'MONTH_MISMATCH'});});
test('read-only roster summary contains no employee names or internal IDs',()=>{const r=exec('roster.read',{});assert.equal(r.ok,true);assert.equal(r.mode,'SYNTHETIC_DEMO');assert.equal(r.data.employees,12);assert.equal(JSON.stringify(r).includes('Υποθετικός'),false);assert.equal(JSON.stringify(r).includes('DEMO-01'),false);});
test('coverage analyze all days and one day without identities',()=>{const a=exec('coverage.analyze',{});assert.equal(a.data.days.length,30);const b=exec('coverage.analyze',{date});assert.equal(b.data.days.length,1);assert.equal(b.data.days[0].date,date);assert.equal(JSON.stringify(b).includes('DEMO-'),false);});
test('simulation is deterministic and no mutations',()=>{const before=JSON.stringify(roster);const args={date,scenario:{pickups:25,returns:20,profile:'balanced'}};const a=exec('coverage.simulate',args);const b=exec('coverage.simulate',args);assert.deepEqual(a.data,b.data);assert.equal(JSON.stringify(roster),before);assert.equal(a.data.windows.length,3);});
test('simulation rejects non numeric scenario and unknown profile',()=>{assert.throws(()=>exec('coverage.simulate',{date,scenario:{pickups:'999'}}),{code:'BAD_SCENARIO'});assert.throws(()=>exec('coverage.simulate',{date,scenario:{profile:'madeup'}}),{code:'BAD_SCENARIO'});});
test('proposal does not mutate schedule and is blocked after publish',()=>{const before=JSON.stringify(roster);const p=exec('shift.propose',{date,employeeKey:'DEMO-01',code:'301'});assert.equal(p.data.proposed,true);assert.equal(p.data.persisted,false);assert.equal(JSON.stringify(roster),before);const block=exec('shift.propose',{date,employeeKey:'DEMO-01',code:'301'},{...ctx,status:'PUBLISHED'});assert.equal(block.data.proposed,false);});
test('proposal requires existing employee and valid code',()=>{assert.throws(()=>exec('shift.propose',{date,employeeKey:'UNLISTED',code:'203'}),{code:'NOT_FOUND'});assert.throws(()=>exec('shift.propose',{date,employeeKey:'DEMO-01',code:'XXX'}),{code:'BAD_CODE'});});
test('approval preview does not submit or persist and offers actionable items',()=>{const r=exec('approval.request',{});assert.equal(r.data.submitted,false);assert.ok(r.data.issues.length>0);});
test('manual demo results marked noncorporate, production returns unavailable',()=>{const demo=exec('manual.search',{query:'πρόγραμμα'});assert.equal(demo.data.approvedCorporate,false);assert.ok(demo.data.results.length>0);const prod=exec('manual.search',{query:'πρόγραμμα'},{...ctx,mode:'corporate'});assert.equal(prod.data.available,false);});
test('audit demo ephemeral and corporate unavailable, no PII in tests',()=>{const d=exec('audit.history',{});assert.equal(d.data.durable,false);assert.equal(d.data.events.length,1);assert.equal(exec('audit.history',{}, {...ctx,mode:'corporate'}).data.available,false);});
test('CLI refuses implicit production and unknown command',()=>{assert.throws(()=>runCLI(['list']),{code:'DEMO_REQUIRED'});assert.throws(()=>runCLI(['--demo','delete']),{code:'USAGE'});assert.equal(runCLI(['--demo','list']).tools.length,7);const a=runCLI(['--demo','call','roster.read',JSON.stringify({month})]);assert.equal(a.data.employees,12);});
test('MCP initialize/list/call and no unknown writes',()=>{const init=mcpDispatch({jsonrpc:'2.0',id:1,method:'initialize'});assert.ok(init.result.serverInfo.name.includes('synthetic'));const listed=mcpDispatch({jsonrpc:'2.0',id:2,method:'tools/list'});assert.equal(listed.result.tools.length,7);assert.equal(listed.result.tools[0].annotations.readOnlyHint,true);const call=mcpDispatch({jsonrpc:'2.0',id:3,method:'tools/call',params:{name:'roster.read',arguments:{month}}});assert.equal(call.result.isError,false);assert.equal(JSON.parse(call.result.content[0].text).data.employees,12);const bad=mcpDispatch({jsonrpc:'2.0',id:4,method:'tools/call',params:{name:'roster.delete',arguments:{month}}});assert.equal(bad.result.isError,true);});
test('MCP notification produces no response and unknown method is refused',()=>{assert.equal(mcpDispatch({jsonrpc:'2.0',method:'notifications/initialized'}),null);assert.equal(mcpDispatch({jsonrpc:'2.0',id:3,method:'DELETE'}).error.code,-32601);});

test('TUI menu exposes only defined tools and rejects invalid selection',async()=>{
 const {menuText,selectionToTool}=await import('../scripts/shiftos-tui.mjs');
 assert.equal(menuText().includes('OFFLINE DEMO'),true);
 assert.equal(selectionToTool('0'),null);
 assert.equal(selectionToTool('1'),'roster.read');
 assert.equal(selectionToTool('999'),undefined);
 assert.equal(selectionToTool('1;delete'),undefined);
});

import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
const probes=[['Node',process.execPath,['--version'],true],['npm',process.platform==='win32'?'npm.cmd':'npm',['--version'],true],['uv','uv',['--version'],false]];
const blender=process.env.BLENDER_PATH || (process.platform==='darwin' && existsSync('/Applications/Blender.app/Contents/MacOS/Blender')?'/Applications/Blender.app/Contents/MacOS/Blender':'blender');
probes.push(['Blender',blender,['--version'],false]);
for(const [label,command,args,required] of probes){const result=spawnSync(command,args,{encoding:'utf8',timeout:15000,shell:process.platform==='win32' && command.endsWith('.cmd')});console.log(`${label}: ${result.status===0?result.stdout.trim().split('\n')[0]:required?'MISSING (required to run the app)':'not found (optional, for authoring)'}`);if(required && result.status!==0)process.exitCode=1;}
if(Number(process.versions.node.split('.')[0])<22){console.error('Use Node.js 22 or 24.');process.exitCode=1;}
console.log('No software was installed and no Blender session was modified. MCP needs an additional live get_scene_info check in your agent.');

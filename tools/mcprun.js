// Run an MCP tool with args from a file, write the text output to a file.
// Usage: node mcprun.js <tool> <args.json> [outfile]
const fs = require('fs');
const { init, callTool } = require('./mcpcall.js');

(async () => {
  const tool = process.argv[2];
  const argsPath = process.argv[3];
  const out = process.argv[4] || 'C:/Users/vpedr/.claude/projects/C--Users-vpedr/tooling/_out.txt';
  const args = argsPath ? JSON.parse(fs.readFileSync(argsPath, 'utf8')) : {};
  await init();
  const r = await callTool(tool, args);
  const c = r.result?.content ?? [];
  let text = c.map(b => (b.type === 'text' ? b.text : JSON.stringify(b))).join('\n');
  if (!c.length) text = JSON.stringify(r, null, 1);
  fs.writeFileSync(out, text);
  console.log('wrote', out, 'bytes', text.length);
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });

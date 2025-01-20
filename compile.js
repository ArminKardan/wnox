const ts = require('typescript');
const fs = require('fs');

const input = fs.readFileSync('run.ts', 'utf8');
const result = ts.transpileModule(input, {
  compilerOptions: { module: ts.ModuleKind.CommonJS }
});

fs.writeFileSync('run.js', result.outputText);

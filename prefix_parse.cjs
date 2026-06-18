<<<<<<< HEAD
const ts = require('typescript'); const fs = require('fs'); const all = fs.readFileSync('src/app/App.tsx','utf8').split(/\r?\n/); for(const n of [980,940,900,860,820,780,740,700,660,620,580,540,500,460,420,380,340,300,260,220,180,140,100,60,20]){ const src = all.slice(0,n).join('\n'); const sf = ts.createSourceFile('prefix.tsx', src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX); console.log('n='+n,'errors='+sf.parseDiagnostics.length); }
=======
const ts = require('typescript'); const fs = require('fs'); const all = fs.readFileSync('src/app/App.tsx','utf8').split(/\r?\n/); for(const n of [980,940,900,860,820,780,740,700,660,620,580,540,500,460,420,380,340,300,260,220,180,140,100,60,20]){ const src = all.slice(0,n).join('\n'); const sf = ts.createSourceFile('prefix.tsx', src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX); console.log('n='+n,'errors='+sf.parseDiagnostics.length); }
>>>>>>> 84254e0 (Initial commit)

const fs = require('fs');
const ts = require('typescript');
const all = fs.readFileSync('src/app/App.tsx','utf8').split(/\r?\n/);
const snippet = all.slice(878,1037).join('\n');
const header = "type Page=string; type GalleryItem=any; const Search:any=undefined; const Grid3X3:any=undefined; const List:any=undefined; const Plus:any=undefined; const X:any=undefined; const Dropdown:any=undefined; const GALLERY_COLOR_SWATCHES:any=undefined; const GSection:any=undefined; const DottedDivider:any=undefined; const GalleryCard:any=undefined; const setFilterType:any=undefined; const setActiveColor:any=undefined; const setSortBy:any=undefined; const setSearch:any=undefined; const setViewMode:any=undefined; const onNavigate:any=undefined; const filtered:any=[]; const search=''; const viewMode='grid';";
const src = header + '\n' + snippet;
const sf = ts.createSourceFile('prefix.tsx', src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
console.log('errors', sf.parseDiagnostics.length);
for (const d of sf.parseDiagnostics) {
  const pos = sf.getLineAndCharacterOfPosition(d.start || 0);
  console.log((pos.line+1)+':'+(pos.character+1)+' - '+ts.flattenDiagnosticMessageText(d.messageText,'\n'));
}

import re
from pathlib import Path
p = Path("node_modules/asciify-engine/dist/index.js")
text = p.read_text(encoding="utf-8")
m = re.search(r"async function Rt\\(|function Rt\\(", text)
if not m:
    print("NOTFOUND")
    raise SystemExit(1)
start = m.start()
end = min(len(text), start + 16000)
print(text[start:end])

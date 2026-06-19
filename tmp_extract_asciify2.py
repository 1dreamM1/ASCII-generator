from pathlib import Path
import re

path = Path('node_modules/asciify-engine/dist/index.js')
text = path.read_text(encoding='utf-8', errors='ignore')
start = text.find('async function Rt')
if start == -1:
    raise SystemExit('not found')

# Find the opening brace of the function body after parameter list.
paren = 0
body_start = None
in_string = False
escape = False
quote = ''
for i, ch in enumerate(text[start:], start=start):
    if in_string:
        if escape:
            escape = False
        elif ch == '\\':
            escape = True
        elif ch == quote:
            in_string = False
        continue
    if ch in '"\'`':
        in_string = True
        quote = ch
        continue
    if ch == '(':
        paren += 1
    elif ch == ')':
        paren -= 1
        if paren == 0:
            # now find next '{' for function body
            for j in range(i+1, min(len(text), i+300)):
                if text[j] == '{':
                    body_start = j
                    break
            break

if body_start is None:
    raise SystemExit('could not find body start')

brace = 0
in_string = False
escape = False
quote = ''
end = None
for i, ch in enumerate(text[body_start:], start=body_start):
    if in_string:
        if escape:
            escape = False
        elif ch == '\\':
            escape = True
        elif ch == quote:
            in_string = False
        continue
    if ch in '"\'`':
        in_string = True
        quote = ch
        continue
    if ch == '{':
        brace += 1
    elif ch == '}':
        brace -= 1
        if brace == 0:
            end = i + 1
            break

if end is None:
    raise SystemExit('could not find function end')

func = text[start:end]
with open('tmp_asciify_function2.txt', 'w', encoding='utf-8') as f:
    f.write(func)
print('saved tmp_asciify_function2.txt length', len(func))

# print last return(s)
returns = [m for m in re.finditer(r'return[^;]*;', func)]
print('return count', len(returns))
for i, m in enumerate(returns[-10:], start=max(0, len(returns)-10)):
    s = max(0, m.start()-120)
    e = min(len(func), m.end()+120)
    print('--- RETURN', i, '---')
    print(func[s:e])

print('--- tail ---')
print(func[-800:])

from pathlib import Path
import re

path = Path('node_modules/asciify-engine/dist/index.js')
text = path.read_text(encoding='utf-8', errors='ignore')
start = text.find('async function Rt')
if start == -1:
    raise SystemExit('not found')

# bracket matching to extract function body
brace = 0
in_string = False
escape = False
quote = ''
end = None
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
print('function len', len(func))

# Print some useful slices around returns and stop function
pattern = re.compile(r'return[^;{]*;|return[^;{]*$')
returns = pattern.findall(func)
for i, r in enumerate(returns[:30]):
    print(f'RETURN[{i}]:', r.replace('\n',' '))
print('...')
print('last 1200 chars:')
print(func[-1200:])
with open('tmp_asciify_function.txt', 'w', encoding='utf-8') as f:
    f.write(func)
print('saved to tmp_asciify_function.txt')

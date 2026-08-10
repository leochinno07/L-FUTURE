from pathlib import Path
import re

def fix_file(path):
    text = path.read_text(encoding='utf-8')
    lines = text.splitlines()
    out = []
    fence = False
    for line in lines:
        stripped = line.rstrip('\n')
        if re.match(r'^(#{1,6})\s', stripped):
            if out and out[-1].strip() != '':
                out.append('')
            out.append(stripped)
            continue
        if stripped.startswith('```'):
            if out and out[-1].strip() != '':
                out.append('')
            out.append(stripped)
            fence = not fence
            continue
        if not fence and re.match(r'^\s*[-*+]\s+', stripped):
            if out and out[-1].strip() != '':
                out.append('')
            out.append(stripped)
            continue
        out.append(stripped)
    final = []
    for idx,l in enumerate(out):
        final.append(l)
        if l.startswith('```') and idx+1 < len(out) and out[idx+1].strip() != '':
            final.append('')
    fixed = '\n'.join(final).rstrip() + '\n'
    path.write_text(fixed, encoding='utf-8')

for path in Path('.').rglob('*.md'):
    fix_file(path)
    print('fixed', path)

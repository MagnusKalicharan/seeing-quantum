import json

with open('d:/qc/frontend/src/ChapterGrovers.jsx', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

replacements = {
    'â†“': '↓',
    'âˆš': '√',
    '|Ïˆ|Â²': '|ψ|²',
    '|râŸ©': '|r⟩',
    '|wâŸ©': '|w⟩',
    'â€”': '—',
    '|Ïˆâ‚ \u0081âŸ©': '|ψ₁⟩',
    '|Ïˆâ‚\u0081âŸ©': '|ψ₁⟩',
    'â‰ˆ': '≈',
    '|Ïˆâ‚‚âŸ©': '|ψ₂⟩',
    '|000âŸ©': '|000⟩',
    '|001âŸ©': '|001⟩',
    '|101âŸ©': '|101⟩',
    '|111âŸ©': '|111⟩',
    '1 / a8': '1 / √8',
    '1 / âˆš8': '1 / √8',
    '?': '↓',
    '?"': '—',
    '|I^,?Yc': '|ψ₁⟩',
    '|I^,,Yc': '|ψ₂⟩',
    '|I|A': '|ψ|²',
    '|wYc': '|w⟩',
    '|rYc': '|r⟩',
    '%^': '≈',
    '+"': '↓',
    '|000?': '|000⟩',
    '|001?': '|001⟩',
    '|101?': '|101⟩',
    '|111?': '|111⟩',
    '^s8': '√8',
    's,?': '⚠️',
    '|I^,?Yc': '|ψ₁⟩'
}

for bad, good in replacements.items():
    content = content.replace(bad, good)

# Also fix the weird a8 with regex
import re
content = re.sub(r'1 / [^<]*?8', '1 / √8', content)
content = re.sub(r'\|I\^[^<]*?Yc', '|ψ₁⟩', content)
content = re.sub(r'\|I\^[^<]*?Yc', '|ψ₂⟩', content)

with open('d:/qc/frontend/src/ChapterGrovers.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")

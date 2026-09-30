const fs = require('fs');
let content = fs.readFileSync('d:/qc/frontend/src/ChapterGrovers.jsx', 'utf8');

// Replace standard stuff
content = content.replace(/1 \/ [^<]*?8/g, '1 / √8');
content = content.replace(/\|s\ufffd/g, '|s⟩');
content = content.replace(/\|000\ufffd/g, '|000⟩');
content = content.replace(/\|001\ufffd/g, '|001⟩');
content = content.replace(/\|101\ufffd/g, '|101⟩');
content = content.replace(/\|111\ufffd/g, '|111⟩');

// specific ugly stuff
content = content.replace(/\|\ufffd\ufffd\ufffd \ufffd\ufffdx\ufffd/g, '|ψ₁⟩');
content = content.replace(/\|\ufffd\ufffd\ufffd  \ufffdx\ufffd/g, '|ψ₂⟩');
content = content.replace(/\ufffd0\ufffd/g, '≈');
content = content.replace(/\ufffd\?"/g, '—');
content = content.replace(/\ufffd\+"/g, '↓');

// Ensure the specific match in the screenshot is hit
content = content.replace(/1 \/ \ufffd\ufffda8/g, '1 / √8');
content = content.replace(/1 \/ a8/g, '1 / √8');
content = content.replace(/\(1 \/ [^\)]+\)/g, '(1 / √8)');

fs.writeFileSync('d:/qc/frontend/src/ChapterGrovers.jsx', content, 'utf8');
console.log('Fixed ChapterGrovers.jsx using regex context');

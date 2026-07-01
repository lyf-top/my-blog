const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'bangumi.json');
const raw = fs.readFileSync(filePath);

// Detect encoding
let text;
if (raw[0] === 0xff && raw[1] === 0xfe) {
  text = raw.toString('utf16le');
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
} else {
  text = raw.toString('utf8');
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
}

const data = JSON.parse(text);
console.log('Total items:', data.length);

// Find duplicate IDs and fix them
const seenIds = new Map();
let fixed = 0;

data.forEach((item, idx) => {
  if (seenIds.has(item.id)) {
    // Generate a unique ID based on title + category
    const rawId = `${item.title}#${item.category}#${idx}`;
    const newId = `local-${Buffer.from(rawId, 'utf8').toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}`;
    console.log(`  Fixing: [${item.category}] "${item.title}" - old ID: ${item.id} → new ID: ${newId}`);
    item.id = newId;
    fixed++;
  } else {
    seenIds.set(item.id, idx);
  }
});

console.log(`\nFixed ${fixed} duplicate IDs`);

// Write back as UTF-8
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Saved to', filePath);

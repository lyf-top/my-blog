const fs = require('fs');
const raw = fs.readFileSync('public/bangumi.json');
// Detect encoding: UTF-16 LE BOM = ff fe, UTF-16 BE BOM = fe ff
let text;
if (raw[0] === 0xff && raw[1] === 0xfe) {
  text = raw.toString('utf16le');
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
} else {
  text = raw.toString('utf8');
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
}
try {
  const data = JSON.parse(text);
  console.log('Total items:', data.length);
  
  const ids = {};
  data.forEach(i => { ids[i.id] = (ids[i.id] || 0) + 1; });
  const dups = Object.entries(ids).filter(([, c]) => c > 1);
  console.log('Duplicate IDs:', dups.length ? JSON.stringify(dups) : 'none');
  if (dups.length > 0) {
    const dupId = dups[0][0];
    const dupItems = data.filter(i => i.id === dupId);
    console.log('\nItems with dup ID', dupId, ':');
    dupItems.forEach((i, idx) => console.log(`  ${idx}: [${i.category}] ${i.title}`));
  }
  
  const cats = {};
  data.forEach(i => { cats[i.category] = (cats[i.category] || 0) + 1; });
  console.log('Categories:', JSON.stringify(cats));
  
  // Check for same title+category combos
  const titles = {};
  data.forEach(i => { 
    const k = i.title + '|' + i.category; 
    titles[k] = (titles[k] || 0) + 1; 
  });
  const dupTitles = Object.entries(titles).filter(([, c]) => c > 1);
  console.log('Duplicate title|cat:', dupTitles.length ? dupTitles.map(([k, c]) => k + ' x' + c).join(', ') : 'none');
} catch (e) {
  console.error('Parse error:', e.message);
  console.log('First 200 chars:', text.slice(0, 200));
}

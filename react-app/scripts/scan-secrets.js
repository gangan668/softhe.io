import fs from 'node:fs';
import path from 'node:path';

const roots = ['dist'];
const patterns = [/sb_secret_[A-Za-z0-9_-]{20,}/, /service_role[^\n]{0,40}eyJ[A-Za-z0-9_-]+/i, /sk_(?:live|test)_[A-Za-z0-9]{16,}/, /whsec_[A-Za-z0-9]{16,}/, /re_[A-Za-z0-9]{16,}/];
const files = [];
const walk = (root) => { if (!fs.existsSync(root)) return; for (const entry of fs.readdirSync(root,{withFileTypes:true})) { const file=path.join(root,entry.name); entry.isDirectory()?walk(file):files.push(file); } };
roots.forEach(walk);
const leaked = files.filter((file) => { const value=fs.readFileSync(file,'utf8'); return patterns.some((pattern)=>pattern.test(value)); });
if (leaked.length) throw new Error(`Potential secret material found in client output (${leaked.length} file(s))`);
console.log('Client output secret scan passed.');

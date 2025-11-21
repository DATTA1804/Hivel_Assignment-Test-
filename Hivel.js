

const fs = require('fs');

if (process.argv.length < 3) {
  console.error('Usage: node solve.js <input.json>');
  process.exit(1);
}

const filename = process.argv[2];
let raw;
try {
  raw = fs.readFileSync(filename, 'utf8');
} catch (e) {
  console.error('Cannot read file:', filename, e.message);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  console.error('Invalid JSON:', e.message);
  process.exit(1);
}

if (!data.keys || typeof data.keys.k === 'undefined') {
  console.error('JSON must contain keys.k');
  process.exit(1);
}

const k = Number(data.keys.k);


function parseBigIntBase(str, base) {
  base = Number(base);
  str = String(str).trim().toLowerCase();
  if (str.length === 0) return 0n;
  const digits = '0123456789abcdefghijklmnopqrstuvwxyz';
  let value = 0n;
  const bigBase = BigInt(base);
  for (let ch of str) {
    if (ch === '_') continue; 
    const d = digits.indexOf(ch);
    if (d < 0 || d >= base) {
      console.error(`Invalid digit "${ch}" for base ${base} in value "${str}"`);
      process.exit(1);
    }
    value = value * bigBase + BigInt(d);
  }
  return value;
}


function bgcd(a, b) {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b !== 0n) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a;
}


class Frac {
  constructor(num, den = 1n) {
    if (den === 0n) throw new Error('Denominator 0');
    if (den < 0n) {
      num = -num;
      den = -den;
    }
    const g = bgcd(num, den);
    this.n = num / g;
    this.d = den / g;
  }

  add(other) {
    const n = this.n * other.d + other.n * this.d;
    const d = this.d * other.d;
    return new Frac(n, d);
  }

  sub(other) {
    const n = this.n * other.d - other.n * this.d;
    const d = this.d * other.d;
    return new Frac(n, d);
  }

  mul(other) {
    return new Frac(this.n * other.n, this.d * other.d);
  }

  div(other) {
    if (other.n === 0n) throw new Error('Division by zero Frac');
    return new Frac(this.n * other.d, this.d * other.n);
  }

  toString() {
    if (this.d === 1n) return this.n.toString();
    return `${this.n.toString()}/${this.d.toString()}`;
  }

 
  toBigIntExact() {
    if (this.d !== 1n) throw new Error('Not an integer');
    return this.n;
  }
}


const entries = [];
for (const key of Object.keys(data)) {
  if (key === 'keys') continue;
  // expect keys like "1","2",...
  if (!/^\d+$/.test(key)) continue;
  const item = data[key];
  if (!item || typeof item.base === 'undefined' || typeof item.value === 'undefined') {
    console.error(`Entry ${key} missing base/value`);
    process.exit(1);
  }
  entries.push({ idx: Number(key), base: item.base, value: item.value });
}

entries.sort((a, b) => a.idx - b.idx);

if (entries.length < k) {
  console.error(`Not enough entries: have ${entries.length}, need k=${k}`);
  process.exit(1);
}


const chosen = entries.slice(0, k);


const xs = chosen.map(e => BigInt(e.idx));
const ys = chosen.map(e => parseBigIntBase(e.value, e.base));


let result = new Frac(0n, 1n);

for (let j = 0; j < k; ++j) {
  let numer = 1n;
  let denom = 1n;
  for (let i = 0; i < k; ++i) {
    if (i === j) continue;
    numer *= -xs[i];            
    denom *= (xs[j] - xs[i]);   
  }
  
  const term = new Frac(ys[j] * numer, denom);
  result = result.add(term);
}

if (result.d === 1n) {
  console.log(result.n.toString()); 
} else {
  console.log(result.toString());
}

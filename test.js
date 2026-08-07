const code = `
def loop():
    val = read_sensor('D17')
    if val > 30:
        write_pin('D2', 1)
    else:
        write_pin('D2', 0)
`;

let pinToValue = { 'd17': 40 }; // Temp > 30
let payload = { data: { temperature: 40 } };
let pinStates = {};
let controlledPins = new Set();
try {
  let currentCond = true;
  let inIfBlock = false;
  let vars = {};
  const lines = code.split('\n');
  for (let line of lines) {
    const trimmed = line.trim();
    let cvMatch = trimmed.match(/(?:const\s+)?int\s+([a-zA-Z0-9_]+)\s*=\s*(\d+)\s*;/);
    if (cvMatch) vars[cvMatch[1]] = parseInt(cvMatch[2]);

    let rsMatch = trimmed.match(/([a-zA-Z0-9_]+)\s*=\s*read_sensor\(['"](.*?)['"]\)/);
    if (rsMatch) {
      let varName = rsMatch[1];
      let pinName = rsMatch[2].toLowerCase();
      vars[varName] = pinToValue[pinName] !== undefined ? pinToValue[pinName] : 0;
    }

    if (trimmed.startsWith('if ') || trimmed.startsWith('if(')) {
      let expr = trimmed;
      if (expr.startsWith('if(')) expr = expr.substring(3);
      else if (expr.startsWith('if ')) expr = expr.substring(3);

      expr = expr.replace(/:$/, '').replace(/{$/, '').trim();
      if (expr.startsWith('(') && expr.endsWith(')')) expr = expr.substring(1, expr.length - 1);

      for (const [vName, vVal] of Object.entries(vars)) {
        const regex = new RegExp(`\\b${vName}\\b`, 'g');
        expr = expr.replace(regex, vVal);
      }

      try { currentCond = !!eval(expr); } catch (e) { currentCond = false; }
      inIfBlock = true;
    } else if (trimmed.startsWith('else:') || trimmed.startsWith('else {') || trimmed === '} else {') {
      currentCond = !currentCond;
    } else if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('//')) {
      continue;
    } else if (trimmed.startsWith('}')) {
      if (!trimmed.includes('else')) { currentCond = true; inIfBlock = false; }
    } else if (!line.startsWith(' ') && !line.startsWith('\t') && !trimmed.startsWith('}')) {
      if (!trimmed.startsWith('def ') && !trimmed.startsWith('void ')) {
        currentCond = true; inIfBlock = false;
      }
    }

    let wpMatch = trimmed.match(/write_pin\(['"](.*?)['"]\s*,\s*(\d+)\)/);
    let dwMatch = trimmed.match(/digitalWrite\((.*?)\s*,\s*(HIGH|LOW|1|0|true|false)\)/i);

    if (wpMatch || dwMatch) {
      let pinStr = wpMatch ? wpMatch[1] : dwMatch[1];
      let valStr = wpMatch ? wpMatch[2] : dwMatch[2];
      let resolvedPin = vars[pinStr] !== undefined ? vars[pinStr].toString() : pinStr;
      let pin = resolvedPin.toLowerCase();
      if (!pin.startsWith('d')) pin = `d${pin}`;
      controlledPins.add(pin);
      let val = false;
      if (valStr === '1' || valStr.toUpperCase() === 'HIGH' || valStr.toLowerCase() === 'true') val = true;
      if (!inIfBlock || currentCond) pinStates[pin] = val;
    }
  }
} catch(e) {}
console.log('Test 1 (val=40):', pinStates); // Expect { d2: true }

pinToValue = { 'd17': 20 }; // Temp < 30
payload = { data: { temperature: 20 } };
pinStates = {};
try {
  let currentCond = true;
  let inIfBlock = false;
  let vars = {};
  const lines = code.split('\n');
  for (let line of lines) {
    const trimmed = line.trim();
    let cvMatch = trimmed.match(/(?:const\s+)?int\s+([a-zA-Z0-9_]+)\s*=\s*(\d+)\s*;/);
    if (cvMatch) vars[cvMatch[1]] = parseInt(cvMatch[2]);

    let rsMatch = trimmed.match(/([a-zA-Z0-9_]+)\s*=\s*read_sensor\(['"](.*?)['"]\)/);
    if (rsMatch) {
      let varName = rsMatch[1];
      let pinName = rsMatch[2].toLowerCase();
      vars[varName] = pinToValue[pinName] !== undefined ? pinToValue[pinName] : 0;
    }

    if (trimmed.startsWith('if ') || trimmed.startsWith('if(')) {
      let expr = trimmed;
      if (expr.startsWith('if(')) expr = expr.substring(3);
      else if (expr.startsWith('if ')) expr = expr.substring(3);

      expr = expr.replace(/:$/, '').replace(/{$/, '').trim();
      if (expr.startsWith('(') && expr.endsWith(')')) expr = expr.substring(1, expr.length - 1);

      for (const [vName, vVal] of Object.entries(vars)) {
        const regex = new RegExp(`\\b${vName}\\b`, 'g');
        expr = expr.replace(regex, vVal);
      }

      try { currentCond = !!eval(expr); } catch (e) { currentCond = false; }
      inIfBlock = true;
    } else if (trimmed.startsWith('else:') || trimmed.startsWith('else {') || trimmed === '} else {') {
      currentCond = !currentCond;
    } else if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('//')) {
      continue;
    } else if (trimmed.startsWith('}')) {
      if (!trimmed.includes('else')) { currentCond = true; inIfBlock = false; }
    } else if (!line.startsWith(' ') && !line.startsWith('\t') && !trimmed.startsWith('}')) {
      if (!trimmed.startsWith('def ') && !trimmed.startsWith('void ')) {
        currentCond = true; inIfBlock = false;
      }
    }

    let wpMatch = trimmed.match(/write_pin\(['"](.*?)['"]\s*,\s*(\d+)\)/);
    let dwMatch = trimmed.match(/digitalWrite\((.*?)\s*,\s*(HIGH|LOW|1|0|true|false)\)/i);

    if (wpMatch || dwMatch) {
      let pinStr = wpMatch ? wpMatch[1] : dwMatch[1];
      let valStr = wpMatch ? wpMatch[2] : dwMatch[2];
      let resolvedPin = vars[pinStr] !== undefined ? vars[pinStr].toString() : pinStr;
      let pin = resolvedPin.toLowerCase();
      if (!pin.startsWith('d')) pin = `d${pin}`;
      let val = false;
      if (valStr === '1' || valStr.toUpperCase() === 'HIGH' || valStr.toLowerCase() === 'true') val = true;
      if (!inIfBlock || currentCond) pinStates[pin] = val;
    }
  }
} catch(e) {}
console.log('Test 2 (val=20):', pinStates); // Expect { d2: false }

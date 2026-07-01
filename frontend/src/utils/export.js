function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCircuitJSON(parts, wires, title = 'circuit') {
  const data = {
    version: '1.0',
    title,
    exportedAt: new Date().toISOString(),
    parts: parts.map(p => ({ id: p.id, type: p.type, x: p.x, y: p.y, state: p.state })),
    wires
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, title + '.json');
}

export function importCircuitJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try { resolve(JSON.parse(e.target.result)); }
      catch (err) { reject(err); }
    };
    reader.readAsText(file);
  });
}

export function exportIno(code, title = 'sketch') {
  const header = '/*\n * ' + title + '\n * Arduino Simulator Export\n * ' + new Date().toLocaleString('ru-RU') + '\n */\n\n';
  const blob = new Blob([header + code], { type: 'text/plain' });
  downloadBlob(blob, title + '.ino');
}

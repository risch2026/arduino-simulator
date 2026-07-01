export async function connectArduino() {
  if (!('serial' in navigator)) {
    throw new Error('WebSerial не поддерживается. Используйте Chrome.');
  }
  
  const port = await navigator.serial.requestPort();
  await port.open({ baudRate: 9600 });
  return port;
}

export async function sendToArduino(port, data) {
  const writer = port.writable.getWriter();
  const encoder = new TextEncoder();
  await writer.write(encoder.encode(data + '\n'));
  writer.releaseLock();
}

export async function readFromArduino(port, callback) {
  const reader = port.readable.getReader();
  const decoder = new TextDecoder();
  
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      callback(decoder.decode(value));
    }
  } finally {
    reader.releaseLock();
  }
}
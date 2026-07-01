import { ArduinoEngine } from './engine';

export async function runTests(code, circuit, tests, onLog) {
  const results = [];

  for (const test of tests) {
    onLog(`🔍 Тест: ${test.name}`);
    const spec = JSON.parse(test.spec_json);
    const engine = new ArduinoEngine(circuit || spec.circuit);
    const log = [];

    // Перехватываем состояния пинов по времени
    const history = [];
    const startTime = Date.now();
    engine.onUpdate = (pins) => {
      history.push({ t: Date.now() - startTime, pins: { ...pins } });
    };

    try {
      // Проверка запрещённых конструкций
      if (spec.forbidden) {
        for (const f of spec.forbidden) {
          if (code.includes(f)) {
            throw new Error(`Запрещено использовать: ${f}`);
          }
        }
      }

      // Запускаем с таймаутом
      const runPromise = engine.run(code);
      const timeoutPromise = new Promise((_, rej) =>
        setTimeout(() => { engine.stop(); rej(new Error('Таймаут')); }, spec.timeout_ms || 5000));

      await Promise.race([runPromise, timeoutPromise]);

      // Проверяем шаги
      let allPassed = true;
      for (const step of spec.steps || []) {
        const snapshot = history.find(h => h.t >= step.at_ms) || history[history.length - 1];
        if (!snapshot) {
          log.push(`  ❌ Нет данных на t=${step.at_ms}мс`);
          allPassed = false;
          continue;
        }
        for (const [pin, expected] of Object.entries(step.check)) {
          const actual = snapshot.pins[pin];
          if (actual !== expected) {
            log.push(`  ❌ t=${step.at_ms}мс: ${pin} ожидалось ${expected}, получено ${actual}`);
            allPassed = false;
          } else {
            log.push(`  ✅ t=${step.at_ms}мс: ${pin}=${expected}`);
          }
        }
      }

      results.push({ name: test.name, passed: allPassed, log });
      onLog(allPassed ? '✅ ТЕСТ ПРОЙДЕН' : '❌ ТЕСТ ПРОВАЛЕН');
    } catch (e) {
      results.push({ name: test.name, passed: false, log: [`Ошибка: ${e.message}`] });
      onLog(`❌ Ошибка: ${e.message}`);
    }
    log.forEach(l => onLog(l));
  }

  return results;
}
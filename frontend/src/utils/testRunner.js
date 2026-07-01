export class TestRunner {
  constructor(engine) {
    this.engine = engine;
    this.cancelled = false;
    this.onProgress = null;
  }

  // Метод отмены
  cancel() {
    this.cancelled = true;
  }

  // Установка колбэка прогресса
  setProgressCallback(callback) {
    this.onProgress = callback;
  }

  async run(test, studentCode) {
    this.cancelled = false;
    const results = [];
    
    const total = test.tests.length;
    
    for (let i = 0; i < total; i++) {
      // Проверяем отмену
      if (this.cancelled) {
        results.push({
          name: 'Остановлено пользователем',
          passed: false,
          message: 'Тестирование прервано',
          skipped: true
        });
        break;
      }

      const t = test.tests[i];
      
      // Уведомляем о прогрессе
      if (this.onProgress) {
        this.onProgress({
          current: i + 1,
          total: total,
          testName: t.name,
          status: 'running'
        });
      }

      try {
        let passed = false;
        let message = '';
        
        if (t.type === 'code-check') {
          const regex = new RegExp(t.pattern);
          passed = regex.test(studentCode);
          message = passed 
            ? '✅ Найдено' 
            : '❌ Не найдено: ' + t.pattern;
        }
        
        else if (t.type === 'simulation') {
          this.engine.setCircuit([], []);
          const states = [];
          this.engine.onUpdate = (s) => states.push({ ...s });
          
          // Запускаем с таймаутом
          const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Таймаут симуляции')), 5000)
          );
          
          const runPromise = this.engine.run(studentCode);
          await Promise.race([runPromise, timeout]);
          
          passed = t.expected.every(exp => {
            return states.some(s => 
              s[exp.pin] !== undefined && 
              s[exp.pin] === exp.value
            );
          });
          message = passed 
            ? '✅ Пройдено ' + t.steps + ' шагов' 
            : '❌ Симуляция не совпадает';
        }
        
        results.push({ name: t.name, passed, message });
      } catch (e) {
        results.push({ 
          name: t.name, 
          passed: false, 
          message: 'Ошибка: ' + e.message 
        });
      }

      // Небольшая задержка для обновления UI
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Финальный прогресс
    if (this.onProgress) {
      this.onProgress({
        current: results.length,
        total: total,
        status: 'completed'
      });
    }
    
    return {
      testId: test.id,
      title: test.title,
      total: total,
      passed: results.filter(r => r.passed).length,
      cancelled: this.cancelled,
      results
    };
  }
}

import { useState } from 'react';
import { TestRunner } from '../../utils/testRunner';

export default function TestPanel({ code, engine }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const test = await import('../../tests/blink.json');
    const runner = new TestRunner(engine);
    const result = await runner.run(test, code);
    setResults(result);
    setLoading(false);
  };

  return (
    <div className="p-4 bg-slate-800 border-t border-slate-700">
      <button
        onClick={runTests}
        disabled={loading}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded disabled:opacity-50"
      >
        {loading ? ' Проверка...' : '✅ Проверить задачу'}
      </button>

      {results && (
        <div className="mt-4">
          <h3 className="font-bold mb-2">
            {results.title}: {results.passed}/{results.total}
          </h3>
          {results.results.map((r, i) => (
            <div key={i} className={`p-2 mb-1 rounded ${r.passed ? 'bg-green-900' : 'bg-red-900'}`}>
              {r.passed ? '✅' : '❌'} {r.name}: {r.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
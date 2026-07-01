import { useEffect } from 'react';

export default function EnvChecker() {
  useEffect(() => {
    console.log('🔍 Проверка переменных окружения:');
    console.log('  VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('  VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'заполнен (' + import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20) + '...)' : 'НЕ ЗАПОЛНЕН');
    console.log('  VITE_API_URL:', import.meta.env.VITE_API_URL);
  }, []);

  return null;
}

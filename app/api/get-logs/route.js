import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(request) {
  try {
    // Получаем пароль из query параметров
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    // Проверяем пароль
    if (password !== 'admin777') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Получаем логи из Vercel KV
    const logs = await kv.get('site_logs') || [];
    
    // Возвращаем последние 50 записей
    const recentLogs = logs.slice(0, 50);

    return NextResponse.json(
      { logs: recentLogs },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}

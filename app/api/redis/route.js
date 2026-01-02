import { createClient } from 'redis';
import { NextResponse } from 'next/server';

// Инициализация Redis клиента (подключение при первом запросе)
let redisClient = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    redisClient.on('error', (err) => {
      console.error('Redis Client Error', err);
    });
    
    await redisClient.connect();
  }
  return redisClient;
}

export async function POST() {
  try {
    const client = await getRedisClient();
    
    // Fetch data from Redis
    const result = await client.get("item");
    
    // Return the result in the response
    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.error('Redis error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from Redis' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const client = await getRedisClient();
    
    // Fetch data from Redis
    const result = await client.get("item");
    
    // Return the result in the response
    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.error('Redis error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from Redis' },
      { status: 500 }
    );
  }
}

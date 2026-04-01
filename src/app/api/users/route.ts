import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@server/storage';
import { api } from '@shared/routes';
import { ZodError } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = api.users.createOrUpdate.input.parse(body);
    const user = await storage.createOrUpdateUser(parsed);
    return NextResponse.json(user);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ message: err.errors[0]?.message || 'Validation error', field: err.errors[0]?.path?.join('.') }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

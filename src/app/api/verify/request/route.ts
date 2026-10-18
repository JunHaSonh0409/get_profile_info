import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const OCTOMO_RECEIVING_NUMBER = '1666-3538';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  ''
).trim();

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();
    const cleanPhone = String(phone || '').replace(/[^0-9]/g, '');

    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      return NextResponse.json(
        { success: false, error: "전화번호는 '-' 없이 10~11자리 숫자로 입력해주세요." },
        { status: 400 }
      );
    }

    // Check if phone number is already registered in Supabase
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false },
        });

        const { data: existingRows, error: searchError } = await supabase
          .from('profiles')
          .select('id, phone');

        if (!searchError && existingRows) {
          const isDuplicate = existingRows.some(
            (row) => String(row.phone || '').replace(/[^0-9]/g, '') === cleanPhone
          );
          if (isDuplicate) {
            return NextResponse.json(
              {
                success: false,
                error: '이미 등록된 전화번호입니다. 1인당 1개의 프로필만 등록할 수 있습니다.',
              },
              { status: 409 }
            );
          }
        }
      } catch (checkErr) {
        console.warn('Phone uniqueness pre-check warning:', checkErr);
      }
    }

    // Generate random 4-digit code (e.g., 4920)
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const verificationText = `OCTOMO 인증 ${randomCode}`;

    return NextResponse.json({
      success: true,
      targetNumber: OCTOMO_RECEIVING_NUMBER,
      text: verificationText,
      code: String(randomCode),
      expiresInSeconds: 300,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}


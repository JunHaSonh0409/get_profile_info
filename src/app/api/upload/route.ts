import { NextResponse } from 'next/server';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { success: false, error: 'Supabase 연결 정보가 설정되지 않았습니다.' },
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createServerSupabaseClient();

    const contentType = request.headers.get('content-type') || '';
    let imagesToUpload: string[] = [];
    let phone = 'guest';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      imagesToUpload = Array.isArray(body.images) ? body.images : body.image ? [body.image] : [];
      if (body.phone) {
        phone = String(body.phone).replace(/[^0-9]/g, '') || 'guest';
      }
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const files = formData.getAll('files') as File[];
      phone = String(formData.get('phone') || '').replace(/[^0-9]/g, '') || 'guest';
      
      for (const file of files) {
        if (file && typeof file.arrayBuffer === 'function') {
          const buffer = Buffer.from(await file.arrayBuffer());
          const ext = file.type.split('/')[1] || 'jpg';
          const filename = `${phone}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
          
          const { error: uploadError } = await supabase.storage
            .from('profile-photos')
            .upload(filename, buffer, {
              contentType: file.type || 'image/jpeg',
              upsert: true,
            });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('profile-photos')
              .getPublicUrl(filename);
            imagesToUpload.push(urlData.publicUrl);
          }
        }
      }
      return NextResponse.json(
        { success: true, urls: imagesToUpload },
        { headers: corsHeaders }
      );
    }

    if (imagesToUpload.length === 0) {
      return NextResponse.json(
        { success: false, error: '업로드할 이미지가 없습니다.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Limit to max 3 images
    const limitedImages = imagesToUpload.slice(0, 3);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < limitedImages.length; i++) {
      const item = limitedImages[i];

      // If it's already an HTTP URL, keep it
      if (item.startsWith('http://') || item.startsWith('https://')) {
        uploadedUrls.push(item);
        continue;
      }

      // If it's a data URL, upload to Supabase Storage
      const match = item.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mime = match[1];
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const ext = mime.includes('png')
          ? 'png'
          : mime.includes('webp')
          ? 'webp'
          : 'jpg';
        const filename = `${phone}/${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(filename, buffer, {
            contentType: mime,
            upsert: true,
          });

        if (uploadError) {
          console.error('Storage upload error for image', i, uploadError);
          // If storage upload fails for this item, omit or keep original
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(filename);

        uploadedUrls.push(urlData.publicUrl);
      }
    }

    return NextResponse.json(
      {
        success: true,
        urls: uploadedUrls,
      },
      { headers: corsHeaders }
    );
  } catch (err: unknown) {
    console.error('Upload API handler error:', err);
    const msg = err instanceof Error ? err.message : '이미지 업로드 중 오류가 발생했습니다.';
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500, headers: corsHeaders }
    );
  }
}

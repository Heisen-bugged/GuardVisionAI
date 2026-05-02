import { NextRequest, NextResponse } from 'next/server';
import { verifyWatermark } from '@/lib/processing';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const url = formData.get('url') as string;

    let buffer: Buffer;
    let type: 'image' | 'video' = 'image';

    if (file) {
      buffer = Buffer.from(await file.arrayBuffer());
      type = file.type.startsWith('video') ? 'video' : 'image';
    } else if (url) {
      const res = await fetch(url);
      buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get('content-type');
      type = contentType?.startsWith('video') ? 'video' : 'image';
    } else {
      return NextResponse.json({ error: 'File or URL is required' }, { status: 400 });
    }

    const result = await verifyWatermark(buffer, type);
    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
  }
}

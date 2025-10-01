import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    console.log('Upload request received');
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    console.log('Files received:', files.length, files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    if (!files || files.length === 0) {
      console.log('No files found in request');
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const uploadedUrls: string[] = [];
    const bucketName = 'product-images';

    for (const file of files) {
      try {
        console.log('Processing file:', file.name);
        
        // Generate unique filename with year/month structure
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const ext = path.extname(file.name);
        const filename = `${year}/${month}/${timestamp}-${randomStr}${ext}`;

        console.log('Uploading to Supabase:', filename);
        
        // Convert File to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filename, buffer, {
            contentType: file.type,
            upsert: false
          });

        if (error) {
          console.error('Supabase upload error:', error);
          throw new Error(`Supabase upload failed: ${error.message}`);
        }

        console.log('File uploaded successfully:', data.path);
        
        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(data.path);

        uploadedUrls.push(publicUrlData.publicUrl);
        console.log('Public URL:', publicUrlData.publicUrl);
        
      } catch (fileError) {
        console.error('Error processing file:', file.name, fileError);
        return NextResponse.json({ 
          error: 'Failed to process file', 
          details: fileError instanceof Error ? fileError.message : 'Unknown error',
          fileName: file.name
        }, { status: 500 });
      }
    }

    return NextResponse.json({ urls: uploadedUrls }, { status: 200 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload files', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

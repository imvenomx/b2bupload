import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { createClient } from '@supabase/supabase-js';

// Check if Supabase is configured
let supabase: ReturnType<typeof createClient> | null = null;
try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured');
  }
  
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (error) {
  console.error('Supabase initialization error:', error);
  // Continue without Supabase, will fall back to local storage
}

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
    const useSupabase = !!supabase;
    console.log('Using Supabase:', useSupabase);

    for (const file of files) {
      try {
        console.log('Processing file:', file.name);
        
        // Generate unique filename
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const ext = path.extname(file.name);
        
        let fileUrl: string;
        
        if (useSupabase) {
          // Use Supabase storage
          const bucketName = 'product-images';
          const filename = `${year}/${month}/${timestamp}-${randomStr}${ext}`;
          
          
          // Convert File to ArrayBuffer
          const arrayBuffer = await file.arrayBuffer();
          const buffer = new Uint8Array(arrayBuffer);

          // Upload to Supabase Storage
          const { data, error } = await supabase!.storage
            .from(bucketName)
            .upload(filename, buffer, {
              contentType: file.type,
              upsert: false
            });

          if (error) {
            console.error('Supabase upload error:', error);
            
            // Check if it's an RLS policy error
            if (error.message.includes('policy') || error.message.includes('permission')) {
              throw new Error('RLS policy violation. Please make the bucket public or configure proper policies. See SUPABASE_SETUP.md for instructions.');
            }
            
            throw new Error(`Supabase upload failed: ${error.message}`);
          }

          if (!data) {
            throw new Error('Supabase upload failed: No data returned');
          }

          console.log('File uploaded successfully:', data.path);
          
          // Get public URL
          const { data: publicUrlData } = supabase!.storage
            .from(bucketName)
            .getPublicUrl(data.path);

          if (!publicUrlData) {
            throw new Error('Failed to get public URL');
          }

          fileUrl = publicUrlData.publicUrl;
          console.log('Public URL:', fileUrl);
        } else {
          // Fallback to local storage
          
          const filename = `${timestamp}-${randomStr}${ext}`;
          const uploadDir = path.join(process.cwd(), 'public', 'uploads', String(year), month);
          
          // Create uploads directory if it doesn't exist
          await mkdir(uploadDir, { recursive: true });
          
          const filepath = path.join(uploadDir, filename);
          
          // Convert File to Buffer
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          await writeFile(filepath, buffer);
          
          fileUrl = `/uploads/${year}/${month}/${filename}`;
          console.log('File saved locally:', fileUrl);
        }
        
        uploadedUrls.push(fileUrl);
        
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

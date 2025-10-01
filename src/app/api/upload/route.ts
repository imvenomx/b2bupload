import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
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

    // Get current year and month
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed

    // Create directory structure: /uploads/YYYY/MM/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', String(year), month);
    
    // Create uploads directory if it doesn't exist
    try {
      console.log('Attempting to create directory:', uploadDir);
      await mkdir(uploadDir, { recursive: true });
      console.log('Directory created successfully:', uploadDir);
    } catch (error) {
      console.error('Error creating directory:', uploadDir, error);
      return NextResponse.json({ 
        error: 'Failed to create upload directory', 
        details: error instanceof Error ? error.message : 'Unknown error',
        path: uploadDir
      }, { status: 500 });
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      try {
        console.log('Processing file:', file.name);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const ext = path.extname(file.name);
        const filename = `${timestamp}-${randomStr}${ext}`;

        const filepath = path.join(uploadDir, filename);
        console.log('Writing file to:', filepath);
        
        await writeFile(filepath, buffer);
        console.log('File written successfully:', filename);

        // Return URL path with year/month structure
        uploadedUrls.push(`/uploads/${year}/${month}/${filename}`);
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

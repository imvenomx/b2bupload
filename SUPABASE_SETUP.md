# Supabase Setup Guide

## Quick Fix for RLS Policy Violation

If you're getting "RLS policy violation" errors, even with the bucket set to public, you need to create proper policies:

### Method 1: Disable RLS Completely (Easiest)

1. Go to your [Supabase dashboard](https://supabase.com)
2. Navigate to **Storage** → **product-images** bucket
3. Click **Configuration**
4. Toggle **Enable RLS** to OFF
5. Try uploading again

### Method 2: Create Proper Policies (More Secure)

If you want to keep RLS enabled:

1. Go to **Authentication** → **Policies** in your Supabase dashboard
2. Click **Create a new policy** on the `storage.objects` table
3. Create a policy for **SELECT** (read access):
   ```sql
   CREATE POLICY "Public read access" ON storage.objects
   FOR SELECT USING (bucket_id = 'product-images');
   ```
4. Create another policy for **INSERT** (upload access):
   ```sql
   CREATE POLICY "Public upload access" ON storage.objects
   FOR INSERT WITH CHECK (bucket_id = 'product-images');
   ```
5. Try uploading again

### Method 3: Use Supabase SQL Editor

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New query**
3. Run this SQL:
   ```sql
   -- Drop existing policies if any
   DROP POLICY IF EXISTS "Public read access" ON storage.objects;
   DROP POLICY IF EXISTS "Public upload access" ON storage.objects;
   
   -- Create new policies
   CREATE POLICY "Public read access" ON storage.objects
   FOR SELECT USING (bucket_id = 'product-images');
   
   CREATE POLICY "Public upload access" ON storage.objects
   FOR INSERT WITH CHECK (bucket_id = 'product-images');
   ```

**Note**: Method 1 (disabling RLS) is the quickest solution for development. Method 2 or 3 are better for production.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Wait for the project to be created (this may take a few minutes)

## 2. Create Storage Bucket

1. Go to **Storage** in the left sidebar
2. Click **Create a new bucket**
3. Set bucket name to: `product-images`
4. Set bucket to **Public** (this allows images to be accessed without authentication)
5. Click **Create bucket**

## 3. Configure Bucket Policies (Optional but Recommended)

If you want more control over access, you can create policies instead of making the bucket public:

### Enable RLS (Row Level Security)
1. Go to **Storage** → **product-images** bucket
2. Click **Configuration**
3. Toggle **Enable RLS** to ON

### Create Policies
1. Go to **Authentication** → **Policies**
2. Create a new policy for the `product-images` bucket:

#### Policy for Public Read Access
```sql
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');
```

#### Policy for Authenticated Upload Access
```sql
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);
```

## 4. Get Environment Variables

1. Go to **Project Settings** → **API**
2. Copy the **Project URL** and **anon public** key
3. Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 5. Test the Setup

1. Run your development server:
```bash
npm run dev
```

2. Try uploading an image in the app
3. Check the Supabase dashboard → Storage → product-images to see the uploaded files

## Troubleshooting

### Common Issues

**Error: "Missing Supabase environment variables"**
- Make sure you have created `.env.local` file
- Check that both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Restart your development server after adding environment variables

**Error: "Bucket not found"**
- Make sure you created a bucket named exactly `product-images`
- Check that the bucket name in your code matches the bucket name in Supabase

**Error: "Permission denied"**
- Make sure your bucket is set to public OR you have proper policies set up
- Check your RLS policies if enabled

**Images not displaying**
- Check that the bucket is public or you have proper read policies
- Verify the image URLs in your browser's network tab
- Check the Supabase dashboard to see if files were uploaded successfully

### Testing Upload Manually

You can test the upload endpoint directly:

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "files=@test-image.jpg" \
  -H "Authorization: Bearer your_token_if_needed"
```

## Security Notes

- The `anon` key is safe to use in client-side code as it has limited permissions
- For production, consider using service role keys for server-side operations
- Always enable RLS in production for better security
- Consider implementing user authentication if you want to restrict uploads

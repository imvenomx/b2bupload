# Solution: File Upload & Server Storage for WooCommerce CSV Export

## Problem
WooCommerce cannot import base64-encoded images. The error "Impossible d'utiliser l'image « dataimagewebpbase64 »" appears when trying to import products with base64 image data.

## Solution Implemented
The application now **uploads images to the server** and stores file paths that can be used in CSV export.

### How It Works

#### 1. File Upload API
- Created `/api/upload` route that handles image uploads
- Images are saved to `/public/uploads/` directory
- Returns file paths like `/uploads/image-123.jpg`

#### 2. Product Data Structure
```typescript
export interface Product {
  mainImage?: string;        // File path (e.g., /uploads/image.jpg)
  galleryImages: string[];   // Array of file paths
}
```

#### 3. CSV Export Logic
- Image file paths are included in the CSV
- No base64 data is exported
- WooCommerce can use these paths (after deploying images to server)

#### 4. User Interface
- Simple file upload inputs (no URL fields)
- Click to upload main image
- Click to add gallery images
- Images are automatically uploaded and saved

### Workflow

1. **User uploads images** → Images saved to `/public/uploads/`
2. **File paths stored** → Product data contains `/uploads/image.jpg`
3. **Export CSV** → CSV contains file paths
4. **Deploy images** → Upload `/public/uploads/` folder to WooCommerce server
5. **Update CSV** (if needed) → Change paths to full URLs
6. **Import to WooCommerce** → Success! ✅

## Files Created/Modified

1. **src/app/api/upload/route.ts** - NEW: API route for file uploads
2. **public/uploads/.gitkeep** - NEW: Uploads directory
3. **src/types/product.ts** - Simplified to use single fields for file paths
4. **src/utils/csvExport.ts** - Uses file paths in CSV
5. **src/app/add-product/page.tsx** - Async upload handling, removed URL inputs
6. **README.md** - Updated documentation

## Benefits

✅ **Simple UX** - Just upload files, no URL input needed  
✅ **WooCommerce Compatible** - CSV contains proper file paths  
✅ **Server Storage** - Images saved as actual files  
✅ **Preview & Export** - Same files used for both  
✅ **Production Ready** - Can deploy with images to same server as WooCommerce  

## Important Notes

- Images are saved in `/public/uploads/` directory
- CSV contains relative paths (e.g., `/uploads/image.jpg`)
- Before WooCommerce import, upload the `/public/uploads/` folder to your web server
- If using different domains, update CSV paths to full URLs (e.g., `https://yoursite.com/uploads/image.jpg`)
- For same-domain deployment, paths work directly

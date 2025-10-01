# WooCommerce Product Manager

A modern Next.js application for managing WooCommerce products with CSV export functionality.

## Features

- ✨ **Product Management**: Add, view, and manage products with a clean interface
- 📦 **Product Types**: Support for both Simple and Variable products
- 🔄 **Variant Management**: Dynamic variant repeater for variable products
- 🖼️ **Image Upload**: Support for main product images and gallery images
- 📊 **Product Table**: Beautiful table view with product details
- 📤 **CSV Export**: Export products following WooCommerce CSV schema
- 💾 **Local Storage**: Persistent data storage using browser localStorage
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS and Lucide icons
- 🌙 **Dark Mode**: Full dark mode support

## Product Fields

- **Product Name** (required)
- **Product Short Description**
- **Product Long Description**
- **Product Type**: Simple or Variable (required)
- **Product SKU** (required)
- **Product Price** (required for simple products)
- **Product Main Image**
- **Product Gallery Images**
- **Variants** (for variable products):
  - Attributes
  - SKU
  - Price
  - Stock (optional)

## Getting Started

### Installation

1. Navigate to the project directory:
```bash
cd woocommerce-manager
```
2. Install dependencies:
```bash
npm install
```

3. **Configure Supabase**:

   a. Create a Supabase account at [supabase.com](https://supabase.com)

   b. Create a new project

   c. Go to Storage → Create a new bucket named `product-images`

   d. Set the bucket to public (or configure appropriate policies)
   
   e. Copy your Project URL and Anon Key from Project Settings → API
   
   f. Create a `.env.local` file in the root directory:
   ```bash
   cp env.example .env.local
   ```
   
   g. Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- **Next.js 15.5.4** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Lucide React** - Icons
- **PapaParse** - CSV generation
- **Supabase** - Cloud storage for product images

## Project Structure

```
src/
├── app/
│   ├── add-product/
│   │   └── page.tsx          # Add product page
│   ├── api/
│   │   └── upload/
│   │       └── route.ts      # Image upload API route
│   ├── edit-product/
│   │   └── [id]/
│   │       └── page.tsx      # Edit product page
│   ├── layout.tsx             # Root layout with providers
│   ├── page.tsx               # Main page with product table
│   └── globals.css            # Global styles
├── contexts/
│   └── ProductContext.tsx     # Product state management
├── lib/
│   └── supabase.ts           # Supabase client configuration
├── types/
│   └── product.ts             # TypeScript interfaces
└── utils/
    └── csvExport.ts           # CSV export utilities
```

## Usage

### Adding a Product

1. Click the "Add Product" button on the home page
2. Fill in the product details
3. Choose product type (Simple or Variable)
4. For variable products, add variants using the repeater
5. **Upload images**:
   - Click to upload main product image
   - Add multiple gallery images
   - Images are automatically uploaded to your Supabase storage bucket
   - Public URLs are stored and used in CSV export
6. Click "Save Product"

### Exporting to CSV

1. Click the "Export CSV" button on the home page
2. The CSV file will be downloaded with WooCommerce-compatible format
3. Image URLs (full Supabase URLs) are included in the CSV
4. The URLs are ready to use directly in WooCommerce - no additional image upload required
6. Import the CSV into your WooCommerce store

### Important Notes

- **Image Storage**: Uploaded images are stored in your Supabase bucket (`product-images`)
- **Image URLs**: The CSV contains full Supabase URLs that are ready to use
- **No Additional Upload**: Images are already hosted and accessible via public URLs
- **Direct Import**: CSV can be imported directly into WooCommerce without manual image handling

## WooCommerce CSV Format

The exported CSV follows the WooCommerce product import schema, including:
- Product ID, Type, SKU, Name
- Descriptions (short and long)
- Pricing and stock information
- Images (main and gallery)
- Variants with attributes
- And more WooCommerce-specific fields

## License

MIT

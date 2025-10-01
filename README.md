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

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Tech Stack

- **Next.js 15.5.4** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Lucide React** - Icons
- **PapaParse** - CSV generation

## Project Structure

```
src/
├── app/
│   ├── add-product/
│   │   └── page.tsx          # Add product page
│   ├── layout.tsx             # Root layout with providers
│   ├── page.tsx               # Main page with product table
│   └── globals.css            # Global styles
├── contexts/
│   └── ProductContext.tsx     # Product state management
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
   - Images are automatically saved to `/public/uploads/` folder
   - File paths are stored and used in CSV export
6. Click "Save Product"

### Exporting to CSV

1. Click the "Export CSV" button on the home page
2. The CSV file will be downloaded with WooCommerce-compatible format
3. Image file paths (e.g., `/uploads/image123.jpg`) are included in the CSV
4. Before importing to WooCommerce, upload images from `/public/uploads/` to your server
5. Update the CSV with your server's full image URLs
6. Import the CSV into your WooCommerce store

### Important Notes

- **Image Storage**: Uploaded images are saved in the `/public/uploads/` directory
- **Image URLs**: The CSV contains relative paths (e.g., `/uploads/image.jpg`)
- **Before Import**: Upload images from `public/uploads/` to your WooCommerce server and update the CSV URLs to full paths
- **Alternative**: Set up your Next.js app on the same domain as WooCommerce to use relative paths directly

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

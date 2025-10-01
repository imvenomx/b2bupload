import Papa from 'papaparse';
import { Product } from '@/types/product';

export interface WooCommerceCSVRow {
  ID: string;
  Type: string;
  SKU: string;
  Name: string;
  Published: number;
  'Is featured?': number;
  'Visibility in catalog': string;
  'Short description': string;
  Description: string;
  'Date sale price starts': string;
  'Date sale price ends': string;
  'Tax status': string;
  'Tax class': string;
  'In stock?': number;
  Stock: string;
  'Low stock amount': string;
  'Backorders allowed?': number;
  'Sold individually?': number;
  'Weight (kg)': string;
  'Length (cm)': string;
  'Width (cm)': string;
  'Height (cm)': string;
  'Allow customer reviews?': number;
  'Purchase note': string;
  'Sale price': string;
  'Regular price': string;
  'Categories': string;
  'Tags': string;
  'Shipping class': string;
  'Images': string;
  'Download limit': string;
  'Download expiry days': string;
  'Parent': string;
  'Grouped products': string;
  'Upsells': string;
  'Cross-sells': string;
  'External URL': string;
  'Button text': string;
  'Position': number;
  'Attribute 1 name': string;
  'Attribute 1 value(s)': string;
  'Attribute 1 visible': number;
  'Attribute 1 global': number;
}

export function convertProductsToWooCommerceCSV(products: Product[]): string {
  const csvData: Partial<WooCommerceCSVRow>[] = [];

  products.forEach((product) => {
    // For variable products, add parent product
    if (product.type === 'variable') {
      // Combine main image and gallery images
      const imageUrls = [product.mainImage, ...product.galleryImages]
        .filter(Boolean)
        .join(', ');

      csvData.push({
        ID: product.id,
        Type: 'variable',
        SKU: product.sku,
        Name: product.name,
        Published: 1,
        'Is featured?': 0,
        'Visibility in catalog': 'visible',
        'Short description': product.shortDescription,
        Description: product.longDescription,
        'Tax status': 'taxable',
        'In stock?': 1,
        'Allow customer reviews?': 1,
        'Regular price': '',
        Images: imageUrls,
        Position: 0,
      });

      // Add variants as separate rows
      product.variants?.forEach((variant, index) => {
        csvData.push({
          ID: variant.id,
          Type: 'variation',
          SKU: variant.sku,
          Name: `${product.name} - ${variant.attributes}`,
          Published: 1,
          'Visibility in catalog': 'visible',
          'Short description': '',
          Description: '',
          'Tax status': 'taxable',
          'In stock?': 1,
          'Regular price': variant.price.toString(),
          Parent: product.id,
          Position: index,
          'Attribute 1 name': 'Variation',
          'Attribute 1 value(s)': variant.attributes,
          'Attribute 1 visible': 1,
          'Attribute 1 global': 0,
        });
      });
    } else {
      // Simple product - combine main image and gallery images
      const imageUrls = [product.mainImage, ...product.galleryImages]
        .filter(Boolean)
        .join(', ');

      csvData.push({
        ID: product.id,
        Type: 'simple',
        SKU: product.sku,
        Name: product.name,
        Published: 1,
        'Is featured?': 0,
        'Visibility in catalog': 'visible',
        'Short description': product.shortDescription,
        Description: product.longDescription,
        'Tax status': 'taxable',
        'In stock?': 1,
        'Allow customer reviews?': 1,
        'Regular price': product.price.toString(),
        Images: imageUrls,
        Position: 0,
      });
    }
  });

  const csv = Papa.unparse(csvData);
  return csv;
}

export function downloadCSV(csvContent: string, filename: string = 'products.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

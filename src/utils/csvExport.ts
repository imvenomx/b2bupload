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
  const rows: Array<Record<string, string | number>> = [];

  products.forEach((product) => {
    const baseImages = [product.mainImage, ...product.galleryImages].filter(Boolean).join(', ');

    if (product.type === 'variable') {
      // Parent (variable) product row
      const parentRow: Record<string, string | number> = {
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
        Images: baseImages,
        Position: 0,
      };

      const attrs = product.attributes ?? [];
      attrs.forEach((attr, idx) => {
        const i = idx + 1;
        parentRow[`Attribute ${i} name`] = attr.name;
        parentRow[`Attribute ${i} value(s)`] = (attr.values || []).join(' | ');
        parentRow[`Attribute ${i} visible`] = attr.visible ? 1 : 1; // default visible
        parentRow[`Attribute ${i} global`] = 0;
      });

      rows.push(parentRow);

      // Variation rows
      product.variants?.forEach((variant, index) => {
        const variationRow: Record<string, string | number> = {
          ID: variant.id,
          Type: 'variation',
          SKU: variant.sku,
          Name: '',
          Published: 1,
          'Visibility in catalog': 'visible',
          'Short description': '',
          Description: '',
          'Tax status': 'taxable',
          'In stock?': 1,
          'Regular price': variant.price.toString(),
          Parent: product.sku || product.id,
          Position: index,
        };

        attrs.forEach((attr, idx) => {
          const i = idx + 1;
          variationRow[`Attribute ${i} name`] = attr.name;
          variationRow[`Attribute ${i} value(s)`] = variant.attributes[attr.name] || '';
          variationRow[`Attribute ${i} visible`] = attr.visible ? 1 : 1;
          variationRow[`Attribute ${i} global`] = 0;
        });

        if (variant.image) {
          variationRow['Images'] = variant.image;
        }

        rows.push(variationRow);
      });
    } else {
      // Simple product
      const simpleRow: Record<string, string | number> = {
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
        Images: baseImages,
        Position: 0,
      };

      rows.push(simpleRow);
    }
  });

  return Papa.unparse(rows);
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

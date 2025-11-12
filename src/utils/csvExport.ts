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
  const columns = [
    'ID',
    'Type',
    'SKU',
    'Name',
    'Published',
    'Is featured?',
    'Visibility in catalog',
    'Short description',
    'Description',
    'Tax status',
    'Tax class',
    'In stock?',
    'Stock',
    'Backorders allowed?',
    'Sold individually?',
    'Weight (lbs)',
    'Length (in)',
    'Width (in)',
    'Height (in)',
    'Allow customer reviews?',
    'Purchase note',
    'Sale price',
    'Regular price',
    'Categories',
    'Tags',
    'Shipping class',
    'Images',
    'Download limit',
    'Download expiry days',
    'Parent',
    'Grouped products',
    'Upsells',
    'Cross-sells',
    'External URL',
    'Button text',
    'Position',
    'Attribute 1 name',
    'Attribute 1 value(s)',
    'Attribute 1 visible',
    'Attribute 1 global',
  ] as const;

  const makeRow = (): Record<string, string | number> => {
    const row: Record<string, string | number> = {};
    for (const c of columns) row[c] = '';
    return row;
  };

  const rows: Array<Record<string, string | number>> = [];

  products.forEach((product) => {
    const baseImages = [product.mainImage, ...product.galleryImages].filter(Boolean).join(', ');
    const firstAttr = (product.attributes && product.attributes[0]) || undefined;

    if (product.type === 'variable') {
      // Parent row
      const parent = makeRow();
      parent['ID'] = product.id;
      parent['Type'] = 'variable';
      parent['SKU'] = product.sku;
      parent['Name'] = product.name;
      parent['Published'] = '1';
      parent['Is featured?'] = '0';
      parent['Visibility in catalog'] = 'visible';
      parent['Short description'] = product.shortDescription;
      parent['Description'] = product.longDescription;
      parent['Tax status'] = 'taxable';
      parent['Tax class'] = '';
      parent['In stock?'] = '1';
      parent['Stock'] = '';
      parent['Backorders allowed?'] = '0';
      parent['Sold individually?'] = '0';
      parent['Weight (lbs)'] = '';
      parent['Length (in)'] = '';
      parent['Width (in)'] = '';
      parent['Height (in)'] = '';
      parent['Allow customer reviews?'] = '1';
      parent['Purchase note'] = '';
      parent['Sale price'] = '';
      parent['Regular price'] = product.price ? product.price.toString() : '';
      parent['Categories'] = '';
      parent['Tags'] = '';
      parent['Shipping class'] = '';
      parent['Images'] = baseImages;
      parent['Download limit'] = '';
      parent['Download expiry days'] = '';
      parent['Parent'] = '';
      parent['Grouped products'] = '';
      parent['Upsells'] = '';
      parent['Cross-sells'] = '';
      parent['External URL'] = '';
      parent['Button text'] = '';
      parent['Position'] = '0';
      if (firstAttr) {
        parent['Attribute 1 name'] = firstAttr.name;
        parent['Attribute 1 value(s)'] = (firstAttr.values || []).join(' | ');
        parent['Attribute 1 visible'] = '1';
        parent['Attribute 1 global'] = '1';
      }
      rows.push(parent);

      // Variations
      product.variants?.forEach((variant, index) => {
        const vr = makeRow();
        vr['ID'] = '';
        vr['Type'] = 'variation';
        vr['SKU'] = variant.sku;
        vr['Name'] = firstAttr ? `${product.name} - ${variant.attributes[firstAttr.name] || ''}` : product.name;
        vr['Published'] = '1';
        vr['Is featured?'] = '0';
        vr['Visibility in catalog'] = '';
        vr['Short description'] = '';
        vr['Description'] = '';
        vr['Tax status'] = 'taxable';
        vr['Tax class'] = '';
        vr['In stock?'] = '1';
        vr['Stock'] = typeof variant.stock === 'number' ? String(variant.stock) : '';
        vr['Backorders allowed?'] = '0';
        vr['Sold individually?'] = '0';
        vr['Weight (lbs)'] = '';
        vr['Length (in)'] = '';
        vr['Width (in)'] = '';
        vr['Height (in)'] = '';
        vr['Allow customer reviews?'] = '';
        vr['Purchase note'] = '';
        vr['Sale price'] = '';
        vr['Regular price'] = (variant.price ?? product.price ?? 0).toString();
        vr['Categories'] = '';
        vr['Tags'] = '';
        vr['Shipping class'] = '';
        vr['Images'] = variant.image || '';
        vr['Download limit'] = '';
        vr['Download expiry days'] = '';
        vr['Parent'] = product.sku || product.id;
        vr['Grouped products'] = '';
        vr['Upsells'] = '';
        vr['Cross-sells'] = '';
        vr['External URL'] = '';
        vr['Button text'] = '';
        vr['Position'] = String(index);
        if (firstAttr) {
          vr['Attribute 1 name'] = firstAttr.name;
          vr['Attribute 1 value(s)'] = variant.attributes[firstAttr.name] || '';
          vr['Attribute 1 visible'] = '1';
          vr['Attribute 1 global'] = '1';
        }
        rows.push(vr);
      });
    } else {
      // Simple
      const row = makeRow();
      row['ID'] = product.id;
      row['Type'] = 'simple';
      row['SKU'] = product.sku;
      row['Name'] = product.name;
      row['Published'] = '1';
      row['Is featured?'] = '0';
      row['Visibility in catalog'] = 'visible';
      row['Short description'] = product.shortDescription;
      row['Description'] = product.longDescription;
      row['Tax status'] = 'taxable';
      row['Tax class'] = '';
      row['In stock?'] = '1';
      row['Stock'] = '';
      row['Backorders allowed?'] = '0';
      row['Sold individually?'] = '0';
      row['Weight (lbs)'] = '';
      row['Length (in)'] = '';
      row['Width (in)'] = '';
      row['Height (in)'] = '';
      row['Allow customer reviews?'] = '1';
      row['Purchase note'] = '';
      row['Sale price'] = '';
      row['Regular price'] = product.price.toString();
      row['Categories'] = '';
      row['Tags'] = '';
      row['Shipping class'] = '';
      row['Images'] = baseImages;
      row['Download limit'] = '';
      row['Download expiry days'] = '';
      row['Parent'] = '';
      row['Grouped products'] = '';
      row['Upsells'] = '';
      row['Cross-sells'] = '';
      row['External URL'] = '';
      row['Button text'] = '';
      row['Position'] = '0';
      // No attributes for simple in this schema
      rows.push(row);
    }
  });

  return Papa.unparse(rows, { header: true });
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

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Product, ProductAttribute, ProductVariant } from '@/types/product';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// DB row types
type DbProductRow = {
  id: string;
  name: string;
  short_description: string | null;
  long_description: string | null;
  type: 'simple' | 'variable';
  price: number;
  sku: string;
  main_image: string | null;
  created_at: string;
};

type DbImageRow = {
  id?: string;
  product_id: string;
  url: string;
  position: number;
};

type DbAttributeRow = {
  id: string;
  product_id: string;
  name: string;
  values: string[] | null;
  visible: boolean;
  variation: boolean;
};

type DbVariantRow = {
  id: string;
  product_id: string;
  sku: string;
  price: number;
  stock: number | null;
  image: string | null;
};

type DbVariantAttributeRow = {
  variant_id: string;
  name: string;
  value: string;
};

function mapDbToProduct(
  row: DbProductRow,
  images: DbImageRow[],
  attributes: DbAttributeRow[],
  variants: DbVariantRow[],
  variantAttrs: Record<string, DbVariantAttributeRow[]>
): Product {
  return {
    id: row.id,
    name: row.name,
    shortDescription: row.short_description ?? '',
    longDescription: row.long_description ?? '',
    type: row.type,
    price: Number(row.price),
    sku: row.sku,
    mainImage: row.main_image ?? undefined,
    galleryImages: images
      .filter((i: DbImageRow) => i.product_id === row.id)
      .sort((a: DbImageRow, b: DbImageRow) => a.position - b.position)
      .map((i: DbImageRow) => i.url),
    attributes: attributes
      .filter((a: DbAttributeRow) => a.product_id === row.id)
      .map((a: DbAttributeRow) => ({ id: a.id, name: a.name, values: a.values || [], visible: !!a.visible, variation: !!a.variation })) as ProductAttribute[],
    variants: variants
      .filter((v: DbVariantRow) => v.product_id === row.id)
      .map((v: DbVariantRow) => ({
        id: v.id,
        attributes: Object.fromEntries((variantAttrs[v.id] || []).map((va: DbVariantAttributeRow) => [va.name, va.value] as const)),
        sku: v.sku,
        price: Number(v.price),
        stock: v.stock ?? undefined,
        image: v.image ?? undefined,
      })) as ProductVariant[],
    createdAt: new Date(row.created_at),
  };
}

export async function GET() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const ids: string[] = (products || []).map((p: DbProductRow) => p.id);
    const [{ data: images }, { data: attrs }, { data: variants }] = await Promise.all([
      supabase.from('product_images').select('*').in('product_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']),
      supabase.from('product_attributes').select('*').in('product_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']),
      supabase.from('product_variants').select('*').in('product_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']),
    ]);

    const imageRows: DbImageRow[] = images ?? [];
    const attrRows: DbAttributeRow[] = attrs ?? [];
    const variantRows: DbVariantRow[] = variants ?? [];

    const variantIds: string[] = (variantRows || []).map((v: DbVariantRow) => v.id);
    const { data: variantAttributes } = await supabase
      .from('product_variant_attributes')
      .select('*')
      .in('variant_id', variantIds.length ? variantIds : ['00000000-0000-0000-0000-000000000000']);

    const variantAttrMap: Record<string, DbVariantAttributeRow[]> = {};
    const variantAttrRows: DbVariantAttributeRow[] = variantAttributes ?? [];
    variantAttrRows.forEach((va: DbVariantAttributeRow) => {
      variantAttrMap[va.variant_id] = variantAttrMap[va.variant_id] || [];
      variantAttrMap[va.variant_id].push(va);
    });

    const assembled: Product[] = (products || []).map((p: DbProductRow) =>
      mapDbToProduct(p, imageRows, attrRows, variantRows, variantAttrMap)
    );
    return NextResponse.json(assembled, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Product;

    const { data: createdProduct, error: prodError } = await supabase
      .from('products')
      .insert({
        name: body.name,
        short_description: body.shortDescription,
        long_description: body.longDescription,
        type: body.type,
        price: body.price,
        sku: body.sku,
        main_image: body.mainImage ?? null,
      })
      .select('*')
      .single();
    if (prodError) throw prodError;

    const productId = createdProduct.id as string;

    if (body.galleryImages?.length) {
      const imgs: DbImageRow[] = body.galleryImages.map((url, idx) => ({ product_id: productId, url, position: idx }));
      const { error: imgErr } = await supabase.from('product_images').insert(imgs);
      if (imgErr) throw imgErr;
    }

    if (body.attributes?.length) {
      const attrs = body.attributes.map((a) => ({ product_id: productId, name: a.name, values: a.values, visible: a.visible, variation: a.variation }));
      const { error: attrErr } = await supabase.from('product_attributes').insert(attrs);
      if (attrErr) throw attrErr;
    }

    if (body.variants?.length) {
      const variantRows = body.variants.map((v) => ({ product_id: productId, sku: v.sku, price: v.price, stock: v.stock ?? null, image: v.image ?? null }));
      const { data: insertedVariants, error: varErr } = await supabase
        .from('product_variants')
        .insert(variantRows)
        .select('*');
      if (varErr) throw varErr;

      const attrPairs: DbVariantAttributeRow[] = [];
      const inserted: DbVariantRow[] = insertedVariants ?? [];
      inserted.forEach((ins: DbVariantRow, i: number) => {
        const original = body.variants![i];
        Object.entries(original.attributes || {}).forEach(([name, value]) => {
          attrPairs.push({ variant_id: ins.id, name, value: String(value) });
        });
      });
      if (attrPairs.length) {
        const { error: vaErr } = await supabase.from('product_variant_attributes').insert(attrPairs);
        if (vaErr) throw vaErr;
      }
    }

    return NextResponse.json({ id: productId }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

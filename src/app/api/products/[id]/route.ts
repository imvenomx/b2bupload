import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Product } from '@/types/product';

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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    if (prodErr) throw prodErr;

    const [{ data: images }, { data: attrs }, { data: variants }] = await Promise.all([
      supabase.from('product_images').select('*').eq('product_id', id),
      supabase.from('product_attributes').select('*').eq('product_id', id),
      supabase.from('product_variants').select('*').eq('product_id', id),
    ]);

    const imageRows: DbImageRow[] = images ?? [];
    const attrRows: DbAttributeRow[] = attrs ?? [];
    const variantRows: DbVariantRow[] = variants ?? [];

    const variantIds: string[] = (variantRows as DbVariantRow[]).map((v: DbVariantRow) => v.id);
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

    const res: Product = {
      id: product.id,
      name: product.name,
      shortDescription: product.short_description ?? '',
      longDescription: product.long_description ?? '',
      type: product.type,
      price: Number(product.price),
      sku: product.sku,
      mainImage: product.main_image ?? undefined,
      galleryImages: imageRows
        .slice()
        .sort((a: DbImageRow, b: DbImageRow) => a.position - b.position)
        .map((i: DbImageRow) => i.url),
      attributes: attrRows.map((a: DbAttributeRow) => ({ id: a.id, name: a.name, values: a.values || [], visible: !!a.visible, variation: !!a.variation })),
      variants: variantRows.map((v: DbVariantRow) => ({
        id: v.id,
        attributes: Object.fromEntries((variantAttrMap[v.id] || []).map((va: DbVariantAttributeRow) => [va.name, va.value] as const)),
        sku: v.sku,
        price: Number(v.price),
        stock: v.stock ?? undefined,
        image: v.image ?? undefined,
      })),
      createdAt: new Date(product.created_at),
    };

    return NextResponse.json(res, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await req.json()) as Product;

    // Update product
    const { error: prodErr } = await supabase
      .from('products')
      .update({
        name: body.name,
        short_description: body.shortDescription,
        long_description: body.longDescription,
        type: body.type,
        price: body.price,
        sku: body.sku,
        main_image: body.mainImage ?? null,
      })
      .eq('id', id);
    if (prodErr) throw prodErr;

    // Replace related sets (simpler approach)
    await supabase.from('product_images').delete().eq('product_id', id);
    await supabase.from('product_attributes').delete().eq('product_id', id);

    const { data: existingVariants, error: exVarErr } = await supabase
      .from('product_variants')
      .select('id')
      .eq('product_id', id);
    if (exVarErr) throw exVarErr;
    const existingVariantIds = (existingVariants || []).map((v: { id: string }) => v.id);
    if (existingVariantIds.length) {
      await supabase.from('product_variant_attributes').delete().in('variant_id', existingVariantIds);
      await supabase.from('product_variants').delete().eq('product_id', id);
    }

    if (body.galleryImages?.length) {
      const imgs = body.galleryImages.map((url, idx) => ({ product_id: id, url, position: idx }));
      const { error: imgErr } = await supabase.from('product_images').insert(imgs);
      if (imgErr) throw imgErr;
    }

    if (body.attributes?.length) {
      const attrs = body.attributes.map(a => ({ product_id: id, name: a.name, values: a.values, visible: a.visible, variation: a.variation }));
      const { error: attrErr } = await supabase.from('product_attributes').insert(attrs);
      if (attrErr) throw attrErr;
    }

    if (body.variants?.length) {
      const variantRows = body.variants.map((v) => ({ product_id: id, sku: v.sku, price: v.price, stock: v.stock ?? null, image: v.image ?? null }));
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

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

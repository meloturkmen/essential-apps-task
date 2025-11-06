// Backend for the inventory overview page
import { authenticate } from "../shopify.server.js";

const PRODUCTS_QUERY = `#graphql
  query ProductsWithInventory($cursor: String) {
    products(first: 100, after: $cursor, sortKey: TITLE) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        title
        handle
        variants(first: 100) {
          nodes {
            id
            title
            sku
            inventoryQuantity
          }
        }
      }
    }
  }
`;

export async function loader({ request }) {
  const url = new URL(request.url);
  const status = (url.searchParams.get("status") || "all").toLowerCase();
  const threshold = Number(url.searchParams.get("threshold") || 5);

  const { admin } = await authenticate.admin(request);

  const all = [];
  let cursor = null;

  for (let i = 0; i < 2; i++) {
    const res = await admin.graphql(PRODUCTS_QUERY, { variables: { cursor } });
    const data = await res.json();
    const nodes = data?.data?.products?.nodes || [];
    all.push(...nodes);

    const pageInfo = data?.data?.products?.pageInfo;
    if (!pageInfo?.hasNextPage) break;
    cursor = pageInfo?.endCursor ?? null;
  }

  const rows = all.flatMap((p) =>
    (p.variants?.nodes || []).map((v) => ({
      productId: p.id,
      productTitle: p.title,
      variantId: v.id,
      variantTitle: v.title,
      sku: v.sku || "",
      quantity:
        typeof v.inventoryQuantity === "number" ? v.inventoryQuantity : 0,
    }))
  );

  const filtered =
    status === "low"
      ? rows.filter((r) => r.quantity > 0 && r.quantity < threshold)
      : status === "out"
      ? rows.filter((r) => r.quantity === 0)
      : rows;

  return new Response(JSON.stringify({
    status,
    threshold,
    count: filtered.length,
    items: filtered,
  }), {
    headers: { "Content-Type": "application/json" },
  });
}

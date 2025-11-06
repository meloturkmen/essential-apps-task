// Frontend for the inventory overview page

import React, { useEffect, useMemo, useState } from "react";
import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function ProductsPage() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const [status, setStatus] = useState("all");     // all | low | out
  const [threshold, setThreshold] = useState("5"); // string for input

  useEffect(() => {
    const t = Number(threshold || 5);
    fetcher.load(`/api/products?status=${status}&threshold=${t}`);
  }, [status, threshold]);

  const loading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod !== "POST";

  const items = fetcher.data?.items ?? [];
  const rows = useMemo(() => items, [items]);

  const currentBadge = (qty) =>
    qty === 0 ? "critical" : qty < Number(threshold || 5) ? "attention" : "success";

  return (
    <s-page heading="Inventory overview" backAction={{ content: "Home", url: "/app" }}>
      <s-section heading="Filters">
  <s-box>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
      }}
    >
      {/* Left: filter buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <s-button
          variant={status === "all" ? "primary" : "tertiary"}
          onClick={() => setStatus("all")}
        >
          All
        </s-button>
        <s-button
          variant={status === "low" ? "primary" : "tertiary"}
          onClick={() => setStatus("low")}
        >
          Low stock
        </s-button>
        <s-button
          variant={status === "out" ? "primary" : "tertiary"}
          onClick={() => setStatus("out")}
        >
          Out of stock
        </s-button>
      </div>

      {/* Right: threshold control */}
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <label
          htmlFor="low-threshold"
          style={{ whiteSpace: "nowrap", fontSize: 14 }}
        >
          Low stock threshold
        </label>
        <input
          id="low-threshold"
          type="number"
          min={1}
          max={9999}
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          style={{
            width: 100,
            height: "36px",               // match control height
            boxSizing: "border-box",
            padding: "6px 10px",
            border: "1px solid var(--p-color-border, #d2d5d8)",
            borderRadius: "8px",
            background: "var(--p-color-bg, #fff)",
            outline: "none",
          }}
        />
      </div>
    </div>
  </s-box>
</s-section>


      <s-section heading="Products">
        {loading && <s-skeleton-display-text size="small" />}
        {!loading && rows.length === 0 && (
          <s-empty-state
            heading="No products match this filter"
            action={{ content: "Show all", url: "/app/products" }}
            secondaryAction={{ content: "Go Home", url: "/app" }}
          >
            <s-text>Try changing the filter or threshold.</s-text>
          </s-empty-state>
        )}

        {!loading && rows.length > 0 && (
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead
  style={{
    position: "sticky",
    top: 0,
    background: "var(--p-color-bg, #fff)",
    zIndex: 2,
  }}
>
  <tr>
    <th scope="col" style={th}>Product</th>
    <th scope="col" style={th}>Variant</th>
    <th scope="col" style={th}>SKU</th>
    <th scope="col" style={th}>Qty</th>
    <th scope="col" style={th}>Status</th>
  </tr>
</thead>

                <tbody>
                  {rows.map((r) => (
                    <tr key={r.variantId}>
                      <td style={tdStrong}>{r.productTitle}</td>
                      <td style={td}>{r.variantTitle}</td>
                      <td style={td}>{r.sku || "-"}</td>
                      <td style={td}>{r.quantity}</td>
                      <td style={td}>
                        <s-badge tone={currentBadge(r.quantity)}>
                          {r.quantity === 0
                            ? "Out"
                            : r.quantity < Number(threshold || 5)
                            ? "Low"
                            : "OK"}
                        </s-badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </s-box>
        )}
      </s-section>
    </s-page>
  );
}

const th = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "1px solid var(--p-color-border)",
  whiteSpace: "nowrap",
};

const td = {
  padding: "8px 10px",
  borderBottom: "1px solid var(--p-color-border)",
  verticalAlign: "top",
};

const tdStrong = {
  ...td,
  fontWeight: 600,
};

export const headers = (args) => boundary.headers(args);

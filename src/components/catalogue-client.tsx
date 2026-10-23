"use client";

import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { ProductCard } from "@/components/product-card";
import { categories, isProductInStock, productColours, products, productSizes, productSuppliers } from "@/data/products";

type CatalogueClientProps = { lockedCategory?: string };

export function CatalogueClient({ lockedCategory }: CatalogueClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const searchTimer = useRef<number | undefined>(undefined);
  const category = lockedCategory ?? (searchParams.get("category") ?? "");
  const size = searchParams.get("size") ?? "";
  const colour = searchParams.get("colour") ?? "";
  const supplier = searchParams.get("supplier") ?? "";
  const sort = searchParams.get("sort") ?? "new";
  const maxPrice = Number(searchParams.get("max") ?? 2000);
  const inStockOnly = searchParams.get("stock") === "1";

  function updateParam(name: string, value?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }

  useEffect(() => {
    return () => window.clearTimeout(searchTimer.current);
  }, []);

  function scheduleSearch(value: string) {
    window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");
      const nextQuery = params.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    }, 250);
  }

  const normalizedQuery = urlQuery.trim().toLowerCase();
  const matchingProducts = products
    .filter((product) => {
      const searchable = `${product.name} ${product.supplierName} ${product.category} ${product.description}`.toLowerCase();
      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (!category || product.categorySlug === category) &&
        (!size || product.sizes.includes(size)) &&
        (!colour || product.colours.some((item) => item.name.toLowerCase() === colour)) &&
        (!supplier || product.supplierSlug === supplier) &&
        product.priceInPaise <= maxPrice * 100 &&
        (!inStockOnly || isProductInStock(product))
      );
    })
    .sort((left, right) => {
      if (sort === "price-low") return left.priceInPaise - right.priceInPaise;
      if (sort === "price-high") return right.priceInPaise - left.priceInPaise;
      if (sort === "popular") return right.popularity - left.popularity;
      return Date.parse(right.releasedAt) - Date.parse(left.releasedAt);
    });

  const activeFilterCount = [
    lockedCategory ? "" : category,
    size,
    colour,
    supplier,
    maxPrice < 2000 ? String(maxPrice) : "",
    inStockOnly ? "stock" : "",
  ].filter(Boolean).length;

  function clearFilters() {
    window.clearTimeout(searchTimer.current);
    router.replace(pathname, { scroll: false });
  }

  return (
    <section className="catalogue" aria-label="Product catalogue">
      <nav className="category-rail" aria-label="Shop by category">
        <Link className={!lockedCategory && !category ? "is-active" : ""} href="/shop">All pieces</Link>
        {categories.map((item) => (
          <Link className={category === item.slug ? "is-active" : ""} href={`/shop/${item.slug}`} key={item.slug}>{item.name}</Link>
        ))}
      </nav>

      <div className="catalogue-controls">
        <label className="catalogue-search">
          <span className="sr-only">Search the catalogue</span>
          <Search aria-hidden="true" size={18} />
          <input key={urlQuery} type="search" defaultValue={urlQuery} onChange={(event) => scheduleSearch(event.target.value)} placeholder="Search pieces, makers, cloth" />
        </label>

        <details className="catalogue-filters">
          <summary><SlidersHorizontal aria-hidden="true" size={17} /> Filters {activeFilterCount ? `(${activeFilterCount})` : ""}</summary>
          <div className="filter-drawer">
            {!lockedCategory ? (
              <label>Category
                <select value={category} onChange={(event) => updateParam("category", event.target.value)}>
                  <option value="">All categories</option>
                  {categories.map((item) => <option value={item.slug} key={item.slug}>{item.name}</option>)}
                </select>
              </label>
            ) : null}
            <label>Size
              <select value={size} onChange={(event) => updateParam("size", event.target.value)}>
                <option value="">All sizes</option>
                {productSizes.map((item) => <option value={item} key={item}>{item}</option>)}
              </select>
            </label>
            <label>Colour
              <select value={colour} onChange={(event) => updateParam("colour", event.target.value)}>
                <option value="">All colours</option>
                {productColours.map((item) => <option value={item.name.toLowerCase()} key={item.name}>{item.name}</option>)}
              </select>
            </label>
            <label>Supplier
              <select value={supplier} onChange={(event) => updateParam("supplier", event.target.value)}>
                <option value="">All suppliers</option>
                {productSuppliers.map((item) => <option value={item.slug} key={item.slug}>{item.name}</option>)}
              </select>
            </label>
            <label className="price-filter">Maximum price <output>₹{maxPrice.toLocaleString("en-IN")}</output>
              <input type="range" min="400" max="2000" step="100" value={maxPrice} onChange={(event) => updateParam("max", event.target.value === "2000" ? "" : event.target.value)} />
            </label>
            <label className="check-filter">
              <input type="checkbox" checked={inStockOnly} onChange={(event) => updateParam("stock", event.target.checked ? "1" : "")} />
              In-stock only
            </label>
            <button className="filter-reset" type="button" onClick={clearFilters}><RotateCcw aria-hidden="true" size={15} /> Clear filters</button>
          </div>
        </details>

        <label className="sort-control"><span>Sort</span>
          <select value={sort} onChange={(event) => updateParam("sort", event.target.value === "new" ? "" : event.target.value)}>
            <option value="new">Newest</option>
            <option value="popular">Popular</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
          </select>
        </label>
      </div>

      <div className="catalogue-result-line" aria-live="polite">
        <span>{matchingProducts.length} {matchingProducts.length === 1 ? "piece" : "pieces"}</span><span>Prices include GST</span>
      </div>

      {matchingProducts.length ? (
        <div className="product-grid product-grid--shop">
          {matchingProducts.map((product, index) => <ProductCard key={product.slug} product={product} index={index} />)}
        </div>
      ) : (
        <div className="catalogue-empty">
          <p className="eyebrow">Nothing hiding here</p><h2>No pieces match these filters.</h2>
          <button className="button button--ink" type="button" onClick={clearFilters}>Clear filters</button>
        </div>
      )}
    </section>
  );
}

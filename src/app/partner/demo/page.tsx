import type { Metadata } from "next";

import { SupplierDemo } from "@/components/supplier-demo";

export const metadata: Metadata = {
  title: "Supplier demo",
  description: "A guided, sample-data walkthrough of the PB UNDERGROUND supplier workflow.",
};

export default function SupplierDemoPage() {
  return <SupplierDemo />;
}

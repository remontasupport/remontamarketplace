/**
 * Contract Signing Page
 * Dynamic route for ABN and TFN contracts
 * Route: /dashboard/worker/contract/abn or /dashboard/worker/contract/tfn
 */

"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { notFound } from "next/navigation";
import { ContractPage } from "@/components/contracts";
import "@/app/styles/contract.css";

interface ContractPageRouteProps {
  params: Promise<{
    type: string;
  }>;
}

export default function ContractPageRoute({ params }: ContractPageRouteProps) {
  const { type } = use(params);
  const searchParams = useSearchParams();

  // Get pre-filled tax ID from URL query params
  const initialTaxId = searchParams.get("taxId") || "";

  // Validate contract type
  if (type !== "abn" && type !== "tfn") {
    notFound();
  }

  return <ContractPage contractType={type} initialTaxId={initialTaxId} />;
}

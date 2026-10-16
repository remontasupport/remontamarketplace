/**
 * Contract Signing Page
 * Dynamic route for ABN and TFN contracts
 * Route: /dashboard/worker/contract/abn or /dashboard/worker/contract/tfn
 */

"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import { ContractPage } from "@/components/contracts";
import { takeHandedTaxId } from "@/features/worker/compliance";
import "@/app/styles/contract.css";

interface ContractPageRouteProps {
  params: Promise<{
    type: string;
  }>;
}

export default function ContractPageRoute({ params }: ContractPageRouteProps) {
  const { type } = use(params);

  // The ABN or TFN the worker typed on the setup page, handed over in session storage (C3: never in the URL).
  const [initialTaxId] = useState(takeHandedTaxId);

  // Validate contract type
  if (type !== "abn" && type !== "tfn") {
    notFound();
  }

  return <ContractPage contractType={type} initialTaxId={initialTaxId} />;
}

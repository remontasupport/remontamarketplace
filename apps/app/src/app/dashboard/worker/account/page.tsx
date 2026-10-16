"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AccountSettingsPanel, { type ExtraTab } from "@/components/dashboard/AccountSettingsPanel";
import { bankAccountSection } from "@/features/worker/definitions";
import SectionPage from "@/features/worker/SectionPage";
import ManageServices from "@/features/worker/ManageServices";

// Tabs beside Username & password: the worker's services (user, 2026-10-16; added and removed here, was the Services
// menu's "Modify Services") and bank account (user, 2026-10-13). Declared once, outside the component, so the panel's
// ?tab= check runs once.
const WORKER_TABS: readonly ExtraTab[] = [
  { id: "services", label: "Services", content: <ManageServices /> },
  { id: "bank-account", label: "Bank Account", content: <SectionPage def={bankAccountSection} /> },
];

export default function AccountSettingsPage() {
  return (
    <DashboardLayout>
      <AccountSettingsPanel extraTabs={WORKER_TABS} />
    </DashboardLayout>
  );
}

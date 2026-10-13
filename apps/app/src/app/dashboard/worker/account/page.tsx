"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AccountSettingsPanel, { type ExtraTab } from "@/components/dashboard/AccountSettingsPanel";
import { bankAccountSection } from "@/features/worker/definitions";
import SectionPage from "@/features/worker/SectionPage";

// The worker's bank account is a tab here, beside Username & password (user, 2026-10-13); it saves through the same
// write as before. Declared once, outside the component, so the panel's ?tab= check runs once.
const WORKER_TABS: readonly ExtraTab[] = [{ id: "bank-account", label: "Bank Account", content: <SectionPage def={bankAccountSection} /> }];

export default function AccountSettingsPage() {
  return (
    <DashboardLayout>
      <AccountSettingsPanel extraTabs={WORKER_TABS} />
    </DashboardLayout>
  );
}

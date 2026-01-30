"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useRequestService, STEPS } from "./RequestServiceContext";

interface SubMenuItem {
  id: string;
  label: string;
  href: string;
}

interface MenuItem {
  id: string;
  label: string;
  href: string;
  subItems?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: "what",
    label: "Services",
    href: "/dashboard/client/request-service?section=what",
  },
  {
    id: "where",
    label: "Location",
    href: "/dashboard/client/request-service?section=where",
  },
  {
    id: "when",
    label: "Schedule",
    href: "/dashboard/client/request-service?section=when",
  },
  {
    id: "details",
    label: "Details",
    href: "/dashboard/client/request-service?section=support-details",
    subItems: [
      {
        id: "support-details",
        label: "Support details",
        href: "/dashboard/client/request-service?section=support-details",
      },
      {
        id: "details",
        label: "Participant",
        href: "/dashboard/client/request-service?section=details",
      },
      {
        id: "diagnoses",
        label: "Conditions",
        href: "/dashboard/client/request-service?section=diagnoses",
      },
      {
        id: "preferences",
        label: "Worker preferences",
        href: "/dashboard/client/request-service?section=preferences",
      },
    ],
  },
  {
    id: "preview",
    label: "Review & Submit",
    href: "/dashboard/client/request-service?section=preview",
  },
];

// All detail sub-section IDs for checking if we're in the details group
const detailsSectionIds = ["support-details", "details", "diagnoses", "preferences"];

interface RequestServiceMenuProps {
  currentSection: string;
}

export default function RequestServiceMenu({ currentSection }: RequestServiceMenuProps) {
  const { completedSteps } = useRequestService();

  const isInDetailsSection = detailsSectionIds.includes(currentSection);

  // Get step index by section ID
  const getStepIndex = (sectionId: string) => {
    return STEPS.findIndex((step) => step.section === sectionId);
  };

  // Check if a step is completed (visited)
  const isStepCompleted = (sectionId: string) => {
    const stepIndex = getStepIndex(sectionId);
    return completedSteps.includes(stepIndex);
  };

  return (
    <div className="additional-details-menu">
      <nav className="additional-details-nav open">
        {menuItems.map((item) => {
          // For items with subitems, check if any subitem is the current section
          const isActive = item.subItems
            ? detailsSectionIds.includes(currentSection)
            : currentSection === item.id;

          // Check if all subitems are completed, or if the single item is completed
          const completed = item.subItems
            ? item.subItems.every((sub) => isStepCompleted(sub.id))
            : isStepCompleted(item.id);

          return (
            <div key={item.id}>
              <Link
                href={item.href}
                className={`additional-details-item ${isActive && !item.subItems ? "active" : ""} ${item.subItems && isInDetailsSection ? "font-medium" : ""}`}
              >
                <div className={`additional-details-radio ${completed ? "completed" : ""}`}>
                  {completed && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="additional-details-item-label">{item.label}</span>
              </Link>

              {/* Sub-items */}
              {item.subItems && isInDetailsSection && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.subItems.map((subItem) => {
                    const isSubActive = currentSection === subItem.id;
                    const subCompleted = isStepCompleted(subItem.id);

                    return (
                      <Link
                        key={subItem.id}
                        href={subItem.href}
                        className={`additional-details-item text-sm ${isSubActive ? "active" : ""}`}
                      >
                        <div className={`additional-details-radio ${subCompleted ? "completed" : ""}`} style={{ width: '12px', height: '12px' }}>
                          {subCompleted && <Check className="w-2 h-2 text-white" />}
                        </div>
                        <span className="additional-details-item-label">{subItem.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

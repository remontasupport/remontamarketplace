"use client";

import Link from "next/link";

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
    label: "What",
    href: "/dashboard/client/request-service?section=what",
  },
  {
    id: "where",
    label: "Where",
    href: "/dashboard/client/request-service?section=where",
  },
  {
    id: "when",
    label: "When",
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
        label: "Basic information",
        href: "/dashboard/client/request-service?section=details",
      },
      {
        id: "diagnoses",
        label: "Diagnoses, conditions or disabilities",
        href: "/dashboard/client/request-service?section=diagnoses",
      },
      {
        id: "preferences",
        label: "Preferences",
        href: "/dashboard/client/request-service?section=preferences",
      },
    ],
  },
  {
    id: "preview",
    label: "Preview",
    href: "/dashboard/client/request-service?section=preview",
  },
];

// All detail sub-section IDs for checking if we're in the details group
const detailsSectionIds = ["support-details", "details", "diagnoses", "preferences"];

interface RequestServiceMenuProps {
  currentSection: string;
}

export default function RequestServiceMenu({ currentSection }: RequestServiceMenuProps) {
  const isInDetailsSection = detailsSectionIds.includes(currentSection);

  return (
    <div className="additional-details-menu">
      <nav className="additional-details-nav open">
        {menuItems.map((item) => {
          const isActive = item.subItems
            ? detailsSectionIds.includes(currentSection)
            : currentSection === item.id;

          return (
            <div key={item.id}>
              <Link
                href={item.href}
                className={`additional-details-item ${isActive && !item.subItems ? "active" : ""} ${item.subItems && isInDetailsSection ? "font-medium" : ""}`}
              >
                <div className="additional-details-radio"></div>
                <span className="additional-details-item-label">{item.label}</span>
              </Link>

              {/* Sub-items */}
              {item.subItems && isInDetailsSection && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.subItems.map((subItem) => {
                    const isSubActive = currentSection === subItem.id;
                    return (
                      <Link
                        key={subItem.id}
                        href={subItem.href}
                        className={`additional-details-item text-sm ${isSubActive ? "active" : ""}`}
                      >
                        <div className="additional-details-radio" style={{ width: '12px', height: '12px' }}></div>
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

"use client";

import Link from "next/link";

interface MenuItem {
  id: string;
  label: string;
  href: string;
}

const menuItems: MenuItem[] = [
  {
    id: "preferred-hours",
    label: "Preferred Hours",
    href: "/dashboard/worker/profile-building?section=preferred-hours",
  },
  {
    id: "indicative-rates",
    label: "Indicative Rates",
    href: "/dashboard/worker/profile-building?section=indicative-rates",
  },
  // {
  //   id: "locations",
  //   label: "Locations",
  //   href: "/dashboard/worker/profile-building?section=locations",
  // },
  {
    id: "experience",
    label: "Experience",
    href: "/dashboard/worker/profile-building?section=experience",
  },
];

interface JobDetailsMenuProps {
  currentSection: string;
}

export default function JobDetailsMenu({ currentSection }: JobDetailsMenuProps) {
  return (
    <div className="additional-details-menu">
      <h3 className="additional-details-title">Job Details</h3>
      <nav className="additional-details-nav">
        {menuItems.map((item) => {
          const isActive = currentSection === item.id;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`additional-details-item ${isActive ? "active" : ""}`}
            >
              <div className="additional-details-radio"></div>
              <span className="additional-details-item-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

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
  const [isOpen, setIsOpen] = useState(true); // Open by default

  return (
    <div className="additional-details-menu">
      <div
        className="additional-details-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="additional-details-title">Job Details</h3>
        <ChevronDownIcon
          className={`additional-details-chevron ${isOpen ? 'open' : ''}`}
        />
      </div>
      <nav className={`additional-details-nav ${isOpen ? 'open' : ''}`}>
        {menuItems.map((item) => {
          const isActive = currentSection === item.id;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`additional-details-item ${isActive ? "active" : ""}`}
              onClick={() => setIsOpen(false)}
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

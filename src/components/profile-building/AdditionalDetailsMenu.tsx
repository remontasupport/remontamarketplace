"use client";

import Link from "next/link";

interface MenuItem {
  id: string;
  label: string;
  href: string;
  completed?: boolean;
}

const menuItems: MenuItem[] = [
  {
    id: "bank-account",
    label: "Bank Account",
    href: "/dashboard/worker/profile-building?section=bank-account",
  },
  {
    id: "work-history",
    label: "Work History",
    href: "/dashboard/worker/profile-building?section=work-history",
  },
  {
    id: "education-training",
    label: "Education & Training",
    href: "/dashboard/worker/profile-building?section=education-training",
  },
  {
    id: "good-to-know",
    label: "Good To Know",
    href: "/dashboard/worker/profile-building?section=good-to-know",
  },
  {
    id: "languages",
    label: "Languages",
    href: "/dashboard/worker/profile-building?section=languages",
  },
  {
    id: "cultural-background",
    label: "Cultural Background",
    href: "/dashboard/worker/profile-building?section=cultural-background",
  },
  {
    id: "religion",
    label: "Religion",
    href: "/dashboard/worker/profile-building?section=religion",
  },
  {
    id: "interests-hobbies",
    label: "Interests & Hobbies",
    href: "/dashboard/worker/profile-building?section=interests-hobbies",
  },
  {
    id: "about-me",
    label: "About Me",
    href: "/dashboard/worker/profile-building?section=about-me",
  },
  {
    id: "personality",
    label: "Personality",
    href: "/dashboard/worker/profile-building?section=personality",
  },
  {
    id: "my-preferences",
    label: "My Preferences",
    href: "/dashboard/worker/profile-building?section=my-preferences",
  },
];

interface AdditionalDetailsMenuProps {
  currentSection: string;
}

export default function AdditionalDetailsMenu({ currentSection }: AdditionalDetailsMenuProps) {
  return (
    <div className="additional-details-menu">
      <h3 className="additional-details-title">Additional Details</h3>
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

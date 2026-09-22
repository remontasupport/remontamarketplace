"use client";

/**
 * Progress-aware Link Component
 *
 * Shows progress bar during navigation
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, startTransition } from "react";
import { useProgressContext } from "@/contexts/ProgressContext";

export default function ProgressLink({
  href,
  children,
  className,
  ...props
}: {
  href: string;
  children: ReactNode;
  className?: string;
  [key: string]: any;
}) {
  const router = useRouter();
  const { start, done } = useProgressContext();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // Start progress
    start();

    // Use startTransition for navigation
    startTransition(() => {
      router.push(href);

      // Complete progress after navigation
      setTimeout(() => {
        done();
      }, 500);
    });
  };

  return (
    <Link onClick={handleClick} href={href} className={className} {...props}>
      {children}
    </Link>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { useTransitionRouter } from "next-transition-router";
import ContactOwnerButton from "../Components/Contactownerbutton"

export default function CarNav({ id }: { id: string }) {
  const router = useTransitionRouter();
  const pathname = usePathname();

  const navItems = [
    { label: "Models", href: `/showroom/${id}` },
    { label: "Services", href: `/showroom/${id}/services` },
    { label: "Purchase", href: `/showroom/${id}/purchase` },
    { label: "Engine", href: `/showroom/${id}/engine` },
    { label: "Book Specialist", href: `/showroom/${id}/specialist` },
  ];

  const navButtonClass =
    "px-4 py-2 rounded-full text-sm transition-colors bg-white/5 backdrop-blur-md border border-white/10 text-neutral-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <nav className="flex items-center gap-2">
      {navItems.map(({ label, href }) => {
        const isActive = pathname === href;
        return (
          <button
            key={label}
            onClick={() => router.push(href)}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              isActive
                ? "bg-white text-neutral-900"
                : "bg-white/5 backdrop-blur-md border border-white/10 text-neutral-300 hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}
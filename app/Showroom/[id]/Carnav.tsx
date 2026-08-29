"use client";

import { useTransitionRouter } from "next-transition-router";
import ContactOwnerButton from "../Components/Contactownerbutton"
export default function CarNav({ id }: { id: string }) {
  const router = useTransitionRouter();
  const navButtonClass =
    "px-4 py-2 rounded-full text-sm transition-colors bg-white/5 backdrop-blur-md border border-white/10 text-neutral-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed";

  const handleNavClick = (item: string) => {
    switch (item) {
      case "Models":
        router.push(`/showroom/${id}`);
        break;

      case "Services":
        router.push(`/showroom/${id}/services`);
        break;
      case "Engine":
          router.push(`/showroom/${id}/engine`);
          break;

      case "Shop":
        router.push(`/showroom/${id}/shop`);
        break;

      case "Purchase":
        router.push(`/showroom/${id}/purchase`);
        break;
    }
  };

  return (
    <nav className="flex items-center gap-2">
      {["Models", "Services", "Shop", "Purchase", "Engine"].map((item, i) => (
        <button
          key={item}
          onClick={() => handleNavClick(item)}
          className={`px-4 py-2 rounded-full text-sm transition-colors ${
            i === 0
              ? "bg-white text-neutral-900"
              : "bg-white/5 backdrop-blur-md border border-white/10 text-neutral-300 hover:bg-white/10"
          }`}
        >
          {item}
        </button>
      ))}

      <ContactOwnerButton
        carId={Number(id)}
        className={navButtonClass}
      />
    </nav>
  );
}
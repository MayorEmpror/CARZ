"use client";
import { useRef, startTransition } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { TransitionRouter } from "next-transition-router";

export function Providers({ children }: { children: React.ReactNode }) {
  const firstLayer = useRef<HTMLDivElement | null>(null);
  const secondLayer = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  // Chat has its own persistent sidebar/layout (WhatsApp-style) --
  // a full-screen wipe transition on every conversation switch would
  // fight that and look broken. Skip the transition wrapper entirely
  // for anything under /chat; every other route keeps it as-is.
  const skipTransition = pathname?.startsWith("/chat");

  if (skipTransition) {
    return <main>{children}</main>;
  }

  return (
    <TransitionRouter
      auto={true}
      leave={(next) => {
        const tl = gsap
          .timeline({
            onComplete: next,
          })
          .fromTo(
            firstLayer.current,
            { x: "100%" },
            {
              x: 0,
              duration: 0.5,
              ease: "circ.inOut",
            },
          )
          .fromTo(
            secondLayer.current,
            {
              x: "100%",
            },
            {
              x: 0,
              duration: 0.5,
              ease: "circ.inOut",
            },
            "<50%",
          );
        return () => {
          tl.kill();
        };
      }}
      enter={(next) => {
        const tl = gsap
          .timeline()
          .fromTo(
            secondLayer.current,
            { x: 0 },
            {
              x: "-100%",
              duration: 0.5,
              ease: "circ.inOut",
            },
          )
          .fromTo(
            firstLayer.current,
            { x: 0 },
            {
              x: "-100%",
              duration: 0.5,
              ease: "circ.inOut",
            },
            "<50%",
          )
          .call(() => {
            // Defer React updates to prevent jank during animation
            requestAnimationFrame(() => {
              startTransition(next);
            });
          }, undefined, "<50%");
        return () => {
          tl.kill();
        };
      }}
    >
      <main>{children}</main>
      <div
        ref={firstLayer}
        className="fixed inset-0 z-999999999 translate-x-full bg-zinc-900"
      />
      <div
        ref={secondLayer}
        className="fixed inset-0 z-999999999 translate-x-full bg-zinc-950"
      />
    </TransitionRouter>
  );
}
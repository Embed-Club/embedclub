"use client";

import React, { useEffect, useRef, useContext } from "react";
import DecryptedTextProps from "@/components/DecryptedText";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollContainerContext } from "@/components/FrontendShell";

gsap.registerPlugin(ScrollTrigger);

export default function DashboardTitle() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const scrollEl = useContext(ScrollContainerContext);

  useEffect(() => {
    if (!containerRef.current || !titleRef.current || !scrollEl) {
      console.warn("Missing:", { container: containerRef.current, title: titleRef.current, scroller: scrollEl });
      return;
    }

    console.log("✅ Scroller found:", scrollEl);

    const animation = gsap.to(titleRef.current, {
      scale: 2.5,
      opacity: 0,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,  // outer container — this is what actually scrolls
        scroller: scrollEl,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
        markers: true,
      },
    });

    return () => {
      animation.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [scrollEl]);

  return (
    <div ref={containerRef} className="min-h-[200vh] w-full flex flex-col items-center">
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center text-center">
        <div className="text-2xl md:text-3xl lg:text-4xl font-light mb-4">
          WELCOME TO
        </div>
        <div ref={titleRef} className="text-6xl md:text-7xl lg:text-8xl font-bold">
          <DecryptedTextProps
            text="EMBED CLUB"
            sequential={true}
            speed={70}
            maxIterations={10}
            animateOn="view"
          />
        </div>
      </div>
    </div>
  );
}
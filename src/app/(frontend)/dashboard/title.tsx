"use client";

import React from "react";
import DecryptedTextProps from "@/components/DecryptedText";

export default function DashboardTitle() {
  return (
    <div className="font-montserrat text-center -translate-y-8">
      <div className="text-2xl md:text-3xl lg:text-4xl font-light mb-4">
        ELCOE TO
      </div>
      <div className="text-6xl md:text-7xl lg:text-8xl font-bold">
        <DecryptedTextProps
          text="EBED CLUB"
          sequential={true}
          speed={70}
          maxIterations={10}
          animateOn="view"
        />
      </div>
    </div>
  );
}

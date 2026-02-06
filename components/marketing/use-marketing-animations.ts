"use client";

import { useLayoutEffect } from "react";
import type { RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type RevealDirection = "up" | "left" | "right";

const revealDefaults = {
  duration: 0.85,
  ease: "power3.out",
};

export function useMarketingAnimations(scope: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    if (!scope.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      const heroItems = gsap.utils.toArray<HTMLElement>("[data-hero]");
      const revealItems = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      const marqueeTracks = gsap.utils.toArray<HTMLElement>("[data-marquee]");
      const floatItems = gsap.utils.toArray<HTMLElement>("[data-float]");

      if (prefersReducedMotion) {
        gsap.set([...heroItems, ...revealItems], {
          autoAlpha: 1,
          x: 0,
          y: 0,
        });
        return;
      }

      if (heroItems.length) {
        gsap.fromTo(
          heroItems,
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, stagger: 0.12, ...revealDefaults }
        );
      }

      revealItems.forEach((item) => {
        const direction = (item.dataset.reveal || "up") as RevealDirection;
        const distance = Number(item.dataset.distance || 24);
        const fromVars: gsap.TweenVars = { autoAlpha: 0 };

        if (direction === "left") {
          fromVars.x = -distance;
        } else if (direction === "right") {
          fromVars.x = distance;
        } else {
          fromVars.y = distance;
        }

        gsap.fromTo(
          item,
          fromVars,
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            scrollTrigger: {
              trigger: item,
              start: "top 85%",
            },
            ...revealDefaults,
          }
        );
      });

      marqueeTracks.forEach((track) => {
        const distance = track.scrollWidth / 2;
        const duration = Number(track.dataset.duration || 26);
        const direction = track.dataset.direction === "right" ? 1 : -1;

        gsap.fromTo(
          track,
          { x: direction === 1 ? -distance : 0 },
          {
            x: direction === 1 ? 0 : -distance,
            duration,
            ease: "none",
            repeat: -1,
          }
        );
      });

      if (floatItems.length) {
        gsap.to(floatItems, {
          y: -12,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          duration: 5,
          stagger: 0.6,
        });
      }
    }, scope);

    return () => ctx.revert();
  }, [scope]);
}

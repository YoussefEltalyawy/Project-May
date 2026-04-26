import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function getEntranceAnimationSpecs(isMobile: boolean = false) {
  return {
    from: {
      opacity: 0,
      y: isMobile ? 15 : 40,
      filter: "blur(8px)",
      willChange: "transform, opacity, filter",
    },
    to: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: isMobile ? 0.3 : 0.4,
      ease: "power2.out",
      // default stagger, but can be overridden
      stagger: 0.15,
      onComplete: function (this: gsap.core.Tween) {
        gsap.set(this.targets(), {
          clearProps: "filter",
          willChange: "auto",
        });
      },
    },
  };
}

export function animateEntrance(
  targets: gsap.TweenTarget,
  options: {
    isMobile?: boolean;
    stagger?: number;
    delay?: number;
    useScrollTrigger?: boolean;
    trigger?: gsap.DOMTarget;
  } = {}
) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const isMob = options.isMobile ?? isMobile;
  const specs = getEntranceAnimationSpecs(isMob);

  let scrollTriggerOptions: any = undefined;
  if (options.useScrollTrigger && options.trigger) {
    scrollTriggerOptions = {
      trigger: options.trigger,
      start: isMob ? "top center+=5%" : "top center+=15%",
    };
  }

  return gsap.fromTo(
    targets,
    specs.from,
    {
      ...specs.to,
      stagger: options.stagger ?? specs.to.stagger,
      delay: options.delay ?? 0,
      scrollTrigger: scrollTriggerOptions,
    }
  );
}

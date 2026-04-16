import { cn } from "@/lib/utils";

type HeroIllustrationProps = {
  className?: string;
  alt: string;
};


export function HeroIllustration({ className, alt }: HeroIllustrationProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG do Figma com PNG em base64
    <img
      src="/landing/hero.svg"
      alt={alt}
      width={584}
      height={584}
      decoding="async"
      fetchPriority="high"
      className={cn("block h-auto w-full", className)}
    />
  );
}

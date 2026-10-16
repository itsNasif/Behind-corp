import Image from "next/image";
export function BrandLogo({
  tone = "light",
  priority = false,
}: {
  tone?: "light" | "dark";
  priority?: boolean;
}) {
  return (
    <Image
      src={`/brand/logo-${tone}.jpg`}
      alt="behind"
      width={1280}
      height={426}
      preload={priority}
      sizes="(max-width: 600px) 140px, 180px"
      className={`brand-logo brand-logo-${tone}`}
    />
  );
}

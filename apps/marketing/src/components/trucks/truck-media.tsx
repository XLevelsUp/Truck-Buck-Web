import Image from "next/image";

import { cn } from "@truckbuck/ui/lib/utils";
import { illustrationKindFor, TruckIllustration } from "@truckbuck/ui/truck-illustration";

/**
 * A truck's photo/render in a fixed 4:3 frame (space is reserved before the
 * image loads: no CLS), served as AVIF/WebP by next/image. Until real photos
 * arrive (NFC-8) the class illustration fills the frame.
 */
export function TruckMedia({
  iconKey,
  imageUrl,
  imageAlt,
  sizes,
  priority = false,
  className,
}: {
  iconKey: string;
  imageUrl: string | null;
  imageAlt: string | null;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative grid aspect-[4/3] place-items-center overflow-hidden rounded-xl bg-primary-soft text-primary-soft-foreground",
        className,
      )}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={imageAlt ?? ""}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <TruckIllustration kind={illustrationKindFor(iconKey)} className="size-full" />
      )}
    </div>
  );
}

/** Inner media for <TruckCard>, whose frame already reserves the 4:3 box. */
export function TruckCardMedia({
  iconKey,
  imageUrl,
  imageAlt,
}: {
  iconKey: string;
  imageUrl: string | null;
  imageAlt: string | null;
}) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={imageAlt ?? ""}
        fill
        sizes="(min-width: 1024px) 22rem, (min-width: 768px) 45vw, 90vw"
        className="object-cover"
      />
    );
  }
  // Wrapped: the card sizes bare <svg> children as icons.
  return (
    <div className="absolute inset-0">
      <TruckIllustration kind={illustrationKindFor(iconKey)} className="size-full" />
    </div>
  );
}

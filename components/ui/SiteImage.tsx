import Image from 'next/image';

// Renders a captured screenshot (object-cover) when `src` is set, otherwise a
// clean labelled placeholder matching the design's drop-slot aesthetic.
// Parent must be positioned + sized (aspect box) — the image uses `fill`.
export default function SiteImage({
  src,
  alt = '',
  label,
}: {
  src?: string;
  alt?: string;
  label: string;
}) {
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-surface">
        <span
          dir="ltr"
          className="px-4 text-center font-mono text-xs uppercase tracking-[0.2em] text-faint"
        >
          {label}
        </span>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 920px) 100vw, 50vw"
      className="object-cover"
    />
  );
}

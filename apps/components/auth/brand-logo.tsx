import { cn } from '@/lib/utils'

/**
 * A geometric, pixel-band brand mark inspired by Mistral's sunset flag logo.
 * Built from a fixed grid of warm-toned cells (yellow -> amber -> orange -> red).
 */
export function BrandLogo({ className }: { className?: string }) {
  // 4x4 grid. `null` cells are transparent to create the stepped silhouette.
  const rows: (string | null)[][] = [
    ['bg-[#ffd800]', 'bg-[#ffd800]', 'bg-[#ffd800]', 'bg-[#ffd800]'],
    ['bg-[#ffaf00]', null, null, 'bg-[#ffaf00]'],
    ['bg-[#ff8205]', null, null, 'bg-[#ff8205]'],
    ['bg-[#fa520f]', 'bg-[#fa520f]', null, 'bg-[#e10500]'],
  ]

  return (
    <span
      aria-hidden="true"
      className={cn('grid aspect-square grid-cols-4 grid-rows-4', className)}
    >
      {rows.flatMap((row, r) =>
        row.map((cell, c) => (
          <span
            key={`${r}-${c}`}
            className={cn('block h-full w-full', cell ?? 'bg-transparent')}
          />
        )),
      )}
    </span>
  )
}

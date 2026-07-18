import { useState } from 'react';
import { spriteAniUrl, spriteGen5Url, POKEBALL_PLACEHOLDER } from '../lib/pokepaste';

interface SpriteProps {
  species: string;
  className?: string;
  alt?: string;
}

export function Sprite({ species, className, alt }: SpriteProps) {
  const [stage, setStage] = useState(0);
  const src =
    stage === 0
      ? spriteAniUrl(species)
      : stage === 1
        ? spriteGen5Url(species)
        : POKEBALL_PLACEHOLDER;

  return (
    <img
      src={src}
      alt={alt ?? species}
      loading="lazy"
      className={className}
      onError={() => setStage((s) => Math.min(s + 1, 2))}
    />
  );
}

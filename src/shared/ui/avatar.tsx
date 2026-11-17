"use client";

import { useState } from "react";
import { cn } from "./cn";

type AvatarProps = {
  name: string;
  // Foto de perfil do Google; sem ela (ou se não carregar), vale a inicial do nome.
  image: string | null;
  className?: string;
};

export function avatarInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

// Decorativo (aria-hidden): quem usa o avatar já dá o nome por texto ou aria-label.
export function Avatar({ name, image, className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const base = cn(
    "grid shrink-0 place-items-center overflow-hidden rounded-full bg-honey-light font-bold text-honey-light-foreground ring-2 ring-honey ring-inset",
    className,
  );

  if (image && !failed) {
    return (
      <span aria-hidden="true" className={base}>
        {/* O Google recusa a foto quando recebe o Referer de outro site. */}
        <img
          src={image}
          alt=""
          referrerPolicy="no-referrer"
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }
  return (
    <span aria-hidden="true" className={base}>
      {avatarInitial(name)}
    </span>
  );
}

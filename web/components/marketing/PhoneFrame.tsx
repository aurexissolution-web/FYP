import Image from "next/image";
import type { ReactNode } from "react";

/*
  The device bezel, screen and app header. Content below the header is
  whatever the caller renders — the static hero mock-up and the auto-playing
  demo share this one frame so they can never look like two different apps.
*/
export function PhoneFrame({
  langChip,
  children,
  className = "",
}: {
  langChip: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`w-full max-w-[340px] ${className}`}>
      <div className="rounded-[2.5rem] bg-ink p-2.5 shadow-[0_30px_60px_-20px_rgba(46,42,58,0.5)]">
        <div className="flex flex-col overflow-hidden rounded-[2rem] bg-cream">
          <div className="flex items-center gap-2 border-b border-outline/60 bg-white px-4 py-3.5">
            <Image
              src="/logo-icon.png"
              alt=""
              width={26}
              height={26}
              className="rounded-[7px]"
            />
            <span className="text-[15px] font-extrabold text-ink">EmoBuddy</span>
            <span className="ml-auto rounded-full bg-sage-tint px-2.5 py-1 text-[10px] font-bold text-sage-deep">
              {langChip}
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

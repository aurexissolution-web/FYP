import { Mic, CircleCheck } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";
import { PhoneFrame } from "./PhoneFrame";

export const CHECK_TINTS = ["text-sage-deep", "text-blue", "text-coral-deep"];

/* Static screen for the hero: one completed check-in. */
export function PhoneMockup({
  phone,
  langChip,
}: {
  phone: Dictionary["home"]["phone"];
  langChip: string;
}) {
  return (
    <PhoneFrame langChip={langChip}>
      {/* Conversation */}
      <div className="flex flex-col gap-2.5 px-3.5 py-4">
        <div className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-indigo-tint px-3.5 py-2.5 text-[13px] leading-snug text-ink">
          {phone.userMsg}
        </div>
        <div className="max-w-[85%] self-start rounded-2xl rounded-bl-md border border-outline/70 bg-white px-3.5 py-2.5 text-[13px] leading-snug text-ink">
          {phone.aiMsg}
        </div>

        {/* Self-care plan card */}
        <div className="mt-1 flex flex-col gap-2 rounded-2xl bg-sage-tint px-3.5 py-3">
          <span className="text-[12px] font-extrabold text-sage-deep">
            {phone.planTitle}
          </span>
          {phone.planDays.map((day, i) => (
            <div key={day} className="flex items-start gap-2">
              <CircleCheck
                size={14}
                className={`${CHECK_TINTS[i]} mt-0.5 shrink-0`}
              />
              <span className="text-[12px] leading-snug text-ink">{day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Composer */}
      <div className="mt-auto flex items-center gap-2 border-t border-outline/60 bg-white px-3.5 py-3">
        <div className="flex-1 rounded-full bg-cream-alt px-3.5 py-2.5 text-[12px] text-ink-faint">
          {phone.inputPlaceholder}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo text-white">
          <Mic size={16} />
        </div>
      </div>
    </PhoneFrame>
  );
}

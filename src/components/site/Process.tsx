import { CalendarCheck, Clapperboard, MessageSquareText, Send } from "lucide-react";
import { SplitHeading } from "@/components/ui/SplitHeading";

const STEPS = [
  { icon: MessageSquareText, title: "Tell us your story", text: "Send the booking form or message us. We learn the people, the place and the feeling you want to keep." },
  { icon: CalendarCheck, title: "Lock the date", text: "A 50% deposit reserves your date. We share a shot plan and timeline tailored to your day." },
  { icon: Clapperboard, title: "We shoot", text: "A calm, unobtrusive crew captures the real moments — cinema cameras, gimbals and drones as needed." },
  { icon: Send, title: "Edit & deliver", text: "Colour-graded, sound-designed and delivered in a private gallery, ready to share and relive." },
];

export function Process() {
  return (
    <section id="process" className="relative py-[clamp(80px,12vw,180px)]">
      <div className="container-x">
        <div className="mb-14">
          <div className="label mb-5 flex items-center gap-3" data-reveal>
            <span className="text-signal">04</span> Process
          </div>
          <SplitHeading className="text-[clamp(40px,7vw,104px)] font-black uppercase leading-[0.9] tracking-[-0.04em] text-silver-grad">
            From hello to final cut.
          </SplitHeading>
        </div>
        <ol data-stagger="0.1" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 md:gap-5">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="bento-card flex min-h-[320px] flex-col justify-between p-7">
              <div className="flex items-start justify-between">
                <span className="icon-chip">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="font-mono text-5xl font-black text-white/10">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase leading-none tracking-tight">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mute">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

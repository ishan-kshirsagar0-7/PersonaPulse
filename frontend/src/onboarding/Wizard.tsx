import { useState } from "react";
import BasicInfo from "./steps/BasicInfo";
import SummaryTags from "./steps/SummaryTags";
import QuickVibe from "./steps/QuickVibe";
import DreamConversation from "./steps/DreamConversation";
import ReviewSubmit from "./steps/ReviewSubmit";

export interface SharedStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function Wizard() {
  const steps = [
    BasicInfo,
    SummaryTags,
    QuickVibe,
    DreamConversation,
    ReviewSubmit,
  ] as const;

  const [idx, setIdx] = useState(0);
  const isLast = idx === steps.length - 1;

  const next = () => setIdx((i) => Math.min(i + 1, steps.length - 1));
  const back = () => setIdx((i) => Math.max(i - 1, 0));
  const reset = () => setIdx(0);

  const Step = steps[idx] as React.ComponentType<any>;

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12 text-white bg-black"
      style={{
        backgroundImage: "url('/noise.png')",
        backgroundRepeat: "repeat",
      }}
    >
      <section
        className={`rounded-3xl backdrop-blur p-10 
          ${
            idx === 2 
              ? "w-full max-w-7xl" 
              : idx === 3 
                ? "w-full max-w-2xl min-h-[32rem]" 
                : "w-full max-w-lg"
          } 
          bg-[rgba(18,18,20,.45)] transition-all duration-300`}
      >
        {/* Progress Dots */}
        <div className="mb-6 flex justify-center gap-2 text-xs">
          <span className="mr-3 text-zinc-400">
            Step {idx + 1} of {steps.length}
          </span>
          {steps.map((_, i) => (
            <span
              key={i}
              className={`size-2 rounded-full ${
                i <= idx ? "bg-purple-400" : "bg-zinc-600"
              }`}
            />
          ))}
        </div>

        {/* Active Step */}
        <Step
          onNext={isLast ? reset : next}
          onBack={back}
          {...(isLast && { isLast: true, onFinish: reset })}
        />
      </section>
    </div>
  );
}

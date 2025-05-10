import { useState } from "react";
import { vibeCards } from "@/data/vibeCards";
import { Button } from "@/components/ui/button";

interface Props {
  onNext: () => void;
  onBack: () => void;
  isLast: boolean;
}

export default function VibeCards({ onNext, onBack }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});

  const card = vibeCards[index];

  const swipe = (choice: boolean) => {
    setAnswers({ ...answers, [card.trait]: choice });
    if (index + 1 < vibeCards.length) setIndex(index + 1);
  };

  const finish = () => {
    console.table(answers);
    onNext();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-center text-xl font-semibold">
        Quick vibe check ({index + 1}/20)
      </h2>

      <div className="rounded-xl bg-black/40 p-6 text-center">
        <p className="mb-6 text-sm text-zinc-200">{card.left}</p>

        <div className="flex justify-center gap-8">
          <Button
            onClick={() => swipe(false)}
            variant="outline"
            size="lg"
            className="w-24"
          >
            ❌
          </Button>
          <Button
            onClick={() => swipe(true)}
            variant="brandBlue"
            size="lg"
            className="w-24"
          >
            ✔
          </Button>
        </div>

        <p className="mt-6 text-sm text-zinc-200">{card.right}</p>
      </div>

      {index === vibeCards.length - 1 && (
        <Button onClick={finish} variant="brandBlue" className="mx-auto mt-4">
          Done →
        </Button>
      )}

      <div className="mt-4">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
      </div>
    </div>
  );
}
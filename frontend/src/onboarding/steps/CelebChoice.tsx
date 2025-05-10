import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  onNext: () => void;
  onBack: () => void;
  isLast: boolean;
}

export default function CelebChoice({ onNext, onBack }: Props) {
  const [celeb, setCeleb] = useState("");
  const [reason, setReason] = useState("");

  const submit = () => {
    console.log({ celeb, reason });
    onNext();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-center text-xl font-semibold">
        Dream conversation
      </h2>

      <input
        placeholder="Which public figure would you chat with?"
        value={celeb}
        onChange={(e) => setCeleb(e.target.value)}
        className="w-full rounded-md bg-black/40 px-4 py-3 text-sm outline-none"
      />

      <textarea
        rows={3}
        placeholder="Why them? What would you talk about?"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full resize-none rounded-md bg-black/40 p-4 text-sm outline-none"
      />

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button variant="brandBlue" onClick={submit}>
          Next →
        </Button>
      </div>
    </div>
  );
}

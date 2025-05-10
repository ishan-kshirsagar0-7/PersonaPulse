import { useState } from "react";
import { Button } from "@/components/ui/button";
import TagPicker from "@/components/TagPicker";
import TypewriterPlaceholder from "@/components/ui/TypewriterPlaceholder";
import { SharedStepProps } from "../Wizard";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

const PLACEHOLDERS = [
  "Coffee-powered full-stack dev ☕️",
  "Indie game composer with a cat obsession 🐈",
  "Poet, pianist & part-time philosopher",
  "Building AI that doesn't steal jobs 🤖",
  "Quirky, nerdy & a bit of a dreamer",
  "Tech enthusiast with a love for nature 🌍",
  "Aspiring chef with a passion for coding 🍳",
  "Bookworm & part-time gamer 🎮",
];

export default function SummaryTags({ onNext, onBack }: SharedStepProps) {
  const { session } = useAuth();
  const [line, setLine] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const handleNext = async () => {
    const { error } = await supabase
      .from('persona_profiles')
      .upsert({
        user_id: session?.user.id,
        summary: line,
        interests: tags
      }, { onConflict: 'user_id' });

    if (error) {
      console.error("Failed to save summary & tags:", error);
    } else {
      console.log("Summary & interests saved!");
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-center text-xl font-semibold">Describe yourself with one line</h2>
      <div className="relative">
        <textarea rows={2} maxLength={160} value={line} onChange={(e) => setLine(e.target.value)} className="h-24 w-full resize-none rounded-md bg-black/40 p-4 text-sm text-white outline-none" placeholder="" />
        {line === "" && (
          <div className="pointer-events-none absolute top-0 left-0 h-24 w-full p-4 text-sm text-zinc-500">
            <TypewriterPlaceholder samples={PLACEHOLDERS} />
          </div>
        )}
      </div>
      <TagPicker value={tags} onChange={setTags} />
      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <Button variant="brandBlue" onClick={handleNext} disabled={!line}>Next →</Button>
      </div>
    </div>
  );
}
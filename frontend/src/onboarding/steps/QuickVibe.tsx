import { useState } from "react";
import { Button } from "@/components/ui/button";
import SwipeCard from "@/components/SwipeCard";
import { vibeCards } from "@/data/vibeCards";
import { SharedStepProps } from "../Wizard";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

export default function QuickVibe({ onNext, onBack }: SharedStepProps) {
  const { session } = useAuth();
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});

  const currentCard = vibeCards[index];

  const handleResponse = async (accepted: boolean) => {
    const chosenOption = accepted ? currentCard.right : currentCard.left;

    const updatedResponses = {
      ...responses,
      [currentCard.trait]: chosenOption 
    };

    setResponses(updatedResponses);

    if (index + 1 < vibeCards.length) {
      setIndex(index + 1);
    } else {
      console.log("Final responses:", updatedResponses);

      const { error } = await supabase
        .from('persona_profiles')
        .upsert({
          user_id: session?.user.id,
          vibe_responses: updatedResponses
        }, { onConflict: 'user_id' });

      if (error) {
        console.error("Failed to save vibe responses:", error);
      } else {
        console.log("Vibe responses saved to DB!");
      }

      onNext();
    }
  };

  // const leftImg = `/src/assets/vibeOptions/${currentCard.id}-left.png`;
  // const rightImg = `/src/assets/vibeOptions/${currentCard.id}-right.png`;
  const leftImg = `/vibeOptions/${currentCard.id}-left.png`;
  const rightImg = `/vibeOptions/${currentCard.id}-right.png`;

  return (
    <div className="flex flex-col items-center space-y-12">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Quick vibe check ({index + 1}/20)</h2>
        <p className="text-sm text-zinc-400">
          Swipe the card towards the side you resonate with the most.
        </p>
      </div>

      {/* Carousel Layout */}
      <div className="flex w-full justify-center items-center gap-20 px-16">
        {/* Left Option */}
        <div
          onClick={() => handleResponse(false)}
          className="w-56 h-60 flex flex-col items-center justify-between rounded-2xl bg-zinc-800/50 p-3 text-white backdrop-blur hover:scale-105 transition cursor-pointer"
        >
          <img src={leftImg} alt="Left Option" className="h-40 object-contain mt-2" />
          <span className="text-center text-sm font-medium mb-2">{currentCard.left}</span>
        </div>

        {/* Center Swipeable Trait */}
        <SwipeCard
          trait={currentCard.trait}
          onSwipeLeft={() => handleResponse(false)}
          onSwipeRight={() => handleResponse(true)}
        />

        {/* Right Option */}
        <div
          onClick={() => handleResponse(true)}
          className="w-56 h-60 flex flex-col items-center justify-between rounded-2xl bg-zinc-800/50 p-3 text-white backdrop-blur hover:scale-105 transition cursor-pointer"
        >
          <img src={rightImg} alt="Right Option" className="h-40 object-contain mt-2" />
          <span className="text-center text-sm font-medium mb-2">{currentCard.right}</span>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex w-full max-w-4xl justify-between px-8">
        <Button variant="outline" size="lg" onClick={onBack}>
          ← Back
        </Button>
      </div>
    </div>
  );
}
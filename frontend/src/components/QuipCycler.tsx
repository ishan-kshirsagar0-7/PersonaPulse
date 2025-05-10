import { useEffect, useState } from "react";

const quips = [
  "Almost there...",
  "Sprinkling life into your AI ✨",
  "Animating your personality 👾",
  "Setting up your vibe...",
  "Whipping up a twin 🤖",
  "Loading brain... please wait 🧠",
];

export default function QuipCycler() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % quips.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-white text-xl font-semibold pl-6">
      {quips[index]}
    </div>
  );
}
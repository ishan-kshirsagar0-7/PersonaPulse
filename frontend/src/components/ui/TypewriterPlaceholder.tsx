import { useEffect, useRef, useState } from "react";

interface Props {
  samples: string[];
  typingMs?: number;
  pauseMs?: number;
}

export default function TypewriterPlaceholder({
  samples,
  typingMs = 60,
  pauseMs = 1200,
}: Props) {
  const [idx, setIdx] = useState(0);
  const [display, setDisplay] = useState("");
  const forward = useRef(true);

  useEffect(() => {
    const full = samples[idx];
    let i = 0;
    const interval = setInterval(() => {
      if (forward.current) {
        i += 1;
        setDisplay(full.slice(0, i));
        if (i === full.length) {
          forward.current = false;
          setTimeout(() => {}, pauseMs);
        }
      } else {
        i -= 1;
        setDisplay(full.slice(0, i));
        if (i === 0) {
          forward.current = true;
          setIdx((n) => (n + 1) % samples.length);
        }
      }
    }, typingMs);
    return () => clearInterval(interval);
  }, [idx, samples, typingMs, pauseMs]);

  return <>{display}</>;
}
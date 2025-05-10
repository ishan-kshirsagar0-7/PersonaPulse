import { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";

interface Props {
  trait: string;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export default function SwipeCard({ trait, onSwipeLeft, onSwipeRight }: Props) {
  const controls = useAnimation();

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x > 80) {
      controls.start({ x: 600, opacity: 0 }).then(onSwipeRight);
    } else if (info.offset.x < -80) {
      controls.start({ x: -600, opacity: 0 }).then(onSwipeLeft);
    } else {
      controls.start({ x: 0 });
    }
  };

  useEffect(() => {
    controls.set({ x: 0, opacity: 1 });
  }, [trait, controls]);

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.25}
      onDragEnd={handleDragEnd}
      animate={controls}
      whileTap={{ scale: 0.98 }}
      className="w-96 h-60 flex items-center justify-center rounded-3xl 
                 bg-gradient-to-r from-purple-700/30 to-indigo-700/30
                 text-center text-2xl font-semibold text-white 
                 shadow-2xl backdrop-blur-lg border border-purple-500/20 transition"
    >
      {trait}
    </motion.div>
  );
}
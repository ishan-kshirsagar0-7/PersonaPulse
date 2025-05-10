import { useState } from "react";

export interface TagPickerProps {
  value: string[];
  onChange: (newTags: string[]) => void;
  placeholder?: string;
}

const seedTags = [
  "Tech",
  "Gaming",
  "Music",
  "Fitness",
  "Travel",
  "Art",
  "Science",
  "Literature",
  "Food",
  "Fashion",
  "Sports",
  "Finance",
  "Cinema",
  "Education",
  "Entrepreneurship",
  "Wellness"
] as const;

const related: Record<string, string[]> = {
  Tech: ["AI", "ML", "Robotics", "WebDev", "Crypto", "Gadgets", "Programming", "Blockchain"],
  Gaming: ["Esports", "Indie Games", "Streaming", "Game Dev"],
  Music: ["Jazz", "Rock", "EDM", "Classical", "Hip-Hop", "Blues"],
  Fitness: ["Gym", "Yoga", "Nutrition", "Bodybuilding", "Running"],
  Travel: ["Backpacking", "Hiking", "Solo Travel", "Cultural Trips"],
  Art: ["Photography", "Design", "Painting", "Illustration", "Digital Art"],
  Science: ["Astronomy", "Physics", "Biotech", "Environment"],
  Literature: ["Reading", "Writing", "Poetry", "Blogging", "Fiction", "Non-fiction"],
  Food: ["Cooking", "Baking", "Vegan", "Gourmet", "Street Food"],
  Fashion: ["Design", "Trends", "Streetwear", "Sustainable Fashion"],
  Sports: ["Football", "Basketball", "Tennis", "Cricket", "Esports"],
  Finance: ["Investing", "Crypto", "Stock Market", "NFTs"],
  Cinema: ["Film", "Directing", "Screenwriting", "Anime", "Manga"],
  Education: ["E-learning", "EdTech", "Teaching", "Research"],
  Entrepreneurship: ["Startups", "Innovation", "Venture Capital", "Leadership"],
  Wellness: ["Meditation", "Mindfulness", "Self-care", "Mental Health"]
};

export default function TagPicker({
  value,
  onChange,
  placeholder = "Pick your interests, or simply type them out…",
}: TagPickerProps) {
  const [query, setQuery] = useState("");

  const available = Array.from(
    new Set(
      [...seedTags, ...value.flatMap((t) => related[t] ?? [])].filter(
        (t) => !value.includes(t)
      )
    )
  ).filter((t) => t.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <input
        className="mb-3 w-full rounded-md bg-zinc-800/60 px-4 py-2 text-sm text-white"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        {available.map((tag) => (
          <button
            key={tag}
            onClick={() => onChange([...value, tag])}
            className="rounded-full bg-zinc-700/60 px-3 py-1 text-xs text-zinc-300
                       hover:bg-purple-600/40 hover:text-white"
          >
            {tag}
          </button>
        ))}

        {value.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-purple-600/70 px-3 py-1 text-xs text-white"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
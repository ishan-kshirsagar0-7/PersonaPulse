export interface VibeCard {
    id: string;  
    trait: string;
    left: string;
    right: string;
  }
  
  export const vibeCards: VibeCard[] = [
    { id: "social_preference",    trait: "What kind of social animal are you?",    left: "Certified Couch Potato.",      right: "The life of every party!" },
    { id: "openness",           trait: "How do you feel about surprises?",           left: "Nah, I prefer my routines.",       right: "Hit me with the unexpected!" },
    { id: "conscientiousness",       trait: "How's your vibe with planning?",       left: "Winging it is my strategy.",      right: "My to-do list has a to-do list" },
    { id: "agreeableness",        trait: "When debates happen, you're...?",        left: "Keeping the peace, always.",             right: "Stating my case, no matter what." },
    { id: "neuroticism",            trait: "How often do you find yourself overthinking?", left: "Not much, I go with the flow.",        right: "I rehearse arguments in the shower." },
    { id: "leadership",        trait: "In a group project, you are...?",        left: "Happy to follow along.",             right: "Born to be the leader." },
    { id: "risk_tolerance",         trait: "How do you play the game of life?",         left: "Safe moves, steady wins",     right: "All in, risk taker for sure." },
    { id: "goals",       trait: "What's more your style?",       left: "Enjoying the ride, go with the flow.",                 right: "Focused, locked in, eyes on the prize." },
    { id: "empathy", trait: "When a friend's feeling down, you...?", left: "Awkward pat on the back.",             right: "I feel their feelings." },
    { id: "conflict_resolution",            trait: "Drama pops up — you?",            left: "Exit stage left - none of my concern.",         right: "Intervene, and sort it out." },
    { id: "trust",             trait: "New people in your life — what's your default?",             left: "They gotta earn my trust.",        right: "Trust until proven shady." },
    { id: "artistic",     trait: "How artsy are you in general?",     left: "Stick figures are my limit.",        right: "Creative juices flowing 24/7 in my brain." },
    { id: "learning_style",        trait: "How do you learn best?",        left: "Give me an organized manual with clear instructions.",    right: "Let me experiment and figure it out." },
    { id: "morality",           trait: "Rules are..?",           left: ".. there for a reason, and I follow them.",           right: ".. more like guidelines, and I follow them only when necessary." },
    { id: "cultural",         trait: "Trying unknown food from another country?",         left: "I'll pass and have my usual, thanks.",        right: "Bring it on! I like exploring new stuff." },
    { id: "self-esteem",            trait: "Rate yourself out of a 10.",            left: "Between 1 and 5.",         right: "Between 6 and 10." },
    { id: "adaptability",          trait: "When plans change last minute...?",          left: "Panic mode activated.",         right: "No worries, I'll adjust!" },
    { id: "ambition",          trait: "How big do you dream?",          left: "I mostly set realistic, achievable goals for myself.",            right: "Sky's the limit, I keep dreaming higher even if I don't land there." },
    { id: "pets",            trait: "Pick your side, if you just had to choose one.",            left: "Cats",             right: "Dogs" },
    { id: "time_management",           trait: "How do you deal with deadlines?",           left: "Thrive at the last minute.",             right: "Done and dusted early." },
  ];
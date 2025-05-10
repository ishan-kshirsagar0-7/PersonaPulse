import React from "react";

const DEFAULT_AVATAR_URL = "/default-avatar.png";

export interface UserSuggestion {
  user_id: string;
  name: string;
  pfp_url?: string | null;
  summary?: string | null;
}

interface UserSuggestionItemProps {
  suggestion: UserSuggestion;
  onClick: (suggestion: UserSuggestion) => void;
}

const UserSuggestionItem: React.FC<UserSuggestionItemProps> = ({
  suggestion,
  onClick,
}) => {
  return (
    <button
      onClick={() => onClick(suggestion)}
      className="w-full flex items-center p-3 hover:bg-zinc-700/50 rounded-md transition-colors duration-150 text-left"
    >
      <img
        src={suggestion.pfp_url || DEFAULT_AVATAR_URL}
        alt={`${suggestion.name}'s avatar`}
        className="w-10 h-10 rounded-full object-cover mr-4 border-2 border-zinc-600"
        onError={(e) => {
          (e.target as HTMLImageElement).src = DEFAULT_AVATAR_URL;
        }}
      />
      <div className="flex-grow">
        <p className="font-semibold text-white text-sm">{suggestion.name}</p>
        {suggestion.summary && (
          <p className="text-xs text-zinc-400 truncate">
            {suggestion.summary}
          </p>
        )}
      </div>
    </button>
  );
};

export default UserSuggestionItem;
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import UserSuggestionItem, { UserSuggestion } from "@/components/UserSuggestionItem";
import Spinner from "@/components/Spinner";
import "@/styles/Dashboard.css";

function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
}

export default function Dashboard() {
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const [personaName, setPersonaName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState<boolean>(false);
  const [showDreamChatOption, setShowDreamChatOption] = useState<boolean>(false);
  const [typedNameForDreamChat, setTypedNameForDreamChat] = useState<string>("");

  useEffect(() => {
    if (!session?.user?.id) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("persona_profiles").select("name").eq("user_id", session.user.id).maybeSingle();
        if (error) throw error;
        setPersonaName(data?.name || session.user.email?.split('@')[0] || "there");
      } catch (error) {
        console.error("Error fetching persona name for dashboard:", error);
        setPersonaName(session.user.email?.split('@')[0] || "there");
      }
    })();
  }, [session]);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 1) {
      setSuggestions([]); setShowDreamChatOption(false); return;
    }
    setIsLoadingSearch(true); setShowDreamChatOption(false);
    setTypedNameForDreamChat(query.trim());
    try {
      const response = await fetch(`https://ppulse-backend.vercel.app/search_users?name_query=${encodeURIComponent(query.trim())}`);
      if (!response.ok) throw new Error("Failed to fetch suggestions");
      const data: UserSuggestion[] = await response.json();
      setSuggestions(data);
      if (data.length === 0 && query.trim().length > 0) setShowDreamChatOption(true);
    } catch (error) {
      console.error("Error fetching search suggestions:", error);
      setSuggestions([]); if (query.trim().length > 0) setShowDreamChatOption(true);
    } finally { setIsLoadingSearch(false); }
  }, []);

  const debouncedFetchSuggestions = useCallback(debounce(fetchSuggestions, 300), [fetchSuggestions]);

  useEffect(() => { debouncedFetchSuggestions(searchQuery); }, [searchQuery, debouncedFetchSuggestions]);

  const handleSuggestionClick = async (suggestedUser: UserSuggestion) => {
    if (!session?.user?.id) return;
    setSearchQuery(""); setSuggestions([]); setShowDreamChatOption(false);
    navigate("/loading", { replace: true });
    try {
      const res = await fetch("https://ppulse-backend.vercel.app/generate_ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viewer_id: session.user.id, profile_owner_id: suggestedUser.user_id,
          is_chat_empty: true, onboarding_mode: false, chat_history: [],
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({detail: "Failed to start chat"}));
        throw new Error(errData.detail);
      }
      const data = await res.json();

      navigate("/chat", { replace: true, state: {
          viewerId: session.user.id, profileOwnerId: suggestedUser.user_id,
          initialMessage: data.bot_response,
          fetchSidebar: true,
          onboardingModeContext: false, isDreamChat: false,
          chatApiEndpoint: "/generate_ai",
      }});
    } catch (error) { console.error("Error starting chat with user's bot:", error); alert("Error: " + (error as Error).message); navigate("/dashboard", { replace: true }); }
  };

  const handleDreamChatClick = async () => {
    if (!session?.user?.id || !typedNameForDreamChat) return;
    const dreamPersona = typedNameForDreamChat;
    setSearchQuery(""); setSuggestions([]); setShowDreamChatOption(false);
    navigate("/loading", { replace: true });
    try {
      const res = await fetch("https://ppulse-backend.vercel.app/dashboard_dream_chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viewer_user_id: session.user.id, 
          dream_persona_name: dreamPersona, 
          is_chat_empty: true, chat_history: [],
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({detail: "Failed to start dream chat"}));
        throw new Error(errData.detail);
      }
      const data = await res.json();

      navigate("/chat", { replace: true, state: {
          viewerId: session.user.id,
          profileOwnerId: `DREAM-${dreamPersona.replace(/\s+/g, "-").toLowerCase()}`, 
          initialMessage: data.bot_response,
          fetchSidebar: false,
          onboardingModeContext: false, isDreamChat: true,
          dreamPersonaName: dreamPersona,
          ownerPfpForDreamChat: data.bot_pfp || null,
          chatApiEndpoint: "/dashboard_dream_chat",
      }});
    } catch (error) { console.error("Error starting dream chat:", error); alert("Error: " + (error as Error).message); navigate("/dashboard", { replace: true }); }
  };

  return (
    <div className="dashboard-bg">
      <div className="dashboard-container">
        <h1 className="dashboard-title"> Welcome, <span className="dashboard-name">{personaName}</span>! </h1>
        <h2 className="dashboard-subtitle"> Who would you like to chat with today? </h2>
        <div className="dashboard-search-wrapper">
          <input type="text" className="dashboard-search-input" placeholder="Enter a name or persona..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        {(searchQuery.trim().length > 0 || isLoadingSearch) && (isLoadingSearch || suggestions.length > 0 || showDreamChatOption) && (
          <div className="mt-3 w-full bg-zinc-800/60 backdrop-blur-sm rounded-lg shadow-lg p-2 max-h-72 overflow-y-auto">
            {isLoadingSearch && ( <div className="flex justify-center items-center p-4"> <Spinner /> <span className="ml-3 text-zinc-300 text-sm">Searching...</span> </div> )}
            {!isLoadingSearch && suggestions.length > 0 && suggestions.map((user) => ( <UserSuggestionItem key={user.user_id} suggestion={user} onClick={handleSuggestionClick} /> ))}
            {!isLoadingSearch && suggestions.length === 0 && showDreamChatOption && typedNameForDreamChat && (
              <div className="p-4 text-center text-zinc-300">
                <p className="mb-3 text-sm"> No user named "{typedNameForDreamChat}" found on PersonaPulse. </p>
                <button onClick={handleDreamChatClick} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-sm font-semibold transition-colors" > Chat with an AI version of {typedNameForDreamChat} instead? </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
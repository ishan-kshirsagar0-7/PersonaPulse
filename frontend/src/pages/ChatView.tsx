import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReactMarkdown, { Options as ReactMarkdownOptions } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@/context/AuthContext";
import Spinner from "@/components/Spinner";
import { LOAD_QUIPS } from "@/lib/quips";
import { FaBars, FaUndo, FaPaperPlane } from "react-icons/fa";
import "@/styles/ChatView.css";
import { supabase } from "@/lib/supabaseClient";

type Message = { sender: "you" | "other_person"; text: string };

interface LocStateWithInitial {
  viewerId: string;
  profileOwnerId: string; 
  initialMessage?: string | null;
  fetchSidebar?: boolean;
  onboardingModeContext?: boolean;
  apiError?: boolean;
  errorMessage?: string;
  isDreamChat?: boolean;
  dreamPersonaName?: string;
  ownerPfpForDreamChat?: string | null;
  chatApiEndpoint?: "/generate_ai" | "/chat" | "/dashboard_dream_chat"; 
}

const DEFAULT_AVATAR_URL = "/default-avatar.png";
const remarkPluginsList: ReactMarkdownOptions['remarkPlugins'] = [remarkGfm];

export default function ChatView() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();

  const {
    viewerId: routeViewerId,
    profileOwnerId: routeProfileOwnerId,
    initialMessage: routeInitialMessage,
    fetchSidebar: routeFetchSidebar = false,
    onboardingModeContext: routeOnboardingModeContext = false,
    apiError: routeApiError = false,
    errorMessage: routeErrorMessage,
    isDreamChat: routeIsDreamChat = false,
    dreamPersonaName: routeDreamPersonaName,
    ownerPfpForDreamChat: routeOwnerPfpForDreamChat,
    chatApiEndpoint: routeChatApiEndpoint = "/generate_ai", 
  } = (location.state as LocStateWithInitial) || {};

  const [messages, setMessages] = useState<Message[]>([]);
  const [sidebarContent, setSidebarContent] = useState<string | null>("Loading sidebar details...");
  const [chatStarted, setChatStarted] = useState(false);
  const [loading, setLoading] = useState(false); 
  const [loadingSidebar, setLoadingSidebar] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentQuip, setCurrentQuip] = useState(LOAD_QUIPS[0]);
  const initialSetupKey = useRef<string | null>(null);

  const [viewerPfp, setViewerPfp] = useState<string>(DEFAULT_AVATAR_URL);
  const [ownerPfp, setOwnerPfp] = useState<string>(DEFAULT_AVATAR_URL);
  const [ownerName, setOwnerName] = useState<string>("Chatbot");

  useEffect(() => { 
    setViewerPfp(session?.user?.user_metadata?.avatar_url || session?.user?.user_metadata?.picture || DEFAULT_AVATAR_URL);
  }, [session]);

  useEffect(() => { 
    if (!routeProfileOwnerId) return;
    if (routeIsDreamChat) {
      setOwnerName(routeDreamPersonaName || "AI Persona");
      setOwnerPfp(routeOwnerPfpForDreamChat || DEFAULT_AVATAR_URL);
    } else if (routeProfileOwnerId === session?.user?.id) {
      setOwnerPfp(viewerPfp); 
      setOwnerName(session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "Your AI");
    } else { 
      (async () => {
        try {
          const { data, error } = await supabase.from("persona_profiles").select("pfp_url, name")
            .eq("user_id", routeProfileOwnerId).single();
          if (error) throw error;
          setOwnerPfp(data?.pfp_url || DEFAULT_AVATAR_URL);
          setOwnerName(data?.name || "AI Persona");
        } catch (error) { console.error("Error fetching owner PFP/name:", error); }
      })();
    }
  }, [routeProfileOwnerId, session, viewerPfp, routeIsDreamChat, routeDreamPersonaName, routeOwnerPfpForDreamChat]);

  useEffect(() => { 
    const currentKey = location.key + (routeProfileOwnerId || "no-owner") + (routeViewerId || "no-viewer") + (routeIsDreamChat ? `-dream-${routeDreamPersonaName}` : "-userbot");
    if (initialSetupKey.current === currentKey) return;

    setMessages([]); setSidebarContent("Loading sidebar details..."); setChatStarted(false);
    if (!routeViewerId || !routeProfileOwnerId) { navigate("/dashboard", { replace: true }); return; }
    
    if (routeApiError) { setSidebarContent(`Error: ${routeErrorMessage || "Could not load."}`);
    } else if (routeInitialMessage) {
      setMessages([{ sender: "you", text: routeInitialMessage }]);
      setChatStarted(true);
    }

    if (routeFetchSidebar && !routeIsDreamChat && !routeApiError && routeViewerId && routeProfileOwnerId) {
      setLoadingSidebar(true);
      (async () => {
        try {
          const sidebarRes = await fetch("https://ppulse-backend.vercel.app/get_sidebar_content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ viewer_id: routeViewerId, profile_owner_id: routeProfileOwnerId }), });
          if (!sidebarRes.ok) { const errData = await sidebarRes.json().catch(() => ({ detail: "Failed to load sidebar" })); throw new Error(errData.detail); }
          const sidebarData = await sidebarRes.json(); setSidebarContent(sidebarData.sidebar_content);
        } catch (err) { console.error("Failed to fetch sidebar content:", err); setSidebarContent(`Error loading sidebar: ${(err as Error).message}`);
        } finally { setLoadingSidebar(false); }
      })();
    } else if (routeIsDreamChat) { 
        setSidebarContent(`You are chatting with an AI simulation of ${routeDreamPersonaName || "this persona"}. This is not a registered PersonaPulse user.`);
        setLoadingSidebar(false);
    } else if (routeApiError) { /* Already handled */ }
    else if (!routeFetchSidebar && !routeInitialMessage && !routeApiError) {
        setSidebarContent("Click 'Begin Conversation' to load details.");
    }
    initialSetupKey.current = currentKey;
    if (routeOnboardingModeContext && sessionStorage.getItem("isPostOnboardingTransition") === "true") {
      sessionStorage.removeItem("isPostOnboardingTransition");
    }
  }, [location.key, routeViewerId, routeProfileOwnerId, routeInitialMessage, routeFetchSidebar, routeApiError, routeErrorMessage, routeOnboardingModeContext, navigate, routeIsDreamChat, routeDreamPersonaName]);

  useEffect(() => { 
    if ((loading && !chatStarted) || (loadingSidebar && !sidebarContent?.startsWith("Error") && !routeIsDreamChat) ) {
      let idx = 0; const iv = setInterval(() => { idx = (idx + 1) % LOAD_QUIPS.length; setCurrentQuip(LOAD_QUIPS[idx]); }, 2000);
      return () => clearInterval(iv);
    }
  }, [loading, chatStarted, loadingSidebar, sidebarContent, routeIsDreamChat]);

  const startChat = async () => { 
    if (!session || !routeViewerId || !routeProfileOwnerId) return;
    setLoading(true); 
    if (!routeIsDreamChat) setLoadingSidebar(true); else setLoadingSidebar(false);
    setSidebarContent(routeIsDreamChat ? `You are chatting with an AI simulation of ${routeDreamPersonaName || "this persona"}.` : "Loading details...");

    try {
      const endpoint = `https://ppulse-backend.vercel.app${routeChatApiEndpoint}`;
      const body: any = routeChatApiEndpoint === "/dashboard_dream_chat" || routeChatApiEndpoint === "/chat" ? 
        { user_id: routeViewerId, direct_persona_name: routeDreamPersonaName || "selected persona", is_chat_empty: true, chat_history: [] } :
        { viewer_id: routeViewerId, profile_owner_id: routeProfileOwnerId, is_chat_empty: true, onboarding_mode: routeOnboardingModeContext, chat_history: [] };
      
      const msgRes = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!msgRes.ok) { const errData = await msgRes.json().catch(() => ({ detail: "API error" })); throw new Error(`Chat: ${errData.detail || "Failed to start"}`); }
      const msgData = await msgRes.json();
      setMessages([{ sender: "you", text: msgData.bot_response }]);
      setChatStarted(true);
      if ((routeChatApiEndpoint === "/dashboard_dream_chat" || routeChatApiEndpoint === "/chat") && msgData.bot_pfp) {
        setOwnerPfp(msgData.bot_pfp || DEFAULT_AVATAR_URL);
      }
      setLoading(false);

      if (!routeIsDreamChat && (routeChatApiEndpoint === "/generate_ai")) { 
        const sidebarRes = await fetch("https://ppulse-backend.vercel.app/get_sidebar_content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ viewer_id: routeViewerId, profile_owner_id: routeProfileOwnerId }), });
        if (!sidebarRes.ok) { const errData = await sidebarRes.json().catch(() => ({detail: "Sidebar error"})); throw new Error(`Sidebar: ${errData.detail}`); }
        const sidebarData = await sidebarRes.json(); setSidebarContent(sidebarData.sidebar_content);
      } 
    } catch (err) { console.error("Failed to start chat/sidebar via button:", err); setSidebarContent(`Error: ${(err as Error).message}`); setChatStarted(false);
    } finally { setLoading(false); setLoadingSidebar(false); }
  };

  const sendMessage = async () => { 
    const text = inputRef.current?.value.trim();
    if (!text || !session || !routeViewerId || !routeProfileOwnerId) return;
    const userMsg: Message = { sender: "other_person", text };
    const newMessages = [...messages, userMsg]; setMessages(newMessages);
    if (inputRef.current) inputRef.current.value = ""; setLoading(true);
    const chatHistoryForAPI = newMessages.slice(-5).map((m) => (m.sender === "other_person" ? { user: m.text } : { bot: m.text }));
    const endpoint = `https://ppulse-backend.vercel.app${routeChatApiEndpoint}`;
    let body: any;
    if (routeChatApiEndpoint === "/generate_ai") {
        body = { viewer_id: routeViewerId, profile_owner_id: routeProfileOwnerId, is_chat_empty: false, onboarding_mode: false, chat_history: chatHistoryForAPI };
    } else if (routeChatApiEndpoint === "/dashboard_dream_chat") {
        body = { viewer_user_id: routeViewerId, dream_persona_name: routeDreamPersonaName, is_chat_empty: false, chat_history: chatHistoryForAPI };
    } else if (routeChatApiEndpoint === "/chat") { 
        body = { user_id: routeViewerId, is_chat_empty: false, chat_history: chatHistoryForAPI };
        if (routeDreamPersonaName) body.direct_persona_name = routeDreamPersonaName;
    } else { console.error("Unknown chatApiEndpoint for sendMessage:", routeChatApiEndpoint); setLoading(false); alert("Configuration error: Cannot send message."); return; }
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const errData = await res.json().catch(() => ({ detail: "API error" })); throw new Error(errData.detail || "Failed to send"); }
      const data = await res.json();
      setMessages((prev) => [ ...prev, { sender: "you", text: data.bot_response }]);
    } catch (err) { console.error("Failed to send message:", err); setMessages(newMessages.slice(0, -1)); if (inputRef.current) inputRef.current.value = text; alert("Error: " + (err as Error).message);
    } finally { setLoading(false); }
  };
  
  const handleRestartConversation = () => { 
     if (!session || !routeViewerId || !routeProfileOwnerId) return;
    setMessages([]); setSidebarContent("Loading sidebar details..."); setChatStarted(false);
    navigate("/loading", { replace: true }); 
    (async () => { 
        try {
            const endpointForRestart = `https://ppulse-backend.vercel.app${routeChatApiEndpoint}`;
            let bodyForRestart: any;
            if (routeChatApiEndpoint === "/generate_ai") { bodyForRestart = { viewer_id: routeViewerId, profile_owner_id: routeProfileOwnerId, is_chat_empty: true, onboarding_mode: false, chat_history: [] };
            } else if (routeChatApiEndpoint === "/dashboard_dream_chat") { bodyForRestart = { viewer_user_id: routeViewerId, dream_persona_name: routeDreamPersonaName, is_chat_empty: true, chat_history: [] };
            } else if (routeChatApiEndpoint === "/chat") { bodyForRestart = { user_id: routeViewerId, direct_persona_name: routeDreamPersonaName, is_chat_empty: true, chat_history: [] };
            } else { throw new Error("Unknown endpoint for restart"); }
            const msgRes = await fetch(endpointForRestart, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bodyForRestart) });
            if (!msgRes.ok) { const errData = await msgRes.json().catch(() => ({ detail: "Restart Error" })); throw new Error(errData.detail); }
            const msgData = await msgRes.json();
            navigate("/chat", { 
                replace: true,
                state: { 
                    viewerId: routeViewerId, profileOwnerId: routeProfileOwnerId,
                    initialMessage: msgData.bot_response,
                    fetchSidebar: !routeIsDreamChat, 
                    onboardingModeContext: false, apiError: false,
                    isDreamChat: routeIsDreamChat, dreamPersonaName: routeDreamPersonaName,
                    ownerPfpForDreamChat: routeIsDreamChat ? (msgData.bot_pfp || null) : null,
                    chatApiEndpoint: routeChatApiEndpoint,
                },
            });
        } catch (err) { console.error("Failed to restart chat:", err); navigate("/chat", { replace: true, state: { viewerId: routeViewerId, profileOwnerId: routeProfileOwnerId, initialMessage: null, fetchSidebar: false, onboardingModeContext: false, apiError: true, errorMessage: (err as Error).message || "Could not restart chat.", chatApiEndpoint: routeChatApiEndpoint, isDreamChat: routeIsDreamChat, dreamPersonaName: routeDreamPersonaName } }); }
    })();
  };

  const currentKeyForLoadingCheck = location.key + (routeProfileOwnerId || "no-owner") + (routeViewerId || "no-viewer") + (routeIsDreamChat ? `-dream-${routeDreamPersonaName}` : "-userbot");
  if (initialSetupKey.current !== currentKeyForLoadingCheck) { return ( <div className="chat-loading-screen"> <div className="glass-container flex flex-col items-center gap-6"> <Spinner /> <p className="text-white text-lg">{currentQuip}</p> </div> </div> ); }
  if (!chatStarted) { return ( <div className="chat-loading-screen"> <div className="glass-container flex flex-col items-center gap-6"> {(loading || loadingSidebar) && <Spinner />}{" "} <p className="text-white text-lg"> {(loading || loadingSidebar) ? currentQuip : routeApiError ? routeErrorMessage || "Error loading. Try again?" : "Ready to chat?"} </p> <button onClick={startChat} disabled={loading || loadingSidebar} className="px-6 py-3 bg-purple-600 rounded-lg text-white font-semibold hover:bg-purple-500 disabled:opacity-50" > {(loading || loadingSidebar) ? "Starting…" : "Begin Conversation"} </button> </div> </div> ); }
  
  return (
    <div className="chat-bg">
      <div className="chat-container-glass">
        <div className="chat-appbar"> <FaBars className="appbar-icon" onClick={() => setSidebarOpen((v) => !v)} /> <span className="appbar-title">{ownerName}</span> <FaUndo className="appbar-icon" onClick={handleRestartConversation} /> <FaPaperPlane className="appbar-icon" onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Link copied!"); }}/> </div>
        <div className="chat-body">
          {sidebarOpen && ( 
            <aside className="sidebar-glass"> 
              <div className="sidebar-fancy-content">  
                {/* Conditionally render PFP for dream chats */}
                {routeIsDreamChat && ownerPfp && (
                  <img 
                    src={ownerPfp} 
                    alt={`${ownerName} avatar`} 
                    className="sidebar-dream-pfp"
                    onError={(e) => {(e.target as HTMLImageElement).src = DEFAULT_AVATAR_URL;}}
                  />
                )}
                {/* Existing sidebar content logic */}
                {loadingSidebar && !sidebarContent?.startsWith("Error") && !routeIsDreamChat ? ( 
                  <div className="flex flex-col items-center justify-center h-full"> <Spinner /> <p className="mt-2 text-zinc-400">{currentQuip}</p> </div> 
                ) : sidebarContent ? ( 
                  <ReactMarkdown remarkPlugins={remarkPluginsList}>
                    {sidebarContent || ""} 
                  </ReactMarkdown> 
                ) : ( <p className="text-zinc-400">Details will appear here.</p> )} 
              </div> 
            </aside> 
          )}
          <section className="chat-section">
            {}
            <div className="chat-messages">
              {messages.map((m, i) => ( <div key={`${m.sender}-${i}-${m.text.slice(0, 10)}`} className={`msg-row ${m.sender === "you" ? "row-other" : "row-you"}`}> {m.sender === "you" && (<img src={ownerPfp} alt="bot avatar" className="msg-avatar avatar-left" onError={(e) => {(e.target as HTMLImageElement).src = DEFAULT_AVATAR_URL;}}/>)} <div className={`msg-bubble ${m.sender === "you" ? "bubble-other" : "bubble-you"}`}> <ReactMarkdown remarkPlugins={remarkPluginsList}>{m.text}</ReactMarkdown> </div> {m.sender === "other_person" && (<img src={viewerPfp} alt="your avatar" className="msg-avatar avatar-right" onError={(e) => {(e.target as HTMLImageElement).src = DEFAULT_AVATAR_URL;}}/>)} </div>))}
              {loading && messages.length > 0 && ( <div className="msg-row row-other"> <img src={ownerPfp} alt="bot avatar" className="msg-avatar avatar-left" onError={(e) => {(e.target as HTMLImageElement).src = DEFAULT_AVATAR_URL;}}/> <div className="msg-bubble bubble-other"> <div className="typing-dots"> <span /><span /><span /> </div> </div> </div>)}
            </div>
            <div className="chat-input"> <input type="text" placeholder="Type a message…" ref={inputRef} disabled={loading} onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()} /> <button onClick={sendMessage} disabled={loading}> <FaPaperPlane /> </button> </div>
          </section>
        </div>
      </div>
    </div>);
}
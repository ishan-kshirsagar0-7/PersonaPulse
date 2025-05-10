import { useState, useEffect, useRef } from "react";
import ReactMarkdown, { Options as ReactMarkdownOptions } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import Spinner from "@/components/Spinner";
import { FaPaperPlane } from "react-icons/fa";

const DEFAULT_AVATAR_URL = "/default-avatar.png"; 
const remarkPluginsList: ReactMarkdownOptions['remarkPlugins'] = [remarkGfm];

interface Props {
  onNext: () => void;
  onBack: () => void;
}

type Message = { sender: "user" | "bot"; text: string };

export default function DreamConversation({ onNext, onBack }: Props) {
  const { session } = useAuth();
  const [who, setWho] = useState(""); 
  const [why, setWhy] = useState(""); 
  
  const [chatStarted, setChatStarted] = useState(false);
  const [loading, setLoading] = useState(false);      
  const [messages, setMessages] = useState<Message[]>([]); 
  const [inputText, setInputText] = useState("");    
  const [botPfp, setBotPfp] = useState<string>(DEFAULT_AVATAR_URL); 
  
  const chatRef = useRef<HTMLDivElement>(null);
  const userPfp = session?.user.user_metadata.avatar_url || DEFAULT_AVATAR_URL;

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const startChat = async () => {
    if (!session?.user.id) {
        alert("User session not found. Please log in again.");
        return;
    }
    if (!who.trim()) {
        alert("Please enter who you'd like to chat with.");
        return;
    }
    setLoading(true);

    try {
      const { error: upsertError } = await supabase
        .from("dream_conversations")
        .upsert({
          user_id: session.user.id,
          persona_name: who.trim(),
          reason: why.trim() || "User wants to experience a dream chat during onboarding.",
        }, { 
            onConflict: 'user_id',
        });

      if (upsertError) {
        console.error("Failed to save/update dream conversation details:", upsertError);
        alert(`Database error saving dream conversation: ${upsertError.message}. Please check table constraints and try again.`);
        setLoading(false);
        return;
      }

      const res = await fetch("https://ppulse-backend.vercel.app/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: session.user.id, 
          is_chat_empty: true,
          chat_history: [] 
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "API error, unable to parse response." }));
        console.error("API Error from /chat:", errData);
        alert(`Error starting chat: ${errData.message || errData.detail || "Unknown API error from backend."}`);
        setLoading(false);
        return;
      }
      const data = await res.json();
      
      setBotPfp(data.bot_pfp || DEFAULT_AVATAR_URL);
      setMessages([{ sender: "bot", text: data.bot_response }]);
      setChatStarted(true);

    } catch (err) {
      console.error("Failed to start chat (general error):", err);
      alert("An unexpected error occurred: " + (err as Error).message);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !session?.user.id) return;
    const currentMessages = [...messages, { sender: "user" as "user", text: inputText.trim() }];
    setMessages(currentMessages);
    setInputText("");
    setLoading(true);
    const chatHistoryForAPI = currentMessages.slice(-5).map(msg => msg.sender === "user" ? { "user": msg.text } : { "bot": msg.text });
    try {
      const res = await fetch("https://ppulse-backend.vercel.app/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: session.user.id, is_chat_empty: false, chat_history: chatHistoryForAPI })
      });
      if (!res.ok) { const errData = await res.json().catch(() => ({ detail: "API error" })); throw new Error(errData.detail || "Failed to send message"); }
      const data = await res.json();
      setMessages(prev => [...prev, { sender: "bot", text: data.bot_response }]);
    } catch (err) {
      console.error("Failed to send message in onboarding dream chat:", err);
      setMessages(currentMessages.slice(0,-1)); 
      setInputText(inputText.trim());
      alert("Error sending message: " + (err as Error).message);
    }
    setLoading(false);
  };
  
  const handleEndConversationAndSave = async () => {
    if (!session?.user.id) { onNext(); return; }
    if (messages.length > 0 && who.trim()) {
        try {
            const { error } = await supabase.from("chat_history").upsert({
                user_id: session.user.id, persona_name: who.trim(), 
                messages: messages, last_updated: new Date().toISOString()
            }, { onConflict: 'user_id, persona_name' }); 
            if (error) { console.error("Failed to save dream conversation history:", error); } 
            else { console.log("Onboarding dream conversation history saved."); }
        } catch (dbError) { console.error("Exception saving dream chat history:", dbError); }
    } else { console.log("No messages or persona name for onboarding dream chat to save."); }
    onNext();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading && inputText.trim()) { e.preventDefault(); sendMessage(); }
  };

  if (!chatStarted) {
    return (
      <div className="space-y-6">
        <h2 className="mb-2 text-center text-xl font-semibold text-white">Dream Conversation</h2>
        <p className="mb-4 text-center text-sm text-zinc-400"> Name <em>any</em> famous personality — real, fictional, past or present — you’d love to talk to. <br />We’ll spin up an AI version for a quick chat! </p>
        <p className="mb-6 text-center text-sm text-blue-300"> This conversation helps your AI assistant learn your natural writing style. Be casual, be yourself! </p>
        <input className="mb-4 w-full rounded-md bg-zinc-800/70 px-4 py-3 text-sm text-white outline-none border border-zinc-700 focus:ring-2 focus:ring-purple-500" placeholder="Who would you chat with?" value={who} onChange={(e) => setWho(e.target.value)} disabled={loading} />
        <textarea className="mb-8 h-28 w-full resize-none rounded-md bg-zinc-800/70 p-4 text-sm text-white outline-none border border-zinc-700 focus:ring-2 focus:ring-purple-500" placeholder="Why them? What would you talk about?" value={why} onChange={(e) => setWhy(e.target.value)} disabled={loading} />
        <div className="flex justify-between">
          <button onClick={onBack} className="rounded-md border border-zinc-600 px-5 py-2.5 text-sm text-white hover:bg-zinc-700 transition-colors" disabled={loading} > ← Back </button>
          <button onClick={startChat} className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60 flex items-center gap-2" disabled={!who.trim() || loading} > 
            {loading && <Spinner />} {loading ? "Setting up..." : "Start Chat →"} </button>
        </div>
      </div>
    );
  }

  return ( 
    <div className="w-full max-w-2xl mx-auto bg-zinc-900/70 rounded-xl shadow-2xl p-1 md:p-6 flex flex-col min-h-[70vh] md:min-h-[30rem] max-h-[85vh]">
        <div className="flex flex-col items-center mb-4 text-white border-b border-zinc-700 pb-3"> <img src={botPfp || DEFAULT_AVATAR_URL} alt={`${who}'s AI avatar`} className="w-20 h-20 rounded-full mb-2 object-cover"/> <span className="font-semibold text-lg">Chat with {who}'s AI</span> </div>
        <div ref={chatRef} className="flex-grow overflow-y-auto space-y-4 px-2 md:px-4 mb-4 custom-scrollbar"> 
            {messages.map((msg, idx) => ( <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}> <div className={`flex items-end gap-2 md:gap-3 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}> <img src={msg.sender === "user" ? userPfp : (botPfp || DEFAULT_AVATAR_URL)} alt="avatar" className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover self-end mb-1" onError={(e) => {(e.target as HTMLImageElement).src = DEFAULT_AVATAR_URL;}}/> <div className={`max-w-[70%] md:max-w-[75%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${ msg.sender === "user" ? "bg-blue-500 text-white rounded-br-none" : "bg-zinc-700 text-zinc-100 rounded-bl-none" }`}> <ReactMarkdown remarkPlugins={remarkPluginsList}>{msg.text}</ReactMarkdown> </div> </div> </div> ))}
            {loading && messages.length > 0 && ( <div className="flex justify-start"><div className="flex items-end gap-2 md:gap-3"><img src={botPfp || DEFAULT_AVATAR_URL} alt="avatar" className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover self-end mb-1"/><div className="max-w-[70%] md:max-w-[75%] px-3.5 py-2.5 rounded-xl text-sm bg-zinc-700 text-zinc-100 rounded-bl-none"><div className="typing-dots"><span/><span/><span/></div></div></div></div> )}
        </div>
        <div className="flex w-full space-x-2 md:space-x-3 pt-3 border-t border-zinc-700">
            <input className="flex-grow rounded-full bg-zinc-800/80 px-4 py-2.5 text-sm text-white outline-none border border-zinc-700 focus:ring-1 focus:ring-purple-500 focus:border-purple-500" placeholder="Type your message..." value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyPress} disabled={loading} />
            <button onClick={sendMessage} className="rounded-full bg-blue-600 p-2.5 md:px-4 md:py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60 flex items-center justify-center" disabled={loading || !inputText.trim()}> <FaPaperPlane size={16}/> <span className="hidden md:inline ml-2">Send</span> </button>
        </div>
        <div className="mt-6 flex justify-center"> <button onClick={handleEndConversationAndSave} className="rounded-md bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50" disabled={loading} > End Conversation & Save </button> </div>
    </div>
  );
}
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";
import { FaRobot } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import Container from "./Container";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import logoGlyph from "@/assets/logo-glyph.png";
import defaultAvatar from "@/assets/default-avatar.png";

export default function Header() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const meta = session?.user.user_metadata as
    | Record<string, string>
    | undefined;
  const avatarUrl = meta?.avatar_url || meta?.picture || defaultAvatar;
  const displayName =
    meta?.full_name || meta?.name || session?.user.email?.split("@")[0];

  const logOut = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  const viewYourBot = async () => {
    setMenuOpen(false);
    if (!session?.user.id) return;

    navigate("/loading", { replace: true });

    try {
      const res = await fetch(
        "https://ppulse-backend.vercel.app/generate_ai",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            viewer_id: session.user.id,
            profile_owner_id: session.user.id,
            is_chat_empty: true,
            onboarding_mode: false,
            chat_history: [],
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ detail: "Unknown API error" }));
        throw new Error(errorData.detail || "Failed to load your bot");
      }
      const data = await res.json();

      navigate("/chat", {
        replace: true,
        state: {
          viewerId: session.user.id,
          profileOwnerId: session.user.id,
          initialMessage: data.bot_response,
          fetchSidebar: true,
          onboardingModeContext: false,
          apiError: false,
        },
      });
    } catch (err) {
      console.error("Error fetching own bot:", err);
      navigate("/chat", {
        replace: true,
        state: {
          viewerId: session.user.id,
          profileOwnerId: session.user.id,
          initialMessage: null,
          fetchSidebar: false,
          onboardingModeContext: false,
          apiError: true,
          errorMessage: (err as Error).message || "Could not load your bot.",
        },
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-[linear-gradient(90deg,transparent,var(--brand-from)_50%,transparent)]">
      <Container className="relative flex h-24 items-center md:h-28">
        <motion.a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate(session && session.user ? "/dashboard" : "/");
          }}
          className="flex shrink-0 items-center"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <img
            src={logoGlyph}
            alt="PersonaPulse logo"
            className="h-16 w-auto sm:h-20 md:h-24"
          />
        </motion.a>
        <motion.a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate(session && session.user ? "/dashboard" : "/");
          }}
          className="absolute left-1/2 -translate-x-1/2 select-none font-extrabold tracking-tight text-white sm:text-2xl md:text-3xl"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}
        >
          PersonaPulse
        </motion.a>
        <div className="ml-auto flex items-center gap-6">
          {!session ? (
            <>
              <button
                onClick={() => navigate("/login")}
                className="text-base font-medium text-zinc-400 transition-colors hover:text-white md:text-lg"
              >
                Log In
              </button>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="gradientOutline"
                  size="lg"
                  onClick={() => navigate("/login")}
                  className="px-6 py-3 text-base font-semibold md:px-7 md:py-4 md:text-lg"
                >
                  Sign Up
                </Button>
              </motion.div>
            </>
          ) : (
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-3 rounded-full bg-white/5 px-4 py-2 backdrop-blur"
              >
                <img
                  src={avatarUrl}
                  alt="avatar"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = defaultAvatar;
                  }}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <span className="hidden text-sm font-medium text-white sm:block">
                  {displayName}
                </span>
              </motion.button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.ul
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 mt-2 w-48 rounded-lg bg-zinc-900/80 p-2 backdrop-blur"
                  >
                    <li>
                      <button
                        onClick={viewYourBot}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
                      >
                        <FaRobot size={14} /> View Your Bot
                      </button>
                    </li>
                    <li><hr className="my-1 border-zinc-700" /></li>
                    <li>
                      <button
                        onClick={logOut}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
                      >
                        <LogOut size={14} /> Log out
                      </button>
                    </li>
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </Container>
    </header>
  );
}
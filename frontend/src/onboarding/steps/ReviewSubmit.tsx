import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

export default function ReviewSubmit() {
  const { session, setHasProfile } = useAuth();
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!session?.user.id) return;

    sessionStorage.setItem("isPostOnboardingTransition", "true");

    const { error: profileUpsertError } = await supabase
      .from("profiles")
      .upsert({ id: session.user.id }, { onConflict: "id" });

    if (profileUpsertError) {
      console.error("Error upserting to profiles table:", profileUpsertError);
      sessionStorage.removeItem("isPostOnboardingTransition");
      return;
    }

    setHasProfile(true);
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
            onboarding_mode: true,
            chat_history: [],
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ detail: "Unknown API error" }));
        throw new Error(errorData.detail || `API Error: ${res.status}`);
      }

      const data = await res.json();

      navigate("/chat", {
        replace: true,
        state: {
          viewerId: session.user.id,
          profileOwnerId: session.user.id,
          initialMessage: data.bot_response,
          fetchSidebar: true,
          onboardingModeContext: true,
          apiError: false,
        },
      });
    } catch (err) {
      console.error("Generate AI error during ReviewSubmit:", err);
      sessionStorage.removeItem("isPostOnboardingTransition");
      navigate("/chat", {
        replace: true,
        state: {
          viewerId: session.user.id,
          profileOwnerId: session.user.id,
          initialMessage: null,
          fetchSidebar: false,
          onboardingModeContext: true,
          apiError: true,
          errorMessage:
            (err as Error).message ||
            "Could not generate initial AI response.",
        },
      });
    }
  };

  return (
    <section className="flex flex-col items-center gap-6 text-center">
      <h2 className="text-3xl font-bold">All set!</h2>
      <p className="max-w-md text-zinc-400">
        We’ve captured all your details. Click{" "}
        <strong>Generate my AI</strong> to create your personal chatbot.
      </p>
      <button
        onClick={handleGenerate}
        className="px-6 py-3 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-500"
      >
        Generate my AI →
      </button>
    </section>
  );
}
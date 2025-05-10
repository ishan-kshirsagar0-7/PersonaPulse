import Spinner from "@/components/Spinner";
import QuipCycler from "@/components/QuipCycler";
import "@/styles/ChatView.css"; 

export default function LoadingPage() {
  return (
    <div className="chat-loading-screen">
      <div className="glass-container flex flex-col items-center gap-4">
        <Spinner />
        {/* Using QuipCycler directly if it handles its own state, or pass LOAD_QUIPS */}
        <QuipCycler />
      </div>
    </div>
  );
}
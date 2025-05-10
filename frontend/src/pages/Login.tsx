import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, LockKeyhole, Loader2} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

export default function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [info, setInfo]   = useState<string | null>(null);
  const [err,  setErr]    = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const toggle = () => {
    setInfo(null);
    setErr(null);
    setIsSignUp((v) => !v);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setInfo(null);

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) setErr(error.message);
      else if (data.session) {
        navigate("/dashboard", { replace: true });
      } else {
        setInfo("Account created! Please check your email to confirm.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword(form);
      if (error) setErr(error.message);
      else navigate("/dashboard", { replace: true });
    }

    setLoading(false);
  };

  const loginGoogle = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white/5 p-8 backdrop-blur-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-white">
          {isSignUp ? "Create account" : "Welcome back"}
        </h1>

        {/* info / error banners */}
        {info && (
          <p className="mb-4 rounded-md bg-green-500/10 px-4 py-2 text-center text-xs text-green-300">
            {info}
          </p>
        )}
        {err && (
          <p className="mb-4 rounded-md bg-red-500/10 px-4 py-2 text-center text-xs text-red-300">
            {err}
          </p>
        )}

        <form onSubmit={submit} className="space-y-4">
          <label className="flex items-center gap-3 rounded-md bg-zinc-900/70 px-4 py-3">
            <Mail size={18} />
            <input
              required
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
            />
          </label>

          <label className="flex items-center gap-3 rounded-md bg-zinc-900/70 px-4 py-3">
            <LockKeyhole size={18} />
            <input
              required
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
            />
          </label>

          <Button
            type="submit"
            variant="brandBlue"
            className="w-full justify-center"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : isSignUp ? (
              "Sign Up"
            ) : (
              "Log In"
            )}
          </Button>

          <Button
            type="button"
            onClick={loginGoogle}
            variant="gradientOutline"
            className="w-full justify-center"
            disabled={loading}
          >
            Continue with Google
          </Button>
        </form>

        <button
          onClick={toggle}
          className="mt-6 block w-full text-center text-sm text-zinc-400 hover:text-white"
        >
          {isSignUp ? "Have an account? Log in" : "New here? Sign up"}
        </button>

        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10 backdrop-filter" />
      </div>
    </div>
  );
}
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

interface AuthCtx {
  session: Session | null;
  loading: boolean;
  hasProfile: boolean | null;
  setHasProfile: (v: boolean | null) => void;
}

const AuthContext = createContext<AuthCtx>({
  session: null,
  loading: true,
  hasProfile: null,
  setHasProfile: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile_local, setHasProfile_local] = useState<boolean | null>(
    null
  );
  const profileConfirmedForUserId = useRef<string | null>(null);

  const setHasProfile = (v: boolean | null) => {
    setHasProfile_local(v);
    if (v === true && session?.user?.id) {
      profileConfirmedForUserId.current = session.user.id;
    } else if (v === null || v === false) {
      profileConfirmedForUserId.current = null;
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSess } }) => {
      setSession(initialSess);
      if (!initialSess) {
        setHasProfile(null);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSess) => {
      setSession(currentSess);
      if (!currentSess) {
        setHasProfile(null);
      }
      if (loading) setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loading]);

  useEffect(() => {
    if (!session) {
      if (hasProfile_local !== null) setHasProfile(null);
      return;
    }

    if (
      session.user.id === profileConfirmedForUserId.current &&
      hasProfile_local === true
    ) {
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", session.user.id)
          .maybeSingle();

        if (error) {
          console.error("AuthContext: Profile lookup error:", error);
          throw error;
        }
        setHasProfile(Boolean(data));
      } catch (error) {
        setHasProfile(false);
      }
    })();
  }, [session, hasProfile_local]);

  return (
    <AuthContext.Provider
      value={{ session, loading, hasProfile: hasProfile_local, setHasProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};
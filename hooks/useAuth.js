import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

export function useAuth(auth) {
  const [authState, setAuthState] = useState({
    isSignedIn: false,
    pending: true,
    user: null,
  });

  useEffect(() => {
    const checkAuth = onAuthStateChanged(auth, (user) => setAuthState({ user, pending: false, isSignedIn: !!user }));
    return () => checkAuth();
  }, [auth]);

  return { ...authState };
}

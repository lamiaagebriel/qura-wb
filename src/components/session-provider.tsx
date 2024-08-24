"use client";

import { Session, User } from "lucia";
import React, { createContext, useContext } from "react";

type SessionContext =
  | {
      user: User;
      session: Session;
    }
  | {
      user: null;
      session: null;
    };

const SessionContext = createContext<SessionContext>({
  user: null,
  session: null,
});

export function SessionProvider({
  children,
  value,
}: React.PropsWithChildren<{ value: SessionContext }>) {
  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context)
    throw new Error("useSession must be used within a session-provider");

  return context;
}

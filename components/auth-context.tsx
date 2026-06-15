"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  enterServerMode,
  exitServerMode,
  readLocalPredictions,
  type Profile,
} from "@/lib/storage";
import type { Prediction } from "@/lib/scoring";
import { useToast } from "@/components/ui/toast";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  favoriteTeam: string;
}

type Status = "loading" | "authed" | "anon";

interface AuthCtx {
  user: AuthUser | null;
  status: Status;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    avatar: string;
    favoriteTeam: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

function toProfile(u: AuthUser): Profile {
  return { deviceId: u.id, name: u.name, avatar: u.avatar, favoriteTeam: u.favoriteTeam };
}

async function loadPredictions(): Promise<Prediction[]> {
  try {
    const res = await fetch("/api/predictions", { cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as { predictions?: Prediction[] };
    return json.predictions ?? [];
  } catch {
    return [];
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const toast = useToast();

  const activate = useCallback(async (u: AuthUser) => {
    const preds = await loadPredictions();
    enterServerMode(toProfile(u), preds);
    setUser(u);
    setStatus("authed");
  }, []);

  // Khôi phục phiên khi tải trang.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const json = (await res.json()) as { user: AuthUser | null };
        if (!alive) return;
        if (json.user) await activate(json.user);
        else setStatus("anon");
      } catch {
        if (alive) setStatus("anon");
      }
    })();
    return () => {
      alive = false;
    };
  }, [activate]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const json = await res.json();
        if (!res.ok) return { ok: false, error: json.error ?? "Đăng nhập thất bại" };
        const u = json.user as AuthUser;
        await activate(u);
        toast({
          title: "Đăng nhập thành công",
          description: `Chào mừng trở lại, ${u.name}!`,
          variant: "success",
        });
        return { ok: true };
      } catch {
        return { ok: false, error: "Lỗi kết nối" };
      }
    },
    [activate, toast],
  );

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      name: string;
      avatar: string;
      favoriteTeam: string;
    }) => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, predictions: readLocalPredictions() }),
        });
        const json = await res.json();
        if (!res.ok) return { ok: false, error: json.error ?? "Đăng ký thất bại" };
        await activate(json.user as AuthUser);
        toast({
          title: "Tạo tài khoản thành công 🎉",
          description: "Hồ sơ, dự đoán & điểm của bạn đã được lưu.",
          variant: "success",
        });
        return { ok: true };
      } catch {
        return { ok: false, error: "Lỗi kết nối" };
      }
    },
    [activate, toast],
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    exitServerMode();
    setUser(null);
    setStatus("anon");
    toast({ title: "Đã đăng xuất", description: "Hẹn gặp lại bạn!" });
  }, [toast]);

  return (
    <Ctx.Provider value={{ user, status, login, register, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth phải nằm trong <AuthProvider>");
  return c;
}

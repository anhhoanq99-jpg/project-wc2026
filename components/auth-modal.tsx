"use client";

import { useState } from "react";
import { X, LogIn, UserPlus, Heart } from "lucide-react";
import { AVATARS } from "@/lib/storage";
import { useAuth } from "@/components/auth-context";
import { getTeam } from "@/lib/data/teams";
import { Flag } from "@/components/flag";
import { TeamPicker } from "@/components/team-picker";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function AuthModal({
  onClose,
  initialMode = "login",
}: {
  onClose: () => void;
  initialMode?: "login" | "register";
}) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [team, setTeam] = useState("");
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    setBusy(true);
    const r =
      mode === "login"
        ? await login(email, password)
        : await register({ email, password, name, avatar, favoriteTeam: team });
    setBusy(false);
    if (r.ok) onClose();
    else setErr(r.error ?? "Có lỗi xảy ra");
  };

  const canSubmit =
    mode === "login"
      ? email && password
      : email && password.length >= 6 && name.trim().length >= 2 && team;

  return (
    <Modal
      onClose={onClose}
      placement="center"
      ariaLabel={mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
      panelClassName="my-auto max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <p className="font-bold">{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</p>
        <button
          type="button"
          aria-label="Đóng"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4 p-5">
        <p className="rounded-lg bg-brand/10 px-3 py-2 text-xs text-brand">
          Đăng nhập để <strong>lưu vĩnh viễn</strong> hồ sơ, dự đoán &amp; điểm — đồng bộ
          mọi thiết bị, không mất khi đổi máy.
        </p>

        {mode === "register" && (
          <>
            <Field label="Tên hiển thị">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={24}
                placeholder="VD: Khánh"
                className="auth-input"
              />
            </Field>
            <Field label="Ảnh đại diện">
              <div className="flex flex-wrap gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    aria-label={`Chọn ảnh đại diện ${a}`}
                    aria-pressed={avatar === a}
                    onClick={() => setAvatar(a)}
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-lg border text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                      avatar === a ? "border-brand bg-brand/15" : "border-border hover:bg-surface-2",
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Đội tuyển yêu thích">
              <button
                type="button"
                onClick={() => setPicker(true)}
                className="flex h-11 w-full items-center gap-2 rounded-lg border border-border bg-background px-3 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {team ? (
                  <>
                    <Flag code={team} size={22} />
                    <span className="font-semibold">{getTeam(team).name}</span>
                    <span className="ml-auto text-sm text-brand">Đổi</span>
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4 text-live" />
                    <span className="text-muted">Chọn đội cổ vũ…</span>
                  </>
                )}
              </button>
            </Field>
          </>
        )}

        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ban@email.com"
            className="auth-input"
          />
        </Field>
        <Field label="Mật khẩu">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canSubmit && submit()}
            placeholder={mode === "register" ? "Tối thiểu 6 ký tự" : "••••••"}
            className="auth-input"
          />
        </Field>

        {err && <p className="text-sm text-danger">{err}</p>}

        <Button
          type="button"
          disabled={!canSubmit || busy}
          onClick={submit}
          className="w-full font-bold"
        >
          {busy ? (
            <Spinner />
          ) : mode === "login" ? (
            <LogIn className="h-5 w-5" />
          ) : (
            <UserPlus className="h-5 w-5" />
          )}
          {mode === "login" ? "Đăng nhập" : "Đăng ký"}
        </Button>

        <p className="text-center text-sm text-muted">
          {mode === "login" ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
          <button
            type="button"
            onClick={() => {
              setErr("");
              setMode(mode === "login" ? "register" : "login");
            }}
            className="font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {mode === "login" ? "Đăng ký" : "Đăng nhập"}
          </button>
        </p>
      </div>

      {picker && (
        <TeamPicker
          value={team}
          onPick={(c) => {
            setTeam(c);
            setPicker(false);
          }}
          onClose={() => setPicker(false)}
        />
      )}
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold">{label}</label>
      {children}
    </div>
  );
}

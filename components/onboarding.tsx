"use client";

import { useState } from "react";
import { Sparkles, Heart, ArrowRight } from "lucide-react";
import { AVATARS, joinProfile } from "@/lib/storage";
import { useProfile } from "@/components/use-store";
import { getTeam } from "@/lib/data/teams";
import { Flag } from "@/components/flag";
import { TeamPicker } from "@/components/team-picker";
import { AuthModal } from "@/components/auth-modal";
import { useAuth } from "@/components/auth-context";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Màn chào mừng lần đầu: tham gia web bằng tên + ảnh + đội yêu thích. */
export function Onboarding() {
  const profile = useProfile();
  const { status } = useAuth();
  const toast = useToast();
  const [dismissed, setDismissed] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [team, setTeam] = useState("");
  const [picker, setPicker] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // Đang khôi phục phiên / đã đăng nhập / đã có tên / tạm bỏ qua -> không hiện.
  if (status === "loading" || status === "authed" || profile.name || dismissed) return null;

  const canJoin = name.trim().length >= 2 && team;

  const join = () => {
    if (!canJoin) return;
    joinProfile({ name, avatar, favoriteTeam: team });
    toast({
      title: `Chào mừng, ${name.trim()}! ⚽`,
      description: `Cùng cổ vũ ${getTeam(team).name} nào!`,
      variant: "success",
    });
  };

  return (
    <Modal
      onClose={() => setDismissed(true)}
      placement="sheet"
      ariaLabel="Tạo hồ sơ cổ động viên"
      panelClassName="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl sm:rounded-2xl"
    >
      <div className="border-b border-border bg-gradient-to-b from-brand/15 to-transparent px-6 py-5 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand/15 px-3 py-1 text-xs font-bold text-brand">
          <Sparkles className="h-3.5 w-3.5" />
          Tham gia World Cup 2026 của bạn
        </span>
        <h2 className="mt-3 text-xl font-extrabold">Tạo hồ sơ cổ động viên</h2>
        <p className="mt-1 text-sm text-muted">
          Chọn tên, ảnh đại diện và đội tuyển bạn yêu thích để theo dõi &amp; cổ vũ.
        </p>
      </div>

      <div className="space-y-5 p-6">
        {/* Tên */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Tên của bạn</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            placeholder="VD: Khánh, Fan số 1…"
            className="h-11 w-full rounded-lg border border-border bg-background px-3 focus:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          />
        </div>

        {/* Ảnh đại diện */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Ảnh đại diện</label>
          <div className="flex flex-wrap gap-2">
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                aria-label={`Chọn ảnh đại diện ${a}`}
                aria-pressed={avatar === a}
                onClick={() => setAvatar(a)}
                className={cn(
                  "grid h-10 w-10 place-items-center rounded-lg border text-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                  avatar === a
                    ? "border-brand bg-brand/15"
                    : "border-border hover:bg-surface-2",
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Đội yêu thích */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Đội tuyển yêu thích</label>
          <button
            type="button"
            onClick={() => setPicker(true)}
            className="flex h-12 w-full items-center gap-3 rounded-lg border border-border bg-background px-3 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {team ? (
              <>
                <Flag code={team} size={26} />
                <span className="font-semibold">{getTeam(team).name}</span>
                <span className="ml-auto text-sm text-brand">Đổi</span>
              </>
            ) : (
              <>
                <Heart className="h-5 w-5 text-live" />
                <span className="text-muted">Chọn đội để cổ vũ vô địch…</span>
                <ArrowRight className="ml-auto h-4 w-4 text-muted" />
              </>
            )}
          </button>
        </div>

        <Button
          type="button"
          size="lg"
          disabled={!canJoin}
          onClick={join}
          className="w-full font-bold"
        >
          Bắt đầu cổ vũ
          <ArrowRight className="h-5 w-5" />
        </Button>

        <div className="rounded-lg border border-border bg-surface-2/40 p-3 text-center">
          <p className="text-xs text-muted">
            Muốn lưu <strong>vĩnh viễn</strong> &amp; đồng bộ nhiều máy?
          </p>
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="mt-1 text-sm font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Đăng ký / Đăng nhập tài khoản
          </button>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="block w-full text-center text-xs text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          Chơi ẩn danh (lưu tạm trên máy)
        </button>
      </div>

      {authOpen && <AuthModal initialMode="register" onClose={() => setAuthOpen(false)} />}

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

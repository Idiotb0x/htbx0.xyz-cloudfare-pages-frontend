"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { apiFetch } from "@/api/client";

const DEFAULT_EMAIL = process.env.NEXT_PUBLIC_LOGIN_EMAIL || "ibpopej@gmail.com";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [panelKey, setPanelKey] = useState(0);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (requires2FA && codeInputRef.current) codeInputRef.current.focus();
  }, [requires2FA]);

  // Sync panel animation with video loop (zoom ending)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onEnded = () => setPanelKey((k) => k + 1);
    video.addEventListener("ended", onEnded);
    return () => video.removeEventListener("ended", onEnded);
  }, []);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch<{
        token?: string;
        user?: { id: string; email: string; role: string };
        requires2FA?: boolean;
        tempToken?: string;
      }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: DEFAULT_EMAIL, password }),
      });
      if (data.requires2FA && data.tempToken) {
        setTempToken(data.tempToken);
        setRequires2FA(true);
        setPassword("");
        setLoading(false);
        return;
      }
      if (data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.assign("/dashboard");
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handle2FA(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch<{
        token: string;
        user: { id: string; email: string; role: string };
      }>("/api/auth/2fa/validate", {
        method: "POST",
        body: JSON.stringify({ tempToken, code: totpCode }),
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.assign("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
      setTotpCode("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "flex-end",
        padding: "0.5rem",
        paddingBottom: "0.5rem",
        paddingRight: "0.5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
        aria-hidden
      >
        <source src="/Image_Animation_To_Video.mp4" type="video/mp4" />
      </video>
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.35)",
          zIndex: 1,
        }}
        aria-hidden
      />
      {/* Cover "Veo" watermark in bottom-right of video */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          right: 0,
          width: "100px",
          height: "40px",
          background: "rgba(0,0,0,0.55)",
          zIndex: 1,
        }}
        aria-hidden
      />

      <div
        key={panelKey}
        className="login-panel"
        style={{
          position: "relative",
          zIndex: 2,
          width: "auto",
          maxWidth: "120px",
          padding: "0.35rem 0.5rem",
          background: "rgba(255,255,255,0.02)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          borderRadius: "6px",
          border: "none",
          boxShadow: "none",
          animation: "loginPanelIn 1s ease-out forwards",
        }}
      >
        {requires2FA ? (
          <form onSubmit={handle2FA} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <input
              ref={codeInputRef}
              className="input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              required
              style={{
                fontFamily: "monospace",
                letterSpacing: "0.2em",
                textAlign: "center",
                fontSize: "0.65rem",
                padding: "0.2rem 0.25rem",
                background: "rgba(255,255,255,0.03)",
                border: "none",
                color: "rgba(255,255,255,0.5)",
                width: "4.5rem",
              }}
            />
            {error && (
              <p style={{ fontSize: "0.55rem", color: "var(--danger)", margin: 0 }}>{error}</p>
            )}
            <button
              type="button"
              onClick={() => {
                setRequires2FA(false);
                setTempToken("");
                setTotpCode("");
                setError("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.35)",
                fontSize: "0.5rem",
                cursor: "pointer",
              }}
            >
              Back
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••"
              required
              autoFocus
              disabled={loading}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "none",
                color: "rgba(255,255,255,0.5)",
                fontSize: "0.65rem",
                padding: "0.2rem 0.25rem",
                width: "4rem",
              }}
            />
            {error && (
              <p style={{ fontSize: "0.55rem", color: "var(--danger)", margin: 0 }}>{error}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

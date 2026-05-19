"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Lock,
  Mail,
  Loader2,
  Eye,
  EyeOff,
  FlaskConical,
  Shield,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn(email, password);

      console.log("LOGIN SUCCESS:", res);

      if (res.session) {
        router.push("/admin/dashboard");
        router.refresh();
      } else {
        setError("Session tidak ditemukan");
      }
    } catch (err: any) {
      console.error("LOGIN ERROR:", err);
      setError(err.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{
        background:
          "linear-gradient(135deg, #020817 0%, #0f1f3d 50%, #020817 100%)",
      }}
    >
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-96 h-96 bg-blue-600/10 rounded-full -top-20 -left-20 blur-3xl" />
          <div className="absolute w-80 h-80 bg-blue-800/15 rounded-full bottom-20 -right-10 blur-3xl" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(59,130,246,0.05) 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative z-10 text-center">
          <div className="w-24 h-24 rounded-3xl bg-blue-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-600/30 animate-float">
            <img
              src="/logounimus.png"
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-5xl font-black text-white mb-3">
            Unimus <span className="text-gradient">Inventrack</span>
          </h1>
          <p className="text-blue-300/60 text-lg mb-2">
            Sistem Peminjaman Barang Laboratorium
          </p>
          <p className="text-blue-400/40 text-sm">
            Universitas Muhammadiyah Semarang
          </p>

          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Tracking", desc: "Real-time monitoring" },
              { label: "QR Code", desc: "Scan & verify" },
              { label: "Aman", desc: "Auth terproteksi" },
            ].map((f) => (
              <div
                key={f.label}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <p className="text-white font-bold text-sm">{f.label}</p>
                <p className="text-blue-400/50 text-xs mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-400/60 hover:text-blue-400 text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>

          {/* Card */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-xl shadow-blue-600/20">
                <img
                  src="/logounimus.png"
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <span className="text-blue-400 text-sm font-semibold">
                  Portal Admin
                </span>
              </div>
              <h2 className="text-white text-3xl font-black">Selamat Datang</h2>
              <p className="text-blue-300/50 text-sm mt-1">
                Masuk untuk mengelola data peminjaman
              </p>
            </div>

            {error && (
              <Alert
                variant="destructive"
                className="mb-5 bg-red-900/20 border-red-500/30"
              >
                <AlertDescription className="text-red-400 text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-white/70 text-sm font-medium"
                >
                  Email Admin
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400/50" />
                  <input
                    id="email"
                    type="email"
                    placeholder="admin@unimus.ac.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all text-sm disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-white/70 text-sm font-medium"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400/50" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full pl-11 pr-11 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all text-sm disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-400/50 hover:text-blue-400 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-blue-600/20 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Memproses...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" /> Masuk sebagai Admin
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-blue-400/30 text-xs mt-6">
              UIT v2.0 — Universitas Muhammadiyah Semarang
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

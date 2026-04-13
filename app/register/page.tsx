"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, User, Mail, Lock, Shield, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const resp = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role }),
      });

      if (resp.ok) {
        router.push("/login");
      } else {
        const data = await resp.json();
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black p-4">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/50 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-primary to-emerald-500/50"></div>
        <CardHeader className="space-y-1 text-center pt-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Shield className="size-10 text-emerald-500" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tight text-white uppercase">Request Clearance</CardTitle>
          <CardDescription className="text-zinc-400 font-medium">Initialize your profile in the OSINT network</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative group">
                <User className="absolute left-3 top-3 size-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  id="name"
                  placeholder="Full Name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-zinc-950/50 border-zinc-800 text-white pl-10 h-12 focus-visible:ring-emerald-500/50 transition-all"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative group">
                <Mail className="absolute left-3 top-3 size-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  id="email"
                  placeholder="name@organization.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-950/50 border-zinc-800 text-white pl-10 h-12 focus-visible:ring-emerald-500/50 transition-all"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative group">
                <Lock className="absolute left-3 top-3 size-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  id="password"
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-950/50 border-zinc-800 text-white pl-10 h-12 focus-visible:ring-emerald-500/50 transition-all"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Assigned Role</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="bg-zinc-950/50 border-zinc-800 text-white h-12 focus:ring-emerald-500/50">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectItem value="admin">Administrator (Full Access)</SelectItem>
                  <SelectItem value="maintainer">Maintainer (Scan + Read)</SelectItem>
                  <SelectItem value="customer">Customer (Read Only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <div className="text-sm text-destructive font-bold bg-destructive/10 p-3 rounded-lg border border-destructive/20">{error}</div>}
            <Button
              type="submit"
              className="w-full h-12 text-sm font-bold uppercase tracking-wider group bg-emerald-600 hover:bg-emerald-500 text-white"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin size-5" />
              ) : (
                <>
                  Create Profile
                  <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pb-8 border-t border-zinc-800/50 pt-4 bg-zinc-900/30">
          <div className="text-sm text-center">
             <span className="text-zinc-400">Already have clearance?</span>{" "}
             <Link href="/login" className="text-emerald-500 hover:underline font-bold transition-colors">Sign In</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

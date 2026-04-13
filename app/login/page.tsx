"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Bot, Lock, Mail, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/");
        router.refresh();
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
      
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/50 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-indigo-500 to-primary/50 animate-pulse"></div>
        <CardHeader className="space-y-1 text-center pt-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
              <Bot className="size-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tight text-white uppercase">CYB Control</CardTitle>
          <CardDescription className="text-zinc-400 font-medium">Authentication required to access intelligence</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative group">
                <Mail className="absolute left-3 top-3 size-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  placeholder="name@organization.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-950/50 border-zinc-800 text-white pl-10 h-12 focus-visible:ring-primary/50 transition-all border-zinc-700/50"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative group">
                <Lock className="absolute left-3 top-3 size-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-950/50 border-zinc-800 text-white pl-10 h-12 focus-visible:ring-primary/50 transition-all border-zinc-700/50"
                  required
                />
              </div>
            </div>
            {error && <div className="text-sm text-destructive font-bold bg-destructive/10 p-3 rounded-lg border border-destructive/20 animate-bounce">{error}</div>}
            <Button
              type="submit"
              className="w-full h-12 text-sm font-bold uppercase tracking-wider group transition-all overflow-hidden"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin size-5" />
              ) : (
                <>
                  Engage Authentication
                  <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pb-8 border-t border-zinc-800/50 pt-4 bg-zinc-900/30">
          <p className="text-xs text-center text-zinc-500 uppercase font-bold tracking-widest">
            Level 3 Security Clearance Active
          </p>
          <div className="text-sm text-center">
             <span className="text-zinc-400">Unauthorized access is prohibited.</span>{" "}
             <Link href="/register" className="text-primary hover:underline font-bold transition-colors">Register for Access</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

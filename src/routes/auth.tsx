import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AuthResponse } from "@/lib/types";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — NovaPOS" },
      { name: "description", content: "Sign in to manage your store, sales and inventory." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const [login, setLogin] = useState({ email: "", password: "" });
  const [register, setRegister] = useState({ name: "", email: "", password: "" });

  const handleAuth = async (path: string, body: Record<string, string>) => {
    setBusy(true);
    try {
      const res = await api<AuthResponse>(path, { method: "POST", body: JSON.stringify(body) });
      signIn(res.token, res.user);
      toast.success(`Welcome, ${res.user.name}`);
      void navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Store className="size-5" />
          </div>
          <h1 className="text-2xl font-semibold">NovaPOS</h1>
          <p className="text-sm text-muted-foreground">
            Retail POS &amp; inventory management
          </p>
        </div>

        <Card>
          <CardContent className="p-5">
            <Tabs defaultValue="login">
              <TabsList className="mb-4 grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign in</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-3">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    autoComplete="email"
                    value={login.email}
                    onChange={(e) => setLogin({ ...login, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    value={login.password}
                    onChange={(e) => setLogin({ ...login, password: e.target.value })}
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={busy || !login.email || !login.password}
                  onClick={() => void handleAuth("/auth/login", login)}
                >
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </TabsContent>

              <TabsContent value="register" className="space-y-3">
                <div>
                  <Label>Full name</Label>
                  <Input
                    autoComplete="name"
                    value={register.name}
                    onChange={(e) => setRegister({ ...register, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    autoComplete="email"
                    value={register.email}
                    onChange={(e) => setRegister({ ...register, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={register.password}
                    onChange={(e) => setRegister({ ...register, password: e.target.value })}
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={busy || !register.name || !register.email || !register.password}
                  onClick={() => void handleAuth("/auth/register", register)}
                >
                  {busy ? "Creating account…" : "Create account"}
                </Button>
              </TabsContent>
            </Tabs>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Requires POST /api/auth/login &amp; /api/auth/register on your backend.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

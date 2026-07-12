import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, UserRound } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";

export function TopBar() {
  const { user, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b bg-background/85 px-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
      </div>

      <div className="flex items-center gap-2">
        {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserRound className="size-4" />
                </span>
                <span className="hidden sm:inline">{user.name}</span>
                <Badge variant="secondary" className="hidden capitalize md:inline-flex">
                  {user.role}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {user.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  signOut();
                  void navigate({ to: "/auth" });
                }}
              >
                <LogOut className="size-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  );
}

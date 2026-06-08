import { Link, NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { Search, User, UserPlus, LayoutGrid, ChevronDown, Menu, LogOut, LayoutDashboard, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { navLinks } from "@/data/site";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

type Category = { id: string; name: string; slug: string };

export function SiteHeader() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const { user, loading, signOut, isAdmin } = useAuth();

  useEffect(() => {
    supabase
      .from("product_categories")
      .select("id, name, slug")
      .order("name", { ascending: true })
      .then(({ data }) => {
        if (data?.length) setCategories(data as Category[]);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur border-b border-border">
      <div className="border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[68px] gap-4">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img
  src="/images/logo.png"
  alt="Sammy Store"
  className="h-10 w-auto object-contain"
/>
            </Link>

            <div className="hidden md:flex flex-1 max-w-xl">
              <div className="relative w-full">
                <Input
                  type="text"
                  placeholder="Search accounts, categories…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-14 rounded-full border-border h-11 focus-visible:ring-brand-orange/30"
                />
                <button
                  type="button"
                  aria-label="Search"
                  className="absolute right-0 top-0 h-full px-5 bg-brand-orange text-white rounded-r-full hover:bg-brand-orange-hover transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {loading ? (
                <div className="h-9 w-24 rounded-md bg-muted animate-pulse" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 border-brand-navy/20">
                      <User className="w-4 h-4" />
                      <span className="hidden sm:inline max-w-[120px] truncate">{user.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer flex items-center">
                        <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/wallet" className="cursor-pointer flex items-center">
                        <Wallet className="w-4 h-4 mr-2" /> Wallet
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer flex items-center">
                          <LayoutGrid className="w-4 h-4 mr-2" /> Admin
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => signOut()}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="w-4 h-4 mr-2" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link
                    to="/auth?mode=login"
                    className="hidden sm:inline-flex items-center gap-2 text-brand-navy hover:text-brand-orange transition-colors font-medium text-sm"
                  >
                    <User className="w-4 h-4" />
                    Login
                  </Link>
                  <Button asChild className="bg-brand-orange hover:bg-brand-orange-hover text-white shadow-sm">
                    <Link to="/auth?mode=signup" className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      <span className="hidden xs:inline">Register</span>
                      <span className="xs:hidden">Join</span>
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[56px] gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-brand-orange hover:bg-brand-orange-hover text-white gap-2 h-10">
                <LayoutGrid className="w-4 h-4" />
                Category
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 max-h-72 overflow-y-auto">
              {categories.length === 0 ? (
                <DropdownMenuItem disabled className="text-muted-foreground text-sm">
                  Loading categories…
                </DropdownMenuItem>
              ) : (
                categories.map((category) => (
                  <DropdownMenuItem key={category.id} asChild>
                    <Link to={`/products?cat=${category.slug}`} className="cursor-pointer">
                      {category.name}
                    </Link>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  `text-brand-navy hover:text-brand-orange transition-colors font-medium text-[15px]${isActive ? " text-brand-orange" : ""}`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </div>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <div className="flex flex-col gap-1 mt-10 p-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className="text-brand-navy hover:text-brand-orange transition-colors font-medium text-lg py-3 border-b border-border"
                  >
                    {link.name}
                  </Link>
                ))}
                {categories.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Categories</p>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {categories.map((c) => (
                        <Link
                          key={c.id}
                          to={`/products?cat=${c.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="block text-brand-navy hover:text-brand-orange transition-colors text-sm py-2 border-b border-border/50"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

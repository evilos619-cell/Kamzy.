import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, User, UserPlus, LayoutGrid, ChevronDown, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { categories, navLinks } from "@/data/site";

export function SiteHeader() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur border-b border-border">
      {/* Top bar */}
      <div className="border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[68px] gap-4">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <span className="text-xl font-bold tracking-tight text-brand-navy">
                SAMMY <span className="text-brand-orange">STORE</span>
              </span>
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
              <Link
                to="/contact"
                className="hidden sm:inline-flex items-center gap-2 text-brand-navy hover:text-brand-orange transition-colors font-medium text-sm"
              >
                <User className="w-4 h-4" />
                Login
              </Link>
              <Button
                asChild
                className="bg-brand-orange hover:bg-brand-orange-hover text-white shadow-sm"
              >
                <Link to="/contact" className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden xs:inline">Register</span>
                  <span className="xs:hidden">Join</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Nav bar */}
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
            <DropdownMenuContent align="start" className="w-64">
              {categories.map((category) => (
                <DropdownMenuItem key={category.id} asChild>
                  <Link to="/products" className="cursor-pointer">
                    {category.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.to}
                className="text-brand-navy hover:text-brand-orange transition-colors font-medium text-[15px]"
                activeProps={{ className: "text-brand-orange" }}
                activeOptions={{ exact: link.to === "/" }}
              >
                {link.name}
              </Link>
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
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

"use client";

import React, { use, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  Store,
  ShoppingCart,
  Package,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Star,
  Zap,
  ShieldCheck,
  Layers,
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  Building2,
  Sparkles,
  HelpCircle,
  Send,
  Users,
  Coffee,
  ShoppingBag,
  Cpu,
  Receipt,
  Check,
} from "lucide-react";
import Title from "@/components/Title";

type Props = {
  params: Promise<{ locale: string }>;
};

const businessTypes = [
  {
    icon: ShoppingBag,
    name: "Retail Stores",
    desc: "Apparel, electronics & general retail",
  },
  {
    icon: Store,
    name: "Grocery & Supermarkets",
    desc: "Barcode scanning & fast bulk checkout",
  },
  {
    icon: Coffee,
    name: "Restaurants & Cafes",
    desc: "Quick order billing & customer receipts",
  },
  {
    icon: Building2,
    name: "Convenience Stores",
    desc: "High-volume daily sales & stock management",
  },
  {
    icon: Cpu,
    name: "Electronics & Hardware",
    desc: "Serial tracking & category inventory",
  },
  {
    icon: Users,
    name: "Boutiques & Specialty",
    desc: "Tailored customer billing & multi-item carts",
  },
];

const testimonials = [
  {
    name: "Marcus Vance",
    role: "Owner, Metro Fresh Market",
    content:
      "One Shop POS transformed our checkout speed completely. Stock updates instantly as items are scanned, saving us hours of manual counting every week.",
    rating: 5,
  },
  {
    name: "Elena Rostova",
    role: "Founder, Urban Boutique",
    content:
      "The clean dashboard and clear sales reports help me track top-selling products effortlessly. Setting up our shop took less than two minutes!",
    rating: 5,
  },
  {
    name: "David Chen",
    role: "Manager, Apex Convenience",
    content:
      "Multiple line-item discounts and instant invoice printing have made our cashiers twice as fast. Highly recommended for any retail business.",
    rating: 5,
  },
];

const faqList = [
  {
    question: "How does One Shop POS benefit my retail business?",
    answer:
      "One Shop POS streamlines sales processing, automates inventory tracking, and provides real-time revenue analytics. It eliminates manual errors, speeds up customer checkout, and keeps your stock levels synced automatically.",
  },
  {
    question: "Can I manage multiple shops under a single account?",
    answer:
      "Yes! One Shop POS is built as a multi-tenant platform. You can create and switch between multiple shop profiles from the top navigation bar, keeping inventory and sales data cleanly isolated.",
  },
  {
    question: "Do I need special IT knowledge or hardware to get started?",
    answer:
      "Not at all. One Shop POS works directly in any standard web browser on laptop, tablet, or desktop. Simply sign up, enter your shop details in the 1-minute onboarding, and start ringing up sales.",
  },
  {
    question: "What kind of sales analytics and receipt features are included?",
    answer:
      "You get access to total revenue metrics, sales count histories, line-item itemization, discount tracking, and instant PDF/printable thermal invoices for every transaction.",
  },
  {
    question: "How does real-time stock deduction work during checkout?",
    answer:
      "When a cashier adds products to an order and places the sale, our backend service automatically decrements the stock quantity for each purchased item in real-time.",
  },
];

export default function HomePage({ params }: Props) {
  const { locale } = use(params);
  const router = useRouter();
  const t = useTranslations("HomePage");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Contact form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setContactSubject("");
      setContactMessage("");
      setContactSubmitted(false);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground">
      <Title>Home</Title>
      {/* Header Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <a href="#" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shadow-sm transition-transform group-hover:scale-105">
                <Store className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight leading-tight">
                  One Shop POS
                </span>
                <span className="text-[10px] text-muted-foreground tracking-widest uppercase font-medium">
                  Supermarket & Retail POS
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a
              href="#"
              className="text-foreground hover:text-primary transition-colors"
            >
              Home
            </a>
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </a>
            <a
              href="#testimonials"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Testimonials
            </a>
            <a
              href="#faq"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              FAQ
            </a>
            <a
              href="#contact"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </nav>

          {/* Header Actions */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard")}
            >
              Dashboard
            </Button>
            <Button
              size="sm"
              className="shadow-sm font-semibold"
              onClick={() => router.push("/dashboard")}
            >
              Get Started
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-background px-4 pt-2 pb-6 space-y-4">
            <nav className="flex flex-col space-y-3 text-sm font-medium">
              <a
                href="#"
                className="px-2 py-1.5 rounded-md hover:bg-muted text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </a>
              <a
                href="#features"
                className="px-2 py-1.5 rounded-md hover:bg-muted text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#pricing"
                className="px-2 py-1.5 rounded-md hover:bg-muted text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <a
                href="#testimonials"
                className="px-2 py-1.5 rounded-md hover:bg-muted text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Testimonials
              </a>
              <a
                href="#faq"
                className="px-2 py-1.5 rounded-md hover:bg-muted text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </a>
              <a
                href="#contact"
                className="px-2 py-1.5 rounded-md hover:bg-muted text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </a>
            </nav>
            <Separator />
            <div className="flex flex-col gap-2 pt-2">
              <Button
                className="w-full justify-center"
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push("/dashboard");
                }}
              >
                Get Started
              </Button>
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push("/dashboard");
                }}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-28 border-b border-border/40 bg-gradient-to-b from-muted/20 to-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Content */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="px-3 py-1 text-xs gap-1.5 font-medium tracking-wide uppercase border-primary/30 bg-primary/5 text-primary"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Next-Gen Cloud POS
                    Solution
                  </Badge>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]">
                  Maximize sales with our advanced POS software solutions
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg max-w-2xl leading-relaxed">
                  Revolutionize your retail and supermarket operations. Track
                  real-time inventory stock, execute lightning-fast cashier
                  checkouts, and manage your store seamlessly from one intuitive
                  platform.
                </p>

                {/* Action CTAs */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Button
                    size="lg"
                    className="px-7 py-6 text-base font-semibold shadow-md gap-2"
                    onClick={() => router.push("/dashboard")}
                  >
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-7 py-6 text-base font-medium"
                    onClick={() => router.push("/dashboard")}
                  >
                    Sign In
                  </Button>
                </div>

                {/* Quick Key Highlights */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/60 max-w-xl">
                  <div>
                    <p className="text-2xl font-bold text-foreground">100%</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Stock Accuracy
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      &lt; 2 Mins
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Store Onboarding
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      Multi-Tenant
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Active Store Isolation
                    </p>
                  </div>
                </div>
              </div>

              {/* Right POS Mockup Preview Card */}
              <div className="lg:col-span-5">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  <Card className="shadow-2xl border-border bg-card overflow-hidden">
                    <CardHeader className="bg-muted/40 border-b border-border/60 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-red-500/80" />
                          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                          <div className="h-3 w-3 rounded-full bg-green-500/80" />
                          <span className="text-xs font-semibold ml-2 text-muted-foreground">
                            POS Terminal Workstation
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          Live Register
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4 text-left">
                      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                            Active Store
                          </p>
                          <p className="text-base font-bold text-foreground">
                            Metro Mart & POS
                          </p>
                        </div>
                        <Store className="h-6 w-6 text-primary" />
                      </div>

                      <div className="space-y-2 border-t border-b border-border/60 py-3 text-xs">
                        <div className="flex justify-between font-medium text-muted-foreground">
                          <span>Item</span>
                          <span>Qty</span>
                          <span>Total</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Organic Whole Milk 1L</span>
                          <span>x2</span>
                          <span>$7.98</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Whole Grain Bread</span>
                          <span>x1</span>
                          <span>$3.50</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Arabica Coffee Beans 500g</span>
                          <span>x1</span>
                          <span>$14.99</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span className="text-xs text-muted-foreground block font-medium">
                            Grand Total
                          </span>
                          <span className="text-2xl font-black text-primary">
                            $26.47
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className="font-bold shadow-xs gap-1.5"
                          onClick={() => router.push("/dashboard")}
                        >
                          <Receipt className="h-4 w-4" /> Print Invoice
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: WHY CHOOSE US / GROW YOUR BUSINESS */}
        <section className="py-16 md:py-24 bg-muted/30 border-b border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
            <div className="max-w-3xl mx-auto space-y-3">
              <Badge
                variant="secondary"
                className="px-3 py-1 text-xs uppercase font-medium"
              >
                Why One Shop POS
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Grow Your Business With One Shop POS
              </h2>
              <p className="text-muted-foreground text-base">
                Delightfully simple and deceptively powerful point of sale
                system designed to scale your store operations effortlessly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
              {/* Card 1 */}
              <Card className="hover:shadow-md transition-shadow border-border bg-card">
                <CardHeader className="space-y-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg font-bold">
                    Suitable For All Businesses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Whether you manage a single retail store, a busy
                    supermarket, or a specialty cafe, our POS adapts seamlessly
                    to your workflow.
                  </p>
                </CardContent>
              </Card>

              {/* Card 2 */}
              <Card className="hover:shadow-md transition-shadow border-border bg-card">
                <CardHeader className="space-y-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <Zap className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg font-bold">
                    Cost Effective & Transparent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Enjoy transparent pricing plans with zero hidden fees. Start
                    100% free with 1 shop limit and upgrade as your business
                    expands.
                  </p>
                </CardContent>
              </Card>

              {/* Card 3 */}
              <Card className="hover:shadow-md transition-shadow border-border bg-card">
                <CardHeader className="space-y-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg font-bold">
                    Easy Setup & No IT Needed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Get up and running in under 2 minutes. No complicated
                    database installations or specialized hardware maintenance
                    required.
                  </p>
                </CardContent>
              </Card>

              {/* Card 4 */}
              <Card className="hover:shadow-md transition-shadow border-border bg-card">
                <CardHeader className="space-y-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg font-bold">
                    Modern & Intuitive Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Fast cashier billing UI designed for high-speed checkout,
                    barcode scanning, line-item discount overrides, and quick
                    stock updates.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* SECTION 3: KEY FEATURES */}
        <section
          id="features"
          className="py-16 md:py-24 border-b border-border/40"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <Badge
                variant="outline"
                className="px-3 py-1 text-xs uppercase font-medium"
              >
                Software Key Features
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Powerful Features with Incredible Design
              </h2>
              <p className="text-muted-foreground text-base">
                Analyze large volumes of inventory and transaction data quickly
                and accurately with our core POS engine.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <Card className="border-border bg-card hover:border-primary/50 transition-colors shadow-xs">
                <CardHeader className="space-y-4">
                  <span className="text-4xl font-black text-primary/30">
                    01
                  </span>
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Inventory Management
                    </CardTitle>
                    <CardDescription>
                      Real-time stock tracking & alerts
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Maintain complete visibility over your stock levels. Receive
                    automated low-stock warnings, add product categories, and
                    manage item prices easily.
                  </p>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Automatic inventory deduction on sales</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Low stock indicator threshold</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="border-border bg-card hover:border-primary/50 transition-colors shadow-xs">
                <CardHeader className="space-y-4">
                  <span className="text-4xl font-black text-primary/30">
                    02
                  </span>
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                      Sales & Payment Process
                    </CardTitle>
                    <CardDescription>
                      Rapid cashier checkout register
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Process sales transactions swiftly. Calculate itemized
                    subtotals, apply percentage discounts, capture customer
                    contact details, and issue printed receipts.
                  </p>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Custom discount percentage overrides</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Instant receipt modal & printing</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="border-border bg-card hover:border-primary/50 transition-colors shadow-xs">
                <CardHeader className="space-y-4">
                  <span className="text-4xl font-black text-primary/30">
                    03
                  </span>
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Report and Analysis
                    </CardTitle>
                    <CardDescription>
                      Comprehensive sales history
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Understand business performance at a glance. Review
                    historical orders, track gross revenue totals, search
                    transactions by customer name, and delete void sales.
                  </p>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Revenue aggregation & metrics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Searchable sales history ledger</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* SECTION 4: TARGET INDUSTRIES ("WHO CAN USE OUR POS") */}
        <section className="py-16 md:py-24 bg-muted/30 border-b border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <Badge
                variant="secondary"
                className="px-3 py-1 text-xs uppercase font-medium"
              >
                Target Industries
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Who Can Use One Shop POS
              </h2>
              <p className="text-muted-foreground text-base">
                Our software is built to accommodate a wide spectrum of retail
                models and commercial operations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {businessTypes.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-xl bg-card border border-border flex items-start gap-4 shadow-xs hover:border-primary/40 transition-colors"
                  >
                    <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-base">
                        {item.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 5: PRICING */}
        <section hidden 
          id="pricing"
          className="py-16 md:py-24 border-b border-border/40"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <Badge
                variant="outline"
                className="px-3 py-1 text-xs uppercase font-medium"
              >
                Our Pricing
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Transparent Pricing Plans
              </h2>
              <p className="text-muted-foreground text-base">
                Find the perfect fit for your retail needs. Clear features with
                no hidden charges.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {/* Plan 1: Starter */}
              <Card className="flex flex-col justify-between border-border bg-card">
                <CardHeader className="space-y-2">
                  <Badge variant="secondary" className="w-fit text-xs">
                    Starter
                  </Badge>
                  <CardTitle className="text-2xl font-bold">
                    For Single Shop
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Ideal for small retail stores getting started.
                  </CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-extrabold text-foreground">
                      $0
                    </span>
                    <span className="text-muted-foreground text-sm font-medium">
                      {" "}
                      / month
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm flex-1 pt-4">
                  <ul className="space-y-2.5 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>1 Shop active management</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>Full inventory stock tracking</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>Sales ledger & history</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>Printable thermal receipts</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full font-semibold"
                    onClick={() => router.push("/dashboard")}
                  >
                    Choose Free Plan
                  </Button>
                </CardFooter>
              </Card>

              {/* Plan 2: Standard (Most Popular) */}
              <Card className="flex flex-col justify-between border-primary shadow-md bg-card relative">
                <div className="absolute top-2 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground font-bold text-[11px] px-3">
                    Most Popular
                  </Badge>
                </div>
                <CardHeader className="space-y-2 pt-8">
                  <Badge
                    variant="outline"
                    className="w-fit text-xs border-primary/40 text-primary"
                  >
                    Standard
                  </Badge>
                  <CardTitle className="text-2xl font-bold">
                    For Growing Stores
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Comprehensive tools for active merchants.
                  </CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-extrabold text-foreground">
                      $24
                    </span>
                    <span className="text-muted-foreground text-sm font-medium">
                      {" "}
                      / month
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm flex-1 pt-4">
                  <ul className="space-y-2.5 text-xs text-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>Everything in Starter plan</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>Unlimited product inventory</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>Barcode scanning support</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>Advanced revenue analytics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>Priority 24/7 store support</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full font-bold shadow-xs"
                    onClick={() => router.push("/dashboard")}
                  >
                    Get started
                  </Button>
                </CardFooter>
              </Card>

              {/* Plan 3: Professional */}
              <Card className="flex flex-col justify-between border-border bg-card">
                <CardHeader className="space-y-2">
                  <Badge variant="secondary" className="w-fit text-xs">
                    Professional
                  </Badge>
                  <CardTitle className="text-2xl font-bold">
                    Enterprise Level
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Multi-location businesses and store chains.
                  </CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-extrabold text-foreground">
                      $49
                    </span>
                    <span className="text-muted-foreground text-sm font-medium">
                      {" "}
                      / month
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm flex-1 pt-4">
                  <ul className="space-y-2.5 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>Multi-shop tenant switching</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>Custom shop receipt branding</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>Bulk inventory export/import</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>Dedicated account manager</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full font-semibold"
                    onClick={() => router.push("/dashboard")}
                  >
                    Contact Enterprise
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* SECTION 6: TESTIMONIALS */}
        <section
          id="testimonials"
          className="py-16 md:py-24 bg-muted/30 border-b border-border/40"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <Badge
                variant="secondary"
                className="px-3 py-1 text-xs uppercase font-medium"
              >
                Customer Feedback
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Voices of Delight
              </h2>
              <p className="text-muted-foreground text-base">
                Read how store owners and retail managers rely on One Shop POS
                every day.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((item, idx) => (
                <Card
                  key={idx}
                  className="border-border bg-card flex flex-col justify-between p-2 shadow-xs"
                >
                  <CardHeader className="space-y-3 pb-2">
                    <div className="flex gap-1 text-amber-500">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-amber-500 text-amber-500"
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground italic leading-relaxed">
                      "{item.content}"
                    </p>
                  </CardHeader>
                  <CardFooter className="pt-4 border-t border-border/60">
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.role}
                      </p>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 7: BOTTOM CTA */}
        <section className="py-16 md:py-20 border-b border-border/40 bg-card">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <Badge
              variant="outline"
              className="px-3 py-1 text-xs uppercase font-medium border-primary/40 text-primary"
            >
              Get Started Today
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Upgrade Your Business with Our Cutting-Edge POS Solutions!
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Experience the future of store transactions! Launch your store
              register today and witness how our POS solution can revolutionize
              your business.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Button
                size="lg"
                className="font-bold px-8 shadow-sm"
                onClick={() => router.push("/dashboard")}
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="font-medium px-8"
                onClick={() => router.push("/dashboard")}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </section>

        {/* SECTION 8: FAQ */}
        <section
          id="faq"
          className="py-16 md:py-24 bg-muted/30 border-b border-border/40"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center space-y-3">
              <Badge
                variant="outline"
                className="px-3 py-1 text-xs uppercase font-medium"
              >
                Have Any Questions?
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground text-sm">
                Everything you need to know about our POS system and tenant
                management.
              </p>
            </div>

            <Card className="border-border bg-card p-6 shadow-xs">
              <Accordion className="w-full">
                {faqList.map((faq, idx) => (
                  <AccordionItem key={idx} value={`item-${idx}`}>
                    <AccordionTrigger className="text-base font-semibold text-foreground hover:no-underline py-4">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          </div>
        </section>

        {/* SECTION 9: CONTACT US */}
        <section
          id="contact"
          className="py-16 md:py-24 border-b border-border/40"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <Badge
                variant="outline"
                className="px-3 py-1 text-xs uppercase font-medium"
              >
                Contact Us
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Get in Touch! Reach Out to Us Today
              </h2>
              <p className="text-muted-foreground text-base">
                Have inquiries about custom retail setups or need technical
                assistance? Fill in the form below.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Contact Information Side */}
              <div className="lg:col-span-5 space-y-4">
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      Direct Support Channels
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Our customer support team is available 24/7.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60">
                      <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Email Support
                        </p>
                        <p className="font-semibold text-foreground">
                          support@oneshoppos.com
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60">
                      <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Phone Hotline
                        </p>
                        <p className="font-semibold text-foreground">
                          +1 (800) 555-0199
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60">
                      <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Headquarters
                        </p>
                        <p className="font-semibold text-foreground">
                          100 Commerce Plaza, Suite 400
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Form Side */}
              <div className="lg:col-span-7">
                <Card className="border-border shadow-xs">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">
                      Send Us a Message
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Fill out your details and our team will get back to you
                      within 24 hours.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {contactSubmitted ? (
                      <div className="p-6 text-center space-y-2 bg-emerald-500/10 text-emerald-600 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="h-8 w-8 mx-auto" />
                        <p className="font-bold text-base">
                          Thank you for reaching out!
                        </p>
                        <p className="text-xs text-emerald-600/90">
                          Your message has been received. One of our POS
                          specialists will contact you shortly.
                        </p>
                      </div>
                    ) : (
                      <form
                        onSubmit={handleContactSubmit}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="c_name">Full Name *</Label>
                            <Input
                              id="c_name"
                              required
                              placeholder="John Doe"
                              value={contactName}
                              onChange={(e) => setContactName(e.target.value)}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="c_email">Email Address *</Label>
                            <Input
                              id="c_email"
                              type="email"
                              required
                              placeholder="john@example.com"
                              value={contactEmail}
                              onChange={(e) => setContactEmail(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="c_phone">Mobile Number</Label>
                            <Input
                              id="c_phone"
                              placeholder="+1 (555) 000-0000"
                              value={contactPhone}
                              onChange={(e) => setContactPhone(e.target.value)}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="c_subject">Subject</Label>
                            <Input
                              id="c_subject"
                              placeholder="Inquiry about POS plans"
                              value={contactSubject}
                              onChange={(e) =>
                                setContactSubject(e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="c_msg">
                            Write Store Details / Message *
                          </Label>
                          <Textarea
                            id="c_msg"
                            required
                            rows={4}
                            placeholder="Tell us about your business type, store locations, or specific features needed..."
                            value={contactMessage}
                            onChange={(e) => setContactMessage(e.target.value)}
                            className="resize-none"
                          />
                        </div>

                        <Button
                          type="submit"
                          className="w-full font-bold gap-2"
                        >
                          <Send className="h-4 w-4" /> Send Message
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border bg-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand Column */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  <Store className="h-4 w-4" />
                </div>
                <span className="font-bold text-base tracking-tight">
                  One Shop POS
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ultimate point of sale solution to transform retail store
                operations into a streamlined and efficient powerhouse.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                Quick Links
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="#features"
                    className="hover:text-foreground transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-foreground transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#testimonials"
                    className="hover:text-foreground transition-colors"
                  >
                    Testimonials
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    className="hover:text-foreground transition-colors"
                  >
                    FAQ
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="hover:text-foreground transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Solutions */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                Solutions
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <span>Inventory Tracking</span>
                </li>
                <li>
                  <span>Multi-Tenant Shops</span>
                </li>
                <li>
                  <span>Printable Invoices</span>
                </li>
                <li>
                  <span>Barcode Checkout</span>
                </li>
                <li>
                  <span>Revenue Metrics</span>
                </li>
              </ul>
            </div>

            {/* Subscribe Newsletter */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                Subscribe Newsletter
              </p>
              <p className="text-xs text-muted-foreground">
                Stay updated with our latest POS features and retail tips.
              </p>
              <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Your email address"
                  className="text-xs h-9"
                />
                <Button size="sm" className="h-9 px-3 font-semibold">
                  Send
                </Button>
              </form>
            </div>
          </div>

          <Separator className="mb-6" />

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
            <p>© Copyright 2026. One Shop POS. All rights reserved.</p>
            <p className="text-[11px]">
              Powered by Supermarket & Retail POS Engine
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

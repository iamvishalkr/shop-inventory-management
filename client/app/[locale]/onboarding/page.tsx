"use client";

import React, { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api";
import { useShop } from "@/store/shop-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Store,
  Building2,
  MapPin,
  Phone,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import Title from "@/components/Title";

export default function OnboardingPage() {
  const router = useRouter();
  const { refreshShops } = useShop();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Shop name is required");
      return;
    }

    try {
      setLoading(true);
      const res = await apiFetch<{ success: boolean; shop: { id: string } }>(
        "/api/shops/onboarding",
        {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            address: address.trim() || undefined,
            phone: phone.trim() || undefined,
            currency,
          }),
        }
      );

      if (res.shop?.id) {
        localStorage.setItem("active_shop_id", res.shop.id);
        await refreshShops();
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create shop. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 text-foreground">
      <Title>Onboarding</Title>
      <Card className="w-full max-w-xl shadow-lg border-border">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                Welcome to Supermarket POS
              </CardTitle>
              <CardDescription>
                Set up your shop details to get started
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shop-name">
                Shop / Business Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="shop-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Metro Mart & POS"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 890"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                  <select
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="RON">RON (lei)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Store Address / Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  placeholder="123 Commerce St, Suite 100"
                  className="pl-9 resize-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-6"
              size="lg"
            >
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  <span>Creating Shop...</span>
                </>
              ) : (
                <>
                  <span>Complete Setup & Launch POS</span>
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

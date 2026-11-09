"use client";

import React from "react";
import { UserCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CustomerFormProps {
  custName: string;
  setCustName: (val: string) => void;
  custContact: string;
  setCustContact: (val: string) => void;
  custEmail: string;
  setCustEmail: (val: string) => void;
  onFillWalkIn: () => void;
}

export function CustomerForm({
  custName,
  setCustName,
  custContact,
  setCustContact,
  custEmail,
  setCustEmail,
  onFillWalkIn,
}: CustomerFormProps) {
  return (
    <Card className="shadow-xs border-border/80">
      <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">
            Customer Details
          </CardTitle>
          <CardDescription className="text-xs">
            Billing information for invoice receipt.
          </CardDescription>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onFillWalkIn}
          className="h-7 text-xs gap-1"
          title="Quick fill for walk-in retail customer"
        >
          <UserCheck className="h-3.5 w-3.5 text-primary" />
          Walk-in
        </Button>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <div className="space-y-1">
          <Label htmlFor="pos_cust_name" className="text-xs font-medium">
            Customer Name *
          </Label>
          <Input
            id="pos_cust_name"
            value={custName}
            onChange={(e) => setCustName(e.target.value)}
            placeholder="e.g. John Doe or Walk-in"
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="pos_cust_contact" className="text-xs font-medium">
            Contact Phone (10 digits) *
          </Label>
          <Input
            id="pos_cust_contact"
            type="text"
            maxLength={10}
            value={custContact}
            onChange={(e) => setCustContact(e.target.value.replace(/\D/g, ""))}
            placeholder="9876543210"
            className="h-9 text-sm font-mono"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="pos_cust_email" className="text-xs font-medium">
            Customer Email *
          </Label>
          <Input
            id="pos_cust_email"
            type="email"
            value={custEmail}
            onChange={(e) => setCustEmail(e.target.value)}
            placeholder="customer@example.com"
            className="h-9 text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}


"use client";

import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import type { Sale } from "@/types/shop";
import { formatPrice } from "@/utils/price";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    padding: 30,
    fontFamily: "Helvetica",
  },
  headerSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#64748B",
  },
  boxesRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  boxHeader: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 4,
    padding: 10,
    width: "48%",
  },
  boxTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#334155",
    marginBottom: 6,
  },
  boxText: {
    fontSize: 10,
    color: "#475569",
    marginBottom: 3,
  },
  table: {
    width: "100%",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 4,
  },
  row: {
    display: "flex",
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    minHeight: 24,
    alignItems: "center",
  },
  headerRow: {
    backgroundColor: "#F1F5F9",
  },
  bold: {
    fontWeight: "bold",
  },
  col1: { width: "8%", fontSize: 9, padding: 4, textAlign: "center" },
  col2: { width: "37%", fontSize: 9, padding: 4 },
  col3: { width: "12%", fontSize: 9, padding: 4, textAlign: "center" },
  col4: { width: "15%", fontSize: 9, padding: 4, textAlign: "right" },
  col5: { width: "13%", fontSize: 9, padding: 4, textAlign: "right" },
  col6: { width: "15%", fontSize: 9, padding: 4, textAlign: "right" },
  totalLabel: {
    width: "85%",
    fontSize: 10,
    padding: 6,
    textAlign: "right",
    fontWeight: "bold",
  },
  totalAmount: {
    width: "15%",
    fontSize: 10,
    padding: 6,
    textAlign: "right",
    fontWeight: "bold",
    color: "#0F172A",
  },
});

interface PdfDocumentProps {
  sale: Sale;
  grandTotal: string;
}

function InvoicePdfDocument({ sale, grandTotal }: PdfDocumentProps) {
  const invoiceCode = sale.id.slice(-6).toUpperCase();
  return (
    <Document title={`Invoice_${invoiceCode}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>INVOICE</Text>
          <Text style={styles.subtitle}>
            Invoice #{invoiceCode} | ID: {sale.id}
          </Text>
        </View>

        <View style={styles.boxesRow}>
          <View style={styles.boxHeader}>
            <Text style={styles.boxTitle}>Billing Information</Text>
            <Text style={styles.boxText}>Shop Admin Store</Text>
            <Text style={styles.boxText}>123 Main Street</Text>
            <Text style={styles.boxText}>Anytown, CA 12345</Text>
            <Text style={styles.boxText}>Phone: (555) 555-5555</Text>
          </View>

          <View style={styles.boxHeader}>
            <Text style={styles.boxTitle}>Client Information</Text>
            <Text style={styles.boxText}>Name: {sale.cust_name}</Text>
            <Text style={styles.boxText}>Email: {sale.cust_email}</Text>
            <Text style={styles.boxText}>Contact: {sale.cust_contact}</Text>
          </View>
        </View>

        <Text
          style={{
            fontSize: 12,
            fontWeight: "bold",
            color: "#334155",
            marginTop: 10,
            marginBottom: 5,
          }}
        >
          Order Items
        </Text>

        <View style={styles.table}>
          <View style={[styles.row, styles.headerRow, styles.bold]}>
            <Text style={styles.col1}>#</Text>
            <Text style={styles.col2}>Description</Text>
            <Text style={styles.col3}>Qty</Text>
            <Text style={styles.col4}>Unit Price</Text>
            <Text style={styles.col5}>Disc %</Text>
            <Text style={styles.col6}>Amount</Text>
          </View>

          {sale.cartItems.map((item, i) => (
            <View key={i} style={styles.row} wrap={false}>
              <Text style={styles.col1}>{i + 1}</Text>
              <Text style={styles.col2}>{item.c_name}</Text>
              <Text style={styles.col3}>{item.c_quantity}</Text>
              <Text style={styles.col4}>
                {formatPrice(item.c_unit_price, "Rs.")}
              </Text>
              <Text style={styles.col5}>{item.c_discount}%</Text>
              <Text style={styles.col6}>
                {formatPrice(item.c_subtotal, "Rs.")}
              </Text>
            </View>
          ))}

          <View style={[styles.row, styles.bold]} wrap={false}>
            <Text style={styles.totalLabel}>Grand Total:</Text>
            <Text style={styles.totalAmount}>{grandTotal}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export function InvoicePdfDownload({ sale, grandTotal }: PdfDocumentProps) {
  const invoiceCode = sale.id.slice(-6).toUpperCase();
  return (
    <PDFDownloadLink
      document={<InvoicePdfDocument sale={sale} grandTotal={grandTotal} />}
      fileName={`Invoice_${invoiceCode}.pdf`}
    >
      {({ loading }) => (
        <Button disabled={loading} className="gap-2">
          <Download className="h-4 w-4" />
          {loading ? "Generating PDF..." : "Download Invoice PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}

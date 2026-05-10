"use client";

import React from "react";
import { Transaction, StoreProfile } from "@/lib/db";

interface ReceiptItem {
  name: string;
  qty: number;
  unit: string;
  price: number;
  subtotal: number;
}

interface ReceiptViewProps {
  transaction: Transaction;
  items: ReceiptItem[];
  profile: StoreProfile | null | undefined;
  receiptRef?: React.RefObject<HTMLDivElement | null>;
}

export default function ReceiptView({ transaction, items, profile, receiptRef }: ReceiptViewProps) {
  return (
    <div 
      id="receipt-print" 
      ref={receiptRef} 
      style={{ 
        backgroundColor: "#ffffff", 
        color: "#333333", 
        padding: "24px", 
        borderRadius: "12px", 
        border: "1px dashed #e5e7eb", 
        fontFamily: "monospace", 
        fontSize: "11px", 
        lineHeight: "1.6" 
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "16px" }}>
        <p style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", margin: "0 0 4px 0" }}>{profile?.name}</p>
        <p style={{ opacity: 0.7, margin: "0" }}>{profile?.address}</p>
        <p style={{ opacity: 0.7, margin: "0" }}>Telp: {profile?.phone}</p>
      </div>

      <div style={{ borderBottom: "1px dashed #cccccc", margin: "12px 0" }} />

      <div style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>No: {transaction.id}</span>
          <span>{new Date(transaction.date).toLocaleDateString("id-ID")}</span>
        </div>
        {transaction.orderType && (
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", marginTop: "4px" }}>
            <span>Tipe:</span>
            <span>{transaction.orderType === "DINE_IN" ? "DINE IN" : "TAKEAWAY"}</span>
          </div>
        )}
        {transaction.customerName && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Plg: {transaction.customerName}</span>
            {transaction.tableNumber && <span>Meja: {transaction.tableNumber}</span>}
          </div>
        )}
        {transaction.customerPhone && <div>HP: {transaction.customerPhone}</div>}
      </div>

      <div style={{ borderBottom: "1px dashed #cccccc", margin: "12px 0" }} />

      <div style={{ marginBottom: "12px" }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ marginBottom: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
              <span>{item.name}</span>
              <span>{item.subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div style={{ opacity: 0.7 }}>
              {item.qty} {item.unit} x {item.price.toLocaleString("id-ID")}
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderBottom: "1px dashed #cccccc", margin: "12px 0" }} />

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "bold" }}>
          <span>TOTAL</span>
          <span>Rp {transaction.total.toLocaleString("id-ID")}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.7 }}>
          <span>Metode</span>
          <span>{transaction.paymentMethod}</span>
        </div>
        {transaction.paymentMethod === "CASH" && transaction.cashTendered !== undefined && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.7 }}>
              <span>Bayar</span>
              <span>{transaction.cashTendered.toLocaleString("id-ID")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.7, fontWeight: "bold" }}>
              <span>Kembali</span>
              <span>{(transaction.cashChange || 0).toLocaleString("id-ID")}</span>
            </div>
          </>
        )}
      </div>

      <div style={{ borderBottom: "1px dashed #cccccc", margin: "12px 0" }} />

      <div style={{ textAlign: "center", opacity: 0.7, marginTop: "16px", fontStyle: "italic" }}>
        <p style={{ margin: "0" }}>Terima Kasih Telah Berbelanja</p>
        <p style={{ margin: "0" }}>Di {profile?.name}</p>
      </div>
    </div>
  );
}

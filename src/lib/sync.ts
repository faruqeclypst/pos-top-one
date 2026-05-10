import { Transaction } from "./db";

export async function syncToGoogleSheets(url: string, transaction: Transaction) {
  try {
    const response = await fetch(url, {
      method: "POST",
      mode: "no-cors", // Required for GAS Web Apps if not handling CORS specifically
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transaction),
    });
    
    // Note: With mode: 'no-cors', we can't read the response body, 
    // but the request will still reach the server and be processed.
    return true;
  } catch (error) {
    console.error("Sync to Google Sheets failed:", error);
    return false;
  }
}

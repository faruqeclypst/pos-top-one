import db from "./db";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const SCOPES = "openid email profile";

let tokenClient: any = null;
let gapiInited = false;
let gsisInited = false;
let currentAccessToken: string | null = null;
let initPromise: Promise<void> | null = null;

export function initGoogleApi(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = new Promise<void>(async (resolvePromise) => {
    // Timeout fallback - don't block if Google scripts take too long
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn("initGoogleApi timeout - continuing without Google API");
        resolvePromise();
      }
    }, 5000);

    // 0. Initialize Capacitor Google Auth
    try {
      await GoogleAuth.initialize({
        clientId: CLIENT_ID,
        scopes: SCOPES.split(" "),
        grantOfflineAccess: true,
      });
    } catch (e) {
      console.warn("GoogleAuth initialize skipped or failed", e);
    }

    // 1. Skip web-only script checks if on native
    if (Capacitor.isNativePlatform()) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolvePromise();
      }
      return;
    }

    // 2. Wait for web scripts to be available on window (WEB ONLY)
    await new Promise<void>((resolve) => {
      const check = () => {
        if ((window as any).gapi?.load && (window as any).google?.accounts?.oauth2) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve();
          }
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });

    if (gapiInited && gsisInited) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolvePromise();
      }
      return;
    }

    // 2. Initialize GAPI Client
    (window as any).gapi.load('client', async () => {
      try {
        await (window as any).gapi.client.init({
          discoveryDocs: [
            "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
            "https://sheets.googleapis.com/$discovery/rest?version=v4"
          ],
        });
        gapiInited = true;
      } catch (e) {
        console.warn("GAPI client init failed", e);
      }
      if (!resolved && gsisInited) {
        resolved = true;
        clearTimeout(timeout);
        resolvePromise();
      }
    });

    // 3. Initialize Google Identity Services
    try {
      tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (resp: any) => {
          if (resp.access_token) {
            currentAccessToken = resp.access_token;
          }
        },
      });
      gsisInited = true;
    } catch (e) {
      console.warn("GSIS init failed", e);
    }
    if (!resolved && gapiInited) {
      resolved = true;
      clearTimeout(timeout);
      resolvePromise();
    }
  });

  return initPromise;
}

export async function loginGoogle(silent = false) {
  await initGoogleApi(); // Pastikan API sudah siap sebelum login
  
  const setGapiToken = (token: string) => {
    currentAccessToken = token;
    if ((window as any).gapi?.client) {
      (window as any).gapi.client.setToken({ access_token: token });
    }
  };

  if (currentAccessToken) {
    setGapiToken(currentAccessToken);
    return currentAccessToken;
  }

  // Cek token di memori browser (berlaku ~1 jam)
  const cachedToken = localStorage.getItem('google_access_token');
  const expiry = localStorage.getItem('google_access_token_expiry');
  if (cachedToken && expiry && Date.now() < Number(expiry)) {
    setGapiToken(cachedToken);
    return cachedToken;
  }

  if (Capacitor.isNativePlatform()) {
    try {
      // 1. Try to refresh token first if it's expired
      if (cachedToken && (!expiry || Date.now() >= Number(expiry))) {
        console.log("Token expired, attempting native refresh...");
        const refreshResult = await GoogleAuth.refresh();
        if (refreshResult?.accessToken) {
          console.log("Native refresh success");
          setGapiToken(refreshResult.accessToken);
          localStorage.setItem('google_access_token', refreshResult.accessToken);
          localStorage.setItem('google_access_token_expiry', String(Date.now() + 55 * 60 * 1000));
          return refreshResult.accessToken;
        }
      }

      // 2. If no cached token or refresh failed, only sign in if NOT silent
      if (silent) {
        console.log("Silent login requested, skipping native signIn UI");
        throw new Error("Silent login failed");
      }

      console.log("Starting native Google login UI...");
      const user = await GoogleAuth.signIn();
      console.log("Native Google login success", user);
      setGapiToken(user.authentication.accessToken);
      localStorage.setItem('google_access_token', user.authentication.accessToken);
      localStorage.setItem('google_access_token_expiry', String(Date.now() + 55 * 60 * 1000));
      return user.authentication.accessToken;
    } catch (err) {
      console.error("Native Google login/refresh error:", err);
      throw err;
    }
  }

  if (silent) {
    throw new Error("No active session for silent login");
  }

  return new Promise<string>((resolve, reject) => {
    if (!tokenClient) {
      reject("Google API not initialized");
      return;
    }
    tokenClient.callback = (resp: any) => {
      if (resp.error !== undefined) {
        reject(resp);
        return;
      }
      setGapiToken(resp.access_token);
      // Simpan token untuk 55 menit ke depan (aman sebelum expired 1 jam)
      localStorage.setItem('google_access_token', resp.access_token);
      localStorage.setItem('google_access_token_expiry', String(Date.now() + 55 * 60 * 1000));
      resolve(resp.access_token);
    };
    // Jangan paksa select_account agar Google bisa auto-login jika memungkinkan
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

async function ensureGapiLoaded(accessToken?: string) {
  if (typeof window === 'undefined') return;
  
  if (!(window as any).gapi?.client) {
    await new Promise<void>((resolve) => {
      const script = document.createElement('script');
      script.src = "https://apis.google.com/js/api.js";
      script.onload = () => {
        (window as any).gapi.load('client', async () => {
          await (window as any).gapi.client.init({
            discoveryDocs: [
              "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
              "https://sheets.googleapis.com/$discovery/rest?version=v4"
            ],
          });
          if (accessToken) {
            (window as any).gapi.client.setToken({ access_token: accessToken });
          }
          resolve();
        });
      };
      document.body.appendChild(script);
    });
  } else if (accessToken) {
    (window as any).gapi.client.setToken({ access_token: accessToken });
  }
}

export async function findOrCreateSpreadsheet(accessToken: string) {
  await ensureGapiLoaded(accessToken);
  const gapi = (window as any).gapi;
  
  // 1. Search for existing spreadsheet
  const response = await gapi.client.drive.files.list({
    q: "name = 'TokoKu POS Database' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false",
    fields: 'files(id, name)',
  });

  const files = response.result.files;
  if (files && files.length > 0) {
    return files[0].id;
  }

  // 2. Create new if not found
  const createResponse = await gapi.client.sheets.spreadsheets.create({
    resource: {
      properties: {
        title: 'TokoKu POS Database',
      },
      sheets: [
        { properties: { title: 'Products' } },
        { properties: { title: 'Transactions' } },
        { properties: { title: 'TransactionItems' } },
        { properties: { title: 'Categories' } },
        { properties: { title: 'Profile' } }
      ]
    },
  });

  return createResponse.result.spreadsheetId;
}

export async function syncAllToCloud(spreadsheetId: string) {
  await ensureGapiLoaded(currentAccessToken || undefined);
  const gapi = (window as any).gapi;
  
  const products = await db.products.toArray();
  const categories = await db.categories.toArray();
  const transactions = await db.transactions.toArray();
  const transactionItems = await db.transactionItems.toArray();
  const storeProfile = await db.storeProfile.toArray();

  const compressBlobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 150; // Very small for spreadsheet safety
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Use WebP with high compression to ensure small string
          const dataUrl = canvas.toDataURL("image/webp", 0.5);
          resolve(dataUrl);
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const toRows = async (data: any[]) => {
    if (data.length === 0) return [];
    // Get all possible headers from all objects in the array
    const headers = Array.from(new Set(data.flatMap(obj => Object.keys(obj))));
    
    const rows = await Promise.all(data.map(async obj => {
      return await Promise.all(headers.map(async h => {
        const val = obj[h];
        if (val instanceof Blob) {
          try {
            return await compressBlobToBase64(val);
          } catch (e) {
            return ""; // Fallback
          }
        }
        if (typeof val === 'object' && val !== null) return JSON.stringify(val);
        return val === null || val === undefined ? "" : val;
      }));
    }));
    return [headers, ...rows];
  };

  try {
    // 1. Get current sheets to see what's missing
    const spreadsheet = await gapi.client.sheets.spreadsheets.get({ spreadsheetId });
    const existingSheetNames = spreadsheet.result.sheets.map((s: any) => s.properties.title);

    const sheets = [
      { name: 'Products', data: products },
      { name: 'Categories', data: categories },
      { 
        name: 'Transactions', 
        data: transactions.map(t => ({
          ...t,
          cashTendered: (t.cashTendered === t.total || t.cashTendered === 0) ? "LUNAS" : t.cashTendered,
          cashChange: t.cashChange === 0 ? "LUNAS" : t.cashChange
        })) 
      },
      { name: 'TransactionItems', data: transactionItems },
      { name: 'Profile', data: storeProfile }
    ];

    // 2. Create missing sheets
    const missingSheets = sheets.filter(s => !existingSheetNames.includes(s.name));
    if (missingSheets.length > 0) {
      await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: missingSheets.map(s => ({
            addSheet: { properties: { title: s.name } }
          }))
        }
      });
    }

    // 3. Update values (with per-sheet error handling)
    let hasError = false;
    for (const sheet of sheets) {
      if (sheet.data.length === 0) continue;
      try {
        const rowData = await toRows(sheet.data);
        await gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheet.name}!A1`,
          valueInputOption: 'RAW',
          resource: { values: rowData },
        });
      } catch (err) {
        console.error(`Error syncing sheet ${sheet.name}:`, err);
        hasError = true;
      }
    }

    return !hasError;
  } catch (error: any) {
    console.error("Critical sync error:", error?.result?.error || error);
    return false;
  }
}

export async function downloadFromCloud(spreadsheetId: string) {
  await ensureGapiLoaded(currentAccessToken || undefined);
  const gapi = (window as any).gapi;
  
  try {
    const getSheetData = async (range: string) => {
      try {
        const resp = await gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId,
          range,
        });
        const rows = resp.result.values;
        if (!rows || rows.length <= 1) return [];
        
        const headers = rows[0];
        return rows.slice(1).map((row: any[]) => {
          const obj: any = {};
          headers.forEach((h: string, i: number) => {
            let val = row[i];
            // Simple type restoration
            if (val === "true") val = true;
            if (val === "false") val = false;
            // Handle number-like strings that should stay strings (IDs like TRX-123)
            if (val !== "" && !isNaN(val) && !String(val).includes('-') && !String(val).startsWith('0')) {
              val = Number(val);
            }
            obj[h] = val;
          });
          return obj;
        });
      } catch (e) {
        console.warn(`Error reading range ${range}:`, e);
        return [];
      }
    };

    const cloudProducts = await getSheetData('Products!A1:Z');
    const cloudCategories = await getSheetData('Categories!A1:Z');
    const cloudTransactions = await getSheetData('Transactions!A1:Z');
    const cloudItems = await getSheetData('TransactionItems!A1:Z');
    const cloudProfile = await getSheetData('Profile!A1:Z');

    const base64ToBlob = (base64: string): Blob | null => {
      if (!base64 || !base64.startsWith('data:image')) return null;
      try {
        const [header, data] = base64.split(",");
        const mime = header.match(/:(.*?);/)?.[1];
        const binary = atob(data);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
        return new Blob([array], { type: mime });
      } catch (e) {
        return null;
      }
    };

    await db.transaction('rw', [db.products, db.categories, db.transactions, db.transactionItems, db.storeProfile], async () => {
      if (cloudCategories.length > 0) {
        await db.categories.clear();
        await db.categories.bulkAdd(cloudCategories);
      }
      if (cloudProducts.length > 0) {
        await db.products.clear();
        await db.products.bulkAdd(cloudProducts.map((p: any) => ({ 
          ...p, 
          image: p.image && typeof p.image === 'string' ? base64ToBlob(p.image) : null 
        })));
      }
      if (cloudTransactions.length > 0) {
        await db.transactions.clear();
        await db.transactions.bulkAdd(cloudTransactions);
      }
      if (cloudItems.length > 0) {
        await db.transactionItems.clear();
        await db.transactionItems.bulkAdd(cloudItems);
      }
      if (cloudProfile.length > 0) {
        await db.storeProfile.put({ 
          ...cloudProfile[0], 
          id: 1, 
          isGoogleConnected: true, 
          spreadsheetId, 
          isOnboarded: true 
        });
      }
    });

    return true;
  } catch (error) {
    console.error("Download error:", error);
    return false;
  }
}


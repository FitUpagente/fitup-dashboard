import { google } from "googleapis";

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}");
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

async function getSheet(sheetName: string) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetName = process.env.GOOGLE_SHEETS_SPREADSHEET_NAME || "";

  // First, find the spreadsheet by name using Drive API
  const drive = google.drive({ version: "v3", auth });
  const res = await drive.files.list({
    q: `name='${spreadsheetName}' and mimeType='application/vnd.google-apps.spreadsheet'`,
    fields: "files(id)",
  });

  const spreadsheetId = res.data.files?.[0]?.id;
  if (!spreadsheetId) throw new Error(`Spreadsheet '${spreadsheetName}' not found`);

  const data = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
  });

  return data.data.values || [];
}

export interface DARRow {
  data: string;
  totalTasks: number;
  appuntamenti: number;
  phoneIn: number;
  phoneOut: number;
  walkIn: number;
  onlineLeads: number;
  dayPass: number;
  csop: number;
  email: number;
  visitatoreRitorna: number;
  nuoviClienti: number;
  drop: number;
  rinnovi: number;
  promo: number;
  ricontattare: number;
  nonInteressato: number;
  pianificato: number;
  esitoAppuntamento: number;
  referral: number;
  tassoConversione: number;
  tassoDrop: number;
  accessiDuplicati: number;
}

function parseNum(val: string | undefined): number {
  if (!val) return 0;
  const n = parseFloat(val.replace(",", "."));
  return isNaN(n) ? 0 : n;
}

export async function getDARData(): Promise<DARRow[]> {
  const rows = await getSheet("DAR Giornaliero");
  if (rows.length <= 1) return [];

  return rows.slice(1).map((r: string[]) => ({
    data: r[0] || "",
    totalTasks: parseNum(r[1]),
    appuntamenti: parseNum(r[2]),
    phoneIn: parseNum(r[3]),
    phoneOut: parseNum(r[4]),
    walkIn: parseNum(r[5]),
    onlineLeads: parseNum(r[6]),
    dayPass: parseNum(r[7]),
    csop: parseNum(r[8]),
    email: parseNum(r[9]),
    visitatoreRitorna: parseNum(r[10]),
    nuoviClienti: parseNum(r[11]),
    drop: parseNum(r[12]),
    rinnovi: parseNum(r[13]),
    promo: parseNum(r[14]),
    ricontattare: parseNum(r[15]),
    nonInteressato: parseNum(r[16]),
    pianificato: parseNum(r[17]),
    esitoAppuntamento: parseNum(r[18]),
    referral: parseNum(r[19]),
    tassoConversione: parseNum(r[20]),
    tassoDrop: parseNum(r[21]),
    accessiDuplicati: parseNum(r[22]),
  }));
}

export interface AccessRow {
  data: string;
  orario: string;
  nome: string;
  attivita: string;
  dispositivo: string;
  tipoIngresso: string;
}

export async function getAccessData(): Promise<AccessRow[]> {
  const rows = await getSheet("Accessi Duplicati");
  if (rows.length <= 1) return [];

  return rows.slice(1).map((r: string[]) => ({
    data: r[0] || "",
    orario: r[1] || "",
    nome: r[2] || "",
    attivita: r[3] || "",
    dispositivo: r[4] || "",
    tipoIngresso: r[5] || "",
  }));
}

export interface CRMRow {
  data: string;
  persona: string;
  azione: string;
  utente: string;
  esito: string;
  nota: string;
  tags: string;
}

export async function getCRMData(): Promise<CRMRow[]> {
  const rows = await getSheet("Dettaglio CRM");
  if (rows.length <= 1) return [];

  return rows.slice(1).map((r: string[]) => ({
    data: r[0] || "",
    persona: r[1] || "",
    azione: r[2] || "",
    utente: r[3] || "",
    esito: r[4] || "",
    nota: r[5] || "",
    tags: r[6] || "",
  }));
}

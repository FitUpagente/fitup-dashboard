import { getDARData, getCRMData, type DARRow } from "@/lib/sheets";
import StatCard from "@/components/StatCard";

export const revalidate = 300;

function getLastDays(data: DARRow[], n: number): DARRow[] {
  return data.slice(-n);
}

function avg(rows: DARRow[], key: keyof DARRow): number {
  if (rows.length === 0) return 0;
  const sum = rows.reduce((s, r) => s + (r[key] as number), 0);
  return sum / rows.length;
}

function trend(current: number, average: number): string {
  if (average === 0) return "";
  const pct = ((current - average) / average) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}% vs media 7gg`;
}

export default async function DashboardPage() {
  let darData: DARRow[] = [];
  let azioniAperte: { persona: string; azione: string; utente: string; data: string }[] = [];
  let error = "";

  try {
    darData = await getDARData();
    const crm = await getCRMData();
    azioniAperte = crm
      .filter((r) => r.esito === "Pianificato" || r.esito === "")
      .map((r) => ({ persona: r.persona, azione: r.azione, utente: r.utente, data: r.data }));
  } catch (e) {
    error = e instanceof Error ? e.message : "Errore caricamento dati";
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <p className="text-red-600 font-medium">Errore</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const today = darData[darData.length - 1];
  const last7 = getLastDays(darData, 8).slice(0, 7);

  if (!today) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Nessun dato disponibile</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1a3a5c]">Daily Activity Report</h1>
        <p className="text-gray-400 text-sm mt-1">{today.data}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tasks Totali"
          value={today.totalTasks}
          subtitle={trend(today.totalTasks, avg(last7, "totalTasks"))}
        />
        <StatCard
          label="Nuovi Clienti"
          value={today.nuoviClienti}
          color="success"
          subtitle={trend(today.nuoviClienti, avg(last7, "nuoviClienti"))}
        />
        <StatCard
          label="Tasso Conversione"
          value={`${today.tassoConversione}%`}
          color={today.tassoConversione > avg(last7, "tassoConversione") ? "success" : "warning"}
        />
        <StatCard
          label="DROP"
          value={today.drop}
          color={today.drop > 0 ? "danger" : "success"}
          subtitle={`Tasso: ${today.tassoDrop}%`}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-[#1a3a5c] uppercase tracking-wide mb-4">
            Lead (contatti ricevuti)
          </h2>
          <div className="space-y-3">
            {[
              { label: "WI - Walk In", value: today.walkIn },
              { label: "PI - Phone In", value: today.phoneIn },
              { label: "OL - Online Lead", value: today.onlineLeads },
              { label: "CB - Visitatore Ritorna", value: today.visitatoreRitorna },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-sm font-bold text-[#1a3a5c] bg-blue-50 px-3 py-1 rounded-lg">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-[#1a3a5c] uppercase tracking-wide mb-4">
            Pianificati
          </h2>
          <div className="space-y-3">
            {[
              { label: "PO - Chiamate in uscita", value: today.phoneOut },
              { label: "A - Appuntamenti", value: today.appuntamenti },
              { label: "DPG - Day Pass", value: today.dayPass },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold text-[#1a3a5c] uppercase tracking-wide mb-4">Esiti</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "NC", value: today.nuoviClienti, bg: "bg-emerald-100 text-emerald-700" },
            { label: "DROP", value: today.drop, bg: "bg-red-100 text-red-700" },
            { label: "Rinnovi", value: today.rinnovi, bg: "bg-blue-100 text-blue-700" },
            { label: "Promo", value: today.promo, bg: "bg-purple-100 text-purple-700" },
            { label: "RC", value: today.ricontattare, bg: "bg-amber-100 text-amber-700" },
            { label: "SB", value: today.nonInteressato, bg: "bg-gray-100 text-gray-600" },
            { label: "Pianificato", value: today.pianificato, bg: "bg-gray-50 text-gray-500" },
            { label: "App", value: today.esitoAppuntamento, bg: "bg-sky-100 text-sky-700" },
            { label: "Referral", value: today.referral, bg: "bg-indigo-100 text-indigo-700" },
          ]
            .filter((item) => item.value > 0)
            .map((item) => (
              <span key={item.label} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${item.bg}`}>
                {item.label} {item.value}
              </span>
            ))}
        </div>
      </div>

      {azioniAperte.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-amber-200">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-amber-600 uppercase tracking-wide">
              Azioni Aperte ({azioniAperte.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-400 font-medium">Persona</th>
                  <th className="text-left py-2 text-gray-400 font-medium">Azione</th>
                  <th className="text-left py-2 text-gray-400 font-medium">Coach</th>
                  <th className="text-left py-2 text-gray-400 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {azioniAperte.slice(0, 20).map((a, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 font-medium">{a.persona}</td>
                    <td className="py-2 text-gray-600">{a.azione}</td>
                    <td className="py-2 text-gray-600">{a.utente}</td>
                    <td className="py-2 text-gray-400">{a.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {azioniAperte.length > 20 && (
              <p className="text-xs text-gray-400 mt-2">
                ...e altre {azioniAperte.length - 20} azioni
              </p>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold text-[#1a3a5c] uppercase tracking-wide mb-4">
          Ultimi 7 giorni
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-gray-400 font-medium">Data</th>
                <th className="text-center py-2 text-gray-400 font-medium">Tasks</th>
                <th className="text-center py-2 text-gray-400 font-medium">NC</th>
                <th className="text-center py-2 text-gray-400 font-medium">DROP</th>
                <th className="text-center py-2 text-gray-400 font-medium">Conv%</th>
                <th className="text-center py-2 text-gray-400 font-medium">Referral</th>
              </tr>
            </thead>
            <tbody>
              {getLastDays(darData, 7).reverse().map((row, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2 font-medium">{row.data}</td>
                  <td className="py-2 text-center">{row.totalTasks}</td>
                  <td className="py-2 text-center">
                    <span className="text-emerald-600 font-semibold">{row.nuoviClienti}</span>
                  </td>
                  <td className="py-2 text-center">
                    <span className={row.drop > 0 ? "text-red-500 font-semibold" : "text-gray-400"}>
                      {row.drop}
                    </span>
                  </td>
                  <td className="py-2 text-center">{row.tassoConversione}%</td>
                  <td className="py-2 text-center">{row.referral}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

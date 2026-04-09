import { getCRMData } from "@/lib/sheets";

export const revalidate = 300;

export default async function AzioniPage() {
  let azioniAperte: { persona: string; azione: string; utente: string; data: string; nota: string }[] = [];
  let error = "";

  try {
    const crm = await getCRMData();
    azioniAperte = crm
      .filter((r) => r.esito === "Pianificato" || r.esito === "")
      .map((r) => ({
        persona: r.persona,
        azione: r.azione,
        utente: r.utente.split("(")[0].trim(),
        data: r.data,
        nota: r.nota,
      }))
      .sort((a, b) => a.data.localeCompare(b.data));
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

  // Group by coach
  const byCoach = new Map<string, typeof azioniAperte>();
  for (const a of azioniAperte) {
    const coach = a.utente || "Non assegnato";
    if (!byCoach.has(coach)) byCoach.set(coach, []);
    byCoach.get(coach)!.push(a);
  }

  const coaches = Array.from(byCoach.entries()).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1a3a5c]">Azioni Aperte</h1>
        <p className="text-gray-400 text-sm mt-1">
          {azioniAperte.length} azioni con esito &quot;Pianificato&quot; o senza esito
        </p>
      </div>

      {azioniAperte.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <p className="text-emerald-600 font-medium">Tutte le azioni sono state chiuse!</p>
        </div>
      ) : (
        coaches.map(([coach, azioni]) => (
          <div key={coach} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-[#1a3a5c]">{coach}</h2>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                {azioni.length} aperte
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-2 text-gray-400 font-medium">Persona</th>
                    <th className="text-left px-4 py-2 text-gray-400 font-medium">Azione</th>
                    <th className="text-left px-4 py-2 text-gray-400 font-medium">Data</th>
                    <th className="text-left px-4 py-2 text-gray-400 font-medium">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {azioni.map((a, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-6 py-3 font-medium">{a.persona}</td>
                      <td className="px-4 py-3">
                        <span className="bg-blue-50 text-[#1a3a5c] text-xs px-2 py-0.5 rounded font-medium">
                          {a.azione.split(" - ")[0]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{a.data}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{a.nota}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

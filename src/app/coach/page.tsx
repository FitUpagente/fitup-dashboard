import { getCRMData, getDARData } from "@/lib/sheets";

export const revalidate = 300;

interface CoachStats {
  nome: string;
  tasks: number;
  nc: number;
  drop: number;
  pianificato: number;
  appuntamenti: number;
  conversionRate: number;
}

export default async function CoachPage() {
  let coachStats: CoachStats[] = [];
  let error = "";

  try {
    const crm = await getCRMData();

    // Get last date available
    const dates = [...new Set(crm.map((r) => r.data))].sort();
    const lastDate = dates[dates.length - 1];
    const todayRows = crm.filter((r) => r.data === lastDate);

    // Group by coach
    const map = new Map<string, CoachStats>();
    for (const row of todayRows) {
      const coach = row.utente.split("(")[0].trim();
      if (!coach) continue;

      if (!map.has(coach)) {
        map.set(coach, { nome: coach, tasks: 0, nc: 0, drop: 0, pianificato: 0, appuntamenti: 0, conversionRate: 0 });
      }
      const s = map.get(coach)!;
      s.tasks++;
      if (row.esito.includes("NC")) s.nc++;
      if (row.esito.includes("DROP")) s.drop++;
      if (row.esito === "Pianificato") s.pianificato++;
      if (row.azione.includes("A - Appuntamento")) s.appuntamenti++;
    }

    coachStats = Array.from(map.values())
      .map((s) => ({
        ...s,
        conversionRate: s.tasks > 0 ? Math.round((s.nc / s.tasks) * 100) : 0,
      }))
      .sort((a, b) => b.tasks - a.tasks);
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

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1a3a5c]">Performance Coach</h1>
        <p className="text-gray-400 text-sm mt-1">Ultimo giorno disponibile</p>
      </div>

      {coachStats.length === 0 ? (
        <p className="text-gray-400">Nessun dato disponibile</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {coachStats.map((coach) => (
            <div
              key={coach.nome}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#1a3a5c]">{coach.nome}</h3>
                <span className="text-xs bg-blue-50 text-[#1a3a5c] px-2 py-1 rounded-full font-medium">
                  {coach.tasks} tasks
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{coach.nc}</p>
                  <p className="text-xs text-emerald-500 mt-1">NC</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-500">{coach.drop}</p>
                  <p className="text-xs text-red-400 mt-1">DROP</p>
                </div>
                <div className="bg-sky-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-sky-600">{coach.appuntamenti}</p>
                  <p className="text-xs text-sky-500 mt-1">App</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">{coach.pianificato}</p>
                  <p className="text-xs text-amber-500 mt-1">Aperte</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-400">Tasso conversione</span>
                <span
                  className={`text-sm font-bold ${
                    coach.conversionRate >= 30
                      ? "text-emerald-600"
                      : coach.conversionRate >= 15
                      ? "text-amber-600"
                      : "text-red-500"
                  }`}
                >
                  {coach.conversionRate}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

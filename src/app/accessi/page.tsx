import { getAccessData, type AccessRow } from "@/lib/sheets";

export const revalidate = 300;

interface GroupedAccess {
  nome: string;
  dispositivo: string;
  scansioni: number;
  orari: string[];
  date: string[];
}

function groupByPersonDevice(rows: AccessRow[]): GroupedAccess[] {
  const map = new Map<string, GroupedAccess>();

  for (const r of rows) {
    const key = `${r.nome}||${r.dispositivo}`;
    if (!map.has(key)) {
      map.set(key, { nome: r.nome, dispositivo: r.dispositivo, scansioni: 0, orari: [], date: [] });
    }
    const g = map.get(key)!;
    g.scansioni++;
    g.orari.push(r.orario);
    if (!g.date.includes(r.data)) g.date.push(r.data);
  }

  return Array.from(map.values()).sort((a, b) => b.scansioni - a.scansioni);
}

function groupByDate(rows: AccessRow[]): Map<string, AccessRow[]> {
  const map = new Map<string, AccessRow[]>();
  for (const r of rows) {
    if (!map.has(r.data)) map.set(r.data, []);
    map.get(r.data)!.push(r);
  }
  return map;
}

export default async function AccessiPage() {
  let data: AccessRow[] = [];
  let error = "";

  try {
    data = await getAccessData();
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

  const byDate = groupByDate(data);
  const dates = Array.from(byDate.keys()).sort().reverse();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1a3a5c]">Controllo Accessi Notturno</h1>
        <p className="text-gray-400 text-sm mt-1">Passaggi ravvicinati (stesso lettore, entro 5 min) - fascia 21:00-09:00</p>
      </div>

      {data.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <p className="text-emerald-600 font-medium">Nessun passaggio sospetto registrato</p>
        </div>
      ) : (
        dates.map((dateStr) => {
          const dayRows = byDate.get(dateStr) || [];
          const grouped = groupByPersonDevice(dayRows);
          const uniquePeople = new Set(grouped.map((g) => g.nome)).size;

          return (
            <div key={dateStr} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-[#1a3a5c]">{dateStr}</h2>
                <div className="flex gap-3">
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                    {uniquePeople} persone
                  </span>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                    {dayRows.length} passaggi
                  </span>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {grouped.map((g, i) => (
                  <div key={i} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#1a3a5c]">{g.nome}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {g.dispositivo} &mdash; {g.orari.sort().join(", ")}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        g.scansioni >= 3
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {g.scansioni}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

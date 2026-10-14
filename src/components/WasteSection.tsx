import { useEffect, useState } from "react";
import { ExternalLink, Trash2 } from "lucide-react";
import { fractions, isWasteSchedule, polishDay, relativeDay, upcomingCollections, type Fraction, type WasteSchedule } from "../lib/waste";

const formatDate = (date: string) => new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Warsaw" }).format(new Date(date + "T12:00:00Z"));
const shortDate = (date: string) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Warsaw" }).format(new Date(date + "T12:00:00Z"));

export default function WasteSection({ refreshToken }: { refreshToken: string | null }) {
  const [schedule, setSchedule] = useState<WasteSchedule | null>(null);
  const [error, setError] = useState(false);
  const [today, setToday] = useState(polishDay);
  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    fetch(`${import.meta.env.BASE_URL}data/waste.json`, { signal: controller.signal, cache: "no-cache" })
      .then(response => { if (!response.ok) throw new Error("Schedule unavailable"); return response.json(); })
      .then(data => { if (!isWasteSchedule(data)) throw new Error("Invalid schedule"); setSchedule(data); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [refreshToken]);
  useEffect(() => {
    const update = () => setToday(polishDay());
    const timer = window.setInterval(update, 30000);
    document.addEventListener("visibilitychange", update);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", update); };
  }, []);
  const upcoming = schedule ? upcomingCollections(schedule, today) : [];
  const current = schedule && today >= schedule.validFrom && today <= schedule.validUntil;
  const next = upcoming[0];
  return <section className="card waste-section" aria-labelledby="waste-title">
    <div className="section-heading"><h2 id="waste-title"><Trash2 size={20} aria-hidden="true" />Wywóz odpadów</h2><span className="pill neutral">Szczedrzyk · rejon 7</span></div>
    <p className="section-context">Zabudowa jednorodzinna</p>
    {error && <p className="error-note" role="status">Nie udało się wczytać harmonogramu.{schedule ? " Widoczna jest wcześniej wczytana wersja." : " Sprawdź harmonogram gminy."}</p>}
    {!schedule && !error && <p role="status">Wczytywanie harmonogramu…</p>}
    {schedule && <>
      {!current ? <p className="error-note" role="status">Brak aktualnego harmonogramu. Dostępna wersja obejmuje okres {shortDate(schedule.validFrom)} – {shortDate(schedule.validUntil)}.</p> : <>
        {next ? <div className="waste-next"><div><span className="pill good">{relativeDay(next.date, today)}</span><h3><time dateTime={next.date}>{formatDate(next.date)}</time></h3><p>{next.fractions.map(f => fractions[f]).join(" · ")}</p></div><p className="waste-reminder">Wystaw pojemniki lub worki do <strong>6:00 rano</strong> w dniu odbioru.</p></div> : <p>Brak kolejnych terminów w dostępnej wersji harmonogramu. Sprawdź nowe terminy na stronie gminy.</p>}
        <ul className="waste-fractions">{(Object.keys(fractions) as Fraction[]).map(f => {
          const entry = upcoming.find(e => e.fractions.includes(f));
          return <li key={f}><span className={`waste-dot waste-${f}`} aria-hidden="true" /><div><strong>{fractions[f]}</strong>{entry ? <><time dateTime={entry.date}>{formatDate(entry.date)}</time><span>{relativeDay(entry.date, today)}</span></> : <span>Brak kolejnego terminu w tym harmonogramie</span>}</div></li>;
        })}</ul>
      </>}
      <div className="card-foot"><span>Harmonogram do {shortDate(schedule.validUntil)} · zweryfikowano {shortDate(schedule.verifiedAt)}</span><a className="source-link" href={schedule.sourceUrl} target="_blank" rel="noreferrer">Harmonogram gminy (PDF)<ExternalLink size={12} aria-hidden="true" /></a></div>
    </>}
  </section>;
}

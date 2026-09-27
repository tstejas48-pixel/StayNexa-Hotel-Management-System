import { useAuth } from "@/_core/hooks/useAuth";
import {
  BedDouble,
  BellRing,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardCheck,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Settings2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export type StayFlowRole = "Admin" | "Manager" | "Receptionist" | "Housekeeping";

type NavItem = {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  roles: StayFlowRole[];
};

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "WORKSPACE",
    items: [
      { label: "Overview", path: "/", icon: LayoutDashboard, roles: ["Admin", "Manager", "Receptionist", "Housekeeping"] },
    ],
  },
  {
    label: "FRONT DESK",
    items: [
      { label: "Bookings", path: "/bookings", icon: CalendarDays, roles: ["Admin", "Manager", "Receptionist"] },
      { label: "Guests", path: "/guests", icon: UsersRound, roles: ["Admin", "Manager", "Receptionist"] },
      { label: "Check-in / out", path: "/check-in", icon: ClipboardCheck, roles: ["Admin", "Manager", "Receptionist"] },
    ],
  },
  {
    label: "PROPERTY",
    items: [
      { label: "Rooms", path: "/rooms", icon: BedDouble, roles: ["Admin", "Manager", "Receptionist", "Housekeeping"] },
      { label: "Housekeeping", path: "/housekeeping", icon: BellRing, roles: ["Admin", "Manager", "Housekeeping"] },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      { label: "Payments", path: "/payments", icon: CreditCard, roles: ["Admin", "Manager", "Receptionist"] },
      { label: "Reports", path: "/reports", icon: ChartNoAxesCombined, roles: ["Admin", "Manager"] },
      { label: "Settings", path: "/settings", icon: Settings2, roles: ["Admin"] },
    ],
  },
];

const mobilePrimary: NavItem[] = [
  { label: "Home", path: "/", icon: LayoutDashboard, roles: ["Admin", "Manager", "Receptionist", "Housekeeping"] },
  { label: "Bookings", path: "/bookings", icon: CalendarDays, roles: ["Admin", "Manager", "Receptionist"] },
  { label: "Rooms", path: "/rooms", icon: BedDouble, roles: ["Admin", "Manager", "Receptionist", "Housekeeping"] },
  { label: "Guests", path: "/guests", icon: UsersRound, roles: ["Admin", "Manager", "Receptionist"] },
];

export default function DashboardLayout({
  children,
  role = "Admin",
}: {
  children: React.ReactNode;
  role?: StayFlowRole;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const activePath = location === "/" ? "/" : `/${location.split("/")[1]}`;
  const visibleGroups = navGroups
    .map(group => ({ ...group, items: group.items.filter(item => item.roles.includes(role)) }))
    .filter(group => group.items.length > 0);
  const moreItems = ["/housekeeping", "/payments", "/reports", "/settings"]
    .flatMap(path => navGroups.flatMap(group => group.items))
    .filter((item, index, all) => ["/housekeeping", "/payments", "/reports", "/settings"].includes(item.path) && item.roles.includes(role) && all.findIndex(candidate => candidate.path === item.path) === index);

  const navigate = (path: string) => {
    setLocation(path);
    setMoreOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-900 dark:bg-[#0d1722] dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-white/10 bg-[#12283e] text-slate-100 lg:flex">
        <div className="flex h-[76px] items-center gap-3 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d5e4de] text-[#173b39]">
            <BedDouble size={19} strokeWidth={2.1} />
          </div>
          <div className="leading-tight">
            <div className="text-[17px] font-semibold tracking-[-0.04em]">stayflow<span className="text-[#9bbab1]">.</span></div>
            <div className="mt-1 text-[10px] font-medium tracking-[0.16em] text-slate-400">HOTEL OPERATIONS</div>
          </div>
        </div>

        <button className="mx-4 mb-6 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3 text-left transition hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#94b8aa]" aria-label="Select property">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#30465a] text-[#dce9e4]"><span className="text-xs font-semibold">AH</span></div>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-semibold">Aster House, Bengaluru</span>
            <span className="mt-1 block text-[11px] text-slate-400">Indiranagar · 36 rooms</span>
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-label="Property online" />
        </button>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-5" aria-label="Main navigation">
          {visibleGroups.map(group => (
            <section key={group.label}>
              <p className="mb-2 px-3 text-[9px] font-semibold tracking-[0.17em] text-slate-500">{group.label}</p>
              <div className="space-y-1">
                {group.items.map(item => {
                  const active = activePath === item.path || (item.path === "/check-in" && ["/check-in", "/check-out"].includes(activePath));
                  const Icon = item.icon;
                  return (
                    <button key={item.path} onClick={() => navigate(item.path)} aria-current={active ? "page" : undefined}
                      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-[10px] text-left text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#94b8aa] ${active ? "bg-[#294158] font-semibold text-white" : "text-slate-300 hover:bg-white/[0.06] hover:text-white"}`}>
                      <Icon size={16} strokeWidth={active ? 2.2 : 1.8} className={active ? "text-[#aed0c2]" : "text-slate-400 group-hover:text-slate-200"} />
                      <span className="flex-1">{item.label}</span>
                      {item.path === "/housekeeping" && <span className="rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300">3</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>

        <div className="mx-4 mb-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center justify-between text-[10px] text-slate-400"><span>YOUR SHIFT</span><span>09:00 — 18:00</span></div>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[68%] rounded-full bg-[#91b7a8]" /></div>
            <span className="text-[10px] font-medium text-slate-300">68%</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500">4h 06m remaining</div>
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-lg px-1 py-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d5e4de] text-[12px] font-semibold text-[#193b39]">{(user?.name || "Anika Rao").split(" ").map(part => part[0]).slice(0, 2).join("")}</div>
            <div className="min-w-0 flex-1"><div className="truncate text-[12px] font-medium">{user?.name || "Anika Rao"}</div><div className="mt-0.5 truncate text-[10px] text-slate-400">{role} · Front desk</div></div>
            {user && <button onClick={logout} aria-label="Sign out" title="Sign out" className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"><LogOut size={15} /></button>}
          </div>
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <div className="flex h-[54px] items-center justify-between border-b border-slate-200/70 bg-white px-4 dark:border-white/10 dark:bg-[#111e2b] lg:hidden">
          <div className="flex items-center gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#dce9e4] text-[#173b39]"><BedDouble size={16} /></div><span className="text-[15px] font-semibold tracking-[-0.04em]">stayflow<span className="text-emerald-700">.</span></span></div>
          <span className="flex items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Aster House</span>
        </div>
        <main id="main-content" className="min-h-screen px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-7 xl:px-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-[64px] items-center justify-around border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-white/10 dark:bg-[#111e2b]/95 lg:hidden" aria-label="Mobile navigation">
        {mobilePrimary.filter(item => item.roles.includes(role)).map(item => {
          const Icon = item.icon;
          const active = activePath === item.path;
          return <button key={item.path} onClick={() => navigate(item.path)} aria-current={active ? "page" : undefined} className={`flex min-w-[54px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[9px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${active ? "text-[#25564c] dark:text-[#a9d2c2]" : "text-slate-500 dark:text-slate-400"}`}><Icon size={18} strokeWidth={active ? 2.3 : 1.8} /><span>{item.label}</span></button>;
        })}
        <div className="relative">
          {moreOpen && <div className="absolute bottom-[50px] right-0 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#172635]">{moreItems.map(item => { const Icon = item.icon; return <button key={item.path} onClick={() => navigate(item.path)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-white/5"><Icon size={15} />{item.label}</button>; })}<button onClick={() => setMoreOpen(false)} className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"><X size={14} />Close</button></div>}
          <button onClick={() => setMoreOpen(value => !value)} aria-expanded={moreOpen} className={`flex min-w-[54px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[9px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${moreOpen ? "text-[#25564c] dark:text-[#a9d2c2]" : "text-slate-500 dark:text-slate-400"}`}><MoreHorizontal size={18} /><span>More</span></button>
        </div>
      </nav>
    </div>
  );
}

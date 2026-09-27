import DashboardLayout, { type StayFlowRole } from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTheme } from "@/contexts/ThemeContext";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock3,
  CreditCard,
  Download,
  FileText,
  Filter,
  Headphones,
  KeyRound,
  Mail,
  Moon,
  MoreHorizontal,
  Plus,
  Printer,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  UserPlus,
  UsersRound,
  Wallet,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  dateOffset,
  loadWorkspace,
  saveWorkspace,
  type Booking,
  type BookingStatus,
  type Guest,
  type HousekeepingTask,
  type Room,
  type RoomStatus,
  type ServiceOrder,
  type StayNotification,
  type TaskStatus,
  type Workspace,
} from "@/lib/stayflow-data";
import { calculateFolio, calculateStayQuote, isRoomAvailable } from "@/lib/stayflow-utils";

const roles: StayFlowRole[] = ["Admin", "Manager", "Receptionist", "Housekeeping"];
const currency = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const dateDisplay = (value: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) => new Intl.DateTimeFormat("en-IN", options).format(new Date(`${value}T12:00:00`));
const todayKey = dateOffset(0);
const nightsBetween = (start: string, end: string) => Math.max(1, Math.round((new Date(`${end}T12:00:00`).getTime() - new Date(`${start}T12:00:00`).getTime()) / 86400000));
const initialDate = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());

const pageNames: Record<string, string> = {
  overview: "Overview", bookings: "Bookings", guests: "Guests", "check-in": "Check-in",
  "check-out": "Check-out", rooms: "Rooms", housekeeping: "Housekeeping", payments: "Payments",
  reports: "Reports", settings: "Settings",
};

type DialogType = "booking" | "guest" | "checkin" | "checkout" | "invoice" | "guest-profile" | "room" | "notifications" | null;
type ActionItem = { label: string; detail: string; icon: LucideIcon; action: () => void };

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_10px_rgba(20,35,48,0.025)] dark:border-white/[0.08] dark:bg-[#142332] ${className}`}>{children}</section>;
}

function SectionHeading({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
  return <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-[14px] font-semibold tracking-[-0.02em]">{title}</h2>{detail && <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{detail}</p>}</div>{action}</div>;
}

function StatusPill({ status }: { status: BookingStatus | RoomStatus | TaskStatus | "paid" | "partial" | "due" }) {
  const labels: Record<string, string> = {
    "checked-in": "In house", "checked-out": "Checked out", confirmed: "Confirmed", cancelled: "Cancelled",
    available: "Available", reserved: "Reserved", occupied: "Occupied", cleaning: "Cleaning", maintenance: "Maintenance",
    "needs-cleaning": "Needs cleaning", "in-progress": "In progress", ready: "Ready", paid: "Paid", partial: "Partial", due: "Due",
  };
  const colors: Record<string, string> = {
    "checked-in": "bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-400/10 dark:text-blue-300",
    "checked-out": "bg-slate-100 text-slate-600 ring-slate-500/10 dark:bg-white/5 dark:text-slate-300",
    confirmed: "bg-[#edf4f0] text-[#356451] ring-[#477862]/10 dark:bg-emerald-400/10 dark:text-emerald-300",
    cancelled: "bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-400/10 dark:text-rose-300",
    available: "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-400/10 dark:text-emerald-300",
    reserved: "bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-400/10 dark:text-blue-300",
    occupied: "bg-[#edf2f6] text-[#476376] ring-[#476376]/10 dark:bg-sky-400/10 dark:text-sky-300",
    cleaning: "bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-400/10 dark:text-amber-300",
    maintenance: "bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-400/10 dark:text-rose-300",
    "needs-cleaning": "bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-400/10 dark:text-amber-300",
    "in-progress": "bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-400/10 dark:text-blue-300",
    ready: "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-400/10 dark:text-emerald-300",
    paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-400/10 dark:text-emerald-300",
    partial: "bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-400/10 dark:text-amber-300",
    due: "bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-400/10 dark:text-rose-300",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ring-1 ring-inset ${colors[status]}`}>{labels[status]}</span>;
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const palettes = ["bg-[#e6ede8] text-[#315a47]", "bg-[#f4e9dc] text-[#865b2b]", "bg-[#e7eaf2] text-[#485a81]", "bg-[#f1e6e6] text-[#92595b]", "bg-[#e3edf0] text-[#3e6670]"];
  const color = palettes[(name.charCodeAt(0) + name.charCodeAt(name.length - 1)) % palettes.length];
  const dimensions = size === "lg" ? "h-12 w-12 text-sm" : size === "sm" ? "h-7 w-7 text-[9px]" : "h-9 w-9 text-[11px]";
  const initials = name.split(" ").map(part => part[0]).slice(0, 2).join("");
  return <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${dimensions} ${color}`} aria-label={name}>{initials}</span>;
}

function CurrencyText({ amount, className = "" }: { amount: number; className?: string }) {
  return <span className={className}>{currency(amount)}</span>;
}

function Home() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const greetingName = user?.name?.trim().split(/\s+/)[0] || "Anika";
  const [workspace, setWorkspace] = useState<Workspace>(() => loadWorkspace());
  const [role, setRole] = useState<StayFlowRole>(() => (localStorage.getItem("stayflow-demo-role") as StayFlowRole) || "Admin");
  const [dialog, setDialog] = useState<DialogType>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [selectedRoomNo, setSelectedRoomNo] = useState<string | null>(null);
  const [bookingFilter, setBookingFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [housekeepingFilter, setHousekeepingFilter] = useState("all");
  const [notificationFilter, setNotificationFilter] = useState("All");
  const [tableSearch, setTableSearch] = useState("");
  const [calendarView, setCalendarView] = useState("Week");
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [bookingGuestId, setBookingGuestId] = useState("");
  const [bookingRoomNo, setBookingRoomNo] = useState("");
  const [bookingIn, setBookingIn] = useState(todayKey);
  const [bookingOut, setBookingOut] = useState(dateOffset(1));
  const [bookingChannel, setBookingChannel] = useState<Booking["channel"]>("Direct");
  const [guestForm, setGuestForm] = useState({ name: "", email: "", phone: "" });
  const [guestNote, setGuestNote] = useState("");
  const [checkoutPayment, setCheckoutPayment] = useState("UPI");
  const [serviceToAdd, setServiceToAdd] = useState("");
  const { theme, toggleTheme } = useTheme();
  const section = location === "/" ? "overview" : location.split("/")[1] || "overview";
  const pageName = pageNames[section] || "Overview";

  useEffect(() => saveWorkspace(workspace), [workspace]);
  useEffect(() => { localStorage.setItem("stayflow-demo-role", role); }, [role]);

  const updateWorkspace = (updater: (current: Workspace) => Workspace) => setWorkspace(current => updater(current));
  const activeBookings = workspace.bookings.filter(booking => booking.status === "confirmed" || booking.status === "checked-in");
  const arrivalsToday = workspace.bookings.filter(booking => booking.checkIn === todayKey && booking.status === "confirmed");
  const departuresToday = workspace.bookings.filter(booking => booking.checkOut === todayKey && booking.status === "checked-in");
  const occupiedRooms = workspace.rooms.filter(room => room.status === "occupied").length;
  const reservedRooms = workspace.rooms.filter(room => room.status === "reserved").length;
  const occupancy = Math.round(((occupiedRooms + reservedRooms) / Math.max(1, workspace.rooms.length)) * 100);
  const revenueToday = workspace.bookings.filter(booking => booking.checkIn === todayKey && booking.status !== "cancelled").reduce((sum, booking) => sum + booking.paid, 0);
  const unreadCount = workspace.notifications.filter(item => item.unread).length;
  const selectedBooking = workspace.bookings.find(booking => booking.id === selectedBookingId) ?? null;
  const selectedGuest = workspace.guests.find(guest => guest.id === selectedGuestId) ?? null;
  const selectedRoom = workspace.rooms.find(room => room.number === selectedRoomNo) ?? null;
  const selectedServiceOrders = selectedBooking ? workspace.serviceOrders.filter(order => order.bookingId === selectedBooking.id) : [];
  const selectedFolio = selectedBooking ? calculateFolio(selectedBooking.amount, selectedServiceOrders) : null;
  const serviceTotal = selectedFolio?.serviceTotal ?? 0;
  const roomTax = selectedFolio?.roomTax ?? 0;
  const roomSubtotal = selectedFolio?.roomSubtotal ?? 0;

  const roomAvailability = (room: Room, checkIn: string, checkOut: string) => {
    return isRoomAvailable(room, workspace.bookings, checkIn, checkOut);
  };
  const availableRooms = workspace.rooms.filter(room => roomAvailability(room, bookingIn, bookingOut));
  const filteredBookings = workspace.bookings.filter(booking => {
    const matchesFilter = bookingFilter === "all" || booking.status === bookingFilter;
    const search = tableSearch.toLowerCase();
    const matchesSearch = !search || [booking.id, booking.guestName, booking.roomNumber, booking.channel].some(value => value.toLowerCase().includes(search));
    return matchesFilter && matchesSearch;
  });
  const filteredRooms = workspace.rooms.filter(room => roomFilter === "all" || room.status === roomFilter || String(room.floor) === roomFilter);
  const searchableGuests = workspace.guests.filter(guest => !tableSearch || [guest.name, guest.phone, guest.email, guest.id].some(value => value.toLowerCase().includes(tableSearch.toLowerCase())));
  const matchingNotifications = workspace.notifications.filter(item => notificationFilter === "All" || item.category === notificationFilter);

  const openBooking = () => {
    setBookingGuestId(workspace.guests[0]?.id || "");
    setBookingIn(todayKey);
    setBookingOut(dateOffset(1));
    setBookingRoomNo("");
    setBookingChannel("Direct");
    setDialog("booking");
  };
  const openCheckin = (bookingId?: string) => {
    setSelectedBookingId(bookingId || arrivalsToday[0]?.id || workspace.bookings.find(booking => booking.status === "confirmed")?.id || null);
    setDialog("checkin");
  };
  const openCheckout = (bookingId?: string) => {
    setSelectedBookingId(bookingId || departuresToday[0]?.id || workspace.bookings.find(booking => booking.status === "checked-in")?.id || null);
    setDialog("checkout");
  };
  const navigate = (path: string) => { setLocation(path); setTableSearch(""); };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(true); }
      if (typing || event.altKey || event.ctrlKey || event.metaKey) return;
      const key = event.key.toLowerCase();
      if (key === "n") openBooking();
      if (key === "g") navigate("/guests");
      if (key === "r") navigate("/rooms");
      if (key === "b") navigate("/bookings");
      if (key === "escape") { setSearchOpen(false); setDialog(null); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [workspace, location]);

  const addBooking = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const guest = workspace.guests.find(item => item.id === bookingGuestId);
    const room = workspace.rooms.find(item => item.number === bookingRoomNo);
    if (!guest || !room) { toast.error("Choose a guest and an available room to continue."); return; }
    if (!roomAvailability(room, bookingIn, bookingOut)) { toast.error("That room is no longer available for these dates."); return; }
    if (bookingOut <= bookingIn) { toast.error("Check-out must be after check-in."); return; }
    const nights = nightsBetween(bookingIn, bookingOut);
    const amount = calculateStayQuote(room.rate, bookingIn, bookingOut).total;
    const booking: Booking = {
      id: `BK-${String(1042 + workspace.bookings.length).padStart(4, "0")}`,
      guestId: guest.id,
      guestName: guest.name,
      roomNumber: room.number,
      roomType: room.type,
      checkIn: bookingIn,
      checkOut: bookingOut,
      status: "confirmed",
      amount,
      paid: 0,
      channel: bookingChannel,
    };
    updateWorkspace(current => ({ ...current, bookings: [booking, ...current.bookings], rooms: current.rooms.map(item => item.number === room.number ? { ...item, status: "reserved" } : item) }));
    setSelectedBookingId(booking.id);
    setDialog(null);
    toast.success("Booking created", { description: `${booking.id} · ${guest.name} · Room ${room.number}` });
  };

  const addGuest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedPhone = guestForm.phone.replace(/\D/g, "");
    if (normalizedPhone.length < 10) { toast.error("Enter a valid phone number", { description: "Use at least 10 digits, including the country code if available." }); return; }
    const guest: Guest = {
      id: `GST-${String(241 + workspace.guests.length).padStart(4, "0")}`,
      name: guestForm.name.trim(), email: guestForm.email.trim() || "—", phone: guestForm.phone.trim(), stays: 0, spend: 0,
      tier: "Standard", preference: "No preference on file", notes: "",
    };
    updateWorkspace(current => ({ ...current, guests: [guest, ...current.guests] }));
    setGuestForm({ name: "", email: "", phone: "" });
    setSelectedGuestId(guest.id);
    setDialog("guest-profile");
    toast.success("Guest added", { description: `${guest.name} is ready to book.` });
  };

  const completeCheckin = () => {
    if (!selectedBooking) return;
    updateWorkspace(current => ({
      ...current,
      bookings: current.bookings.map(booking => booking.id === selectedBooking.id ? { ...booking, status: "checked-in" } : booking),
      rooms: current.rooms.map(room => room.number === selectedBooking.roomNumber ? { ...room, status: "occupied" } : room),
    }));
    setDialog(null);
    toast.success("Guest checked in", { description: `Room ${selectedBooking.roomNumber} is now occupied.` });
  };

  const collectPayment = (booking: Booking) => {
    const due = Math.max(booking.amount - booking.paid, 0);
    updateWorkspace(current => ({ ...current, bookings: current.bookings.map(item => item.id === booking.id ? { ...item, paid: item.amount } : item) }));
    setWorkspace(current => ({ ...current, notifications: [{ id: `NT-${Date.now()}`, title: "Payment received", detail: `${currency(due)} from ${booking.guestName} · ${booking.id}`, category: "Payments", time: "Just now", unread: true }, ...current.notifications] }));
    toast.success("Payment recorded", { description: `${currency(due)} · ${checkoutPayment}` });
  };

  const addServiceToBooking = (booking: Booking) => {
    const service = workspace.services.find(item => item.id === serviceToAdd);
    if (!service) return;
    const order: ServiceOrder = { id: `SO-${Date.now()}`, bookingId: booking.id, serviceId: service.id, serviceName: service.name, quantity: 1, amount: service.price };
    updateWorkspace(current => ({
      ...current,
      bookings: current.bookings.map(item => item.id === booking.id ? { ...item, amount: item.amount + service.price } : item),
      serviceOrders: [order, ...current.serviceOrders],
    }));
    setServiceToAdd("");
    toast.success("Service added to folio", { description: `${service.name} · ${currency(service.price)}` });
  };

  const completeCheckout = (booking: Booking) => {
    updateWorkspace(current => ({
      ...current,
      bookings: current.bookings.map(item => item.id === booking.id ? { ...item, status: "checked-out" } : item),
      rooms: current.rooms.map(room => room.number === booking.roomNumber ? { ...room, status: "cleaning" } : room),
      tasks: [{ id: `HK-${218 + current.tasks.length}`, roomNumber: booking.roomNumber, roomType: booking.roomType, assignee: "Unassigned", priority: "High", status: "needs-cleaning", updatedAt: "Just now" }, ...current.tasks],
    }));
    setDialog("invoice");
    toast.success("Checkout complete", { description: `Room ${booking.roomNumber} has been sent to housekeeping.` });
  };

  const updateTask = (taskId: string, status: TaskStatus) => {
    const task = workspace.tasks.find(item => item.id === taskId);
    updateWorkspace(current => ({
      ...current,
      tasks: current.tasks.map(item => item.id === taskId ? { ...item, status, updatedAt: "Just now" } : item),
      rooms: task ? current.rooms.map(room => room.number === task.roomNumber ? { ...room, status: status === "ready" ? "available" : status === "in-progress" ? "cleaning" : room.status } : room) : current.rooms,
    }));
    toast.success(status === "ready" ? `Room ${task?.roomNumber} marked clean` : `Task ${status === "in-progress" ? "started" : "updated"}`);
  };

  const addHousekeepingTask = (roomNumber: string) => {
    const room = workspace.rooms.find(item => item.number === roomNumber);
    if (!room) return;
    updateWorkspace(current => ({
      ...current,
      rooms: current.rooms.map(item => item.number === roomNumber ? { ...item, status: "cleaning" } : item),
      tasks: [{ id: `HK-${218 + current.tasks.length}`, roomNumber, roomType: room.type, assignee: "Unassigned", priority: "Normal", status: "needs-cleaning", updatedAt: "Just now" }, ...current.tasks],
    }));
    toast.success(`Room ${roomNumber} added to the cleaning board`);
  };

  const updateRoomStatus = (roomNumber: string, status: RoomStatus) => {
    updateWorkspace(current => ({ ...current, rooms: current.rooms.map(room => room.number === roomNumber ? { ...room, status } : room) }));
    toast.success(`Room ${roomNumber} updated`, { description: `Status set to ${status}.` });
  };

  const saveGuestNote = () => {
    if (!selectedGuest) return;
    updateWorkspace(current => ({ ...current, guests: current.guests.map(guest => guest.id === selectedGuest.id ? { ...guest, notes: guestNote.trim() } : guest) }));
    toast.success("Guest note saved");
  };

  const openGuest = (guestId: string) => {
    setSelectedGuestId(guestId);
    const guest = workspace.guests.find(item => item.id === guestId);
    setGuestNote(guest?.notes ?? "");
    setDialog("guest-profile");
  };

  const pageActions: ActionItem[] = [
    { label: "New booking", detail: "Reserve a room", icon: CalendarDays, action: openBooking },
    { label: "Add a guest", detail: "Create a guest profile", icon: UserPlus, action: () => { setGuestForm({ name: "", email: "", phone: "" }); setDialog("guest"); } },
    { label: "Check in guest", detail: "Start today's stay", icon: KeyRound, action: () => openCheckin() },
    { label: "Check out guest", detail: "Settle and close a stay", icon: CreditCard, action: () => openCheckout() },
  ];

  const renderGlobalHeader = () => (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 pb-4 dark:border-white/[0.08]">
      <div className="flex min-w-0 items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400"><span>StayFlow</span><span className="text-slate-300">/</span><span className="font-medium text-slate-700 dark:text-slate-200">{pageName}</span><span className="ml-1 rounded-full bg-[#eef4f0] px-2 py-1 text-[9px] font-semibold tracking-[0.08em] text-[#416a57] dark:bg-emerald-400/10 dark:text-emerald-300">DEMO DATA</span></div>
      <div className="flex items-center gap-2">
        <button onClick={() => setSearchOpen(true)} className="hidden h-9 min-w-[205px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-[11px] text-slate-400 shadow-sm transition hover:border-slate-300 sm:flex dark:border-white/10 dark:bg-[#142332] dark:text-slate-400" aria-label="Search everything (Control K)"><Search size={14} /><span className="flex-1">Search anything...</span><kbd className="rounded border border-slate-200 px-1.5 py-0.5 text-[9px] text-slate-500 dark:border-white/10">Ctrl K</kbd></button>
        <button onClick={() => setSearchOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 sm:hidden dark:border-white/10 dark:bg-[#142332]" aria-label="Search"><Search size={16} /></button>
        <button onClick={() => setDialog("notifications")} aria-label={`Notifications, ${unreadCount} unread`} className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:bg-[#142332] dark:text-slate-300"><Bell size={16} />{unreadCount > 0 && <span className="absolute right-[7px] top-[6px] h-1.5 w-1.5 rounded-full bg-[#d17861] ring-2 ring-white dark:ring-[#142332]" />}</button>
        <button onClick={toggleTheme} aria-label={theme === "light" ? "Enable dark mode" : "Enable light mode"} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:bg-[#142332] dark:text-slate-300">{theme === "light" ? <Moon size={15} /> : <Sun size={15} />}</button>
        <div className="relative hidden sm:block">
          <button onClick={() => setRoleMenuOpen(value => !value)} className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-700 dark:border-white/10 dark:bg-[#142332] dark:text-slate-200"><Avatar name="Anika Rao" size="sm" /><span className="hidden md:block">{role}</span><ChevronDown size={13} className="text-slate-400" /></button>
          {roleMenuOpen && <div className="absolute right-0 top-11 z-40 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#172635]"><p className="px-2.5 py-2 text-[9px] font-semibold tracking-[0.12em] text-slate-400">DEMO ROLE</p>{roles.map(item => <button key={item} onClick={() => { setRole(item); setRoleMenuOpen(false); }} className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[11px] ${role === item ? "bg-[#edf4f0] font-semibold text-[#315d4b] dark:bg-emerald-400/10 dark:text-emerald-200" : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"}`}>{item}{role === item && <Check size={13} />}</button>)}</div>}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout role={role}>
      <div className="mx-auto max-w-[1480px]">
        {renderGlobalHeader()}
        {section === "overview" && <OverviewPage greetingName={greetingName} workspace={workspace} occupancy={occupancy} revenueToday={revenueToday} arrivals={arrivalsToday} departures={departuresToday} onNewBooking={openBooking} onAddGuest={() => { setGuestForm({ name: "", email: "", phone: "" }); setDialog("guest"); }} onOpenCheckin={() => openCheckin()} onOpenCheckout={() => openCheckout()} onOpenBooking={id => { setSelectedBookingId(id); setDialog("checkin"); }} onNavigate={navigate} onOpenTask={() => navigate("/housekeeping")} />}
        {section === "bookings" && <BookingsPage bookings={filteredBookings} allBookings={workspace.bookings} filter={bookingFilter} setFilter={setBookingFilter} search={tableSearch} setSearch={setTableSearch} onNew={openBooking} onOpenBooking={id => { setSelectedBookingId(id); setDialog("invoice"); }} onCheckin={openCheckin} />}
        {section === "guests" && <GuestsPage guests={searchableGuests} search={tableSearch} setSearch={setTableSearch} onOpenGuest={openGuest} onAdd={() => { setGuestForm({ name: "", email: "", phone: "" }); setDialog("guest"); }} />}
        {(section === "check-in" || section === "check-out") && <StayFlowPage mode={section === "check-in" ? "checkin" : "checkout"} bookings={workspace.bookings} guests={workspace.guests} rooms={workspace.rooms} onCheckin={openCheckin} onCheckout={openCheckout} onGuest={openGuest} />}
        {section === "rooms" && <RoomsPage rooms={filteredRooms} allRooms={workspace.rooms} filter={roomFilter} setFilter={setRoomFilter} onSelectRoom={room => { setSelectedRoomNo(room.number); setDialog("room"); }} />}
        {section === "housekeeping" && <HousekeepingPage tasks={workspace.tasks} filter={housekeepingFilter} setFilter={setHousekeepingFilter} onUpdateTask={updateTask} onAddTask={() => { const room = workspace.rooms.find(item => item.status === "cleaning") ?? workspace.rooms.find(item => item.status === "occupied"); if (room) addHousekeepingTask(room.number); else toast.info("All rooms are already up to date."); }} />}
        {section === "payments" && <PaymentsPage bookings={workspace.bookings} onCollect={collectPayment} onInvoice={id => { setSelectedBookingId(id); setDialog("invoice"); }} />}
        {section === "reports" && <ReportsPage bookings={workspace.bookings} rooms={workspace.rooms} />}
        {section === "settings" && <SettingsPage theme={theme} onTheme={toggleTheme} role={role} onRole={setRole} />}
      </div>

      <Dialog open={dialog !== null} onOpenChange={open => !open && setDialog(null)}>
        <DialogContent className={`max-h-[92vh] overflow-y-auto border-slate-200 p-0 dark:border-white/10 dark:bg-[#142332] ${dialog === "invoice" ? "max-w-2xl" : dialog === "guest-profile" ? "max-w-2xl" : dialog === "notifications" ? "max-w-xl" : "max-w-lg"}`}>
          {dialog === "booking" && <>
            <DialogHeader className="border-b border-slate-100 px-6 pb-4 pt-6 text-left dark:border-white/[0.08]"><DialogTitle className="text-[18px]">Create a booking</DialogTitle><DialogDescription className="text-[12px]">A room is held once you confirm the reservation.</DialogDescription></DialogHeader>
            <form onSubmit={addBooking} className="space-y-4 px-6 py-5">
              <Field label="Guest" required><select className="form-control" value={bookingGuestId} onChange={event => setBookingGuestId(event.target.value)} required><option value="">Select a guest</option>{workspace.guests.map(guest => <option value={guest.id} key={guest.id}>{guest.name} · {guest.phone}</option>)}</select></Field>
              <div className="grid grid-cols-2 gap-3"><Field label="Check-in" required><input className="form-control" type="date" value={bookingIn} onChange={event => setBookingIn(event.target.value)} required /></Field><Field label="Check-out" required><input className="form-control" type="date" min={bookingIn} value={bookingOut} onChange={event => setBookingOut(event.target.value)} required /></Field></div>
              <div className="grid grid-cols-[1.3fr_0.7fr] gap-3"><Field label="Available room" required><select className="form-control" value={bookingRoomNo} onChange={event => setBookingRoomNo(event.target.value)} required><option value="">Choose a room</option>{availableRooms.map(room => <option value={room.number} key={room.number}>Room {room.number} · {room.type}</option>)}</select>{availableRooms.length === 0 && <p className="mt-1 text-[10px] text-amber-700">No rooms are free on these dates. Try a different date.</p>}</Field><Field label="Source"><select className="form-control" value={bookingChannel} onChange={event => setBookingChannel(event.target.value as Booking["channel"])}><option>Direct</option><option>Booking.com</option><option>Walk-in</option><option>Expedia</option></select></Field></div>
              {bookingRoomNo && <BookingQuote room={workspace.rooms.find(item => item.number === bookingRoomNo)} checkIn={bookingIn} checkOut={bookingOut} />}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-white/[0.08]"><button type="button" className="secondary-button" onClick={() => setDialog(null)}>Cancel</button><button type="submit" disabled={!bookingRoomNo} className="primary-button"><Plus size={14} />Create booking</button></div>
            </form>
          </>}

          {dialog === "guest" && <>
            <DialogHeader className="border-b border-slate-100 px-6 pb-4 pt-6 text-left dark:border-white/[0.08]"><DialogTitle className="text-[18px]">Add a guest</DialogTitle><DialogDescription className="text-[12px]">A profile makes repeat stays faster to book.</DialogDescription></DialogHeader>
            <form onSubmit={addGuest} className="space-y-4 px-6 py-5"><Field label="Full name" required><input className="form-control" value={guestForm.name} onChange={event => setGuestForm({ ...guestForm, name: event.target.value })} placeholder="e.g. Rahul Sharma" required minLength={2} autoFocus /></Field><Field label="Phone number" required><input className="form-control" type="tel" value={guestForm.phone} onChange={event => setGuestForm({ ...guestForm, phone: event.target.value })} placeholder="+91 98765 43210" required /></Field><Field label="Email address"><input className="form-control" type="email" value={guestForm.email} onChange={event => setGuestForm({ ...guestForm, email: event.target.value })} placeholder="guest@example.com" /></Field><div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-white/[0.08]"><button type="button" className="secondary-button" onClick={() => setDialog(null)}>Cancel</button><button type="submit" className="primary-button"><UserPlus size={14} />Add guest</button></div></form>
          </>}

          {dialog === "checkin" && <>
            <DialogHeader className="border-b border-slate-100 px-6 pb-4 pt-6 text-left dark:border-white/[0.08]"><div className="mb-1 flex items-center gap-2 text-[10px] font-semibold tracking-[0.12em] text-[#527a68]"><KeyRound size={13} />FRONT DESK · CHECK-IN</div><DialogTitle className="text-[18px]">Welcome your guest</DialogTitle><DialogDescription className="text-[12px]">Review the reservation, confirm details, and assign the room.</DialogDescription></DialogHeader>
            <div className="space-y-5 px-6 py-5"><StepProgress labels={["Guest", "Room", "Payment", "Confirm"]} current={3} />
              <Field label="Today's arrivals"><select className="form-control" value={selectedBookingId || ""} onChange={event => setSelectedBookingId(event.target.value)}><option value="">Choose a booking</option>{workspace.bookings.filter(item => item.status === "confirmed").map(item => <option key={item.id} value={item.id}>{item.guestName} · {item.id} · Room {item.roomNumber}</option>)}</select></Field>
              {selectedBooking ? <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]"><div className="flex items-center gap-3"><Avatar name={selectedBooking.guestName} size="lg" /><div className="min-w-0 flex-1"><p className="truncate text-[14px] font-semibold">{selectedBooking.guestName}</p><p className="mt-1 text-[10px] text-slate-500">{selectedBooking.id} · {selectedBooking.channel}</p></div><StatusPill status={selectedBooking.status} /></div><div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200/80 pt-3 dark:border-white/10"><InfoCell label="Room" value={`${selectedBooking.roomNumber} · ${selectedBooking.roomType}`} /><InfoCell label="Stay" value={`${dateDisplay(selectedBooking.checkIn)} – ${dateDisplay(selectedBooking.checkOut)}`} /><InfoCell label="Payment" value={selectedBooking.paid >= selectedBooking.amount ? "Paid in full" : `${currency(selectedBooking.paid)} paid`} /><InfoCell label="Balance" value={currency(Math.max(0, selectedBooking.amount - selectedBooking.paid))} /></div><p className="mt-3 flex items-start gap-2 text-[10px] leading-relaxed text-slate-500"><ShieldCheck size={13} className="mt-0.5 shrink-0 text-[#54806d]" />Confirm the guest's ID and contact details at the desk before completing check-in.</p></div> : <EmptyPanel title="No booking selected" detail="Choose an arrival above or create a booking first." />}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-white/[0.08]"><button className="secondary-button" onClick={() => setDialog(null)}>Cancel</button><button disabled={!selectedBooking || selectedBooking.status === "checked-in"} onClick={completeCheckin} className="primary-button"><KeyRound size={14} />Check in guest</button></div>
            </div>
          </>}

          {dialog === "checkout" && <>
            <DialogHeader className="border-b border-slate-100 px-6 pb-4 pt-6 text-left dark:border-white/[0.08]"><div className="mb-1 flex items-center gap-2 text-[10px] font-semibold tracking-[0.12em] text-[#527a68]"><CreditCard size={13} />FRONT DESK · CHECK-OUT</div><DialogTitle className="text-[18px]">Close the stay</DialogTitle><DialogDescription className="text-[12px]">Settle the folio, then return the room to housekeeping.</DialogDescription></DialogHeader>
            <div className="space-y-4 px-6 py-5"><Field label="Current in-house guest"><select className="form-control" value={selectedBookingId || ""} onChange={event => setSelectedBookingId(event.target.value)}><option value="">Choose a checked-in stay</option>{workspace.bookings.filter(item => item.status === "checked-in").map(item => <option key={item.id} value={item.id}>{item.guestName} · Room {item.roomNumber} · {item.id}</option>)}</select></Field>
              {selectedBooking ? <><div className="rounded-xl border border-slate-200 p-4 dark:border-white/10"><div className="flex items-center gap-3"><Avatar name={selectedBooking.guestName} /><div className="flex-1"><div className="text-[13px] font-semibold">{selectedBooking.guestName}</div><div className="mt-1 text-[10px] text-slate-500">Room {selectedBooking.roomNumber} · {nightsBetween(selectedBooking.checkIn, selectedBooking.checkOut)} night stay</div></div><StatusPill status="checked-in" /></div><div className="my-4 border-t border-dashed border-slate-200 dark:border-white/10" /><div className="space-y-2 text-[11px]"><BillLine label={`Room charges · ${nightsBetween(selectedBooking.checkIn, selectedBooking.checkOut)} nights`} value={roomSubtotal} /><BillLine label="Taxes and fees" value={roomTax} /><BillLine label="Services" value={serviceTotal} />{selectedServiceOrders.map(order => <BillLine key={order.id} label={`${order.serviceName} · ×${order.quantity}`} value={order.amount} />)}<BillLine label="Total" value={selectedBooking.amount} strong /><BillLine label="Paid so far" value={selectedBooking.paid} /><div className="mt-2 flex items-center justify-between rounded-lg bg-[#f3f6f4] px-3 py-2.5 text-[12px] font-semibold dark:bg-white/[0.05]"><span>Remaining balance</span><span className={selectedBooking.amount - selectedBooking.paid > 0 ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300"}>{currency(Math.max(0, selectedBooking.amount - selectedBooking.paid))}</span></div></div></div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-white/[0.07] dark:bg-white/[0.03]"><div className="mb-2 text-[10px] font-semibold">Add a hotel service</div><div className="flex items-end gap-2"><Field label="Service" className="flex-1"><select className="form-control" value={serviceToAdd} onChange={event => setServiceToAdd(event.target.value)}><option value="">Choose a service</option>{workspace.services.map(service => <option key={service.id} value={service.id}>{service.name} · {currency(service.price)}</option>)}</select></Field><button disabled={!serviceToAdd} onClick={() => addServiceToBooking(selectedBooking)} className="secondary-button mb-[1px]"><Plus size={13} />Add</button></div></div>
              {selectedBooking.amount > selectedBooking.paid && <div className="flex items-end gap-2"><Field label="Collect via" className="flex-1"><select className="form-control" value={checkoutPayment} onChange={event => setCheckoutPayment(event.target.value)}><option>UPI</option><option>Card</option><option>Cash</option><option>Bank transfer</option></select></Field><button onClick={() => collectPayment(selectedBooking)} className="primary-button mb-[1px]"><Wallet size={14} />Collect {currency(selectedBooking.amount - selectedBooking.paid)}</button></div>}
              </> : <EmptyPanel title="No in-house stay selected" detail="Select a checked-in guest to review their folio." />}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-white/[0.08]"><button className="secondary-button" onClick={() => setDialog(null)}>Cancel</button><button disabled={!selectedBooking || selectedBooking.amount > selectedBooking.paid} onClick={() => selectedBooking && completeCheckout(selectedBooking)} className="primary-button"><Check size={14} />Complete checkout</button></div>
            </div>
          </>}

          {dialog === "invoice" && selectedBooking && <>
            <DialogHeader className="no-print border-b border-slate-100 px-6 pb-4 pt-6 text-left dark:border-white/[0.08]"><div className="mb-1 flex items-center gap-2 text-[10px] font-semibold tracking-[0.12em] text-[#527a68]"><FileText size={13} />FOLIO · {selectedBooking.id}</div><DialogTitle className="text-[18px]">Guest invoice</DialogTitle><DialogDescription className="text-[12px]">Aster House, Bengaluru · created {dateDisplay(todayKey, { day: "numeric", month: "long", year: "numeric" })}</DialogDescription></DialogHeader>
            <Invoice booking={selectedBooking} serviceOrders={workspace.serviceOrders.filter(order => order.bookingId === selectedBooking.id)} onPrint={() => window.print()} />
          </>}

          {dialog === "guest-profile" && selectedGuest && <>
            <DialogHeader className="border-b border-slate-100 px-6 pb-4 pt-6 text-left dark:border-white/[0.08]"><DialogTitle className="sr-only">Guest profile</DialogTitle><DialogDescription className="sr-only">Guest profile details and internal note.</DialogDescription><div className="flex items-center gap-3"><Avatar name={selectedGuest.name} size="lg" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-[17px] font-semibold">{selectedGuest.name}</h2>{selectedGuest.tier === "VIP" || selectedGuest.tier === "Gold" ? <span className="rounded-full bg-[#f7f0e3] px-2 py-1 text-[9px] font-semibold text-[#8b6a35] dark:bg-amber-300/10 dark:text-amber-200">{selectedGuest.tier} guest</span> : null}</div><p className="mt-1 text-[10px] text-slate-500">{selectedGuest.id} · {selectedGuest.stays} stays · {currency(selectedGuest.spend)} lifetime</p></div></div></DialogHeader>
            <div className="space-y-5 px-6 py-5"><div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><InfoCell label="Phone" value={selectedGuest.phone} /><InfoCell label="Email" value={selectedGuest.email} /><InfoCell label="Preference" value={selectedGuest.preference} /></div><div><h3 className="mb-2 text-[11px] font-semibold">Stay history</h3><div className="space-y-2">{workspace.bookings.filter(booking => booking.guestId === selectedGuest.id).slice(0, 3).map(booking => <div key={booking.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-white/[0.04]"><div><div className="text-[11px] font-medium">Room {booking.roomNumber} · {booking.roomType}</div><div className="mt-1 text-[9px] text-slate-500">{dateDisplay(booking.checkIn)} – {dateDisplay(booking.checkOut)} · {booking.id}</div></div><StatusPill status={booking.status} /></div>)}{!workspace.bookings.some(booking => booking.guestId === selectedGuest.id) && <p className="rounded-lg bg-slate-50 p-3 text-[10px] text-slate-500 dark:bg-white/[0.04]">No stays recorded yet.</p>}</div></div><Field label="Internal note" detail="Visible to hotel staff only"><textarea className="form-control min-h-20 resize-y" value={guestNote} onChange={event => setGuestNote(event.target.value)} placeholder="Preferences, requests, or useful context for the next stay..." /></Field><div className="flex justify-between gap-2 border-t border-slate-100 pt-4 dark:border-white/[0.08]"><button className="secondary-button" onClick={() => { setBookingGuestId(selectedGuest.id); setDialog("booking"); }}><Plus size={14} />New booking</button><button className="primary-button" onClick={saveGuestNote}><Check size={14} />Save note</button></div></div>
          </>}

          {dialog === "room" && selectedRoom && <>
            <DialogHeader className="border-b border-slate-100 px-6 pb-4 pt-6 text-left dark:border-white/[0.08]"><div className="mb-1 flex items-center gap-2 text-[10px] font-semibold tracking-[0.12em] text-[#527a68]"><BedDouble size={13} />ROOM · FLOOR {selectedRoom.floor}</div><DialogTitle className="text-[18px]">Room {selectedRoom.number}</DialogTitle><DialogDescription className="text-[12px]">{selectedRoom.type} · {currency(selectedRoom.rate)} per night</DialogDescription></DialogHeader><div className="space-y-4 px-6 py-5"><div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-white/[0.04]"><div><p className="text-[12px] font-semibold">Current room status</p><p className="mt-1 text-[10px] text-slate-500">Update it when the room is ready for the next guest.</p></div><StatusPill status={selectedRoom.status} /></div><Field label="Change status"><select className="form-control" value={selectedRoom.status} onChange={event => updateRoomStatus(selectedRoom.number, event.target.value as RoomStatus)}><option value="available">Available</option><option value="reserved">Reserved</option><option value="occupied">Occupied</option><option value="cleaning">Cleaning</option><option value="maintenance">Maintenance</option></select></Field><div className="flex gap-2"><button className="secondary-button flex-1" onClick={() => { setDialog(null); navigate("/housekeeping"); }}><Sparkles size={14} />Housekeeping board</button><button className="primary-button flex-1" onClick={() => { if (selectedRoom.status === "occupied") { const active = workspace.bookings.find(booking => booking.roomNumber === selectedRoom.number && booking.status === "checked-in"); active ? openCheckout(active.id) : addHousekeepingTask(selectedRoom.number); } else { addHousekeepingTask(selectedRoom.number); } }}><ClipboardActionIcon />Create task</button></div></div>
          </>}

          {dialog === "notifications" && <>
            <DialogHeader className="border-b border-slate-100 px-6 pb-4 pt-6 text-left dark:border-white/[0.08]"><div className="mb-1 flex items-center gap-2 text-[10px] font-semibold tracking-[0.12em] text-[#527a68]"><Bell size={13} />ACTIVITY</div><div className="flex items-center justify-between gap-2"><div><DialogTitle className="text-[18px]">Notifications</DialogTitle><DialogDescription className="mt-1 text-[12px]">Updates for today's operations.</DialogDescription></div><button className="text-[10px] font-semibold text-[#47715e] hover:underline dark:text-emerald-300" onClick={() => updateWorkspace(current => ({ ...current, notifications: current.notifications.map(item => ({ ...item, unread: false })) }))}>Mark all read</button></div></DialogHeader>
            <div className="px-6 py-4"><div className="mb-3 flex flex-wrap gap-1.5">{["All", "Bookings", "Payments", "Operations", "System"].map(item => <button key={item} onClick={() => setNotificationFilter(item)} className={`rounded-full px-2.5 py-1 text-[9px] font-medium ${notificationFilter === item ? "bg-[#234d46] text-white dark:bg-[#a6cabb] dark:text-[#142a35]" : "bg-slate-100 text-slate-500 dark:bg-white/[0.05] dark:text-slate-300"}`}>{item}</button>)}</div><div className="max-h-[55vh] space-y-1 overflow-y-auto">{matchingNotifications.map(item => <NotificationRow key={item.id} item={item} onRead={() => updateWorkspace(current => ({ ...current, notifications: current.notifications.map(note => note.id === item.id ? { ...note, unread: false } : note) }))} />)}{!matchingNotifications.length && <EmptyPanel title="All caught up" detail="Nothing in this category yet." />}</div></div>
          </>}
        </DialogContent>
      </Dialog>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="top-[18%] max-w-xl translate-y-0 overflow-hidden p-0 dark:border-white/10 dark:bg-[#142332]">
          <DialogHeader className="sr-only"><DialogTitle>Search StayFlow</DialogTitle><DialogDescription>Search guests, bookings, rooms and payments.</DialogDescription></DialogHeader>
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 dark:border-white/10"><Search size={17} className="shrink-0 text-slate-400" /><input autoFocus className="h-14 min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-slate-400" placeholder="Search guests, bookings, rooms..." value={query} onChange={event => setQuery(event.target.value)} /><button onClick={() => setSearchOpen(false)} className="rounded border border-slate-200 px-1.5 py-0.5 text-[9px] text-slate-500 dark:border-white/10">ESC</button></div>
          <div className="max-h-[55vh] overflow-y-auto p-2">{query.trim() ? <SearchResults query={query} workspace={workspace} onClose={() => setSearchOpen(false)} onGuest={openGuest} onBooking={id => { setSelectedBookingId(id); setDialog("invoice"); setSearchOpen(false); }} onRoom={roomNo => { setSelectedRoomNo(roomNo); setDialog("room"); setSearchOpen(false); }} /> : <div className="p-2"><p className="px-2 pb-2 text-[9px] font-semibold tracking-[0.12em] text-slate-400">QUICK ACTIONS</p>{pageActions.map(item => { const Icon = item.icon; return <button key={item.label} onClick={() => { setSearchOpen(false); item.action(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-white/[0.05]"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf4f0] text-[#3f6955] dark:bg-emerald-400/10 dark:text-emerald-200"><Icon size={15} /></span><span className="min-w-0 flex-1"><span className="block text-[11px] font-semibold">{item.label}</span><span className="mt-0.5 block text-[9px] text-slate-500">{item.detail}</span></span><ArrowRight size={13} className="text-slate-400" /></button>; })}</div>}</div>
          <div className="border-t border-slate-100 px-4 py-2.5 text-[9px] text-slate-400 dark:border-white/10">Search is local to this demo workspace · <kbd className="rounded border border-slate-200 px-1 dark:border-white/10">Ctrl K</kbd> to open</div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function Field({ label, required, detail, className = "", children }: { label: string; required?: boolean; detail?: string; className?: string; children: ReactNode }) {
  return <label className={`block min-w-0 ${className}`}><span className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-slate-700 dark:text-slate-200">{label}{required && <span className="text-rose-600">*</span>}</span>{children}{detail && <span className="mt-1 block text-[9px] text-slate-500">{detail}</span>}</label>;
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><div className="text-[9px] font-medium uppercase tracking-[0.08em] text-slate-400">{label}</div><div className="mt-1 truncate text-[10px] font-medium text-slate-700 dark:text-slate-200">{value}</div></div>;
}

function BillLine({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return <div className={`flex items-center justify-between ${strong ? "pt-1 text-[12px] font-semibold" : "text-[10px] text-slate-500 dark:text-slate-400"}`}><span>{label}</span><span className={strong ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-200"}>{currency(value)}</span></div>;
}

function BookingQuote({ room, checkIn, checkOut }: { room?: Room; checkIn: string; checkOut: string }) {
  if (!room || checkOut <= checkIn) return null;
  const quote = calculateStayQuote(room.rate, checkIn, checkOut);
  return <div className="rounded-xl border border-[#dce9e2] bg-[#f5f9f6] p-3.5 dark:border-emerald-300/10 dark:bg-emerald-300/[0.04]"><div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-semibold text-[#456d57] dark:text-emerald-200">Stay estimate</span><span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-medium text-[#527a68] dark:bg-white/[0.06]">{quote.nights} {quote.nights === 1 ? "night" : "nights"}</span></div><BillLine label={`${room.type} · ${quote.nights} ${quote.nights === 1 ? "night" : "nights"}`} value={quote.subtotal} /><BillLine label="Taxes & fees (12%)" value={quote.tax} /><div className="mt-2 border-t border-[#dce9e2] pt-2 dark:border-white/10"><BillLine label="Estimated total" value={quote.total} strong /></div></div>;
}

function StepProgress({ labels, current }: { labels: string[]; current: number }) {
  return <div className="flex items-center">{labels.map((label, index) => <div className="flex flex-1 items-center last:flex-none" key={label}><div className="flex items-center gap-1.5"><span className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-semibold ${index < current ? "bg-[#234d46] text-white dark:bg-[#a6cabb] dark:text-[#142a35]" : index === current ? "border border-[#6e9583] bg-[#eef4f0] text-[#305743] dark:border-emerald-300/40 dark:bg-emerald-300/10 dark:text-emerald-200" : "bg-slate-100 text-slate-400 dark:bg-white/[0.06]"}`}>{index < current ? <Check size={12} /> : index + 1}</span><span className={`hidden text-[9px] sm:block ${index === current ? "font-semibold text-slate-800 dark:text-white" : "text-slate-400"}`}>{label}</span></div>{index < labels.length - 1 && <div className={`mx-2 h-px flex-1 ${index < current ? "bg-[#729582]" : "bg-slate-200 dark:bg-white/10"}`} />}</div>)}</div>;
}

function EmptyPanel({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-5 py-8 text-center dark:border-white/10"><span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/[0.05]"><CircleCheck size={17} /></span><p className="text-[12px] font-semibold">{title}</p><p className="mt-1 max-w-[250px] text-[10px] leading-relaxed text-slate-500">{detail}</p>{action && <div className="mt-4">{action}</div>}</div>;
}

function SearchResults({ query, workspace, onClose, onGuest, onBooking, onRoom }: { query: string; workspace: Workspace; onClose: () => void; onGuest: (id: string) => void; onBooking: (id: string) => void; onRoom: (roomNo: string) => void }) {
  const needle = query.toLowerCase();
  const guests = workspace.guests.filter(guest => [guest.name, guest.phone, guest.email, guest.id].some(value => value.toLowerCase().includes(needle))).slice(0, 4);
  const bookings = workspace.bookings.filter(booking => [booking.id, booking.guestName, booking.roomNumber].some(value => value.toLowerCase().includes(needle))).slice(0, 4);
  const rooms = workspace.rooms.filter(room => room.number.toLowerCase().includes(needle) || room.type.toLowerCase().includes(needle)).slice(0, 3);
  if (!guests.length && !bookings.length && !rooms.length) return <div className="p-8 text-center"><Search size={22} className="mx-auto text-slate-300" /><p className="mt-3 text-[12px] font-semibold">No results found</p><p className="mt-1 text-[10px] text-slate-500">Try a name, room number, or booking ID.</p></div>;
  return <div className="space-y-2 p-1">
    {guests.length > 0 && <SearchGroup title="Guests">{guests.map(guest => <button key={guest.id} onClick={() => { onClose(); onGuest(guest.id); }} className="result-row"><Avatar name={guest.name} size="sm" /><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-medium">{guest.name}</span><span className="mt-0.5 block truncate text-[9px] text-slate-500">{guest.phone} · {guest.id}</span></span><ArrowRight size={13} className="text-slate-400" /></button>)}</SearchGroup>}
    {bookings.length > 0 && <SearchGroup title="Bookings">{bookings.map(booking => <button key={booking.id} onClick={() => onBooking(booking.id)} className="result-row"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/[0.05]"><CalendarDays size={14} /></span><span className="min-w-0 flex-1"><span className="block text-[11px] font-medium">{booking.id} · Room {booking.roomNumber}</span><span className="mt-0.5 block truncate text-[9px] text-slate-500">{booking.guestName} · {dateDisplay(booking.checkIn)}</span></span><StatusPill status={booking.status} /></button>)}</SearchGroup>}
    {rooms.length > 0 && <SearchGroup title="Rooms">{rooms.map(room => <button key={room.number} onClick={() => onRoom(room.number)} className="result-row"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/[0.05]"><BedDouble size={14} /></span><span className="flex-1 text-left text-[11px] font-medium">Room {room.number} · {room.type}</span><StatusPill status={room.status} /></button>)}</SearchGroup>}
  </div>;
}
function SearchGroup({ title, children }: { title: string; children: ReactNode }) { return <section><p className="px-2 pb-1 pt-2 text-[9px] font-semibold tracking-[0.13em] text-slate-400">{title.toUpperCase()}</p>{children}</section>; }

function OverviewPage({ greetingName, workspace, occupancy, revenueToday, arrivals, departures, onNewBooking, onAddGuest, onOpenCheckin, onOpenCheckout, onOpenBooking, onNavigate, onOpenTask }: { greetingName: string; workspace: Workspace; occupancy: number; revenueToday: number; arrivals: Booking[]; departures: Booking[]; onNewBooking: () => void; onAddGuest: () => void; onOpenCheckin: () => void; onOpenCheckout: () => void; onOpenBooking: (id: string) => void; onNavigate: (path: string) => void; onOpenTask: () => void }) {
  const occupied = workspace.rooms.filter(room => room.status === "occupied").length;
  const revenueTrend = [
    { day: "Mon", actual: 31 }, { day: "Tue", actual: 37 }, { day: "Wed", actual: 34 }, { day: "Thu", actual: 42 },
    { day: "Fri", actual: 39 }, { day: "Sat", actual: 48 }, { day: "Sun", actual: 43 },
  ];
  const events = [
    { time: "08:45", title: "Room 203 · Guest checked out", type: "Departure", icon: ArrowDownRight, color: "bg-amber-100 text-amber-700" },
    { time: "09:30", title: "Room 106 · Cleaning in progress", type: "Housekeeping", icon: Sparkles, color: "bg-blue-100 text-blue-700" },
    { time: "11:00", title: `${arrivals[0]?.guestName || "Aarav Mehta"} · Arrival expected`, type: "Check-in", icon: KeyRound, color: "bg-emerald-100 text-emerald-700" },
    { time: "13:15", title: "Airport pickup · Terminal 2", type: "Guest service", icon: Headphones, color: "bg-violet-100 text-violet-700" },
    { time: "15:00", title: "Room 318 · VIP arrival", type: "Check-in", icon: KeyRound, color: "bg-emerald-100 text-emerald-700" },
  ];
  const quickActions: { label: string; note: string; icon: LucideIcon; action: () => void; tone: string }[] = [
    { label: "New booking", note: "Reserve a room", icon: CalendarDays, action: onNewBooking, tone: "bg-[#eaf1ed] text-[#315d4b]" },
    { label: "Check in", note: `${arrivals.length} arriving today`, icon: KeyRound, action: onOpenCheckin, tone: "bg-[#edf2f6] text-[#466779]" },
    { label: "Check out", note: `${departures.length} departing today`, icon: CreditCard, action: onOpenCheckout, tone: "bg-[#f5eee4] text-[#86683c]" },
    { label: "Add a guest", note: "Create a profile", icon: UserPlus, action: onAddGuest, tone: "bg-[#f1edf4] text-[#6c577f]" },
  ];
  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><div className="mb-2 flex items-center gap-2 text-[10px] font-medium text-slate-500 dark:text-slate-400"><span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />{initialDate} <span className="text-slate-300">·</span> Aster House, Bengaluru</div><h1 className="text-[27px] font-semibold tracking-[-0.045em] sm:text-[30px]">Good morning, {greetingName}<span className="text-[#a1bcae]">.</span></h1><p className="mt-1.5 text-[12px] text-slate-500 dark:text-slate-400">Here’s what needs your attention today.</p></div>
      <button className="primary-button self-start sm:self-auto" onClick={onNewBooking}><Plus size={15} />New booking</button>
    </div>

    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
      <MetricCard label="Occupancy" value={`${occupancy}%`} note={`${occupied} occupied · ${workspace.rooms.filter(room => room.status === "reserved").length} reserved`} icon={BedDouble} change="+4.2%" trend="up" />
      <MetricCard label="Today's revenue" value={currency(revenueToday)} note="Room revenue · demo ledger" icon={Wallet} change="+8.2%" trend="up" />
      <MetricCard label="Arrivals" value={String(arrivals.length).padStart(2, "0")} note="Guests expected today" icon={ArrowDownRight} change={`${arrivals.length} due`} trend="flat" />
      <MetricCard label="Departures" value={String(departures.length).padStart(2, "0")} note="Stays to close today" icon={ArrowUpRight} change={`${departures.length} due`} trend="flat" />
    </div>

    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {quickActions.map(action => { const Icon = action.icon; return <button key={action.label} onClick={action.action} className="group flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-3 py-3 text-left shadow-[0_2px_10px_rgba(20,35,48,0.02)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm dark:border-white/[0.08] dark:bg-[#142332]"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${action.tone}`}><Icon size={16} /></span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold">{action.label}</span><span className="mt-0.5 block truncate text-[9px] text-slate-500">{action.note}</span></span><ArrowRight size={13} className="hidden text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500 sm:block" /></button>; })}
    </div>

    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
      <Card className="p-5 sm:p-6">
        <SectionHeading title="Today's rhythm" detail="A live view of the moments that keep the hotel moving." action={<button onClick={onOpenTask} className="text-[10px] font-semibold text-[#416a57] hover:underline dark:text-emerald-300">Open operations <ArrowRight size={12} className="ml-1 inline" /></button>} />
        <div className="mt-5 space-y-0">{events.map((event, index) => { const Icon = event.icon; return <div key={event.time} className="relative flex gap-3 pb-4 last:pb-0"><div className="w-11 shrink-0 pt-1 text-[9px] font-medium tabular-nums text-slate-400">{event.time}</div><div className="relative flex w-8 shrink-0 justify-center"><span className={`z-10 flex h-7 w-7 items-center justify-center rounded-full ${event.color}`}><Icon size={13} /></span>{index !== events.length - 1 && <span className="absolute bottom-[-16px] top-7 w-px bg-slate-200 dark:bg-white/10" />}</div><div className="min-w-0 flex-1 border-b border-slate-100 pb-3 dark:border-white/[0.06]"><p className="text-[11px] font-medium leading-5">{event.title}</p><span className="mt-0.5 inline-block text-[9px] text-slate-500">{event.type}</span></div><button onClick={onOpenTask} className="self-center rounded-md px-2 py-1 text-[9px] font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5">View</button></div>; })}</div>
      </Card>
      <Card className="p-5 sm:p-6">
        <SectionHeading title="Revenue overview" detail="Daily room revenue · ₹ thousands" action={<button onClick={() => onNavigate("/reports")} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[9px] font-medium text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">This week <ChevronDown size={11} className="ml-1 inline" /></button>} />
        <div className="mt-5 flex items-end justify-between"><div><div className="text-[25px] font-semibold tracking-[-0.05em]">₹{Math.round(revenueToday / 1000)}k</div><div className="mt-1 flex items-center gap-1 text-[9px] font-medium text-emerald-700 dark:text-emerald-300"><ArrowUpRight size={12} />8.2% <span className="font-normal text-slate-400">vs. last week</span></div></div><div className="rounded-lg bg-[#eef4f0] px-2 py-1.5 text-[9px] font-medium text-[#47715e] dark:bg-emerald-300/10 dark:text-emerald-200">7 day view</div></div>
        <div className="mt-5 h-[166px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueTrend} margin={{ top: 8, right: 2, left: -26, bottom: 0 }}><defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5b8b73" stopOpacity={0.18} /><stop offset="95%" stopColor="#5b8b73" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} strokeDasharray="3 4" stroke="var(--border)" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#98a3ac", fontSize: 9 }} dy={7} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#98a3ac", fontSize: 9 }} tickFormatter={value => `₹${value}k`} /><ChartTooltip contentStyle={{ borderRadius: 10, border: "1px solid #e4e9e7", fontSize: 10 }} formatter={(value: number) => [`₹${value},000`, "Revenue"]} /><Area type="monotone" dataKey="actual" stroke="#4e8068" strokeWidth={2.3} fill="url(#revenueFill)" activeDot={{ r: 4, fill: "#4e8068", stroke: "white", strokeWidth: 2 }} /></AreaChart></ResponsiveContainer></div>
        <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-3 text-[9px] text-slate-500 dark:border-white/[0.08]"><span>Average daily revenue</span><span className="font-semibold text-slate-700 dark:text-slate-200">₹39,100</span></div>
      </Card>
    </div>

    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-[14px] font-semibold tracking-[-0.02em]">Arrivals & departures</h2><p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Your front desk queue for today.</p></div><div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-white/[0.05]"><span className="rounded-md bg-white px-2.5 py-1.5 text-[9px] font-semibold text-slate-700 shadow-sm dark:bg-[#223747] dark:text-slate-100">Arriving <span className="ml-1 text-emerald-700 dark:text-emerald-300">{arrivals.length}</span></span><button className="rounded-md px-2.5 py-1.5 text-[9px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400">Departing <span className="ml-1">{departures.length}</span></button></div></div>
        <div className="space-y-1">{arrivals.length > 0 ? arrivals.slice(0, 4).map(booking => <div key={booking.id} className="flex flex-wrap items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-slate-50 dark:hover:bg-white/[0.03]"><Avatar name={booking.guestName} /><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold">{booking.guestName}</p><p className="mt-1 text-[9px] text-slate-500">{booking.id} · Room {booking.roomNumber} · {booking.channel}</p></div><div className="hidden text-right sm:block"><p className="text-[10px] font-medium">{dateDisplay(booking.checkOut)}</p><p className="mt-1 text-[9px] text-slate-500">Check-out</p></div><button onClick={() => onOpenBooking(booking.id)} className="secondary-button !min-h-8 !px-2.5 !text-[9px]">Check in</button></div>) : <EmptyPanel title="No arrivals due" detail="Your arrival queue is clear for today." />}</div>
        <button onClick={() => onNavigate("/check-in")} className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">View all front-desk tasks <ArrowRight size={12} className="ml-1 inline" /></button>
      </Card>
      <Card className="p-5 sm:p-6">
        <SectionHeading title="Room pulse" detail="Live status across all 36 rooms." action={<button onClick={() => onNavigate("/rooms")} className="text-[10px] font-semibold text-[#416a57] hover:underline dark:text-emerald-300">Room board <ArrowRight size={12} className="ml-1 inline" /></button>} />
        <div className="flex items-center gap-5 py-2"><div className="relative h-[116px] w-[116px] shrink-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{ name: "Occupied", value: workspace.rooms.filter(room => room.status === "occupied").length }, { name: "Reserved", value: workspace.rooms.filter(room => room.status === "reserved").length }, { name: "Available", value: workspace.rooms.filter(room => room.status === "available").length }, { name: "Other", value: workspace.rooms.filter(room => ["cleaning", "maintenance"].includes(room.status)).length }]} dataKey="value" innerRadius={39} outerRadius={54} startAngle={90} endAngle={-270} paddingAngle={3} stroke="none"><Cell fill="#5e8b73" /><Cell fill="#8ca7b4" /><Cell fill="#d9e6dc" /><Cell fill="#d7ad68" /></Pie></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-[22px] font-semibold tracking-[-0.06em]">{occupancy}%</span><span className="text-[8px] text-slate-500">occupied</span></div></div><div className="min-w-0 flex-1 space-y-2.5">{[{ label: "Occupied", count: workspace.rooms.filter(room => room.status === "occupied").length, color: "bg-[#5e8b73]" }, { label: "Reserved", count: workspace.rooms.filter(room => room.status === "reserved").length, color: "bg-[#8ca7b4]" }, { label: "Available", count: workspace.rooms.filter(room => room.status === "available").length, color: "bg-[#d9e6dc]" }, { label: "Service", count: workspace.rooms.filter(room => ["cleaning", "maintenance"].includes(room.status)).length, color: "bg-[#d7ad68]" }].map(item => <div key={item.label} className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${item.color}`} /><span className="flex-1 text-[9px] text-slate-500">{item.label}</span><span className="text-[10px] font-semibold">{item.count}</span></div>)}</div></div>
        <div className="mt-4 flex items-center justify-between rounded-lg bg-[#f4f7f5] px-3 py-2.5 dark:bg-white/[0.04]"><span className="flex items-center gap-2 text-[10px] font-medium"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{workspace.tasks.filter(task => task.status === "needs-cleaning").length} rooms need attention</span><button onClick={onOpenTask} className="text-[9px] font-semibold text-[#416a57] dark:text-emerald-300">Review</button></div>
      </Card>
    </div>
    <div className="flex items-center gap-2 rounded-xl border border-[#e8edea] bg-[#f1f6f2] px-4 py-3 text-[10px] text-[#4d685a] dark:border-emerald-300/10 dark:bg-emerald-300/[0.04] dark:text-emerald-100"><Sparkles size={14} className="shrink-0" /><span><b className="font-semibold">A calm start to the day.</b> {arrivals.length} arrivals, {departures.length} departures, and {workspace.tasks.filter(task => task.status === "needs-cleaning").length} rooms to turn over.</span><button onClick={() => onNavigate("/check-in")} className="ml-auto shrink-0 font-semibold underline decoration-[#9fbaa8] underline-offset-2">Review desk</button></div>
  </div>;
}

function MetricCard({ label, value, note, icon: Icon, change, trend }: { label: string; value: string; note: string; icon: LucideIcon; change: string; trend: "up" | "flat" }) {
  return <Card className="p-3.5 sm:p-4"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{label}</span><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-500 dark:bg-white/[0.05] dark:text-slate-300"><Icon size={14} /></span></div><div className="mt-2 text-[23px] font-semibold tracking-[-0.055em] sm:text-[25px]">{value}</div><div className="mt-1.5 flex items-center justify-between gap-1"><span className="truncate text-[9px] text-slate-500">{note}</span><span className={`shrink-0 text-[8px] font-semibold ${trend === "up" ? "text-emerald-700 dark:text-emerald-300" : "text-[#7a8b96]"}`}>{trend === "up" && <ArrowUpRight size={10} className="mr-0.5 inline" />}{change}</span></div></Card>;
}

function BookingsPage({ bookings, allBookings, filter, setFilter, search, setSearch, onNew, onOpenBooking, onCheckin }: { bookings: Booking[]; allBookings: Booking[]; filter: string; setFilter: (value: string) => void; search: string; setSearch: (value: string) => void; onNew: () => void; onOpenBooking: (id: string) => void; onCheckin: (id?: string) => void }) {
  const [view, setView] = useState("List");
  return <div className="space-y-5">
    <PageHeader title="Bookings" subtitle="One clear view of every stay, from confirmation through checkout." action={<button onClick={onNew} className="primary-button"><Plus size={15} />New booking</button>} />
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"><SummaryCard label="Arriving today" value={String(allBookings.filter(item => item.checkIn === todayKey && item.status === "confirmed").length)} note="Confirmed stays" /><SummaryCard label="In-house" value={String(allBookings.filter(item => item.status === "checked-in").length)} note="Across 36 rooms" /><SummaryCard label="Departing today" value={String(allBookings.filter(item => item.checkOut === todayKey && item.status === "checked-in").length)} note="Stays due to close" /><SummaryCard label="Pending payment" value={currency(allBookings.reduce((sum, item) => sum + Math.max(0, item.amount - item.paid), 0))} note="Across current bookings" /></div>
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-white/[0.08] sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-white/[0.05]">{[{label:"All stays",value:"all"},{label:"Confirmed",value:"confirmed"},{label:"In house",value:"checked-in"},{label:"Checked out",value:"checked-out"}].map(item => <button key={item.value} onClick={() => setFilter(item.value)} className={`rounded-md px-2.5 py-1.5 text-[9px] font-medium transition ${filter === item.value ? "bg-white text-slate-800 shadow-sm dark:bg-[#223747] dark:text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400"}`}>{item.label}</button>)}</div><div className="flex gap-2"><div className="relative flex-1 sm:w-52"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="form-control !h-8 !pl-8 !text-[10px]" placeholder="Search stays..." value={search} onChange={event => setSearch(event.target.value)} /></div><button className="secondary-button !min-h-8 !px-2.5 !text-[9px]" onClick={() => setView(view === "List" ? "Calendar" : "List")}><CalendarDays size={13} />{view === "List" ? "Calendar" : "List view"}</button><button className="icon-button" aria-label="Filter bookings"><Filter size={14} /></button></div></div>
      {view === "Calendar" && <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.02]"><div className="flex items-center gap-2"><button className="icon-button" aria-label="Previous week"><ChevronLeft size={14} /></button><span className="text-[10px] font-semibold">28 Sep — 4 Oct, 2026</span><button className="icon-button" aria-label="Next week"><ChevronRight size={14} /></button></div><div className="flex gap-1">{["Day", "Week", "Month"].map(item => <button key={item} onClick={() => {}} className={`rounded-md px-2 py-1 text-[9px] ${item === "Week" ? "bg-white font-semibold shadow-sm dark:bg-[#223747]" : "text-slate-500"}`}>{item}</button>)}</div></div>}
      <BookingTable bookings={bookings} onOpen={onOpenBooking} onCheckin={onCheckin} />
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-[9px] text-slate-500 dark:border-white/[0.08]"><span>Showing <b className="text-slate-700 dark:text-slate-200">{Math.min(bookings.length, 8)}</b> of <b className="text-slate-700 dark:text-slate-200">{bookings.length}</b> stays</span><div className="flex gap-1"><button className="icon-button !h-7 !w-7" aria-label="Previous page"><ChevronLeft size={13} /></button><button className="h-7 w-7 rounded-md bg-[#234d46] text-[9px] font-semibold text-white dark:bg-[#a6cabb] dark:text-[#142a35]">1</button><button className="icon-button !h-7 !w-7" aria-label="Next page"><ChevronRight size={13} /></button></div></div>
    </Card>
  </div>;
}

function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) { return <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><div className="mb-2 text-[10px] font-medium text-slate-500">Aster House · Front desk</div><h1 className="text-[26px] font-semibold tracking-[-0.045em]">{title}</h1><p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p></div>{action}</div>; }
function SummaryCard({ label, value, note }: { label: string; value: string; note: string }) { return <Card className="p-3.5"><p className="text-[9px] font-medium text-slate-500">{label}</p><p className="mt-1.5 text-[20px] font-semibold tracking-[-0.05em]">{value}</p><p className="mt-1 text-[9px] text-slate-500">{note}</p></Card>; }

function BookingTable({ bookings, onOpen, onCheckin }: { bookings: Booking[]; onOpen: (id: string) => void; onCheckin: (id?: string) => void }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="bg-slate-50/60 text-[8px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:bg-white/[0.02]"><th className="px-4 py-3">Guest / booking</th><th className="px-3 py-3">Stay dates</th><th className="px-3 py-3">Room</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Payment</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody>{bookings.slice(0, 8).map(booking => <tr key={booking.id} className="border-t border-slate-100 text-[10px] hover:bg-slate-50/70 dark:border-white/[0.06] dark:hover:bg-white/[0.02]"><td className="px-4 py-3"><div className="flex items-center gap-2.5"><Avatar name={booking.guestName} size="sm" /><div><div className="font-semibold">{booking.guestName}</div><div className="mt-0.5 text-[9px] text-slate-500">{booking.id} · {booking.channel}</div></div></div></td><td className="px-3 py-3"><div>{dateDisplay(booking.checkIn)} — {dateDisplay(booking.checkOut)}</div><div className="mt-0.5 text-[9px] text-slate-500">{nightsBetween(booking.checkIn, booking.checkOut)} nights</div></td><td className="px-3 py-3"><div>Room {booking.roomNumber}</div><div className="mt-0.5 text-[9px] text-slate-500">{booking.roomType}</div></td><td className="px-3 py-3 font-semibold">{currency(booking.amount)}</td><td className="px-3 py-3"><StatusPill status={booking.status} /></td><td className="px-3 py-3"><StatusPill status={booking.paid >= booking.amount ? "paid" : booking.paid > 0 ? "partial" : "due"} /></td><td className="px-4 py-3 text-right"><button onClick={() => booking.status === "confirmed" ? onCheckin(booking.id) : onOpen(booking.id)} className="rounded-md px-2 py-1.5 text-[9px] font-semibold text-[#416a57] hover:bg-[#edf4f0] dark:text-emerald-300 dark:hover:bg-emerald-300/10">{booking.status === "confirmed" ? "Check in" : "View folio"}<ArrowRight size={11} className="ml-1 inline" /></button></td></tr>)}</tbody></table>{bookings.length === 0 && <div className="p-5"><EmptyPanel title="No stays match" detail="Try a different search or filter." /></div>}</div>;
}

function GuestsPage({ guests, search, setSearch, onOpenGuest, onAdd }: { guests: Guest[]; search: string; setSearch: (value: string) => void; onOpenGuest: (guestId: string) => void; onAdd: () => void }) {
  return <div className="space-y-5"><PageHeader title="Guests" subtitle="Know who's arriving, remember what matters, and make every stay feel personal." action={<button className="primary-button" onClick={onAdd}><UserPlus size={14} />Add guest</button>} /><div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"><SummaryCard label="Guest profiles" value="52" note="Across all stays" /><SummaryCard label="Returning guests" value="18" note="35% of guestbook" /><SummaryCard label="VIP & Gold" value="9" note="Personal welcome ready" /><SummaryCard label="Arriving today" value="12" note="2 early arrivals" /></div><Card className="overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-white/[0.08]"><div><h2 className="text-[13px] font-semibold">Guest directory</h2><p className="mt-1 text-[10px] text-slate-500">Profiles and stay history in one place.</p></div><div className="relative w-full sm:w-64"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={event => setSearch(event.target.value)} className="form-control !h-9 !pl-8 !text-[10px]" placeholder="Name, phone, or email" /></div></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead><tr className="bg-slate-50/60 text-[8px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:bg-white/[0.02]"><th className="px-4 py-3">Guest</th><th className="px-3 py-3">Contact</th><th className="px-3 py-3">Last stay</th><th className="px-3 py-3">Lifetime value</th><th className="px-3 py-3">Guest tier</th><th className="px-4 py-3 text-right">Profile</th></tr></thead><tbody>{guests.slice(0, 12).map(guest => { const latest = guest.id && undefined; return <tr key={guest.id} className="cursor-pointer border-t border-slate-100 text-[10px] hover:bg-slate-50/70 dark:border-white/[0.06] dark:hover:bg-white/[0.02]" onClick={() => onOpenGuest(guest.id)}><td className="px-4 py-3"><div className="flex items-center gap-2.5"><Avatar name={guest.name} size="sm" /><div><div className="font-semibold">{guest.name}</div><div className="mt-0.5 text-[9px] text-slate-500">{guest.id}</div></div></div></td><td className="px-3 py-3"><div>{guest.phone}</div><div className="mt-0.5 text-[9px] text-slate-500">{guest.email}</div></td><td className="px-3 py-3">{guest.stays > 0 ? "Recent stay" : "First visit"}</td><td className="px-3 py-3 font-semibold">{currency(guest.spend)}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-[9px] font-medium ${guest.tier === "VIP" || guest.tier === "Gold" ? "bg-[#f7f0e3] text-[#86683c] dark:bg-amber-300/10 dark:text-amber-200" : "bg-slate-100 text-slate-600 dark:bg-white/[0.05] dark:text-slate-300"}`}>{guest.tier}</span></td><td className="px-4 py-3 text-right"><button className="rounded-md px-2 py-1.5 text-[9px] font-semibold text-[#416a57] hover:bg-[#edf4f0] dark:text-emerald-300">View <ArrowRight size={11} className="ml-1 inline" /></button></td></tr>; })}</tbody></table>{guests.length === 0 && <div className="p-5"><EmptyPanel title="No guests found" detail="Check the spelling or add a new profile." action={<button className="primary-button" onClick={onAdd}><Plus size={13} />Add a guest</button>} /></div>}</div><div className="border-t border-slate-100 px-4 py-3 text-[9px] text-slate-500 dark:border-white/[0.08]">Showing {Math.min(guests.length, 12)} of {guests.length} guest profiles</div></Card></div>;
}

function StayFlowPage({ mode, bookings, guests, rooms, onCheckin, onCheckout, onGuest }: { mode: "checkin" | "checkout"; bookings: Booking[]; guests: Guest[]; rooms: Room[]; onCheckin: (id?: string) => void; onCheckout: (id?: string) => void; onGuest: (id: string) => void }) {
  const isCheckin = mode === "checkin";
  const records = bookings.filter(booking => isCheckin ? booking.status === "confirmed" && booking.checkIn <= todayKey : booking.status === "checked-in" && booking.checkOut <= todayKey);
  return <div className="space-y-5"><PageHeader title={isCheckin ? "Check-in" : "Check-out"} subtitle={isCheckin ? "A warm welcome, without the paperwork pile-up." : "Settle the folio, close the stay, and get the room ready again."} action={<div className="flex gap-2"><a href={isCheckin ? "/check-out" : "/check-in"} className="secondary-button">{isCheckin ? "Go to check-out" : "Go to check-in"}<ArrowRight size={13} /></a></div>} /><div className="grid gap-4 lg:grid-cols-[1fr_0.65fr]"><Card className="p-5 sm:p-6"><div className="mb-5 flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${isCheckin ? "bg-[#eaf1ed] text-[#315d4b]" : "bg-[#f5eee4] text-[#86683c]"}`}>{isCheckin ? <KeyRound size={16} /> : <CreditCard size={16} />}</span><h2 className="text-[15px] font-semibold">{isCheckin ? "Expected arrivals" : "Expected departures"}</h2></div><p className="ml-10 mt-1 text-[10px] text-slate-500">{initialDate} · {records.length} {isCheckin ? "guests to welcome" : "stays to close"}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-semibold dark:bg-white/[0.05]">{records.length} {isCheckin ? "due" : "due"}</span></div><div className="space-y-2">{records.slice(0, 8).map(booking => { const guest = guests.find(item => item.id === booking.guestId); const room = rooms.find(item => item.number === booking.roomNumber); return <div key={booking.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-white/[0.07]"><Avatar name={booking.guestName} /><div className="min-w-0 flex-1"><button onClick={() => onGuest(booking.guestId)} className="block truncate text-left text-[11px] font-semibold hover:underline">{booking.guestName}</button><p className="mt-1 text-[9px] text-slate-500">{booking.id} · Room {booking.roomNumber} · {room?.type}</p></div><div className="hidden text-right sm:block"><p className="text-[9px] font-medium">{guest?.phone}</p><p className="mt-1 text-[9px] text-slate-500">{isCheckin ? `${nightsBetween(booking.checkIn, booking.checkOut)} nights` : `${currency(Math.max(0, booking.amount - booking.paid))} due`}</p></div><button onClick={() => isCheckin ? onCheckin(booking.id) : onCheckout(booking.id)} className={`rounded-lg px-3 py-2 text-[9px] font-semibold ${isCheckin ? "bg-[#234d46] text-white hover:bg-[#193e38] dark:bg-[#a6cabb] dark:text-[#142a35]" : "border border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"}`}>{isCheckin ? "Start check-in" : "Review folio"}<ArrowRight size={11} className="ml-1 inline" /></button></div>; })}{!records.length && <EmptyPanel title={isCheckin ? "No arrivals due right now" : "No departures due right now"} detail="Your front desk queue is clear. Check the bookings page for upcoming stays." />}</div></Card><div className="space-y-4"><Card className="p-5"><SectionHeading title="A smoother arrival" detail="A quick reminder for the front desk." /><div className="space-y-3">{[{n:"01",text:"Match the booking to a guest ID"},{n:"02",text:"Confirm room and stay dates"},{n:"03",text:"Verify balance or collect deposit"},{n:"04",text:"Hand over keys and welcome them"}].map(item => <div key={item.n} className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-[9px] font-semibold text-slate-500 dark:bg-white/[0.05]">{item.n}</span><span className="text-[10px] text-slate-600 dark:text-slate-300">{item.text}</span></div>)}</div></Card><Card className="bg-[#f4f7f5] p-5 dark:bg-[#182c31]"><div className="flex items-center gap-2 text-[11px] font-semibold text-[#345b49] dark:text-emerald-200"><ShieldCheck size={15} />Guest details stay private</div><p className="mt-2 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">Verify identity at the property before handing over room keys. Internal notes are visible only to the staff using this demo workspace.</p></Card></div></div></div>;
}

function RoomsPage({ rooms, allRooms, filter, setFilter, onSelectRoom }: { rooms: Room[]; allRooms: Room[]; filter: string; setFilter: (value: string) => void; onSelectRoom: (room: Room) => void }) {
  const floors = Array.from(new Set(allRooms.map(room => room.floor))).sort();
  const counts = (status: RoomStatus) => allRooms.filter(room => room.status === status).length;
  return <div className="space-y-5"><PageHeader title="Room board" subtitle="Know what's ready, what's occupied, and what needs a little care." action={<button className="secondary-button" onClick={() => setFilter("all")}><Filter size={13} />Reset filters</button>} /><div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5"><RoomSummary label="Available" value={counts("available")} color="text-emerald-700" /><RoomSummary label="Reserved" value={counts("reserved")} color="text-blue-700" /><RoomSummary label="Occupied" value={counts("occupied")} color="text-slate-700" /><RoomSummary label="Cleaning" value={counts("cleaning")} color="text-amber-700" /><RoomSummary label="Maintenance" value={counts("maintenance")} color="text-rose-700" /></div><Card className="p-4 sm:p-5"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-[13px] font-semibold">36 rooms · Aster House</h2><p className="mt-1 text-[10px] text-slate-500">Select a room to view details or update its status.</p></div><div className="flex flex-wrap gap-1.5"><button onClick={() => setFilter("all")} className={`filter-chip ${filter === "all" ? "filter-chip-active" : ""}`}>All floors</button>{floors.map(floor => <button key={floor} onClick={() => setFilter(String(floor))} className={`filter-chip ${filter === String(floor) ? "filter-chip-active" : ""}`}>Floor {floor}</button>)}</div></div><div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 border-b border-slate-100 pb-4 dark:border-white/[0.08]">{[{status:"available",label:"Available"},{status:"reserved",label:"Reserved"},{status:"occupied",label:"Occupied"},{status:"cleaning",label:"Cleaning"},{status:"maintenance",label:"Maintenance"}].map(item => <button key={item.status} onClick={() => setFilter(filter === item.status ? "all" : item.status)} className={`flex items-center gap-1.5 rounded-md text-[9px] ${filter === item.status ? "font-semibold text-slate-900 dark:text-white" : "text-slate-500"}`}><span className={`h-2 w-2 rounded-full ${item.status === "available" ? "bg-emerald-500" : item.status === "reserved" ? "bg-blue-500" : item.status === "occupied" ? "bg-slate-500" : item.status === "cleaning" ? "bg-amber-500" : "bg-rose-500"}`} />{item.label} <span className="text-slate-400">{counts(item.status as RoomStatus)}</span></button>)}</div><div className="space-y-6">{floors.filter(floor => filter === "all" || filter === String(floor) || rooms.some(room => room.floor === floor && room.status === filter)).map(floor => { const floorRooms = rooms.filter(room => room.floor === floor); if (!floorRooms.length) return null; return <section key={floor}><div className="mb-3 flex items-center justify-between"><h3 className="text-[10px] font-semibold tracking-[0.08em]">FLOOR {floor}</h3><span className="text-[9px] text-slate-500">{floorRooms.length} rooms</span></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">{floorRooms.map(room => <RoomTile key={room.number} room={room} onSelect={() => onSelectRoom(room)} />)}</div></section>; })}</div></Card></div>;
}
function RoomSummary({ label, value, color }: { label: string; value: number; color: string }) { return <Card className="px-3 py-3.5"><div className="text-[9px] text-slate-500">{label}</div><div className={`mt-1 text-[20px] font-semibold tracking-[-0.04em] ${color}`}>{String(value).padStart(2, "0")}</div></Card>; }
function RoomTile({ room, onSelect }: { room: Room; onSelect: () => void }) { const dots: Record<RoomStatus, string> = { available: "bg-emerald-500", reserved: "bg-blue-500", occupied: "bg-slate-500", cleaning: "bg-amber-500", maintenance: "bg-rose-500" }; return <button onClick={onSelect} className="group rounded-xl border border-slate-200/80 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:border-white/[0.08] dark:bg-[#192a38] dark:hover:border-white/20"><div className="flex items-start justify-between"><span className="text-[15px] font-semibold tracking-[-0.04em]">{room.number}</span><span className={`mt-1 h-2 w-2 rounded-full ${dots[room.status]}`} /></div><div className="mt-1 truncate text-[9px] text-slate-500">{room.type}</div><div className="mt-3 flex items-center justify-between"><StatusPill status={room.status} /><span className="text-[8px] text-slate-400">{currency(room.rate)}<span className="hidden sm:inline"> / night</span></span></div></button>; }

function HousekeepingPage({ tasks, filter, setFilter, onUpdateTask, onAddTask }: { tasks: HousekeepingTask[]; filter: string; setFilter: (value: string) => void; onUpdateTask: (id: string, status: TaskStatus) => void; onAddTask: () => void }) {
  const columns: { key: TaskStatus; title: string; subtitle: string; tone: string; next?: TaskStatus; nextLabel?: string }[] = [
    { key: "needs-cleaning", title: "Needs cleaning", subtitle: "Ready to assign", tone: "bg-amber-500", next: "in-progress", nextLabel: "Start cleaning" },
    { key: "in-progress", title: "In progress", subtitle: "Being turned over", tone: "bg-blue-500", next: "ready", nextLabel: "Mark clean" },
    { key: "ready", title: "Ready for guests", subtitle: "Inspected & available", tone: "bg-emerald-500" },
  ];
  const filteredTasks = tasks.filter(task => filter === "all" || task.priority.toLowerCase() === filter);
  return <div className="space-y-5"><PageHeader title="Housekeeping" subtitle="A focused board for room turns, inspections, and maintenance follow-up." action={<button onClick={onAddTask} className="primary-button"><Plus size={14} />Add task</button>} /><div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"><SummaryCard label="Need cleaning" value={String(tasks.filter(task => task.status === "needs-cleaning").length)} note="2 priority turns" /><SummaryCard label="In progress" value={String(tasks.filter(task => task.status === "in-progress").length)} note="Average turn 32 min" /><SummaryCard label="Ready" value={String(tasks.filter(task => task.status === "ready").length)} note="Passed last inspection" /><SummaryCard label="Maintenance" value="1" note="Room 108 · AC check" /></div><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-white/[0.05]">{[{label:"All tasks",value:"all"},{label:"High priority",value:"high"},{label:"Normal",value:"normal"}].map(item => <button key={item.value} onClick={() => setFilter(item.value)} className={`rounded-md px-2.5 py-1.5 text-[9px] font-medium ${filter === item.value ? "bg-white text-slate-800 shadow-sm dark:bg-[#223747] dark:text-white" : "text-slate-500"}`}>{item.label}</button>)}</div><div className="flex items-center gap-1.5 text-[9px] text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Shift board updated just now</div></div><div className="grid gap-4 lg:grid-cols-3">{columns.map(column => { const list = filteredTasks.filter(task => task.status === column.key); return <div key={column.key} className="min-w-0"><div className="mb-2.5 flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${column.tone}`} /><h2 className="text-[11px] font-semibold">{column.title}</h2><span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px] font-semibold text-slate-500 dark:bg-white/[0.05]">{list.length}</span><button className="ml-auto rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5" aria-label={`More ${column.title} actions`}><MoreHorizontal size={15} /></button></div><p className="mb-3 text-[9px] text-slate-500">{column.subtitle}</p><div className="space-y-2.5">{list.map(task => <TaskCard key={task.id} task={task} action={column.next ? () => onUpdateTask(task.id, column.next!) : undefined} actionLabel={column.nextLabel} />)}{list.length === 0 && <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-[10px] text-slate-400 dark:border-white/10">No tasks here.</div>}</div></div>; })}</div></div>;
}
function TaskCard({ task, action, actionLabel }: { task: HousekeepingTask; action?: () => void; actionLabel?: string }) { return <Card className="p-4"><div className="flex items-start justify-between gap-2"><div><span className="text-[9px] font-semibold tracking-[0.08em] text-slate-400">{task.id}</span><h3 className="mt-1 text-[14px] font-semibold">Room {task.roomNumber}</h3><p className="mt-1 text-[9px] text-slate-500">{task.roomType}</p></div>{task.priority === "High" && <span className="rounded-full bg-rose-50 px-2 py-1 text-[8px] font-semibold text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">High priority</span>}</div><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/[0.07]"><div className="flex items-center gap-2"><Avatar name={task.assignee} size="sm" /><div><p className="text-[9px] font-medium">{task.assignee}</p><p className="mt-0.5 text-[8px] text-slate-500">{task.updatedAt}</p></div></div>{action && <button onClick={action} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[8px] font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">{actionLabel}</button>}</div></Card>; }

function PaymentsPage({ bookings, onCollect, onInvoice }: { bookings: Booking[]; onCollect: (booking: Booking) => void; onInvoice: (id: string) => void }) {
  const [filter, setFilter] = useState("all");
  const records = bookings.filter(booking => filter === "all" || (filter === "paid" ? booking.paid >= booking.amount : booking.paid < booking.amount));
  const total = bookings.reduce((sum, booking) => sum + booking.amount, 0);
  const collected = bookings.reduce((sum, booking) => sum + booking.paid, 0);
  const due = Math.max(0, total - collected);
  return <div className="space-y-5"><PageHeader title="Payments & folios" subtitle="Keep balances clear, payments traceable, and checkout friction low." action={<button className="secondary-button" onClick={() => window.print()}><Download size={13} />Export statement</button>} /><div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"><SummaryCard label="Collected" value={currency(collected)} note="Across current demo folios" /><SummaryCard label="Outstanding" value={currency(due)} note="Open balances" /><SummaryCard label="Paid in full" value={String(bookings.filter(booking => booking.paid >= booking.amount).length)} note="Completed folios" /><SummaryCard label="Collection rate" value={`${Math.round(collected / Math.max(total, 1) * 100)}%`} note="Demo ledger" /></div><Card className="overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-white/[0.08]"><div><h2 className="text-[13px] font-semibold">Recent folios</h2><p className="mt-1 text-[10px] text-slate-500">Room charges, payment state, and invoice actions.</p></div><div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-white/[0.05]">{[{label:"All",value:"all"},{label:"Paid",value:"paid"},{label:"Outstanding",value:"due"}].map(item => <button key={item.value} onClick={() => setFilter(item.value)} className={`rounded-md px-2.5 py-1.5 text-[9px] ${filter === item.value ? "bg-white font-semibold shadow-sm dark:bg-[#223747]" : "text-slate-500"}`}>{item.label}</button>)}</div></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead><tr className="bg-slate-50/60 text-[8px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:bg-white/[0.02]"><th className="px-4 py-3">Folio</th><th className="px-3 py-3">Guest</th><th className="px-3 py-3">Total</th><th className="px-3 py-3">Paid</th><th className="px-3 py-3">Balance</th><th className="px-3 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody>{records.slice(0, 12).map(booking => <tr key={booking.id} className="border-t border-slate-100 text-[10px] dark:border-white/[0.06]"><td className="px-4 py-3 font-semibold">INV-{booking.id.replace("BK-", "")}</td><td className="px-3 py-3"><div className="font-medium">{booking.guestName}</div><div className="mt-0.5 text-[9px] text-slate-500">Room {booking.roomNumber} · {booking.id}</div></td><td className="px-3 py-3 font-medium">{currency(booking.amount)}</td><td className="px-3 py-3">{currency(booking.paid)}</td><td className="px-3 py-3 font-semibold">{currency(Math.max(booking.amount - booking.paid, 0))}</td><td className="px-3 py-3"><StatusPill status={booking.paid >= booking.amount ? "paid" : booking.paid > 0 ? "partial" : "due"} /></td><td className="px-4 py-3 text-right"><button onClick={() => onInvoice(booking.id)} className="rounded-md px-2 py-1.5 text-[9px] font-semibold text-[#416a57] hover:bg-[#edf4f0] dark:text-emerald-300">Invoice</button>{booking.paid < booking.amount && <button onClick={() => onCollect(booking)} className="ml-1 rounded-md px-2 py-1.5 text-[9px] font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5">Collect</button>}</td></tr>)}</tbody></table></div></Card></div>;
}

function ReportsPage({ bookings, rooms }: { bookings: Booking[]; rooms: Room[] }) {
  const channelData = [{ name: "Direct", value: 38, color: "#4e8068" }, { name: "Booking.com", value: 29, color: "#8aa5b1" }, { name: "Expedia", value: 21, color: "#d3a55e" }, { name: "Walk-in", value: 12, color: "#c8d7cc" }];
  const weeks = [{ week: "Wk 1", revenue: 212 }, { week: "Wk 2", revenue: 246 }, { week: "Wk 3", revenue: 229 }, { week: "Wk 4", revenue: 281 }];
  return <div className="space-y-5"><PageHeader title="Reports & insights" subtitle="A clear read on performance, without the spreadsheet archaeology." action={<button className="secondary-button" onClick={() => window.print()}><Download size={13} />Export report</button>} /><div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"><SummaryCard label="Room revenue" value="₹9.68L" note="This month · demo" /><SummaryCard label="Average daily rate" value="₹7,240" note="+3.8% vs. last month" /><SummaryCard label="RevPAR" value="₹5,510" note="Room revenue per available room" /><SummaryCard label="Occupancy" value={`${Math.round(rooms.filter(room => ["occupied", "reserved"].includes(room.status)).length / rooms.length * 100)}%`} note="36-room property" /></div><div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]"><Card className="p-5 sm:p-6"><SectionHeading title="Monthly revenue" detail="₹ thousands · demo figures for portfolio preview" action={<button className="filter-chip filter-chip-active">September 2026 <ChevronDown size={11} className="ml-1"
 /></button>} />
    <div className="mt-5 h-[245px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={weeks} margin={{ top: 10, right: 4, left: -25, bottom: 0 }}><CartesianGrid vertical={false} strokeDasharray="3 4" stroke="var(--border)" /><XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#98a3ac", fontSize: 9 }} dy={7} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#98a3ac", fontSize: 9 }} tickFormatter={value => `₹${value}k`} /><ChartTooltip contentStyle={{ borderRadius: 10, border: "1px solid #e4e9e7", fontSize: 10 }} formatter={(value: number) => [`₹${value}k`, "Revenue"]} /><Bar dataKey="revenue" fill="#5e8b73" radius={[5, 5, 0, 0]} barSize={34} /></BarChart></ResponsiveContainer></div>
  </Card>
  <Card className="p-5 sm:p-6"><SectionHeading title="Booking channels" detail="Share of reservations this month." /><div className="mt-3 flex items-center gap-4"><div className="h-[150px] w-[150px] shrink-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={channelData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={66} paddingAngle={3} stroke="none">{channelData.map(item => <Cell key={item.name} fill={item.color} />)}</Pie><ChartTooltip formatter={(value: number) => [`${value}%`, "Bookings"]} contentStyle={{ borderRadius: 10, border: "1px solid #e4e9e7", fontSize: 10 }} /></PieChart></ResponsiveContainer></div><div className="min-w-0 flex-1 space-y-3">{channelData.map(item => <div key={item.name} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} /><span className="min-w-0 flex-1 truncate text-[9px] text-slate-500">{item.name}</span><span className="text-[10px] font-semibold">{item.value}%</span></div>)}</div></div></Card></div>
  <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-white/[0.08]"><div><h2 className="text-[13px] font-semibold">Performance notes</h2><p className="mt-1 text-[10px] text-slate-500">Helpful signals from the current demo dataset.</p></div><Sparkles size={16} className="text-[#73947f]" /></div><div className="grid divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-white/[0.06]">{[{title:"Direct bookings are steady",detail:"38% of stays are direct. Keep the front desk and website booking flow visible.",tone:"text-emerald-700"},{title:"Weekend occupancy is stronger",detail:"Saturday is the busiest day in this demo period. Protect inventory earlier.",tone:"text-blue-700"},{title:"Payment follow-up",detail:`${bookings.filter(item => item.paid < item.amount).length} folios still have a balance.`,tone:"text-amber-700"}].map(item => <div key={item.title} className="p-4"><div className={`text-[10px] font-semibold ${item.tone}`}>{item.title}</div><p className="mt-1.5 text-[9px] leading-relaxed text-slate-500">{item.detail}</p></div>)}</div></Card></div>;
}

function SettingsPage({ theme, onTheme, role, onRole }: { theme: "light" | "dark"; onTheme?: () => void; role: StayFlowRole; onRole: (role: StayFlowRole) => void }) {
  return <div className="space-y-5"><PageHeader title="Settings" subtitle="A few practical defaults for Aster House and the people running it." /><div className="grid gap-4 lg:grid-cols-[1fr_0.75fr]"><div className="space-y-4"><Card className="p-5 sm:p-6"><SectionHeading title="Property profile" detail="The property information used on guest folios." /><div className="grid gap-3 sm:grid-cols-2"><Field label="Property name"><input className="form-control" defaultValue="Aster House, Bengaluru" /></Field><Field label="Property code"><input className="form-control" defaultValue="AST-BLR-01" /></Field><Field label="Local currency"><select className="form-control" defaultValue="INR"><option value="INR">INR · Indian Rupee</option></select></Field><Field label="Time zone"><select className="form-control" defaultValue="Asia/Kolkata"><option value="Asia/Kolkata">Asia/Kolkata (IST)</option></select></Field><Field label="Address"><input className="form-control sm:col-span-2" defaultValue="12 100 Feet Road, Indiranagar, Bengaluru" /></Field></div><div className="mt-4 flex justify-end"><button className="primary-button" onClick={() => toast.success("Property settings saved for this demo.")}><Check size={13} />Save changes</button></div></Card><Card className="p-5 sm:p-6"><SectionHeading title="Team & access" detail="Role-based navigation preview for different hotel jobs." /><div className="space-y-2">{[{name:"Anika Rao",title:"Front desk manager",role:"Admin" as StayFlowRole},{name:"Rohan Das",title:"Duty manager",role:"Manager" as StayFlowRole},{name:"Meera Iyer",title:"Receptionist",role:"Receptionist" as StayFlowRole},{name:"S. Kumari",title:"Housekeeping",role:"Housekeeping" as StayFlowRole}].map(person => <button key={person.name} onClick={() => onRole(person.role)} className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left hover:bg-slate-50 dark:border-white/[0.06] dark:hover:bg-white/[0.03]"><Avatar name={person.name} size="sm" /><span className="min-w-0 flex-1"><span className="block text-[10px] font-semibold">{person.name}</span><span className="mt-0.5 block text-[9px] text-slate-500">{person.title}</span></span><span className={`rounded-full px-2 py-1 text-[8px] font-semibold ${role === person.role ? "bg-[#edf4f0] text-[#315d4b] dark:bg-emerald-300/10 dark:text-emerald-200" : "bg-slate-100 text-slate-500 dark:bg-white/[0.05]"}`}>{role === person.role ? "Active preview" : person.role}</span></button>)}</div><p className="mt-3 text-[9px] leading-relaxed text-slate-500">Role switching changes visible navigation for this demo. Production authorization must be enforced on the server.</p></Card></div><div className="space-y-4"><Card className="p-5"><SectionHeading title="Appearance" detail="A calmer workspace, day or night." /><div className="flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-white/[0.06]"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-white/[0.05] dark:text-slate-200">{theme === "light" ? <Sun size={16} /> : <Moon size={16} />}</span><span><span className="block text-[10px] font-semibold">{theme === "light" ? "Light mode" : "Dark mode"}</span><span className="mt-0.5 block text-[9px] text-slate-500">Saved to this browser</span></span></div><button className="secondary-button !min-h-8 !text-[9px]" onClick={onTheme}>Switch theme</button></div></Card><Card className="p-5"><SectionHeading title="Keyboard shortcuts" detail="Move through the front desk without slowing down." /><div className="space-y-2.5">{[["Ctrl / ⌘ + K","Search everything"],["N","New booking"],["G","Open guests"],["R","Open rooms"],["B","Open bookings"]].map(([key, label]) => <div key={key} className="flex items-center justify-between"><span className="text-[10px] text-slate-600 dark:text-slate-300">{label}</span><kbd className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[8px] font-medium text-slate-500 dark:border-white/10 dark:bg-white/[0.04]">{key}</kbd></div>)}</div></Card><Card className="bg-[#f4f7f5] p-5 dark:bg-[#182c31]"><div className="flex items-center gap-2 text-[11px] font-semibold text-[#345b49] dark:text-emerald-200"><ShieldCheck size={15} />Demo workspace</div><p className="mt-2 text-[9px] leading-relaxed text-slate-500 dark:text-slate-400">Changes are saved in this browser only. No real guest, payment, or property data is connected to this preview.</p></Card></div></div></div>;
}

function NotificationRow({ item, onRead }: { item: StayNotification; onRead: () => void }) {
  const icons: Record<StayNotification["category"], LucideIcon> = { Bookings: CalendarDays, Payments: CreditCard, Operations: Sparkles, System: Settings2 };
  const Icon = icons[item.category];
  return <div className={`flex gap-3 rounded-xl p-3 transition ${item.unread ? "bg-[#f4f8f5] dark:bg-emerald-300/[0.04]" : "hover:bg-slate-50 dark:hover:bg-white/[0.03]"}`}><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 dark:bg-white/[0.06]"><Icon size={14} /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-[10px] font-semibold">{item.title}</p><span className="shrink-0 text-[8px] text-slate-400">{item.time}</span></div><p className="mt-1 text-[9px] leading-relaxed text-slate-500">{item.detail}</p><div className="mt-2 flex items-center justify-between"><span className="text-[8px] text-slate-400">{item.category}</span>{item.unread ? <button onClick={onRead} className="text-[8px] font-semibold text-[#416a57] hover:underline dark:text-emerald-300">Mark read</button> : <span className="text-[8px] text-slate-400">Read</span>}</div></div></div>;
}

function Invoice({ booking, serviceOrders, onPrint }: { booking: Booking; serviceOrders: ServiceOrder[]; onPrint: () => void }) {
  const folio = calculateFolio(booking.amount, serviceOrders);
  const taxes = folio.roomTax;
  const subtotal = folio.roomSubtotal + folio.serviceTotal;
  return <div className="print-area p-6 sm:p-8"><div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#dce9e4] text-[#173b39]"><BedDouble size={17} /></span><span className="text-[15px] font-semibold tracking-[-0.04em]">Aster House</span></div><p className="mt-2 text-[9px] text-slate-500">12 100 Feet Road, Indiranagar<br />Bengaluru, Karnataka 560038 · +91 80 4567 8900</p></div><div className="text-right"><span className="rounded-full bg-[#edf4f0] px-2.5 py-1 text-[8px] font-semibold tracking-[0.1em] text-[#416a57]">TAX INVOICE</span><p className="mt-3 text-[13px] font-semibold">INV-{booking.id.replace("BK-", "")}</p><p className="mt-1 text-[9px] text-slate-500">Issued {dateDisplay(todayKey, { day: "numeric", month: "long", year: "numeric" })}</p></div></div><div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 dark:bg-white/[0.04]"><InfoCell label="Billed to" value={booking.guestName} /><InfoCell label="Booking ID" value={booking.id} /><InfoCell label="Room" value={`${booking.roomNumber} · ${booking.roomType}`} /><InfoCell label="Stay dates" value={`${dateDisplay(booking.checkIn)} – ${dateDisplay(booking.checkOut)}`} /></div><div className="my-5"><div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-slate-200 pb-2 text-[8px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:border-white/10"><span>Description</span><span>Qty</span><span className="text-right">Amount</span></div><div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-slate-100 py-3 text-[10px] dark:border-white/[0.06]"><span>Room charges · {nightsBetween(booking.checkIn, booking.checkOut)} nights</span><span>{nightsBetween(booking.checkIn, booking.checkOut)}</span><span className="text-right">{currency(subtotal - folio.serviceTotal)}</span></div><div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-slate-100 py-3 text-[10px] dark:border-white/[0.06]"><span>Taxes & fees</span><span>12%</span><span className="text-right">{currency(taxes)}</span></div>{serviceOrders.map(order => <div key={order.id} className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-slate-100 py-3 text-[10px] dark:border-white/[0.06]"><span>{order.serviceName}</span><span>×{order.quantity}</span><span className="text-right">{currency(order.amount)}</span></div>)}<div className="mt-4 ml-auto max-w-[260px] space-y-2"><BillLine label="Subtotal" value={subtotal} /><BillLine label="Taxes" value={taxes} /><div className="border-t border-slate-200 pt-2 dark:border-white/10"><BillLine label="Total" value={booking.amount} strong /></div><BillLine label="Paid" value={booking.paid} /><div className="flex items-center justify-between rounded-lg bg-[#f2f6f3] px-3 py-2 text-[10px] font-semibold dark:bg-white/[0.05]"><span>Balance due</span><span>{currency(Math.max(booking.amount - booking.paid, 0))}</span></div></div></div><div className="rounded-lg border border-slate-100 p-3 text-[9px] leading-relaxed text-slate-500 dark:border-white/[0.08]">Thank you for staying with us. Please contact the front desk if you have any questions about this invoice.</div><div className="no-print mt-5 flex flex-wrap justify-end gap-2"><button className="secondary-button" onClick={() => toast.info("This demo does not send email. Use Print to save a PDF copy.")}><Send size={13} />Send invoice</button><button className="primary-button" onClick={onPrint}><Printer size={13} />Print / save PDF</button></div></div>;
}

function ClipboardActionIcon() { return <Wrench size={14} />; }

export default Home;

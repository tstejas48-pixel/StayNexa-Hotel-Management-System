export type BookingStatus = "confirmed" | "checked-in" | "checked-out" | "cancelled";
export type RoomStatus = "available" | "reserved" | "occupied" | "cleaning" | "maintenance";
export type TaskStatus = "needs-cleaning" | "in-progress" | "ready";

export type Guest = {
  id: string;
  name: string;
  email: string;
  phone: string;
  stays: number;
  spend: number;
  tier: "Standard" | "Silver" | "Gold" | "VIP";
  preference: string;
  notes: string;
};

export type Room = {
  number: string;
  floor: number;
  type: "Deluxe King" | "Deluxe Twin" | "City Suite" | "Classic Queen";
  rate: number;
  status: RoomStatus;
};

export type Booking = {
  id: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  roomType: Room["type"];
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  amount: number;
  paid: number;
  channel: "Direct" | "Booking.com" | "Walk-in" | "Expedia";
};

export type HousekeepingTask = {
  id: string;
  roomNumber: string;
  roomType: Room["type"];
  assignee: string;
  priority: "High" | "Normal";
  status: TaskStatus;
  updatedAt: string;
};

export type StayNotification = {
  id: string;
  title: string;
  detail: string;
  category: "Bookings" | "Payments" | "Operations" | "System";
  time: string;
  unread: boolean;
};

export type HotelService = { id: string; name: string; category: "Dining" | "Transport" | "Laundry" | "Wellness"; price: number };
export type ServiceOrder = { id: string; bookingId: string; serviceId: string; serviceName: string; quantity: number; amount: number };

export type Workspace = {
  rooms: Room[];
  guests: Guest[];
  bookings: Booking[];
  tasks: HousekeepingTask[];
  notifications: StayNotification[];
  services: HotelService[];
  serviceOrders: ServiceOrder[];
};

const STORAGE_KEY = "stayflow-demo-workspace-v4";
const today = () => {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
};
export const dateOffset = (offset: number) => {
  const value = today();
  value.setDate(value.getDate() + offset);
  return value.toISOString().slice(0, 10);
};

const fullNames = [
  "Aarav Mehta", "Ananya Iyer", "Kabir Khanna", "Diya Nair", "Arjun Kapoor",
  "Meera Shah", "Vivaan Rao", "Ishita Menon", "Reyansh Malhotra", "Saanvi Desai",
  "Aditya Bansal", "Kiara Joshi", "Rohan Mukherjee", "Tara Reddy", "Dev Patel",
  "Aisha Chawla", "Neil Sethi", "Mira Kulkarni", "Ishaan Verma", "Nisha Pillai",
  "Rahul Sharma", "Priya Nair", "Karan Malhotra", "Zoya Khan", "Siddharth Bose",
  "Anika Rao", "Vikram Das", "Aditi Jain", "Yash Arora", "Rhea Thomas",
  "Samir Sen", "Pooja Menon", "Omkar Patil", "Leela Krishnan", "Manav Gupta",
  "Simran Kaur", "Akash Roy", "Nandini Shetty", "Aman Sinha", "Kavya Ramesh",
  "Rishabh Ghosh", "Tanvi Bhat", "Ibrahim Qureshi", "Sana Fernandes", "Varun Mallick",
  "Avni Chopra", "Harsh Venkatesh", "Ira Banerjee", "Kunal Bedi", "Mahi Narang",
  "Parth Kulkarni", "Naina Dutta",
];

export function createDemoWorkspace(): Workspace {
  const roomTypes: Room["type"][] = ["Deluxe King", "Deluxe Twin", "City Suite", "Classic Queen"];
  const rooms: Room[] = [];
  for (let floor = 1; floor <= 4; floor += 1) {
    const count = 9;
    for (let index = 1; index <= count; index += 1) {
      const roomIndex = (floor - 1) * 9 + index - 1;
      const status: RoomStatus = roomIndex < 20 ? "occupied" : roomIndex < 28 ? "reserved" : roomIndex < 32 ? "cleaning" : roomIndex === 32 ? "maintenance" : "available";
      rooms.push({
        number: `${floor}${String(index).padStart(2, "0")}`,
        floor,
        type: roomTypes[roomIndex % roomTypes.length],
        rate: [7200, 6800, 11800, 5900][roomIndex % 4],
        status,
      });
    }
  }

  const guests: Guest[] = fullNames.map((name, index) => ({
    id: `GST-${String(241 + index).padStart(4, "0")}`,
    name,
    email: `${name.toLowerCase().replaceAll(" ", ".")}@example.com`,
    phone: `+91 ${String(98110 + index).slice(0, 5)} ${String(12400 + index * 37).slice(-5)}`,
    stays: index < 9 ? 3 + (index % 8) : index % 3,
    spend: index < 9 ? 18400 + index * 6350 : 6200 + (index % 6) * 3300,
    tier: index < 3 ? "VIP" : index < 9 ? "Gold" : index < 19 ? "Silver" : "Standard",
    preference: ["Quiet room", "King bed", "Late checkout", "Feather-free bedding", "High floor"][index % 5],
    notes: index === 20 ? "Returning guest. Prefers a room away from the lift." : "",
  }));

  const bookings: Booking[] = Array.from({ length: 34 }, (_, index) => {
    const guest = guests[(index * 7 + 4) % guests.length];
    const room = rooms[(index * 5 + 2) % rooms.length];
    const status: BookingStatus = index < 5 ? (index < 3 ? "checked-in" : "confirmed") : index % 8 === 0 ? "checked-out" : "confirmed";
    const checkInOffset = status === "checked-in" ? -1 : status === "checked-out" ? -3 : index < 10 ? 0 : 1 + (index % 13);
    const nights = index < 2 ? 1 : 1 + (index % 3);
    const amount = room.rate * nights + Math.round(room.rate * nights * 0.12);
    const paid = status === "checked-in" ? amount : index % 4 === 0 ? Math.round(amount * 0.5) : amount;
    return {
      id: `BK-${String(1042 + index).padStart(4, "0")}`,
      guestId: guest.id,
      guestName: guest.name,
      roomNumber: room.number,
      roomType: room.type,
      checkIn: dateOffset(checkInOffset),
      checkOut: dateOffset(checkInOffset + nights),
      status,
      amount,
      paid,
      channel: (["Direct", "Booking.com", "Walk-in", "Expedia"] as const)[index % 4],
    };
  });

  const services: HotelService[] = [
    { id: "SVC-01", name: "Breakfast for two", category: "Dining", price: 960 },
    { id: "SVC-02", name: "Airport transfer", category: "Transport", price: 1500 },
    { id: "SVC-03", name: "Laundry service", category: "Laundry", price: 700 },
    { id: "SVC-04", name: "In-room dining", category: "Dining", price: 1250 },
    { id: "SVC-05", name: "Late checkout", category: "Wellness", price: 1800 },
  ];
  const serviceOrders: ServiceOrder[] = [
    { id: "SO-001", bookingId: "BK-1042", serviceId: "SVC-02", serviceName: "Airport transfer", quantity: 1, amount: 1500 },
    { id: "SO-002", bookingId: "BK-1043", serviceId: "SVC-01", serviceName: "Breakfast for two", quantity: 1, amount: 960 },
    { id: "SO-003", bookingId: "BK-1044", serviceId: "SVC-03", serviceName: "Laundry service", quantity: 1, amount: 700 },
    { id: "SO-004", bookingId: "BK-1045", serviceId: "SVC-04", serviceName: "In-room dining", quantity: 1, amount: 1250 },
  ];
  serviceOrders.forEach(order => {
    const booking = bookings.find(item => item.id === order.bookingId);
    if (booking) booking.amount += order.amount;
  });

  const tasks: HousekeepingTask[] = [
    { id: "HK-218", roomNumber: "203", roomType: "Deluxe King", assignee: "S. Kumari", priority: "High", status: "needs-cleaning", updatedAt: "12 min ago" },
    { id: "HK-217", roomNumber: "106", roomType: "Classic Queen", assignee: "A. Prasad", priority: "High", status: "in-progress", updatedAt: "24 min ago" },
    { id: "HK-216", roomNumber: "312", roomType: "City Suite", assignee: "R. Das", priority: "Normal", status: "needs-cleaning", updatedAt: "38 min ago" },
    { id: "HK-215", roomNumber: "408", roomType: "Deluxe Twin", assignee: "M. Singh", priority: "Normal", status: "ready", updatedAt: "52 min ago" },
    { id: "HK-214", roomNumber: "205", roomType: "Deluxe King", assignee: "S. Kumari", priority: "Normal", status: "needs-cleaning", updatedAt: "1 hr ago" },
    { id: "HK-213", roomNumber: "301", roomType: "Classic Queen", assignee: "A. Prasad", priority: "Normal", status: "in-progress", updatedAt: "1 hr ago" },
    { id: "HK-212", roomNumber: "110", roomType: "City Suite", assignee: "R. Das", priority: "High", status: "ready", updatedAt: "2 hrs ago" },
  ];

  const notifications: StayNotification[] = [
    { id: "NT-01", title: "Guest arriving soon", detail: "Aarav Mehta · Room 204 · in 25 minutes", category: "Bookings", time: "4 min ago", unread: true },
    { id: "NT-02", title: "Room 203 needs attention", detail: "Checkout complete · housekeeping task is overdue", category: "Operations", time: "18 min ago", unread: true },
    { id: "NT-03", title: "Payment received", detail: "₹8,064 from Priya Nair · BK-1044", category: "Payments", time: "42 min ago", unread: true },
    { id: "NT-04", title: "New booking received", detail: "Booking.com · 2 nights · 1 guest", category: "Bookings", time: "1 hr ago", unread: false },
    { id: "NT-05", title: "Daily report is ready", detail: "Yesterday's performance summary", category: "System", time: "Yesterday", unread: false },
  ];

  return { rooms, guests, bookings, tasks, notifications, services, serviceOrders };
}

export function loadWorkspace(): Workspace {
  if (typeof window === "undefined") return createDemoWorkspace();
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Workspace;
      if (parsed.rooms?.length && parsed.guests?.length && parsed.bookings?.length && Array.isArray(parsed.services) && Array.isArray(parsed.serviceOrders)) return parsed;
    }
  } catch {
    // A broken local demo cache should never prevent front-desk access.
  }
  return createDemoWorkspace();
}

export function saveWorkspace(workspace: Workspace) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  } catch {
    // Keep the current session usable if storage is unavailable or full.
  }
}

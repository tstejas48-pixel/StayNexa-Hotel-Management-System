import type { Booking, Room } from "./stayflow-data";
import type { ServiceOrder } from "./stayflow-data";

export type StayQuote = { nights: number; subtotal: number; tax: number; total: number };
export type FolioTotals = { roomSubtotal: number; roomTax: number; serviceTotal: number; total: number };

export function calculateFolio(totalAmount: number, serviceOrders: Pick<ServiceOrder, "amount">[]): FolioTotals {
  const serviceTotal = serviceOrders.reduce((sum, order) => sum + order.amount, 0);
  const roomGross = Math.max(0, totalAmount - serviceTotal);
  const roomTax = Math.round(roomGross * 0.12 / 1.12);
  return { roomSubtotal: roomGross - roomTax, roomTax, serviceTotal, total: roomGross + serviceTotal };
}

export function calculateStayQuote(ratePerNight: number, checkIn: string, checkOut: string, taxRate = 0.12): StayQuote {
  const start = new Date(`${checkIn}T12:00:00Z`).getTime();
  const end = new Date(`${checkOut}T12:00:00Z`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    throw new Error("Check-out must be after check-in.");
  }
  if (!Number.isFinite(ratePerNight) || ratePerNight < 0 || taxRate < 0) {
    throw new Error("Rates and taxes must be zero or greater.");
  }
  const nights = Math.round((end - start) / 86_400_000);
  const subtotal = ratePerNight * nights;
  const tax = Math.round(subtotal * taxRate);
  return { nights, subtotal, tax, total: subtotal + tax };
}

export function isRoomAvailable(room: Room, bookings: Booking[], checkIn: string, checkOut: string): boolean {
  if (checkOut <= checkIn || room.status === "maintenance") return false;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (checkIn <= today && room.status !== "available") return false;
  return !bookings.some(booking => {
    if (booking.roomNumber !== room.number || booking.status === "cancelled" || booking.status === "checked-out") return false;
    return booking.checkIn < checkOut && booking.checkOut > checkIn;
  });
}

export function getPaymentState(paid: number, total: number): "paid" | "partial" | "due" {
  if (paid >= total) return "paid";
  return paid > 0 ? "partial" : "due";
}

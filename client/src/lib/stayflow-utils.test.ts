import { describe, expect, it } from "vitest";
import { calculateFolio, calculateStayQuote, getPaymentState, isRoomAvailable } from "./stayflow-utils";
import { createDemoWorkspace, dateOffset } from "./stayflow-data";
import type { Booking, Room } from "./stayflow-data";

const room: Room = { number: "205", floor: 2, type: "Deluxe King", rate: 7000, status: "available" };
const booking: Booking = {
  id: "BK-1", guestId: "GST-1", guestName: "Aarav Mehta", roomNumber: "205", roomType: "Deluxe King",
  checkIn: "2026-09-28", checkOut: "2026-09-30", status: "confirmed", amount: 15680, paid: 0, channel: "Direct",
};

describe("StayFlow booking rules", () => {
  it("starts with realistic portfolio demo data", () => {
    const workspace = createDemoWorkspace();
    expect(workspace.rooms).toHaveLength(36);
    expect(workspace.guests.length).toBeGreaterThanOrEqual(50);
    expect(workspace.bookings.length).toBeGreaterThanOrEqual(30);
    expect(workspace.services.length).toBeGreaterThanOrEqual(5);
    expect(workspace.serviceOrders.length).toBeGreaterThan(0);
    expect(new Set(workspace.rooms.map(item => item.number)).size).toBe(workspace.rooms.length);
  });

  it("calculates nights, room charges, and rounded tax", () => {
    expect(calculateStayQuote(7000, "2026-09-28", "2026-09-30")).toEqual({
      nights: 2, subtotal: 14000, tax: 1680, total: 15680,
    });
  });

  it("reconciles room taxes and service orders into one folio total", () => {
    expect(calculateFolio(9116, [{ amount: 1500 }, { amount: 0 }])).toEqual({
      roomSubtotal: 6800, roomTax: 816, serviceTotal: 1500, total: 9116,
    });
  });

  it("rejects a checkout date that is not after check-in", () => {
    expect(() => calculateStayQuote(7000, "2026-09-30", "2026-09-28")).toThrow("Check-out must be after check-in");
  });

  it("prevents overlapping room assignments, including same-day boundary overlaps", () => {
    expect(isRoomAvailable(room, [booking], "2026-09-29", "2026-10-01")).toBe(false);
    expect(isRoomAvailable(room, [booking], "2026-09-30", "2026-10-02")).toBe(true);
  });

  it("ignores cancelled and completed stays when checking availability", () => {
    expect(isRoomAvailable(room, [{ ...booking, status: "cancelled" }], "2026-09-28", "2026-09-30")).toBe(true);
    expect(isRoomAvailable(room, [{ ...booking, status: "checked-out" }], "2026-09-28", "2026-09-30")).toBe(true);
  });

  it("never assigns a maintenance room and classifies payment states", () => {
    expect(isRoomAvailable({ ...room, status: "maintenance" }, [], "2026-09-28", "2026-09-30")).toBe(false);
    expect(isRoomAvailable({ ...room, status: "occupied" }, [], dateOffset(0), dateOffset(1))).toBe(false);
    expect(getPaymentState(0, 1000)).toBe("due");
    expect(getPaymentState(500, 1000)).toBe("partial");
    expect(getPaymentState(1000, 1000)).toBe("paid");
  });
});

import type { Appointment } from "../../domain/types/appointments";

export type PorteriaActionKey = "checkin" | "checkout";

export type PorteriaAppointment = Appointment & {
  Status?: string;
  ArrivalAt?: string | null;
  CheckoutAt?: string | null;
  ScheduledAt?: string | null;
  ClientName?: string;
  DriverName?: string;
  DriverDocument?: string;
  VehiclePlate?: string;
  Precincts?: string;
};

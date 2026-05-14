import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import type {
  AvailabilitySlot,
  CreateAvailabilitySlotRequest,
  UpdateAvailabilitySlotRequest,
} from "@/types";

export const availabilityApi = {
  /** List slots for a volunteer, optionally filtered by date range */
  list(
    volunteerId: string,
    params?: { startDate?: string; endDate?: string },
  ): Promise<AvailabilitySlot[]> {
    const query = new URLSearchParams();
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    const qs = query.toString();
    return apiGet<AvailabilitySlot[]>(
      `/api/volunteers/${volunteerId}/availability${qs ? `?${qs}` : ""}`,
    );
  },

  getById(volunteerId: string, id: string): Promise<AvailabilitySlot> {
    return apiGet<AvailabilitySlot>(`/api/volunteers/${volunteerId}/availability/${id}`);
  },

  create(
    volunteerId: string,
    data: CreateAvailabilitySlotRequest,
  ): Promise<AvailabilitySlot> {
    return apiPost<AvailabilitySlot>(
      `/api/volunteers/${volunteerId}/availability`,
      data,
    );
  },

  update(
    volunteerId: string,
    id: string,
    data: UpdateAvailabilitySlotRequest,
  ): Promise<AvailabilitySlot> {
    return apiPut<AvailabilitySlot>(
      `/api/volunteers/${volunteerId}/availability/${id}`,
      data,
    );
  },

  delete(volunteerId: string, id: string): Promise<void> {
    return apiDelete(`/api/volunteers/${volunteerId}/availability/${id}`);
  },
};

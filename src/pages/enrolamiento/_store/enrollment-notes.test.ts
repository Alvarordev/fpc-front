import { describe, expect, it } from "vitest";
import {
  getEnrollmentComments,
  serializeEnrollmentNotes,
} from "./enrollment-store";

describe("enrollment notes", () => {
  it("serializes accumulated notes as an ordered comment without metadata", () => {
    const first = { text: "Primera observación" };
    const second = { text: "Pendiente validar la aseguradora" };

    expect(serializeEnrollmentNotes([first, second])).toBe(
      `${first.text}\n\n${second.text}`,
    );
  });

  it("keeps legacy comments when no note entries exist", () => {
    expect(getEnrollmentComments({ comments: "Comentario existente" })).toBe("Comentario existente");
  });
});

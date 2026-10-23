import { useEffect } from "react";
import { EnrollmentShell } from "./_components/enrollment-shell";
import { useEnrollmentStore } from "./_store/enrollment-store";

export default function EnrolamientoPage() {
  const setEnrollmentMode = useEnrollmentStore((state) => state.setEnrollmentMode);

  useEffect(() => {
    setEnrollmentMode("OPERATIONAL");
  }, [setEnrollmentMode]);

  return (
    <div className="-m-4 flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden md:-m-6">
      <EnrollmentShell />
    </div>
  );
}

import { FollowUpContent } from "./_components/follow-up-content";
import { useSearchParams } from "react-router-dom";
import { ContactContent } from "./_components/contact-content";

export default function ContactPage() {
  const [searchParams] = useSearchParams();

  // Agenda and call center still link historical legacy contacts by contactId.
  return searchParams.has("contactId") ? <ContactContent /> : <FollowUpContent />;
}

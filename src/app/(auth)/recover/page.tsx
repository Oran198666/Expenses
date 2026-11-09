import type { Metadata } from "next";
import { RecoverForm } from "./recover-form";

export const metadata: Metadata = { title: "Recover Password · Expense Tracker" };

export default function RecoverPage() {
  return <RecoverForm />;
}

import type { Metadata } from "next";
import GeoAuditClient from "./GeoAuditClient";

export const metadata: Metadata = {
  title: "GEO·AEO 무료진단 | AX SEO Manager",
  description: "사이트 주소만 입력하면 GEO·AEO 최적화 상태를 빠르게 점검합니다.",
};

export default function GeoAuditPage() {
  return <GeoAuditClient />;
}

import { publicPageMetadata } from "@/lib/site-metadata";
import GeoAuditClient from "./GeoAuditClient";

export const metadata = publicPageMetadata(
  "GEO·AEO 무료진단 | AX SEO Manager",
  "사이트 주소만 입력하면 AI 검색 노출을 위한 GEO·AEO 최적화 상태와 개선이 필요한 항목을 무료로 점검합니다.",
  "/geo",
);

export default function GeoAuditPage() {
  return <GeoAuditClient />;
}

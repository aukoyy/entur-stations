import { Infoscreen } from "@/components/Infoscreen";
import { LegacyBrowserNotice } from "@/components/LegacyBrowserNotice";

export default function Home() {
  return (
    <>
      <LegacyBrowserNotice />
      <Infoscreen />
    </>
  );
}

import CanvasDraw from "@/components/shared/canvas-draw";
import Image from "next/image";

export default function Home() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <CanvasDraw />
    </div>
  );
}

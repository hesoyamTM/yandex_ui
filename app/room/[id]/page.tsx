'use client'
import { DrawingCanvas } from "@/components/shared/canvas-draw";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function Room({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params)
    
    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
            <DrawingCanvas canvasId={id}/>
        </div>
    )
}
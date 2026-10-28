import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/settings`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch settings: ${res.status}`);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

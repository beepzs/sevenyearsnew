import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const res = await fetch(`${API_BASE}/experts/${slug}`, {
      cache: "no-store"
    });
    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ success: false, message: "Expert not found" }, { status: 404 });
      }
      throw new Error(`Failed to fetch expert: ${res.status}`);
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

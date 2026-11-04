
import { NextResponse } from "next/server";

export const revalidate = 3600;

export async function GET() {
  try {
    const response = await fetch(
      "https://mp3quran.net/api/v3/reciters?language=ar",
      {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(15_000),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "تعذر جلب قائمة القراء" },
        { status: 502 }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ في الاتصال بخدمة القراء" },
      { status: 502 }
    );
  }
}


import { NextResponse } from "next/server";

export const revalidate = 86400;

export async function GET() {
  try {
    const response = await fetch(
      "https://mp3quran.net/api/v3/suwar?language=ar",
      {
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(15_000),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "تعذر جلب سور القرآن" },
        { status: 502 }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ في الاتصال بخدمة السور" },
      { status: 502 }
    );
  }
}

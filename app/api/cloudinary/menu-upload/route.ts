import { NextResponse } from "next/server";
import { Role } from "@/app/generated/prisma/client";

import { uploadMenuImageToCloudinary } from "@/app/lib/cloudinary";
import { getUserFromSession } from "@/app/lib/session";

export async function POST(request: Request) {
  const user = await getUserFromSession();
  if (!user || user.role !== Role.RESTAURANT) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const image = formData.get("file");

  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: "No image file provided." }, { status: 400 });
  }

  try {
    const url = await uploadMenuImageToCloudinary(image);
    return NextResponse.json({ secure_url: url });
  } catch {
    return NextResponse.json({ error: "Image upload failed." }, { status: 400 });
  }
}


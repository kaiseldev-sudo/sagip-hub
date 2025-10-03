import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { token } = (await request.json()) as { token?: string }
    if (!token) {
      return NextResponse.json({ success: false, error: "missing-token" }, { status: 400 })
    }

    const secret = process.env.TURNSTILE_SECRET_KEY
    if (!secret) {
      return NextResponse.json({ success: false, error: "server-misconfig" }, { status: 500 })
    }

    const formData = new FormData()
    formData.append("secret", secret)
    formData.append("response", token)

    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    })

    const verifyJson = (await verifyRes.json()) as { success?: boolean }
    const success = !!verifyJson.success

    return NextResponse.json({ success }, { status: success ? 200 : 400 })
  } catch (error) {
    return NextResponse.json({ success: false, error: "unexpected" }, { status: 500 })
  }
}



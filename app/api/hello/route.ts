
import { NextResponse } from 'next/server'

export async function POST() {
    return NextResponse.json({ message: 'Hello POST works' })
}

export async function GET() {
    return NextResponse.json({ message: 'Hello GET works' })
}

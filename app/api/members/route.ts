
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const members = await prisma.member.findMany({
      orderBy: { id: 'asc' }
    });
    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newMember = await prisma.member.create({
      data: {
        id: body.id,
        name: body.name,
        fatherName: body.fatherName,
        phone: body.phone,
        nid: body.nid,
        address: body.address,
        nomineeName: body.nomineeName,
        nomineeRelationship: body.nomineeRelationship,
        // যোগদানের তারিখ স্ট্রিং থেকে ডেট অবজেক্টে রূপান্তর
        joinDate: new Date(body.joinDate),
      }
    });
    return NextResponse.json(newMember);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create member" }, { status: 500 });
  }
}

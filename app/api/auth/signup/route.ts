import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    try {
      // Create workspace first
      const workspace = await prisma.workspace.create({
        data: {
          name: `${name}'s Workspace`,
        },
      });

      // Hash password and create user
      const hashedPassword = await hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          workspaceId: workspace.id,
          role: "OWNER",
        },
      });

      return NextResponse.json(
        { 
          message: "User created successfully",
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        },
        { status: 201 }
      );
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { message: "Database error during user creation" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in signup:", error);
    return NextResponse.json(
      { message: "Error processing request" },
      { status: 500 }
    );
  }
}
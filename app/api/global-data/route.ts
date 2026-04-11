import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("cyb_dashboard"); // feel free to change the DB name 

    // Concurrently fetch all required collections to power the context
    const [targets, assets, services, ports] = await Promise.all([
      db.collection("targets").find({}).toArray(),
      db.collection("assets").find({}).toArray(),
      db.collection("services").find({}).toArray(),
      db.collection("ports").find({}).toArray(),
    ]);

    return NextResponse.json({ targets, assets, services, ports });
  } catch (error) {
    console.error("MongoDB fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch data from MongoDB" }, { status: 500 });
  }
}

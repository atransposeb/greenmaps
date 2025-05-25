import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create reviews table
    const { error: reviewsError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS reviews (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
          user_id UUID,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          is_moderated BOOLEAN DEFAULT FALSE
        );
      `,
    })

    // Create visits table
    const { error: visitsError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS visits (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
          user_id UUID,
          visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    return NextResponse.json({
      success: true,
      reviewsError: reviewsError?.message,
      visitsError: visitsError?.message,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create tables" }, { status: 500 })
  }
}

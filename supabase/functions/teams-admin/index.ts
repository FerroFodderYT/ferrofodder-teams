import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      },
    );

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: aalData, error: aalErr } = await userClient.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalErr || aalData.currentLevel !== "aal2") {
      return new Response(
        JSON.stringify({ error: "MFA required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const body = await req.json();
    const { action } = body as { action: string };

    if (action === "ping") {
      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "insert") {
      const { gen, format, archetype, team_name, date_created, pokepaste_text, pokepaste_url, pokemon, folder, sort_order } = body;

      const insertPayload: Record<string, unknown> = {
        gen: typeof gen === "number" ? gen : 9,
        format,
        archetype,
        team_name: typeof team_name === "string" ? team_name : "",
        date_created,
        pokepaste_text,
        pokepaste_url: pokepaste_url ?? null,
        pokemon,
        folder: typeof folder === "string" && folder.trim() ? folder.trim() : null,
      };
      if (typeof sort_order === "number") insertPayload.sort_order = sort_order;

      const { data, error } = await admin.from("teams").insert(insertPayload).select("id").single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ id: data.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "update") {
      const { id, gen, format, archetype, team_name, date_created, pokepaste_text, pokepaste_url, pokemon, folder, sort_order } = body as {
        id: string;
        gen?: number;
        format?: string;
        archetype?: string;
        team_name?: string;
        date_created?: string;
        pokepaste_text?: string;
        pokepaste_url?: string | null;
        pokemon?: unknown;
        folder?: string | null;
        sort_order?: number;
      };

      if (!id) {
        return new Response(
          JSON.stringify({ error: "Missing team id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const updates: Record<string, unknown> = {};
      if (typeof gen === "number") updates.gen = gen;
      if (typeof format === "string") updates.format = format;
      if (typeof archetype === "string") updates.archetype = archetype;
      if (typeof team_name === "string") updates.team_name = team_name;
      if (typeof date_created === "string") updates.date_created = date_created;
      if (typeof pokepaste_text === "string") updates.pokepaste_text = pokepaste_text;
      if (pokepaste_url !== undefined) updates.pokepaste_url = pokepaste_url ?? null;
      if (pokemon !== undefined) updates.pokemon = pokemon;
      if (folder !== undefined) updates.folder = (folder && folder.trim()) ? folder.trim() : null;
      if (typeof sort_order === "number") updates.sort_order = sort_order;

      const { data, error } = await admin
        .from("teams")
        .update(updates)
        .eq("id", id)
        .select("id")
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ id: data.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "delete") {
      const { id } = body as { id: string };
      if (!id) {
        return new Response(
          JSON.stringify({ error: "Missing team id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { error } = await admin.from("teams").delete().eq("id", id);
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "listGenVisibility") {
      const { data, error } = await admin
        .from("gen_visibility")
        .select("gen, visible, updated_at")
        .order("gen", { ascending: true });

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ visibility: data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "toggleGenVisibility") {
      const { gen, visible } = body as { gen: number; visible: boolean };
      if (typeof gen !== "number" || gen < 1 || gen > 12) {
        return new Response(
          JSON.stringify({ error: "Invalid gen number (must be 1-12)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { error } = await admin
        .from("gen_visibility")
        .update({ visible, updated_at: new Date().toISOString() })
        .eq("gen", gen);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ ok: true, gen, visible }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "listFormatVisibility") {
      const { data, error } = await admin
        .from("format_visibility")
        .select("gen, format, visible, updated_at")
        .order("gen", { ascending: true })
        .order("format", { ascending: true });

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ formatVisibility: data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "toggleFormatVisibility") {
      const { gen, format, visible } = body as { gen: number; format: string; visible: boolean };
      if (typeof gen !== "number" || gen < 1 || gen > 12) {
        return new Response(
          JSON.stringify({ error: "Invalid gen number (must be 1-12)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (!format || typeof format !== "string") {
        return new Response(
          JSON.stringify({ error: "Missing or invalid format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { error } = await admin
        .from("format_visibility")
        .update({ visible, updated_at: new Date().toISOString() })
        .eq("gen", gen)
        .eq("format", format);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ ok: true, gen, format, visible }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HF_BASE = "https://jarwar786-ecolens.hf.space";

function base64ToBlob(base64: string): Uint8Array {
  // Remove data URL prefix if present
  const b64 = base64.replace(/^data:image\/\w+;base64,/, "");
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Convert base64 to binary and upload to Gradio
    const imageBytes = base64ToBlob(image);
    const formData = new FormData();
    formData.append("files", new Blob([imageBytes], { type: "image/jpeg" }), "image.jpg");

    const uploadRes = await fetch(`${HF_BASE}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("Upload failed:", uploadRes.status, errText);
      return new Response(
        JSON.stringify({ error: `Upload failed: ${uploadRes.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const uploadedFiles = await uploadRes.json();
    console.log("Uploaded files:", JSON.stringify(uploadedFiles));

    // uploadedFiles is an array of file paths like ["/tmp/gradio/xxx/image.jpg"]
    const filePath = uploadedFiles[0];

    // Step 2: Call predict with the uploaded file reference
    const submitRes = await fetch(`${HF_BASE}/call/predict_waste`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [{ path: filePath, meta: { _type: "gradio.FileData" } }],
      }),
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      console.error("Predict submit failed:", submitRes.status, errText);
      return new Response(
        JSON.stringify({ error: `Predict failed: ${submitRes.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const submitData = await submitRes.json();
    const eventId = submitData.event_id;
    console.log("Event ID:", eventId);

    if (!eventId) {
      return new Response(JSON.stringify(submitData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 3: Poll for result
    const resultRes = await fetch(`${HF_BASE}/call/predict_waste/${eventId}`);
    if (!resultRes.ok) {
      const errText = await resultRes.text();
      console.error("Result fetch failed:", resultRes.status, errText);
      return new Response(
        JSON.stringify({ error: `Result error: ${resultRes.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse SSE response
    const resultText = await resultRes.text();
    console.log("SSE response:", resultText);
    const lines = resultText.split("\n");
    let resultData = null;

    for (const line of lines) {
      if (line.startsWith("data:")) {
        const jsonStr = line.slice(5).trim();
        try {
          resultData = JSON.parse(jsonStr);
        } catch {
          // skip non-JSON data lines
        }
      }
    }

    if (!resultData) {
      console.error("No valid data in SSE response:", resultText);
      return new Response(
        JSON.stringify({ error: "No result from ML model" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(resultData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("classify-waste error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

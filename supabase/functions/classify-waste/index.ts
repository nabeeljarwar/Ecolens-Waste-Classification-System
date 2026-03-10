import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use Lovable AI vision model to classify waste
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a waste classification expert. Classify the waste item in the image into exactly ONE of these 4 categories:
- Recyclable (plastics, paper, cardboard, glass, metals, cans, bottles)
- Non-Recyclable (styrofoam, mixed materials, contaminated items, certain plastics)
- Organic (food waste, garden waste, biodegradable items, wood, leaves)
- E-Waste (electronics, batteries, cables, circuit boards, phones, computers)

You MUST respond using the suggest_classification tool.`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: image }
              },
              {
                type: "text",
                text: "Classify this waste item. What category does it belong to and how confident are you?"
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_classification",
              description: "Return the waste classification result",
              parameters: {
                type: "object",
                properties: {
                  label: {
                    type: "string",
                    enum: ["Recyclable", "Non-Recyclable", "Organic", "E-Waste"],
                    description: "The waste category"
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence score between 0 and 1"
                  }
                },
                required: ["label", "confidence"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_classification" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service quota exceeded." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      return new Response(
        JSON.stringify({ error: "Classification failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await response.json();
    console.log("AI response:", JSON.stringify(aiResult));

    // Extract tool call result
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("No classification result from AI");
    }

    const classification = JSON.parse(toolCall.function.arguments);

    // Return in the format the frontend expects
    return new Response(
      JSON.stringify({
        data: [{
          label: classification.label,
          confidences: [{ confidence: classification.confidence }]
        }]
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error("classify-waste error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

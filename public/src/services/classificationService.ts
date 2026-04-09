// AI Classification Service — connected to real ML model

import { supabase } from "@/integrations/supabase/client";

export type WasteCategory = "recyclable" | "non-recyclable" | "organic" | "e-waste";

export interface ClassificationResult {
  category: WasteCategory;
  confidence: number;
  binColor: string;
  binLabel: string;
  color: string;
  tips: string[];
  homeTips: { icon: string; title: string; description: string }[];
  govtGuidelines: { icon: string; title: string; description: string }[];
}

const wasteData: Record<WasteCategory, Omit<ClassificationResult, "confidence">> = {
  recyclable: {
    category: "recyclable",
    binColor: "Blue Bin",
    binLabel: "Recyclable",
    color: "#3B82F6",
    tips: [
      "Rinse containers before recycling",
      "Remove caps and labels when possible",
      "Flatten cardboard boxes to save space",
      "Check the recycling symbol (1-7) on plastics",
    ],
    homeTips: [
      { icon: "♻️", title: "DIY Planter", description: "Cut plastic bottles in half and use as small planters for herbs" },
      { icon: "🎨", title: "Craft Projects", description: "Use clean recyclables for kids' art and school projects" },
      { icon: "📦", title: "Storage", description: "Repurpose jars and containers for kitchen storage" },
    ],
    govtGuidelines: [
      { icon: "📋", title: "Segregation Required", description: "Mandatory separation of recyclables at source" },
      { icon: "⏰", title: "Collection Schedule", description: "Recyclables collected every Tuesday and Friday, 7-10 AM" },
      { icon: "💰", title: "Penalty", description: "₹500 fine for mixing recyclables with general waste" },
      { icon: "📞", title: "Helpline", description: "1800-XXX-XXXX (Toll-free recycling helpline)" },
    ],
  },
  "non-recyclable": {
    category: "non-recyclable",
    binColor: "Black Bin",
    binLabel: "Non-Recyclable",
    color: "#6B7280",
    tips: [
      "Place in designated non-recyclable waste bin",
      "Ensure items are dry before disposal",
      "Do not mix with recyclable or organic waste",
      "Consider if the item can be reused before discarding",
    ],
    homeTips: [
      { icon: "🗑️", title: "Proper Bagging", description: "Use biodegradable bags for non-recyclable waste" },
      { icon: "🔄", title: "Reduce First", description: "Try to minimize non-recyclable purchases" },
      { icon: "🏪", title: "Return Programs", description: "Check if manufacturers accept product returns" },
    ],
    govtGuidelines: [
      { icon: "📋", title: "Landfill Rules", description: "Non-recyclables go to designated landfill sites" },
      { icon: "⏰", title: "Collection Schedule", description: "General waste collected Monday, Wednesday, Saturday" },
      { icon: "⚠️", title: "Prohibited Items", description: "Do not dispose hazardous or e-waste in this bin" },
      { icon: "📞", title: "Helpline", description: "1800-XXX-XXXX (Municipal waste helpline)" },
    ],
  },
  organic: {
    category: "organic",
    binColor: "Green Bin",
    binLabel: "Organic",
    color: "#22C55E",
    tips: [
      "Place in compost or green waste bin",
      "Remove any stickers, tags, or packaging",
      "Can be used for home composting",
      "Breaks down naturally in 2-6 weeks",
    ],
    homeTips: [
      { icon: "🌱", title: "Composting", description: "Start a compost bin — organic waste becomes rich soil" },
      { icon: "🪴", title: "Plant Food", description: "Bury fruit peels near plants as natural fertilizer" },
      { icon: "🐛", title: "Worm Farm", description: "Set up vermicomposting for nutrient-rich plant food" },
    ],
    govtGuidelines: [
      { icon: "📋", title: "Wet Waste Rules", description: "Organic waste must be segregated as wet waste" },
      { icon: "⏰", title: "Daily Collection", description: "Organic waste collected daily, 7-9 AM" },
      { icon: "🌿", title: "Community Composting", description: "Local composting centers accept bulk organic waste" },
      { icon: "📞", title: "Helpline", description: "1800-XXX-XXXX (Green waste helpline)" },
    ],
  },
  "e-waste": {
    category: "e-waste",
    binColor: "Red Bin",
    binLabel: "E-Waste",
    color: "#EF4444",
    tips: [
      "Never throw electronics in regular trash",
      "Remove batteries before disposal",
      "Wipe personal data from devices",
      "Take to authorized e-waste collection centers",
    ],
    homeTips: [
      { icon: "🔋", title: "Battery Recycling", description: "Collect batteries separately and drop at designated points" },
      { icon: "📱", title: "Trade-in Programs", description: "Many brands offer trade-in discounts for old devices" },
      { icon: "🔧", title: "Repair First", description: "Consider repairing electronics before replacing them" },
    ],
    govtGuidelines: [
      { icon: "📋", title: "E-Waste Rules 2022", description: "Producers must set up collection centers for e-waste" },
      { icon: "🏭", title: "Authorized Recyclers", description: "Only dispose through govt. authorized e-waste recyclers" },
      { icon: "⚠️", title: "Hazardous Components", description: "E-waste contains lead, mercury — handle with care" },
      { icon: "📞", title: "Helpline", description: "1800-XXX-XXXX (E-waste management helpline)" },
    ],
  },
};

// Map ML model labels to our internal categories
const labelToCategory: Record<string, WasteCategory> = {
  "Recyclable": "recyclable",
  "recyclable": "recyclable",
  "Non-Recyclable": "non-recyclable",
  "non-recyclable": "non-recyclable",
  "Organic": "organic",
  "organic": "organic",
  "E-waste": "e-waste",
  "e-waste": "e-waste",
  "E-Waste": "e-waste",
};

export const classifyWaste = async (imageBase64: string): Promise<ClassificationResult> => {
  const { data, error } = await supabase.functions.invoke("classify-waste", {
    body: { image: imageBase64 },
  });

  if (error) {
    throw new Error(`Classification failed: ${error.message}`);
  }

  console.log("ML response:", JSON.stringify(data));

  // Handle both Gradio response formats:
  // New format: { data: [{ label, confidences }] }
  // Direct format: [{ label, confidences }]
  const prediction = data?.data?.[0] ?? (Array.isArray(data) ? data[0] : null);
  if (!prediction?.label) {
    throw new Error("Invalid response from classification model");
  }

  const topLabel: string = prediction.label;
  const topConfidence: number = prediction.confidences?.[0]?.confidence ?? 0.85;

  const category = labelToCategory[topLabel] || "non-recyclable";

  return {
    ...wasteData[category],
    confidence: parseFloat(topConfidence.toFixed(2)),
  };
};

// Helper to get waste data for a specific category
export const getWasteInfo = (category: WasteCategory): Omit<ClassificationResult, "confidence"> => {
  return wasteData[category];
};

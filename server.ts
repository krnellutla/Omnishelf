import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper function to call asynchronous Gemini functions with built-in retries for transient errors (like 503 UNAVAILABLE or 429)
  const callGeminiWithRetry = async <T>(fn: () => Promise<T>, retries = 2, delayMs = 1000): Promise<T> => {
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (err: any) {
        const status = err.status || err.statusCode || err.code;
        const isTransient = status === 503 || status === 429 ||
                            (err.message && (
                              err.message.includes("503") || 
                              err.message.includes("UNAVAILABLE") || 
                              err.message.includes("high demand") ||
                              err.message.includes("temporary") ||
                              err.message.includes("resource exhausted") ||
                              err.message.includes("429")
                            ));
        if (isTransient && i < retries) {
          console.warn(`[Gemini Transient Error] (Attempt ${i + 1}/${retries + 1}). Retrying in ${delayMs}ms... Error: ${err.message || err}`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          delayMs *= 2.5; // Exponential backoff
          continue;
        }
        throw err;
      }
    }
    throw new Error("Gemini invocation failed after retries.");
  };

  // API Route - Copilot Handler
  app.post("/api/copilot", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        return res.status(400).json({
          error: "Gemini API Key is not configured. Please add GEMINI_API_KEY inside Settings > Secrets."
        });
      }

      const { prompt, context, model } = req.body;
      const allowedModels = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.1-pro-preview"];
      const activeModel = allowedModels.includes(model) ? model : "gemini-3.5-flash";

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = 
        `You are LogiLedger Assistant, a world-class AI logistics advisor and retail inventory copilot (running on engine ${activeModel}). 
        You have full access to the operator's real-time system context.
        Assist the operator with expert logs audits, write automatic PO drafting supplier emails, explain shrinkage/carrier issues, or analyze SKU levels.
        Keep your advice highly professional, ultra-concise, and action-oriented. Refrain from long preambles. Use markdown formatting.`;

      const contents = `
        System Context:
        =============================
        Current Tenant ID: ${context?.tenantId || "Unknown"}
        Active Role: ${context?.currentRole || "Operator"}
        Active Products Count: ${context?.products?.length || 0}
        Products Data (truncated):
        ${JSON.stringify(context?.products?.slice(0, 15) || [])}
        
        Recent Transactions:
        ${JSON.stringify(context?.transactions?.slice(0, 10) || [])}
        =============================
        
        Operator Request:
        "${prompt}"
      `;

      const response = await callGeminiWithRetry(() => ai.models.generateContent({
        model: activeModel,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      }));

      res.json({ text: response.text });
    } catch (err: any) {
      console.error("Gemini Copilot Error:", err);
      res.status(500).json({ error: err.message || "An error occurred with Gemini processing." });
    }
  });

  // API Route - Invoice OCR Extractor Handler
  app.post("/api/ocr-invoice", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        return res.status(400).json({
          error: "Gemini API Key is not configured. Please add GEMINI_API_KEY inside Settings > Secrets."
        });
      }

      const { image, products } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Missing invoice image base64 data." });
      }

      let base64Data = image;
      let mimeType = "image/png";

      if (base64Data.startsWith("data:")) {
        const parts = base64Data.split(",");
        const mimePart = parts[0];
        const match = mimePart.match(/data:(.*?);base64/);
        if (match) {
          mimeType = match[1];
        }
        base64Data = parts[1];
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = 
        `You are an expert AI logistics auditor and warehouse data ingestion system.
        Your task is to analyze the provided invoice image, extract supplier and billing details, and extract all invoice line items.
        
        To help you match line items to our existing product catalog, you are provided with our catalog products list:
        ${JSON.stringify(products || [])}
        
        When extracting line items:
        1. Compare the invoice item names/SKUs against our catalog products.
        2. If a match is found (fuzzy match or exact match on name/SKU/brand), use that product's id as 'productId', and set 'sku' and 'productName' to matches from our catalog.
        3. If NO match is found in our catalog, set 'productId' to "temp-new" and 'productName' and 'sku' to what is written in the invoice.
        4. Populate 'quantity' and 'unitCost' from the invoice. Ensure quantity is an integer and unitCost is a number.
        
        Also extract:
        - 'supplierName': The name of the billing vendor/supplier
        - 'invoiceRef': The invoice reference invoice number, e.g., INV-12345
        - 'invoiceAmount': The total billed amount listed in the invoice (number)`;

      const response = await callGeminiWithRetry(() => ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: "Please extract supplierName, invoiceRef, invoiceAmount, and items from the attached invoice image.",
          },
        ],
        config: {
          systemInstruction,
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              supplierName: { type: Type.STRING },
              invoiceRef: { type: Type.STRING },
              invoiceAmount: { type: Type.NUMBER },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    productId: { type: Type.STRING },
                    productName: { type: Type.STRING },
                    sku: { type: Type.STRING },
                    quantity: { type: Type.INTEGER },
                    unitCost: { type: Type.NUMBER }
                  },
                  required: ["productName", "quantity", "unitCost"]
                }
              }
            },
            required: ["supplierName", "items"]
          }
        }
      }));

      if (!response.text) {
        throw new Error("No response text returned from Gemini API.");
      }

      const result = JSON.parse(response.text.trim());
      res.json(result);
    } catch (err: any) {
      console.error("Gemini OCR Error:", err);
      res.status(500).json({ error: err.message || "An error occurred with Gemini image OCR processing." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

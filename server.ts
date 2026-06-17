import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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

      const response = await ai.models.generateContent({
        model: activeModel,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (err: any) {
      console.error("Gemini Copilot Error:", err);
      res.status(500).json({ error: err.message || "An error occurred with Gemini processing." });
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

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Sparkles, Cpu, ClipboardList, MailOpen, AlertTriangle, RefreshCw, MessageSquare, Bot, HelpCircle, Zap, Coins } from 'lucide-react';
import { Product, Transaction, UserRole } from '../types';

interface CopilotHubProps {
  products: Product[];
  transactions: Transaction[];
  currentRole: UserRole;
  currentTenantId: string;
  showNotification: (msg: string, type: 'success' | 'warning' | 'info') => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export default function CopilotHub({
  products,
  transactions,
  currentRole,
  currentTenantId,
  showNotification
}: CopilotHubProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('logiledger_copilot_model') || 'gemini-3.5-flash';
  });

  // Calculate dynamic weekly sales burn rate analytics and identify items at risk
  const burnRateAnalytics = useMemo(() => {
    const now = new Date();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    // Group only OUT type transactions under current active tenant
    const productSalesMap: Record<string, { totalQty: number; oldestTxDate: Date; txCount: number }> = {};

    transactions
      .filter(tx => (!tx.tenantId || tx.tenantId === currentTenantId) && tx.type === 'OUT')
      .forEach(tx => {
        const txDate = new Date(tx.timestamp);
        if (isNaN(txDate.getTime())) return;

        const qty = Math.abs(tx.quantityChanged);

        if (!productSalesMap[tx.productId]) {
          productSalesMap[tx.productId] = {
            totalQty: 0,
            oldestTxDate: txDate,
            txCount: 0
          };
        }

        productSalesMap[tx.productId].totalQty += qty;
        productSalesMap[tx.productId].txCount += 1;
        if (txDate < productSalesMap[tx.productId].oldestTxDate) {
          productSalesMap[tx.productId].oldestTxDate = txDate;
        }
      });

    const results = products
      .filter(p => !p.tenantId || p.tenantId === currentTenantId)
      .map(p => {
        const salesInfo = productSalesMap[p.id];
        
        let dailyBurnRate = 0;
        let weeklySalesRate = 0;
        let daysToMinStock = Infinity;
        let isAtRisk = false;

        if (salesInfo && salesInfo.totalQty > 0) {
          const diffDays = (now.getTime() - salesInfo.oldestTxDate.getTime()) / ONE_DAY_MS;
          const calculatedSpan = Math.max(1, diffDays);
          dailyBurnRate = salesInfo.totalQty / calculatedSpan;
          weeklySalesRate = dailyBurnRate * 7;

          if (p.quantity <= p.minStock) {
            daysToMinStock = 0;
            isAtRisk = true;
          } else if (dailyBurnRate > 0) {
            const surplus = p.quantity - p.minStock;
            daysToMinStock = surplus / dailyBurnRate;
            if (daysToMinStock <= 7) {
              isAtRisk = true;
            }
          }
        } else {
          if (p.quantity <= p.minStock) {
            daysToMinStock = 0;
            isAtRisk = true;
          }
        }

        return {
          product: p,
          weeklySalesRate,
          dailyBurnRate,
          daysToMinStock,
          isAtRisk,
          txCount: salesInfo?.txCount || 0,
          totalSold: salesInfo?.totalQty || 0
        };
      });

    const flaggedItems = results.filter(r => r.isAtRisk);

    return {
      allProductsAnalytics: results,
      flaggedItems: flaggedItems.sort((a, b) => a.daysToMinStock - b.daysToMinStock)
    };
  }, [products, transactions, currentTenantId]);

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem('logiledger_copilot_model', modelId);
    showNotification(`Switched LogiLedger copilot to ${modelId}`, 'success');
  };

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`logiledger_chats_${currentTenantId}`);
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      // Default welcome message from AI Copilot
      const welcome: ChatMessage = {
        id: 'welcome',
        sender: 'assistant',
        text: `Greetings! I am your **LogiLedger AI Logistics Copilot**. 

I have fully ingested your real-time ledger context including catalog listings, active stock lines, and transaction logs.

How can I assist you today? Here are some tasks I can automate for you:
*   **Draft supplier replenishment emails** for materials in low-stock states.
*   **Audit recent stock adjustment logs** to identify possible anomalies or shrinkage.
*   **Synthesize order fulfillment throughput** or draft carrier routing notes.`,
        timestamp: new Date().toISOString()
      };
      setMessages([welcome]);
    }
  }, [currentTenantId]);

  // Save chat history
  const saveMessages = (newMsgs: ChatMessage[]) => {
    setMessages(newMsgs);
    localStorage.setItem(`logiledger_chats_${currentTenantId}`, JSON.stringify(newMsgs));
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || isLoading) return;

    if (!customPrompt) setInput('');

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    const updatedMsgs = [...messages, userMsg];
    saveMessages(updatedMsgs);
    setIsLoading(true);

    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          model: selectedModel,
          context: {
            tenantId: currentTenantId,
            currentRole,
            products,
            transactions
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server processing error');
      }

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-a`,
        sender: 'assistant',
        text: data.text,
        timestamp: new Date().toISOString()
      };

      saveMessages([...updatedMsgs, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        sender: 'assistant',
        text: `⚠️ **System Integration Alert** 
        
Failed to communicate with the server-side Gemini API. 

${err.message || 'Verification of external server socket timed out.'}

*Please verify that **GEMINI_API_KEY** is configured correctly in **Settings > Secrets** panels.*`,
        timestamp: new Date().toISOString()
      };
      saveMessages([...updatedMsgs, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    localStorage.removeItem(`logiledger_chats_${currentTenantId}`);
    const welcome: ChatMessage = {
      id: 'welcome',
      sender: 'assistant',
      text: "Chat cleared. Ask me anything about stock statuses, POs, or logs audit checks!",
      timestamp: new Date().toISOString()
    };
    setMessages([welcome]);
    showNotification('Copilot conversation history flushed.', 'info');
  };

  // Ready-to-use Prompt shortcuts
  const promptChips = [
    {
      label: 'Email Replenishment draft',
      prompt: 'Draft a professional material replenishment request email to the main supplier. Include physical metrics about any low stock items.',
      icon: <MailOpen className="w-3.5 h-3.5 text-blue-500" />
    },
    {
      label: 'Audit Log Anomalies',
      prompt: 'Review current ledger transactions list and identify any rapid stock depletion, manual adjustments, or anomalies in receiving logs.',
      icon: <ClipboardList className="w-3.5 h-3.5 text-emerald-500" />
    },
    {
      label: 'Predict 7-Day Stockouts',
      prompt: 'Calculate current daily and weekly material burn rates for all active SKUs based on transaction history. Identify fast-moving products projected to hit minimum safe stock limits within the next 7 days and compile a detailed reorder recommendations report.',
      icon: <Zap className="w-3.5 h-3.5 text-indigo-500" />
    },
    {
      label: 'Shrinkage & Variance Risk',
      prompt: 'Verify inventory stock balances. List items with high safety risk parameters and explain how we can improve bin tracking structures.',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
    }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 space-y-4 font-sans shadow-xs flex flex-col h-[78vh]">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 pb-4 shrink-0">
        <div>
          <h3 className="font-semibold text-gray-950 text-base flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600 animate-pulse" />
            <span>AI Intelligent Stock Copilot</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time context-aware business analyst. Keep credentials safe while leveraging advanced reasoning.
          </p>
        </div>
        
        <button
          onClick={clearHistory}
          className="self-start sm:self-center px-3 py-1.5 hover:bg-gray-100 border border-gray-250 text-gray-700 font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1 bg-white cursor-pointer transition"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Clear Logs</span>
        </button>
      </div>

      {/* LLM Model Router Selection */}
      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">LLM Engine Routing</span>
              <span className="text-xs text-slate-800 font-semibold block">Select model core to load-balance token overheads</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 w-full lg:w-auto">
            {[
              {
                id: 'gemini-3.1-flash-lite',
                name: 'Flash Lite',
                cost: '⚡ Lowest cost',
                hover: 'High responsive speed. Saves up to 60% token overhead. Perfect for simple log audits.',
                color: 'hover:border-green-300'
              },
              {
                id: 'gemini-3.5-flash',
                name: '3.5 Flash',
                cost: '⚖️ Balanced',
                hover: 'Default smart model. Strong balance of analytical depth and response speed.',
                color: 'hover:border-indigo-300'
              },
              {
                id: 'gemini-3.1-pro-preview',
                name: '3.1 Pro',
                cost: '🎓 Corporate Pro',
                hover: 'Deep rationale & high complexity math. Indispensable for shrinkage detection. Requires active project billing.',
                color: 'hover:border-rose-300'
              }
            ].map((m) => {
              const isSelected = selectedModel === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleModelChange(m.id)}
                  title={m.hover}
                  className={`px-3 py-2 rounded-xl text-[11px] font-bold cursor-pointer transition text-center border flex flex-col justify-center items-center ${m.color} ${
                    isSelected
                      ? 'bg-slate-900 border-slate-950 text-white shadow-md shadow-slate-900/10'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{m.name}</span>
                  <span className={`text-[8.5px] font-medium mt-0.5 ${isSelected ? 'text-indigo-300' : 'text-gray-400'}`}>
                    {m.cost}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Burn Rate & 7-Day Stockout Risk Indicators */}
      <div className="shrink-0 space-y-2">
        {burnRateAnalytics.flaggedItems.length > 0 ? (
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold text-amber-900">{burnRateAnalytics.flaggedItems.length} High-Risk Items flagged.</span>
                <span className="text-amber-700 ml-1 hidden sm:inline">Calculated weekly burn rates predict stock thresholds breach within 7 days.</span>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
              className="px-2.5 py-1 bg-amber-600 text-white hover:bg-amber-700 font-bold rounded-lg text-[9.5px] uppercase tracking-wider transition cursor-pointer"
            >
              {isAnalyticsOpen ? 'Hide Risk List' : 'View Risk List'}
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50/50 border border-emerald-150 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-800 font-medium">All active stock lines are fully optimized against 7-day burn calculations.</span>
            </div>
            <button 
              type="button"
              onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
              className="text-indigo-600 hover:text-indigo-800 font-bold text-xs cursor-pointer"
            >
              {isAnalyticsOpen ? 'Hide Burn Details' : 'Review Burn Rates'}
            </button>
          </div>
        )}

        {isAnalyticsOpen && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 gap-2.5 flex flex-col max-h-[22vh] overflow-y-auto shadow-inner">
            <div className="flex items-center justify-between border-b border-gray-150 pb-1.5 pt-0.5">
              <h4 className="font-semibold text-[10.5px] text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <ClipboardList className="w-3.5 h-3.5 text-indigo-500" />
                <span>Automatic Days-To-Cover Analytics</span>
              </h4>
              <span className="text-[9px] text-gray-400 font-mono">Based on current transaction burn rate</span>
            </div>

            {burnRateAnalytics.allProductsAnalytics.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2 text-center">No active catalog items available.</p>
            ) : (
              <div className="space-y-1.5">
                {burnRateAnalytics.allProductsAnalytics.map(({ product, weeklySalesRate, daysToMinStock, isAtRisk, txCount, totalSold }) => (
                  <div 
                    key={product.id}
                    className={`p-2 rounded-lg border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
                      isAtRisk 
                        ? 'bg-rose-50/40 border-rose-150 hover:bg-rose-50/60' 
                        : 'bg-white border-slate-150 hover:bg-slate-50/55'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-gray-900">{product.name}</span>
                        <span className="px-1 py-0.2 bg-slate-100 border border-slate-200 rounded-md font-mono text-[8.5px] text-slate-500 uppercase">
                          {product.sku}
                        </span>
                        {isAtRisk && (
                          <span className="px-1 py-0.2 bg-rose-100 border border-rose-200 text-rose-700 rounded-md font-bold text-[8px] uppercase">
                            At Risk
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-[9.5px] text-gray-400 font-mono flex-wrap">
                        <span>Stock: <strong className="text-gray-600">{product.quantity}</strong> (Min: {product.minStock})</span>
                        <span className="text-slate-300">•</span>
                        <span>Weekly Sales: <strong className="text-indigo-600 font-bold">{weeklySalesRate.toFixed(1)}/wk</strong></span>
                        <span className="text-slate-300">•</span>
                        <span>Burn Source: {totalSold} sold ({txCount} txs)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-[8.5px] text-gray-400 block uppercase font-mono">Time Remaining</span>
                        <span className={`text-[10.5px] font-bold font-mono ${
                          daysToMinStock === 0 
                            ? 'text-rose-600' 
                            : daysToMinStock <= 7 
                              ? 'text-amber-600' 
                              : 'text-emerald-600'
                        }`}>
                          {daysToMinStock === Infinity 
                            ? '∞ days (0 sales)' 
                            : daysToMinStock === 0 
                              ? 'Already Depleted' 
                              : `${daysToMinStock.toFixed(1)} days`}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const promptText = `Draft a professional material replenishment request email to the main supplier for "${product.name}" (${product.sku}). 
Current metrics:
- Stock on hand: ${product.quantity} units
- Safety threshold (Min): ${product.minStock} units
- Current calculated weekly burn rate: ${weeklySalesRate.toFixed(1)} units/week
- Projected days to threshold: ${daysToMinStock === 0 ? 'Already breached' : daysToMinStock.toFixed(1) + ' days'}

Please recommend purchasing 50 units and format the order request clearly.`;
                          handleSendMessage(promptText);
                        }}
                        className="px-2 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-indigo-600 rounded-md text-[9.5px] font-bold uppercase transition cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        <span>Replenish</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Messages Frame */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 min-h-0">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
          >
            {/* Avatar Bubble */}
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs font-mono font-bold ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>
              {msg.sender === 'user' ? currentRole.charAt(0) : <Bot className="w-4 h-4 text-indigo-400" />}
            </div>

            {/* Message bubble content */}
            <div className={`rounded-2xl px-4 py-3 text-xs leading-relaxed border ${
              msg.sender === 'user'
                ? 'bg-blue-50 border-blue-100 text-blue-900'
                : 'bg-slate-50 border-slate-150 text-slate-800'
            }`}>
              <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-wrap">
                {/* Parse Markdown-like lists & bold simply */}
                {msg.text.split('\n').map((line, idx) => {
                  let formatted = line;
                  // Handle bold indicators (**bold**)
                  const boldRegex = /\*\*(.*?)\*\*/g;
                  formatted = formatted.replace(boldRegex, '$1');
                  
                  // Simple translation for bullet lines
                  if (line.trim().startsWith('* ')) {
                    return (
                      <div key={idx} className="flex items-start gap-1.5 pl-2 py-0.5">
                        <span className="text-indigo-500 font-bold shrink-0">•</span>
                        <span>{line.trim().slice(2)}</span>
                      </div>
                    );
                  }

                  return <p key={idx} className={line.trim() === '' ? 'h-2' : ''}>{formatted}</p>;
                })}
              </div>
              <span className="text-[8px] font-mono text-gray-400 block mt-2 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 max-w-[80%] mr-auto">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-slate-400 animate-spin" />
            </div>
            <div className="rounded-2xl px-4 py-3 text-xs bg-gray-50 border border-gray-150 text-gray-500 italic flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              <span>LogiLedger Copilot is analyzing ledger anomalies...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Recommended Prompt shortcut chips */}
      <div className="shrink-0 space-y-2 border-t border-gray-100 pt-4">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Recommended Operations:</span>
        <div className="flex flex-wrap gap-2">
          {promptChips.map((chip, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(chip.prompt)}
              disabled={isLoading}
              className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 text-gray-600 rounded-xl text-[10px] border border-gray-200 flex items-center gap-1.5 font-semibold cursor-pointer active:scale-95 disabled:opacity-55 disabled:scale-100 transition whitespace-nowrap"
            >
              {chip.icon}
              <span>{chip.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="shrink-0 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          placeholder="Ask copilot about shrinkage, stock balances, or draft emails..."
          className="flex-1 bg-gray-50 border border-gray-250 hover:border-gray-300 focus:border-blue-600 focus:bg-white rounded-xl px-4 py-2 text-xs text-gray-900 outline-none transition disabled:opacity-55"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-750 text-white rounded-xl shadow-md cursor-pointer transition disabled:opacity-40 disabled:hover:bg-blue-600 active:scale-95 disabled:scale-100 flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

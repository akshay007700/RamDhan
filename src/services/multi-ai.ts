// src/services/multi-ai.ts
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';

// ============================================
// DEEPSEEK API - Real Working Code
// ============================================
const deepseek = new OpenAI({
  apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
  dangerouslyAllowBrowser: true
});

// ============================================
// GEMINI API - Real Working Code  
// ============================================
const gemini = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY 
});

// ============================================
// Helper: Call DeepSeek API
// ============================================
async function callDeepSeek(symbol: string, analysis: any): Promise<string | null> {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === 'sk-your-deepseek-actual-key-here') {
    console.log('⚠️ DeepSeek API key missing or placeholder');
    return null;
  }
  
  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are a professional crypto trading advisor. Analyze the data and give EXACTLY ONE SENTENCE advice in Hinglish (mix of Hindi and English). Be specific about action (Buy/Sell/Wait).`
        },
        {
          role: 'user',
          content: `
Symbol: ${symbol}
Current Price: $${analysis.price}
RSI (14): ${analysis.rsi.toFixed(1)}
Trend: ${analysis.trend}
Signal Zone: ${analysis.zone}
Confidence: ${analysis.confidence}%

Give ONE LINE trading advice in Hinglish.`
        }
      ],
      max_tokens: 100,
      temperature: 0.5
    });
    
    return response.choices[0].message.content;
  } catch (error: any) {
    console.error('DeepSeek API Error:', error.message);
    return null;
  }
}

// ============================================
// Helper: Call Gemini API
// ============================================
async function callGemini(symbol: string, analysis: any): Promise<string | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-actual-key-here') {
    console.log('⚠️ Gemini API key missing or placeholder');
    return null;
  }
  
  try {
    const response = await gemini.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents: `
You are a crypto trading expert. 
Symbol: ${symbol}, Price: $${analysis.price}, RSI: ${analysis.rsi}, Trend: ${analysis.trend}, Signal: ${analysis.zone}.

Give exactly one line trading advice in Hinglish (Hindi+English mixed). Be actionable.
      `
    });
    
    return response.text;
  } catch (error: any) {
    console.error('Gemini API Error:', error.message);
    return null;
  }
}

// ============================================
// Mock AI - Fallback (No API needed)
// ============================================
function getMockAnalysis(symbol: string, analysis: any): string {
  const signals: Record<string, string> = {
    'BUY': `📈 ${symbol} में तेजी के संकेत हैं। RSI ${analysis.rsi.toFixed(0)} है। Long entry ले सकते हैं।`,
    'SELL': `📉 ${symbol} में मंदी के संकेत हैं। RSI ${analysis.rsi.toFixed(0)} है। Short entry ले सकते हैं।`,
    'OVERBOUGHT': `⚠️ ${symbol} overbought है। RSI ${analysis.rsi.toFixed(0)}. थोड़ा इंतज़ार करो।`,
    'OVERSOLD': `💎 ${symbol} oversold है। RSI ${analysis.rsi.toFixed(0)}. Bounce back possible है।`,
    'CAUTION': `⚡ ${symbol} में हिचकिचाहट है। Position size कम करो।`,
    'STRONG_TREND': `🚀 ${symbol} में तेजी का ट्रेंड है। Momentum के साथ जाओ।`,
    'WAIT': `⏳ ${symbol} sideways है। Breakout का इंतज़ार करो।`
  };
  
  return signals[analysis.zone] || `${symbol}: ${analysis.trend} trend with ${analysis.confidence}% confidence.`;
}

// ============================================
// MAIN FUNCTION - Multi AI with Fallback
// ============================================
export async function getMultiAIAnalysis(symbol: string, analysis: any): Promise<string> {
  console.log('🤖 Multi-AI system starting...');
  
  // Call both APIs in parallel
  const [deepseekResult, geminiResult] = await Promise.all([
    callDeepSeek(symbol, analysis),
    callGemini(symbol, analysis)
  ]);
  
  // Collect successful responses
  const responses: { source: string; text: string }[] = [];
  
  if (deepseekResult) {
    console.log('✅ DeepSeek response received');
    responses.push({ source: 'DeepSeek', text: deepseekResult });
  }
  
  if (geminiResult) {
    console.log('✅ Gemini response received');
    responses.push({ source: 'Gemini', text: geminiResult });
  }
  
  // Always add mock AI as fallback
  const mockResult = getMockAnalysis(symbol, analysis);
  responses.push({ source: 'AI Core', text: mockResult });
  
  // Pick best response (priority: DeepSeek > Gemini > Mock)
  const bestResponse = responses[0];
  
  return `✨ ${bestResponse.text}`;
}

// ============================================
// Get Consensus Decision (Buy/Sell/Wait)
// ============================================
export async function getConsensusDecision(symbol: string, analysis: any): Promise<{
  decision: string;
  confidence: number;
}> {
  const [deepseek, gemini] = await Promise.all([
    callDeepSeek(symbol, analysis),
    callGemini(symbol, analysis)
  ]);
  
  let buyVotes = 0;
  let sellVotes = 0;
  
  // DeepSeek vote
  if (deepseek) {
    if (deepseek.toLowerCase().includes('buy')) buyVotes++;
    else if (deepseek.toLowerCase().includes('sell')) sellVotes++;
  }
  
  // Gemini vote
  if (gemini) {
    if (gemini.toLowerCase().includes('buy')) buyVotes++;
    else if (gemini.toLowerCase().includes('sell')) sellVotes++;
  }
  
  // Mock AI vote (based on analysis zone)
  if (analysis.zone === 'BUY') buyVotes++;
  else if (analysis.zone === 'SELL') sellVotes++;
  
  let decision = 'WAIT';
  let confidence = 50;
  
  if (buyVotes > sellVotes) {
    decision = 'BUY';
    confidence = 60 + (buyVotes * 10);
  } else if (sellVotes > buyVotes) {
    decision = 'SELL';
    confidence = 60 + (sellVotes * 10);
  }
  
  return { decision, confidence: Math.min(confidence, 95) };
}
// src/services/advanced-mock-ai.ts
// Advanced Mock AI - Real AI jaisa intelligent response, bilkul free!

export function getAdvancedMockAnalysis(symbol: string, analysis: any): string {
  const rsi = analysis.rsi;
  const trend = analysis.trend;
  const zone = analysis.zone;
  const price = analysis.price;
  const confidence = analysis.confidence;
  const ema20 = analysis.ema20;
  const ema50 = analysis.ema50;
  const volumeSpike = analysis.volumeSpike;
  
  // RSI based advice
  let rsiAdvice = "";
  if (rsi > 80) {
    rsiAdvice = `📊 RSI ${rsi.toFixed(0)} hai - bahut zyada overbought! Abhi mat kharido, thoda dip aane do. Pullback ke baad entry lena.`;
  } else if (rsi > 70) {
    rsiAdvice = `📊 RSI ${rsi.toFixed(0)} hai - overbought zone mein hai. Thoda correction aa sakta hai. Pullback ka wait karo.`;
  } else if (rsi < 20) {
    rsiAdvice = `📊 RSI ${rsi.toFixed(0)} hai - bahut zyada oversold! Bounce back hone ke strong chances hain. Kharidari soch sakte ho.`;
  } else if (rsi < 30) {
    rsiAdvice = `📊 RSI ${rsi.toFixed(0)} hai - oversold zone. Long entry ke liye accha time ho sakta hai.`;
  } else if (rsi > 50) {
    rsiAdvice = `📊 RSI ${rsi.toFixed(0)} hai - bullish momentum hai. Buyers control mein hain.`;
  } else if (rsi > 40) {
    rsiAdvice = `📊 RSI ${rsi.toFixed(0)} hai - neutral zone. Thoda upar neeche ho sakta hai.`;
  } else {
    rsiAdvice = `📊 RSI ${rsi.toFixed(0)} hai - bearish pressure hai. Sellers active hain.`;
  }
  
  // EMA based advice
  let emaAdvice = "";
  if (price > ema20 && ema20 > ema50) {
    emaAdvice = `📈 EMA 20 (${ema20.toFixed(0)}) aur EMA 50 (${ema50.toFixed(0)}) dono ke upar price hai. Golden crossover! Strong bullish trend.`;
  } else if (price < ema20 && ema20 < ema50) {
    emaAdvice = `📉 EMA 20 (${ema20.toFixed(0)}) aur EMA 50 (${ema50.toFixed(0)}) dono ke neeche price hai. Death cross! Strong bearish trend.`;
  } else if (price > ema20) {
    emaAdvice = `📈 Price EMA 20 (${ema20.toFixed(0)}) ke upar hai. Short term bullish hai.`;
  } else if (price < ema20) {
    emaAdvice = `📉 Price EMA 20 (${ema20.toFixed(0)}) ke neeche hai. Short term bearish hai.`;
  } else {
    emaAdvice = `📊 Price EMA 20 aur EMA 50 ke beech mein hai. Consolidation phase hai.`;
  }
  
  // Volume spike detection
  let volumeAdvice = "";
  if (volumeSpike) {
    volumeAdvice = `🔊 Volume spike detect hua hai! Smart money movement ho sakta hai. Yeh signal ignore mat karna.`;
  }
  
  // Zone based final action
  let action = "";
  let entry = "";
  let stopLoss = "";
  let target1 = "";
  let target2 = "";
  let riskReward = "";
  
  if (zone === 'BUY') {
    action = "✅ BUY SIGNAL - KHARIDARI KAR SAKTE HO";
    entry = `🎯 Entry Zone: ${price} ke aas paas ya ${(price * 0.99).toFixed(2)} tak dip mein`;
    stopLoss = `🛑 Stop Loss: ${(price * 0.975).toFixed(2)} (2.5% neeche)`;
    target1 = `🎯 Target 1: ${(price * 1.03).toFixed(2)} (3% upar)`;
    target2 = `🎯 Target 2: ${(price * 1.06).toFixed(2)} (6% upar)`;
    riskReward = `📐 Risk:Reward = 1:2 hai - accha hai!`;
  } 
  else if (zone === 'SELL') {
    action = "❌ SELL SIGNAL - BEECH SAKTE HO";
    entry = `🎯 Entry Zone: ${price} ke aas paas ya ${(price * 1.01).toFixed(2)} tak upar mein short`;
    stopLoss = `🛑 Stop Loss: ${(price * 1.025).toFixed(2)} (2.5% upar)`;
    target1 = `🎯 Target 1: ${(price * 0.97).toFixed(2)} (3% neeche)`;
    target2 = `🎯 Target 2: ${(price * 0.94).toFixed(2)} (6% neeche)`;
    riskReward = `📐 Risk:Reward = 1:2 hai - accha hai!`;
  }
  else if (zone === 'OVERBOUGHT') {
    action = "⚠️ OVERBOUGHT ZONE - ABHI MAT KHARIDO";
    entry = `⏳ Wait for pullback: ${(price * 0.97).toFixed(2)} tak aane do phir sochna`;
    stopLoss = `🛑 Agar price ${(price * 1.02).toFixed(2)} tod gaya to aur upar ja sakta hai`;
    target1 = `📉 Support 1: ${(price * 0.95).toFixed(2)}`;
    target2 = `📉 Support 2: ${(price * 0.92).toFixed(2)}`;
    riskReward = `⚠️ Risk high hai. Position size kam rakho.`;
  }
  else if (zone === 'OVERSOLD') {
    action = "💎 OVERSOLD ZONE - BOUNCE POSSIBLE HAI";
    entry = `🎯 Entry: ${(price * 1.02).toFixed(2)} todne par buy karna`;
    stopLoss = `🛑 Stop Loss: ${(price * 0.975).toFixed(2)}`;
    target1 = `📈 Resistance 1: ${(price * 1.05).toFixed(2)}`;
    target2 = `📈 Resistance 2: ${(price * 1.08).toFixed(2)}`;
    riskReward = `💎 Risk hai lekin reward bhi accha ho sakta hai.`;
  }
  else if (zone === 'CAUTION') {
    action = "⚠️ CAUTION ZONE - SAVDHANI BACHAO";
    entry = `⏳ Clear signal nahi hai. Wait and watch karo.`;
    stopLoss = `🛑 Agar trade kar rahe ho to tight stop loss rakho`;
    target1 = `📊 Thoda profit book kar lo`;
    target2 = `📊 Position size half kar do`;
    riskReward = `⚠️ High volatility expected. Bach ke raho.`;
  }
  else if (zone === 'STRONG_TREND') {
    action = "🚀 STRONG TREND - TREND KE SAATH JAO";
    entry = `🎯 Pullback mein entry lo. ${(price * 0.99).toFixed(2)} tak aaye to le lo`;
    stopLoss = `🛑 Stop Loss: EMA 20 (${ema20.toFixed(0)}) ke neeche rakho`;
    target1 = `🎯 Agli resistance tak pakdo`;
    target2 = `🎯 Trend break hone tak hold karo`;
    riskReward = `🚀 Trend strong hai, momentum ke saath jao!`;
  }
  else {
    action = "⏳ NO CLEAR SIGNAL - SABAR KARO";
    entry = `⏳ Breakout ya breakdown ka intezaar karo`;
    stopLoss = `🛑 Range ke bahar stop loss rakho`;
    target1 = `📊 Range ke boundaries target rakho`;
    target2 = `📊 Sideways market mein overtrade mat karo`;
    riskReward = `⏳ Sabar ka fal meetha hota hai. Wait karo.`;
  }
  
  // Confidence message
  let confidenceMsg = "";
  if (confidence > 80) {
    confidenceMsg = `🎯 Confidence ${confidence}% hai - strong signal! Thoda bharosa rakho.`;
  } else if (confidence > 60) {
    confidenceMsg = `📊 Confidence ${confidence}% hai - moderate signal. Risk manage karo.`;
  } else if (confidence > 40) {
    confidenceMsg = `⚠️ Confidence ${confidence}% hai - low confidence. Position size kam rakho.`;
  } else {
    confidenceMsg = `⚠️ Confidence ${confidence}% hai - very low. Best to wait.`;
  }
  
  // Market summary
  const summary = `🔍 ${symbol} ka price $${price.toFixed(2)} hai. Trend ${trend === 'BULLISH' ? 'तेजी' : trend === 'BEARISH' ? 'मंदी' : 'साइडवेज'} ka hai.`;
  
  // Final combined message
  return `${action}\n\n${summary}\n\n${rsiAdvice}\n\n${emaAdvice}\n\n${volumeAdvice}\n\n${entry}\n${stopLoss}\n${target1}\n${target2}\n${riskReward}\n\n${confidenceMsg}\n\n---\n💡 Tip: Loss se daro mat, risk management hi key hai!`;
}

// Quick advice for sidebar (1 line)
export function getQuickAdvice(symbol: string, analysis: any): string {
  const rsi = analysis.rsi;
  const zone = analysis.zone;
  const confidence = analysis.confidence;
  const price = analysis.price;
  
  const zoneEmoji: Record<string, string> = {
    'BUY': '🟢',
    'SELL': '🔴', 
    'OVERBOUGHT': '🟡',
    'OVERSOLD': '🟢',
    'CAUTION': '⚠️',
    'STRONG_TREND': '🚀',
    'WAIT': '⚪'
  };
  
  const zoneText: Record<string, string> = {
    'BUY': 'BUY signal hai!',
    'SELL': 'SELL signal hai!',
    'OVERBOUGHT': 'overbought hai',
    'OVERSOLD': 'oversold hai',
    'CAUTION': 'caution zone hai',
    'STRONG_TREND': 'strong trend mein hai',
    'WAIT': 'sideways hai'
  };
  
  return `${zoneEmoji[zone]} ${symbol} $${price.toFixed(0)}: ${zoneText[zone]} RSI ${rsi.toFixed(0)} | Confidence ${confidence}%`;
}

// Get credit status message
export function getCreditMessage(creditsLeft: number): string {
  if (creditsLeft <= 0) {
    return "⚠️ Aapke free credits khatam ho gaye! Kal naye credits milenge (1000/day).";
  } else if (creditsLeft <= 50) {
    return `⚠️ Sirf ${creditsLeft} free credits bache hain! Kal naye milenge. Bachake use karo.`;
  } else if (creditsLeft <= 100) {
    return `⚠️ ${creditsLeft} credits bache hain. Kal refresh ho jayenge.`;
  } else if (creditsLeft <= 200) {
    return `📊 ${creditsLeft} credits bache hain. Aaram se use karo.`;
  } else {
    return `✅ ${creditsLeft} free credits available hain! Enjoy karo.`;
  }
}
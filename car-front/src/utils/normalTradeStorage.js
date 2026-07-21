const NORMAL_TRADE_KEY = "car_front_normal_trades";

export function getNormalTrades() {
  try {
    return JSON.parse(localStorage.getItem(NORMAL_TRADE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveNormalTrade(trade) {
  const trades = getNormalTrades();
  const duplicated = trades.some(
    (item) =>
      Number(item.carId) === Number(trade.carId) &&
      Number(item.buyerId) === Number(trade.buyerId) &&
      item.status === "구매완료"
  );

  if (duplicated) {
    return trades.find(
      (item) =>
        Number(item.carId) === Number(trade.carId) &&
        Number(item.buyerId) === Number(trade.buyerId)
    );
  }

  const nextTrades = [trade, ...trades];
  localStorage.setItem(NORMAL_TRADE_KEY, JSON.stringify(nextTrades));
  window.dispatchEvent(new Event("normal-trade-change"));
  return trade;
}

export function getReviewableTrades(memberId, dealerId) {
  return getNormalTrades().filter(
    (trade) =>
      trade.status === "구매완료" &&
      Number(trade.buyerId) === Number(memberId) &&
      Number(trade.dealerId) === Number(dealerId)
  );
}

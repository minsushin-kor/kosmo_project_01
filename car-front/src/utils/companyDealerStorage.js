const COMPANY_DEALER_STORAGE_KEY = "companyDealers";

export function getCompanyDealersFromStorage() {
  const savedDealers = localStorage.getItem(COMPANY_DEALER_STORAGE_KEY);

  if (!savedDealers) {
    return [];
  }

  try {
    return JSON.parse(savedDealers);
  } catch {
    localStorage.removeItem(COMPANY_DEALER_STORAGE_KEY);
    return [];
  }
}

export function saveCompanyDealerToStorage(dealerData) {
  const savedDealers = getCompanyDealersFromStorage();
  const nextDealers = [dealerData, ...savedDealers];

  localStorage.setItem(COMPANY_DEALER_STORAGE_KEY, JSON.stringify(nextDealers));
}

export function updateCompanyDealerStatus(dealerId, status) {
  const savedDealers = getCompanyDealersFromStorage();

  const nextDealers = savedDealers.map((dealer) =>
    dealer.id === dealerId
      ? {
        ...dealer,
        status,
      }
      : dealer
  );

  localStorage.setItem(COMPANY_DEALER_STORAGE_KEY, JSON.stringify(nextDealers));
}
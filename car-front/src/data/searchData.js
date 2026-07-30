export const initialSearchCondition = {
  brand: "",
  modelName: "",
  minPrice: 500,
  maxPrice: 5000,
  year: "",
  mileage: "",
  region: "",
};

const LAST_SEARCH_CONDITION_KEY =
  "car_front_last_search_condition";

export function getLastSearchCondition() {
  try {
    const savedCondition = JSON.parse(
      localStorage.getItem(
        LAST_SEARCH_CONDITION_KEY
      ) || "null"
    );

    if (
      !savedCondition ||
      typeof savedCondition !== "object"
    ) {
      return null;
    }

    return {
      ...initialSearchCondition,
      ...savedCondition,
    };
  } catch {
    localStorage.removeItem(
      LAST_SEARCH_CONDITION_KEY
    );
    return null;
  }
}

export function saveLastSearchCondition(
  condition
) {
  localStorage.setItem(
    LAST_SEARCH_CONDITION_KEY,
    JSON.stringify({
      ...initialSearchCondition,
      ...condition,
    })
  );
}

export function clearLastSearchCondition() {
  localStorage.removeItem(
    LAST_SEARCH_CONDITION_KEY
  );
}

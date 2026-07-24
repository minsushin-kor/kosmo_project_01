import { useMemo, useState } from "react";

const formatWon = (value) =>
  new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const initialForm = {
  preferredMake: "",
  preferredModel: "",
  preferredYear: "",
  maxOdometer: "",
  expectedPrice: "",
  preferredColor: "",
  minimumCondition: "",
  priceTolerance: "",
  options: "",
  exactMake: false,
  exactModel: false,
};

const basicFieldKeys = [
  "preferredMake",
  "preferredModel",
  "preferredYear",
  "maxOdometer",
  "expectedPrice",
];

function BuyerRecomendTest({ activeServerUrl }) {
  const [form, setForm] = useState(initialForm);
  const [recommendations, setRecommendations] = useState([]);
  const [excludedConditions, setExcludedConditions] = useState([]);
  const [resultMessage, setResultMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const basicFilledCount = useMemo(
    () =>
      basicFieldKeys.filter((key) => String(form[key]).trim() !== "").length,
    [form],
  );

  const canRecommend = basicFilledCount >= 2;
  const displayedRecommendations = isExpanded
    ? recommendations.slice(0, 10)
    : recommendations.slice(0, 5);

  const updateField = (event) => {
    const { name, value, checked, type } = event.target;

    setForm((current) => {
      const nextForm = {
        ...current,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "preferredMake" && !value.trim()) {
        nextForm.exactMake = false;
      }
      if (name === "preferredModel" && !value.trim()) {
        nextForm.exactModel = false;
      }
      if (name === "expectedPrice" && !value) {
        nextForm.priceTolerance = "";
      }

      return nextForm;
    });
    setErrorMessage("");
  };

  const submitForm = async (event) => {
    event.preventDefault();

    if (!canRecommend) {
      setErrorMessage("기본 조건을 2개 이상 입력해 주세요.");
      return;
    }

    const payload = {};
    const textFields = ["preferredMake", "preferredModel", "preferredColor"];
    const numberFields = [
      "preferredYear",
      "maxOdometer",
      "expectedPrice",
      "minimumCondition",
      "priceTolerance",
    ];

    textFields.forEach((key) => {
      const value = form[key].trim();
      if (value) payload[key] = value;
    });
    numberFields.forEach((key) => {
      if (form[key] !== "") payload[key] = Number(form[key]);
    });

    const options = form.options
      .split(",")
      .map((option) => option.trim())
      .filter(Boolean);
    if (options.length) payload.options = options;
    payload.exactMake = form.exactMake;
    payload.exactModel = form.exactModel;

    setIsLoading(true);
    setHasSearched(true);
    setIsExpanded(false);
    setRecommendations([]);
    setExcludedConditions([]);
    setResultMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        `${activeServerUrl}/api/ai/vehicle-recommendations/buyer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      const result = await response.json();

      if (!response.ok) {
        const detail = Array.isArray(result.detail)
          ? result.detail.map((item) => item.msg).join(", ")
          : result.detail;
        throw new Error(detail || "차량 추천 결과를 불러오지 못했습니다.");
      }

      setRecommendations(
        Array.isArray(result.recommendations) ? result.recommendations : [],
      );
      setExcludedConditions(
        Array.isArray(result.excluded_conditions)
          ? result.excluded_conditions
          : [],
      );
      setResultMessage(result.message || "");
    } catch (error) {
      console.error("구매자 차량 추천 요청에 실패했습니다:", error);
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setRecommendations([]);
    setExcludedConditions([]);
    setResultMessage("");
    setErrorMessage("");
    setIsExpanded(false);
    setHasSearched(false);
  };

  return (
    <section className="buyer-recommend-panel">
      <style>{`
        .buyer-recommend-panel {
          margin-top: 2rem;
          background: #ffffff;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
        }
        .buyer-recommend-header {
          margin-bottom: 1.5rem;
        }
        .buyer-recommend-header h2 {
          margin: 0;
          color: #1e293b;
          font-size: 1.25rem;
          font-weight: 700;
        }
        .buyer-recommend-header p {
          margin: 0.4rem 0 0;
          color: #64748b;
          font-size: 0.875rem;
          line-height: 1.55;
        }
        .buyer-recommend-group {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.25rem;
          margin: 0 0 1.25rem;
        }
        .buyer-recommend-group legend {
          padding: 0 0.5rem;
          color: #334155;
          font-size: 0.95rem;
          font-weight: 800;
        }
        .buyer-recommend-group-note {
          margin: 0 0 1rem;
          color: #64748b;
          font-size: 0.82rem;
        }
        .buyer-recommend-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
        }
        .buyer-recommend-field {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          min-width: 0;
        }
        .buyer-recommend-field label {
          color: #334155;
          font-size: 0.85rem;
          font-weight: 700;
        }
        .buyer-recommend-field input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
          color: #1e293b;
          padding: 0.7rem 0.8rem;
          font: inherit;
        }
        .buyer-recommend-field input:focus {
          outline: 2px solid #bfdbfe;
          border-color: #2563eb;
        }
        .buyer-recommend-field small {
          color: #94a3b8;
          font-size: 0.75rem;
          line-height: 1.4;
        }
        .buyer-recommend-checkboxes {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem 1.25rem;
          margin-top: 1rem;
        }
        .buyer-recommend-checkbox {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #334155;
          font-size: 0.85rem;
          font-weight: 700;
        }
        .buyer-recommend-checkbox input {
          width: 1rem;
          height: 1rem;
          accent-color: #2563eb;
        }
        .buyer-recommend-checkbox:has(input:disabled) {
          color: #94a3b8;
        }
        .buyer-recommend-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .buyer-recommend-count {
          margin: 0;
          color: ${canRecommend ? "#047857" : "#b45309"};
          font-size: 0.85rem;
          font-weight: 700;
        }
        .buyer-recommend-buttons {
          display: flex;
          gap: 0.65rem;
        }
        .buyer-recommend-button {
          border: 0;
          border-radius: 8px;
          padding: 0.7rem 1.2rem;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
        }
        .buyer-recommend-button.reset {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #475569;
        }
        .buyer-recommend-button.submit {
          background: #2563eb;
          color: #ffffff;
        }
        .buyer-recommend-button.submit:disabled {
          background: #cbd5e1;
          color: #64748b;
          cursor: not-allowed;
        }
        .buyer-recommend-confirmation {
          margin: 1rem 0 0;
          border-radius: 8px;
          background: #eff6ff;
          color: #1d4ed8;
          padding: 0.75rem 0.9rem;
          font-size: 0.85rem;
          font-weight: 700;
        }
        .buyer-recommend-confirmation.error {
          background: #fef2f2;
          color: #b91c1c;
        }
        .buyer-recommend-result {
          margin-top: 1.5rem;
          border-top: 1px solid #e2e8f0;
          padding-top: 1.5rem;
        }
        .buyer-recommend-result-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .buyer-recommend-result-header h3 {
          margin: 0;
          color: #1e293b;
          font-size: 1.05rem;
        }
        .buyer-recommend-result-header p {
          margin: 0.3rem 0 0;
          color: #64748b;
          font-size: 0.82rem;
        }
        .buyer-recommend-excluded {
          margin: 0 0 1rem;
          border-radius: 8px;
          background: #fffbeb;
          color: #92400e;
          padding: 0.75rem 0.9rem;
          font-size: 0.82rem;
          line-height: 1.5;
        }
        .buyer-recommend-result-table-wrap {
          width: 100%;
          overflow-x: auto;
        }
        .buyer-recommend-result-table {
          width: 100%;
          min-width: 1050px;
          border-collapse: collapse;
          font-size: 0.84rem;
        }
        .buyer-recommend-result-table th {
          background: #f8fafc;
          color: #475569;
          padding: 0.75rem;
          text-align: left;
          border-bottom: 2px solid #e2e8f0;
          white-space: nowrap;
        }
        .buyer-recommend-result-table td {
          color: #334155;
          padding: 0.85rem 0.75rem;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: top;
        }
        .buyer-recommend-score {
          color: #2563eb;
          font-weight: 800;
          white-space: nowrap;
        }
        .buyer-recommend-condition {
          color: #059669;
          font-weight: 800;
          white-space: nowrap;
        }
        .buyer-recommend-price {
          color: #7c3aed;
          font-weight: 800;
          white-space: nowrap;
        }
        .buyer-recommend-reasons {
          min-width: 260px;
          margin: 0;
          padding-left: 1.15rem;
          line-height: 1.5;
          word-break: keep-all;
        }
        .buyer-recommend-more {
          display: flex;
          justify-content: center;
          margin-top: 1.25rem;
        }
        .buyer-recommend-more button {
          border: 0;
          border-radius: 8px;
          background: #4f46e5;
          color: #ffffff;
          padding: 0.65rem 1.4rem;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
        }
        .buyer-recommend-empty {
          min-height: 110px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px dashed #cbd5e1;
          border-radius: 10px;
          color: #64748b;
          padding: 1rem;
          text-align: center;
          font-weight: 700;
        }
        @media (max-width: 900px) {
          .buyer-recommend-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 600px) {
          .buyer-recommend-panel {
            padding: 1.25rem;
          }
          .buyer-recommend-grid {
            grid-template-columns: 1fr;
          }
          .buyer-recommend-actions,
          .buyer-recommend-buttons {
            align-items: stretch;
            width: 100%;
          }
          .buyer-recommend-buttons {
            flex-direction: column-reverse;
          }
        }
      `}</style>

      <div className="buyer-recommend-header">
        <h2>🔎 구매자 맞춤 차량 추천</h2>
        <p>
          원하는 차량 조건을 입력해 주세요. 입력하지 않은 조건은 추천 점수
          계산에서 제외됩니다.
        </p>
      </div>

      <form onSubmit={submitForm}>
        <fieldset className="buyer-recommend-group" disabled={isLoading}>
          <legend>기본 조건</legend>
          <p className="buyer-recommend-group-note">
            아래 항목 중 최소 2개를 입력해야 추천을 요청할 수 있습니다.
          </p>
          <div className="buyer-recommend-grid">
            <div className="buyer-recommend-field">
              <label htmlFor="buyer-preferred-make">선호 제조사</label>
              <input
                id="buyer-preferred-make"
                name="preferredMake"
                type="text"
                value={form.preferredMake}
                onChange={updateField}
                placeholder="예: 현대"
              />
            </div>
            <div className="buyer-recommend-field">
              <label htmlFor="buyer-preferred-model">선호 차량 모델</label>
              <input
                id="buyer-preferred-model"
                name="preferredModel"
                type="text"
                value={form.preferredModel}
                onChange={updateField}
                placeholder="예: 그랜저"
              />
            </div>
            <div className="buyer-recommend-field">
              <label htmlFor="buyer-preferred-year">희망 연식</label>
              <input
                id="buyer-preferred-year"
                name="preferredYear"
                type="number"
                min="1990"
                max="2030"
                value={form.preferredYear}
                onChange={updateField}
                placeholder="예: 2022"
              />
            </div>
            <div className="buyer-recommend-field">
              <label htmlFor="buyer-max-odometer">최대 주행거리</label>
              <input
                id="buyer-max-odometer"
                name="maxOdometer"
                type="number"
                min="1"
                step="1000"
                value={form.maxOdometer}
                onChange={updateField}
                placeholder="예: 80000"
              />
              <small>단위: km</small>
            </div>
            <div className="buyer-recommend-field">
              <label htmlFor="buyer-expected-price">예상 구매가격</label>
              <input
                id="buyer-expected-price"
                name="expectedPrice"
                type="number"
                min="1"
                step="10000"
                value={form.expectedPrice}
                onChange={updateField}
                placeholder="예: 30000000"
              />
              <small>단위: 원</small>
            </div>
          </div>
        </fieldset>

        <fieldset className="buyer-recommend-group" disabled={isLoading}>
          <legend>선택 조건</legend>
          <p className="buyer-recommend-group-note">
            필요한 항목만 입력하세요. 입력한 선택 조건들이 추가 가중치 20점을
            나누어 갖습니다.
          </p>
          <div className="buyer-recommend-grid">
            <div className="buyer-recommend-field">
              <label htmlFor="buyer-preferred-color">선호 색상</label>
              <input
                id="buyer-preferred-color"
                name="preferredColor"
                type="text"
                value={form.preferredColor}
                onChange={updateField}
                placeholder="예: 검정"
              />
            </div>
            <div className="buyer-recommend-field">
              <label htmlFor="buyer-minimum-condition">
                최소 차량 상태
              </label>
              <input
                id="buyer-minimum-condition"
                name="minimumCondition"
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={form.minimumCondition}
                onChange={updateField}
                placeholder="예: 4.0"
              />
              <small>5점 만점</small>
            </div>
            <div className="buyer-recommend-field">
              <label htmlFor="buyer-price-tolerance">
                허용 가능한 가격 범위
              </label>
              <input
                id="buyer-price-tolerance"
                name="priceTolerance"
                type="number"
                min="1"
                step="10000"
                value={form.priceTolerance}
                onChange={updateField}
                placeholder="예: 3000000"
                disabled={!form.expectedPrice}
              />
              <small>예상 구매가격 기준 ±원</small>
            </div>
            <div className="buyer-recommend-field">
              <label htmlFor="buyer-options">원하는 옵션</label>
              <input
                id="buyer-options"
                name="options"
                type="text"
                value={form.options}
                onChange={updateField}
                placeholder="예: 선루프, 통풍시트"
              />
              <small>여러 옵션은 쉼표로 구분</small>
            </div>
          </div>

          <div className="buyer-recommend-checkboxes">
            <label className="buyer-recommend-checkbox">
              <input
                name="exactMake"
                type="checkbox"
                checked={form.exactMake}
                onChange={updateField}
                disabled={!form.preferredMake}
              />
              제조사 반드시 일치
            </label>
            <label className="buyer-recommend-checkbox">
              <input
                name="exactModel"
                type="checkbox"
                checked={form.exactModel}
                onChange={updateField}
                disabled={!form.preferredModel}
              />
              차량 모델 반드시 일치
            </label>
          </div>
        </fieldset>

        <div className="buyer-recommend-actions">
          <p className="buyer-recommend-count" aria-live="polite">
            기본 조건 {basicFilledCount}/5 입력
            {canRecommend
              ? " · 추천 요청 가능"
              : " · 최소 2개를 입력해 주세요"}
          </p>
          <div className="buyer-recommend-buttons">
            <button
              type="button"
              className="buyer-recommend-button reset"
              onClick={resetForm}
              disabled={isLoading}
            >
              입력 초기화
            </button>
            <button
              type="button"
              className="buyer-recommend-button submit"
              disabled={!canRecommend || isLoading}
              onClick={submitForm}
            >
              {isLoading ? "추천 차량 계산 중" : "추천 차량 찾기"}
            </button>
          </div>
        </div>
      </form>

      {isLoading && (
        <p className="buyer-recommend-confirmation" role="status">
          입력하신 조건에 맞는 차량을 찾고 있습니다.
        </p>
      )}

      {errorMessage && (
        <p className="buyer-recommend-confirmation error" role="alert">
          {errorMessage}
        </p>
      )}

      {!isLoading && hasSearched && !errorMessage && (
        <div className="buyer-recommend-result">
          <div className="buyer-recommend-result-header">
            <div>
              <h3>추천 차량 결과</h3>
              <p>
                조건 일치 점수가 높은 순서로 최대 10대까지 표시합니다.
              </p>
            </div>
            <strong>{recommendations.length}대 추천</strong>
          </div>

          {excludedConditions.map((item) => (
            <p
              className="buyer-recommend-excluded"
              key={`${item.condition}-${item.reason}`}
            >
              {item.reason}
            </p>
          ))}

          {recommendations.length === 0 ? (
            <div className="buyer-recommend-empty">
              {resultMessage ||
                "추천 결과가 없습니다. 입력 조건을 완화해 주세요."}
            </div>
          ) : (
            <>
              <div className="buyer-recommend-result-table-wrap">
                <table className="buyer-recommend-result-table">
                  <thead>
                    <tr>
                      <th>순위</th>
                      <th>차량</th>
                      <th>연식</th>
                      <th>주행거리</th>
                      <th>적합도</th>
                      <th>Condition</th>
                      <th>예상 MMR</th>
                      <th>추천 사유</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedRecommendations.map((vehicle, index) => (
                      <tr key={vehicle.vehicle_id}>
                        <td>
                          <strong>{index + 1}</strong>
                        </td>
                        <td>
                          <strong>{vehicle.make}</strong> {vehicle.model}
                          <br />
                          <small>{vehicle.vehicle_id}</small>
                        </td>
                        <td>{vehicle.year}</td>
                        <td>
                          {Number(vehicle.odometer).toLocaleString()} km
                        </td>
                        <td className="buyer-recommend-score">
                          {Number(vehicle.match_score).toFixed(2)}점
                        </td>
                        <td className="buyer-recommend-condition">
                          {Number(vehicle.predicted_condition).toFixed(2)} / 5
                        </td>
                        <td className="buyer-recommend-price">
                          {formatWon(vehicle.predicted_mmr)}
                        </td>
                        <td>
                          <ul className="buyer-recommend-reasons">
                            {(vehicle.recommendation_reasons || []).map(
                              (reason) => (
                                <li key={reason}>{reason}</li>
                              ),
                            )}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!isExpanded && recommendations.length > 5 && (
                <div className="buyer-recommend-more">
                  <button
                    type="button"
                    onClick={() => setIsExpanded(true)}
                  >
                    추천 차량 더보기 (최대 {recommendations.length}대)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

export default BuyerRecomendTest;

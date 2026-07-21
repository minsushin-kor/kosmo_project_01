import { useEffect, useMemo, useState } from "react";

const formatMmr = (value) =>
  new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

function RecomendTest({ activeServerUrl }) {
  const [recommendations, setRecommendations] = useState([]);
  const [sortMode, setSortMode] = useState("condition");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchRecommendations = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(
          `${activeServerUrl}/api/ai/vehicle-recommendations`,
          { signal: controller.signal },
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.detail || "차량 추천 결과를 불러오지 못했습니다.");
        }

        setRecommendations(
          Array.isArray(result.recommendations) ? result.recommendations : [],
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("차량 추천 결과를 불러오지 못했습니다:", error);
          setRecommendations([]);
          setErrorMessage(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchRecommendations();
    return () => controller.abort();
  }, [activeServerUrl]);

  const sortedRecommendations = useMemo(() => {
    return [...recommendations].sort((a, b) => {
      if (sortMode === "mmr") {
        return (
          b.predicted_mmr - a.predicted_mmr ||
          b.predicted_condition - a.predicted_condition
        );
      }

      return (
        b.predicted_condition - a.predicted_condition ||
        b.predicted_mmr - a.predicted_mmr
      );
    });
  }, [recommendations, sortMode]);

  const displayedRecommendations = useMemo(() => {
    const ranked = sortedRecommendations.map((vehicle, index) => ({
      ...vehicle,
      rank: index + 1,
    }));
    return isExpanded ? ranked : ranked.slice(0, 10);
  }, [sortedRecommendations, isExpanded]);

  const changeSortMode = (nextMode) => {
    setSortMode(nextMode);
    setIsExpanded(false);
  };

  return (
    <section className="recommend-test-panel">
      <style>{`
        .recommend-test-panel {
          background: #ffffff;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
        }
        .recommend-test-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .recommend-test-title h2 {
          margin: 0;
          color: #1e293b;
          font-size: 1.25rem;
          font-weight: 700;
        }
        .recommend-test-title p {
          margin: 0.35rem 0 0;
          color: #64748b;
          font-size: 0.875rem;
        }
        .recommend-sort-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .recommend-sort-button {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
          color: #475569;
          padding: 0.55rem 0.9rem;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
        }
        .recommend-sort-button.active {
          border-color: #2563eb;
          background: #2563eb;
          color: #ffffff;
        }
        .recommend-state {
          min-height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px dashed #cbd5e1;
          border-radius: 10px;
          color: #64748b;
          font-weight: 600;
          text-align: center;
          padding: 1rem;
        }
        .recommend-state.error {
          border-color: #fecaca;
          background: #fef2f2;
          color: #b91c1c;
        }
        .recommend-table-wrap {
          width: 100%;
          overflow-x: auto;
        }
        .recommend-table {
          width: 100%;
          min-width: 980px;
          border-collapse: collapse;
          font-size: 0.875rem;
        }
        .recommend-table th {
          background: #f8fafc;
          padding: 0.75rem 0.8rem;
          color: #475569;
          text-align: left;
          border-bottom: 2px solid #e2e8f0;
          white-space: nowrap;
        }
        .recommend-table td {
          padding: 0.85rem 0.8rem;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        .recommend-rank {
          color: #2563eb;
          font-weight: 800;
        }
        .recommend-condition {
          color: #059669;
          font-weight: 800;
          white-space: nowrap;
        }
        .recommend-mmr {
          color: #7c3aed;
          font-weight: 800;
          white-space: nowrap;
        }
        .recommend-options {
          min-width: 230px;
          max-width: 340px;
          white-space: normal;
          overflow-wrap: anywhere;
          word-break: keep-all;
          line-height: 1.5;
          color: #64748b;
        }
        .recommend-more-container {
          display: flex;
          justify-content: center;
          margin-top: 1.5rem;
        }
        .recommend-more-button {
          border: 0;
          border-radius: 8px;
          background: #4f46e5;
          color: #ffffff;
          padding: 0.65rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
        }
        .recommend-more-button:hover {
          background: #4338ca;
        }
        @media (max-width: 768px) {
          .recommend-test-panel {
            padding: 1.25rem;
          }
          .recommend-test-header {
            flex-direction: column;
          }
          .recommend-sort-buttons {
            justify-content: flex-start;
          }
        }
      `}</style>

      <div className="recommend-test-header">
        <div className="recommend-test-title">
          <h2>🚗 딜러 추천 차량</h2>
          <p>
            차량 Condition과 예상 MMR을 모델로 계산한 추천 결과입니다. 현재 총
            {` ${recommendations.length}대`}입니다.
          </p>
        </div>
        <div className="recommend-sort-buttons" aria-label="차량 추천 정렬 기준">
          <button
            type="button"
            className={`recommend-sort-button ${sortMode === "condition" ? "active" : ""}`}
            aria-pressed={sortMode === "condition"}
            onClick={() => changeSortMode("condition")}
          >
            차량 상태 우선
          </button>
          <button
            type="button"
            className={`recommend-sort-button ${sortMode === "mmr" ? "active" : ""}`}
            aria-pressed={sortMode === "mmr"}
            onClick={() => changeSortMode("mmr")}
          >
            예상가격 우선
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="recommend-state">차량 추천 모델이 계산 중입니다.</div>
      ) : errorMessage ? (
        <div className="recommend-state error">{errorMessage}</div>
      ) : recommendations.length === 0 ? (
        <div className="recommend-state">표시할 추천 차량이 없습니다.</div>
      ) : (
        <>
          <div className="recommend-table-wrap">
            <table className="recommend-table">
              <thead>
                <tr>
                  <th>추천순위</th>
                  <th>차량 ID</th>
                  <th>연식</th>
                  <th>제조사 / 모델</th>
                  <th>주행거리</th>
                  <th>옵션</th>
                  <th>예상 Condition</th>
                  <th>예상 MMR</th>
                </tr>
              </thead>
              <tbody>
                {displayedRecommendations.map((vehicle) => (
                  <tr key={vehicle.vehicle_id}>
                    <td className="recommend-rank">{vehicle.rank}</td>
                    <td>{vehicle.vehicle_id}</td>
                    <td>{vehicle.year}</td>
                    <td>
                      <strong>{vehicle.make}</strong> {vehicle.model}
                    </td>
                    <td>{Number(vehicle.odometer).toLocaleString()}</td>
                    <td className="recommend-options">
                      {vehicle.option?.length
                        ? vehicle.option.join(", ")
                        : "등록된 옵션 없음"}
                    </td>
                    <td className="recommend-condition">
                      {Number(vehicle.predicted_condition).toFixed(2)} / 5.00
                    </td>
                    <td className="recommend-mmr">
                      {formatMmr(vehicle.predicted_mmr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isExpanded && recommendations.length > 10 && (
            <div className="recommend-more-container">
              <button
                type="button"
                className="recommend-more-button"
                onClick={() => setIsExpanded(true)}
              >
                추천 차량 더보기 (전체 {recommendations.length}대)
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default RecomendTest;

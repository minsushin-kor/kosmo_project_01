import pandas as pd
from pathlib import Path

CAR_PATH = Path(r"D:\minsu\workspace_boot\kosmo_project_01\dataset\car_prices_final.csv")

print("=== [ car_prices_final.csv 상태 점수(condition) 오염 복원 및 저장 시작 ] ===")

try:
    df = pd.read_csv(CAR_PATH)
    print(f"  * 로드 성공: {len(df)}행")
    
    # 0.5 이하인 값만 10배 곱하기 복원 적용
    df["condition"] = df["condition"].apply(
        lambda x: x * 10.0 if (not pd.isna(x) and x <= 0.5) else x
    )
    
    print("  * 복원 연산 완료. 데이터 저장 중...")
    # 인코딩 유지하며 원래 경로에 안전하게 덮어쓰기
    df.to_csv(CAR_PATH, index=False, encoding="utf-8-sig")
    print("  * 정제 데이터 저장 성공! (D:\\minsu\\workspace_boot\\kosmo_project_01\\dataset\\car_prices_final.csv)")
    
    # 결과 다시 한 번 검증 출력
    print(df["condition"].describe())

except Exception as e:
    print(f"❌ 작업 실패: {e}")

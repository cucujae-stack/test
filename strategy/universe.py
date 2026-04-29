"""ETF universe — 국내 증권사 운용 ETF, 자산군별로 분산 구성.

Yahoo Finance 티커: KRX 6자리 코드 + .KS
"""

# ticker → 한글 종목명
ETF_UNIVERSE: dict[str, str] = {
    # 국내 주식
    "069500.KS": "KODEX 200",
    "232080.KS": "TIGER 코스닥150",
    "278530.KS": "KODEX 200TR",
    # 미국 주식 노출
    "360750.KS": "TIGER 미국S&P500",
    "379810.KS": "KODEX 미국나스닥100TR",
    "381180.KS": "TIGER 미국필라델피아반도체나스닥",
    # 채권
    "152380.KS": "KODEX 국고채10년",
    "305080.KS": "TIGER 미국채10년선물",
    "114260.KS": "KODEX 국고채3년",
    # 대안자산
    "132030.KS": "KODEX 골드선물(H)",
    "329200.KS": "TIGER 리츠부동산인프라",
    "139660.KS": "TIGER 미국나스닥100",
}

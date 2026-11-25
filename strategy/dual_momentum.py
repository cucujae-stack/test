"""듀얼 모멘텀 전략.

규칙:
1. 절대 모멘텀: 12개월(약 252거래일) 수익률 > 0
2. 트렌드 필터: 현재가 >= 200일 이동평균
3. 상대 모멘텀: 위 두 조건을 통과한 ETF 중 12M 수익률 상위 TOP_N 매수
4. 보유 중이던 종목이 TOP_N에서 빠지면 매도
"""
from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

LOOKBACK_DAYS = 252
MA_DAYS = 200
TOP_N = 3


@dataclass
class Signal:
    ticker: str
    name: str
    action: str  # BUY / SELL / HOLD
    momentum_12m: float
    price: float
    ma200: float
    reason: str
    description: str = ""


def select_top(
    closes: pd.DataFrame, top_n: int = TOP_N
) -> tuple[pd.Series, pd.Series, pd.Series, pd.Series]:
    """closes 의 마지막 행 기준으로 듀얼 모멘텀 상위 종목을 고른다.

    실시간 시그널(compute_signals)과 백테스트(backtest.py)가 같은 규칙을 쓰도록
    선정 로직을 여기 한 곳에만 둔다.

    Returns: (top 12M 수익률 내림차순, 전체 momentum, 마지막 종가, 200일선)
    """
    last = closes.iloc[-1]
    past = closes.iloc[-LOOKBACK_DAYS - 1]
    ma200 = closes.rolling(MA_DAYS).mean().iloc[-1]

    momentum = (last / past - 1.0).dropna()

    qualified = momentum[
        (momentum > 0) & (last.reindex(momentum.index) >= ma200.reindex(momentum.index))
    ]
    top = qualified.sort_values(ascending=False).head(top_n)
    return top, momentum, last, ma200


def compute_signals(
    closes: pd.DataFrame,
    name_map: dict[str, str],
    current_holdings: list[str] | None = None,
    description_map: dict[str, str] | None = None,
) -> list[Signal]:
    current_holdings = current_holdings or []
    description_map = description_map or {}

    if len(closes) < LOOKBACK_DAYS + 1:
        raise ValueError(
            f"가격 데이터가 부족합니다. 필요 {LOOKBACK_DAYS + 1}일, 현재 {len(closes)}일"
        )

    top, momentum, last, ma200 = select_top(closes)
    top_set = set(top.index)

    signals: list[Signal] = []
    holdings_set = set(current_holdings)

    for ticker in top_set:
        action = "HOLD" if ticker in holdings_set else "BUY"
        reason = f"12M 수익률 상위 {TOP_N} & 200일선 위"
        signals.append(
            Signal(
                ticker=ticker,
                name=name_map.get(ticker, ticker),
                action=action,
                momentum_12m=float(momentum[ticker]),
                price=float(last[ticker]),
                ma200=float(ma200[ticker]),
                reason=reason,
                description=description_map.get(ticker, ""),
            )
        )

    for ticker in holdings_set - top_set:
        if ticker not in last.index:
            continue
        mom = float(momentum.get(ticker, 0.0))
        ma = float(ma200.get(ticker, 0.0))
        if mom <= 0:
            reason = "절대 모멘텀 음(-) — 추세 종료"
        elif last[ticker] < ma:
            reason = "200일선 이탈"
        else:
            reason = "상대 모멘텀 순위 밖으로 밀림"
        signals.append(
            Signal(
                ticker=ticker,
                name=name_map.get(ticker, ticker),
                action="SELL",
                momentum_12m=mom,
                price=float(last[ticker]),
                ma200=ma,
                reason=reason,
                description=description_map.get(ticker, ""),
            )
        )

    signals.sort(key=lambda s: (s.action != "BUY", -s.momentum_12m))
    return signals

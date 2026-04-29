"""yfinance 기반 ETF 가격 데이터 수집.

pykrx 대신 yfinance 사용 — GitHub Actions(해외 IP)에서도 안정적으로 동작.
한국 ETF는 Yahoo Finance에서 티커 + ".KS" 형식으로 지원됨.
"""
from __future__ import annotations

from datetime import datetime, timedelta

import pandas as pd
import yfinance as yf


def fetch_close_panel(tickers: list[str], lookback_days: int = 400) -> pd.DataFrame:
    """티커별 종가를 컬럼으로 묶은 DataFrame 반환."""
    end = datetime.now()
    start = end - timedelta(days=lookback_days)

    raw = yf.download(
        tickers,
        start=start.strftime("%Y-%m-%d"),
        end=end.strftime("%Y-%m-%d"),
        auto_adjust=True,
        progress=False,
    )

    if isinstance(raw.columns, pd.MultiIndex):
        closes = raw["Close"]
    else:
        closes = raw[["Close"]].rename(columns={"Close": tickers[0]})

    closes = closes.sort_index().ffill().dropna(how="all")
    return closes

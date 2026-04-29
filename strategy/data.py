"""pykrx 기반 ETF 가격 데이터 수집."""
from __future__ import annotations

from datetime import datetime, timedelta

import pandas as pd
from pykrx import stock


def fetch_ohlcv(ticker: str, lookback_days: int = 400) -> pd.DataFrame:
    end = datetime.now()
    start = end - timedelta(days=lookback_days)
    df = stock.get_etf_ohlcv_by_date(
        start.strftime("%Y%m%d"),
        end.strftime("%Y%m%d"),
        ticker,
    )
    df.index = pd.to_datetime(df.index)
    return df


def fetch_close_panel(tickers: list[str], lookback_days: int = 400) -> pd.DataFrame:
    """티커별 종가를 컬럼으로 묶은 DataFrame 반환."""
    frames: dict[str, pd.Series] = {}
    for t in tickers:
        df = fetch_ohlcv(t, lookback_days)
        if df.empty:
            continue
        frames[t] = df["종가"]
    return pd.DataFrame(frames).sort_index().ffill()

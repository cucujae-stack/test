"""Google Sheets CSV 공개 URL로 보유종목과 설정을 읽어옴.

시트 구조:
  "보유종목" 탭: A=티커(.KS), B=종목명, C=매수일(YYYY-MM-DD), D=매수가, E=수량
  "설정"   탭: A=항목명, B=값  (예: 총원금 / 5000000)
"""
from __future__ import annotations

import os
from dataclasses import dataclass

import pandas as pd


@dataclass
class Holding:
    ticker: str
    name: str
    buy_date: str
    buy_price: float
    qty: float


def load_holdings(url: str) -> list[Holding]:
    df = pd.read_csv(url, header=0)
    df = df.dropna(axis=1, how="all")   # 완전히 빈 열 제거
    df = df.dropna(axis=0, how="all")   # 완전히 빈 행 제거
    if df.shape[1] < 5:
        return []
    df.columns = ["ticker", "name", "buy_date", "buy_price", "qty"] + list(df.columns[5:])
    holdings: list[Holding] = []
    for _, row in df.iterrows():
        ticker = str(row["ticker"]).strip()
        if not ticker or ticker.lower() == "nan":
            continue
        try:
            holdings.append(
                Holding(
                    ticker=ticker,
                    name=str(row["name"]).strip(),
                    buy_date=str(row["buy_date"]).strip(),
                    buy_price=_clean_number(str(row["buy_price"])),
                    qty=_clean_number(str(row["qty"])),
                )
            )
        except (ValueError, KeyError):
            continue
    return holdings


def _clean_number(val: str) -> float:
    return float(str(val).replace(",", "").replace("₩", "").replace("\\", "").strip())


def load_principal(url: str) -> float | None:
    try:
        df = pd.read_csv(url, header=None)
        for _, row in df.iterrows():
            # 어느 열에 "원금"이 있든 찾아서 그 다음 열 값을 반환
            for i, val in enumerate(row):
                if "원금" in str(val) and i + 1 < len(row):
                    return _clean_number(str(row.iloc[i + 1]))
    except Exception:
        pass
    return None

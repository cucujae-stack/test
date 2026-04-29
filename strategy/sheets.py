"""Google Sheets에서 보유종목과 설정을 읽어옴.

시트 구조:
  "보유종목" 탭: A=티커(.KS), B=종목명, C=매수일(YYYY-MM-DD), D=매수가, E=수량
  "설정"   탭: A1="총원금", B1=금액(숫자)
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass

import gspread
from google.oauth2.service_account import Credentials


@dataclass
class Holding:
    ticker: str
    name: str
    buy_date: str
    buy_price: float
    qty: float


def _client() -> gspread.Client:
    creds_json = os.environ["GOOGLE_CREDENTIALS"]
    info = json.loads(creds_json)
    scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    creds = Credentials.from_service_account_info(info, scopes=scopes)
    return gspread.authorize(creds)


def load_holdings(sheet_id: str) -> list[Holding]:
    gc = _client()
    ws = gc.open_by_key(sheet_id).worksheet("보유종목")
    rows = ws.get_all_values()
    holdings: list[Holding] = []
    for row in rows[1:]:  # 헤더 건너뜀
        if len(row) < 5 or not row[0].strip():
            continue
        ticker, name, buy_date, buy_price, qty = row[:5]
        try:
            holdings.append(
                Holding(
                    ticker=ticker.strip(),
                    name=name.strip(),
                    buy_date=buy_date.strip(),
                    buy_price=float(buy_price.replace(",", "")),
                    qty=float(qty.replace(",", "")),
                )
            )
        except ValueError:
            continue
    return holdings


def load_principal(sheet_id: str) -> float | None:
    """총 원금 반환. 시트에 없으면 None."""
    gc = _client()
    try:
        ws = gc.open_by_key(sheet_id).worksheet("설정")
        rows = ws.get_all_values()
        for row in rows:
            if len(row) >= 2 and "원금" in row[0]:
                return float(row[1].replace(",", ""))
    except Exception:
        pass
    return None

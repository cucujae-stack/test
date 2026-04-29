"""엔트리: 데이터 → 시그널 → 메일 → 시트."""
from __future__ import annotations

import json
import os
import sys
import urllib.request
from datetime import datetime

from .data import fetch_close_panel
from .dual_momentum import TOP_N, Signal, compute_signals
from .notify import render_html, send_email
from .universe import ETF_UNIVERSE


def _env(name: str, required: bool = True, default: str | None = None) -> str:
    val = os.environ.get(name, default)
    if required and not val:
        raise RuntimeError(f"환경변수 {name} 가 설정되지 않았습니다.")
    return val or ""


def push_signals_to_sheet(
    url: str,
    run_date: str,
    signals: list[Signal],
    portfolio_rows: list[dict],
    principal: float | None,
) -> None:
    payload = {
        "run_date": run_date,
        "signals": [
            {
                "action": s.action,
                "ticker": s.ticker,
                "name": s.name,
                "momentum_12m": s.momentum_12m,
                "price": s.price,
                "reason": s.reason,
            }
            for s in signals
        ],
        "portfolio": portfolio_rows,
        "principal": principal,
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = resp.read().decode("utf-8")
        print(f"  Apps Script 응답: {body}")


def main() -> int:
    universe_tickers = list(ETF_UNIVERSE.keys())

    # 보유종목 먼저 로드 (가격 수집에 포함시키기 위해)
    sheet_holdings = []
    principal = None
    holdings_url = os.environ.get("SHEET_HOLDINGS_URL", "")
    settings_url = os.environ.get("SHEET_SETTINGS_URL", "")

    if holdings_url:
        print("[1/5] Google Sheet에서 보유종목 로드...")
        from .sheets import load_holdings, load_principal
        sheet_holdings = load_holdings(holdings_url)
        if settings_url:
            principal = load_principal(settings_url)
        print(
            f"  - 보유종목 {len(sheet_holdings)}개"
            + (f", 총원금 {principal:,.0f}원" if principal else "")
        )
    else:
        print("[1/5] 보유종목: 환경변수 HOLDINGS 사용")

    holding_tickers = [h.ticker for h in sheet_holdings] or [
        t.strip() for t in os.environ.get("HOLDINGS", "").split(",") if t.strip()
    ]

    # 유니버스 + 보유종목 모두 가격 수집
    all_tickers = list(dict.fromkeys(universe_tickers + holding_tickers))
    print(f"[2/5] {len(all_tickers)}개 ETF 가격 수집 중...")
    closes = fetch_close_panel(all_tickers, lookback_days=400)
    print(f"  - 수집 완료: {closes.shape[0]} 거래일 × {closes.shape[1]} 종목")

    print("[3/5] 듀얼 모멘텀 시그널 산출...")
    signals = compute_signals(closes, ETF_UNIVERSE, current_holdings=holding_tickers)
    for s in signals:
        print(f"  {s.action:4s} {s.ticker} {s.name} 12M={s.momentum_12m * 100:+.2f}%")
    if not signals:
        print("  추천 종목 없음 — 현금 유지 권장")

    run_date = datetime.now().strftime("%Y-%m-%d")

    # 보유종목 평가손익 계산
    portfolio_rows = []
    if sheet_holdings:
        last_prices = closes.iloc[-1]
        for h in sheet_holdings:
            cur = float(last_prices.get(h.ticker, 0))
            if cur == 0:
                continue
            eval_amt = cur * h.qty
            buy_amt = h.buy_price * h.qty
            pnl = eval_amt - buy_amt
            pnl_pct = pnl / buy_amt * 100 if buy_amt else 0
            portfolio_rows.append({
                "ticker": h.ticker,
                "name": h.name,
                "buy_date": h.buy_date,
                "buy_price": h.buy_price,
                "qty": h.qty,
                "cur_price": cur,
                "eval_amt": eval_amt,
                "pnl": pnl,
                "pnl_pct": pnl_pct,
            })

    # 구글 시트 "추천" 탭 업데이트 (Apps Script 웹훅)
    apps_script_url = os.environ.get("APPS_SCRIPT_URL", "")
    if apps_script_url:
        print("[4/5] 구글 시트 추천 탭 업데이트...")
        try:
            push_signals_to_sheet(apps_script_url, run_date, signals, portfolio_rows, principal)
        except Exception as exc:
            print(f"  ⚠️ Apps Script 호출 실패: {exc}")

    print("[5/5] 메일 발송...")

    html = render_html(
        signals,
        run_date=run_date,
        top_n=TOP_N,
        portfolio_rows=portfolio_rows,
        principal=principal,
    )

    if os.environ.get("DRY_RUN", "0") == "1":
        print("  DRY_RUN=1 — 메일 발송 생략")
        print(html)
        return 0

    send_email(
        smtp_host=_env("SMTP_HOST", default="smtp.gmail.com"),
        smtp_port=int(_env("SMTP_PORT", default="587")),
        smtp_user=_env("SMTP_USER"),
        smtp_password=_env("SMTP_PASSWORD"),
        sender=_env("MAIL_FROM"),
        recipients=[r.strip() for r in _env("MAIL_TO").split(",") if r.strip()],
        subject=f"[ETF 추천] {run_date} 듀얼 모멘텀 시그널",
        html_body=html,
    )
    print("  메일 발송 완료")
    return 0


if __name__ == "__main__":
    sys.exit(main())

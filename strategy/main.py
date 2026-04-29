"""엔트리: 데이터 → 시그널 → 메일."""
from __future__ import annotations

import os
import sys
from datetime import datetime

from .data import fetch_close_panel
from .dual_momentum import TOP_N, compute_signals
from .notify import render_html, send_email
from .universe import ETF_UNIVERSE


def _env(name: str, required: bool = True, default: str | None = None) -> str:
    val = os.environ.get(name, default)
    if required and not val:
        raise RuntimeError(f"환경변수 {name} 가 설정되지 않았습니다.")
    return val or ""


def main() -> int:
    holdings = [t.strip() for t in os.environ.get("HOLDINGS", "").split(",") if t.strip()]
    tickers = list(ETF_UNIVERSE.keys())

    print(f"[1/3] {len(tickers)}개 ETF 가격 수집 중...")
    closes = fetch_close_panel(tickers, lookback_days=400)
    print(f"  - 수집 완료: {closes.shape[0]} 거래일 × {closes.shape[1]} 종목")

    print("[2/3] 듀얼 모멘텀 시그널 산출...")
    signals = compute_signals(closes, ETF_UNIVERSE, current_holdings=holdings)
    for s in signals:
        print(f"  {s.action:4s} {s.ticker} {s.name} 12M={s.momentum_12m * 100:+.2f}%")

    if not signals:
        print("  추천 종목 없음 — 모든 후보가 절대 모멘텀/추세 필터 탈락. 현금 유지 권장.")

    print("[3/3] 메일 발송...")
    run_date = datetime.now().strftime("%Y-%m-%d")
    html = render_html(signals, run_date=run_date, top_n=TOP_N)

    if os.environ.get("DRY_RUN") == "1":
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

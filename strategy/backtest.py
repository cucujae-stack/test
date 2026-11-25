"""듀얼 모멘텀 전략 백테스트.

실시간 시그널과 똑같은 선정 규칙(dual_momentum.select_top)을 과거의 매 리밸런싱
시점에 적용해서, 그 전략을 그대로 따랐다면 어땠을지 시뮬레이션한다.

가정:
- 매주 첫 거래일 종가에 시그널을 산출하고 같은 종가로 체결 (실제 봇은 월요일 장 마감 후 실행)
- 선정 종목에 1/TOP_N 씩 동일 비중, 채우지 못한 슬롯은 현금(수익률 0)
- 리밸런싱 사이에는 비중이 가격에 따라 자연스럽게 변함 (drift)
- 거래비용: 회전율 × cost_bps (매수+매도 양방향 합계 기준)
- 세금·환율 효과 미반영. 유니버스는 "현재" 구성이므로 생존 편향 존재

사용법:
    python -m strategy.backtest --start 2010-01-01 --out backtest.html
"""
from __future__ import annotations

import argparse
import html
import math
import sys
from dataclasses import dataclass, field

import pandas as pd

from .dual_momentum import LOOKBACK_DAYS, TOP_N, select_top

TRADING_DAYS = 252


@dataclass
class Rebalance:
    date: pd.Timestamp
    holdings: list[str]
    buys: list[str]
    sells: list[str]
    turnover: float


@dataclass
class BacktestResult:
    equity: pd.Series  # 1.0 에서 시작하는 누적 가치
    weights: pd.DataFrame  # 리밸런싱 직후 목표 비중
    rebalances: list[Rebalance] = field(default_factory=list)


@dataclass
class Metrics:
    total_return: float
    cagr: float
    volatility: float
    sharpe: float
    max_drawdown: float
    years: float


def rebalance_dates(index: pd.DatetimeIndex, freq: str = "W") -> list[pd.Timestamp]:
    """각 주(W)/월(M)의 첫 거래일."""
    s = pd.Series(index, index=index)
    key = index.to_period(freq)
    return list(s.groupby(key).first())


def run_backtest(
    closes: pd.DataFrame,
    top_n: int = TOP_N,
    freq: str = "W",
    cost_bps: float = 10.0,
) -> BacktestResult:
    closes = closes.sort_index()
    if len(closes) <= LOOKBACK_DAYS + 1:
        raise ValueError("백테스트하기에 가격 데이터가 부족합니다.")

    rets = closes.pct_change(fill_method=None).fillna(0.0)
    start_idx = LOOKBACK_DAYS + 1
    dates = closes.index
    rebal_set = set(rebalance_dates(dates[start_idx:], freq))
    cost = cost_bps / 10_000

    value = 1.0
    w = pd.Series(0.0, index=closes.columns)  # 현재(drift 반영) 비중, 나머지는 현금
    equity: dict[pd.Timestamp, float] = {}
    weight_log: dict[pd.Timestamp, pd.Series] = {}
    rebalances: list[Rebalance] = []

    for i in range(start_idx, len(dates)):
        d = dates[i]
        # 1) 당일 수익 반영 (전일 종가 기준 비중)
        r = rets.iloc[i]
        port_ret = float((w * r).sum())
        value *= 1.0 + port_ret
        if value > 0:
            grown = w * (1.0 + r)
            w = grown / (1.0 + port_ret)

        # 2) 리밸런싱: 오늘까지의 데이터만 사용 (look-ahead 없음)
        if d in rebal_set:
            top, *_ = select_top(closes.iloc[: i + 1], top_n=top_n)
            target = pd.Series(0.0, index=closes.columns)
            target[list(top.index)] = 1.0 / top_n
            turnover = float((target - w).abs().sum())
            value *= 1.0 - turnover * cost
            prev = set(w[w > 1e-9].index)
            new = list(top.index)
            if turnover > 1e-9 or not rebalances:
                rebalances.append(
                    Rebalance(
                        date=d,
                        holdings=new,
                        buys=[t for t in new if t not in prev],
                        sells=sorted(prev - set(new)),
                        turnover=turnover,
                    )
                )
            w = target
            weight_log[d] = target

        equity[d] = value

    return BacktestResult(
        equity=pd.Series(equity, name="strategy"),
        weights=pd.DataFrame(weight_log).T,
        rebalances=rebalances,
    )


def compute_metrics(equity: pd.Series) -> Metrics:
    equity = equity.dropna()
    daily = equity.pct_change().dropna()
    years = (equity.index[-1] - equity.index[0]).days / 365.25
    total = float(equity.iloc[-1] / equity.iloc[0] - 1)
    cagr = (1 + total) ** (1 / years) - 1 if years > 0 and total > -1 else float("nan")
    vol = float(daily.std() * math.sqrt(TRADING_DAYS))
    sharpe = float(daily.mean() / daily.std() * math.sqrt(TRADING_DAYS)) if daily.std() > 0 else 0.0
    dd = equity / equity.cummax() - 1
    return Metrics(total, cagr, vol, sharpe, float(dd.min()), years)


def buy_and_hold(closes: pd.DataFrame, ticker: str, start: pd.Timestamp) -> pd.Series:
    s = closes[ticker].loc[start:].dropna()
    return (s / s.iloc[0]).rename(ticker)


# ---------------------------------------------------------------- HTML 리포트

_COLORS = ["#2563eb", "#9ca3af", "#f59e0b"]


def _svg_lines(series: dict[str, pd.Series], height: int = 280, log: bool = True,
               pct_axis: bool = False) -> str:
    W, H, L, R, T, B = 900, height, 56, 12, 12, 28
    idx = sorted(set().union(*[s.index for s in series.values()]))
    x0, x1 = idx[0].value, idx[-1].value
    tf = (lambda v: math.log(v)) if log else (lambda v: v)
    vals = [tf(v) for s in series.values() for v in s.dropna() if (v > 0 or not log)]
    lo, hi = min(vals), max(vals)
    if hi == lo:
        hi = lo + 1
    sx = lambda t: L + (t.value - x0) / (x1 - x0 or 1) * (W - L - R)
    sy = lambda v: T + (hi - tf(v)) / (hi - lo) * (H - T - B)

    parts = [f'<svg viewBox="0 0 {W} {H}" width="100%" role="img">']
    # y 눈금
    for k in range(5):
        v_t = lo + (hi - lo) * k / 4
        v = math.exp(v_t) if log else v_t
        y = sy(v)
        label = f"{v * 100:.0f}%" if pct_axis else f"{v:.2f}x"
        parts.append(f'<line x1="{L}" x2="{W - R}" y1="{y:.1f}" y2="{y:.1f}" class="grid"/>'
                     f'<text x="{L - 6}" y="{y + 4:.1f}" text-anchor="end">{label}</text>')
    # x 눈금 (연도)
    years = sorted({t.year for t in idx})
    step = max(1, len(years) // 8)
    for yr in years[::step]:
        t = pd.Timestamp(f"{yr}-01-01")
        if t.value < x0:
            continue
        x = sx(t)
        parts.append(f'<text x="{x:.1f}" y="{H - 8}" text-anchor="middle">{yr}</text>')
    for (name, s), c in zip(series.items(), _COLORS):
        s = s.dropna()
        s = s[::max(1, len(s) // 1500)]
        pts = " ".join(f"{sx(t):.1f},{sy(v):.1f}" for t, v in s.items())
        parts.append(f'<polyline fill="none" stroke="{c}" stroke-width="1.8" points="{pts}"/>')
    parts.append("</svg>")
    legend = "".join(
        f'<span class="lg"><i style="background:{c}"></i>{html.escape(n)}</span>'
        for n, c in zip(series, _COLORS)
    )
    return f'<div class="legend">{legend}</div>' + "".join(parts)


def _pct(v: float) -> str:
    return "–" if v is None or (isinstance(v, float) and math.isnan(v)) else f"{v * 100:+.1f}%"


def render_report(
    result: BacktestResult,
    benchmarks: dict[str, pd.Series],
    name_map: dict[str, str],
    params: dict[str, str],
) -> str:
    curves = {"듀얼 모멘텀": result.equity, **benchmarks}
    metrics = {n: compute_metrics(s) for n, s in curves.items()}

    rows = "".join(
        f"<tr><td>{html.escape(n)}</td><td>{_pct(m.total_return)}</td><td>{_pct(m.cagr)}</td>"
        f"<td>{m.volatility * 100:.1f}%</td><td>{m.sharpe:.2f}</td>"
        f"<td class='neg'>{m.max_drawdown * 100:.1f}%</td></tr>"
        for n, m in metrics.items()
    )

    yearly = {n: s.resample("YE").last().pct_change() for n, s in curves.items()}
    for n, s in curves.items():  # 첫 해는 시작값 대비
        first_year_end = s.resample("YE").last().iloc[0]
        yearly[n].iloc[0] = first_year_end / s.iloc[0] - 1
    ydf = pd.DataFrame(yearly)
    yrows = "".join(
        f"<tr><td>{d.year}</td>" + "".join(
            f"<td class='{'neg' if v < 0 else 'pos'}'>{_pct(v)}</td>" for v in r
        ) + "</tr>"
        for d, r in ydf.iterrows()
    )
    yhead = "".join(f"<th>{html.escape(n)}</th>" for n in ydf.columns)

    dd = {n: s / s.cummax() for n, s in curves.items()}

    nm = lambda t: html.escape(name_map.get(t, t))
    trades = "".join(
        f"<tr><td>{rb.date:%Y-%m-%d}</td><td>{', '.join(nm(t) for t in rb.holdings) or '<em>현금</em>'}</td>"
        f"<td class='pos'>{', '.join(nm(t) for t in rb.buys)}</td>"
        f"<td class='neg'>{', '.join(nm(t) for t in rb.sells)}</td></tr>"
        for rb in reversed(result.rebalances[-40:])
    )

    w = result.weights
    cash_share = float((w.sum(axis=1) < 1e-9).mean()) if len(w) else 0.0
    held = (w > 0).sum().sort_values(ascending=False)
    held = held[held > 0] / len(w)
    hold_rows = "".join(
        f"<tr><td>{nm(t)}</td><td>{v * 100:.0f}%</td>"
        f"<td><div class='bar' style='width:{v * 100:.0f}%'></div></td></tr>"
        for t, v in held.items()
    )
    param_txt = " · ".join(f"{k}: {html.escape(str(v))}" for k, v in params.items())

    return f"""<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>듀얼 모멘텀 백테스트</title><style>
body{{font:14px/1.5 -apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;margin:0;
background:#f8fafc;color:#0f172a}}main{{max-width:960px;margin:auto;padding:24px 16px}}
h1{{font-size:22px;margin:0 0 4px}}h2{{font-size:16px;margin:28px 0 8px}}
.sub{{color:#64748b;font-size:12px}}.card{{background:#fff;border:1px solid #e2e8f0;border-radius:10px;
padding:14px;overflow-x:auto}}table{{border-collapse:collapse;width:100%}}
td,th{{padding:6px 8px;border-bottom:1px solid #f1f5f9;text-align:right;white-space:nowrap}}
td:first-child,th:first-child{{text-align:left}}.pos{{color:#16a34a}}.neg{{color:#dc2626}}
svg text{{font-size:11px;fill:#64748b}}svg .grid{{stroke:#eef2f7}}
.legend{{display:flex;gap:14px;font-size:12px;margin-bottom:4px}}
.lg i{{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px}}
.bar{{height:8px;background:#2563eb;border-radius:4px}}.note{{color:#64748b;font-size:12px}}
</style></head><body><main>
<h1>듀얼 모멘텀 백테스트</h1>
<div class="sub">{param_txt}</div>
<h2>누적 수익 (로그 스케일)</h2><div class="card">{_svg_lines(curves)}</div>
<h2>성과 요약</h2><div class="card"><table>
<tr><th></th><th>총수익</th><th>CAGR</th><th>변동성</th><th>샤프</th><th>MDD</th></tr>{rows}</table></div>
<h2>낙폭 (Drawdown)</h2><div class="card">{_svg_lines(dd, height=200, log=False, pct_axis=True)}</div>
<h2>연도별 수익률</h2><div class="card"><table><tr><th>연도</th>{yhead}</tr>{yrows}</table></div>
<h2>종목별 보유 기간 비중</h2><div class="card"><table>{hold_rows}
<tr><td><em>전액 현금</em></td><td>{cash_share * 100:.0f}%</td><td></td></tr></table></div>
<h2>최근 리밸런싱 (최대 40건)</h2><div class="card"><table>
<tr><th>날짜</th><th>보유</th><th>매수</th><th>매도</th></tr>{trades}</table></div>
<p class="note">매주 첫 거래일 종가 체결 가정 · 동일 비중 · 빈 슬롯은 현금 · 세금/환율 미반영.
유니버스가 현재 기준 구성이라 생존 편향이 있고, 상장이 늦은 ETF는 상장 후 252거래일이 지나야 후보가 됩니다.
과거 성과가 미래 수익을 보장하지 않습니다.</p>
</main></body></html>"""


def main(argv: list[str] | None = None) -> int:
    from .data import fetch_close_panel
    from .universe import ETF_UNIVERSE

    ap = argparse.ArgumentParser(description="듀얼 모멘텀 백테스트")
    ap.add_argument("--start", default="2010-01-01", help="가격 수집 시작일 (첫 1년은 워밍업)")
    ap.add_argument("--top-n", type=int, default=TOP_N)
    ap.add_argument("--freq", default="W", choices=["W", "M"], help="리밸런싱 주기")
    ap.add_argument("--cost-bps", type=float, default=10.0, help="회전율 1당 거래비용 (bp)")
    ap.add_argument("--benchmark", default="069500.KS")
    ap.add_argument("--out", default="backtest.html")
    args = ap.parse_args(argv)

    tickers = list(ETF_UNIVERSE)
    days = (pd.Timestamp.now() - pd.Timestamp(args.start)).days
    print(f"[1/3] {len(tickers)}개 ETF 가격 수집 ({args.start}~)...")
    closes = fetch_close_panel(tickers, lookback_days=days)
    print(f"  - {closes.shape[0]} 거래일 × {closes.shape[1]} 종목")

    print("[2/3] 백테스트 실행...")
    res = run_backtest(closes, top_n=args.top_n, freq=args.freq, cost_bps=args.cost_bps)
    start = res.equity.index[0]
    bench = {f"{ETF_UNIVERSE.get(args.benchmark, args.benchmark)} 보유":
             buy_and_hold(closes, args.benchmark, start)}

    for n, s in {"듀얼 모멘텀": res.equity, **bench}.items():
        m = compute_metrics(s)
        print(f"  {n:20s} CAGR {_pct(m.cagr):>7}  MDD {m.max_drawdown * 100:6.1f}%  샤프 {m.sharpe:.2f}")

    print(f"[3/3] 리포트 저장: {args.out}")
    params = {
        "기간": f"{start:%Y-%m-%d} ~ {res.equity.index[-1]:%Y-%m-%d}",
        "TOP_N": args.top_n,
        "리밸런싱": "매주" if args.freq == "W" else "매월",
        "거래비용": f"{args.cost_bps:g}bp",
    }
    with open(args.out, "w", encoding="utf-8") as f:
        f.write(render_report(res, bench, ETF_UNIVERSE, params))
    return 0


if __name__ == "__main__":
    sys.exit(main())

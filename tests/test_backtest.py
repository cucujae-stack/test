"""합성 가격으로 정답을 아는 상황에서 백테스트 엔진을 검증."""
import numpy as np
import pandas as pd
import pytest

from strategy.backtest import compute_metrics, render_report, run_backtest
from strategy.dual_momentum import compute_signals, select_top

N = 800
IDX = pd.bdate_range("2018-01-01", periods=N)


def geometric(daily: float) -> np.ndarray:
    return 100 * (1 + daily) ** np.arange(N)


def test_all_falling_stays_in_cash():
    closes = pd.DataFrame({"A": geometric(-0.001), "B": geometric(-0.0005)}, index=IDX)
    res = run_backtest(closes, top_n=2)
    assert res.equity.iloc[-1] == pytest.approx(1.0)
    assert all(not rb.holdings for rb in res.rebalances)


def test_single_winner_tracks_asset_minus_cost():
    closes = pd.DataFrame({"UP": geometric(0.001), "DOWN": geometric(-0.001)}, index=IDX)
    res = run_backtest(closes, top_n=1, cost_bps=10)
    start = res.equity.index[0]
    # 첫날 종가에 매수 → 이후 자산 수익률 그대로, 진입 비용 10bp 1회
    expected = closes["UP"].iloc[-1] / closes["UP"].loc[start] * (1 - 0.001)
    assert res.equity.iloc[-1] == pytest.approx(expected, rel=1e-9)
    assert len(res.rebalances) == 1  # 이후 회전 없음


def test_empty_slots_are_cash():
    closes = pd.DataFrame({"UP": geometric(0.001), "DOWN": geometric(-0.001)}, index=IDX)
    res = run_backtest(closes, top_n=2, cost_bps=0)
    # 슬롯 2개 중 1개만 채움 → 매 리밸런싱마다 UP 50% / 현금 50% 로 리셋.
    # 구간별로 독립 계산한 기대값과 정확히 일치해야 한다.
    up = closes["UP"]
    dates = [rb.date for rb in res.rebalances] + [IDX[-1]]
    expected = 1.0
    for a, b in zip(dates, dates[1:]):
        expected *= 1 + 0.5 * (up[b] / up[a] - 1)
    assert all(rb.holdings == ["UP"] for rb in res.rebalances)
    assert res.equity.iloc[-1] == pytest.approx(expected, rel=1e-9)


def test_no_lookahead():
    rng = np.random.default_rng(0)
    base = pd.DataFrame(
        100 * np.exp(np.cumsum(rng.normal(0.0004, 0.01, (N, 4)), axis=0)),
        index=IDX, columns=list("ABCD"),
    )
    cut = IDX[600]
    tampered = base.copy()
    tampered.loc[cut:, "A"] *= 3  # 미래 가격 조작
    a = run_backtest(base).equity
    b = run_backtest(tampered).equity
    before = a.index < cut
    pd.testing.assert_series_equal(a[before], b[before])


def test_backtest_uses_same_rule_as_live_signals():
    rng = np.random.default_rng(1)
    closes = pd.DataFrame(
        100 * np.exp(np.cumsum(rng.normal(0.0003, 0.01, (N, 6)), axis=0)),
        index=IDX, columns=list("ABCDEF"),
    )
    top, *_ = select_top(closes)
    live = {s.ticker for s in compute_signals(closes, {}) if s.action == "BUY"}
    assert set(top.index) == live
    last = run_backtest(closes, cost_bps=0).rebalances[-1]
    if last.date == IDX[-1]:
        assert set(last.holdings) == live


def test_metrics_known_values():
    eq = pd.Series([1.0, 1.2, 0.9, 1.08], index=pd.bdate_range("2020-01-01", periods=4))
    m = compute_metrics(eq)
    assert m.total_return == pytest.approx(0.08)
    assert m.max_drawdown == pytest.approx(-0.25)


def test_report_renders():
    closes = pd.DataFrame({"UP": geometric(0.001), "DOWN": geometric(-0.001)}, index=IDX)
    res = run_backtest(closes, top_n=1)
    html = render_report(res, {}, {"UP": "상승 ETF"}, {"기간": "test"})
    assert "<svg" in html and "상승 ETF" in html

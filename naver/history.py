"""과거 기간의 일별 인기도 시계열 조회.

데이터랩 쇼핑인사이트는 과거 날짜 범위를 일 단위(timeUnit=date)로 돌려주므로,
예: 2025-01-01 ~ 오늘 의 키워드별 데일리 인기도를 통째로 뽑을 수 있다.

주의: 이 값은 판매실적이 아니라 '상대적 검색 인기도'다. 한 카테고리 안에서
기간 전체 최대값이 100 이 되도록 정규화된 지수이며, 절대 검색량·판매량이 아니다.
"""
from __future__ import annotations

import sys
from dataclasses import dataclass
from datetime import date

from .client import NaverClient
from .config import CategoryWatch
from .rankings import DATALAB_MAX_KEYWORDS, _filter_watchlist


@dataclass(frozen=True)
class HistoryPoint:
    """하루치 인기도 한 점."""

    day: str        # YYYY-MM-DD
    category: str   # '패션잡화 · 지갑'
    keyword: str
    ratio: float    # 카테고리 내 기간 전체 최대=100 으로 정규화


def _series_of(resp: dict) -> dict[str, dict[str, float]]:
    """데이터랩 응답 → {키워드: {날짜: ratio}}."""
    out: dict[str, dict[str, float]] = {}
    for result in resp.get("results", []):
        kw = result.get("title", "")
        out[kw] = {d["period"]: float(d["ratio"]) for d in result.get("data", [])}
    return out


def _category_history(
    client: NaverClient, watch: CategoryWatch, start: str, end: str
) -> dict[str, dict[str, float]]:
    """한 카테고리의 키워드별 일별 시계열. 5개 초과 시 앵커로 배치 간 스케일 통일.

    배치마다 정규화 상수가 다르지만, 모든 배치에 공통으로 넣은 앵커 키워드의
    시계열 합으로 배치 간 배율을 맞춘다 (앵커의 진짜 시계열은 배치와 무관하게
    동일하므로, 합의 비율 = 배치 정규화 상수의 비율).
    """
    kws = watch.keywords
    if len(kws) <= DATALAB_MAX_KEYWORDS:
        resp = client.keyword_trend(watch.category_code, kws, start, end, time_unit="date")
        return _series_of(resp)

    anchor = kws[0]
    merged: dict[str, dict[str, float]] = {}
    anchor_ref_sum: float | None = None
    for i in range(1, len(kws) + 1, DATALAB_MAX_KEYWORDS - 1):
        batch = [anchor] + kws[i : i + (DATALAB_MAX_KEYWORDS - 1)]
        if len(batch) == 1:
            break
        series = _series_of(
            client.keyword_trend(watch.category_code, batch, start, end, time_unit="date")
        )
        a_sum = sum(series.get(anchor, {}).values()) or 1.0
        if anchor_ref_sum is None:
            anchor_ref_sum = a_sum
            merged.update(series)
        else:
            scale = anchor_ref_sum / a_sum  # 이 배치를 기준 배치 스케일로 환산
            for kw, s in series.items():
                if kw == anchor:
                    continue
                merged[kw] = {d: r * scale for d, r in s.items()}

    # 카테고리 내 최대값을 100 으로 재정규화
    top = max((r for s in merged.values() for r in s.values()), default=0.0) or 1.0
    return {kw: {d: r / top * 100.0 for d, r in s.items()} for kw, s in merged.items()}


def fetch_history(
    client: NaverClient,
    start: date,
    end: date,
    *,
    category: str | None = None,
) -> list[HistoryPoint]:
    """워치리스트 전체(또는 category 필터)의 일별 인기도 시계열."""
    if start > end:
        raise ValueError(f"시작일({start})이 종료일({end})보다 늦음")
    s, e = start.isoformat(), end.isoformat()

    points: list[HistoryPoint] = []
    for watch in _filter_watchlist(category):
        print(f"  [데이터랩·기간] '{watch.name}' {s}~{e} 조회 중...", file=sys.stderr, flush=True)
        series = _category_history(client, watch, s, e)
        for kw in watch.keywords:  # config 순서 유지
            for day, ratio in sorted(series.get(kw, {}).items()):
                points.append(HistoryPoint(day, watch.name, kw, round(ratio, 2)))
    return points


def write_history_csv(points: list[HistoryPoint], path) -> "Path":
    """날짜/카테고리/키워드/인기도 CSV (엑셀 호환 utf-8-sig)."""
    import csv
    from .report import _prepare

    p = _prepare(path)
    with p.open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["날짜", "카테고리", "키워드", "인기도"])
        for pt in points:
            w.writerow([pt.day, pt.category, pt.keyword, pt.ratio])
    return p

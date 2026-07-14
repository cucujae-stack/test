"""데이터랩 인기도 + 쇼핑 검색을 조합해 랭킹을 만든다.

네이버플러스스토어 앱의 '실시간 베스트' 그대로는 아니지만, 공식 API로
낼 수 있는 최선의 근사다:

  - 실시간 인기 키워드 랭킹 : 데이터랩 최근 기간 인기도(ratio) 순
  - 키워드별 대표 상품(행사 랭킹템) : 쇼핑 검색 최저가순 상품

주의: 데이터랩은 약 1일 지연이 있고, ratio 는 질의한 키워드 집합 안에서의
상대값(최대 100)이다. 즉 절대 판매량이 아니라 '최근 검색·소비 인기도'다.
"""
from __future__ import annotations

import sys
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone

from .client import NaverClient, Product
from .config import WATCHLIST, CategoryWatch

KST = timezone(timedelta(hours=9))


@dataclass
class KeywordRank:
    """실시간 인기 키워드 한 줄."""

    rank: int
    category: str
    keyword: str
    score: float                 # 데이터랩 최근 인기도 (0~100)
    products: list[Product] = field(default_factory=list)


# 데이터랩 키워드 API는 한 요청당 키워드 5개까지만 허용한다.
DATALAB_MAX_KEYWORDS = 5


def _last_ratios(resp: dict, keywords: list[str]) -> dict[str, float]:
    """데이터랩 응답에서 각 키워드의 '마지막 구간 ratio' 를 뽑는다."""
    scores: dict[str, float] = {}
    for result in resp.get("results", []):
        data = result.get("data", [])
        scores[result.get("title", "")] = float(data[-1]["ratio"]) if data else 0.0
    for kw in keywords:  # 응답에 빠진 키워드는 0
        scores.setdefault(kw, 0.0)
    return scores


# 기간 단위: 이름 → (데이터랩 timeUnit, 최근 기간이 온전히 잡히는 조회 범위(일))
PERIODS: dict[str, tuple[str, int]] = {
    "일간": ("date", 14),
    "주간": ("week", 60),
    "월간": ("month", 180),
}


def _recent_score(
    client: NaverClient,
    watch: CategoryWatch,
    days: int,
    time_unit: str = "date",
    as_of: date | None = None,
) -> dict[str, float]:
    """카테고리 안 키워드들의 인기도를 계산.

    as_of 를 주면 '그 날짜 기준 마지막 구간'을 본다(과거 조회). 생략하면 오늘 기준.
    데이터랩은 조회 범위 안에서 검색된 데이터만 주므로, 과거 조회 시 그 시점까지
    데이터가 존재해야 값이 잡힌다(네이버 쇼핑 서비스 시작 이후 데이터만 가능).

    time_unit(date/week/month)에 따라 마지막 구간이 일간/주간/월간이 된다.
    데이터랩은 한 요청에 키워드 5개까지만 받으므로, 5개를 넘으면 첫 키워드를
    '앵커'로 매 배치에 함께 넣어 배치 간 인기도를 비교 가능하게 정규화한다.
    (배치마다 ratio 는 그 배치 안에서의 상대값이라, 공통 앵커로 스케일을 맞춘다.)
    마지막에 카테고리 내 최댓값을 100 으로 재정규화해 0~100 값으로 돌려준다.
    """
    end_date = as_of or datetime.now(KST).date()
    start = (end_date - timedelta(days=days)).isoformat()
    end = end_date.isoformat()
    kws = watch.keywords

    if len(kws) <= DATALAB_MAX_KEYWORDS:
        resp = client.keyword_trend(watch.category_code, kws, start, end, time_unit=time_unit)
        return _last_ratios(resp, kws)

    anchor = kws[0]
    raw: dict[str, float] = {anchor: 1.0}  # 앵커 자기 자신 = 기준 1.0
    for i in range(1, len(kws), DATALAB_MAX_KEYWORDS - 1):
        batch = [anchor] + kws[i : i + (DATALAB_MAX_KEYWORDS - 1)]
        ratios = _last_ratios(
            client.keyword_trend(watch.category_code, batch, start, end, time_unit=time_unit),
            batch,
        )
        anchor_r = ratios.get(anchor, 0.0) or 1.0  # 0 방어
        for kw in batch:
            if kw != anchor:
                raw[kw] = ratios[kw] / anchor_r  # 앵커 대비 상대값
    top = max(raw.values()) or 1.0
    return {kw: v / top * 100.0 for kw, v in raw.items()}


def build_rankings(
    client: NaverClient,
    *,
    top_keywords: int = 5,
    products_per_keyword: int = 5,
    period: str = "일간",
    lookback_days: int | None = None,
    sort: str = "sim",
    category: str | None = None,
    as_of: date | None = None,
    max_workers: int = 6,
) -> list[KeywordRank]:
    """전체 워치리스트에 대해 인기 키워드 랭킹 + 대표 상품을 만든다.

    top_keywords         : 카테고리별로 상위 몇 개 키워드를 남길지
    products_per_keyword : 키워드당 대표 상품 개수
    period               : 인기도 기준 기간 (일간/주간/월간)
    lookback_days        : 데이터랩 조회 범위(일). None 이면 period 기본값 사용
    sort                 : 쇼핑 검색 정렬 (asc=최저가, sim=정확도)
    category             : 대분류 이름 일부(예: '패션잡화')로 필터. None 이면 전체
    as_of                : 이 날짜 기준으로 과거 인기도 조회. None 이면 오늘.
                            상품은 과거 시점 재현이 불가해 항상 '현재' 상품이 붙는다.
    max_workers          : 카테고리 병렬 조회 동시 수
    """
    if period not in PERIODS:
        raise ValueError(f"period 는 {list(PERIODS)} 중 하나여야 함 (받음: {period})")
    time_unit, default_days = PERIODS[period]
    days = lookback_days if lookback_days is not None else default_days

    watchlist = _filter_watchlist(category)

    def work(watch: CategoryWatch) -> list[KeywordRank]:
        print(f"  [데이터랩·{period}] '{watch.name}' 인기도 조회 중...", file=sys.stderr, flush=True)
        scores = _recent_score(client, watch, days, time_unit=time_unit, as_of=as_of)
        top = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)[:top_keywords]
        rows: list[KeywordRank] = []
        for i, (keyword, score) in enumerate(top, start=1):
            print(f"  [검색] '{keyword}' 상품 조회 중...", file=sys.stderr, flush=True)
            products = client.search_products(keyword, display=products_per_keyword, sort=sort)
            rows.append(KeywordRank(i, watch.name, keyword, round(score, 1), products))
        return rows

    ranked: list[KeywordRank] = []
    with ThreadPoolExecutor(max_workers=max(1, max_workers)) as ex:
        for chunk in ex.map(work, watchlist):  # map 은 입력 순서 보존
            ranked.extend(chunk)
    return ranked


def _filter_watchlist(category: str | None) -> list[CategoryWatch]:
    if not category:
        return list(WATCHLIST)
    watchlist = [w for w in WATCHLIST if category in w.name]
    if not watchlist:
        available = sorted({w.name.split(" · ")[0] for w in WATCHLIST})
        raise ValueError(f"'{category}' 에 해당하는 카테고리 없음. 사용 가능: {available}")
    return watchlist


def build_rankings_multi(
    client: NaverClient,
    periods: list[str] | None = None,
    *,
    top_keywords: int = 5,
    products_per_keyword: int = 5,
    sort: str = "sim",
    category: str | None = None,
    max_workers: int = 6,
) -> dict[str, list[KeywordRank]]:
    """여러 기간(일간/주간/월간)을 한 번에 계산해 {기간: 랭킹} 으로 돌려준다.

    상품 검색은 기간과 무관하므로 키워드당 한 번만 조회(캐시)하고, 데이터랩
    점수만 기간별로 계산해 호출 수를 아낀다. 카테고리별 조회는 병렬 처리한다.
    """
    periods = periods or list(PERIODS)
    for p in periods:
        if p not in PERIODS:
            raise ValueError(f"period 는 {list(PERIODS)} 중 하나여야 함 (받음: {p})")

    watchlist = _filter_watchlist(category)

    def work(watch: CategoryWatch) -> dict[str, list[KeywordRank]]:
        # 1) 기간별 점수 + 상위 키워드 선정
        tops_by_period: dict[str, list[tuple[str, float]]] = {}
        needed: list[str] = []
        for p in periods:
            time_unit, default_days = PERIODS[p]
            print(f"  [데이터랩·{p}] '{watch.name}' 인기도 조회 중...", file=sys.stderr, flush=True)
            scores = _recent_score(client, watch, default_days, time_unit=time_unit)
            top = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)[:top_keywords]
            tops_by_period[p] = top
            for kw, _ in top:
                if kw not in needed:
                    needed.append(kw)

        # 2) 상위 키워드 상품을 한 번씩만 조회 (기간 공통, 워치 내부 캐시)
        cache: dict[str, list[Product]] = {}
        for kw in needed:
            print(f"  [검색] '{kw}' 상품 조회 중...", file=sys.stderr, flush=True)
            cache[kw] = client.search_products(kw, display=products_per_keyword, sort=sort)

        # 3) 기간별 랭킹 조립
        out: dict[str, list[KeywordRank]] = {p: [] for p in periods}
        for p in periods:
            for i, (kw, score) in enumerate(tops_by_period[p], start=1):
                out[p].append(KeywordRank(i, watch.name, kw, round(score, 1), cache[kw]))
        return out

    result: dict[str, list[KeywordRank]] = {p: [] for p in periods}
    with ThreadPoolExecutor(max_workers=max(1, max_workers)) as ex:
        for chunk in ex.map(work, watchlist):  # map 은 입력 순서 보존
            for p in periods:
                result[p].extend(chunk[p])
    return result

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
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

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


def _recent_score(client: NaverClient, watch: CategoryWatch, days: int) -> dict[str, float]:
    """카테고리 안 키워드들의 '최근 인기도'를 계산.

    데이터랩은 한 요청에 키워드 5개까지만 받으므로, 5개를 넘으면 첫 키워드를
    '앵커'로 매 배치에 함께 넣어 배치 간 인기도를 비교 가능하게 정규화한다.
    (배치마다 ratio 는 그 배치 안에서의 상대값이라, 공통 앵커로 스케일을 맞춘다.)
    마지막에 카테고리 내 최댓값을 100 으로 재정규화해 0~100 값으로 돌려준다.
    """
    end = datetime.now(KST).date()
    start = (end - timedelta(days=days)).isoformat()
    end = end.isoformat()
    kws = watch.keywords

    if len(kws) <= DATALAB_MAX_KEYWORDS:
        resp = client.keyword_trend(watch.category_code, kws, start, end, time_unit="date")
        return _last_ratios(resp, kws)

    anchor = kws[0]
    raw: dict[str, float] = {anchor: 1.0}  # 앵커 자기 자신 = 기준 1.0
    for i in range(1, len(kws), DATALAB_MAX_KEYWORDS - 1):
        batch = [anchor] + kws[i : i + (DATALAB_MAX_KEYWORDS - 1)]
        ratios = _last_ratios(
            client.keyword_trend(watch.category_code, batch, start, end, time_unit="date"),
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
    lookback_days: int = 14,
    sort: str = "sim",
    category: str | None = None,
) -> list[KeywordRank]:
    """전체 워치리스트에 대해 인기 키워드 랭킹 + 대표 상품을 만든다.

    top_keywords         : 카테고리별로 상위 몇 개 키워드를 남길지
    products_per_keyword : 키워드당 대표 상품 개수
    sort                 : 쇼핑 검색 정렬 (asc=최저가, sim=정확도)
    category             : 대분류 이름 일부(예: '패션잡화')로 필터. None 이면 전체
    """
    watchlist = WATCHLIST
    if category:
        watchlist = [w for w in WATCHLIST if category in w.name]
        if not watchlist:
            available = sorted({w.name.split(" · ")[0] for w in WATCHLIST})
            raise ValueError(f"'{category}' 에 해당하는 카테고리 없음. 사용 가능: {available}")

    ranked: list[KeywordRank] = []
    for watch in watchlist:
        print(f"  [데이터랩] '{watch.name}' 인기도 조회 중...", file=sys.stderr, flush=True)
        scores = _recent_score(client, watch, lookback_days)
        top = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)[:top_keywords]
        for i, (keyword, score) in enumerate(top, start=1):
            print(f"  [검색] '{keyword}' 상품 조회 중...", file=sys.stderr, flush=True)
            products = client.search_products(
                keyword, display=products_per_keyword, sort=sort
            )
            ranked.append(
                KeywordRank(
                    rank=i,
                    category=watch.name,
                    keyword=keyword,
                    score=round(score, 1),
                    products=products,
                )
            )
    return ranked

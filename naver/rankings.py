"""데이터랩 인기도 + 쇼핑 검색을 조합해 랭킹을 만든다.

네이버플러스스토어 앱의 '실시간 베스트' 그대로는 아니지만, 공식 API로
낼 수 있는 최선의 근사다:

  - 실시간 인기 키워드 랭킹 : 데이터랩 최근 기간 인기도(ratio) 순
  - 키워드별 대표 상품(행사 랭킹템) : 쇼핑 검색 최저가순 상품

주의: 데이터랩은 약 1일 지연이 있고, ratio 는 질의한 키워드 집합 안에서의
상대값(최대 100)이다. 즉 절대 판매량이 아니라 '최근 검색·소비 인기도'다.
"""
from __future__ import annotations

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


def _recent_score(client: NaverClient, watch: CategoryWatch, days: int) -> dict[str, float]:
    """카테고리 안 키워드들의 '최근 인기도'를 계산.

    데이터랩에서 구간 데이터를 받아, 각 키워드의 마지막 구간 ratio 를 쓴다.
    (데이터가 비어 있으면 0)
    """
    end = datetime.now(KST).date()
    start = end - timedelta(days=days)
    resp = client.keyword_trend(
        watch.category_code,
        watch.keywords,
        start.isoformat(),
        end.isoformat(),
        time_unit="date",
    )
    scores: dict[str, float] = {}
    for result in resp.get("results", []):
        title = result.get("title", "")
        data = result.get("data", [])
        scores[title] = float(data[-1]["ratio"]) if data else 0.0
    # 데이터랩 응답에 빠진 키워드는 0 으로 채움
    for kw in watch.keywords:
        scores.setdefault(kw, 0.0)
    return scores


def build_rankings(
    client: NaverClient,
    *,
    top_keywords: int = 5,
    products_per_keyword: int = 5,
    lookback_days: int = 14,
    sort: str = "asc",
) -> list[KeywordRank]:
    """전체 워치리스트에 대해 인기 키워드 랭킹 + 대표 상품을 만든다.

    top_keywords         : 카테고리별로 상위 몇 개 키워드를 남길지
    products_per_keyword : 키워드당 대표 상품 개수
    sort                 : 쇼핑 검색 정렬 (asc=최저가, sim=정확도)
    """
    ranked: list[KeywordRank] = []
    for watch in WATCHLIST:
        scores = _recent_score(client, watch, lookback_days)
        top = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)[:top_keywords]
        for i, (keyword, score) in enumerate(top, start=1):
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

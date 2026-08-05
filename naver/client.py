"""네이버 OpenAPI 클라이언트 (쇼핑 검색 + 데이터랩 쇼핑인사이트).

네이버플러스스토어의 '실시간 베스트'를 그대로 주는 공식 API는 없다.
공식으로 열려 있는 것은 아래 둘뿐이라, 이 둘을 조합해 근사한다.

  1. 쇼핑 검색   GET  /v1/search/shop.json       - 키워드별 상품/가격
  2. 데이터랩    POST /v1/datalab/shopping/...    - 키워드 인기도 추이

인증: https://developers.naver.com 에서 애플리케이션 등록 후 발급받는
Client ID / Secret 을 환경변수로 전달한다.

  export NAVER_CLIENT_ID=xxxx
  export NAVER_CLIENT_SECRET=yyyy
"""
from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Any

import requests

SEARCH_URL = "https://openapi.naver.com/v1/search/shop.json"
DATALAB_CATEGORY_URL = "https://openapi.naver.com/v1/datalab/shopping/categories"
DATALAB_KEYWORD_URL = "https://openapi.naver.com/v1/datalab/shopping/category/keywords"


class NaverAPIError(RuntimeError):
    """네이버 API 호출 실패."""


@dataclass(frozen=True)
class Product:
    """쇼핑 검색 결과 상품 한 건."""

    title: str          # HTML 태그 제거된 상품명
    lprice: int         # 최저가(원)
    mall_name: str      # 판매처(쇼핑몰)
    brand: str
    maker: str
    category: str       # category1 > ... > category4
    link: str
    product_id: str
    image: str          # 상품 썸네일 이미지 URL


class NaverClient:
    """네이버 OpenAPI 얇은 래퍼. 재시도 + 레이트리밋 백오프 포함."""

    def __init__(
        self,
        client_id: str | None = None,
        client_secret: str | None = None,
        *,
        timeout: int = 10,
        max_retries: int = 4,
    ) -> None:
        self.client_id = client_id or os.environ.get("NAVER_CLIENT_ID", "")
        self.client_secret = client_secret or os.environ.get("NAVER_CLIENT_SECRET", "")
        if not self.client_id or not self.client_secret:
            raise NaverAPIError(
                "NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 가 필요합니다. "
                "https://developers.naver.com 에서 발급 후 환경변수로 설정하세요."
            )
        self.timeout = timeout
        self.max_retries = max_retries
        self._session = requests.Session()
        self._session.headers.update(
            {
                "X-Naver-Client-Id": self.client_id,
                "X-Naver-Client-Secret": self.client_secret,
            }
        )

    # -- 내부 공통 요청 --------------------------------------------------

    def _request(self, method: str, url: str, **kwargs: Any) -> dict[str, Any]:
        last_exc: Exception | None = None
        for attempt in range(self.max_retries):
            try:
                resp = self._session.request(method, url, timeout=self.timeout, **kwargs)
                if resp.status_code == 429:  # 레이트리밋
                    raise NaverAPIError("rate limited (429)")
                if 400 <= resp.status_code < 500:
                    # 재시도해도 같은 결과라 바로 실패 처리하되, 원인 파악용으로 응답 본문을 그대로 노출
                    raise NaverAPIError(
                        f"{resp.status_code} {resp.reason} — {resp.text[:500]}"
                    )
                resp.raise_for_status()
                return resp.json()
            except NaverAPIError as exc:
                if str(exc).startswith(("400", "401", "403", "404")):
                    raise NaverAPIError(f"요청 실패: {method} {url} — {exc}") from exc
                last_exc = exc
                if attempt < self.max_retries - 1:
                    time.sleep(2 ** attempt)  # 1s, 2s, 4s ...
            except requests.RequestException as exc:
                last_exc = exc
                if attempt < self.max_retries - 1:
                    time.sleep(2 ** attempt)
        raise NaverAPIError(f"요청 실패: {method} {url} — {last_exc}")

    # -- 쇼핑 검색 -------------------------------------------------------

    def search_products(
        self,
        query: str,
        *,
        display: int = 10,
        sort: str = "sim",
    ) -> list[Product]:
        """키워드로 상품 검색.

        sort: sim(정확도) | date(날짜) | asc(가격오름) | dsc(가격내림)
        """
        params = {"query": query, "display": display, "sort": sort}
        data = self._request("GET", SEARCH_URL, params=params)
        return [_parse_product(item) for item in data.get("items", [])]

    # -- 데이터랩: 카테고리 트렌드 --------------------------------------

    def category_trend(
        self,
        categories: list[dict[str, Any]],
        start_date: str,
        end_date: str,
        *,
        time_unit: str = "date",
    ) -> dict[str, Any]:
        """카테고리별 인기도 추이. categories=[{"name","param":[code]}]."""
        body = {
            "startDate": start_date,
            "endDate": end_date,
            "timeUnit": time_unit,
            "category": categories,
        }
        return self._request("POST", DATALAB_CATEGORY_URL, json=body)

    # -- 데이터랩: 카테고리 내 키워드 트렌드 -----------------------------

    def keyword_trend(
        self,
        category_code: str,
        keywords: list[str],
        start_date: str,
        end_date: str,
        *,
        time_unit: str = "date",
    ) -> dict[str, Any]:
        """한 카테고리 안에서 키워드들의 인기도 추이 비교."""
        body = {
            "startDate": start_date,
            "endDate": end_date,
            "timeUnit": time_unit,
            "category": category_code,
            "keyword": [{"name": kw, "param": [kw]} for kw in keywords],
        }
        return self._request("POST", DATALAB_KEYWORD_URL, json=body)


def _strip_tags(text: str) -> str:
    """검색 API가 붙이는 <b> 강조 태그 제거."""
    return text.replace("<b>", "").replace("</b>", "").strip()


def _parse_product(item: dict[str, Any]) -> Product:
    cats = [item.get(f"category{i}", "") for i in range(1, 5)]
    category = " > ".join(c for c in cats if c)
    return Product(
        title=_strip_tags(item.get("title", "")),
        lprice=int(item.get("lprice") or 0),
        mall_name=item.get("mallName", ""),
        brand=item.get("brand", ""),
        maker=item.get("maker", ""),
        category=category,
        link=item.get("link", ""),
        product_id=str(item.get("productId", "")),
        image=item.get("image", ""),
    )

"""실행 진입점.

    export NAVER_CLIENT_ID=xxxx
    export NAVER_CLIENT_SECRET=yyyy
    python -m naver.main                 # 콘솔 출력
    python -m naver.main --csv out.csv --html out.html
"""
from __future__ import annotations

import argparse
import sys

from .client import NaverAPIError, NaverClient
from .rankings import build_rankings
from .report import print_console, write_csv, write_html


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="네이버 공식 OpenAPI로 실시간 인기 키워드 랭킹 + 대표 상품 정리"
    )
    parser.add_argument("--top", type=int, default=5, help="카테고리별 상위 키워드 수")
    parser.add_argument("--products", type=int, default=5, help="키워드당 대표 상품 수")
    parser.add_argument(
        "--period", default="일간", choices=["일간", "주간", "월간"],
        help="인기도 기준 기간 (일간/주간/월간, 기본 일간)",
    )
    parser.add_argument(
        "--days", type=int, default=None,
        help="데이터랩 조회 범위(일). 생략 시 기간에 맞춰 자동(일간14/주간60/월간180)",
    )
    parser.add_argument(
        "--sort", default="sim", choices=["sim", "asc", "dsc", "date"],
        help="상품 정렬 (sim=정확도/대표상품, asc=최저가, dsc=최고가, date=최신)",
    )
    parser.add_argument(
        "--category", metavar="대분류",
        help="특정 대분류만 조회 (예: 패션의류, 패션잡화, 스포츠/레저, 출산/육아). 생략 시 전체",
    )
    parser.add_argument("--csv", metavar="PATH", help="CSV 저장 경로")
    parser.add_argument("--html", metavar="PATH", help="HTML 대시보드 저장 경로")
    args = parser.parse_args(argv)

    try:
        client = NaverClient()
    except NaverAPIError as exc:
        print(f"[설정 오류] {exc}", file=sys.stderr)
        return 2

    try:
        rankings = build_rankings(
            client,
            top_keywords=args.top,
            products_per_keyword=args.products,
            period=args.period,
            lookback_days=args.days,
            sort=args.sort,
            category=args.category,
        )
    except ValueError as exc:
        print(f"[입력 오류] {exc}", file=sys.stderr)
        return 2
    except NaverAPIError as exc:
        print(f"[API 오류] {exc}", file=sys.stderr)
        return 1

    print_console(rankings, period=args.period)
    if args.csv:
        print(f"\nCSV 저장: {write_csv(rankings, args.csv)}")
    if args.html:
        print(f"HTML 저장: {write_html(rankings, args.html, period=args.period)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

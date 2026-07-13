"""랭킹 결과를 콘솔 / CSV / HTML 로 출력."""
from __future__ import annotations

import csv
import html
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

from .rankings import KeywordRank

KST = timezone(timedelta(hours=9))


def _now() -> str:
    return datetime.now(KST).strftime("%Y-%m-%d %H:%M KST")


def _prepare(path: str | Path) -> Path:
    """저장 경로를 Path 로 만들고 상위 폴더가 없으면 생성."""
    path = Path(path)
    if path.parent and not path.parent.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
    return path


def print_console(rankings: list[KeywordRank], period: str = "") -> None:
    """터미널에 보기 좋게 출력."""
    tag = f"[{period}] " if period else ""
    print(f"\n{tag}네이버 쇼핑 인기 랭킹 (근사) — {_now()}\n" + "=" * 52)
    current_cat = None
    for row in rankings:
        if row.category != current_cat:
            current_cat = row.category
            print(f"\n[{row.category}]")
        print(f"  {row.rank}. {row.keyword}  (인기도 {row.score})")
        for p in row.products:
            price = f"{p.lprice:,}원" if p.lprice else "가격문의"
            mall = f" @{p.mall_name}" if p.mall_name else ""
            print(f"       - {p.title[:40]}  {price}{mall}")


def write_csv(rankings: list[KeywordRank], path: str | Path) -> Path:
    """행 = (카테고리, 키워드, 순위, 인기도, 상품명, 최저가, 판매처, 링크)."""
    path = _prepare(path)
    with path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(
            ["카테고리", "키워드", "키워드순위", "인기도", "상품명", "최저가", "판매처", "링크", "이미지"]
        )
        for row in rankings:
            if not row.products:
                writer.writerow([row.category, row.keyword, row.rank, row.score, "", "", "", "", ""])
            for p in row.products:
                writer.writerow(
                    [row.category, row.keyword, row.rank, row.score,
                     p.title, p.lprice, p.mall_name, p.link, p.image]
                )
    return path


def _split_cat(category: str) -> tuple[str, str]:
    """'패션잡화 · 지갑' → ('패션잡화', '지갑'). 구분자 없으면 (name, '')."""
    top, _, sub = category.partition(" · ")
    return top, sub


_STYLE = [
    "<style>",
    "body{font-family:system-ui,sans-serif;margin:0;padding:0 20px 20px;background:#0b1020;color:#e8ecf5}",
    "h1{font-size:20px;margin:0 0 4px} h2{margin:24px 0 0;color:#7cc4ff;font-size:16px}",
    ".filters{position:sticky;top:0;background:#0b1020;padding:8px 0;z-index:5;border-bottom:1px solid #1c2440}",
    ".bar{padding:3px 0} .bar.period{padding-bottom:6px}",
    ".tab{display:inline-block;margin:3px 6px 3px 0;padding:6px 12px;border-radius:16px;"
    "background:#161d34;color:#cdd8ef;font-size:13px;cursor:pointer;border:1px solid transparent}",
    ".tab.on{background:#7cc4ff;color:#08101f;font-weight:700}",
    ".ptab{display:inline-block;margin:0 4px 0 0;padding:5px 16px;border-radius:16px;"
    "background:#12203a;color:#cdd8ef;font-size:13px;cursor:pointer}",
    ".ptab.on{background:#ff8fb1;color:#2a0713;font-weight:700}",
    ".subtab{display:inline-block;margin:3px 5px 3px 0;padding:4px 10px;border-radius:14px;"
    "background:#0f1528;color:#9fb3d8;font-size:12px;cursor:pointer}",
    ".subtab.on{background:#ffd479;color:#332600;font-weight:700}",
    ".kw{margin:12px 0;padding:12px 14px;background:#161d34;border-radius:10px}",
    ".kw>b{color:#ffd479} .score{color:#8fa3c8;font-size:12px}",
    ".grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:10px}",
    ".card{background:#0f1528;border-radius:8px;overflow:hidden;display:flex;flex-direction:column}",
    ".card:hover{outline:1px solid #7cc4ff}",
    ".thumb{width:100%;aspect-ratio:1;object-fit:cover;background:#1c2440}",
    ".card .body{padding:8px 10px}",
    ".name{font-size:12px;line-height:1.35;max-height:3.2em;overflow:hidden}",
    ".price{color:#7dffa0;font-weight:700;font-size:14px;margin-top:4px}",
    ".mall{color:#8fa3c8;font-size:11px}",
    "a{color:inherit;text-decoration:none}",
    "</style>",
]


def _collect_tops(rankings: list[KeywordRank]) -> dict[str, list[str]]:
    """대분류 → 중분류(순서 유지) 목록."""
    tops: dict[str, list[str]] = {}
    for row in rankings:
        top, sub = _split_cat(row.category)
        subs = tops.setdefault(top, [])
        if sub and sub not in subs:
            subs.append(sub)
    return tops


def _group_html(row: KeywordRank, extra: str = "") -> str:
    """상품 카드 그리드 한 그룹(키워드)의 HTML."""
    top, sub = _split_cat(row.category)
    out = [
        f"<div class='kw grp' data-top='{html.escape(top)}' data-sub='{html.escape(sub)}'{extra}>"
        f"<b>{row.rank}. {html.escape(sub or row.keyword)} · {html.escape(row.keyword)}</b> "
        f"<span class='score'>인기도 {row.score}</span><div class='grid'>"
    ]
    for p in row.products:
        price = f"{p.lprice:,}원" if p.lprice else "가격문의"
        thumb = (
            f"<img class='thumb' src='{html.escape(p.image)}' alt='' loading='lazy'>"
            if p.image else "<div class='thumb'></div>"
        )
        out.append(
            f"<a class='card' href='{html.escape(p.link)}' target='_blank'>{thumb}"
            f"<div class='body'><div class='name'>{html.escape(p.title[:60])}</div>"
            f"<div class='price'>{price}</div>"
            f"<div class='mall'>{html.escape(p.mall_name)}</div></div></a>"
        )
    out.append("</div></div>")
    return "".join(out)


# 대분류/중분류 필터 JS (period 는 write_html_multi 에서만 씀)
_FILTER_JS = """<script>
const SUBS = __SUBS__;
let curPeriod = __PERIOD0__, curTop = '전체', curSub = '전체';
function match(el){
  const okP = !curPeriod || el.dataset.period===undefined || el.dataset.period===curPeriod;
  const okT = curTop==='전체' || el.dataset.top===curTop;
  const okS = el.dataset.sub===undefined || curSub==='전체' || el.dataset.sub===curSub;
  return okP && okT && okS;
}
function render(){
  document.querySelectorAll('.ptab').forEach(t=>t.classList.toggle('on', t.dataset.period===curPeriod));
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('on', t.dataset.top===curTop));
  document.querySelectorAll('.sec,.grp').forEach(el=>{ el.style.display = match(el)?'':'none'; });
}
function selPeriod(p){ curPeriod=p; render(); }
function selTop(top){
  curTop=top; curSub='전체';
  const bar=document.getElementById('subbar');
  if(top==='전체'||!(SUBS[top]||[]).length){ bar.innerHTML=''; }
  else {
    let h="<span class='subtab on' onclick=\\"selSub('전체')\\">전체</span>";
    for(const s of SUBS[top]) h+="<span class='subtab' data-sub='"+s+"' onclick=\\"selSub('"+s+"')\\">"+s+"</span>";
    bar.innerHTML=h;
  }
  render();
}
function selSub(sub){
  curSub=sub;
  document.querySelectorAll('.subtab').forEach(t=>t.classList.toggle('on',(t.dataset.sub||'전체')===sub));
  render();
}
render();
</script>"""


def _filter_js(tops: dict[str, list[str]], period0: str) -> str:
    return (_FILTER_JS
            .replace("__SUBS__", json.dumps(tops, ensure_ascii=False))
            .replace("__PERIOD0__", json.dumps(period0, ensure_ascii=False)))


def _tab_bar(tops: dict[str, list[str]]) -> list[str]:
    bar = ["<div class='bar'><span class='tab on' data-top='전체' onclick=\"selTop('전체')\">전체</span>"]
    for top in tops:
        t = html.escape(top)
        bar.append(f"<span class='tab' data-top='{t}' onclick=\"selTop('{t}')\">{t}</span>")
    bar.append("</div>")
    return bar


def write_html(rankings: list[KeywordRank], path: str | Path, period: str = "", note: str = "") -> Path:
    """대분류/중분류 탭 필터가 달린 카드형 대시보드 HTML (단일 기간).

    note 를 주면 제목 아래 노란 경고 배너로 표시 (예: 과거 조회 시 상품 시점 안내).
    """
    path = _prepare(path)
    tops = _collect_tops(rankings)
    suffix = " · " + html.escape(period) if period else ""
    banner = (
        f"<div style='background:#3a2a0f;color:#ffd479;padding:8px 12px;"
        f"border-radius:8px;font-size:13px;margin:8px 0'>⚠ {html.escape(note)}</div>"
        if note else ""
    )

    parts: list[str] = [
        "<!doctype html><meta charset='utf-8'>",
        "<meta name='viewport' content='width=device-width,initial-scale=1'>",
        "<title>네이버 쇼핑 인기 랭킹</title>",
        *_STYLE,
        f"<h1>네이버 쇼핑 인기 랭킹 (근사){suffix}</h1>",
        f"<div class='score'>{_now()} · 공식 OpenAPI 기반</div>",
        banner,
        "<div class='filters'>",
        *_tab_bar(tops),
        "<div class='bar sub' id='subbar'></div>",
        "</div>",
    ]
    for top, rows in _group_by_top(rankings).items():
        parts.append(f"<h2 class='sec' data-top='{html.escape(top)}'>{html.escape(top)}</h2>")
        parts.extend(_group_html(row) for row in rows)
    parts.append(_filter_js(tops, ""))
    path.write_text("\n".join(parts), encoding="utf-8")
    return path


def write_html_multi(period_rankings: dict[str, list[KeywordRank]], path: str | Path) -> Path:
    """일간/주간/월간 토글 + 대분류/중분류 탭이 함께 있는 단일 대시보드 HTML."""
    path = _prepare(path)
    periods = list(period_rankings)
    # 중분류 목록은 기간 공통(구조 동일) — 아무 기간에서나 수집
    any_rank = next((r for r in period_rankings.values() if r), [])
    tops = _collect_tops(any_rank)

    parts: list[str] = [
        "<!doctype html><meta charset='utf-8'>",
        "<meta name='viewport' content='width=device-width,initial-scale=1'>",
        "<title>네이버 쇼핑 인기 랭킹</title>",
        *_STYLE,
        "<h1>네이버 쇼핑 인기 랭킹 (근사)</h1>",
        f"<div class='score'>{_now()} · 공식 OpenAPI 기반 · 일간/주간/월간 토글</div>",
        "<div class='filters'>",
        "<div class='bar period'>",
    ]
    for i, p in enumerate(periods):
        on = " on" if i == 0 else ""
        pe = html.escape(p)
        parts.append(f"<span class='ptab{on}' data-period='{pe}' onclick=\"selPeriod('{pe}')\">{pe}</span>")
    parts.append("</div>")
    parts.extend(_tab_bar(tops))
    parts.append("<div class='bar sub' id='subbar'></div>")
    parts.append("</div>")

    # 기간 × 대분류 섹션 (JS 가 활성 기간만 표시)
    for period, rankings in period_rankings.items():
        pe = html.escape(period)
        for top, rows in _group_by_top(rankings).items():
            parts.append(
                f"<h2 class='sec' data-period='{pe}' data-top='{html.escape(top)}'>{html.escape(top)}</h2>"
            )
            parts.extend(_group_html(row, extra=f" data-period='{pe}'") for row in rows)

    parts.append(_filter_js(tops, periods[0] if periods else ""))
    path.write_text("\n".join(parts), encoding="utf-8")
    return path


def _group_by_top(rankings: list[KeywordRank]) -> dict[str, list[KeywordRank]]:
    """대분류별로 묶되 순서 유지."""
    grouped: dict[str, list[KeywordRank]] = {}
    for row in rankings:
        top, _ = _split_cat(row.category)
        grouped.setdefault(top, []).append(row)
    return grouped

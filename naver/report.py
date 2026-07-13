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
    path = Path(path)
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


def write_html(rankings: list[KeywordRank], path: str | Path, period: str = "") -> Path:
    """대분류/중분류 탭 필터가 달린 카드형 대시보드 HTML."""
    path = Path(path)

    # 대분류 → 중분류(순서 유지) 목록 수집
    tops: dict[str, list[str]] = {}
    for row in rankings:
        top, sub = _split_cat(row.category)
        subs = tops.setdefault(top, [])
        if sub and sub not in subs:
            subs.append(sub)

    parts: list[str] = [
        "<!doctype html><meta charset='utf-8'>",
        "<meta name='viewport' content='width=device-width,initial-scale=1'>",
        "<title>네이버 쇼핑 실시간 인기 랭킹</title>",
        "<style>",
        "body{font-family:system-ui,sans-serif;margin:0;padding:20px;background:#0b1020;color:#e8ecf5}",
        "h1{font-size:20px;margin:0 0 4px}",
        "h2{margin:24px 0 0;color:#7cc4ff;font-size:16px}",
        ".bar{position:sticky;top:0;background:#0b1020;padding:10px 0;z-index:5;border-bottom:1px solid #1c2440}",
        ".bar.sub{top:52px;border-bottom:none}",
        ".tab{display:inline-block;margin:3px 6px 3px 0;padding:6px 12px;border-radius:16px;"
        "background:#161d34;color:#cdd8ef;font-size:13px;cursor:pointer;border:1px solid transparent}",
        ".tab.on{background:#7cc4ff;color:#08101f;font-weight:700}",
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
        f"<h1>네이버 쇼핑 인기 랭킹 (근사){' · ' + html.escape(period) if period else ''}</h1>",
        f"<div class='score'>{_now()} · 공식 OpenAPI 기반</div>",
    ]

    # 대분류 탭 바
    parts.append("<div class='bar'><span class='tab on' data-top='전체' onclick=\"selTop('전체')\">전체</span>")
    for top in tops:
        parts.append(f"<span class='tab' data-top='{html.escape(top)}' onclick=\"selTop('{html.escape(top)}')\">{html.escape(top)}</span>")
    parts.append("</div>")

    # 중분류 탭 바 (선택된 대분류에 따라 JS가 채움)
    parts.append("<div class='bar sub' id='subbar'></div>")

    # 각 대분류 섹션
    for top, rows in _group_by_top(rankings).items():
        parts.append(f"<h2 class='sec' data-top='{html.escape(top)}'>{html.escape(top)}</h2>")
        for row in rows:
            _, sub = _split_cat(row.category)
            parts.append(
                f"<div class='kw grp' data-top='{html.escape(top)}' data-sub='{html.escape(sub)}'>"
                f"<b>{row.rank}. {html.escape(sub or row.keyword)} · {html.escape(row.keyword)}</b> "
                f"<span class='score'>인기도 {row.score}</span><div class='grid'>"
            )
            for p in row.products:
                price = f"{p.lprice:,}원" if p.lprice else "가격문의"
                thumb = (
                    f"<img class='thumb' src='{html.escape(p.image)}' alt='' loading='lazy'>"
                    if p.image else "<div class='thumb'></div>"
                )
                parts.append(
                    f"<a class='card' href='{html.escape(p.link)}' target='_blank'>{thumb}"
                    f"<div class='body'><div class='name'>{html.escape(p.title[:60])}</div>"
                    f"<div class='price'>{price}</div>"
                    f"<div class='mall'>{html.escape(p.mall_name)}</div></div></a>"
                )
            parts.append("</div></div>")

    # 필터 로직 (외부 의존성 없는 바닐라 JS)
    subs_json = json.dumps(tops, ensure_ascii=False)
    parts.append(f"""<script>
const SUBS = {subs_json};
let curTop = '전체', curSub = '전체';
function render(){{
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('on', t.dataset.top===curTop));
  document.querySelectorAll('.sec').forEach(s=>{{
    s.style.display = (curTop==='전체'||s.dataset.top===curTop)?'':'none';
  }});
  document.querySelectorAll('.grp').forEach(g=>{{
    const okTop = curTop==='전체'||g.dataset.top===curTop;
    const okSub = curSub==='전체'||g.dataset.sub===curSub;
    g.style.display = (okTop&&okSub)?'':'none';
  }});
}}
function selTop(top){{
  curTop=top; curSub='전체';
  const bar=document.getElementById('subbar');
  if(top==='전체'||!(SUBS[top]||[]).length){{ bar.innerHTML=''; }}
  else {{
    let h="<span class='subtab on' onclick=\\"selSub('전체')\\">전체</span>";
    for(const s of SUBS[top]) h+="<span class='subtab' data-sub='"+s+"' onclick=\\"selSub('"+s+"')\\">"+s+"</span>";
    bar.innerHTML=h;
  }}
  render();
}}
function selSub(sub){{
  curSub=sub;
  document.querySelectorAll('.subtab').forEach(t=>t.classList.toggle('on',(t.dataset.sub||'전체')===sub));
  render();
}}
render();
</script>""")
    path.write_text("\n".join(parts), encoding="utf-8")
    return path


def _group_by_top(rankings: list[KeywordRank]) -> dict[str, list[KeywordRank]]:
    """대분류별로 묶되 순서 유지."""
    grouped: dict[str, list[KeywordRank]] = {}
    for row in rankings:
        top, _ = _split_cat(row.category)
        grouped.setdefault(top, []).append(row)
    return grouped

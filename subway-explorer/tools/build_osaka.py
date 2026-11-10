#!/usr/bin/env python3
"""오사카권 철도(JR·사철·지하철·모노레일·노면전차) 데이터를 만들어 index.html에 끼워 넣는다.

입력: data/osaka/lines.json (tools/fetch_osaka.py로 station_database에서 받은 노선별 역 순서·좌표·읽기)

- 범위: 오사카부에 역이 하나라도 있는 노선 전부 (신칸센 제외). 간사이 5개 부현 밖 구간은 잘라 낸다.
- 역 합치기: 같은 이름이고 800m 안에 있으면 한 역 (예: JR 덴노지 + 지하철 덴노지)
- 도보 환승: 이름이 달라도 400m 안이면 걸어서 갈아타는 통로 (예: JR 오사카 ↔ 지하철 우메다)
- 직통 운행: THROUGH에 적은 열차는 회사 경계를 넘어 그대로 달린다
- 한국어 역명: 가나 읽기를 외래어 표기법(일본어)대로 자동 변환, 가타카나·영문 역명은 LABEL_FIX로 직접

사용법:  python3 tools/build_osaka.py          # 검사 후 index.html 갱신
         python3 tools/build_osaka.py --check  # 검사만 (변환 결과 일부 출력)
"""
import json, math, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "osaka" / "lines.json"
HTML = ROOT / "index.html"
PREFS = {26, 27, 28, 29, 30}   # 교토부, 오사카부, 효고현, 나라현, 와카야마현

# 노선 코드 -> 한국어 노선명
LINE_KO = {
    11602: "JR 교토선", 11603: "JR 고베선", 11607: "JR 야마토지선", 11617: "JR 가쿠겐토시선", 11623: "JR 오사카순환선",
    11624: "JR 유메사키선", 11625: "JR 도자이선", 11626: "JR 한와선", 11627: "JR 하고로모선", 11628: "JR 간사이공항선",
    11629: "JR 다카라즈카선", 11641: "JR 오사카히가시선",
    31001: "긴테쓰 난바선", 31003: "긴테쓰 미나미오사카선", 31005: "긴테쓰 오사카선", 31012: "긴테쓰 도묘지선",
    31020: "긴테쓰 나라선", 31021: "긴테쓰 시기선", 31022: "긴테쓰 나가노선", 31023: "긴테쓰 게이한나선", 31024: "긴테쓰 니시시기 케이블",
    32001: "난카이 본선", 32002: "난카이 공항선", 32004: "난카이 다카시노하마선", 32006: "난카이 다나가와선",
    32007: "난카이 고야선", 32009: "난카이 시오미바시선", 32010: "난카이 센보쿠선",
    33001: "게이한 본선", 33003: "게이한 가타노선", 33008: "게이한 나카노시마선",
    34001: "한큐 고베선", 34002: "한큐 다카라즈카선", 34003: "한큐 교토선", 34007: "한큐 미노오선", 34008: "한큐 센리선",
    35001: "한신 본선", 35002: "한신 난바선",
    99614: "기타오사카큐코선", 99615: "노세전철 묘켄선", 99617: "미즈마철도",
    99618: "미도스지선", 99619: "다니마치선", 99620: "요쓰바시선", 99621: "주오선", 99622: "센니치마에선",
    99623: "사카이스지선", 99624: "나가호리쓰루미료쿠치선", 99625: "난코포트타운선", 99652: "이마자토스지선",
    99626: "오사카 모노레일", 99627: "모노레일 사이토선", 99628: "한카이 우에마치선", 99629: "한카이선",
}
# 배지에 쓸 짧은 표시와, 원본에 색이 없는 노선의 색
SHORT_FIX = {99626: "MO", 99627: "MO", 99617: "MZ", 11627: "R"}
COLOR_FIX = {11627: "#FF6600", 35001: "#004C9E", 35002: "#004C9E", 99617: "#1E7B4E", 99628: "#2E9B4E", 99629: "#2E9B4E"}
LOOPS = {11623}   # 오사카순환선

# 직통 운행 열차: (이름, [(노선 코드, 출발역, 도착역), ...])  역 이름은 원본 표기 그대로
THROUGH = [
    ("미도스지선·기타오사카큐코 직통", [(99614, "箕面萱野", "江坂"), (99618, "江坂", "なかもず")]),
    ("사카이스지선·한큐 센리선 직통", [(34008, "北千里", "天神橋筋六丁目"), (99623, "天神橋筋六丁目", "天下茶屋")]),
    ("사카이스지선·한큐 교토선 직통", [(34003, "高槻市", "淡路"), (34008, "淡路", "天神橋筋六丁目"), (99623, "天神橋筋六丁目", "天下茶屋")]),
    ("주오선·긴테쓰 게이한나선 직통", [(99621, "夢洲", "長田(大阪)"), (31023, "長田(大阪)", "学研奈良登美ヶ丘")]),
    ("한신·긴테쓰 직통", [(35001, "三宮(神戸三宮)", "尼崎(阪神電気鉄道)"), (35002, "尼崎(阪神電気鉄道)", "大阪難波"),
                         (31001, "大阪難波", "大阪上本町"), (31005, "大阪上本町", "布施"), (31020, "布施", "近鉄奈良")]),
    ("JR 도자이선·가쿠겐토시선·다카라즈카선 직통", [(11617, "松井山手", "京橋(大阪)"), (11625, "京橋(大阪)", "尼崎(JR)"), (11629, "尼崎(JR)", "宝塚")]),
    ("JR 도자이선·고베선 직통", [(11617, "四条畷", "京橋(大阪)"), (11625, "京橋(大阪)", "尼崎(JR)"), (11603, "尼崎(JR)", "神戸(兵庫)")]),
    ("JR 간쿠쾌속", [(11626, "天王寺", "日根野"), (11628, "日根野", "関西空港")]),
    ("JR 직통쾌속", [(11641, "新大阪", "久宝寺"), (11607, "久宝寺", "奈良")]),
    ("난카이 공항 직통", [(32001, "難波", "泉佐野"), (32002, "泉佐野", "関西空港")]),
    ("난카이 센보쿠선 직통", [(32007, "難波", "中百舌鳥"), (32010, "中百舌鳥", "和泉中央")]),
    ("게이한 나카노시마선 직통", [(33008, "中之島", "天満橋"), (33001, "天満橋", "出町柳")]),
    ("긴테쓰 나가노선 직통", [(31003, "大阪阿部野橋", "古市(大阪)"), (31022, "古市(大阪)", "河内長野")]),
]

# 가타카나·영문 역명, 그리고 자동 변환이 관용 표기와 다른 역 (원본 역명 기준, 괄호 제외)
LABEL_FIX = {
    "コスモスクエア": "코스모스퀘어", "トレードセンター前": "트레이드센터마에", "ポートタウン西": "포트타운니시",
    "ポートタウン東": "포트타운히가시", "フェリーターミナル": "페리터미널", "ドーム前千代崎": "도무마에치요자키",
    "ドーム前": "도무마에", "大阪ビジネスパーク": "오사카비즈니스파크", "ユニバーサルシティ": "유니버설시티",
    "りんくうタウン": "린쿠타운", "なかもず": "나카모즈", "なんば": "난바", "あびこ": "아비코",
    "中ふ頭": "나카후토", "尼崎センタープール前": "아마가사키센터풀마에", "西院": "사이인", "箕面": "미노오", "三ノ宮": "산노미야", "三宮": "고베산노미야",
}
PREFIX = {"JR": ("じぇいあーる", "JR "), "近鉄": ("きんてつ", "긴테쓰 ")}

# 손으로 확인한 지하철 역명 (변환기 검증용 + 우선 적용)
METRO_KO = {
    "箕面萱野": "미노오카야노", "箕面船場阪大前": "미노오센바한다이마에", "千里中央": "센리추오", "桃山台": "모모야마다이",
    "緑地公園": "료쿠치코엔", "江坂": "에사카", "東三国": "히가시미쿠니", "新大阪": "신오사카", "西中島南方": "니시나카지마미나미가타",
    "梅田": "우메다", "淀屋橋": "요도야바시", "本町": "혼마치", "心斎橋": "신사이바시", "大国町": "다이코쿠초",
    "動物園前": "도부쓰엔마에", "天王寺": "덴노지", "西田辺": "니시타나베", "長居": "나가이", "北花田": "기타하나다",
    "新金岡": "신카나오카", "大日": "다이니치", "守口": "모리구치", "太子橋今市": "다이시바시이마이치", "千林大宮": "센바야시오미야",
    "関目高殿": "세키메타카도노", "野江内代": "노에우친다이", "都島": "미야코지마", "天神橋筋六丁目": "덴진바시스지로쿠초메",
    "中崎町": "나카자키초", "東梅田": "히가시우메다", "南森町": "미나미모리마치", "天満橋": "덴마바시",
    "谷町四丁目": "다니마치욘초메", "谷町六丁目": "다니마치로쿠초메", "谷町九丁目": "다니마치큐초메",
    "四天王寺前夕陽ヶ丘": "시텐노지마에유히가오카", "阿倍野": "아베노", "文の里": "후미노사토", "田辺": "다나베",
    "駒川中野": "고마가와나카노", "喜連瓜破": "기레우리와리", "出戸": "데토", "八尾南": "야오미나미",
    "西梅田": "니시우메다", "肥後橋": "히고바시", "四ツ橋": "요쓰바시", "花園町": "하나조노초", "岸里": "기시노사토",
    "玉出": "다마데", "北加賀屋": "기타카가야", "住之江公園": "스미노에코엔", "夢洲": "유메시마", "大阪港": "오사카코",
    "朝潮橋": "아사시오바시", "弁天町": "벤텐초", "阿波座": "아와자", "堺筋本町": "사카이스지혼마치", "森ノ宮": "모리노미야",
    "緑橋": "미도리바시", "深江橋": "후카에바시", "野田阪神": "노다한신", "西長堀": "니시나가호리", "鶴橋": "쓰루하시",
    "新深江": "신후카에", "小路": "쇼지", "北巽": "기타타쓰미", "南巽": "미나미타쓰미", "北浜": "기타하마", "長堀橋": "나가호리바시",
    "恵美須町": "에비스초", "天下茶屋": "덴가차야", "西大橋": "니시오하시", "松屋町": "마쓰야마치", "玉造": "다마쓰쿠리",
    "京橋": "교바시", "蒲生四丁目": "가모욘초메", "今福鶴見": "이마후쿠쓰루미", "横堤": "요코즈쓰미", "鶴見緑地": "쓰루미료쿠치",
    "門真南": "가도마미나미", "井高野": "이타카노", "瑞光四丁目": "즈이코욘초메", "だいどう豊里": "다이도토요사토",
    "新森古市": "신모리후루이치", "関目成育": "세키메세이이쿠", "鴫野": "시기노", "南港東": "난코히가시", "南港口": "난코구치",
}

FACTS = {
    "梅田": "1933년 5월, 오사카 최초의 지하철(미도스지선 우메다–신사이바시)이 출발한 역입니다.",
    "大阪": "JR 서일본 최대의 터미널. 지하 통로로 우메다·히가시우메다·니시우메다, 한큐·한신 오사카우메다와 이어집니다.",
    "心斎橋": "1933년 첫 개통 구간의 남쪽 끝. 아케이드 상점가 신사이바시스지가 바로 위에 있습니다.",
    "なんば": "도톤보리와 글리코 간판이 걸어서 몇 분 거리인 '미나미' 번화가의 중심입니다.",
    "天王寺": "높이 300m의 아베노 하루카스와 맞닿아 있고, 덴노지 동물원·공원이 가깝습니다.",
    "新今宮": "쓰텐카쿠 타워와 신세카이 거리로 가는 JR·난카이 역입니다.",
    "新大阪": "도카이도·산요 신칸센으로 갈아타는 역입니다.",
    "大阪港": "오사카 수족관 가이유칸과 덴포잔 대관람차가 가깝습니다.",
    "夢洲": "2025년 1월 개업. 2025 오사카·간사이 엑스포 회장으로 바로 이어지는 역입니다.",
    "ユニバーサルシティ": "유니버설 스튜디오 재팬(USJ) 바로 앞 역입니다.",
    "関西空港": "간사이 국제공항. JR 간쿠쾌속과 난카이 공항 직통열차의 종점입니다.",
    "大阪城公園": "오사카성 천수각으로 가는 JR 역입니다.",
    "鶴橋": "쓰루하시 시장과 이쿠노 코리아타운이 가까운, 한국 음식으로 유명한 동네입니다.",
    "天神橋筋六丁目": "약 2.6km로 일본에서 가장 긴 상점가라 불리는 덴진바시스지 상점가의 북쪽 끝입니다.",
    "日本橋": "구로몬 시장과 전자상가 덴덴타운이 가깝습니다.",
    "甲子園": "한신 타이거스의 홈구장, 고시엔 구장 앞 역입니다.",
    "宝塚": "다카라즈카 가극단 대극장과 데즈카 오사무 기념관이 있는 동네입니다.",
    "京都河原町": "한큐 교토선의 종점. 기온과 가와라마치 번화가가 바로 앞입니다.",
    "出町柳": "게이한 본선의 교토 쪽 종점. 가모강과 다카노강이 만나는 삼각주가 가깝습니다.",
    "近鉄奈良": "사슴이 사는 나라 공원과 도다이지가 걸어서 갈 수 있는 거리입니다.",
    "極楽橋": "난카이 고야선 종점. 케이블카로 갈아타 고야산에 오릅니다.",
    "伏見稲荷": "수천 개의 붉은 도리이로 유명한 후시미이나리 신사 앞 역입니다.",
    "箕面萱野": "2024년 3월 기타오사카큐코 연장으로 문을 연, 미도스지선 직통열차의 북쪽 종점입니다.",
    "万博記念公園": "1970년 오사카 만국박람회 터. 태양의 탑이 있는 공원입니다.",
    "住吉大社": "오사카에서 가장 오래된 신사 중 하나인 스미요시 타이샤 앞 역입니다.",
    "コスモスクエア": "주오선과 난코포트타운선이 만나는 역. 주오선은 바다 밑 터널로 이곳에 닿습니다.",
}
START = "梅田"
# 400m가 넘지만 실제로 지하 통로로 갈아타는 역 (역, 역, 분)
EXTRA_WALKS = [("梅田", "西梅田", 6), ("心斎橋", "四ツ橋", 5)]

# ---------------------------------------------------------------- kana -> 한글
_V = {"a": 0, "i": 20, "u": 13, "e": 5, "o": 8, "ya": 2, "yu": 17, "yo": 12, "eu": 18, "wa": 9}
_KANA = {}
def _row(chars, cons, vowels="a i u e o"):
    for ch, v in zip(chars, vowels.split()):
        if ch != "_": _KANA[ch] = (cons, v)
_row("あいうえお", "")
_row("かきくけこ", "k"); _row("がぎぐげご", "g")
_row("さしすせそ", "s", "a i eu e o"); _row("ざじずぜぞ", "z", "a i eu e o")
_row("たちつてと", "t", "a i eu e o"); _row("だぢづでど", "d", "a i eu e o")
_row("なにぬねの", "n"); _row("はひふへほ", "h"); _row("ばびぶべぼ", "b"); _row("ぱぴぷぺぽ", "p")
_row("まみむめも", "m"); _row("や_ゆ_よ", "y", "ya _ yu _ yo"); _row("らりるれろ", "r"); _row("わ___を", "w", "wa _ _ _ o")
_KANA["し"] = ("sh", "i"); _KANA["じ"] = ("j", "i"); _KANA["ち"] = ("ch", "i"); _KANA["ぢ"] = ("j", "i")
_KANA["つ"] = ("ts", "eu"); _KANA["づ"] = ("z", "eu"); _KANA["を"] = ("", "o"); _KANA["わ"] = ("", "wa")
_SMALL = {"ゃ": "ya", "ゅ": "yu", "ょ": "yo"}
_SMALLV = {"ぁ": "a", "ぃ": "i", "ぅ": "u", "ぇ": "e", "ぉ": "o"}
# 초성 번호 (ㄱ0 ㄲ1 ㄴ2 ㄷ3 ㄸ4 ㄹ5 ㅁ6 ㅂ7 ㅃ8 ㅅ9 ㅆ10 ㅇ11 ㅈ12 ㅉ13 ㅊ14 ㅋ15 ㅌ16 ㅍ17 ㅎ18)
def _initial(cons, first):
    return {"": 11, "k": 0 if first else 15, "g": 0, "s": 9, "sh": 9, "z": 12, "j": 12, "t": 3 if first else 16,
            "ch": 12 if first else 14, "ts": 10, "d": 3, "n": 2, "h": 18, "f": 18, "b": 7, "p": 17, "m": 6, "y": 11, "r": 5, "w": 11}[cons]

def kana_to_hangul(kana):
    s = "".join(chr(ord(c) - 0x60) if "ァ" <= c <= "ヶ" else c for c in kana)   # 가타카나 -> 히라가나
    morae, i = [], 0
    while i < len(s):
        c = s[i]
        if c in "んっー":
            morae.append(c); i += 1; continue
        if c not in _KANA:
            i += 1; continue           # 기호(・ 등)는 건너뛴다
        cons, v = _KANA[c]
        nxt = s[i + 1] if i + 1 < len(s) else ""
        if nxt in _SMALL:
            v = _SMALL[nxt]; i += 2
            if cons in ("sh", "j", "ch"): v = v[1:]          # しゃ→샤 아닌 사 계열은 아래에서
            if cons == "sh": v = {"a": "ya", "u": "yu", "o": "yo"}[v]   # しゃ 샤, しゅ 슈, しょ 쇼
        elif nxt in _SMALLV:
            v = _SMALLV[nxt]; i += 2
            if cons == "f" or c == "ふ": cons = "h"
        else:
            i += 1
        morae.append((cons, v))
    # 장음 생략: お단 뒤의 う·お, う단 뒤의 う, ー
    out = []
    for m in morae:
        if m == "ー":
            continue
        if isinstance(m, tuple) and out and isinstance(out[-1], tuple):
            pv = out[-1][1]
            if m == ("", "u") and pv in ("o", "u", "yo", "yu"): continue
            if m == ("", "o") and pv in ("o", "yo"): continue
        out.append(m)
    res = []
    for idx, m in enumerate(out):
        if m in ("ん", "っ"):
            if res:
                code = ord(res[-1]) - 0xAC00
                if code % 28 == 0: res[-1] = chr(ord(res[-1]) + (4 if m == "ん" else 19))
            continue
        cons, v = m
        first = not res
        vv = _V["eu"] if v == "eu" else _V["u"] if v == "u" else _V[v]
        if cons in ("j", "ch") and v in ("ya", "yu", "yo"): vv = _V[v[1:]]   # じゃ→자, ちょ→조/초
        res.append(chr(0xAC00 + (_initial(cons, first) * 21 + vv) * 28))
    return "".join(res)

# ---------------------------------------------------------------- build
def dist_km(a, b):
    la = math.radians((a[0] + b[0]) / 2)
    return math.hypot((a[1] - b[1]) * 111.32 * math.cos(la), (a[0] - b[0]) * 110.57)

def base(name):
    return re.sub(r"\(.*?\)", "", name).strip()

def main(check_only):
    src = json.load(open(SRC, encoding="utf-8"))
    errors = []
    lines = {l["code"]: l for l in src["lines"] if l["code"] in LINE_KO}
    missing = sorted(set(LINE_KO) - set(lines))
    if missing: errors.append(f"원본에 없는 노선: {missing}")

    # 1) 역 모으기 (간사이 밖은 잘라 냄)
    st = {}
    for l in lines.values():
        l["stations"] = [s for s in l["stations"] if s.get("prefecture") in PREFS]
        for s in l["stations"]:
            st.setdefault(s["code"], s)
    # 2) 같은 이름 + 800m 안 = 한 역
    by_base = {}
    for s in st.values():
        by_base.setdefault(base(s["name"]), []).append(s)
    key_of, geo, kana_of = {}, {}, {}
    for b, ss in by_base.items():
        clusters = []
        for s in ss:
            p = (s["lat"], s["lng"])
            for c in clusters:
                if any(dist_km(p, (t["lat"], t["lng"])) <= 0.8 for t in c): c.append(s); break
            else: clusters.append([s])
        clusters.sort(key=lambda c: -sum(1 for t in c if t["prefecture"] == 27))
        for i, c in enumerate(clusters):
            k = b if i == 0 else f"{b}#{i + 1}"
            for t in c: key_of[t["code"]] = k
            geo[k] = (round(sum(t["lat"] for t in c) / len(c), 5), round(sum(t["lng"] for t in c) / len(c), 5))
            kana_of[k] = c[0].get("name_kana", "")
    # 3) 노선
    out_lines, line_seq = [], {}
    for code, l in lines.items():
        seq = [key_of[s["code"]] for s in l["stations"]]
        seq = [k for i, k in enumerate(seq) if i == 0 or k != seq[i - 1]]
        line_seq[code] = (l, seq)
        segs = [seq + [seq[0]]] if code in LOOPS else [seq]
        for a, bb in zip(seq, seq[1:]):
            if dist_km(geo[a], geo[bb]) > 9: errors.append(f"역 간격이 너무 김(잘림 의심): {LINE_KO[code]} {a}–{bb}")
        out_lines.append({"id": str(code), "name": LINE_KO[code], "short": SHORT_FIX.get(code) or l.get("symbol") or LINE_KO[code][:1],
                          "color": COLOR_FIX.get(code) or l.get("color") or "#888888", "segs": segs})
    # 4) 직통 운행
    def piece(code, a, b):
        l = lines[code]; names = [s["name"] for s in l["stations"]]
        if a not in names or b not in names: errors.append(f"직통 구간 역 없음: {LINE_KO[code]} {a}/{b}"); return [], []
        i, j = names.index(a), names.index(b)
        part = l["stations"][i:j + 1] if i <= j else l["stations"][j:i + 1][::-1]
        ks = [key_of[s["code"]] for s in part]
        return ks, [str(code)] * (len(ks) - 1)
    through = []
    for name, parts in THROUGH:
        seq, hl = [], []
        for code, a, b in parts:
            ks, ls = piece(code, a, b)
            if not ks: break
            if seq:
                if seq[-1] != ks[0]: errors.append(f"직통 구간이 이어지지 않음: {name} ({seq[-1]} / {ks[0]})")
                ks = ks[1:]
            seq += ks; hl += ls
        through.append({"name": name, "seq": seq, "lines": hl})
    # 5) 도보 환승 (이름이 다르고 400m 안, 같은 선로로 이어지지 않은 역)
    linked = {frozenset((a, b)) for _, seq in line_seq.values() for a, b in zip(seq, seq[1:])}
    keys = sorted(geo)
    walks = []
    for i, a in enumerate(keys):
        for b in keys[i + 1:]:
            d = dist_km(geo[a], geo[b])
            if d <= 0.4 and frozenset((a, b)) not in linked:
                walks.append([a, b, max(3, round(d * 1000 / 80) + 2)])
    have = {frozenset((a, b)) for a, b, _ in walks}
    for a, b, m in EXTRA_WALKS:
        if a not in geo or b not in geo: errors.append(f"도보 환승 역 없음: {a}/{b}")
        elif frozenset((a, b)) not in have: walks.append([a, b, m])
    # 6) 한국어 역명
    labels, diffs = {}, []
    for k in geo:
        b = k.split("#")[0]
        if b in METRO_KO: lab = METRO_KO[b]
        elif b in LABEL_FIX: lab = LABEL_FIX[b]
        else:
            kana = kana_of[k]; pre = ""
            for p, (pk, pko) in PREFIX.items():
                if b.startswith(p) and kana.startswith(pk): kana = kana[len(pk):]; pre = pko
            if re.search(r"[ァ-ヺー]{2,}|[A-Za-zＡ-Ｚ]", b.replace("JR", "")): errors.append(f"가타카나/영문 역명은 LABEL_FIX 필요: {b} ({kana})")
            lab = pre + kana_to_hangul(kana)
        labels[k] = lab
        if b in METRO_KO and kana_to_hangul(kana_of[k]) != METRO_KO[b]:
            diffs.append(f"{b}: 자동 {kana_to_hangul(kana_of[k])} / 확인 {METRO_KO[b]}")
    for k in list(FACTS) + [START]:
        if k not in geo: errors.append(f"노선에 없는 역: {k}")

    print(f"노선 {len(out_lines)}개, 역 {len(geo)}개, 직통 {len(through)}개, 도보 환승 {len(walks)}개")
    print(f"변환기 검증: 확인된 지하철 역명 {sum(1 for k in geo if k.split('#')[0] in METRO_KO)}개 중 다른 것 {len(diffs)}개")
    for x in diffs: print("  ", x)
    if check_only:
        import random; random.seed(1)
        print("자동 변환 예:", ", ".join(f"{k}→{labels[k]}" for k in random.sample(sorted(k for k in geo if k.split('#')[0] not in METRO_KO), 25)))
        print("이름 겹침:", [k for k in geo if "#" in k])
    if errors:
        print("오류:\n  " + "\n  ".join(errors)); sys.exit(1)
    if check_only: return

    out = {"lines": out_lines, "through": through, "geo": geo, "facts": FACTS, "labels": labels, "walks": walks, "start": START,
           "version": src.get("version")}
    js = "const OSAKA_DATA = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";"
    html = HTML.read_text(encoding="utf-8")
    pat = re.compile(r"/\* OSAKA-DATA:BEGIN \*/.*?/\* OSAKA-DATA:END \*/", re.S)
    if not pat.search(html): print("index.html에 OSAKA-DATA 표시가 없습니다"); sys.exit(1)
    HTML.write_text(pat.sub(lambda m: "/* OSAKA-DATA:BEGIN */\n" + js + "\n/* OSAKA-DATA:END */", html), encoding="utf-8")
    print(f"index.html 갱신 완료 ({len(js):,}바이트)")

if __name__ == "__main__":
    main("--check" in sys.argv)

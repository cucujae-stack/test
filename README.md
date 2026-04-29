# ETF 듀얼 모멘텀 추천 봇

국내 운용사 ETF를 대상으로 듀얼 모멘텀 전략을 매주 실행하고, 매수/매도 시그널을 메일로 받아보는 GitHub Actions 워크플로우.

## 전략

1. **절대 모멘텀**: 12개월(252거래일) 수익률 > 0
2. **트렌드 필터**: 현재가 ≥ 200일 이동평균
3. **상대 모멘텀**: 위 조건을 통과한 ETF 중 12M 수익률 상위 3개를 매수
4. **매도**: 보유 종목이 상위 3개에서 빠지면 매도

> 추천 종목이 0개일 수도 있습니다 (전 종목이 음의 모멘텀/하락 추세인 경우). 그때는 현금 유지가 시그널입니다.

## 대상 ETF

`strategy/universe.py` 의 `ETF_UNIVERSE` 에 정의되어 있습니다. 국내 주식/미국 주식/채권/대안자산으로 자산군을 분산해서 12종목을 골랐습니다. 자유롭게 추가/수정하세요.

## 실행 스케줄

- 매주 월요일 16:30 KST (UTC 07:30) 자동 실행
- Actions 탭에서 `workflow_dispatch` 로 수동 실행 가능 (`dry_run=1` 옵션 시 메일 미발송, 결과만 로그 출력)

## 설정 방법

### 1. GitHub Secrets

레포 Settings → Secrets and variables → Actions → New repository secret 에서 등록:

| Secret | 설명 | 예시 |
|---|---|---|
| `SMTP_HOST` | SMTP 서버 | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP 포트 | `587` |
| `SMTP_USER` | SMTP 로그인 ID | `you@gmail.com` |
| `SMTP_PASSWORD` | **앱 비밀번호** (Gmail 일반 비번 X) | `xxxx xxxx xxxx xxxx` |
| `MAIL_FROM` | 발신 주소 | `you@gmail.com` |
| `MAIL_TO` | 수신 주소 (콤마로 다수) | `you@gmail.com,wife@gmail.com` |

### 2. (선택) Variables — 보유 종목

Settings → Secrets and variables → Actions → Variables 탭에서:

| Variable | 설명 | 예시 |
|---|---|---|
| `HOLDINGS` | 현재 보유 ETF 티커 (콤마) | `069500,360750` |

`HOLDINGS` 가 비어있으면 모든 추천이 BUY 로 표시됩니다. 매수 후 이 변수에 티커를 추가하면, 다음 실행에서 SELL 시그널이 정상적으로 잡힙니다.

### 3. Gmail 앱 비밀번호 발급

1. Google 계정 → 보안 → 2단계 인증 활성화
2. [앱 비밀번호 페이지](https://myaccount.google.com/apppasswords) 에서 16자리 발급
3. 그 값을 `SMTP_PASSWORD` 시크릿에 저장

## 로컬 테스트

```bash
pip install -r requirements.txt
DRY_RUN=1 python -m strategy.main
```

`DRY_RUN=1` 이면 SMTP 환경변수 없이도 시그널만 출력합니다.

## 면책

자동 산출된 참고 자료입니다. 실제 매매 판단과 책임은 본인에게 있습니다. 백테스트 결과가 미래 수익을 보장하지 않습니다.

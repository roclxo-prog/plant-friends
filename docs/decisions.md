# docs/decisions.md — 자율 결정 로그

> 랄프모드에서 사용자 답변 없이 내린 결정(무엇을·왜·기본값). 시간순.

## PRE-WAVE
- **2026-06-06 / 프로젝트 위치**: `C:\projects\plant-friends` (사용자 확정).
- **2026-06-06 / 실행 방식**: 23명 멀티에이전트 Ralph 워크플로우 재현 (사용자 확정). 대화형 세션이므로 12시간 백그라운드 루프 대신 동일한 풀세트 산출물을 끝까지 생성하는 방식으로 진행.
- **2026-06-06 / 에이전트 정의**: 외부 프로젝트 복사 없이 23명 전원 신규 정의. 신규 4명(plant-domain-expert·senior-ux-specialist·affiliate-marketing-specialist·content-seo-writer)은 지시서 4장 verbatim, 나머지 19명은 역할 충실 신규 작성.
- **2026-06-06 / 식물 12종 확정**: PRD 6장 기준 실내 10종(산세베리아·스파티필름·다육·스킨답서스·금전수·테이블야자·고무나무·행운목·호접란·아이비) + 텃밭 2종(상추·바질). PRD의 "스파티/아이비" 중복 항목은 아이비로 분리하여 실내 10종을 채움.
- **2026-06-06 / 케어가이드 분량**: PRD는 1000자+, 지시서 content-seo-writer는 1500자+ 요구 → 더 엄격한 1500자+ 채택.
- **2026-06-06 / 정적 흐름 상태관리**: localStorage 대신 URL 쿼리스트링(?light=..&water=..&purpose=..&level=..)으로 quiz→result 전달. 개인정보 미저장 원칙 유지.

## WAVE 2
- **2026-06-06 / 배치 2B+2C 병합**: 코어 HTML/CSS(2B)와 매칭 로직 match.js(2C)는 result.js와의 인터페이스가 긴밀히 결합되어, 두 에이전트로 나누면 인터페이스 불일치 위험. 한 명의 static-site-dev가 일관 구현하도록 병합. match.js는 `matchPlants(answers, plants)` 순수 함수로 분리해 단독 테스트 가능성은 유지.
- **2026-06-06 / 이미지 폴백**: 실제 식물 사진은 CC0 큐레이션 목록(public/IMAGE-SOURCES.md)으로 제공, 사이트는 `<img onerror>`로 public/plants/placeholder.svg 폴백 → 사진 없이도 배포·작동.
- **2026-06-06 / 카톡 공유**: 카카오 JS SDK 키는 사용자 설정값이므로, 키 없이도 작동하도록 navigator.share(Web Share API) 우선 + 실패 시 링크 복사 폴백. config.js에 KAKAO_JS_KEY placeholder만 둠.
- **2026-06-06 / 반려동물 독성 표시**: plants.json toxic_to_pets=true 식물은 상세·결과 카드에 "🐾 반려동물 주의" 배지 노출(시니어 가구 반려동물 안전). 독성 식물 추천 자체를 막지는 않되 명확히 고지.

Xeit
====

FAQ
---

### 이게 뭔가요? ###

**Xeit**는 금융기관들이 보내주는 거래명세서 등의 보안메일을 인터넷 익스플로러가 아닌 사파리나 크롬, 파이어폭스에서도 열어볼 수 있게 해주는 서비스입니다.

### 왜 필요한거죠? ###

국내에서 사용하는 대다수의 보안메일은 윈도의 인터넷 익스플로러에 ActiveX 플러그인을 설치해야만 볼 수 있도록 되어 있습니다. 다른 OS나 브라우저를 사용하는 사람들은 볼 수 있는 방법이 없었지요.

### 어떻게 보는거죠? ###

인터넷 익스플로러가 아닌 브라우저에서 보안메일의 첨부파일을 열어보면 빈 화면 또는 플러그인 설치 안내 화면이 나오는 것을 많이 보셨을 거예요. 이 상태에서 브라우저에 등록해놓은 **Xeit** 북마클릿을 누르면 비밀번호 입력 화면이 등장하면서 보안메일을 읽을 수 있게 됩니다.

### 설치는 어찌하죠? ###

북마클릿을 직접 넣어주거나, [크롬 확장](http://j.mp/xeitce)으로 쉽게 설치할 수도 있습니다. 궁금하면 [여기](http://j.mp/xeitjs)로!

### 개발은 어떡하죠? ###

다양한 메일 종류를 지원할 수 있도록 최대한 구조를 맞춰 보았는데 아직 문서로 정리되지는 않았네요. 동일한 플러그인이라면 큰 수정 없이 지원될 가능성이 높기는 합니다. 혹시 헤더 정보만이라도 샘플을 제공해주실 수 있다면 직접 확인을 도와드릴 수도 있습니다~ 참고로 암호화 알고리즘은 [CryptoJS](https://github.com/tomyun/crypto-js)를 기반으로 SEED, PBKDF1, RC2 등을 추가하여 사용하고 있습니다.

도와주신 분들
-------------

* [skyisle](https://github.com/skyisle): 크롬 이슈 수정
* [RyanYoon](https://github.com/RyanYoon): 메일 추가 (LG U+, 롯데멤버스카드), 크롬 익스텐션 작업
* [everclear--](https://github.com/everclear--): 샘플 제공 (동양생명)
* [sbyoun](https://github.com/sbyoun): 다음 마이피플 봇 작업
* [kkung](https://github.com/kkung): 메일 추가 (미래에셋생명, 삼성카드)
* [Koasing](https://github.com/Koasing): 메일 추가 (KT)
* [teslamint](https://github.com/teslamint): 메일 추가 (하나SK카드)
* [SaschaNaz](https://github.com/SaschaNaz): 페이지 레이아웃 개선
* [netj](https://github.com/netj): 사파리 웹아카이브 지원

document.addEventListener('DOMContentLoaded', () => {
    const loadingTexts = [
        "냥냥! 데이터를 한 움큼 가져오는 중...",
        "고양이가 서버 깊숙이 숨어있는 정보를 찾는 중...",
        "냥이 탐험가가 데이터를 모아오는 중입니다!",
        "고양이가 쥐를 쫓듯 데이터를 쫓는 중...",
        "냥이가 꼬리를 흔들며 서버를 스캔하는 중이에요!",
        "귀여운 고양이가 데이터를 물어오는 중...",
        "냥이가 발바닥으로 데이터를 긁어모으고 있어요!",
        "데이터를 들고 올 고양이가 잠시 숨을 고르는 중...",
        "냥이가 서버와 씨름 중입니다! 조금만 기다려 주세요...",
        "냥냥! 데이터를 조립하는 중입니다...",
        "고양이가 꼬리로 데이터를 휘저으며 가져오는 중이에요!",
        "냥이가 모든 데이터를 안전하게 옮기는 중...",
        "정보를 담은 고양이 상자가 곧 도착합니다!",
        "냥이가 모험 끝에 귀한 데이터를 들고 오는 중...",
        "데이터 산에서 고양이가 무언가를 캐내고 있어요!",
        "냥냥~ 곧 데이터를 완성할 예정입니다!",
        "서버의 미로에서 길을 찾는 고양이가 데이터를 가져오는 중입니다...",
        "고양이가 데이터 꾸러미를 정리하는 중이에요!",
        "냥이의 작은 손길로 데이터를 조심스럽게 정리 중...",
        "냥냥~ 정보 수집 완료까지 조금만 더 기다려 주세요!"
    ];
    const loadingTextElement = document.getElementById('loading-text');
    loadingTextElement.textContent = loadingTexts[Math.floor(Math.random() * loadingTexts.length)];
});

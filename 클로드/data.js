/* =========================================================
   PitchProfile — 데모 선수 데이터 (의존성 없음)
   seasons: 차트용 시즌별 기록 (오래된→최신 순)
   ========================================================= */
window.PLAYERS = [
  {
    id: "son",
    name: "손흥민",
    nameEn: "Son Heung-min",
    country: "대한민국",
    flag: "🇰🇷",
    position: "FW · 윙어",
    birth: 1992,
    foot: "양발",
    club: "Tottenham Hotspur",
    number: 7,
    contract: "~2025",
    value: "€40M",
    summary: { goals: 17, assists: 10, rating: 7.42, apps: 32, minutes: 2710 },
    seasons: [
      { year: "20/21", goals: 17, assists: 10, rating: 7.30 },
      { year: "21/22", goals: 23, assists: 7,  rating: 7.45 },
      { year: "22/23", goals: 10, assists: 6,  rating: 6.98 },
      { year: "23/24", goals: 17, assists: 10, rating: 7.40 },
      { year: "24/25", goals: 17, assists: 10, rating: 7.42 }
    ],
    career: [
      { period: "2015 – 현재", club: "Tottenham Hotspur", league: "프리미어리그 · 잉글랜드 🏴", goals: 173, assists: 89, rating: 7.31 },
      { period: "2013 – 2015", club: "Bayer 04 Leverkusen", league: "분데스리가 · 독일 🇩🇪", goals: 29, assists: 11, rating: 7.18 },
      { period: "2010 – 2013", club: "Hamburger SV", league: "분데스리가 · 독일 🇩🇪", goals: 20, assists: 7, rating: 6.95 }
    ],
    national: { caps: 130, goals: 50, note: "월드컵 3회 · 아시안컵" },
    awards: [
      { yr: "2022", text: "프리미어리그 득점왕" },
      { yr: "2019", text: "푸스카스상" },
      { yr: "아시아", text: "올해의 선수 다수" }
    ]
  },
  {
    id: "haaland",
    name: "엘링 홀란드",
    nameEn: "Erling Haaland",
    country: "노르웨이",
    flag: "🇳🇴",
    position: "FW · 스트라이커",
    birth: 2000,
    foot: "왼발",
    club: "Manchester City",
    number: 9,
    contract: "~2027",
    value: "€180M",
    summary: { goals: 27, assists: 5, rating: 7.55, apps: 31, minutes: 2640 },
    seasons: [
      { year: "20/21", goals: 27, assists: 6,  rating: 7.60 },
      { year: "21/22", goals: 22, assists: 8,  rating: 7.50 },
      { year: "22/23", goals: 36, assists: 8,  rating: 7.90 },
      { year: "23/24", goals: 27, assists: 5,  rating: 7.45 },
      { year: "24/25", goals: 27, assists: 5,  rating: 7.55 }
    ],
    career: [
      { period: "2022 – 현재", club: "Manchester City", league: "프리미어리그 · 잉글랜드 🏴", goals: 90, assists: 18, rating: 7.62 },
      { period: "2020 – 2022", club: "Borussia Dortmund", league: "분데스리가 · 독일 🇩🇪", goals: 86, assists: 23, rating: 7.70 },
      { period: "2019 – 2020", club: "RB Salzburg", league: "분데스리가 · 오스트리아 🇦🇹", goals: 29, assists: 7, rating: 7.55 }
    ],
    national: { caps: 36, goals: 33, note: "유로 예선 다수 골" },
    awards: [
      { yr: "2023", text: "프리미어리그 득점왕 · 트레블" },
      { yr: "2023", text: "단일 시즌 PL 최다골(36)" },
      { yr: "2020", text: "골든보이" }
    ]
  },
  {
    id: "debruyne",
    name: "케빈 더브라위너",
    nameEn: "Kevin De Bruyne",
    country: "벨기에",
    flag: "🇧🇪",
    position: "MF · 플레이메이커",
    birth: 1991,
    foot: "오른발",
    club: "Manchester City",
    number: 17,
    contract: "~2025",
    value: "€35M",
    summary: { goals: 6, assists: 18, rating: 7.65, apps: 28, minutes: 2200 },
    seasons: [
      { year: "20/21", goals: 6,  assists: 12, rating: 7.70 },
      { year: "21/22", goals: 15, assists: 8,  rating: 7.80 },
      { year: "22/23", goals: 7,  assists: 16, rating: 7.75 },
      { year: "23/24", goals: 4,  assists: 10, rating: 7.50 },
      { year: "24/25", goals: 6,  assists: 18, rating: 7.65 }
    ],
    career: [
      { period: "2015 – 현재", club: "Manchester City", league: "프리미어리그 · 잉글랜드 🏴", goals: 102, assists: 170, rating: 7.74 },
      { period: "2014 – 2015", club: "VfL Wolfsburg", league: "분데스리가 · 독일 🇩🇪", goals: 13, assists: 28, rating: 7.60 },
      { period: "2012 – 2014", club: "Chelsea", league: "프리미어리그 · 잉글랜드 🏴", goals: 0, assists: 0, rating: 6.80 }
    ],
    national: { caps: 105, goals: 30, note: "월드컵 3회 · 유로 다수" },
    awards: [
      { yr: "2020", text: "PFA 올해의 선수" },
      { yr: "2020", text: "단일 시즌 PL 도움 타이(20)" },
      { yr: "다수", text: "PL 시즌 베스트11" }
    ]
  }
];

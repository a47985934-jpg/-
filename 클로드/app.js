/* =========================================================
   PitchProfile — 순수 JS (의존성 없음)
   기능: 폰트 조절 · 선수 검색/목록 · 프로필 렌더 · SVG 스탯 차트 · 사진 D&D
   ========================================================= */
(function () {
  "use strict";

  var PLAYERS = window.PLAYERS || [];

  /* ---------- 토스트 ---------- */
  var toastEl = document.getElementById("toast");
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-show"); }, 2200);
  }

  /* ---------- 작은 유틸 ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function el(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }

  /* =========================================================
     1) 폰트 크기 조절 (전체 rem 확대/축소, 저장)
     ========================================================= */
  var FONT_KEY = "pp.fontPx", FONT_MIN = 13, FONT_MAX = 22, FONT_DEFAULT = 16, FONT_STEP = 1;
  var rootEl = document.documentElement;
  var valueEl = document.getElementById("fontValue");
  var btnUp = document.getElementById("fontUp");
  var btnDown = document.getElementById("fontDown");
  var btnReset = document.getElementById("fontReset");

  function clampFont(px) { return Math.min(FONT_MAX, Math.max(FONT_MIN, px)); }
  function readSavedFont() {
    var s = parseFloat(localStorage.getItem(FONT_KEY));
    return isNaN(s) ? FONT_DEFAULT : clampFont(s);
  }
  function applyFont(px, announce) {
    px = clampFont(px);
    rootEl.style.setProperty("--fs-base", px + "px");
    var pct = Math.round((px / FONT_DEFAULT) * 100);
    if (valueEl) valueEl.textContent = pct + "%";
    if (btnUp) btnUp.disabled = px >= FONT_MAX;
    if (btnDown) btnDown.disabled = px <= FONT_MIN;
    try { localStorage.setItem(FONT_KEY, String(px)); } catch (e) {}
    if (announce) toast("글자 크기 " + pct + "%");
    return px;
  }
  var currentFont = applyFont(readSavedFont(), false);
  if (btnUp) btnUp.addEventListener("click", function () { currentFont = applyFont(currentFont + FONT_STEP, true); });
  if (btnDown) btnDown.addEventListener("click", function () { currentFont = applyFont(currentFont - FONT_STEP, true); });
  if (btnReset) btnReset.addEventListener("click", function () { currentFont = applyFont(FONT_DEFAULT, true); });
  document.addEventListener("keydown", function (e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    if (e.key === "+" || e.key === "=") { e.preventDefault(); currentFont = applyFont(currentFont + FONT_STEP, true); }
    else if (e.key === "-" || e.key === "_") { e.preventDefault(); currentFont = applyFont(currentFont - FONT_STEP, true); }
    else if (e.key === "0") { e.preventDefault(); currentFont = applyFont(FONT_DEFAULT, true); }
  });

  /* =========================================================
     사진 저장 (선수별 키)
     ========================================================= */
  function photoKey(id) { return "pp.photo." + id; }
  function getPhoto(id) { try { return localStorage.getItem(photoKey(id)); } catch (e) { return null; } }
  function setPhoto(id, url) { try { localStorage.setItem(photoKey(id), url); return true; } catch (e) { return false; } }
  function delPhoto(id) { try { localStorage.removeItem(photoKey(id)); } catch (e) {} }

  /* =========================================================
     2) 선수 검색 + 목록
     ========================================================= */
  var listEl = document.getElementById("playerList");
  var emptyEl = document.getElementById("listEmpty");
  var countEl = document.getElementById("listCount");
  var searchInput = document.getElementById("searchInput");
  var profileRoot = document.getElementById("profileRoot");

  var state = { currentId: PLAYERS.length ? PLAYERS[0].id : null, term: "" };

  function matches(p, term) {
    if (!term) return true;
    var hay = (p.name + " " + p.nameEn + " " + p.club + " " + p.position + " " + p.country).toLowerCase();
    return hay.indexOf(term.toLowerCase()) !== -1;
  }

  function avatarInner(p) {
    var photo = getPhoto(p.id);
    return photo ? '<img src="' + esc(photo) + '" alt="">' : esc(p.name.slice(0, 1));
  }

  function renderList() {
    var term = state.term.trim();
    var filtered = PLAYERS.filter(function (p) { return matches(p, term); });
    listEl.innerHTML = "";

    filtered.forEach(function (p) {
      var card = el(
        '<li>' +
          '<button class="pcard' + (p.id === state.currentId ? " is-active" : "") + '" type="button" data-id="' + esc(p.id) + '">' +
            '<span class="pcard__avatar">' + avatarInner(p) + '</span>' +
            '<span class="pcard__info">' +
              '<span class="pcard__name">' + esc(p.name) + '</span>' +
              '<span class="pcard__sub">' + esc(p.club) + " · " + esc(p.position) + '</span>' +
            '</span>' +
            '<span class="pcard__num">#' + esc(p.number) + '</span>' +
          '</button>' +
        '</li>'
      );
      card.querySelector(".pcard").addEventListener("click", function () { selectPlayer(p.id); });
      listEl.appendChild(card);
    });

    emptyEl.hidden = filtered.length !== 0;
    countEl.textContent = filtered.length + "명" + (term ? " (검색됨)" : "");
  }

  function selectPlayer(id) {
    state.currentId = id;
    renderList();
    renderProfile(getPlayer(id));
    if (profileRoot) profileRoot.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function getPlayer(id) {
    for (var i = 0; i < PLAYERS.length; i++) if (PLAYERS[i].id === id) return PLAYERS[i];
    return null;
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      state.term = searchInput.value;
      renderList();
    });
  }

  /* =========================================================
     3) 프로필 렌더
     ========================================================= */
  function renderProfile(p) {
    if (!p) { profileRoot.innerHTML = '<div class="card">선수를 선택하세요.</div>'; return; }

    var careerRows = p.career.map(function (c) {
      return (
        '<li class="tl">' +
          '<div class="tl__period">' + esc(c.period) + '</div>' +
          '<div class="tl__body">' +
            '<h3 class="tl__club">' + esc(c.club) + '</h3>' +
            '<p class="tl__league">' + esc(c.league) + '</p>' +
            '<div class="tl__stats">' +
              '<span class="pill"><b>' + c.goals + '</b> 골</span>' +
              '<span class="pill"><b>' + c.assists + '</b> 도움</span>' +
              '<span class="pill pill--rate"><b>' + c.rating.toFixed(2) + '</b> 평점</span>' +
            '</div>' +
          '</div>' +
        '</li>'
      );
    }).join("");

    var awardRows = p.awards.map(function (a) {
      return '<li><span class="awards__yr">' + esc(a.yr) + '</span> ' + esc(a.text) + '</li>';
    }).join("");

    var s = p.summary;

    profileRoot.innerHTML =
      // 프로필 헤더
      '<section class="profile">' +
        '<div class="profile__photo" id="dropZone" tabindex="0" role="button" ' +
             'aria-label="프로필 사진. 이미지를 끌어다 놓거나 클릭해 업로드하세요.">' +
          '<img id="photoPreview" class="profile__img" alt="" hidden />' +
          '<div class="dropzone__hint" id="dropHint">' +
            '<span class="dropzone__icon" aria-hidden="true">📷</span>' +
            '<strong>사진 드래그 &amp; 드롭</strong>' +
            '<span class="dropzone__sub">또는 클릭해서 업로드</span>' +
          '</div>' +
          '<input type="file" id="fileInput" accept="image/*" hidden />' +
          '<button class="profile__photo-clear" id="photoClear" type="button" hidden aria-label="사진 제거">✕</button>' +
        '</div>' +
        '<div class="profile__main">' +
          '<div class="profile__headline">' +
            '<h1 class="profile__name">' + esc(p.name) + ' <span class="profile__name-en">' + esc(p.nameEn) + '</span></h1>' +
            '<span class="badge badge--pos">' + esc(p.position) + '</span>' +
          '</div>' +
          '<p class="profile__sub">' + esc(p.country) + " " + p.flag + " · " + p.birth + " · " + esc(p.foot) + '</p>' +
          '<ul class="profile__meta">' +
            '<li><span class="meta__k">현 소속</span><span class="meta__v">' + esc(p.club) + '</span></li>' +
            '<li><span class="meta__k">등번호</span><span class="meta__v">' + esc(p.number) + '</span></li>' +
            '<li><span class="meta__k">계약</span><span class="meta__v">' + esc(p.contract) + '</span></li>' +
            '<li><span class="meta__k">시장가치</span><span class="meta__v">' + esc(p.value) + '</span></li>' +
          '</ul>' +
        '</div>' +
      '</section>' +

      // 시즌 요약
      '<section class="card">' +
        '<div class="card__head"><h2 class="card__title">이번 시즌 요약</h2>' +
          '<span class="card__tag">최근 시즌</span></div>' +
        '<div class="stats">' +
          '<div class="stat"><div class="stat__num">' + s.goals + '</div><div class="stat__label">골</div></div>' +
          '<div class="stat"><div class="stat__num">' + s.assists + '</div><div class="stat__label">어시스트</div></div>' +
          '<div class="stat"><div class="stat__num stat__num--accent">' + s.rating.toFixed(2) + '</div><div class="stat__label">평균 평점</div></div>' +
          '<div class="stat"><div class="stat__num">' + s.apps + '</div><div class="stat__label">출전</div></div>' +
          '<div class="stat"><div class="stat__num">' + s.minutes.toLocaleString() + '</div><div class="stat__label">출전 시간(분)</div></div>' +
        '</div>' +
      '</section>' +

      // 차트
      '<section class="card">' +
        '<div class="card__head"><h2 class="card__title">시즌별 추이</h2>' +
          '<span class="card__tag">최근 5시즌</span></div>' +
        '<div class="chart">' +
          '<div class="chart__block">' +
            '<div class="chart__head"><span class="chart__name">골 · 어시스트</span>' +
              '<span class="legend">' +
                '<span class="legend__item"><span class="legend__swatch" style="background:var(--brand)"></span>골</span>' +
                '<span class="legend__item"><span class="legend__swatch" style="background:#8fb6ff"></span>어시스트</span>' +
              '</span>' +
            '</div>' +
            barChart(p.seasons) +
          '</div>' +
          '<div class="chart__block">' +
            '<div class="chart__head"><span class="chart__name">평균 평점</span>' +
              '<span class="legend"><span class="legend__item"><span class="legend__swatch" style="background:var(--accent)"></span>평점</span></span>' +
            '</div>' +
            ratingChart(p.seasons) +
          '</div>' +
        '</div>' +
      '</section>' +

      // 커리어
      '<section class="card">' +
        '<div class="card__head"><h2 class="card__title">커리어</h2><span class="card__tag">클럽 이력</span></div>' +
        '<ol class="timeline">' + careerRows + '</ol>' +
      '</section>' +

      // 대표팀 + 수상
      '<section class="grid2">' +
        '<div class="card">' +
          '<div class="card__head"><h2 class="card__title">대표팀</h2></div>' +
          '<ul class="kv">' +
            '<li><span>A매치</span><b>' + p.national.caps + '경기</b></li>' +
            '<li><span>대표팀 골</span><b>' + p.national.goals + '골</b></li>' +
            '<li><span>주요 대회</span><b>' + esc(p.national.note) + '</b></li>' +
          '</ul>' +
        '</div>' +
        '<div class="card">' +
          '<div class="card__head"><h2 class="card__title">주요 수상</h2></div>' +
          '<ul class="awards">' + awardRows + '</ul>' +
        '</div>' +
      '</section>';

    wirePhoto(p);
  }

  /* =========================================================
     4) SVG 차트 (의존성 없음)
     ========================================================= */
  function barChart(seasons) {
    var W = 560, H = 240, padL = 18, padR = 12, padT = 26, padB = 30;
    var plotW = W - padL - padR, plotH = H - padT - padB, baseY = padT + plotH;
    var n = seasons.length;
    var maxVal = 1;
    seasons.forEach(function (d) { maxVal = Math.max(maxVal, d.goals, d.assists); });
    var niceMax = Math.ceil(maxVal / 5) * 5;
    var groupW = plotW / n;
    var barW = groupW * 0.30, innerGap = groupW * 0.04;

    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="시즌별 골·어시스트 막대 차트">';
    // 기준선
    svg += '<line class="axis-line" x1="' + padL + '" y1="' + baseY + '" x2="' + (W - padR) + '" y2="' + baseY + '"/>';

    seasons.forEach(function (d, i) {
      var cx = padL + groupW * i + groupW / 2;
      var gX = cx - barW - innerGap / 2;
      var aX = cx + innerGap / 2;
      var gH = (d.goals / niceMax) * plotH;
      var aH = (d.assists / niceMax) * plotH;

      svg += '<rect class="bar bar--goals" x="' + gX.toFixed(1) + '" y="' + (baseY - gH).toFixed(1) +
             '" width="' + barW.toFixed(1) + '" height="' + gH.toFixed(1) + '" rx="3"><title>' + d.year + " 골 " + d.goals + '</title></rect>';
      svg += '<rect class="bar bar--assists" x="' + aX.toFixed(1) + '" y="' + (baseY - aH).toFixed(1) +
             '" width="' + barW.toFixed(1) + '" height="' + aH.toFixed(1) + '" rx="3"><title>' + d.year + " 도움 " + d.assists + '</title></rect>';
      // 값 라벨
      svg += '<text class="bar-value" x="' + (gX + barW / 2).toFixed(1) + '" y="' + (baseY - gH - 5).toFixed(1) + '">' + d.goals + '</text>';
      svg += '<text class="bar-value" x="' + (aX + barW / 2).toFixed(1) + '" y="' + (baseY - aH - 5).toFixed(1) + '">' + d.assists + '</text>';
      // x 라벨
      svg += '<text class="axis-label" x="' + cx.toFixed(1) + '" y="' + (baseY + 18) + '" text-anchor="middle">' + d.year + '</text>';
    });
    svg += '</svg>';
    return svg;
  }

  function ratingChart(seasons) {
    var W = 560, H = 200, padL = 18, padR = 12, padT = 24, padB = 28;
    var plotW = W - padL - padR, plotH = H - padT - padB, baseY = padT + plotH;
    var n = seasons.length;
    var vals = seasons.map(function (d) { return d.rating; });
    var lo = Math.min.apply(null, vals) - 0.2;
    var hi = Math.max.apply(null, vals) + 0.2;
    if (hi - lo < 0.4) { hi = lo + 0.4; }

    function px(i) { return padL + plotW * (n === 1 ? 0.5 : i / (n - 1)); }
    function py(v) { return baseY - ((v - lo) / (hi - lo)) * plotH; }

    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="시즌별 평점 라인 차트">';
    svg += '<line class="axis-line" x1="' + padL + '" y1="' + baseY + '" x2="' + (W - padR) + '" y2="' + baseY + '"/>';

    var line = "", area = "";
    seasons.forEach(function (d, i) {
      var X = px(i).toFixed(1), Y = py(d.rating).toFixed(1);
      line += (i === 0 ? "M" : "L") + X + " " + Y + " ";
      area += (i === 0 ? "M" + X + " " + baseY + " L" : "L") + X + " " + Y + " ";
    });
    area += "L" + px(n - 1).toFixed(1) + " " + baseY + " Z";

    svg += '<path class="rating-area" d="' + area + '"/>';
    svg += '<path class="rating-line" d="' + line.trim() + '"/>';

    seasons.forEach(function (d, i) {
      var X = px(i), Y = py(d.rating);
      svg += '<circle class="rating-dot" cx="' + X.toFixed(1) + '" cy="' + Y.toFixed(1) + '" r="4"><title>' + d.year + " 평점 " + d.rating.toFixed(2) + '</title></circle>';
      svg += '<text class="rating-value" x="' + X.toFixed(1) + '" y="' + (Y - 9).toFixed(1) + '">' + d.rating.toFixed(2) + '</text>';
      svg += '<text class="axis-label" x="' + X.toFixed(1) + '" y="' + (baseY + 18) + '" text-anchor="middle">' + d.year + '</text>';
    });
    svg += '</svg>';
    return svg;
  }

  /* =========================================================
     5) 프로필 사진 드래그 앤 드롭 (선택된 선수에 바인딩)
     ========================================================= */
  function wirePhoto(p) {
    var dropZone = document.getElementById("dropZone");
    var fileInput = document.getElementById("fileInput");
    var preview = document.getElementById("photoPreview");
    var hint = document.getElementById("dropHint");
    var clearBtn = document.getElementById("photoClear");
    if (!dropZone) return;
    var MAX_MB = 8;

    function show(url) {
      preview.src = url; preview.hidden = false;
      if (hint) hint.style.display = "none";
      if (clearBtn) clearBtn.hidden = false;
    }
    function hide() {
      preview.removeAttribute("src"); preview.hidden = true;
      if (hint) hint.style.display = "";
      if (clearBtn) clearBtn.hidden = true;
    }
    function applyUrl(url, persist) {
      show(url);
      if (persist && !setPhoto(p.id, url)) toast("사진은 표시되지만 저장 용량을 초과했어요.");
      renderList(); // 목록 아바타도 갱신
    }
    function handleFile(file) {
      if (!file) return;
      if (!/^image\//.test(file.type)) { toast("이미지 파일만 올릴 수 있어요."); return; }
      if (file.size > MAX_MB * 1024 * 1024) { toast(MAX_MB + "MB 이하 이미지만 가능해요."); return; }
      var r = new FileReader();
      r.onload = function (ev) { applyUrl(ev.target.result, true); toast(p.name + " 사진을 적용했어요."); };
      r.onerror = function () { toast("사진을 읽지 못했어요."); };
      r.readAsDataURL(file);
    }

    var saved = getPhoto(p.id);
    if (saved) show(saved); else hide();

    dropZone.addEventListener("click", function (e) { if (e.target === clearBtn) return; fileInput.click(); });
    dropZone.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); }
    });
    fileInput.addEventListener("change", function () {
      if (fileInput.files && fileInput.files[0]) handleFile(fileInput.files[0]);
      fileInput.value = "";
    });

    ["dragenter", "dragover"].forEach(function (t) {
      dropZone.addEventListener(t, function (e) { e.preventDefault(); e.stopPropagation(); dropZone.classList.add("is-dragover"); });
    });
    ["dragleave", "dragend"].forEach(function (t) {
      dropZone.addEventListener(t, function (e) { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove("is-dragover"); });
    });
    dropZone.addEventListener("drop", function (e) {
      e.preventDefault(); e.stopPropagation();
      dropZone.classList.remove("is-dragover");
      var dt = e.dataTransfer;
      if (dt && dt.files && dt.files[0]) { handleFile(dt.files[0]); return; }
      if (dt) {
        var url = dt.getData("text/uri-list") || dt.getData("text/plain");
        if (url && /^https?:|^data:image\//.test(url)) { applyUrl(url, true); toast("이미지를 적용했어요."); }
      }
    });
    if (clearBtn) {
      clearBtn.addEventListener("click", function (e) {
        e.stopPropagation(); hide(); delPhoto(p.id); renderList();
        toast("프로필 사진을 제거했어요.");
      });
    }
  }

  // 페이지 바깥으로 떨어진 파일을 브라우저가 여는 것 방지
  ["dragover", "drop"].forEach(function (t) {
    window.addEventListener(t, function (e) {
      var dz = document.getElementById("dropZone");
      if (dz && dz.contains(e.target)) return;
      e.preventDefault();
    });
  });
  // 붙여넣기로 현재 선수 사진 업로드
  window.addEventListener("paste", function (e) {
    var items = e.clipboardData && e.clipboardData.items;
    if (!items || !state.currentId) return;
    for (var i = 0; i < items.length; i++) {
      if (items[i].type && items[i].type.indexOf("image") === 0) {
        var dz = document.getElementById("dropZone");
        if (dz) { // wirePhoto의 handleFile 대신 직접 처리
          var file = items[i].getAsFile();
          var r = new FileReader();
          r.onload = function (ev) {
            setPhoto(state.currentId, ev.target.result);
            renderProfile(getPlayer(state.currentId));
            toast("붙여넣기로 사진을 적용했어요.");
          };
          r.readAsDataURL(file);
        }
        break;
      }
    }
  });

  /* =========================================================
     초기 렌더
     ========================================================= */
  renderList();
  if (state.currentId) renderProfile(getPlayer(state.currentId));
})();

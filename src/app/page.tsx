"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Moshaf = {
  id: number;
  name: string;
  server: string;
  surah_list: string;
};

type Reciter = {
  id: number;
  name: string;
  moshaf: Moshaf[];
};

type Surah = {
  id: number;
  name: string;
};

type RecitersResponse = { reciters?: Reciter[] };
type SurahsResponse = { suwar?: Surah[] };

function Icon({
  name,
  size = 20,
}: {
  name:
    | "search"
    | "book"
    | "headphones"
    | "play"
    | "check"
    | "sparkles"
    | "arrowUp";
  size?: number;
}) {
  const paths = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    book: (
      <>
        <path d="M12 7v14" />
        <path d="M3 18V5a1 1 0 0 1 1-1h4a4 4 0 0 1 4 4 4 4 0 0 1 4-4h4a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-4a4 4 0 0 0-4 2 4 4 0 0 0-4-2H4a1 1 0 0 1-1-1Z" />
      </>
    ),
    headphones: (
      <>
        <path d="M3 14v-3a9 9 0 0 1 18 0v3" />
        <path d="M5 14h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2Zm12 0h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2Z" />
      </>
    ),
    play: <path d="m8 5 12 7-12 7V5Z" />,
    check: <path d="m5 12 4 4L19 6" />,
    sparkles: (
      <>
        <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" />
        <path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z" />
      </>
    ),
    arrowUp: <path d="m5 12 7-7 7 7M12 19V5" />,
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("ar")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .trim();
}

function parseSurahIds(value: string) {
  return new Set(
    value
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isInteger(id) && id > 0),
  );
}

export default function Home() {
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [query, setQuery] = useState("");
  const [selectedReciter, setSelectedReciter] = useState<Reciter | null>(null);
  const [selectedMoshaf, setSelectedMoshaf] = useState<Moshaf | null>(null);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [surahQuery, setSurahQuery] = useState("");
  const [reciterDropdownOpen, setReciterDropdownOpen] = useState(false);
  const [moshafDropdownOpen, setMoshafDropdownOpen] = useState(false);
  const [surahDropdownOpen, setSurahDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [playerError, setPlayerError] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const reciterSearchRef = useRef<HTMLDivElement>(null);
  const moshafSelectRef = useRef<HTMLDivElement>(null);
  const moshafTriggerRef = useRef<HTMLButtonElement>(null);
  const surahSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function updateBackToTopVisibility() {
      setShowBackToTop(window.scrollY > 0);
    }

    updateBackToTopVisibility();
    window.addEventListener("scroll", updateBackToTopVisibility, {
      passive: true,
    });
    return () =>
      window.removeEventListener("scroll", updateBackToTopVisibility);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCatalog() {
      try {
        const [recitersResponse, surahsResponse] = await Promise.all([
          fetch("api/reciters", { signal: controller.signal }),
          fetch("api/surahs", { signal: controller.signal }),
        ]);
        if (!recitersResponse.ok || !surahsResponse.ok) {
          throw new Error(
            "تعذر تحميل بيانات التلاوات. يرجى المحاولة مرة أخرى.",
          );
        }

        const [recitersData, surahsData] = (await Promise.all([
          recitersResponse.json(),
          surahsResponse.json(),
        ])) as [RecitersResponse, SurahsResponse];

        if (
          !Array.isArray(recitersData.reciters) ||
          !Array.isArray(surahsData.suwar)
        ) {
          throw new Error("وصلتنا بيانات غير مكتملة من خدمة التلاوات.");
        }

        setReciters(recitersData.reciters);
        setSurahs(surahsData.suwar);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء تحميل بيانات التلاوات.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadCatalog();
    return () => controller.abort();
  }, []);

  const filteredReciters = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery || selectedReciter) return reciters;
    return reciters.filter((reciter) =>
      normalizeText(reciter.name).includes(normalizedQuery),
    );
  }, [query, reciters, selectedReciter]);

  const availableSurahs = useMemo(() => {
    if (!selectedMoshaf) return [];
    const ids = parseSurahIds(selectedMoshaf.surah_list);
    return surahs.filter((surah) => ids.has(surah.id));
  }, [selectedMoshaf, surahs]);

  const filteredSurahs = useMemo(() => {
    const normalizedQuery = normalizeText(surahQuery);
    if (!normalizedQuery) return availableSurahs;
    return availableSurahs.filter(
      (surah) =>
        normalizeText(surah.name).includes(normalizedQuery) ||
        String(surah.id).includes(normalizedQuery),
    );
  }, [availableSurahs, surahQuery]);

  const audioUrl =
    selectedMoshaf && selectedSurah
      ? `${selectedMoshaf.server.replace(/\/+$/, "")}/${String(selectedSurah.id).padStart(3, "0")}.mp3`
      : "";

  useEffect(() => {
    if (!audioUrl || !audioRef.current) return;

    const playback = audioRef.current.play();
    playback.catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setPlayerError("تعذر بدء التشغيل تلقائيًا. اضغط زر التشغيل للمتابعة.");
    });
  }, [audioUrl]);

  useEffect(() => {
    if (!reciterDropdownOpen) return;
    function closeOnOutsideClick(event: PointerEvent) {
      if (!reciterSearchRef.current?.contains(event.target as Node)) {
        setReciterDropdownOpen(false);
      }
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [reciterDropdownOpen]);

  useEffect(() => {
    if (!moshafDropdownOpen) return;
    function closeOnOutsideClick(event: PointerEvent) {
      if (!moshafSelectRef.current?.contains(event.target as Node)) {
        setMoshafDropdownOpen(false);
      }
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [moshafDropdownOpen]);

  useEffect(() => {
    if (!surahDropdownOpen) return;
    function closeOnOutsideClick(event: PointerEvent) {
      if (!surahSearchRef.current?.contains(event.target as Node)) {
        setSurahDropdownOpen(false);
      }
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [surahDropdownOpen]);

  function chooseReciter(reciter: Reciter) {
    setSelectedReciter(reciter);
    setSelectedMoshaf(reciter.moshaf[0] ?? null);
    setSelectedSurah(null);
    setSurahQuery("");
    setReciterDropdownOpen(false);
    setMoshafDropdownOpen(false);
    setSurahDropdownOpen(false);
    setQuery(reciter.name);
    setPlayerError("");
  }

  function chooseMoshaf(moshafId: string) {
    const moshaf = selectedReciter?.moshaf.find(
      (item) => String(item.id) === moshafId,
    );
    if (!moshaf) return;
    setSelectedMoshaf(moshaf);
    setSelectedSurah(null);
    setMoshafDropdownOpen(false);
    setSurahDropdownOpen(false);
    setPlayerError("");
  }

  function handleMoshafOptionKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) {
    if (event.key === "Escape") {
      setMoshafDropdownOpen(false);
      moshafTriggerRef.current?.focus();
      return;
    }

    const options =
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
        '[role="option"]',
      );
    if (!options?.length) return;

    let nextIndex = -1;
    if (event.key === "ArrowDown") nextIndex = 1;
    if (event.key === "ArrowUp") nextIndex = -1;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = options.length - 1;
    if (nextIndex === -1 && event.key !== "ArrowUp") return;

    event.preventDefault();
    const currentIndex = Array.from(options).indexOf(event.currentTarget);
    const targetIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? options.length - 1
          : (currentIndex + nextIndex + options.length) % options.length;
    options[targetIndex]?.focus();
  }

  function chooseSurah(surah: Surah) {
    setSelectedSurah(surah);
    setSurahDropdownOpen(false);
    setPlayerError("");
  }

  function handleAudioError() {
    setPlayerError("تعذر تشغيل هذا المقطع. قد يكون الخادم غير متاح مؤقتًا.");
  }

  function handleAudioEnded() {
    if (!selectedSurah) return;

    const currentIndex = availableSurahs.findIndex(
      (surah) => surah.id === selectedSurah.id,
    );
    if (currentIndex < 0) return;

    const nextSurah = availableSurahs[currentIndex + 1];
    if (!nextSurah) return;

    setSelectedSurah(nextSurah);
    setPlayerError("");
  }

  return (
    <main className="site-shell" dir="rtl">
      <header className="site-header">
        <a className="brand" href="#" aria-label="العودة إلى الرئيسية">
          <span className="brand-mark" aria-hidden="true">
            <Icon name="book" size={23} />
          </span>
          <span>
            <strong> آيات </strong>
            <small>صوت القرآن الكريم</small>
          </span>
        </a>
        <nav className="main-nav" aria-label="التنقل الرئيسي">
          <a className="active" href="#home">
            الرئيسية
          </a>
          <a href="#reciter">القراء</a>
          <a href="#surahs">السور</a>
        </nav>
        <a className="header-cta" href="#listen">
          <Icon name="headphones" size={17} />
          <span>ابدأ الاستماع</span>
        </a>
      </header>

      <section className="hero" id="home">
        <div className="hero-ornament ornament-one" aria-hidden="true">
          <svg viewBox="0 0 100 100" fill="none">
            <path
              d="M67 8C42 15 28 40 34 64C40 87 64 98 86 88C63 91 43 73 42 51C41 30 52 15 67 8Z"
              fill="currentColor"
            />
            <path
              d="M70 25L75 37L88 38L78 47L81 60L70 53L59 60L62 47L52 38L65 37Z"
              fill="currentColor"
            />
          </svg>
        </div>

        <div className="hero-ornament ornament-two" aria-hidden="true">
          <svg viewBox="0 0 100 100" fill="none">
            <path
              d="M67 8C42 15 28 40 34 64C40 87 64 98 86 88C63 91 43 73 42 51C41 30 52 15 67 8Z"
              fill="currentColor"
            />
            <path
              d="M70 25L75 37L88 38L78 47L81 60L70 53L59 60L62 47L52 38L65 37Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="hero-content">
          <h1>
            أنصت بقلبك،
            <br />
            <span>واطمئن بآياته.</span>
          </h1>

          <a className="hero-button " href="#reciter">
            اختر قارئك
          </a>
        </div>
        <div className="hero-verse">
          <span className="verse-rule" />
          <p>﴿ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ ﴾</p>
          <small>سورة الرعد · ٢٨</small>
        </div>
      </section>

      <section className="intro" id="about">
        <span className="intro-icon">
          <Icon name="sparkles" size={19} />
        </span>
        <div>
          <p className="section-kicker">رحلتك مع القرآن</p>
          <h2>كل ما تحب سماعه، في مكان واحد</h2>
        </div>
        <p className="intro-copy">
          ابحث عن قارئك المفضل، ثم اختر الرواية والسورة لتبدأ الاستماع.
        </p>
      </section>

      <section className="listening-panel" id="listen">
        <div className="panel-heading">
          <span className="heading-icon">
            <Icon name="headphones" size={20} />
          </span>
          <div>
            <p className="section-kicker">استمع الآن</p>
            <h2>اختر تلاوتك</h2>
          </div>
          <span className="step-count">١ — ٣</span>
        </div>

        {loadError ? (
          <div className="notice error-notice" role="alert">
            <p>{loadError}</p>
            <button type="button" onClick={() => window.location.reload()}>
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <div className="selection-grid">
            <div className="selection-field reciter-field" id="reciter">
              <label htmlFor="reciter-search">
                <span className="field-number">١</span>
                القارئ
                <span className="field-hint">ابحث بالاسم</span>
              </label>
              <div className="search-wrap" ref={reciterSearchRef}>
                <Icon name="search" size={18} />
                <input
                  id="reciter-search"
                  type="search"
                  role="combobox"
                  value={query}
                  onFocus={() => setReciterDropdownOpen(true)}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setReciterDropdownOpen(true);
                    setSelectedReciter(null);
                    setSelectedMoshaf(null);
                    setSelectedSurah(null);
                  }}
                  placeholder="مثال: مشاري العفاسي"
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-controls="reciter-results"
                  aria-expanded={reciterDropdownOpen && !loading}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setReciterDropdownOpen(false);
                  }}
                />
                {loading && (
                  <span className="loading-dot" aria-label="جارٍ التحميل" />
                )}
                {query && !loading && (
                  <button
                    className="clear-search"
                    type="button"
                    aria-label="مسح البحث"
                    onClick={() => {
                      setQuery("");
                      setSelectedReciter(null);
                      setSelectedMoshaf(null);
                      setSelectedSurah(null);
                      setReciterDropdownOpen(true);
                    }}
                  >
                    ×
                  </button>
                )}
                {reciterDropdownOpen && !loading && (
                  <div
                    className="suggestions"
                    id="reciter-results"
                    role="listbox"
                    aria-label="القراء المطابقون"
                  >
                    {filteredReciters.length ? (
                      filteredReciters.map((reciter) => (
                        <button
                          key={reciter.id}
                          type="button"
                          role="option"
                          aria-selected="false"
                          className="suggestion"
                          onClick={() => chooseReciter(reciter)}
                        >
                          <span className="suggestion-icon">
                            <Icon name="headphones" size={16} />
                          </span>
                          <span>{reciter.name}</span>
                          <span className="suggestion-arrow">←</span>
                        </button>
                      ))
                    ) : (
                      <p className="empty-suggestions">
                        {query.length < 2
                          ? "لا توجد أسماء متاحة"
                          : "لا توجد أسماء مطابقة"}
                      </p>
                    )}
                  </div>
                )}
              </div>
              {selectedReciter && (
                <p className="selected-caption">
                  <Icon name="check" size={14} /> {selectedReciter.name}
                </p>
              )}
            </div>

            <div
              className={`selection-field ${!selectedReciter ? "field-disabled" : ""}`}
            >
              <label htmlFor="moshaf-select">
                <span className="field-number">٢</span>
                الرواية
                <span className="field-hint">اختر الرواية</span>
              </label>
              <div
                className="select-wrap moshaf-select-wrap"
                ref={moshafSelectRef}
              >
                <button
                  ref={moshafTriggerRef}
                  type="button"
                  className="moshaf-trigger"
                  id="moshaf-select"
                  disabled={!selectedReciter}
                  aria-haspopup="listbox"
                  aria-expanded={moshafDropdownOpen}
                  aria-controls="moshaf-options"
                  onClick={() => setMoshafDropdownOpen((open) => !open)}
                >
                  <span className={!selectedMoshaf ? "is-placeholder" : ""}>
                    {selectedMoshaf?.name ??
                      (selectedReciter ? "اختر الرواية" : "اختر قارئًا أولًا")}
                  </span>
                  <span className="select-indicator" aria-hidden="true">
                    ⌄
                  </span>
                </button>
                {selectedReciter && moshafDropdownOpen && (
                  <div
                    className="moshaf-options"
                    id="moshaf-options"
                    role="listbox"
                    aria-label="اختر الرواية"
                  >
                    {selectedReciter.moshaf.map((moshaf) => (
                      <button
                        key={moshaf.id}
                        type="button"
                        role="option"
                        aria-selected={selectedMoshaf?.id === moshaf.id}
                        className={`moshaf-option ${selectedMoshaf?.id === moshaf.id ? "is-selected" : ""}`}
                        onClick={() => chooseMoshaf(String(moshaf.id))}
                        onKeyDown={handleMoshafOptionKeyDown}
                      >
                        <span>{moshaf.name}</span>
                        {selectedMoshaf?.id === moshaf.id && (
                          <Icon name="check" size={16} />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedReciter && selectedReciter.moshaf.length === 0 && (
                <p className="field-message">
                  لا تتوفر روايات لهذا القارئ حاليًا.
                </p>
              )}
            </div>

            <div
              className={`selection-field ${!selectedMoshaf ? "field-disabled" : ""}`}
              id="surahs"
            >
              <label htmlFor="surah-search">
                <span className="field-number">٣</span>
                السورة
                <span className="field-hint">
                  {selectedMoshaf
                    ? `${availableSurahs.length} سورة متاحة`
                    : "اختر السورة"}
                </span>
              </label>
              <div
                className="search-wrap surah-search-wrap"
                ref={surahSearchRef}
              >
                <Icon name="book" size={17} />
                <input
                  id="surah-search"
                  type="search"
                  value={surahQuery}
                  onFocus={() => {
                    if (selectedSurah && surahQuery === selectedSurah.name) {
                      setSurahQuery("");
                    }
                    setSurahDropdownOpen(true);
                  }}
                  onChange={(event) => {
                    setSurahQuery(event.target.value);
                    setSurahDropdownOpen(true);
                  }}
                  placeholder={
                    selectedMoshaf ? "ابحث عن سورة..." : "اختر رواية أولًا"
                  }
                  disabled={!selectedMoshaf}
                  autoComplete="off"
                  aria-label="ابحث عن سورة"
                />
                <span className="select-indicator" aria-hidden="true">
                  ⌄
                </span>
                {selectedMoshaf && surahDropdownOpen && (
                  <div className="surah-options">
                    {filteredSurahs.length ? (
                      filteredSurahs.map((surah) => (
                        <button
                          key={surah.id}
                          type="button"
                          className={`surah-option ${selectedSurah?.id === surah.id ? "is-selected" : ""}`}
                          onClick={() => chooseSurah(surah)}
                        >
                          <span className="surah-number">
                            {String(surah.id).padStart(2, "0")}
                          </span>
                          <span>{surah.name}</span>
                          {selectedSurah?.id === surah.id && (
                            <Icon name="check" size={15} />
                          )}
                        </button>
                      ))
                    ) : (
                      <p className="empty-suggestions">
                        لم نعثر على سورة بهذا الاسم
                      </p>
                    )}
                  </div>
                )}
              </div>
              {selectedSurah && (
                <p className="selected-caption">
                  <Icon name="check" size={14} /> سورة {selectedSurah.name}
                </p>
              )}
            </div>
          </div>
        )}
        {playerError && (
          <p className="player-error" role="status">
            {playerError}
          </p>
        )}
      </section>

      <section className="features" aria-label="مميزات وِرد">
        <div className="feature">
          <span className="feature-icon">
            <Icon name="headphones" size={19} />
          </span>
          <div>
            <strong>أكثر من قارئ</strong>
            <small>أصوات تحب الاستماع إليها</small>
          </div>
        </div>
        <span className="feature-divider" />
        <div className="feature">
          <span className="feature-icon">
            <Icon name="book" size={19} />
          </span>
          <div>
            <strong>روايات متعددة</strong>
            <small>اختر الرواية المناسبة لك</small>
          </div>
        </div>
        <span className="feature-divider" />
        <div className="feature">
          <span className="feature-icon">
            <Icon name="sparkles" size={19} />
          </span>
          <div>
            <strong>صوت نقي</strong>
            <small>استمع بأعلى جودة متاحة</small>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <span className="footer-brand">
          <Icon name="book" size={17} /> وِرد
        </span>
        <span>جعل الله القرآن ربيع قلوبنا ونور صدورنا</span>
      </footer>

      <aside className="audio-player" aria-label="مشغل التلاوة">
        <div className="player-track">
          <span className="player-art">
            <Icon name="book" size={19} />
          </span>
          <div className="track-info">
            <strong>
              {selectedSurah
                ? `سورة ${selectedSurah.name}`
                : "اختر سورة للاستماع"}
            </strong>
            <span>
              {selectedReciter?.name ?? "القرآن الكريم"}
              {selectedMoshaf ? ` · ${selectedMoshaf.name}` : ""}
            </span>
          </div>
        </div>
        {audioUrl ? (
          <audio
            ref={audioRef}
            className="audio-controls"
            controls
            preload="none"
            src={audioUrl}
            onError={handleAudioError}
            onEnded={handleAudioEnded}
            onPlaying={() => setPlayerError("")}
            aria-label={`تلاوة سورة ${selectedSurah?.name} بصوت ${selectedReciter?.name}`}
          />
        ) : (
          <div className="player-placeholder">
            <span className="placeholder-play">
              <Icon name="play" size={16} />
            </span>
            <span>ستظهر أدوات التشغيل هنا بعد اختيار السورة</span>
          </div>
        )}
      </aside>
      {showBackToTop && (
        <button
          className="back-to-top"
          type="button"
          aria-label="العودة إلى أعلى الصفحة"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <Icon name="arrowUp" size={20} />
        </button>
      )}
      <div className="player-space" aria-hidden="true" />
    </main>
  );
}

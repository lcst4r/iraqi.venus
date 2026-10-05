/* =========================================================
   VENUS — COMPETITION SYSTEM
   competition.js
   Local MVP
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
    "use strict";
    /* =========================================================
       HELPERS
       ========================================================= */
    const $ = (selector, parent = document) =>
        parent.querySelector(selector);
    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];
    const STORAGE_KEYS = {
        registration: "venusCompetitionRegistration",
        users: "venusUsers",
        currentUser: "venusCurrentUser",
        oldCurrentUser: "currentUser",
        profileUser: "venusUser",
        posts: "venusPosts"
    };
    const COMPETITION = {
        startMonth: 9,
        startDay: 1,
        closeMonth: 4,
        closeDay: 1,
        resultMonth: 4,
        resultDay: 24
    };
    const STAR_VALUES = {
        article: 1,
        volunteering: 3,
        project: 5,
        achievement: 5
    };
    /* =========================================================
       STORAGE
       ========================================================= */
    function readJSON(key, fallback = null) {
        try {
            const value = localStorage.getItem(key);
            if (!value) {
                return fallback;
            }
            return JSON.parse(value);
        } catch (error) {
            console.warn("Venus Competition: storage read error", error);
            return fallback;
        }
    }
    function writeJSON(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn("Venus Competition: storage write error", error);
            return false;
        }
    }
    /* =========================================================
       CURRENT USER
       ========================================================= */
    function getCurrentUser() {
        const possibleKeys = [
            STORAGE_KEYS.currentUser,
            STORAGE_KEYS.oldCurrentUser,
            STORAGE_KEYS.profileUser
        ];
        for (const key of possibleKeys) {
            const user = readJSON(key, null);
            if (user && typeof user === "object") {
                return user;
            }
        }
        return {
            id: "demo_volunteer",
            name: "متطوع Venus",
            username: "venus_volunteer",
            age: 16,
            school: "",
            grade: "",
            governorate: "",
            teamId: null,
            teamName: "",
            stars: 0,
            avatar: ""
        };
    }
    function getUserId(user = getCurrentUser()) {
        return String(
            user?.id ||
            user?.uid ||
            user?.username ||
            user?.email ||
            "demo_volunteer"
        );
    }
    function getUserName(user = getCurrentUser()) {
        return (
            user?.name ||
            user?.displayName ||
            user?.fullName ||
            user?.username ||
            "متطوع Venus"
        );
    }
    /* =========================================================
       COMPETITION SEASON
       ========================================================= */
    function getSeasonForDate(date = new Date()) {
        const year = date.getFullYear();
        /*
         * Academic competition season:
         * September → April.
         *
         * September–December:
         * season starts in current year.
         *
         * January–April:
         * season started previous year.
         *
         * May–August:
         * next season has not started yet.
         */
        const month = date.getMonth() + 1;
        let startYear;
        if (month >= 9) {
            startYear = year;
        } else if (month <= 4) {
            startYear = year - 1;
        } else {
            startYear = year;
        }
        return {
            start: new Date(startYear, 8, 1),
            close: new Date(startYear + 1, 3, 1),
            result: new Date(startYear + 1, 3, 24)
        };
    }
    function getCompetitionState(date = new Date()) {
        const season = getSeasonForDate(date);
        if (date >= season.start && date < season.close) {
            return "open";
        }
        if (date >= season.close && date < season.result) {
            return "closed";
        }
        if (
            date >= season.result &&
            date < new Date(
                season.result.getFullYear(),
                8,
                1
            )
        ) {
            return "results";
        }
        return "upcoming";
    }
    function formatDate(date) {
        return new Intl.DateTimeFormat("ar-IQ", {
            year: "numeric",
            month: "long",
            day: "numeric"
        }).format(date);
    }
    /* =========================================================
       SEASON UI
       ========================================================= */
    function renderCompetitionStatus() {
        const status = $("#competitionStatus");
        const statusText = $("#competitionStatusText");
        if (!statusText) {
            return;
        }
        const state = getCompetitionState();
        const labels = {
            open: "المسابقة مفتوحة",
            closed: "انتهى التقديم",
            results: "النتائج منشورة",
            upcoming: "الموسم القادم قريباً"
        };
        statusText.textContent = labels[state];
        if (status) {
            status.dataset.state = state;
        }
    }
    function renderSeasonDates() {
        const season = getSeasonForDate();
        const start = $("#competitionStartDate");
        const close = $("#competitionCloseDate");
        const result = $("#competitionResultDate");
        if (start) {
            start.textContent = formatDate(season.start);
        }
        if (close) {
            close.textContent = formatDate(season.close);
        }
        if (result) {
            result.textContent = formatDate(season.result);
        }
    }
    /* =========================================================
       REGISTRATION STORAGE
       ========================================================= */
    function getRegistrations() {
        const registrations =
            readJSON(STORAGE_KEYS.registration, []);
        return Array.isArray(registrations)
            ? registrations
            : [];
    }
    function saveRegistrations(registrations) {
        writeJSON(
            STORAGE_KEYS.registration,
            registrations
        );
    }
    function getSeasonKey() {
        const season = getSeasonForDate();
        return `${season.start.getFullYear()}-${season.start.getFullYear() + 1}`;
    }
    function getUserRegistration(userId = getUserId()) {
        const registrations = getRegistrations();
        const seasonKey = getSeasonKey();
        return registrations.find(
            registration =>
                String(registration.userId) === String(userId) &&
                registration.season === seasonKey
        ) || null;
    }
    /* =========================================================
       REGISTRATION STATUS UI
       ========================================================= */
    function renderPersonalStatus() {
        const user = getCurrentUser();
        const registration = getUserRegistration();
        const name = $("#competitionUserName");
        const school = $("#competitionUserSchool");
        const stars = $("#competitionUserStars");
        const badge = $("#competitionRegistrationBadge");
        if (name) {
            name.textContent = getUserName(user);
        }
        if (school) {
            school.textContent =
                user.school ||
                "لم تتم إضافة المدرسة بعد";
        }
        if (stars) {
            stars.textContent =
                `${Number(user.stars || 0)} نجمة`;
        }
        if (badge) {
            if (registration) {
                badge.textContent = "تم التسجيل";
                badge.dataset.status = "registered";
            } else {
                badge.textContent = "غير مسجل";
                badge.dataset.status = "not-registered";
            }
        }
        renderUserAvatar(user);
    }
    function renderUserAvatar(user) {
        const avatar = $("#competitionUserAvatar");
        const initial = $("#competitionUserInitial");
        if (!avatar) {
            return;
        }
        if (user.avatar) {
            avatar.innerHTML = `
                <img
                    src="${escapeAttribute(user.avatar)}"
                    alt=""
                >
            `;
            return;
        }
        const letter =
            getUserName(user)
                .trim()
                .charAt(0) || "V";
        if (initial) {
            initial.textContent = letter;
        } else {
            avatar.textContent = letter;
        }
    }
    /* =========================================================
       REGISTRATION MODAL
       ========================================================= */
    const registrationModal =
        $("#competitionRegistrationModal");
    function openRegistrationModal() {
        const state = getCompetitionState();
        if (state !== "open") {
            showFormMessage(
                "التسجيل غير متاح حالياً لهذا الموسم.",
                "error"
            );
            return;
        }
        const existing = getUserRegistration();
        if (existing) {
            fillRegistrationForm(existing);
        } else {
            fillRegistrationFromProfile();
        }
        clearFormMessage();
        if (registrationModal) {
            registrationModal.classList.add("active");
            registrationModal.setAttribute(
                "aria-hidden",
                "false"
            );
            document.body.style.overflow = "hidden";
        }
    }
    function closeRegistrationModal() {
        if (!registrationModal) {
            return;
        }
        registrationModal.classList.remove("active");
        registrationModal.setAttribute(
            "aria-hidden",
            "true"
        );
        document.body.style.overflow = "";
    }
    function fillRegistrationFromProfile() {
        const user = getCurrentUser();
        setValue(
            "#competitionFullName",
            user.fullName || user.name || ""
        );
        setValue(
            "#competitionNickname",
            user.nickname || user.username || ""
        );
        setValue(
            "#competitionAge",
            user.age || ""
        );
        setValue(
            "#competitionGovernorate",
            user.governorate || ""
        );
        if (user.educationType) {
            setValue(
                "#competitionEducationType",
                user.educationType
            );
        }
    }
    function fillRegistrationForm(data) {
        setValue(
            "#competitionFullName",
            data.fullName || ""
        );
        setValue(
            "#competitionNickname",
            data.nickname || ""
        );
        setValue(
            "#competitionAge",
            data.age || ""
        );
        setValue(
            "#competitionGovernorate",
            data.governorate || ""
        );
        setValue(
            "#competitionEducationType",
            data.educationType || ""
        );
        setValue(
            "#competitionSchool",
            data.school || ""
        );
        setValue(
            "#competitionSchoolLevel",
            data.schoolLevel || ""
        );
        setValue(
            "#competitionUniversity",
            data.university || ""
        );
        const publicName =
            $("#competitionPublicName");
        if (publicName) {
            publicName.checked =
                data.publicName !== false;
        }
        const agreement =
            $("#competitionRulesAgreement");
        if (agreement) {
            agreement.checked = false;
        }
        updateEducationFields();
    }
    /* =========================================================
       EDUCATION FIELDS
       ========================================================= */
    function updateEducationFields() {
        const type =
            $("#competitionEducationType")?.value;
        const schoolFields =
            $("#competitionSchoolFields");
        const universityFields =
            $("#competitionUniversityFields");
        if (schoolFields) {
            schoolFields.style.display =
                type === "school"
                    ? ""
                    : "none";
        }
        if (universityFields) {
            universityFields.style.display =
                type === "university"
                    ? ""
                    : "none";
        }
    }
    /* =========================================================
       VALIDATION
       ========================================================= */
    function validateRegistration() {
        const fullName =
            $("#competitionFullName")?.value.trim();
        const nickname =
            $("#competitionNickname")?.value.trim();
        const age =
            Number($("#competitionAge")?.value);
        const governorate =
            $("#competitionGovernorate")?.value;
        const educationType =
            $("#competitionEducationType")?.value;
        const school =
            $("#competitionSchool")?.value.trim();
        const schoolLevel =
            $("#competitionSchoolLevel")?.value;
        const university =
            $("#competitionUniversity")?.value.trim();
        const agreement =
            $("#competitionRulesAgreement")?.checked;
        if (!fullName) {
            return {
                valid: false,
                message: "الاسم الثلاثي مطلوب للتسجيل."
            };
        }
        const nameParts =
            fullName.split(/\s+/).filter(Boolean);
        if (nameParts.length < 3) {
            return {
                valid: false,
                message:
                    "يرجى إدخال الاسم الثلاثي كاملاً."
            };
        }
        if (!age || age < 5 || age > 100) {
            return {
                valid: false,
                message:
                    "يرجى إدخال عمر صحيح."
            };
        }
        if (!governorate) {
            return {
                valid: false,
                message:
                    "اختيار المحافظة مطلوب."
            };
        }
        if (!educationType) {
            return {
                valid: false,
                message:
                    "يرجى اختيار نوع الدراسة."
            };
        }
        if (
            educationType === "school" &&
            (!school || !schoolLevel)
        ) {
            return {
                valid: false,
                message:
                    "يرجى إكمال معلومات المدرسة والمرحلة."
            };
        }
        if (
            educationType === "university" &&
            !university
        ) {
            return {
                valid: false,
                message:
                    "يرجى إدخال اسم الجامعة."
            };
        }
        if (!agreement) {
            return {
                valid: false,
                message:
                    "يجب الموافقة على شروط المسابقة."
            };
        }
        return {
            valid: true
        };
    }
    /* =========================================================
       SAVE REGISTRATION
       ========================================================= */
    function submitRegistration(event) {
        event.preventDefault();
        const state = getCompetitionState();
        if (state !== "open") {
            showFormMessage(
                "التسجيل مغلق حالياً.",
                "error"
            );
            return;
        }
        const validation =
            validateRegistration();
        if (!validation.valid) {
            showFormMessage(
                validation.message,
                "error"
            );
            return;
        }
        const user = getCurrentUser();
        const registration = {
            id: createId("competition"),
            userId: getUserId(user),
            season: getSeasonKey(),
            fullName:
                $("#competitionFullName").value.trim(),
            nickname:
                $("#competitionNickname").value.trim(),
            age:
                Number($("#competitionAge").value),
            governorate:
                $("#competitionGovernorate").value,
            educationType:
                $("#competitionEducationType").value,
            school:
                $("#competitionSchool")?.value.trim() || "",
            schoolLevel:
                $("#competitionSchoolLevel")?.value || "",
            university:
                $("#competitionUniversity")?.value.trim() || "",
            publicName:
                $("#competitionPublicName")?.checked !== false,
            registeredAt:
                new Date().toISOString()
        };
        const registrations =
            getRegistrations();
        const index =
            registrations.findIndex(
                item =>
                    String(item.userId) ===
                        String(registration.userId) &&
                    item.season ===
                        registration.season
            );
        if (index >= 0) {
            registrations[index] = registration;
        } else {
            registrations.push(registration);
        }
        saveRegistrations(registrations);
        showFormMessage(
            "تم تسجيل المشاركة بنجاح ✦",
            "success"
        );
        renderPersonalStatus();
        renderLeaderboards();
        setTimeout(() => {
            closeRegistrationModal();
        }, 900);
    }
    /* =========================================================
       FORM MESSAGES
       ========================================================= */
    function showFormMessage(message, type = "error") {
        const box =
            $("#competitionFormMessage");
        if (!box) {
            return;
        }
        box.textContent = message;
        box.className =
            `competition-form-message show ${type}`;
    }
    function clearFormMessage() {
        const box =
            $("#competitionFormMessage");
        if (!box) {
            return;
        }
        box.textContent = "";
        box.className =
            "competition-form-message";
    }
    /* =========================================================
       RULES MODAL
       ========================================================= */
    const rulesModal =
        $("#competitionRulesModal");
    function openRulesModal() {
        if (!rulesModal) {
            return;
        }
        rulesModal.classList.add("active");
        rulesModal.setAttribute(
            "aria-hidden",
            "false"
        );
        document.body.style.overflow = "hidden";
    }
    function closeRulesModal() {
        if (!rulesModal) {
            return;
        }
        rulesModal.classList.remove("active");
        rulesModal.setAttribute(
            "aria-hidden",
            "true"
        );
        document.body.style.overflow = "";
    }
    /* =========================================================
       LEADERBOARD DATA
       ========================================================= */
    function getPosts() {
        const posts =
            readJSON(STORAGE_KEYS.posts, []);
        return Array.isArray(posts)
            ? posts
            : [];
    }
    function getUsers() {
        const users =
            readJSON(STORAGE_KEYS.users, []);
        return Array.isArray(users)
            ? users
            : [];
    }
    function getRegisteredUsers() {
        const registrations =
            getRegistrations();
        const season =
            getSeasonKey();
        return registrations.filter(
            item => item.season === season
        );
    }
    /* =========================================================
       CALCULATE INDIVIDUAL STARS
       ========================================================= */
    function calculateUserCompetitionStars(userId) {
        const posts = getPosts();
        let total = 0;
        posts.forEach(post => {
            if (
                String(
                    post.userId ||
                    post.authorId ||
                    post.createdBy
                ) !== String(userId)
            ) {
                return;
            }
            const type =
                post.type || "article";
            total +=
                Number(
                    post.starsAwarded ??
                    STAR_VALUES[type] ??
                    0
                );
        });
        const users = getUsers();
        const storedUser =
            users.find(
                user =>
                    String(user.id) ===
                    String(userId)
            );
        /*
         * If posts don't exist yet but a user already has
         * stars from profile/feed, use that as fallback.
         */
        if (
            total === 0 &&
            storedUser &&
            Number(storedUser.stars) > 0
        ) {
            total = Number(storedUser.stars);
        }
        const currentUser =
            getCurrentUser();
        if (
            total === 0 &&
            String(getUserId(currentUser)) ===
                String(userId)
        ) {
            total = Number(currentUser.stars || 0);
        }
        return total;
    }
    /* =========================================================
       TEAM STARS
       ========================================================= */
    function calculateTeamCompetitionStars(team) {
        if (!team) {
            return 0;
        }
        if (
            window.VenusTeam &&
            typeof window.VenusTeam.calculateTeamStars ===
                "function"
        ) {
            return Number(
                window.VenusTeam.calculateTeamStars(team) || 0
            );
        }
        if (
            typeof team.stars === "number"
        ) {
            return team.stars;
        }
        const members =
            Array.isArray(team.members)
                ? team.members
                : [];
        return members.reduce(
            (total, member) =>
                total +
                calculateUserCompetitionStars(
                    member.id || member.userId
                ),
            0
        );
    }
    /* =========================================================
       GET ALL TEAMS
       ========================================================= */
    function getTeams() {
        if (
            window.VenusTeam &&
            typeof window.VenusTeam.getTeams ===
                "function"
        ) {
            return window.VenusTeam.getTeams();
        }
        const teams =
            readJSON("venusTeams", []);
        return Array.isArray(teams)
            ? teams
            : [];
    }
    /* =========================================================
       INDIVIDUAL LEADERBOARD
       ========================================================= */
    function buildIndividualLeaderboard() {
        const registrations =
            getRegisteredUsers();
        const users =
            getUsers();
        const currentUser =
            getCurrentUser();
        const entries = [];
        registrations.forEach(registration => {
            const user =
                users.find(
                    item =>
                        String(item.id) ===
                        String(registration.userId)
                ) ||
                (
                    String(getUserId(currentUser)) ===
                    String(registration.userId)
                        ? currentUser
                        : null
                );
            const stars =
                calculateUserCompetitionStars(
                    registration.userId
                );
            entries.push({
                id: registration.userId,
                name:
                    registration.
                    publicName === false
                        ? (
                            registration.nickname ||
                            "مشارك"
                        )
                        : (
                            registration.fullName ||
                            user?.name ||
                            registration.nickname ||
                            "مشارك"
                        ),
                school:
                    registration.school ||
                    registration.university ||
                    "",
                avatar:
                    user?.avatar || "",
                stars
            });
        });
        /*
         * Demo/current user is included if registered but
         * not found in venusUsers.
         */
        return entries.sort(
            (a, b) =>
                b.stars - a.stars ||
                a.name.localeCompare(
                    b.name,
                    "ar"
                )
        );
    }
    /* =========================================================
       TEAM LEADERBOARD
       ========================================================= */
    function buildTeamLeaderboard() {
        const teams =
            getTeams();
        return teams
            .map(team => ({
                id: team.id,
                name:
                    team.name ||
                    "فريق بدون اسم",
                description:
                    team.description || "",
                avatar:
                    team.avatar || "",
                stars:
                    calculateTeamCompetitionStars(team),
                members:
                    Array.isArray(team.members)
                        ? team.members.length
                        : 0
            }))
            .sort(
                (a, b) =>
                    b.stars - a.stars ||
                    a.name.localeCompare(
                        b.name,
                        "ar"
                    )
            );
    }
    /* =========================================================
       RENDER INDIVIDUAL LEADERBOARD
       ========================================================= */
    function renderIndividualLeaderboard() {
        const container =
            $("#individualLeaderboardList");
        const empty =
            $("#individualLeaderboardEmpty");
        if (!container) {
            return;
        }
        const entries =
            buildIndividualLeaderboard();
        if (!entries.length) {
            container.innerHTML = "";
            if (empty) {
                empty.style.display = "";
            }
            return;
        }
        if (empty) {
            empty.style.display = "none";
        }
        container.innerHTML =
            entries.map(
                (entry, index) =>
                    createRankingItem(
                        entry,
                        index + 1,
                        "individual"
                    )
            ).join("");
    }
    /* =========================================================
       RENDER TEAM LEADERBOARD
       ========================================================= */
    function renderTeamLeaderboard() {
        const container =
            $("#teamLeaderboardList");
        const empty =
            $("#teamLeaderboardEmpty");
        if (!container) {
            return;
        }
        const entries =
            buildTeamLeaderboard();
        if (!entries.length) {
            container.innerHTML = "";
            if (empty) {
                empty.style.display = "";
            }
            return;
        }
        if (empty) {
            empty.style.display = "none";
        }
        container.innerHTML =
            entries.map(
                (entry, index) =>
                    createRankingItem(
                        entry,
                        index + 1,
                        "team"
                    )
            ).join("");
    }
    /* =========================================================
       RANKING ITEM
       ========================================================= */
    function createRankingItem(
        entry,
        position,
        type
    ) {
        const topClass =
            position <= 3
                ? "top"
                : "";
        const avatar =
            entry.avatar
                ? `
                    <img
                        src="${escapeAttribute(entry.avatar)}"
                        alt=""
                    >
                `
                : escapeHTML(
                    entry.name
                        .trim()
                        .charAt(0) || "V"
                );
        const meta =
            type === "team"
                ? `${entry.members} أعضاء`
                : (
                    entry.school ||
                    "مشارك في المسابقة"
                );
        return `
            <div
                class="competition-ranking-item"
                data-ranking-id="${escapeAttribute(entry.id)}"
            >
                <div
                    class="competition-ranking-position ${topClass}"
                >
                    ${position}
                </div>
                <div class="competition-ranking-avatar">
                    ${avatar}
                </div>
                <div class="competition-ranking-info">
                    <p class="competition-ranking-name">
                        ${escapeHTML(entry.name)}
                    </p>
                    <p class="competition-ranking-meta">
                        ${escapeHTML(meta)}
                    </p>
                </div>
                <div class="competition-ranking-stars">
                    ★ ${Number(entry.stars || 0)}
                </div>
            </div>
        `;
    }
    /* =========================================================
       RENDER ALL LEADERBOARDS
       ========================================================= */
    function renderLeaderboards() {
        renderIndividualLeaderboard();
        renderTeamLeaderboard();
    }
    /* =========================================================
       LEADERBOARD TABS
       ========================================================= */
    function setupLeaderboardTabs() {
        const tabs =
            $$(".competition-leaderboard-tab");
        if (!tabs.length) {
            return;
        }
        tabs.forEach(tab => {
            tab.addEventListener(
                "click",
                () => {
                    const selected =
                        tab.dataset.leaderboard;
                    tabs.forEach(item => {
                        item.classList.remove(
                            "active"
                        );
                        item.setAttribute(
                            "aria-selected",
                            "false"
                        );
                    });
                    tab.classList.add("active");
                    tab.setAttribute(
                        "aria-selected",
                        "true"
                    );
                    const individual =
                        $("#individualLeaderboard");
                    const teams =
                        $("#teamLeaderboard");
                    if (individual) {
                        individual.style.display =
                            selected === "individual"
                                ? ""
                                : "none";
                    }
                    if (teams) {
                        teams.style.display =
                            selected === "teams"
                                ? ""
                                : "none";
                    }
                }
            );
        });
        const active =
            tabs.find(
                tab =>
                    tab.classList.contains("active")
            ) || tabs[0];
        if (active) {
            active.click();
        }
    }
    /* =========================================================
       OPEN REGISTRATION BUTTON
       ========================================================= */
    function setupButtons() {
        const registerButton =
            $("#openCompetitionRegistration");
        if (registerButton) {
            registerButton.addEventListener(
                "click",
                openRegistrationModal
            );
        }
        const rulesButton =
            $("#openCompetitionRules");
        if (rulesButton) {
            rulesButton.addEventListener(
                "click",
                openRulesModal
            );
        }
        const fullRulesButton =
            $("#viewFullRules");
        if (fullRulesButton) {
            fullRulesButton.addEventListener(
                "click",
                openRulesModal
            );
        }
        const closeRegistration =
            $("#closeCompetitionRegistration");
        if (closeRegistration) {
            closeRegistration.addEventListener(
                "click",
                closeRegistrationModal
            );
        }
        const closeRegistrationOverlay =
            $("#closeCompetitionRegistrationOverlay");
        if (closeRegistrationOverlay) {
            closeRegistrationOverlay.addEventListener(
                "click",
                closeRegistrationModal
            );
        }
        const closeRules =
            $("#closeCompetitionRules");
        if (closeRules) {
            closeRules.addEventListener(
                "click",
                closeRulesModal
            );
        }
        const closeRulesOverlay =
            $("#closeCompetitionRulesOverlay");
        if (closeRulesOverlay) {
            closeRulesOverlay.addEventListener(
                "click",
                closeRulesModal
            );
        }
    }
    /* =========================================================
       FORM EVENTS
       ========================================================= */
    function setupForm() {
        const form =
            $("#competitionRegistrationForm");
        if (form) {
            form.addEventListener(
                "submit",
                submitRegistration
            );
        }
        const educationType =
            $("#competitionEducationType");
        if (educationType) {
            educationType.addEventListener(
                "change",
                updateEducationFields
            );
        }
        updateEducationFields();
    }
    /* =========================================================
       ESC KEY
       ========================================================= */
    function setupEscapeKey() {
        document.addEventListener(
            "keydown",
            event => {
                if (event.key !== "Escape") {
                    return;
                }
                closeRegistrationModal();
                closeRulesModal();
            }
        );
    }
    /* =========================================================
       STORAGE / OTHER VENUS EVENTS
       ========================================================= */
    function setupExternalEvents() {
        window.addEventListener(
            "storage",
            event => {
                if (
                    [
                        STORAGE_KEYS.posts,
                        STORAGE_KEYS.users,
                        STORAGE_KEYS.currentUser,
                        "venusTeams",
                        STORAGE_KEYS.registration
                    ].includes(event.key)
                ) {
                    refresh();
                }
            }
        );
        window.addEventListener(
            "venus:feedUpdated",
            refresh
        );
        window.addEventListener(
            "venus:rankingsRefresh",
            refresh
        );
        window.addEventListener(
            "venus:profileUpdated",
            refresh
        );
    }
    /* =========================================================
       REFRESH
       ========================================================= */
    function refresh() {
    renderCompetitionStatus();
        renderSeasonDates();
        renderPersonalStatus();
        renderLeaderboards();
    }
    /* =========================================================
       UTILS
       ========================================================= */
    function setValue(selector, value) {
        const element = $(selector);
        if (element) {
            element.value = value ?? "";
        }
    }
    function createId(prefix = "id") {
        return (
            prefix +
            "_" +
            Date.now().toString(36) +
            "_" +
            Math.random()
                .toString(36)
                .slice(2, 8)
        );
    }
    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    function escapeAttribute(value) {
        return escapeHTML(value);
    }
    /* =========================================================
       PUBLIC API
       ========================================================= */
    window.VenusCompetition = {
        getSeasonForDate,
        getCompetitionState,
        getRegistrations,
        getUserRegistration,
        openRegistrationModal,
        closeRegistrationModal,
        openRulesModal,
        closeRulesModal,
        submitRegistration,
        calculateUserCompetitionStars,
        calculateTeamCompetitionStars,
        buildIndividualLeaderboard,
        buildTeamLeaderboard,
        renderIndividualLeaderboard,
        renderTeamLeaderboard,
        renderLeaderboards,
        refresh
    };
    /* =========================================================
       INIT
       ========================================================= */
    setupButtons();
    setupForm();
    setupLeaderboardTabs();
    setupEscapeKey();
    setupExternalEvents();
    refresh();
});
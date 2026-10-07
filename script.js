document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* =========================================================
       VENUS — MAIN SCRIPT
       LOCAL MVP
       ========================================================= */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];

    /* =========================================================
       STORAGE
       ========================================================= */

    const KEYS = {
        profile: "venusProfile",
        posts: "venusPosts",
        achievements: "venusAchievements",
        teams: "venusTeams",
        ideas: "venusIdeas",
        settings: "venusSettings"
    };

    function getData(key, fallback) {
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : fallback;
        } catch (error) {
            console.error("VENUS storage error:", error);
            return fallback;
        }
    }

    function saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error("VENUS save error:", error);
        }
    }

    function createId(prefix = "venus") {
        return (
            prefix +
            "_" +
            Date.now() +
            "_" +
            Math.random().toString(36).slice(2, 8)
        );
    }

    function escapeHTML(value = "") {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function formatDate(date) {
        return new Intl.DateTimeFormat("ar-IQ", {
            year: "numeric",
            month: "short",
            day: "numeric"
        }).format(new Date(date || Date.now()));
    }

    function getCurrentProfile() {
        return getData(KEYS.profile, {
            fullName: " متطوع VENUS",
            nickname: "",
            username: "volunteer",
            age: "",
            institution: "ثانوي",
            school: "مدرستي",
            governorate: "بغداد",
            future: "",
            privacy: "public",
            avatar: "",
            stars: 0,
            team: ""
        });
    }

    function saveCurrentProfile(profile) {
        saveData(KEYS.profile, profile);
    }

    function getUsername() {
        return getCurrentProfile().username || "volunteer";
    }

    function getDisplayName() {
        const profile = getCurrentProfile();

        return (
            profile.nickname ||
            profile.fullName ||
            profile.username ||
            " متطوع VENUS"
        );
    }

    function formatMentions(text = "") {
        return escapeHTML(text).replace(
            /@([a-zA-Z0-9_.-]+)/g,
            '<span class="mention">@$1</span>'
        );
    }

    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;

            reader.readAsDataURL(file);
        });
    }

    /* =========================================================
       MODALS
       ========================================================= */

    function showModal(modal) {
        if (typeof modal === "string") {
            modal = $("#" + modal);
        }

        if (!modal) return;

        modal.classList.add("active");
        document.body.classList.add("modal-open");
    }

    function hideModal(modal) {
        if (typeof modal === "string") {
            modal = $("#" + modal);
        }

        if (!modal) return;

        modal.classList.remove("active");

        if (!$(".venus-modal.active")) {
            document.body.classList.remove("modal-open");
        }
    }

    function showMessage(title, text, icon = "✦") {
    const titleEl = $("#messageTitle");
        const textEl = $("#messageText");
        const iconEl = $("#messageIcon");

        if (titleEl) titleEl.textContent = title;
        if (textEl) textEl.textContent = text;
        if (iconEl) iconEl.textContent = icon;

        showModal("messageModal");
    }

    function closeAllModals() {
        $$(".venus-modal.active").forEach(modal => {
            modal.classList.remove("active");
        });

        document.body.classList.remove("modal-open");
    }

    document.addEventListener("click", event => {
        const closeButton = event.target.closest(
            "[data-close-modal]"
        );

        if (closeButton) {
            const modal = closeButton.closest(".venus-modal");

            if (modal) {
                hideModal(modal);
            }
        }

        if (
            event.target.classList.contains("venus-modal")
        ) {
            hideModal(event.target);
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeAllModals();
        }
    });

    /* =========================================================
       DYNAMIC PROFILE STYLES
       ========================================================= */

    function addDynamicStyles() {
        if ($("#venusDynamicStyles")) return;

        const style = document.createElement("style");

        style.id = "venusDynamicStyles";

        style.textContent = `
            .venus-dynamic-page {
                min-height: 100vh;
                padding: 35px 20px 100px;
                background:
                    radial-gradient(
                        circle at top right,
                        rgba(201,154,61,.12),
                        transparent 30%
                    ),
                    radial-gradient(
                        circle at bottom left,
                        rgba(134,28,39,.10),
                        transparent 35%
                    ),
                    var(--ivory, #f7f0df);
            }

            .venus-page-inner {
                width: min(1050px, 100%);
                margin: auto;
            }

            .venus-profile-card {
                overflow: hidden;
                border-radius: 30px;
                background: var(--cream, #fffaf0);
                border: 1px solid rgba(155,107,31,.22);
                box-shadow: 0 20px 60px rgba(75,13,19,.12);
            }

            .profile-decoration {
                height: 110px;
                position: relative;
                background:
                    linear-gradient(
                        135deg,
                        #4b0d13,
                        #861c27,
                        #650f18
                    );
            }

            .profile-decoration::after {
                content: "✦  ✧  ✦  ✧  ✦";
                position: absolute;
                inset: 0;
                display: grid;
                place-items: center;
                color: rgba(241,220,155,.55);
                font-size: 28px;
                letter-spacing: 12px;
            }

            .profile-body {
                padding: 0 30px 30px;
            }

            .profile-top {
                display: flex;
                align-items: flex-end;
                gap: 20px;
                margin-top: -48px;
                position: relative;
                z-index: 2;
            }

            .profile-avatar {
                width: 110px;
                height: 110px;
                flex-shrink: 0;
                border-radius: 50%;
                overflow: hidden;
                background: linear-gradient(
                    135deg,
                    #861c27,
                    #c99a3d
                );
                border: 5px solid #fffaf0;
                box-shadow: 0 10px 30px rgba(75,13,19,.25);
                display: grid;
                place-items: center;
                position: relative;
            }

            .profile-avatar img {
            width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .profile-avatar-text {
                color: white;
                font-size: 40px;
                font-weight: 800;
            }

            .avatar-edit {
                position: absolute;
                bottom: 3px;
                right: 3px;
                width: 30px;
                height: 30px;
                border: 2px solid white;
                border-radius: 50%;
                background: #c99a3d;
                color: #4b0d13;
                cursor: pointer;
            }

            .profile-main {
                flex: 1;
            }

            .profile-name {
                margin: 0 0 4px;
                color: #4b0d13;
                font-size: 28px;
            }

            .profile-username {
                margin: 0;
                color: #8b716d;
            }

            .profile-stars {
                display: flex;
                align-items: center;
                gap: 7px;
                padding: 10px 15px;
                border-radius: 18px;
                background: rgba(201,154,61,.13);
                color: #7b5818;
                font-weight: 800;
                white-space: nowrap;
            }

            .profile-stars::before {
                content: "✦";
                font-size: 21px;
            }

            .profile-details {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;
                margin-top: 25px;
            }

            .profile-detail {
                padding: 15px;
                border-radius: 17px;
                background: rgba(242,232,210,.58);
                border: 1px solid rgba(155,107,31,.12);
            }

            .profile-detail strong {
                display: block;
                margin-bottom: 5px;
                color: #4b0d13;
            }

            .profile-detail span {
                color: #78655f;
                font-size: 14px;
            }

            .profile-actions {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                margin-top: 20px;
            }

            .venus-dynamic-button {
                border: 0;
                border-radius: 13px;
                padding: 11px 17px;
                cursor: pointer;
                font-family: inherit;
                font-weight: 700;
                background: #861c27;
                color: white;
            }

            .venus-dynamic-button:hover {
                transform: translateY(-2px);
            }

            .venus-dynamic-button.secondary {
                background: rgba(201,154,61,.15);
                color: #6f4e12;
            }

            .profile-tabs {
                display: flex;
                gap: 4px;
                overflow-x: auto;
                margin-top: 28px;
                border-bottom: 1px solid rgba(155,107,31,.18);
            }

            .profile-tab {
                border: 0;
                background: transparent;
                color: #806d67;
                padding: 13px 15px;
                cursor: pointer;
                font-family: inherit;
                font-weight: 700;
                white-space: nowrap;
            }

            .profile-tab.active {
                color: #861c27;
                border-bottom: 3px solid #c99a3d;
            }

            .profile-post {
                margin-top: 16px;
                padding: 20px;
                border: 1px solid rgba(155,107,31,.15);
                border-radius: 20px;
                background: white;
            }

            .profile-post-head {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
            }

            .profile-post h3 {
                margin: 0;
                color: #4b0d13;
            }

            .profile-post p {
            color: #5f514d;
                line-height: 1.8;
                white-space: pre-wrap;
            }

            .profile-post-date {
                color: #95847e;
                font-size: 12px;
                white-space: nowrap;
            }

            .profile-post-type {
                display: inline-block;
                margin-top: 8px;
                padding: 5px 10px;
                border-radius: 30px;
                background: #f4ead4;
                color: #7a5517;
                font-size: 12px;
            }

            .profile-post-actions {
                display: flex;
                gap: 15px;
                margin-top: 15px;
                padding-top: 12px;
                border-top: 1px solid #eee3d0;
            }

            .profile-action-button {
                border: 0;
                background: transparent;
                color: #78655f;
                cursor: pointer;
                font-family: inherit;
            }

            .profile-action-button:hover {
                color: #861c27;
            }

            .feed-comment {
                margin-top: 8px;
                padding: 8px 11px;
                border-radius: 10px;
                background: #f7f0df;
                font-size: 13px;
            }

            .mention {
                color: #861c27;
                font-weight: 800;
            }

            .empty-profile {
                text-align: center;
                padding: 45px 20px;
                color: #89766f;
            }

            .venus-form-group {
                margin-bottom: 15px;
            }

            .venus-form-group label {
                display: block;
                margin-bottom: 7px;
                color: #4b0d13;
                font-weight: 700;
            }

            .venus-form-group input,
            .venus-form-group select,
            .venus-form-group textarea {
                width: 100%;
                box-sizing: border-box;
                border: 1px solid rgba(155,107,31,.25);
                background: #fffdf7;
                border-radius: 12px;
                padding: 12px;
                font-family: inherit;
                outline: none;
            }

            .venus-form-group textarea {
                min-height: 120px;
                resize: vertical;
            }

            .venus-form-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 14px;
            }

            .venus-form-grid .full {
                grid-column: 1 / -1;
            }

            .customization-preview {
                padding: 25px;
                border-radius: 20px;
                margin-bottom: 20px;
                text-align: center;
            }

            .customization-section {
                margin-top: 20px;
            }

            .customization-section h4 {
                color: #4b0d13;
                margin-bottom: 10px;
            }

            .color-options,
            .background-options,
            .frame-options {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }

            .custom-option {
                border: 2px solid transparent;
                cursor: pointer;
                border-radius: 12px;
                font-family: inherit;
            }

            .custom-option.selected {
                border-color: #c99a3d;
                box-shadow: 0 0 0 3px rgba(201,154,61,.18);
            }

            .color-option {
                width: 44px;
                height: 44px;
                border-radius: 50%;
            }

            .background-option,
            .frame-option {
                padding: 10px 14px;
                color: #4b0d13;
            }

            .frame-gold {
                box-shadow: inset 0 0 0 4px #c99a3d;
            }

            .frame-red {
                box-shadow: inset 0 0 0 4px #861c27;
            }

            .frame-royal {
            box-shadow: inset 0 0 0 4px #3d2a4f;
            }

            @media (max-width: 700px) {
                .profile-body {
                    padding: 0 18px 22px;
                }

                .profile-top {
                    flex-wrap: wrap;
                    align-items: center;
                }

                .profile-stars {
                    margin-top: 5px;
                }

                .profile-details {
                    grid-template-columns: 1fr;
                }

                .venus-form-grid {
                    grid-template-columns: 1fr;
                }

                .venus-form-grid .full {
                    grid-column: auto;
                }
            }
        `;

        document.head.appendChild(style);
    }

    addDynamicStyles();

    /* =========================================================
       PROFILE CUSTOMIZATION
       ========================================================= */

    const profileColors = [
        "#4b0d13",
        "#650f18",
        "#861c27",
        "#a52a35",
        "#7b3f00",
        "#5c3b1e",
        "#3d2a4f",
        "#243447"
    ];

    const profileBackgrounds = [
        {
            id: "royal-red",
            name: "Royal Red",
            value: "linear-gradient(135deg,#4b0d13,#861c27)"
        },
        {
            id: "ancient-gold",
            name: "Ancient Gold",
            value: "linear-gradient(135deg,#9b6b1f,#e4c16b)"
        },
        {
            id: "velvet",
            name: "Velvet",
            value: "linear-gradient(135deg,#650f18,#3d2a4f)"
        },
        {
            id: "night-palace",
            name: "Night Palace",
            value: "linear-gradient(135deg,#18212f,#3d2a4f)"
        },
        {
            id: "ivory",
            name: "Ivory",
            value: "linear-gradient(135deg,#f2e8d2,#fffaf0)"
        }
    ];

    function getCustomization() {
        return getData(KEYS.settings, {
            profileColor: "#861c27",
            background: "royal-red",
            frame: "gold"
        });
    }

    function getFrameClass(frame) {
        if (frame === "gold") return "frame-gold";
        if (frame === "red") return "frame-red";
        if (frame === "royal") return "frame-royal";
        return "";
    }

    function openProfileCustomization() {
        const settings = getCustomization();

        const modal = document.createElement("div");

        modal.className = "venus-modal active";

        modal.innerHTML = `
            <div class="venus-modal-content">

                <button
                    class="venus-modal-close"
                    data-custom-close
                >
                    ×
                </button>

                <h2>تخصيص الملف الشخصي</h2>

                <p>
                    خلي صفحتك تشبهك ✦
                </p>

                <div
                    class="customization-preview"
                    id="customizationPreview"
                    style="
                        background:${
                            profileBackgrounds.find(
                                bg =>
                                    bg.id ===
                                    settings.background
                            )?.value ||
                            profileBackgrounds[0].value
                        };
                    "
                >
                    <div
                        id="previewAvatar"
                        style="
                            width:75px;
                            height:75px;
                            margin:auto;
                            border-radius:50%;
                            background:${settings.profileColor};
                            border:5px solid white;
                        "
                    ></div>

                    <strong
                        style="
                            display:block;
                            margin-top:10px;
                            color:white;
                        "
                        >
                        ${escapeHTML(getDisplayName())}
                    </strong>
                </div>

                <div class="customization-section">

                    <h4>لون الملف</h4>

                    <div class="color-options">

                        ${profileColors
                            .map(
                                color => `
                                <button
                                    type="button"
                                    class="custom-option color-option ${
                                        settings.profileColor ===
                                        color
                                            ? "selected"
                                            : ""
                                    }"
                                    data-color="${color}"
                                    style="
                                        background:${color};
                                    "
                                ></button>
                            `
                            )
                            .join("")}

                    </div>
                </div>

                <div class="customization-section">

                    <h4>الخلفية</h4>

                    <div class="background-options">

                        ${profileBackgrounds
                            .map(
                                bg => `
                                <button
                                    type="button"
                                    class="custom-option background-option ${
                                        settings.background ===
                                        bg.id
                                            ? "selected"
                                            : ""
                                    }"
                                    data-background="${bg.id}"
                                    style="
                                        background:${bg.value};
                                        color:${
                                            bg.id ===
                                            "ivory"
                                                ? "#4b0d13"
                                                : "#fff"
                                        };
                                    "
                                >
                                    ${bg.name}
                                </button>
                            `
                            )
                            .join("")}

                    </div>
                </div>

                <div class="customization-section">

                    <h4>إطار الصورة</h4>

                    <div class="frame-options">

                        <button
                            type="button"
                            class="custom-option frame-option"
                            data-frame="none"
                        >
                            بدون إطار
                        </button>

                        <button
                            type="button"
                            class="custom-option frame-option frame-gold"
                            data-frame="gold"
                        >
                            ذهبي
                        </button>

                        <button
                            type="button"
                            class="custom-option frame-option frame-red"
                            data-frame="red"
                        >
                            أحمر
                        </button>

                        <button
                            type="button"
                            class="custom-option frame-option frame-royal"
                            data-frame="royal"
                        >
                            ملكي
                        </button>

                    </div>
                </div>

                <div style="margin-top:25px;">
                <button
                        class="venus-dynamic-button"
                        id="saveCustomization"
                    >
                        حفظ التخصيص
                    </button>

                </div>

            </div>
        `;

        document.body.appendChild(modal);

        let draft = { ...settings };

        function refresh() {
            const preview = $(
                "#customizationPreview",
                modal
            );

            const avatar = $(
                "#previewAvatar",
                modal
            );

            const background =
                profileBackgrounds.find(
                    bg =>
                        bg.id ===
                        draft.background
                ) ||
                profileBackgrounds[0];

            preview.style.background =
                background.value;

            avatar.style.background =
                draft.profileColor;

            $$("[data-color]", modal).forEach(
                button => {
                    button.classList.toggle(
                        "selected",
                        button.dataset.color ===
                            draft.profileColor
                    );
                }
            );

            $$("[data-background]", modal).forEach(
                button => {
                    button.classList.toggle(
                        "selected",
                        button.dataset.background ===
                            draft.background
                    );
                }
            );

            $$("[data-frame]", modal).forEach(
                button => {
                    button.classList.toggle(
                        "selected",
                        button.dataset.frame ===
                            draft.frame
                    );
                }
            );
        }

        refresh();

        modal.addEventListener("click", event => {
            if (
                event.target.closest(
                    "[data-custom-close]"
                )
            ) {
                modal.remove();
                return;
            }

            const color =
                event.target.closest(
                    "[data-color]"
                );

            const background =
                event.target.closest(
                    "[data-background]"
                );

            const frame =
                event.target.closest(
                    "[data-frame]"
                );

            if (color) {
                draft.profileColor =
                    color.dataset.color;

                refresh();
            }

            if (background) {
                draft.background =
                    background.dataset.background;

                refresh();
            }

            if (frame) {
                draft.frame =
                    frame.dataset.frame;

                refresh();
            }

            if (
                event.target.closest(
                    "#saveCustomization"
                )
            ) {
                saveData(
                    KEYS.settings,
                    draft
                );

                modal.remove();

                renderProfilePage();

                showMessage(
                    "تم الحفظ",
                    "تم تحديث شكل ملفك الشخصي.",
                    "✦"
                );
            }
        });
    }

    /* =========================================================
       PROFILE EDITOR
       ========================================================= */

    function openProfileEditor() {
        const profile = getCurrentProfile();

        const modal = document.createElement("div");

        modal.className = "venus-modal active";

        modal.innerHTML = `
            <div class="venus-modal-content">

                <button
                    class="venus-modal-close"
                    data-editor-close
                >
                    ×
                </button>
                <h2>تعديل الملف الشخصي</h2>

                <p>
                    معلوماتك الأساسية في VENUS
                </p>

                <form id="profileEditorForm">

                    <div class="venus-form-group">

                        <label>
                            الاسم الثلاثي *
                        </label>

                        <input
                            id="editFullName"
                            required
                            value="${escapeHTML(
                                profile.fullName || ""
                            )}"
                            placeholder="الاسم الأول واسم الأب واسم العائلة"
                        >

                    </div>

                    <div class="venus-form-group">

                        <label>
                            الاسم المستعار
                        </label>

                        <input
                            id="editNickname"
                            value="${escapeHTML(
                                profile.nickname || ""
                            )}"
                            placeholder="اختياري"
                        >

                    </div>

                    <div class="venus-form-grid">

                        <div class="venus-form-group">

                            <label>
                                اسم المستخدم *
                            </label>

                            <input
                                id="editUsername"
                                required
                                value="${escapeHTML(
                                    profile.username || ""
                                )}"
                            >

                        </div>

                        <div class="venus-form-group">

                            <label>
                                العمر *
                            </label>

                            <input
                                id="editAge"
                                type="number"
                                min="5"
                                max="100"
                                required
                                value="${escapeHTML(
                                    profile.age || ""
                                )}"
                            >

                        </div>

                        <div class="venus-form-group">

                            <label>
                                المرحلة *
                            </label>

                            <select
                                id="editInstitution"
                                required
                            >
                                <option value="ابتدائي">
                                    ابتدائي
                                </option>

                                <option value="اعدادي">
                                    اعدادي
                                </option>

                                <option value="ثانوي">
                                    ثانوي
                                </option>

                                <option value="جامعة">
                                    جامعة
                                </option>
                            </select>

                        </div>

                        <div class="venus-form-group">

                            <label>
                                المحافظة *
                            </label>

                            <input
                                id="editGovernorate"
                                required
                                value="${escapeHTML(
                                    profile.governorate || ""
                                )}"
                            >

                        </div>

                        <div class="venus-form-group full">

                            <label>
                                المدرسة / الجامعة *
                            </label>
                            <input
                                id="editSchool"
                                required
                                value="${escapeHTML(
                                    profile.school || ""
                                )}"
                            >

                        </div>

                        <div class="venus-form-group full">

                            <label>
                                ماذا تريد أن تكون في المستقبل؟
                            </label>

                            <input
                                id="editFuture"
                                value="${escapeHTML(
                                    profile.future || ""
                                )}"
                                placeholder="مثلاً: طبيبة، مهندسة، فنانة..."
                            >

                        </div>

                        <div class="venus-form-group full">

                            <label>
                                الخصوصية
                            </label>

                            <select id="editPrivacy">

                                <option value="public">
                                    اسمي الحقيقي ظاهر
                                </option>

                                <option value="private">
                                    إظهار اسم المستخدم فقط
                                </option>

                            </select>

                        </div>

                    </div>

                    <button
                        type="submit"
                        class="venus-dynamic-button"
                    >
                        حفظ المعلومات
                    </button>

                </form>

            </div>
        `;

        document.body.appendChild(modal);

        $("#editInstitution", modal).value =
            profile.institution || "ثانوي";

        $("#editPrivacy", modal).value =
            profile.privacy || "public";

        modal.addEventListener("click", event => {
            if (
                event.target.closest(
                    "[data-editor-close]"
                )
            ) {
                modal.remove();
            }
        });

        $("#profileEditorForm", modal).addEventListener(
            "submit",
            event => {
                event.preventDefault();

                const updated = {
                    ...profile,

                    fullName:
                        $("#editFullName", modal)
                            .value.trim(),

                    nickname:
                        $("#editNickname", modal)
                            .value.trim(),

                    username:
                        $("#editUsername", modal)
                            .value.trim()
                            .replace(/\s+/g, "_"),

                    age:
                        $("#editAge", modal)
                            .value,

                    institution:
                        $("#editInstitution", modal)
                            .value,

                    school:
                        $("#editSchool", modal)
                            .value.trim(),

                    governorate:
                        $("#editGovernorate", modal)
                            .value.trim(),

                    future:
                        $("#editFuture", modal)
                            .value.trim(),

                    privacy:
                        $("#editPrivacy", modal)
                            .value
                };

                if (
                    !updated.fullName ||
                    !updated.username ||
                    !updated.age ||
                    !updated.school ||
                    !updated.governorate
                ) {
                    showMessage(
                        "معلومات ناقصة",
                        "املي جميع الحقول المطلوبة.",
                        "!"
                    );

                    return;
                }
                saveCurrentProfile(updated);

                modal.remove();

                renderProfilePage();

                showMessage(
                    "تم تحديث الملف",
                    "تم حفظ معلوماتك بنجاح.",
                    "✦"
                );
            }
        );
    }

    /* =========================================================
       AVATAR
       ========================================================= */

    function openAvatarPicker() {
        const input =
            document.createElement("input");

        input.type = "file";
        input.accept = "image/*";

        input.addEventListener(
            "change",
            async () => {
                const file =
                    input.files?.[0];

                if (!file) return;

                try {
                    const avatar =
                        await readFileAsDataURL(
                            file
                        );

                    const profile =
                        getCurrentProfile();

                    profile.avatar = avatar;

                    saveCurrentProfile(
                        profile
                    );

                    renderProfilePage();

                    showMessage(
                        "تم تغيير الصورة",
                        "تم تحديث صورة ملفك الشخصي.",
                        "♡"
                    );
                } catch (error) {
                    console.error(error);

                    showMessage(
                        "حدث خطأ",
                        "لم نتمكن من تحميل الصورة.",
                        "!"
                    );
                }
            }
        );

        input.click();
    }

    /* =========================================================
       PROFILE PAGE
       ========================================================= */

    function renderProfilePage() {
        $$(".venus-dynamic-page").forEach(
            page => page.remove()
        );

        const profile =
            getCurrentProfile();

        const posts =
            getData(KEYS.posts, []);

        const achievements =
            getData(
                KEYS.achievements,
                []
            );

        const username =
            profile.username ||
            "volunteer";

        const myPosts =
            posts.filter(
                post =>
                    String(
                        post.username || ""
                    ).toLowerCase() ===
                    username.toLowerCase()
            );

        const myAchievements =
            achievements.filter(
                item =>
                    String(
                        item.username || ""
                    ).toLowerCase() ===
                    username.toLowerCase()
            );

        const settings =
            getCustomization();

        const background =
            profileBackgrounds.find(
                bg =>
                    bg.id ===
                    settings.background
            ) ||
            profileBackgrounds[0];

        const page =
            document.createElement("section");

        page.className =
            "venus-dynamic-page";

        page.id =
            "venusProfilePage";

        const displayName =
            profile.nickname ||
            profile.fullName ||
            username;

        const initial =
            displayName
                .trim()
                .charAt(0)
                .toUpperCase() ||
            "V";

        page.innerHTML = `
            <div class="venus-page-inner">

                <div class="venus-profile-card">

                    <div
                        class="profile-decoration"
                        style="
                            background:${background.value};
                        "
                    ></div>

                    <div class="profile-body">

                        <div class="profile-top">

                            <div
                            class="profile-avatar ${getFrameClass(
                                    settings.frame
                                )}"
                            >

                                ${
                                    profile.avatar
                                        ? `
                                        <img
                                            src="${profile.avatar}"
                                            alt="صورة الملف"
                                        >
                                    `
                                        : `
                                        <span class="profile-avatar-text">
                                            ${escapeHTML(initial)}
                                        </span>
                                    `
                                }

                                <button
                                    class="avatar-edit"
                                    id="changeAvatarButton"
                                    title="تغيير الصورة"
                                >
                                    ✎
                                </button>

                            </div>

                            <div class="profile-main">

                                <h1 class="profile-name">
                                    ${escapeHTML(
                                        displayName
                                    )}
                                </h1>

                                <p class="profile-username">
                                    @${escapeHTML(
                                        username
                                    )}
                                </p>

                            </div>

                            <div class="profile-stars">
                                ${Number(
                                    profile.stars || 0
                                )}
                                Venus Stars
                            </div>

                        </div>

                        <div class="profile-details">

                            <div class="profile-detail">
                                <strong>
                                    العمر
                                </strong>
                                <span>
                                    ${escapeHTML(
                                        profile.age ||
                                            "غير محدد"
                                    )}
                                </span>
                            </div>

                            <div class="profile-detail">
                                <strong>
                                    الدراسة
                                </strong>
                                <span>
                                    ${escapeHTML(
                                        profile.school ||
                                            "غير محددة"
                                    )}
                                </span>
                            </div>

                            <div class="profile-detail">
                                <strong>
                                    المحافظة
                                </strong>
                                <span>
                                    ${escapeHTML(
                                        profile.governorate ||
                                            "غير محددة"
                                    )}
                                </span>
                            </div>

                            <div class="profile-detail">
                                <strong>
                                    الفريق
                                </strong>
                                <span>
                                    ${escapeHTML(
                                        profile.team ||
                                            "لا يوجد فريق"
                                            )}
                                </span>
                            </div>

                            <div class="profile-detail">
                                <strong>
                                    المستقبل
                                </strong>
                                <span>
                                    ${escapeHTML(
                                        profile.future ||
                                            "لم تتم الإضافة بعد"
                                    )}
                                </span>
                            </div>

                            <div class="profile-detail">
                                <strong>
                                    الإنجازات
                                </strong>
                                <span>
                                    ${myAchievements.length}
                                </span>
                            </div>

                        </div>

                        <div class="profile-actions">

                            <button
                                class="venus-dynamic-button"
                                id="editProfileButton"
                            >
                                تعديل الملف
                            </button>

                            <button
                                class="venus-dynamic-button secondary"
                                id="customizeProfileButton"
                            >
                                تخصيص الملف
                            </button>

                        </div>

                        <div class="profile-tabs">

                            <button
                                class="profile-tab active"
                                data-profile-tab="posts"
                            >
                                المنشورات
                            </button>

                            <button
                                class="profile-tab"
                                data-profile-tab="reposts"
                            >
                                إعادة النشر
                            </button>

                            <button
                                class="profile-tab"
                                data-profile-tab="projects"
                            >
                                المشاريع
                            </button>

                            <button
                                class="profile-tab"
                                data-profile-tab="articles"
                            >
                                المقالات
                            </button>

                            <button
                                class="profile-tab"
                                data-profile-tab="achievements"
                            >
                                الإنجازات
                            </button>

                            <button
                                class="profile-tab"
                                data-profile-tab="mentions"
                            >
                                الإشارات
                            </button>

                        </div>

                        <div id="profileTabContent"></div>

                    </div>

                </div>

            </div>
        `;

        document.body.appendChild(page);

        displayProfileTab(
            "posts",
            myPosts,
            myAchievements,
            page
        );

        $("#changeAvatarButton", page)
            ?.addEventListener(
                "click",
                openAvatarPicker
            );

        $("#editProfileButton", page)
            ?.addEventListener(
                "click",
                openProfileEditor
            );

        $("#customizeProfileButton", page)
            ?.addEventListener(
                "click",
                openProfileCustomization
            );

        $$(".profile-tab", page).
        forEach(
            button => {
                button.addEventListener(
                    "click",
                    () => {
                        $$(".profile-tab", page)
                            .forEach(item =>
                                item.classList.remove(
                                    "active"
                                )
                            );

                        button.classList.add(
                            "active"
                        );

                        displayProfileTab(
                            button.dataset.profileTab,
                            myPosts,
                            myAchievements,
                            page
                        );
                    }
                );
            }
        );

        page.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    /* =========================================================
       PROFILE TABS
       ========================================================= */

    function displayProfileTab(
        tab,
        myPosts,
        myAchievements,
        page
    ) {
        const content =
            $("#profileTabContent", page);

        if (!content) return;

        let items = [];

        /* =====================================================
           POSTS
           ===================================================== */

        if (tab === "posts") {
            items = myPosts.filter(
                post =>
                    !post.repostOf &&
                    String(post.type || "post") !==
                        "repost"
            );
        }

        /* =====================================================
           REPOSTS
           ===================================================== */

        if (tab === "reposts") {
            items = myPosts.filter(
                post =>
                    post.repostOf ||
                    String(post.type || "") ===
                        "repost"
            );
        }

        /* =====================================================
           PROJECTS
           ===================================================== */

        if (tab === "projects") {
            items = myPosts.filter(
                post =>
                    post.type === "project"
            );
        }

        /* =====================================================
           ARTICLES
           ===================================================== */

        if (tab === "articles") {
            items = myPosts.filter(
                post =>
                    post.type === "article"
            );
        }

        /* =====================================================
           ACHIEVEMENTS
           ===================================================== */

        if (tab === "achievements") {
            if (!myAchievements.length) {
                content.innerHTML = `
                    <div class="empty-profile">
                        <div style="font-size:42px;">
                            ✦
                        </div>

                        <h3>
                            لا توجد إنجازات بعد
                        </h3>

                        <p>
                            ابدء بإضافة إنجازك الأول إلى VENUS.
                        </p>
                    </div>
                `;

                return;
            }

            content.innerHTML =
                myAchievements
                    .map(item => {
                        const points =
                            Number(
                                item.stars ||
                                item.points ||
                                getAchievementPoints(
                                    item.type
                                )
                            );

                        return `
                            <article class="profile-post">

                                <div class="profile-post-head">

                                    <h3>
                                        ${escapeHTML(
                                            item.title ||
                                            item.name ||
                                            "إنجاز في VENUS"
                                        )}
                                    </h3>

                                    <span class="profile-post-date">
                                        ${formatDate(
                                            item.date ||
                                            item.createdAt
                                        )}
                                    </span>

                                </div>

                                <p>
                                    ${escapeHTML(
                                        item.description ||
                                        item.content ||
                                        "تم تسجيل هذا الإنجاز."
                                    )}
                                </p>
                                <span class="profile-post-type">
                                    ✦ +${points} Venus Stars
                                </span>

                            </article>
                        `;
                    })
                    .join("");

            return;
        }

        /* =====================================================
           MENTIONS
           ===================================================== */

        if (tab === "mentions") {
            const username =
                getUsername().toLowerCase();

            const allPosts =
                getData(KEYS.posts, []);

            items =
                allPosts.filter(post =>
                    String(
                        post.description ||
                        post.content ||
                        ""
                    )
                        .toLowerCase()
                        .includes(
                            "@" + username
                        )
                );
        }

        /* =====================================================
           EMPTY STATE
           ===================================================== */

        if (!items.length) {
            content.innerHTML = `
                <div class="empty-profile">

                    <div style="font-size:42px;">
                        ✦
                    </div>

                    <h3>
                        لا يوجد شيء هنا بعد
                    </h3>

                    <p>
                        عندما تضيف محتوى سيظهر هنا.
                    </p>

                </div>
            `;

            return;
        }

        content.innerHTML =
            items
                .sort(
                    (a, b) =>
                        new Date(
                            b.createdAt ||
                            b.date ||
                            0
                        ) -
                        new Date(
                            a.createdAt ||
                            a.date ||
                            0
                        )
                )
                .map(renderProfilePost)
                .join("");

        bindProfilePostActions(content);
    }

    /* =========================================================
       ACHIEVEMENT POINTS
       ========================================================= */

    function getAchievementPoints(type) {
        const points = {
            article: 1,
            volunteer: 3,
            volunteering: 3,
            project: 5,
            competition: 5,
            other: 5,
            achievement: 5
        };

        return points[type] || 5;
    }

    /* =========================================================
       RENDER PROFILE POST
       ========================================================= */

    function renderProfilePost(post) {
        const content =
            post.description ||
            post.content ||
            "";

        const title =
            post.title ||
            getDisplayName();

        const date =
            post.date ||
            post.createdAt ||
            Date.now();

        const likes =
            Array.isArray(post.likes)
                ? post.likes
                : [];

        const comments =
            Array.isArray(post.comments)
                ? post.comments
                : [];

        const reposts =
            Array.isArray(post.reposts)
                ? post.reposts
                : [];

        const currentUsername =
            getUsername();

        const liked =
            likes.includes(
                currentUsername
            );

        const typeLabels = {
            post: "منشور",
            article: "مقال",
            volunteer: "تطوع",
            volunteering: "تطوع",
            project: "مشروع",
            competition: "مسابقة",
            other: "إنجاز",
            achievement: "إنجاز",
            repost: "إعادة نشر"
        };

        const type =
            typeLabels[
            post.type || "post"
            ] || "منشور";

        return `
            <article
                class="profile-post"
                data-post-id="${escapeHTML(
                    post.id || ""
                )}"
            >

                <div class="profile-post-head">

                    <h3>
                        ${escapeHTML(title)}
                    </h3>

                    <span class="profile-post-date">
                        ${formatDate(date)}
                    </span>

                </div>

                ${
                    post.type
                        ? `
                        <span class="profile-post-type">
                            ${escapeHTML(type)}
                        </span>
                        `
                        : ""
                }

                ${
                    content
                        ? `
                        <p>
                            ${formatMentions(content)}
                        </p>
                        `
                        : ""
                }

                ${
                    post.image
                        ? `
                        <img
                            src="${post.image}"
                            alt="مرفق المنشور"
                            style="
                                width:100%;
                                max-height:420px;
                                object-fit:cover;
                                border-radius:16px;
                                margin-top:12px;
                            "
                        >
                        `
                        : ""
                }

                ${
                    post.evidence
                        ? `
                        <a
                            href="${escapeHTML(
                                post.evidence
                            )}"
                            target="_blank"
                            rel="noopener"
                            class="profile-post-type"
                            style="
                                text-decoration:none;
                            "
                        >
                            فتح الدليل
                        </a>
                        `
                        : ""
                }

                <div class="profile-post-actions">

                    <button
                        class="profile-action-button"
                        data-post-action="like"
                        data-post-id="${escapeHTML(
                            post.id || ""
                        )}"
                    >
                        ${liked ? "♥" : "♡"}
                        ${likes.length}
                    </button>

                    <button
                        class="profile-action-button"
                        data-post-action="comment"
                        data-post-id="${escapeHTML(
                            post.id || ""
                        )}"
                    >
                        💬
                        ${comments.length}
                    </button>

                    <button
                        class="profile-action-button"
                        data-post-action="repost"
                        data-post-id="${escapeHTML(
                            post.id || ""
                        )}"
                    >
                        ↻
                        ${reposts.length}
                    </button>

                </div>

                <div
                    class="post-comments"
                    data-comments-for="${escapeHTML(
                        post.id || ""
                    )}"
                >

                    ${comments
                        .map(comment => `
                            <div class="feed-comment">

                                <strong>
                                    @${escapeHTML(
                                        comment.username ||
                                        "volunteer"
                                    )}
                                </strong>

                                <div>
                                    ${formatMentions(
                                        comment.text ||
                                        comment.content ||
                                        ""
                                    )}
                                </div>

                            </div>
                        `)
                        .join("")}

                </div>

            </article>
        `;
    }

    /* =========================================================
       PROFILE POST ACTIONS
       ========================================================= */

    function bindProfilePostActions(container) {
        container.addEventListener(
            "click",
            event => {
                const button =
                    event.target.closest(
                        "[data-post-action]"
                    );

                if (!button) return;

                const postId =
                    button.dataset.postId;

                const action =
                    button.dataset.postAction;

                if (!postId) return;

                if (action === "like") {
                    toggleLike(postId);
                }

                if (action === "comment") {
                    openCommentBox(postId);
                }

                if (action === "repost") {
                    repostPost(postId);
                }
            }
        );
    }

    /* =========================================================
       LIKE
       ========================================================= */

    function toggleLike(postId) {
        const posts =
            getData(KEYS.posts, []);

        const post =
            posts.find(
                item =>
                    String(item.id) ===
                    String(postId)
            );

        if (!post) return;

        if (!Array.isArray(post.likes)) {
            post.likes = [];
        }

        const username =
            getUsername();

        const index =
            post.likes.indexOf(username);

        if (index === -1) {
            post.likes.push(username);
        } else {
            post.likes.splice(index, 1);
        }

        saveData(
            KEYS.posts,
            posts
        );

        renderProfilePage();
    }

    /* =========================================================
       COMMENT
       ========================================================= */

    function openCommentBox(postId) {
        const text =
            prompt(
                "اكتب تعليقك:"
            );

        if (
            text === null ||
            !text.trim()
        ) {
            return;
        }

        const posts =
            getData(KEYS.posts, []);

        const post =
            posts.find(
                item =>
                    String(item.id) ===
                    String(postId)
            );

        if (!post) return;

        if (!Array.isArray(post.comments)) {
            post.comments = [];
        }

        post.comments.push({
            id: createId("comment"),
            username: getUsername(),
            text: text.trim(),
            createdAt: Date.now()
        });

        saveData(
            KEYS.posts,
            posts
        );

        renderProfilePage();
    }

    /* =========================================================
       REPOST
       ========================================================= */

    function repostPost(postId) {
        const posts =
            getData(KEYS.posts, []);

        const original =
            posts.find(
                item =>
                    String(item.id) ===
                    String(postId)
            );

        if (!original) return;

        const username =
            getUsername();

        const alreadyReposted =
            posts.some(
                post =>
                post.repostOf ===
                        original.id &&
                    post.username ===
                        username
            );

        if (alreadyReposted) {
            showMessage(
                "تمت إعادة النشر مسبقاً",
                "هذا المنشور موجود بالفعل ضمن إعادة نشرك.",
                "↻"
            );

            return;
        }

        const repost = {
            id: createId("post"),
            username,
            title:
                original.title ||
                getDisplayName(),
            description:
                original.description ||
                original.content ||
                "",
            type: "repost",
            repostOf: original.id,
            createdAt: Date.now(),
            date: Date.now(),
            likes: [],
            comments: [],
            reposts: []
        };

        if (!Array.isArray(original.reposts)) {
            original.reposts = [];
        }

        original.reposts.push(
            username
        );

        posts.push(repost);

        saveData(
            KEYS.posts,
            posts
        );

        showMessage(
            "تمت إعادة النشر",
            "ظهر المنشور في ملفك الشخصي.",
            "↻"
        );

        renderProfilePage();
    }

    /* =========================================================
       CREATE CONTENT
       ========================================================= */

    function openCreateModal(type = "post") {
        const modal =
            $("#createPostModal");

        if (!modal) return;

        const title =
            $("#createModalTitle");

        const description =
            $("#createModalDescription");

        const typeNames = {
            post: "منشور جديد",
            article: "مقال جديد",
            volunteer: "إنجاز تطوعي",
            project: "مشروع جديد",
            competition: "مسابقة فرعية",
            other: "إنجاز آخر"
        };

        if (title) {
            title.textContent =
                typeNames[type] ||
                "محتوى جديد";
        }

        if (description) {
            const descriptions = {
                post:
                    "شارك شيئاً تريد أن يراه المجتمع VENUS.",
                article:
                    "اكتب مقالاً أو فكرة معرفية.",
                volunteer:
                    "سجل نشاطاً تطوعياً.",
                project:
                    "أضف مشروعاً أو عملاً كبيراً.",
                competition:
                    "اقترح مسابقة فرعية.",
                other:
                    "أضف إنجازاً آخر."
            };

            description.textContent =
                descriptions[type] ||
                "";
        }

        modal.dataset.createType =
            type;

        const form =
            $("#createForm");

        if (form) {
            form.reset();
        }

        showModal(modal);
    }

    function handleCreateSubmit(event) {
        event.preventDefault();

        const modal =
            $("#createModal");

        const form =
            $("#createForm");

        if (!modal || !form) return;

        const type =
            modal.dataset.createType ||
            "post";

        const titleInput =
            $("#createTitle");

        const descriptionInput =
            $("#createDescription");

        const evidenceInput =
            $("#evidenceFile");

        const title =
            titleInput?.value.trim() ||
            "";

        const description =
            descriptionInput?.value.trim() ||
            "";

        if (!description && !title) {
            showMessage(
                "المحتوى فارغ",
                "اكتب شيئاً أولاً قبل النشر.",
                "!"
            );

            return;
        }

        const posts =
            getData(KEYS.posts, []);

        const post = {
            id: createId("post"),
            username: getUsername(),
            title:
                title ||
                getDisplayName(),
            description,
            content: description,
            type,
            createdAt: Date.now(),
            date: Date.now(),
            likes: [],
            comments: [],
            reposts: []
        };

        if (
            evidenceInput &&
            evidenceInput.files &&
            evidenceInput.files[0]
        ) {
            readFileAsDataURL(
                evidenceInput.files[0]
            )
                .then(data => {
                    post.evidence = data;

                    posts.push(post);

                    saveData(
                        KEYS.posts,
                        posts
                    );

                    finishCreate();
                })
                .catch(error => {
                    console.error(error);

                    posts.push(post);

                    saveData(
                        KEYS.posts,
                        posts
                    );

                    finishCreate();
                });
        } else {
            posts.push(post);

            saveData(
                KEYS.posts,
                posts
            );

            finishCreate();
        }

        function finishCreate() {
            hideModal(modal);

            if (
                type === "article" ||
                type === "volunteer" ||
                type === "project" ||
                type === "other"
            ) {
                createAchievementFromPost(
                    post
                );
            }

            renderHomeFeed();

            showMessage(
                "تم النشر",
                "تمت إضافة المحتوى إلى VENUS.",
                "✦"
            );
        }
    }

    /* =========================================================
       ACHIEVEMENT FROM CONTENT
       ========================================================= */

    function createAchievementFromPost(post) {
        const achievements =
            getData(
                KEYS.achievements,
                []
            );

        const points =
            getAchievementPoints(
                post.type
            );

        achievements.push({
            id: createId(
                "achievement"
            ),
            username:
                getUsername(),
            title:
                post.title ||
                "إنجاز VENUS",
            description:
                post.description ||
                "",
            type:
                post.type,
            stars: points,
            status: "pending",
            createdAt:
                Date.now()
        });

        saveData(
            KEYS.achievements,
            achievements
        );
    }

    /* =========================================================
       HOME FEED
       ========================================================= */

    function renderHomeFeed(
        filter = "for-you"
    ) {
        const feed =
            $("#feed");

        if (!feed) return;

        let posts =
            getData(
                KEYS.posts,
                []
            );

        if (
            filter === "volunteers"
        ) {
            posts =
                posts.filter(
                    post =>
                        !post.team
                );
        }

        if (
            filter === "teams"
        ) {
            posts =
                posts.filter(
                    post =>
                        Boolean(
                            post.team
                        )
                );
        }

        if (
            filter === "articles"
        ) {
            posts =
                posts.filter(
                    post =>
                        post.type ===
                        "article"
                );
        }

        posts.sort(
            (a, b) =>
                new Date(
                    b.createdAt ||
                    b.date ||
                    0
                ) -
                new Date(
                    a.createdAt ||
                    a.date ||
                    0
                    )
        );

        if (!posts.length) {
            feed.innerHTML = `
                <div class="empty-profile">
                    <div style="font-size:42px;">
                        ✦
                    </div>

                    <h3>
                        لا توجد منشورات بعد
                    </h3>

                    <p>
                        كن أول من يشارك شيئاً في VENUS.
                    </p>

                    <button
                        class="venus-dynamic-button"
                        id="feedEmptyCreateButton"
                    >
                        إنشاء منشور
                    </button>
                </div>
            `;

            $("#feedEmptyCreateButton")
                ?.addEventListener(
                    "click",
                    () =>
                        openCreateModal(
                            "post"
                        )
                );

            return;
        }

        feed.innerHTML =
            posts
                .map(renderFeedPost)
                .join("");

        bindFeedActions(feed);
    }

    function renderFeedPost(post) {
        const likes =
            Array.isArray(post.likes)
                ? post.likes
                : [];

        const comments =
            Array.isArray(post.comments)
                ? post.comments
                : [];

        const username =
            post.username ||
            "volunteer";

        const liked =
            likes.includes(
                getUsername()
            );

        return `
            <article
                class="profile-post"
                data-post-id="${escapeHTML(
                    post.id || ""
                )}"
            >

                <div class="profile-post-head">

                    <div>

                        <h3>
                            ${escapeHTML(
                                post.title ||
                                username
                            )}
                        </h3>

                        <small>
                            @${escapeHTML(
                                username
                            )}
                        </small>

                    </div>

                    <span class="profile-post-date">
                        ${formatDate(
                            post.createdAt ||
                            post.date
                        )}
                    </span>

                </div>

                ${
                    post.type
                        ? `
                        <span class="profile-post-type">
                            ${escapeHTML(
                                getPostTypeLabel(
                                    post.type
                                )
                            )}
                        </span>
                        `
                        : ""
                }

                <p>
                    ${formatMentions(
                        post.description ||
                        post.content ||
                        ""
                    )}
                </p>

                ${
                    post.image
                        ? `
                        <img
                            src="${post.image}"
                            alt="صورة المنشور"
                            style="
                                width:100%;
                                border-radius:16px;
                                margin-top:10px;
                            "
                        >
                        `
                        : ""
                }

                <div class="profile-post-actions">

                    <button
                        class="profile-action-button"
                        data-feed-action="like"
                        data-post-id="${escapeHTML(
                            post.id || ""
                        )}"
                    >
                        ${liked ? "♥" : "♡"}
                        ${likes.
                        length}
                    </button>

                    <button
                        class="profile-action-button"
                        data-feed-action="comment"
                        data-post-id="${escapeHTML(
                            post.id || ""
                        )}"
                    >
                        💬
                        ${comments.length}
                    </button>

                    <button
                        class="profile-action-button"
                        data-feed-action="repost"
                        data-post-id="${escapeHTML(
                            post.id || ""
                        )}"
                    >
                        ↻
                        ${
                            Array.isArray(
                                post.reposts
                            )
                                ? post.reposts.length
                                : 0
                        }
                    </button>

                </div>

            </article>
        `;
    }

    function getPostTypeLabel(type) {
        const labels = {
            post: "منشور",
            article: "مقال",
            volunteer: "تطوع +3",
            volunteering: "تطوع +3",
            project: "مشروع +5",
            competition: "مسابقة",
            other: "إنجاز +5",
            achievement: "إنجاز +5",
            repost: "إعادة نشر"
        };

        return labels[type] || "منشور";
    }

    function bindFeedActions(feed) {
        feed.addEventListener(
            "click",
            event => {
                const button =
                    event.target.closest(
                        "[data-feed-action]"
                    );

                if (!button) return;

                const id =
                    button.dataset.postId;

                const action =
                    button.dataset.feedAction;

                if (action === "like") {
                    toggleLike(id);
                }

                if (action === "comment") {
                    openCommentBox(id);
                }

                if (action === "repost") {
                    repostPost(id);
                }
            }
        );
    }

    /* =========================================================
       IDEAS
       ========================================================= */

    function openIdeaModal(type) {
        const modal =
            $("#ideaModal");

        if (!modal) return;

        modal.dataset.ideaType =
            type;

        const selected =
            $("#selectedIdeaType");

        const names = {
            competition: "مسابقة",
            project: "مشروع كبير",
            help: "أحتاج مساعدة",
            school: "نشاط مدرسي",
            community: "فكرة مجتمعية",
            environment: "البيئة",
            venus: "ميزة لـ VENUS",
            other: "أخرى"
        };

        if (selected) {
            selected.textContent =
                names[type] ||
                "فكرة";
        }

        const form =
            $("#ideaForm");

        form?.reset();

        showModal(modal);
    }

    function handleIdeaSubmit(event) {
        event.preventDefault();

        const modal =
            $("#ideaModal");

        if (!modal) return;

        const title =
            $("#ideaTitle")
                ?.value.trim() ||
            "";

        const description =
            $("#ideaDescription")
                ?.value.trim() ||
            "";

        if (!title || !description) {
            showMessage(
                "الفكرة ناقصة",
                "اكتب عنوان الفكرة وشرحها.",
                "!"
            );

            return;
        }

        const ideas =
            getData(
                KEYS.ideas,
                []
            );

        ideas.push({
            id: createId("idea"),
            username:
                getUsername(),
            type:
                modal.dataset.ideaType ||
                "other",
            title,
            description,
            status: "submitted",
            createdAt: Date.now()
        });

        saveData(
            KEYS.ideas,
            ideas
        );

        hideModal(modal);

        showMessage(
            "وصلت فكرتك ✦",
            "شكرا لانك تساعد عراقنا على التطور.",
            "♡"
        );
    }

    /* =========================================================
       TEAMS
       ========================================================= */

    function renderTeams() {
        const section =
            $("#teamsSection");

        if (!section) return;

        const teams =
            getData(
                KEYS.teams,
                []
            );

        const existing =
            section.querySelector(
                ".venus-team-list"
            );

        if (existing) {
            existing.remove();
        }

        const list =
            document.createElement("div");

        list.className =
            "venus-team-list";

        list.style.cssText = `
            display:grid;
            grid-template-columns:
                repeat(auto-fit,minmax(240px,1fr));
            gap:16px;
            margin-top:20px;
        `;

        if (!teams.length) {
            list.innerHTML = `
                <div class="profile-post">
                    <h3>
                        لا توجد فرق بعد
                    </h3>

                    <p>
                        كن أول من ينشئ فريقاً في VENUS.
                    </p>
                </div>
            `;
        } else {
            list.innerHTML =
                teams
                    .map(team => `
                        <article
                            class="profile-post"
                        >

                            <div class="profile-post-head">

                                <h3>
                                    ${escapeHTML(
                                        team.name ||
                                        "فريق VENUS"
                                    )}
                                </h3>

                                <span
                                    class="profile-stars"
                                    style="
                                        padding:6px 10px;
                                        font-size:12px;
                                    "
                                >
                                    ${Number(
                                        team.stars ||
                                        0
                                    )}
                                </span>

                            </div>

                            <p>
                                ${escapeHTML(
                                    team.bio ||
                                    "فريق طلابي في VENUS."
                                )}
                            </p>

                            <span class="profile-post-type">
                                Created by @${escapeHTML(
                                    team.owner ||
                                    "volunteer"
                                )}
                            </span>

                        </article>
                    `)
                    .join("");
        }

        section.appendChild(list);
    }

    function createTeam() {
        const profile =
            getCurrentProfile();

        if (profile.team) {
            showMessage(
                "لديك فريق بالفعل",
                "لا يمكنك إنشاء فريق ثانٍ. يمكنك الانضمام لفريق واحد فقط.",
                "!"
            );

            return;
        }

        const name =
            prompt(
                "اسم الفريق:"
            );

        if (
            name === null ||
            !name.trim()
        ) {
            return;
        }

        const bio =
            prompt(
                "وصف قصير للفريق:"
            ) || "";

        const teams =
            getData(
                KEYS.teams,
                []
            );
            const team = {
            id: createId("team"),
            name: name.trim(),
            bio: bio.trim(),
            owner:
                getUsername(),
            members: [
                getUsername()
            ],
            stars: 0,
            createdAt: Date.now()
        };

        teams.push(team);

        saveData(
            KEYS.teams,
            teams
        );

        profile.team =
            team.name;

        saveCurrentProfile(
            profile
        );

        renderTeams();
        renderProfilePage();

        showMessage(

            "تم إنشاء الفريق",
            `تم إنشاء فريق ${team.name} بنجاح.`,
            "✦"
        );
    }

    /* =========================================================
       COMPETITION
       ========================================================= */

    function renderCompetition() {
        const section =
            $("#competitionSection");

        if (!section) return;

        const posts =
            getData(
                KEYS.achievements,
                []
            );

        const users = {};

        posts.forEach(item => {
            const username =
                item.username ||
                "volunteer";

            if (!users[username]) {
                users[username] = {
                    username,
                    stars: 0,
                    achievements: 0
                };
            }

            users[username].stars +=
                Number(
                    item.stars ||
                    item.points ||
                    getAchievementPoints(
                        item.type
                    )
                );

            users[username]
                .achievements++;
        });

        const ranking =
            Object.values(users)
                .sort(
                    (a, b) =>
                        b.stars -
                        a.stars
                );

        const preview =
            section.querySelector(
                ".ranking-card"
            );

        if (!preview) return;

        const tab =
            section.querySelector(
                "[data-ranking].active"
            );

        const type =
            tab?.dataset.ranking ||
            "individual";

        if (
            type === "teams"
        ) {
            const teams =
                getData(
                    KEYS.teams,
                    []
                );

            const teamRanking =
                teams
                    .map(team => ({
                        ...team,
                        calculatedStars:
                            calculateTeamStars(
                                team
                            )
                    }))
                    .sort(
                        (a, b) =>
                            b.calculatedStars -
                            a.calculatedStars
                    );

            preview.innerHTML =
                teamRanking.length
                    ? teamRanking
                        .slice(0, 10)
                        .map(
                            (team, index) => `
                                <div
                                    style="
                                        display:flex;
                                        justify-content:space-between;
                                        padding:10px;
                                        border-bottom:1px solid #eee3d0;
                                    "
                                >
                                    <span>
                                        #${index + 1}
                                        ${escapeHTML(
                                            team.name
                                        )}
                                    </span>

                                    <strong>
                                        ✦
                                        ${team.calculatedStars}
                                    </strong>
                                    </div>
                            `
                        )
                        .join("")
                    : `
                        <p>
                            لا توجد فرق مصنفة بعد.
                        </p>
                    `;

            return;
        }

        preview.innerHTML =
            ranking.length
                ? ranking
                    .slice(0, 10)
                    .map(
                        (volunteer, index) => `
                            <div
                                style="
                                    display:flex;
                                    justify-content:space-between;
                                    padding:10px;
                                    border-bottom:1px solid #eee3d0;
                                "
                            >

                                <span>
                                    #${index + 1}
                                    @${escapeHTML(
                                        volunteer.username
                                    )}
                                </span>

                                <strong>
                                    ✦
                                    ${volunteer.stars}
                                </strong>

                            </div>
                        `
                    )
                    .join("")
                : `
                    <p>
                        لا توجد نتائج بعد.
                    </p>
                `;
    }

    function calculateTeamStars(team) {
        const achievements =
            getData(
                KEYS.achievements,
                []
            );

        const members =
            Array.isArray(
                team.members
            )
                ? team.members
                : [];

        return achievements
            .filter(
                item =>
                    members.includes(
                        item.username
                    )
            )
            .reduce(
                (sum, item) =>
                    sum +
                    Number(
                        item.stars ||
                        item.points ||
                        getAchievementPoints(
                            item.type
                        )
                    ),
                0
            );
    }

    /* =========================================================
       NAVIGATION
       ========================================================= */

    function showMainSection(targetId) {
        const sections = [
            "homeSection",
            "competitionSection",
            "teamsSection",
            "ideasSection"
        ];

        sections.forEach(id => {
            const section =
                $("#" + id);

            if (!section) return;

            section.style.display =
                id === targetId
                    ? ""
                    : "none";
        });

        const target =
            $("#" + targetId);

        if (target) {
            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }

        if (
            targetId ===
            "homeSection"
        ) {
            renderHomeFeed();
        }

        if (
            targetId ===
            "competitionSection"
        ) {
            renderCompetition();
        }

        if (
            targetId ===
            "teamsSection"
        ) {
            renderTeams();
        }
    }

    function hideMainSectionsForProfile() {
        [
            "homeSection",
            "competitionSection",
            "teamsSection",
            "ideasSection"
        ].forEach(id => {
            const section =
                $("#" + id);

            if (section) {
                section.style.display =
                    "none";
            }
        });
    }

    /* =========================================================
       LANGUAGE
       ========================================================= */

    function setLanguage(language) {
        document.documentElement.lang =
            language;

        document.documentElement.dir =
            language === "ar"
                ? "rtl"
                : "ltr";

        saveData(
            "venusLanguage",
            language
        );

        const modal =
            $("#languageModal");

        if (modal) {
            hideModal(modal);
        }

        showMessage(
            language === "ar"
                ? "العربية"
                : "English",
            language === "ar"
                ? "تم اختيار اللغة العربية."
                : "English mode selected.",
            "✦"
        );
    }

    /* =========================================================
       GLOBAL SEARCH
       ========================================================= */

    function performSearch(query) {
        const value =
            String(query || "")
                .trim()
                .toLowerCase();

        if (!value) return;

        const posts =
            getData(
                KEYS.posts,
                []
            );

        const teams =
            getData(
                KEYS.teams,
                []
            );

        const matchingPosts =
            posts.filter(post =>
                String(
                    post.title ||
                    ""
                )
                    .toLowerCase()
                    .includes(value) ||
                String(
                    post.description ||
                    post.content ||
                    ""
                )
                    .toLowerCase()
                    .includes(value)
            );

        const matchingTeams =
            teams.filter(team =>
                String(
                    team.name ||
                    ""
                )
                    .toLowerCase()
                    .includes(value)
            );

        if (
            matchingPosts.length ||
            matchingTeams.length
        ) {
            let text =
                "";

            if (
                matchingPosts.length
            ) {
                text +=
                    `وجدنا ${matchingPosts.length} منشور/محتوى. `;
            }

            if (
                matchingTeams.length
            ) {
                text +=
                    `وجدنا ${matchingTeams.length} فريق. `;
            }

            showMessage(
                "نتائج البحث",
                text,
                "⌕"
            );
        } else {
            showMessage(
                "لا توجد نتائج",
                "لم نجد شيئاً يطابق بحثك.",
                "⌕"
            );
        }
    }

    /* =========================================================
       HEADER EVENTS
       ========================================================= */

    $("#headerProfileButton")
        ?.addEventListener(
            "click",
            () => {
                hideMainSectionsForProfile();
                renderProfilePage();
            }
        );

    $("#joinVenusButton")
        ?.addEventListener(
            "click",
            () => {
                hideMainSectionsForProfile();
                renderProfilePage();
            }
        );

    $("#exploreButton")
        ?.addEventListener(
            "click",
            () => {
                showMainSection(
                    "homeSection"
                );
            }
        );

    $("#globalSearch")
        ?.addEventListener(
            "keydown",
            event => {
                if (
                    event.key ===
                    "Enter"
                ) {
                    performSearch(
                        event.target.value
                    );
                }
            }
        );

    $("#languageButton")
        ?.addEventListener(
            "click",
            () => {
                showModal(
                    "languageModal"
                );
            }
        );
        /* =========================================================
       QUICK NAV
       ========================================================= */

    $$("[data-target]").forEach(
        button => {
            button.addEventListener(
                "click",
                () => {
                    const target =
                        button.dataset
                            .target;

                    if (target) {
                        showMainSection(
                            target
                        );
                    }
                }
            );
        }
    );

    /* =========================================================
       ADD CONTENT MENU
       ========================================================= */

    $("#addPostButton")
        ?.addEventListener(
            "click",
            () => {
                window.location.href = "post.html";
            }

        );
        const emptyPostButtons = [
    "#emptyCreateButton",
    "#emptyCreatePost",
    "#feedEmptyCreateButton"
];

emptyPostButtons.forEach(selector => {
    $(selector)?.addEventListener(
        "click",
        () => {
            window.location.href = "post.html";
        }
    );
});

    $$("[data-create-type]")

        .forEach(button => {

            button.addEventListener(

                "click",

                () => {

                    console.log(
                        "VENUS CREATE TYPE CLICKED:",

                        button.dataset.createType
                    );
                    alert(
                        "CREATE TYPE WORKS: " +

                        button.dataset.createType

                    );

                }

            );

        });

    /* =========================================================

       CREATE FORM

       ========================================================= */

    $("#createForm")

        ?.addEventListener(

            "submit",

            handleCreateSubmit

        );

    /* =========================================================

       IDEA BUTTONS

       ========================================================= */

    $$("[data-idea-type]")

        .forEach(button => {

            button.addEventListener(

                "click",

                () => {

                    openIdeaModal(

                        button.dataset

                            .ideaType

                    );

                }

            );

        });

    $("#ideaForm")

        ?.addEventListener(

            "submit",

            handleIdeaSubmit

        );

    /* =========================================================

       TEAM BUTTON

       ========================================================= */

    $("#createTeamButton")

        ?.addEventListener(

            "click",

            createTeam

        );

    /* =========================================================

       COMPETITION TABS

       ========================================================= */

    $$("[data-ranking]")

        .forEach(button => {

            button.addEventListener(

                "click",

                () => {

                    $$("[data-ranking]")

                        .forEach(item =>

                            item.classList.remove(

                                "active"

                            )

                        );

                    button.classList.add(

                        "active"

                    );

                    renderCompetition();

                }

            );

        });

    /* =========================================================

       LANGUAGE OPTIONS

       ========================================================= */

    $$("[data-language]")

        .forEach(button => {

            button.addEventListener(

                "click",

                () => {

                    setLanguage(

                        button.dataset

                            .language

                    );

                }

            );

        });

    /* =========================================================

       MESSAGE MODAL

       ========================================================= */

    $("#messageModal")

        ?.addEventListener(

            "click",

            event => {

                if (

                    event.target ===

                    $("#messageModal")

                ) {

                    hideModal(

                        $("#messageModal")

                    );

                }

            }

        );

    /* =========================================================

       EMPTY CREATE BUTTON

       ========================================================= */

    $("#emptyCreateButton")

        ?.addEventListener(

            "click",

            () => {

                openCreateModal(

                    "post"

                );

            }

        );
        /* =========================================================

       INITIAL DATA

       ========================================================= */

    function initializeData() {

        if (

            !localStorage.getItem(

                KEYS.posts

            )

        ) {

            saveData(

                KEYS.posts,

                []

            );

        }

        if (

            !localStorage.getItem(

                KEYS.achievements

            )

        ) {

            saveData(

                KEYS.achievements,

                []

            );

        }

        if (

            !localStorage.getItem(

                KEYS.teams

            )

        ) {

            saveData(

                KEYS.teams,

                []

            );

        }

        if (

            !localStorage.getItem(

                KEYS.ideas

            )

        ) {

            saveData(

                KEYS.ideas,

                []

            );

        }

        if (

            !localStorage.getItem(

                KEYS.settings

            )

        ) {

            saveData(

                KEYS.settings,

                {

                    profileColor:

                        "#861c27",

                    background:

                        "royal-red",

                    frame:

                        "gold"

                }

            );

        }

    }

    initializeData();

    /* =========================================================

       INITIAL HOME

       ========================================================= */

    renderHomeFeed();

    renderTeams();

    renderCompetition();

    /* =========================================================

       FOOTER YEAR

       ========================================================= */

    const footerYear =

        $("#footerYear");

    if (footerYear) {

        footerYear.textContent =

            new Date().getFullYear();

    }

    /* =========================================================

       DEFAULT LANGUAGE

       ========================================================= */

    const savedLanguage =

        getData(

            "venusLanguage",

            "ar"

        );

    document.documentElement.lang =

        savedLanguage;

    document.documentElement.dir =

        savedLanguage === "ar"

            ? "rtl"

            : "ltr";

    /* =========================================================

       PROFILE DATA SAFETY

       ========================================================= */

    const profile =

        getCurrentProfile();

    if (

        typeof profile.stars !==

        "number"

    ) {

        profile.stars =

            Number(

                profile.stars || 0

            );

        saveCurrentProfile(

            profile

        );

    }

    /* =========================================================

       KEEP PROFILE STARS UPDATED

       ========================================================= */

    function syncProfileStars() {

        const profile =

            getCurrentProfile();

        const achievements =

            getData(

                KEYS.achievements,

                []

            );

        const username =

            profile.username ||

            "volunteer";

        const total =

            achievements

                .filter(

                    item =>

                        String(

                            item.username ||

                            ""

                        ).toLowerCase() ===

                        String(

                            username

                        ).toLowerCase()

                )

                .reduce(

                    (sum, item) =>

                        sum +

                        Number(

                            item.stars ||

                            item.points ||

                            getAchievementPoints(

                                item.type
                                )

                        ),

                    0

                );

        profile.stars =

            total;

        saveCurrentProfile(

            profile

        );

    }

    syncProfileStars();

    /* =========================================================

       CLOSE ADD MENU WHEN CLICKING OUTSIDE

       ========================================================= */

    document.addEventListener(

        "click",

        event => {

            const menu =

                $("#addMenu");

            const addButton =

                $("#addPostButton");

            if (

                !menu ||

                !addButton

            ) {

                return;

            }

            if (

                !menu.contains(

                    event.target

                ) &&

                !addButton.contains(

                    event.target

                )

            ) {

                menu.classList.remove(

                    "active"

                );

                menu.hidden = true;

            }

        }

    );

    /* =========================================================

       GLOBAL ERROR PROTECTION

       ========================================================= */

    window.addEventListener(

        "error",

        event => {

            console.error(

                "VENUS runtime error:",

                event.error ||

                    event.message

            );

        }

    );

    console.log(

        "✦ VENUS script loaded successfully."

    );

});
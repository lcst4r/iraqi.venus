/* =========================================================
   VENUS — SETTINGS
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
        currentUser: "venusCurrentUser",
        oldCurrentUser: "currentUser",
        profileUser: "venusUser",
        users: "venusUsers",
        settings: "venusSettings",
        notifications: "venusNotifications",
        teams: "venusTeams",
        posts: "venusPosts",
        competitionRegistration: "venusCompetitionRegistration"
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
            console.warn(`Venus settings: failed to read ${key}`, error);
            return fallback;
        }
    }

    function writeJSON(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn(`Venus settings: failed to write ${key}`, error);
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

        return null;
    }


    function getUserId(user = getCurrentUser()) {
        if (!user) {
            return null;
        }

        return (
            user.id ||
            user.userId ||
            user.uid ||
            user.username ||
            null
        );
    }


    function getUserName(user = getCurrentUser()) {
        if (!user) {
            return "متطوع Venus";
        }

        return (
            user.name ||
            user.fullName ||
            user.displayName ||
            user.username ||
            "متطوع Venus"
        );
    }


    function saveCurrentUser(user) {
        if (!user) {
            return;
        }

        writeJSON(STORAGE_KEYS.currentUser, user);

        /*
         * Keep the old key compatible with the rest of
         * the Venus local MVP.
         */
        writeJSON(STORAGE_KEYS.oldCurrentUser, user);

        /*
         * Keep profile.js compatible.
         */
        writeJSON(STORAGE_KEYS.profileUser, user);

        /*
         * Update venusUsers if it exists.
         */
        const users = readJSON(STORAGE_KEYS.users, []);

        if (Array.isArray(users)) {
            const id = getUserId(user);

            const index = users.findIndex(
                existingUser => getUserId(existingUser) === id
            );

            if (index >= 0) {
                users[index] = {
                    ...users[index],
                    ...user
                };
            } else {
                users.push(user);
            }

            writeJSON(STORAGE_KEYS.users, users);
        }

        window.dispatchEvent(
            new CustomEvent("venus:userUpdated", {
                detail: { user }
            })
        );

        window.dispatchEvent(
            new Event("storage")
        );
    }


    /* =========================================================
       DEFAULT SETTINGS
       ========================================================= */

    const DEFAULT_SETTINGS = {
        profileVisibility: true,
        competitionName: true,
        notifications: true,
        teamNotifications: true,
        darkMode: false,
        language: "ar"
    };


    function getSettings() {
        const saved = readJSON(
            STORAGE_KEYS.settings,
            {}
        );

        return {
            ...DEFAULT_SETTINGS,
            ...(saved || {})
        };
    }


    function saveSettings(settings) {
        writeJSON(
            STORAGE_KEYS.settings,
            {
                ...DEFAULT_SETTINGS,
                ...settings
            }
        );

        window.dispatchEvent(
            new CustomEvent("venus:settingsUpdated", {
                detail: {
                    settings: getSettings()
                }
            })
        );
    }


    /* =========================================================
       DOM ELEMENTS
       ========================================================= */

    const elements = {
        accountButton: $("#openAccountSettings"),
        profileButton: $("#openProfileSettings"),

        profileVisibilityToggle:
            $("#profileVisibilityToggle"),

        competitionNameToggle:
            $("#competitionNameToggle"),

        notificationsToggle:
            $("#notificationsToggle"),

        teamNotificationsToggle:
            $("#teamNotificationsToggle"),

        darkModeToggle:
            $("#darkModeToggle"),

        languageSelect:
            $("#languageSelect"),

        logoutButton:
            $("#logoutButton"),

        deleteAccountButton:
            $("#deleteAccountButton"),

        /* Account modal */
        accountModal:
            $("#accountSettingsModal"),

        accountModalOverlay:
            $("#closeAccountSettingsOverlay"),

        accountModalClose:
            $("#closeAccountSettings"),

        accountAvatar:
            $("#settingsAccountAvatar"),

        accountName:
            $("#settingsAccountName"),

        accountUsername:
            $("#settingsAccountUsername"),

        accountAge:
            $("#settingsAccountAge"),

        accountSchool:
            $("#settingsAccountSchool"),

        accountGovernorate:
            $("#settingsAccountGovernorate"),

        /* Delete modal */
        deleteModal:
            $("#deleteAccountModal"),

        deleteModalOverlay:
            $("#closeDeleteAccountOverlay"),

        cancelDelete:
            $("#cancelDeleteAccount"),

        confirmDelete:
            $("#confirmDeleteAccount")
    };


    /* =========================================================
       MODAL HELPERS
       ========================================================= */

    function openModal(modal) {
        if (!modal) {
            return;
        }

        modal.classList.add("is-open");

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "venus-modal-open"
        );
    }


    function closeModal(modal) {
        if (!modal) {
            return;
        }

        modal.classList.remove("is-open");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        const anyOpenModal = $(".settings-modal.is-open");

        if (!anyOpenModal) {
            document.body.classList.remove(
                "venus-modal-open"
            );
        }
    }


    /* =========================================================
       ACCOUNT MODAL
       ========================================================= */

    function getAvatarSource(user) {
        if (!user) {
            return "";
        }

        return (
            user.avatar ||
            user.photoURL ||
            user.photo ||
            ""
        );
    }


    function getInitial(name) {
        if (!name) {
        return "V";
        }

        return name.trim().charAt(0).toUpperCase();
    }


    function setAvatar(element, user) {
        if (!element) {
            return;
        }

        const avatar = getAvatarSource(user);

        if (avatar) {
            element.src = avatar;

            element.style.display = "block";

            element.onerror = () => {
                element.removeAttribute("src");

                element.style.display = "none";
            };

            return;
        }

        /*
         * No avatar:
         * use the element's parent as a small fallback.
         */
        element.removeAttribute("src");
        element.style.display = "none";

        const parent = element.parentElement;

        if (
            parent &&
            !parent.querySelector(".settings-avatar-fallback")
        ) {
            const fallback =
                document.createElement("div");

            fallback.className =
                "settings-avatar-fallback";

            fallback.textContent =
                getInitial(getUserName(user));

            fallback.style.cssText = `
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                background: linear-gradient(
                    135deg,
                    #8f1d2c,
                    #c69a3a
                );
                color: #fff;
                font-size: 22px;
                font-weight: 800;
            `;

            parent.appendChild(fallback);
        }
    }


    function fillAccountModal() {
        const user = getCurrentUser();

        if (!user) {
            return;
        }

        const name = getUserName(user);

        const username =
            user.username ||
            user.handle ||
            user.nickname ||
            "—";

        const age =
            user.age !== undefined &&
            user.age !== null &&
            user.age !== ""
                ? user.age
                : "—";

        const school =
            user.school ||
            user.university ||
            "—";

        const governorate =
            user.governorate ||
            "—";

        if (elements.accountName) {
            elements.accountName.textContent =
                name;
        }

        if (elements.accountUsername) {
            elements.accountUsername.textContent =
                username.startsWith("@")
                    ? username
                    : `@${username}`;
        }

        if (elements.accountAge) {
            elements.accountAge.textContent =
                age;
        }

        if (elements.accountSchool) {
            elements.accountSchool.textContent =
                school;
        }

        if (elements.accountGovernorate) {
            elements.accountGovernorate.textContent =
                governorate;
        }

        setAvatar(
            elements.accountAvatar,
            user
        );
    }


    function openAccountModal() {
        fillAccountModal();

        openModal(
            elements.accountModal
        );
    }


    /* =========================================================
       PROFILE SETTINGS
       ========================================================= */

    function openProfileSettings() {
        /*
         * Prefer VenusProfile if profile.js is loaded.
         */
        if (
            window.VenusProfile &&
            typeof window.VenusProfile.refresh === "function"
        ) {
            window.VenusProfile.refresh();
        }

        window.location.href = "profile.html";
    }


    /* =========================================================
       TOGGLES
       ========================================================= */

    function applySettingsToUI() {
        const settings = getSettings();

        if (elements.profileVisibilityToggle) {
            elements.profileVisibilityToggle.checked =
                Boolean(settings.profileVisibility);
        }

        if (elements.competitionNameToggle) {
            elements.competitionNameToggle.checked =
                Boolean(settings.competitionName);
        }

        if (elements.notificationsToggle) {
            elements.notificationsToggle.checked =
                Boolean(settings.notifications);
        }

        if (elements.teamNotificationsToggle) {
            elements.teamNotificationsToggle.checked =
                Boolean(settings.teamNotifications);
        }

        if (elements.darkModeToggle) {
            elements.darkModeToggle.checked =
                Boolean(settings.darkMode);
        }

        if (elements.languageSelect) {
            elements.languageSelect.value =
                settings.language || "ar";
        }
    }


    function updateSetting(key, value) {
        const settings = getSettings();

        settings[key] = value;

        saveSettings(settings);
    }


    function handleToggleChange(event) {
        const toggle = event.currentTarget;

        if (!toggle || !toggle.dataset.setting) {
            return;
        }

        updateSetting(
            toggle.dataset.setting,
            toggle.checked
        );

        if (
            toggle.dataset.setting ===
            "darkMode"
        ) {
            applyDarkMode(
                toggle.checked
            );
        }
    }


    function setupToggleDataAttributes() {
        if (elements.profileVisibilityToggle) {
            elements.profileVisibilityToggle.dataset.setting =
                "profileVisibility";
        }

        if (elements.competitionNameToggle) {
            elements.competitionNameToggle.dataset.setting =
                "competitionName";
        }

        if (elements.notificationsToggle) {
            elements.notificationsToggle.dataset.setting =
                "notifications";
        }

        if (elements.teamNotificationsToggle) {
            elements.teamNotificationsToggle.dataset.setting =
                "teamNotifications";
        }

        if (elements.darkModeToggle) {
            elements.darkModeToggle.dataset.setting =
                "darkMode";
        }
    }


    /* =========================================================
       DARK MODE
       ========================================================= */

    function applyDarkMode(enabled) {
        document.body.classList.toggle(
            "dark-mode",
            Boolean(enabled)
        );

        /*
         * Keep a simple global flag too so other Venus pages
         * can read it without depending on settings.js.
         */
        try {
            localStorage.setItem(
                "venusDarkMode",
                enabled ? "true" : "false"
            );
        } catch (error) {
            console.warn(
                "Venus settings: could not save dark mode",
                error
            );
        }
    }


    /* =========================================================
       LANGUAGE
       ========================================================= */

    function applyLanguage(language) {
        const normalized =
            language === "en"
                ? "en"
                : "ar";

        document.documentElement.lang =
            normalized;

        document.documentElement.dir =
            normalized === "ar"
                ? "rtl"
                : "ltr";

        /*
         * The current Venus MVP is Arabic-first.
         * We save the selection now so the complete
         * translation system can use the same setting.
         */
        document.body.dataset.language =
            normalized;
    }


    function handleLanguageChange(event) {
        const language =
            event.currentTarget.value;

        updateSetting(
            "language",
            language
        );

        applyLanguage(language);
    }


    /* =========================================================
       LOGOUT
       ========================================================= */

    function logout() {
        /*
        * Keep the user's data, but remove the active session.
         */
        localStorage.removeItem(
            STORAGE_KEYS.currentUser
        );

        localStorage.removeItem(
            STORAGE_KEYS.oldCurrentUser
        );

        /*
         * Do not delete venusUser automatically.
         * It is part of the local profile compatibility
         * system and may be needed when returning.
         */

        window.dispatchEvent(
            new CustomEvent("venus:loggedOut")
        );

        window.location.href =
            "index.html";
    }


    /* =========================================================
       DELETE ACCOUNT
       ========================================================= */

    function removeUserFromArrayStorage(
        key,
        userId
    ) {
        const data = readJSON(
            key,
            null
        );

        if (!Array.isArray(data)) {
            return;
        }

        const filtered = data.filter(
            item =>
                String(
                    item.id ||
                    item.userId ||
                    item.uid ||
                    ""
                ) !== String(userId)
        );

        writeJSON(
            key,
            filtered
        );
    }


    function deleteAccount() {
        const user = getCurrentUser();

        if (!user) {
            logout();
            return;
        }

        const userId =
            getUserId(user);

        /*
         * Remove user from the users list.
         */
        if (userId) {
            removeUserFromArrayStorage(
                STORAGE_KEYS.users,
                userId
            );
        }

        /*
         * Remove this user's notifications.
         */
        const notifications =
            readJSON(
                STORAGE_KEYS.notifications,
                []
            );

        if (Array.isArray(notifications)) {
            const filteredNotifications =
                notifications.filter(
                    notification =>
                        String(
                            notification.userId ||
                            notification.recipientId ||
                            ""
                        ) !== String(userId)
                );

            writeJSON(
                STORAGE_KEYS.notifications,
                filteredNotifications
            );
        }

        /*
         * Remove this user's posts.
         *
         * This is local MVP behavior.
         */
        const posts =
            readJSON(
                STORAGE_KEYS.posts,
                []
            );

        if (Array.isArray(posts)) {
            const filteredPosts =
                posts.filter(post => {
                    const ownerId =
                        post.userId ||
                        post.authorId ||
                        post.ownerId;

                    return String(ownerId) !==
                        String(userId);
                });

            writeJSON(
                STORAGE_KEYS.posts,
                filteredPosts
            );
        }

        /*
         * Remove competition registration.
         */
        const registrations =
            readJSON(
                STORAGE_KEYS.competitionRegistration,
                []
            );

        if (Array.isArray(registrations)) {
            const filteredRegistrations =
                registrations.filter(
                    registration =>
                        String(
                            registration.userId ||
                            registration.id ||
                            ""
                        ) !== String(userId)
                );

            writeJSON(
                STORAGE_KEYS.competitionRegistration,
                filteredRegistrations
            );
        } else if (
            registrations &&
            typeof registrations === "object"
        ) {
            /*
             * Some local MVP versions may store a single
             * registration object.
             */
            const registrationUserId =
                registrations.userId;

            if (
                String(registrationUserId) ===
                String(userId)
            ) {
                localStorage.removeItem(
                    STORAGE_KEYS.competitionRegistration
                );
            }
        }

        /*
         * Remove the current session/profile.
         */
        localStorage.removeItem(
            STORAGE_KEYS.currentUser
        );

        localStorage.removeItem(
            STORAGE_KEYS.oldCurrentUser
        );

        localStorage.removeItem(
            STORAGE_KEYS.profileUser
        );

        /*
         * Remove personal settings.
         */
        localStorage.removeItem(
            STORAGE_KEYS.settings
        );

        window.dispatchEvent(
            new CustomEvent("venus:accountDeleted", {
                detail: {
                    userId
                }
            })
        );

        window.location.href =
            "index.html";
    }


    /* =========================================================
       EVENTS
       ========================================================= */

    function bindEvents() {

        if (elements.accountButton) {
            elements.accountButton.addEventListener(
                "click",
                openAccountModal
            );
        }

        if (elements.profileButton) {
            elements.profileButton.addEventListener(
                "click",
                openProfileSettings
            );
        }

        const toggles = [
            elements.profileVisibilityToggle,
            elements.competitionNameToggle,
            elements.notificationsToggle,
            elements.teamNotificationsToggle,
            elements.darkModeToggle
        ];

        toggles.forEach(toggle => {
            if (!toggle) {
                return;
            }

            toggle.addEventListener(
                "change",
                handleToggleChange
            );
        });


        if (elements.languageSelect) {
            elements.languageSelect.addEventListener(
                "change",
                handleLanguageChange
            );
        }


        /* Account modal */

        if (elements.accountModalOverlay) {
            elements.accountModalOverlay.addEventListener(
                "click",
                () => closeModal(
                    elements.accountModal
                )
            );
        }

        if (elements.accountModalClose) {
            elements.accountModalClose.addEventListener(
                "click",
                () => closeModal(
                    elements.accountModal
                )
            );
        }


        /* Delete modal */

        if (elements.deleteAccountButton) {
            elements.deleteAccountButton.addEventListener(
                "click",
                () => openModal(
                    elements.deleteModal
                )
            );
        }

        if (elements.deleteModalOverlay) {
            elements.deleteModalOverlay.addEventListener(
                "click",
                () => closeModal(
                    elements.deleteModal
                )
            );
        }

        if (elements.cancelDelete) {
            elements.cancelDelete.addEventListener(
                "click",
                () => closeModal(
                    elements.deleteModal
                )
            );
        }

        if (elements.confirmDelete) {
            elements.confirmDelete.addEventListener(
                "click",
                deleteAccount
            );
        }


        /* Logout */

        if (elements.logoutButton) {
            elements.logoutButton.addEventListener(
                "click",
                logout
            );
        }


        /* Escape closes modal */

        document.addEventListener(
            "keydown",
            event => {
                if (event.key !== "Escape") {
                    return;
                }
                closeModal(
                    elements.accountModal
                );

                closeModal(
                    elements.deleteModal
                );
            }
        );
    }


    /* =========================================================
       INITIALIZATION
       ========================================================= */

    function initialize() {
        setupToggleDataAttributes();

        const settings =
            getSettings();

        applySettingsToUI();

        applyDarkMode(
            Boolean(settings.darkMode)
        );

        applyLanguage(
            settings.language
        );

        bindEvents();

        /*
         * If profile.js exists, let it refresh its data.
         */
        if (
            window.VenusProfile &&
            typeof window.VenusProfile.refresh === "function"
        ) {
            try {
                window.VenusProfile.refresh();
            } catch (error) {
                console.warn(
                    "Venus settings: profile refresh failed",
                    error
                );
            }
        }
    }


    /* =========================================================
       PUBLIC API
       ========================================================= */

    window.VenusSettings = {
        getSettings,
        saveSettings,
        updateSetting,
        getCurrentUser,
        saveCurrentUser,
        openAccountModal,
        closeAccountModal: () =>
            closeModal(
                elements.accountModal
            ),
        applyDarkMode,
        applyLanguage,
        logout,
        deleteAccount,
        refresh: () => {
            applySettingsToUI();

            const settings =
                getSettings();

            applyDarkMode(
                Boolean(settings.darkMode)
            );

            applyLanguage(
                settings.language
            );

            fillAccountModal();
        }
    };


    initialize();
});
document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* =========================================================
       VENUS — LOGIN
       Local MVP
       ========================================================= */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    /* =========================================================
       STORAGE KEYS
       ========================================================= */

    const USERS_KEY = "venusUsers";
    const CURRENT_USER_KEY = "venusCurrentUser";
    const OLD_CURRENT_USER_KEY = "currentUser";
    const PROFILE_USER_KEY = "venusUser";

    /* =========================================================
       ELEMENTS
       ========================================================= */

    const loginForm = $("#loginForm");
    const identifierInput = $("#loginIdentifier");
    const passwordInput = $("#loginPassword");
    const togglePasswordButton = $("#toggleLoginPassword");
    const loginButton = $("#loginButton");
    const formMessage = $("#loginFormMessage");

    /* =========================================================
       STORAGE HELPERS
       ========================================================= */

    function readJSON(key, fallback) {
        try {
            const value = localStorage.getItem(key);

            if (!value) {
                return fallback;
            }

            return JSON.parse(value);
        } catch (error) {
            console.error(`Venus: failed to read ${key}`, error);
            return fallback;
        }
    }

    function writeJSON(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Venus: failed to save ${key}`, error);
            return false;
        }
    }

    /* =========================================================
       USERS
       ========================================================= */

    function getUsers() {
        const users = readJSON(USERS_KEY, []);

        if (Array.isArray(users)) {
            return users;
        }

        if (users && typeof users === "object") {
            return Object.values(users);
        }

        return [];
    }

    function saveUsers(users) {
        return writeJSON(USERS_KEY, users);
    }

    /* =========================================================
       NORMALIZE USER
       ========================================================= */

    function normalizeUser(user) {
        if (!user || typeof user !== "object") {
            return null;
        }

        return {
            ...user,

            id: user.id || createUserId(),

            name:
                user.name ||
                user.fullName ||
                user.username ||
                "مستخدم Venus",

            username:
                user.username ||
                createUsername(user.name || "venus_user"),

            email:
                typeof user.email === "string"
                    ? user.email.trim()
                    : "",

            password:
                typeof user.password === "string"
                    ? user.password
                    : "",

            age:
                user.age !== undefined &&
                user.age !== null &&
                user.age !== ""
                    ? Number(user.age)
                    : "",

            school: user.school || "",
            grade: user.grade || "",
            governorate: user.governorate || "",

            teamId: user.teamId || null,
            teamName: user.teamName || "",

            stars:
                Number.isFinite(Number(user.stars))
                    ? Number(user.stars)
                    : 0,

            avatar: user.avatar || "",
            bio: user.bio || "",
            future: user.future || "",

            privacy:
                user.privacy === "private"
                    ? "private"
                    : "public",

            posts: Array.
            isArray(user.posts)
                ? user.posts
                : [],

            projects: Array.isArray(user.projects)
                ? user.projects
                : [],

            highlights: Array.isArray(user.highlights)
                ? user.highlights
                : []
        };
    }

    /* =========================================================
       ID / USERNAME
       ========================================================= */

    function createUserId() {
        return (
            "user_" +
            Date.now().toString(36) +
            "_" +
            Math.random()
                .toString(36)
                .slice(2, 8)
        );
    }

    function createUsername(name) {
        const cleaned = String(name || "venus_user")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^\w\u0600-\u06ff]/g, "");

        return cleaned || "venus_user";
    }

    /* =========================================================
       IDENTIFIER MATCH
       ========================================================= */

    function normalizeIdentifier(value) {
        return String(value || "")
            .trim()
            .toLowerCase();
    }

    function findUser(identifier, password) {
        const normalizedIdentifier =
            normalizeIdentifier(identifier);

        const users = getUsers();

        return (
            users
                .map(normalizeUser)
                .find((user) => {

                    const username =
                        normalizeIdentifier(user.username);

                    const email =
                        normalizeIdentifier(user.email);

                    const name =
                        normalizeIdentifier(user.name);

                    const identifierMatches =
                        normalizedIdentifier === username ||
                        normalizedIdentifier === email ||
                        normalizedIdentifier === name;

                    const passwordMatches =
                        user.password === password;

                    return (
                        identifierMatches &&
                        passwordMatches
                    );
                }) || null
        );
    }

    /* =========================================================
       SAVE CURRENT USER
       ========================================================= */

    function saveCurrentUser(user) {
        const normalized = normalizeUser(user);

        if (!normalized) {
            return false;
        }

        /*
         * Keep the same user in all three places used
         * by the Venus MVP files.
         */

        writeJSON(
            CURRENT_USER_KEY,
            normalized
        );

        writeJSON(
            OLD_CURRENT_USER_KEY,
            normalized
        );

        writeJSON(
            PROFILE_USER_KEY,
            normalized
        );

        return true;
    }

    /* =========================================================
       UPDATE USER IN USERS LIST
       ========================================================= */

    function updateStoredUser(user) {
        const normalized = normalizeUser(user);

        if (!normalized) {
            return false;
        }

        const users = getUsers();

        const index = users.findIndex(
            (existingUser) =>
                String(existingUser.id) ===
                String(normalized.id)
        );

        if (index === -1) {
            users.push(normalized);
        } else {
            users[index] = {
                ...users[index],
                ...normalized
            };
        }

        return saveUsers(users);
    }

    /* =========================================================
       ERROR / SUCCESS MESSAGE
       ========================================================= */

    function showMessage(message, type = "error") {
        if (!formMessage) {
            return;
        }

        formMessage.textContent = message;
        formMessage.dataset.type = type;

        if (type === "success") {
            formMessage.style.background =
                "rgba(52, 120, 75, 0.10)";

            formMessage.style.color =
                "#2f7045";
        } else {
            formMessage.style.background =
                "rgba(143, 22, 40, 0.07)";

            formMessage.style.color =
                "#8f1628";
        }
    }

    function clearMessage() {
        if (!formMessage) {
            return;
        }

        formMessage.textContent = "";
        formMessage.dataset.type = "";
        formMessage.removeAttribute("style");
    }

    /* =========================================================
       PASSWORD VISIBILITY
       ========================================================= */

    if (togglePasswordButton && passwordInput) {

        togglePasswordButton.addEventListener(
            "click",
            () => {

                const isPassword =
                    passwordInput.type === "password";

                passwordInput.type =
                    isPassword
                        ? "text"
                        : "password";

                togglePasswordButton.textContent =
                    isPassword
                        ? "○"
                        : "◉";

                togglePasswordButton.setAttribute(
                    "aria-label",
                    isPassword
                        ? "إخفاء كلمة المرور"
                        : "إظهار كلمة المرور"
                );
            }
        );
    }

    /* =========================================================
       LOGIN
       ========================================================= */

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            (event) => {

                event.preventDefault();

                clearMessage();

                const identifier =
                    identifierInput
                        ? identifierInput.value.trim()
                        : "";

                const password =
                    passwordInput
                        ? passwordInput.value
                        : "";

                /* -----------------------------------------
                   Validation
                   ----------------------------------------- */

                if (!identifier) {
                    showMessage(
                        "أدخل اسم المستخدم أو البريد الإلكتروني."
                    );

                    identifierInput?.focus();

                    return;
                }

                if (!password) {
                    showMessage(
                        "أدخل كلمة المرور."
                    );

                    passwordInput?.focus();

                    return;
                }

                /* -----------------------------------------
                   Disable button
                   ----------------------------------------- */

                if (loginButton) {
                    loginButton.disabled = true;
                    loginButton.textContent =
                        "جارٍ تسجيل الدخول...";
                }

                /* -----------------------------------------
                   Find user
                   ----------------------------------------- */

                const user =
                    findUser(
                        identifier,
                        password
                    );

                if (!user) {

                    showMessage(
                        "بيانات الدخول غير صحيحة. تأكد من اسم المستخدم وكلمة المرور."
                    );

                    if (loginButton) {
                        loginButton.disabled = false;
                        loginButton.textContent =
                            "تسجيل الدخول";
                    }

                    return;
                }

                /* -----------------------------------------
                   Save session
                   ----------------------------------------- */
                   const saved =
                    saveCurrentUser(user);

                if (!saved) {

                    showMessage(
                        "حدث خطأ أثناء حفظ جلسة الدخول."
                    );

                    if (loginButton) {
                        loginButton.disabled = false;
                        loginButton.textContent =
                            "تسجيل الدخول";
                    }

                    return;
                }

                /*
                 * Make sure the normalized user is also
                 * available in the main users collection.
                 */

                updateStoredUser(user);

                /* -----------------------------------------
                   Notify Venus
                   ----------------------------------------- */

                window.dispatchEvent(
                    new CustomEvent(
                        "venus:userLoggedIn",
                        {
                            detail: {
                                user: normalizeUser(user)
                            }
                        }
                    )
                );

                try {
                    localStorage.setItem(
                        "venusLastLogin",
                        new Date().toISOString()
                    );
                } catch (error) {
                    console.warn(
                        "Venus: could not save last login",
                        error
                    );
                }

                /* -----------------------------------------
                   Success
                   ----------------------------------------- */

                showMessage(
                    "تم تسجيل الدخول بنجاح. جارٍ فتح Venus...",
                    "success"
                );

                setTimeout(() => {
                    window.location.href =
                        "home.html";
                }, 500);
            }
        );
    }

    /* =========================================================
       INITIAL STATE
       ========================================================= */

    if (identifierInput) {
        identifierInput.addEventListener(
            "input",
            clearMessage
        );
    }

    if (passwordInput) {
        passwordInput.addEventListener(
            "input",
            clearMessage
        );
    }

    console.log("Venus Login initialized.");
});
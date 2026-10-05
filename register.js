document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* =========================================================
       VENUS — REGISTER
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

    const form = $("#registerForm");

    const nameInput = $("#registerName");
    const usernameInput = $("#registerUsername");
    const emailInput = $("#registerEmail");
    const ageInput = $("#registerAge");
    const governorateInput = $("#registerGovernorate");
    const schoolInput = $("#registerSchool");

    const passwordInput = $("#registerPassword");
    const confirmPasswordInput =
        $("#registerConfirmPassword");

    const publicNameInput =
        $("#registerPublicName");

    const togglePassword =
        $("#toggleRegisterPassword");

    const toggleConfirmPassword =
        $("#toggleRegisterConfirmPassword");

    const registerButton =
        $("#registerButton");

    const formMessage =
        $("#registerFormMessage");


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
            console.error(
                `Venus: failed to read ${key}`,
                error
            );

            return fallback;
        }
    }


    function writeJSON(key, value) {
        try {
            localStorage.setItem(
                key,
                JSON.stringify(value)
            );

            return true;
        } catch (error) {
            console.error(
                `Venus: failed to save ${key}`,
                error
            );

            return false;
        }
    }


    /* =========================================================
       USERS
       ========================================================= */

    function getUsers() {

        const users =
            readJSON(
                USERS_KEY,
                []
            );

        if (Array.isArray(users)) {
            return users;
        }

        if (
            users &&
            typeof users === "object"
        ) {
            return Object.values(users);
        }

        return [];
    }


    function saveUsers(users) {
        return writeJSON(
            USERS_KEY,
            users
        );
    }


    /* =========================================================
       HELPERS
       ========================================================= */

    function createUserId() {

        return (
            "user_" +
            Date.now().toString(36) +
            "_" +
            Math.random()
                .toString(36)
                .slice(2, 9)
        );
    }


    function normalizeUsername(value) {

        return String(value || "")
            .trim()
            .toLowerCase()
            .replace(/^@+/, "")
            .replace(/\s+/g, "_");
    }


    function normalizeEmail(value) {

        return String(value || "")
            .trim()
            .toLowerCase();
    }


    function normalizeText(value) {

        return String(value || "")
            .trim();
    }


    /* =========================================================
       MESSAGE
       ========================================================= */

    function showMessage(
        message,
        type = "error"
    ) {

        if (!formMessage) {
            return;
        }

        formMessage.textContent =
            message;

        formMessage.dataset.type =
            type;

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

        formMessage.removeAttribute(
            "style"
        );
    }


    /* =========================================================
       PASSWORD VISIBILITY
       ========================================================= */

    function setupPasswordToggle(
        button,
        input
    ) {

        if (!button || !input) {
            return;
        }

        button.addEventListener(
            "click",
            () => {

                const isPassword =
                    input.type === "password";

                input.type =
                    isPassword
                        ? "text"
                        : "password";

                button.textContent =
                    isPassword
                        ? "○"
                        : "◉";

                button.setAttribute(
                    "aria-label",
                    isPassword
                        ? "إخفاء كلمة المرور"
                        : "إظهار كلمة المرور"
                );
            }
        );
    }


    setupPasswordToggle(
        togglePassword,
        passwordInput
    );

    setupPasswordToggle(
        toggleConfirmPassword,
        confirmPasswordInput
    );


    /* =========================================================
       CHECK USERNAME
       ========================================================= */

    function usernameExists(
        username,
        users
    ) {

        const normalized =
            normalizeUsername(username);

        return users.some(
            (user) =>
                normalizeUsername(
                    user.username
                ) === normalized
        );
    }


    /* =========================================================
       CHECK EMAIL
       ========================================================= */

    function emailExists(
        email,
        users
    ) {

        if (!email) {
            return false;
        }

        const normalized =
            normalizeEmail(email);

        return users.some(
            (user) =>
                normalizeEmail(
                    user.email
                ) === normalized
        );
    }


    /* =========================================================
       VALIDATE
       ========================================================= */

    function validateForm() {

        const name =
            normalizeText(
                nameInput?.value
            );

        const username =
            normalizeUsername(
                usernameInput?.value
            );

        const email =
            normalizeEmail(
                emailInput?.value
            );

        const age =
            ageInput?.value
                ? Number(
                    ageInput.value
                )
                : null;

        const password =
            passwordInput?.value || "";

        const confirmPassword =
            confirmPasswordInput?.value || "";

        /* -----------------------------------------
           NAME
           ----------------------------------------- */

        if (!name) {

            return {
                valid: false,
                message:
                    "أدخل الاسم."
                    };
        }


        if (name.length < 2) {

            return {
                valid: false,
                message:
                    "الاسم قصير جداً."
            };
        }


        /* -----------------------------------------
           USERNAME
           ----------------------------------------- */

        if (!username) {

            return {
                valid: false,
                message:
                    "أدخل اسم المستخدم."
            };
        }


        if (username.length < 3) {

            return {
                valid: false,
                message:
                    "اسم المستخدم يجب أن يحتوي على 3 أحرف على الأقل."
            };
        }


        if (
            !/^[a-zA-Z0-9_\u0600-\u06ff]+$/.test(
                username
            )
        ) {

            return {
                valid: false,
                message:
                    "اسم المستخدم يمكن أن يحتوي على الأحرف والأرقام والشرطة السفلية فقط."
            };
        }


        /* -----------------------------------------
           EMAIL
           ----------------------------------------- */

        if (email) {

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (
                !emailPattern.test(email)
            ) {

                return {
                    valid: false,
                    message:
                        "أدخل بريداً إلكترونياً صحيحاً."
                };
            }
        }


        /* -----------------------------------------
           AGE
           ----------------------------------------- */

        if (age !== null) {

            if (
                !Number.isFinite(age) ||
                age < 5 ||
                age > 100
            ) {

                return {
                    valid: false,
                    message:
                        "أدخل عمراً صحيحاً."
                };
            }
        }


        /* -----------------------------------------
           PASSWORD
           ----------------------------------------- */

        if (!password) {

            return {
                valid: false,
                message:
                    "أدخل كلمة المرور."
            };
        }


        if (password.length < 6) {

            return {
                valid: false,
                message:
                    "كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل."
            };
        }


        /* -----------------------------------------
           CONFIRM PASSWORD
           ----------------------------------------- */

        if (
            password !==
            confirmPassword
        ) {

            return {
                valid: false,
                message:
                    "كلمتا المرور غير متطابقتين."
            };
        }


        return {
            valid: true,
            data: {
                name,
                username,
                email,
                age,
                governorate:
                    governorateInput?.value || "",
                school:
                    normalizeText(
                        schoolInput?.value
                    ),
                password,
                privacy:
                    publicNameInput?.checked
                        ? "public"
                        : "private"
            }
        };
    }


    /* =========================================================
       CREATE USER
       ========================================================= */

    function createUser(data) {

        const users =
            getUsers();

        /* -----------------------------------------
           Duplicate username
           ----------------------------------------- */

        if (
            usernameExists(
                data.username,
                users
            )
        ) {

            return {
                success: false,
                message:
                    "اسم المستخدم مستخدم بالفعل."
            };
        }
        /* -----------------------------------------
           Duplicate email
           ----------------------------------------- */

        if (
            data.email &&
            emailExists(
                data.email,
                users
            )
        ) {

            return {
                success: false,
                message:
                    "هذا البريد الإلكتروني مستخدم بالفعل."
            };
        }


        /* -----------------------------------------
           User object
           ----------------------------------------- */

        const user = {

            id: createUserId(),

            name: data.name,

            username:
                data.username,

            email:
                data.email,

            password:
                data.password,

            age:
                data.age,

            school:
                data.school,

            grade: "",

            governorate:
                data.governorate,

            teamId: null,

            teamName: "",

            stars: 0,

            avatar: "",

            bio: "",

            future: "",

            privacy:
                data.privacy,

            posts: [],

            projects: [],

            highlights: [],

            createdAt:
                new Date().toISOString()
        };


        /* -----------------------------------------
           Save
           ----------------------------------------- */

        users.push(user);

        const saved =
            saveUsers(users);

        if (!saved) {

            return {
                success: false,
                message:
                    "تعذر حفظ الحساب. حاول مرة أخرى."
            };
        }


        return {
            success: true,
            user
        };
    }


    /* =========================================================
       SAVE CURRENT USER
       ========================================================= */

    function saveCurrentUser(user) {

        const data =
            JSON.stringify(user);

        try {

            localStorage.setItem(
                CURRENT_USER_KEY,
                data
            );

            localStorage.setItem(
                OLD_CURRENT_USER_KEY,
                data
            );

            localStorage.setItem(
                PROFILE_USER_KEY,
                data
            );

            return true;

        } catch (error) {

            console.error(
                "Venus: failed to save current user",
                error
            );

            return false;
        }
    }


    /* =========================================================
       SUBMIT
       ========================================================= */

    if (form) {

        form.addEventListener(
            "submit",
            (event) => {

                event.preventDefault();

                clearMessage();

                const validation =
                    validateForm();

                if (!validation.valid) {

                    showMessage(
                        validation.message
                    );

                    return;
                }


                if (registerButton) {

                    registerButton.disabled =
                        true;

                    registerButton.textContent =
                        "جارٍ إنشاء الحساب...";
                }


                const result =
                    createUser(
                        validation.data
                    );


                if (!result.success) {

                    showMessage(
                        result.message
                    );

                    if (registerButton) {

                        registerButton.disabled =
                            false;

                        registerButton.textContent =
                            "إنشاء الحساب";
                    }

                    return;
                }


                /* -----------------------------------------
                   Create session
                   ----------------------------------------- */

                const sessionSaved =
                    saveCurrentUser(
                        result.user
                    );


                if (!sessionSaved) {

                    showMessage(
                        "تم إنشاء الحساب، لكن تعذر تسجيل الدخول تلقائياً."
                    );

                    if (registerButton) {

                        registerButton.disabled =
                            false;

                        registerButton.textContent =
                            "إنشاء الحساب";
                    }

                    return;
                }


                /* -----------------------------------------
                   Events
                   ----------------------------------------- */

                window.dispatchEvent(
                    new CustomEvent(
                        "venus:userRegistered",
                        {
                            detail: {
                                user:
                                    result.user
                            }
                        }
                    )
                );


                window.dispatchEvent(
                    new CustomEvent(
                        "venus:userLoggedIn",
                        {
                            detail: {
                                user:
                                    result.user
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
                    "تم إنشاء الحساب بنجاح. جارٍ فتح Venus...",
                    "success"
                );


                setTimeout(
                    () => {
                        window.location.href =
                            "home.html";
                    },
                    600
                );
            }
        );
    }


    /* =========================================================
       CLEAR ERROR WHILE TYPING
       ========================================================= */

    [
        nameInput,
        usernameInput,
        emailInput,
        ageInput,
        governorateInput,
        schoolInput,
        passwordInput,
        confirmPasswordInput
    ]
        .filter(Boolean)
        .forEach(
            (input) => {

                input.addEventListener(
                    "input",
                    clearMessage
                );

                input.addEventListener(
                    "change",
                    clearMessage
                );
            }
        );


    /* =========================================================
       PUBLIC API
       ========================================================= */

    window.VenusRegister = {

        getUsers,

        createUser,

        validateForm,

        saveCurrentUser
    };


    console.log(
        "Venus Register initialized."
    );
});
document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* =========================================================
       VENUS — PROFILE.JS
       Volunteer Profile System — Local MVP
       ========================================================= */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];


    /* =========================================================
       STORAGE
       ========================================================= */

    const getData = (key, fallback = null) => {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : fallback;
        } catch (error) {
            console.error(`VENUS: Cannot read ${key}`, error);
            return fallback;
        }
    };

    const saveData = (key, value) => {
        try {
            localStorage.setItem(
                key,
                JSON.stringify(value)
            );
        } catch (error) {
            console.error(`VENUS: Cannot save ${key}`, error);
        }
    };


    /* =========================================================
       CURRENT USER
       ========================================================= */

    let currentUser =
        getData("venusCurrentUser") ||
        getData("currentUser") ||
        getData("venusUser") ||
        null;


    /* =========================================================
       DEFAULT USER
       ========================================================= */

    if (!currentUser) {

        currentUser = {

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

            avatar: "",

            bio: "",

            future: "",

            privacy: "public",

            posts: [],

            projects: [],

            highlights: []

        };

        saveData(
            "venusCurrentUser",
            currentUser
        );
    }


    /* =========================================================
       USER NORMALIZATION
       ========================================================= */

    const normalizeUser = (user) => {

        return {

            id:
                user.id ||
                user.userId ||
                "volunteer_" + Date.now(),

            name:
                user.name ||
                user.fullName ||
                "متطوع Venus",

            username:
                user.username ||
                user.nickname ||
                "",

            age:
                Number(user.age) || 0,

            school:
                user.school || "",

            grade:
                user.grade || "",

            governorate:
                user.governorate || "",

            teamId:
                user.teamId || null,

            teamName:
                user.teamName || "",

            stars:
                Number(user.stars) || 0,

            avatar:
                user.avatar ||
                user.profilePicture ||
                user.image ||
                "",

            bio:
                user.bio || "",

            future:
                user.future ||
                user.futureGoal ||
                "",

            privacy:
                user.privacy === "private"
                    ? "private"
                    : "public",

            posts:
                Array.isArray(user.posts)
                    ? user.posts
                    : [],

            projects:
                Array.isArray(user.projects)
                    ? user.projects
                    : [],

            highlights:
                Array.isArray(user.highlights)
                    ? user.highlights
                    : []

        };
    };


    currentUser =
    normalizeUser(currentUser);


    saveData(
        "venusCurrentUser",
        currentUser
    );

    saveData(
        "currentUser",
        currentUser
    );


    /* =========================================================
       PROFILE ELEMENTS
       ========================================================= */

    const avatar =
        $("#profileAvatar") ||
        $(".profile-avatar");

    const avatarInput =
        $("#profileAvatarInput");

    const nameElement =
        $("#profileName") ||
        $(".profile-name");

    const usernameElement =
        $("#profileUsername") ||
        $(".profile-username");

    const ageElement =
        $("#profileAge");

    const schoolElement =
        $("#profileSchool");

    const gradeElement =
        $("#profileGrade");

    const governorateElement =
        $("#profileGovernorate");

    const teamElement =
        $("#profileTeam");

    const starsElement =
        $("#profileStars");

    const postsElement =
        $("#profilePosts");

    const projectsElement =
        $("#profileProjects");

    const bioElement =
        $("#profileBio");

    const futureElement =
        $("#profileFuture");

    const privacyElement =
        $("#profilePrivacy");


    /* =========================================================
       SET TEXT SAFELY
       ========================================================= */

    const setText = (
        element,
        value,
        fallback = ""
    ) => {

        if (!element) return;

        element.textContent =
            value || fallback;
    };


    /* =========================================================
       LOAD TEAM
       ========================================================= */

    const getUserTeam = () => {

        if (
            window.VenusTeam &&
            typeof window.VenusTeam.getUserTeam ===
            "function"
        ) {
            return VenusTeam.getUserTeam(
                currentUser.id
            );
        }

        return null;
    };


    /* =========================================================
       RENDER PROFILE
       ========================================================= */

    const renderProfile = () => {

        setText(
            nameElement,
            currentUser.name,
            "متطوع Venus"
        );


        if (usernameElement) {

            usernameElement.textContent =
                currentUser.username
                    ? `@${currentUser.username}`
                    : "";
        }


        setText(
            ageElement,
            currentUser.age
                ? `${currentUser.age} سنة`
                : "—"
        );


        setText(
            schoolElement,
            currentUser.school,
            "لم تتم إضافة المدرسة"
        );


        setText(
            gradeElement,
            currentUser.grade,
            "لم تتم إضافة الصف"
        );


        setText(
            governorateElement,
            currentUser.governorate,
            "لم تتم إضافة المحافظة"
        );


        /* Team */

        const team =
            getUserTeam();


        if (team) {

            setText(
                teamElement,
                team.name,
                "—"
            );

        } else {

            setText(
                teamElement,
                currentUser.teamName,
                "بدون فريق"
            );
        }


        /* Stars */

        setText(
            starsElement,
            currentUser.stars,
            "0"
        );


        /* Posts */

        setText(
            postsElement,
            currentUser.posts.length,
            "0"
        );


        /* Projects */

        setText(
            projectsElement,
            currentUser.projects.length,
            "0"
        );


        /* Bio */

        setText(
            bioElement,
            currentUser.bio,
            "لا توجد نبذة بعد."
        );


        /* Future */

        setText(
            futureElement,
            currentUser.future,
            "لم تتم إضافة الإجابة بعد."
        );


        /* Privacy */

        if (privacyElement) {

            privacyElement.textContent =
                currentUser.privacy === "private"
                    ? "خاص"
                    : "عام";
        }


        /* Avatar */

        if (avatar) {

            if (currentUser.avatar) {

                if (
                    avatar.tagName === "IMG"
                ) {

                    avatar.src =
                        currentUser.avatar;

                } else {

                    avatar.style.backgroundImage =
                        `url("${currentUser.avatar}")`;

                    avatar.textContent = "";
                }

            } else {

                if (
                    avatar.tagName !== "IMG"
                ) {

                    avatar.textContent =
                        getInitial(
                            currentUser.name
                        );
                }
            }
        }
    };


    /* =========================================================
       INITIAL
       ========================================================= */

    const getInitial = (name) => {

        const clean =
            String(name || "")
                .trim();

        return clean
            ? clean.charAt(0)
            : "V";
    };


    /* =========================================================
       PROFILE EDIT MODAL
       ========================================================= */

    const editModal =
        $("#editProfileModal");

    const openEditButton =
        $("#editProfileButton");

    const closeEditButton =
        $("#closeEditProfile");

    const closeEditOverlay =
        $("#closeEditProfileOverlay");


    const editName =
        $("#editProfileName");

    const editUsername =
        $("#editProfileUsername");

    const editAge =
        $("#editProfileAge");

    const editSchool =
        $("#editProfileSchool");

    const editGrade =
        $("#editProfileGrade");

    const editGovernorate =
        $("#editProfileGovernorate");

    const editBio =
        $("#editProfileBio");

    const editFuture =
        $("#editProfileFuture");

    const editPrivacy =
        $("#editProfilePrivacy");

    const saveProfileButton =
        $("#saveProfileButton");


    /* =========================================================
       OPEN EDIT
       ========================================================= */

    const openEditProfile = () => {

        if (!editModal) return;


        if (editName)
            editName.value =
                currentUser.name || "";


        if (editUsername)
            editUsername.value =
                currentUser.username || "";


        if (editAge)
            editAge.value =
                currentUser.age || "";


        if (editSchool)
            editSchool.value =
                currentUser.school || "";


        if (editGrade)
            editGrade.value =
                currentUser.grade || "";


        if (editGovernorate)
            editGovernorate.value =
                currentUser.governorate || "";


        if (editBio)
            editBio.value =
                currentUser.bio || "";


        if (editFuture)
            editFuture.value =
                currentUser.future || "";


        if (editPrivacy)
            editPrivacy.value =
                currentUser.privacy || "public";


        editModal.hidden = false;

        document.body.style.overflow =
            "hidden";
    };


    /* =========================================================
       CLOSE EDIT
       ========================================================= */

    const closeEditProfile = () => {

        if (!editModal) return;

        editModal.hidden = true;

        document.body.style.overflow =
            "";
    };


    /* =========================================================
       SAVE PROFILE
       ========================================================= */

    const saveProfile = () => {
    if (editName) {

            const name =
                editName.value.trim();

            if (name) {

                currentUser.name =
                    name;
            }
        }


        if (editUsername) {

            currentUser.username =
                editUsername.value
                    .trim()
                    .replace(/^@/, "");
        }


        if (editAge) {

            currentUser.age =
                Number(editAge.value) || 0;
        }


        if (editSchool) {

            currentUser.school =
                editSchool.value.trim();
        }


        if (editGrade) {

            currentUser.grade =
                editGrade.value.trim();
        }


        if (editGovernorate) {

            currentUser.governorate =
                editGovernorate.value.trim();
        }


        if (editBio) {

            currentUser.bio =
                editBio.value.trim();
        }


        if (editFuture) {

            currentUser.future =
                editFuture.value.trim();
        }


        if (editPrivacy) {

            currentUser.privacy =
                editPrivacy.value === "private"
                    ? "private"
                    : "public";
        }


        saveData(
            "venusCurrentUser",
            currentUser
        );

        saveData(
            "currentUser",
            currentUser
        );


        renderProfile();

        closeEditProfile();
    };


    /* =========================================================
       AVATAR
       ========================================================= */

    if (avatarInput) {

        avatarInput.addEventListener(
            "change",
            event => {

                const file =
                    event.target.files?.[0];

                if (!file) return;


                if (
                    !file.type.startsWith("image/")
                ) {
                    alert(
                        "اختار صورة فقط."
                    );

                    return;
                }


                const reader =
                    new FileReader();


                reader.onload = () => {

                    currentUser.avatar =
                        reader.result;


                    saveData(
                        "venusCurrentUser",
                        currentUser
                    );

                    saveData(
                        "currentUser",
                        currentUser
                    );


                    renderProfile();
                };


                reader.readAsDataURL(file);
            }
        );
    }


    /* =========================================================
       TEAM CLICK
       ========================================================= */

    if (teamElement) {

        teamElement.style.cursor =
            "pointer";


        teamElement.addEventListener(
            "click",
            () => {

                const team =
                    getUserTeam();

                if (!team) return;


                if (
                    window.VenusTeam &&
                    typeof window.VenusTeam.renderTeam ===
                    "function"
                ) {

                    console.log(
                        "VENUS Team:",
                        team
                    );
                }
            }
        );
    }


    /* =========================================================
       EVENT LISTENERS
       ========================================================= */

    openEditButton?.addEventListener(
        "click",
        openEditProfile
    );


    closeEditButton?.addEventListener(
        "click",
        closeEditProfile
    );


    closeEditOverlay?.addEventListener(
        "click",
        closeEditProfile
    );


    saveProfileButton?.addEventListener(
        "click",
        saveProfile
    );


    /* =========================================================
       ESCAPE
       ========================================================= */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeEditProfile();
            }
        }
    );


    /* =========================================================
       PUBLIC PROFILE API
       ========================================================= */

    window.VenusProfile = {

        getUser: () =>
            ({ ...currentUser }),

        updateUser: updates => {

            currentUser = normalizeUser({
                ...currentUser,
                ...updates
            });


            saveData(
                "venusCurrentUser",
                currentUser
            );

            saveData(
                "currentUser",
                currentUser
            );


            renderProfile();

            return {
                ...currentUser
            };
        },

        refresh: renderProfile,

        getTeam: getUserTeam
    };


    /* =========================================================
       START
       ========================================================= */

    renderProfile();


    console.log(
        "VENUS Profile System loaded successfully."
    );

});
document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* =========================================================
       VENUS — RANKINGS SYSTEM
       Local MVP
       Individual + Team Leaderboards
       ========================================================= */

    /* =========================================================
       HELPERS
       ========================================================= */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];

    const escapeHTML = (value) => {
        const div = document.createElement("div");
        div.textContent = value ?? "";
        return div.innerHTML;
    };

    const normalizeText = (value) =>
        String(value ?? "").trim();

    const getInitial = (name) => {
        const cleanName = normalizeText(name);

        if (!cleanName) {
            return "V";
        }

        return cleanName.charAt(0).toUpperCase();
    };


    /* =========================================================
       STORAGE
       ========================================================= */

    const readArray = (keys) => {
        for (const key of keys) {
            try {
                const raw = localStorage.getItem(key);

                if (!raw) {
                    continue;
                }

                const parsed = JSON.parse(raw);

                if (Array.isArray(parsed)) {
                    return parsed;
                }
            } catch (error) {
                console.warn(
                    `Venus Rankings: failed to read ${key}`,
                    error
                );
            }
        }

        return [];
    };


    const getCurrentUser = () => {
        const keys = [
            "venusCurrentUser",
            "currentUser",
            "venusUser"
        ];

        for (const key of keys) {
            try {
                const raw = localStorage.getItem(key);

                if (!raw) {
                    continue;
                }

                const user = JSON.parse(raw);

                if (user && typeof user === "object") {
                    return user;
                }
            } catch (error) {
                console.warn(
                    `Venus Rankings: failed to read ${key}`,
                    error
                );
            }
        }

        return null;
    };


    const getCurrentUserId = () => {
        const user = getCurrentUser();

        return user?.id ||
            user?.userId ||
            user?.uid ||
            null;
    };


    /* =========================================================
       USERS
       ========================================================= */

    const getUsers = () => {
        let users = readArray([
            "venusUsers",
            "users"
        ]);

        const currentUser = getCurrentUser();

        /*
         * If the current user exists but is not inside
         * the users array, add them temporarily so their
         * ranking is visible.
         */

        if (currentUser) {
            const currentId =
                currentUser.id ||
                currentUser.userId ||
                currentUser.uid;

            const exists = users.some((user) => {
                const id =
                    user?.id ||
                    user?.userId ||
                    user?.uid;

                return id && currentId && id === currentId;
            });

            if (!exists) {
                users.push(currentUser);
            }
        }

        /*
         * Demo fallback.
         * This keeps the rankings page from looking broken
         * in a completely fresh local project.
         */

        if (!users.length) {
            users = [
                {
                    id: "demo_volunteer",
                    name: "متطوع Venus",
                    username: "venus_volunteer",
                    age: 16,
                    school: "",
                    teamId: null,
                    teamName: "",
                    stars: 0,
                    avatar: "",
                    privacy: "public"
                }
            ];
        }

        return users;
    };


    const normalizeUser = (user) => {
        const source = user || {};

        return {
            id:
                source.id ||
                source.userId ||
                source.uid ||
                `user_${Math.random().toString(36).slice(2)}`,

            name:
                normalizeText(
                    source.name ||
                    source.fullName ||
                    source.displayName
                ) || "متطوع Venus",

            username:
                normalizeText(
                    source.username ||
                    source.userName ||
                    source.handle
                ),

            stars: Math.max(
                0,
                Number(
                    source.stars ??
                    source.totalStars ??
                    source.points ??
                    0
                ) || 0
            ),

            avatar:
                normalizeText(
                    source.avatar ||
                    source.photoURL ||
                    source.image
                ),

            teamId:
                source.teamId ||
                null,

            teamName:
                normalizeText(
                    source.teamName ||
                    ""
                ),

            privacy:
                source.privacy ||
                "public"
        };
    };


    /* =========================================================
       TEAMS
       ========================================================= */

    const getTeams = () => {

        /*
         * Use the existing Venus team system first.
         */

        if (
            window.VenusTeam &&
            typeof window.VenusTeam.getTeams === "function"
        ) {
            try {
                const teams = window.VenusTeam.getTeams();

                if (Array.isArray(teams)) {
                    return teams;
                }
            } catch (error) {
                console.warn(
                    "Venus Rankings: VenusTeam.getTeams failed.",
                    error
                );
            }
        }


        /*
         * Fallback for local storage.
         */

        return readArray([
            "venusTeams",
            "teams"
        ]);
    };


    const normalizeTeam = (team) => {
        const source = team || {};

        const members = Array.isArray(source.members)
            ? source.members
            : [];

        return {
            id:
                source.id ||
                source.teamId ||
                `team_${Math.random().toString(36).slice(2)}`,

            name:
                normalizeText(
                    source.name ||
                    source.teamName
                ) || "فريق Venus",

            description:
                normalizeText(
                    source.description
                ),

            avatar:
                normalizeText(
                    source.avatar ||
                    source.image
                ),

            ownerId:
                source.ownerId ||
                source.owner?.id ||
                null,

            members,

            stars: Math.max(
                0,
                Number(
                    source.stars ??
                    source.totalStars ??
                    0
                ) || 0
            )
        };
    };


    /* =========================================================
       TEAM STAR CALCULATION
       ========================================================= */

    const calculateTeamStars = (team) => {

        /*
         * Prefer the official team.js calculation.
         */

        if (
            window.VenusTeam &&
            typeof window.VenusTeam.calculateTeamStars === "function"
        ) {
            try {
            const calculated =
                    Number(
                        window.VenusTeam.calculateTeamStars(team)
                    );

                if (Number.isFinite(calculated)) {
                    return Math.max(0, calculated);
                }
            } catch (error) {
                console.warn(
                    "Venus Rankings: team star calculation failed.",
                    error
                );
            }
        }


        /*
         * Fallback:
         * Add member stars.
         */

        const users = getUsers();

        const normalizedTeam = normalizeTeam(team);

        if (!normalizedTeam.members.length) {
            return normalizedTeam.stars;
        }

        let total = 0;

        normalizedTeam.members.forEach((member) => {

            const memberId =
                member?.id ||
                member?.userId ||
                member?.uid;

            const foundUser = users.find((user) => {

                const userId =
                    user?.id ||
                    user?.userId ||
                    user?.uid;

                return (
                    memberId &&
                    userId &&
                    memberId === userId
                );
            });

            if (foundUser) {
                total += Number(
                    foundUser.stars ||
                    foundUser.totalStars ||
                    0
                ) || 0;

                return;
            }

            total += Number(
                member?.stars ||
                member?.totalStars ||
                0
            ) || 0;
        });

        /*
         * If the team has a stored star value larger than
         * the calculated member total, preserve it.
         */

        return Math.max(
            total,
            normalizedTeam.stars
        );
    };


    /* =========================================================
       BUILD RANKINGS
       ========================================================= */

    const buildIndividualRanking = () => {

        const users = getUsers();

        return users
            .map(normalizeUser)

            /*
             * Private profiles are not shown in the public
             * ranking unless they are the current user.
             */

            .filter((user) => {

                const currentId = getCurrentUserId();

                if (
                    user.privacy === "private" &&
                    user.id !== currentId
                ) {
                    return false;
                }

                return true;
            })

            .sort((a, b) => {

                if (b.stars !== a.stars) {
                    return b.stars - a.stars;
                }

                return a.name.localeCompare(
                    b.name,
                    "ar"
                );
            });
    };


    const buildTeamRanking = () => {

        const teams = getTeams();

        return teams
            .map((team) => {

                const normalized = normalizeTeam(team);

                return {
                    ...normalized,
                    stars: calculateTeamStars(normalized)
                };
            })

            .sort((a, b) => {

                if (b.stars !== a.stars) {
                    return b.stars - a.stars;
                }

                return a.name.localeCompare(
                    b.name,
                    "ar"
                );
            });
    };


    /* =========================================================
       AVATARS
       ========================================================= */

    const renderAvatar = (
        avatar,
        name,
        className = "ranking-avatar"
    ) => {

        const safeName = escapeHTML(name);
        const initial = escapeHTML(getInitial(name));

        if (avatar) {
            return `
                <div class="${className}">
                    <img
                        src="${escapeHTML(avatar)}"
                        alt="${safeName}"
                        loading="lazy"
                    >
                </div>
            `;
        }

        return `
            <div
                class="${className}"
                aria-label="${safeName}"
            >
                ${initial}
            </div>
        `;
    };


    /* =========================================================
       PODIUM
       ========================================================= */

    const renderPodium = (ranking, type) => {

        const container = $("#rankingsPodium");

        if (!container) {
            return;
        }

        container.innerHTML = "";

        if (!ranking.length) {
            return;
        }

        /*
         * We arrange:
         * second | first | third
         */

        const order = [
            ranking[1],
            ranking[0],
            ranking[2]
        ];

        const positions = [
            2,
            1,
            3
        ];

        order.forEach((item, index) => {

            if (!item) {
                return;
            }

            const position = positions[index];

            const isTeam = type === "teams";

            const name =
                isTeam
                    ? item.name
                    : item.name;

            const username =
                isTeam
                    ? `${item.members.length} عضو`
                    : item.username
                        ? `@${item.username}`
                        : "مشارك";

            const avatar = item.avatar;

            const card = document.createElement("article");

            card.className =
                `podium-card ${
                    position === 1
                        ? "first"
                        : position === 2
                            ? "second"
                            : "third"
                }`;

            card.innerHTML = `

                <div class="podium-medal">
                    ${position === 1
                        ? "♛"
                        : position}
                </div>

                ${renderAvatar(
                    avatar,
                    name,
                    "podium-avatar"
                )}

                <h3 class="podium-name">
                    ${escapeHTML(name)}
                </h3>

                <p class="podium-username">
                    ${escapeHTML(username)}
                </p>

                <div class="podium-stars">
                    <span>✦</span>
                    <span>
                        ${item.stars}
                    </span>
                    <span>
                        نجمة
                    </span>
                </div>
            `;

            container.appendChild(card);
        });
    };


    /* =========================================================
       CURRENT USER / TEAM POSITION
       ========================================================= */

    const renderMyRanking = (ranking, type) => {

        const container = $("#myRankingCard");

        if (!container) {
            return;
        }

        const currentId = getCurrentUserId();

        if (!currentId) {
            container.hidden = true;
            return;
        }

        const index = ranking.findIndex((item) => {

            return (
                item.id === currentId ||
                item.ownerId === currentId
            );
        });

        if (index === -1) {
            container.hidden = true;
            return;
        }

        const item = ranking[index];

        const isTeam = type === "teams";

        const name = item.name;

        const subtitle = isTeam
            ? `${item.members.length} عضو`
            : (
                item.username
                    ? `@${item.username}`
                    : "ملف Venus"
            );

        container.hidden = false;

        container.innerHTML = `

            <div class="my-ranking-position">
                #${index + 1}
            </div>

            ${renderAvatar(
            item.avatar,
                name,
                "my-ranking-avatar"
            )}

            <div class="my-ranking-info">

                <strong>
                    ${escapeHTML(name)}
                </strong>

                <span>
                    ${escapeHTML(subtitle)}
                </span>

            </div>

            <div class="my-ranking-stars">
                ✦ ${item.stars}
            </div>
        `;
    };


    /* =========================================================
       LIST ROWS
       ========================================================= */

    const renderIndividualRow = (
        user,
        position
    ) => {

        const currentId = getCurrentUserId();

        const isCurrent =
            currentId &&
            user.id === currentId;

        const teamName =
            user.teamName ||
            "";

        return `
            <article
                class="ranking-row ${
                    isCurrent
                        ? "is-current"
                        : ""
                }"
                data-ranking-id="${escapeHTML(user.id)}"
            >

                <div class="ranking-position">
                    #${position}
                </div>

                ${renderAvatar(
                    user.avatar,
                    user.name
                )}

                <div class="ranking-info">

                    <h3 class="ranking-name">
                        ${escapeHTML(user.name)}
                    </h3>

                    <p class="ranking-username">
                        ${
                            user.username
                                ? `@${escapeHTML(user.username)}`
                                : "مشارك في Venus"
                        }
                    </p>

                    ${
                        teamName
                            ? `
                                <div class="ranking-team">
                                    الفريق:
                                    ${escapeHTML(teamName)}
                                </div>
                            `
                            : ""
                    }

                </div>

                <div class="ranking-stars-box">

                    <span class="ranking-stars">
                        ✦ ${user.stars}
                    </span>

                    <span class="ranking-stars-label">
                        نجمة
                    </span>

                </div>

            </article>
        `;
    };


    const renderTeamRow = (
        team,
        position
    ) => {

        const currentUserId =
            getCurrentUserId();

        const isCurrentTeam =
            currentUserId &&
            team.members.some((member) => {

                const memberId =
                    member?.id ||
                    member?.userId ||
                    member?.uid;

                return memberId === currentUserId;
            });

        const memberCount =
            Array.isArray(team.members)
                ? team.members.length
                : 0;

        return `
            <article
                class="ranking-row team-row ${
                    isCurrentTeam
                        ? "is-current"
                        : ""
                }"
                data-ranking-id="${escapeHTML(team.id)}"
            >

                <div class="ranking-position">
                    #${position}
                </div>

                ${renderAvatar(
                    team.avatar,
                    team.name
                )}

                <div class="ranking-info">

                    <h3 class="ranking-name">
                        ${escapeHTML(team.name)}
                    </h3>

                    <p class="ranking-username">
                        فريق Venus
                    </p>

                    <div class="team-ranking-members">

                        ${memberCount}
                        عضو

                        ${
                        team.ownerId
                                ? `
                                    <span class="team-ranking-owner">
                                        · فريق مسجل
                                    </span>
                                `
                                : ""
                        }

                    </div>

                </div>

                <div class="ranking-stars-box">

                    <span class="ranking-stars">
                        ✦ ${team.stars}
                    </span>

                    <span class="ranking-stars-label">
                        نجمة الفريق
                    </span>

                </div>

            </article>
        `;
    };


    /* =========================================================
       MAIN RENDER
       ========================================================= */

    let currentType = "individual";


    const getCurrentRanking = () => {

        return currentType === "teams"
            ? buildTeamRanking()
            : buildIndividualRanking();
    };


    const render = () => {

        const ranking = getCurrentRanking();

        const list = $("#rankingsList");
        const empty = $("#rankingsEmpty");
        const count = $("#rankingCount");
        const title = $("#rankingListTitle");
        const subtitle = $("#rankingListSubtitle");

        if (!list) {
            return;
        }


        /* Header */

        if (currentType === "teams") {

            if (title) {
                title.textContent = "الفرق";
            }

            if (subtitle) {
                subtitle.textContent =
                    "الترتيب حسب مجموع نجوم أعضاء الفريق";
            }

        } else {

            if (title) {
                title.textContent = "المشاركون";
            }

            if (subtitle) {
                subtitle.textContent =
                    "الترتيب حسب مجموع النجوم";
            }
        }


        /* Count */

        if (count) {
            count.textContent = ranking.length;
        }


        /* Podium */

        renderPodium(
            ranking,
            currentType
        );


        /* Current user */

        renderMyRanking(
            ranking,
            currentType
        );


        /* Empty */

        if (!ranking.length) {

            list.innerHTML = "";

            if (empty) {
                empty.hidden = false;
            }

            return;
        }


        if (empty) {
            empty.hidden = true;
        }


        /* Rows */

        if (currentType === "teams") {

            list.innerHTML = ranking
                .map((team, index) =>
                    renderTeamRow(
                        team,
                        index + 1
                    )
                )
                .join("");

        } else {

            list.innerHTML = ranking
                .map((user, index) =>
                    renderIndividualRow(
                        user,
                        index + 1
                    )
                )
                .join("");
        }
    };


    /* =========================================================
       TABS
       ========================================================= */

    const setupTabs = () => {

        const tabs =
            $$(".ranking-tab");

        tabs.forEach((tab) => {

            tab.addEventListener(
                "click",
                () => {

                    const type =
                        tab.dataset.rankingType;

                    if (
                        type !== "individual" &&
                        type !== "teams"
                    ) {
                        return;
                    }

                    currentType = type;

                    tabs.forEach((item) => {
                        item.classList.toggle(
                            "active",
                            item === tab
                        );
                    });

                    render();
                }
                );
        });
    };


    /* =========================================================
       LIVE REFRESH
       ========================================================= */

    window.addEventListener(
        "storage",
        (event) => {

            const watchedKeys = [
                "venusUsers",
                "users",
                "venusTeams",
                "teams",
                "venusCurrentUser",
                "currentUser",
                "venusUser"
            ];

            if (
                watchedKeys.includes(event.key)
            ) {
                render();
            }
        }
    );


    /*
     * Other Venus pages can refresh the ranking manually.
     */

    window.addEventListener(
        "venus:rankingsRefresh",
        () => {
            render();
        }
    );


    /* =========================================================
       PUBLIC API
       ========================================================= */

    window.VenusRankings = {

        getUsers,

        getTeams,

        buildIndividualRanking,

        buildTeamRanking,

        calculateTeamStars,

        getCurrentRanking,

        render,

        refresh: render,

        getCurrentType: () =>
            currentType,

        setType: (type) => {

            if (
                type !== "individual" &&
                type !== "teams"
            ) {
                return;
            }

            currentType = type;

            $$(".ranking-tab")
                .forEach((tab) => {

                    tab.classList.toggle(
                        "active",
                        tab.dataset.rankingType === type
                    );
                });

            render();
        }
    };


    /* =========================================================
       INITIALIZE
       ========================================================= */

    setupTabs();
    render();

});

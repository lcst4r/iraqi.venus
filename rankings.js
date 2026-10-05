/* =========================================================
   VENUS — RANKINGS
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
    /* =========================================================
       STORAGE
       ========================================================= */
    const STORAGE_KEYS = {
        currentUser: "venusCurrentUser",
        oldCurrentUser: "currentUser",
        profileUser: "venusUser",
        users: "venusUsers",
        teams: "venusTeams",
        posts: "venusPosts"
    };
    function readJSON(key, fallback = null) {
        try {
            const value = localStorage.getItem(key);
            if (!value) {
                return fallback;
            }
            return JSON.parse(value);
        } catch (error) {
            console.warn(
                `Venus rankings: failed to read ${key}`,
                error
            );
            return fallback;
        }
    }
    function getCurrentUser() {
        const keys = [
            STORAGE_KEYS.currentUser,
            STORAGE_KEYS.oldCurrentUser,
            STORAGE_KEYS.profileUser
        ];
        for (const key of keys) {
            const user = readJSON(key, null);
            if (user && typeof user === "object") {
                return user;
            }
        }
        return null;
    }
    function getUserId(user) {
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
    function getUserName(user) {
        if (!user) {
            return " متطوع Venus";
        }
        return (
            user.name ||
            user.fullName ||
            user.displayName ||
            user.username ||
            "متطوع Venus"
        );
    }
    function getUsername(user) {
        if (!user) {
            return "";
        }
        return (
            user.username ||
            user.handle ||
            user.nickname ||
            ""
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
    function getInitial(name) {
        if (!name) {
            return "V";
        }
        return String(name)
            .trim()
            .charAt(0)
            .toUpperCase();
    }
    /* =========================================================
       DATA
       ========================================================= */
    function getUsers() {
        const users = readJSON(
            STORAGE_KEYS.users,
            []
        );
        return Array.isArray(users)
            ? users
            : [];
    }
    function getPosts() {
        const posts = readJSON(
            STORAGE_KEYS.posts,
            []
        );
        return Array.isArray(posts)
            ? posts
            : [];
    }
    function getTeams() {
        /*
         * Prefer the team system already built.
         */
        if (
            window.VenusTeam &&
            typeof window.VenusTeam.getTeams === "function"
        ) {
            const teams =
                window.VenusTeam.getTeams();
            if (Array.isArray(teams)) {
                return teams;
            }
        }
        const teams = readJSON(
            STORAGE_KEYS.teams,
            []
        );
        return Array.isArray(teams)
            ? teams
            : [];
    }
    /* =========================================================
    NORMALIZE USERS
       ========================================================= */
    function normalizeUser(user) {
        if (!user || typeof user !== "object") {
            return null;
        }
        return {
            ...user,
            id: getUserId(user),
            name: getUserName(user),
            username: getUsername(user),
            stars: Number(
                user.stars ||
                user.totalStars ||
                0
            ),
            teamId:
                user.teamId ||
                null,
            teamName:
                user.teamName ||
                ""
        };
    }
    function normalizeUsers() {
        const users = getUsers()
            .map(normalizeUser)
            .filter(Boolean);
        const currentUser =
            normalizeUser(getCurrentUser());
        /*
         * If the current user is not in venusUsers,
         * include them in the local ranking.
         */
        if (currentUser) {
            const currentId =
                getUserId(currentUser);
            const exists =
                users.some(
                    user =>
                        String(
                            getUserId(user)
                        ) === String(currentId)
                );
            if (!exists) {
                users.push(currentUser);
            }
        }
        return users;
    }
    /* =========================================================
       STAR CALCULATION
       ========================================================= */
    const STAR_VALUES = {
        article: 1,
        volunteering: 3,
        project: 5,
        achievement: 5
    };
    function getPostStars(post) {
        if (!post) {
            return 0;
        }
        /*
         * If feed.js already stored the exact awarded value,
         * use it.
         */
        if (
            Number.isFinite(
                Number(post.starsAwarded)
            )
        ) {
            return Number(
                post.starsAwarded
            );
        }
        if (
            Number.isFinite(
                Number(post.stars)
            ) &&
            Number(post.stars) > 0
        ) {
            return Number(post.stars);
        }
        return (
            STAR_VALUES[post.type] ||
            0
        );
    }
    function calculateUserStars(user) {
        if (!user) {
            return 0;
        }
        const userId =
            getUserId(user);
        const posts =
            getPosts();
        let postStars = 0;
        posts.forEach(post => {
            const ownerId =
                post.userId ||
                post.authorId ||
                post.ownerId ||
                post.createdBy;
            if (
                String(ownerId) ===
                String(userId)
            ) {
                postStars += getPostStars(post);
            }
        });
        /*
         * User's stored stars may include stars from
         * competitions or other systems.
         */
        const storedStars = Number(
            user.stars ||
            user.totalStars ||
            0
        );
        /*
         * If posts exist, don't blindly add the stored
         * total again because feed.js may already have
         * added those stars to the user.
         *
         * We take the greater value as the safest local
         * MVP behavior.
         */
        return Math.max(
            storedStars,
            postStars
        );
    }
    function calculateTeamStars(team) {
        if (!team) {
            return 0;
        }
        /*
         * Prefer the existing Venus team system.
         */
        if (
            window.VenusTeam &&
            typeof window.VenusTeam.calculateTeamStars ===
                "function"
        ) {
            try {
                return Number(
                    window.VenusTeam.calculateTeamStars(
                        team.id
                    ) || 0
                );
            } catch (error) {
                console.warn(
                "Venus rankings: team calculation failed",
                    error
                );
            }
        }
        const members =
            Array.isArray(team.members)
                ? team.members
                : [];
        const users =
            normalizeUsers();
        let total = 0;
        members.forEach(member => {
            const memberId =
                typeof member === "object"
                    ? (
                        member.id ||
                        member.userId ||
                        member.uid
                    )
                    : member;
            const user =
                users.find(
                    candidate =>
                        String(
                            getUserId(candidate)
                        ) === String(memberId)
                );
            if (user) {
                total += calculateUserStars(
                    user
                );
            } else if (
                typeof member === "object"
            ) {
                total += Number(
                    member.stars ||
                    member.totalStars ||
                    0
                );
            }
        });
        /*
         * Some team objects already have a stars value.
         */
        if (
            total === 0 &&
            Number(team.stars) > 0
        ) {
            total = Number(team.stars);
        }
        return total;
    }
    /* =========================================================
       BUILD INDIVIDUAL RANKING
       ========================================================= */
    function buildIndividualRanking() {
        const users =
            normalizeUsers();
        const ranking =
            users.map(user => ({
                user,
                stars: calculateUserStars(user)
            }));
        ranking.sort((a, b) => {
            if (b.stars !== a.stars) {
                return b.stars - a.stars;
            }
            return getUserName(a.user)
                .localeCompare(
                    getUserName(b.user),
                    "ar"
                );
        });
        return ranking;
    }
    /* =========================================================
       BUILD TEAM RANKING
       ========================================================= */
    function buildTeamRanking() {
        const teams =
            getTeams();
        const ranking =
            teams.map(team => ({
                team,
                stars: calculateTeamStars(team)
            }));
        ranking.sort((a, b) => {
            if (b.stars !== a.stars) {
                return b.stars - a.stars;
            }
            return String(
                a.team.name || ""
            ).localeCompare(
                String(
                    b.team.name || ""
                ),
                "ar"
            );
        });
        return ranking;
    }
    /* =========================================================
       POSITION HELPERS
       ========================================================= */
    function getMedal(position) {
        if (position === 1) {
            return "🥇";
        }
        if (position === 2) {
            return "🥈";
        }
        if (position === 3) {
            return "🥉";
        }
        return String(position);
    }
    /* =========================================================
       RENDER USER AVATAR
       ========================================================= */
    function avatarHTML(user, className = "") {
        const name =
            getUserName(user);
        const avatar =
            user.avatar ||
            user.photoURL ||
            user.photo ||
            "";
        if (avatar) {
            return `
                <div class="ranking-avatar ${className}">
                    <img
                        src="${escapeHTML(avatar)}"
                        alt=""
                        onerror="
                            this.style.display='none';
                            this.nextElementSibling.style.display='flex';
                        "
                    >
                    <span
                        class="ranking-avatar-initial"
                        style="display:none"
                    >
                        ${escapeHTML(
                            getInitial(name)
                        )}
                    </span>
                </div>
            `;
        }
        return `
            <div class="ranking-avatar ${className}">
                <span class="ranking-avatar-initial">
                    ${escapeHTML(
                        getInitial(name)
                    )}
                </span>
            </div>
        `;
    }
    /* =========================================================
       RENDER INDIVIDUAL ITEM
       ========================================================= */
    function renderIndividualItem(
        entry,
        position,
        currentUserId
    ) {
        const user =
            entry.user;
        const userId =
            getUserId(user);
        const isCurrent =
            currentUserId &&
            String(userId) ===
            String(currentUserId);
        const username =
            getUsername(user);
        const teamName =
            user.teamName ||
            getTeamNameForUser(
                user
            );
        return `
            <article
                class="
                    ranking-item
                    ${isCurrent
                        ? "is-current-user"
                        : ""}
                "
                data-user-id="${escapeHTML(
                    userId || ""
                )}"
            >
                <div class="ranking-position">
                    <span
                        class="${
                            position <= 3
                                ? "ranking-position-medal"
                                : ""
                        }"
                    >
                        ${getMedal(position)}
                    </span>
                </div>
                ${avatarHTML(user)}
                <div class="ranking-content">
                    <span class="ranking-name">
                        ${escapeHTML(
                            getUserName(user)
                        )}
                    </span>
                    ${
                        username
                            ? `
                                <span class="ranking-username">
                                    @${escapeHTML(
                                        username.replace(
                                            /^@/,
                                            ""
                                        )
                                    )}
                                </span>
                            `
                            : ""
                    }
                    ${
                        teamName
                            ? `
                                <span class="ranking-team">
                                    ${escapeHTML(
                                        teamName
                                    )}
                                </span>
                            `
                            : ""
                    }
                    ${
                        isCurrent
                            ? `
                                <span class="ranking-current-badge">
                                    أنت
                                </span>
                            `
                            : ""
                    }
                </div>
                <div class="ranking-stars">
                    <strong>
                        ${entry.stars}
                    </strong>
                    <span>
                        ★
                    </span>
                </div>
            </article>
        `;
    }
    /* =========================================================
       TEAM HELPERS
       ========================================================= */
    function getTeamNameForUser(user) {
        if (!user) {
            return "";
        }
        if (user.teamName) {
            return user.teamName;
        }
        const teamId =
            user.teamId;
        if (!teamId) {
            return "";
        }
        const teams =
            getTeams();
        const team =
            teams.find(
                candidate =>
                    String(candidate.id) ===
                    String(teamId)
            );
        return team
            ? (
                team.name ||
                ""
            )
            : "";
    }
    function getTeamMemberCount(team) {
        if (!team) {
            return 0;
        }
        if (Array.isArray(team.members)) {
            return team.members.length;
        }
        if (Array.isArray(team.memberIds)) {
            return team.memberIds.length;
        }
        return Number(
            team.memberCount ||
            0
        );
    }
    function getTeamAvatarLetter(team) {
        if (!team) {
            return "♜";
        }
        const name =
            team.name ||
            "♜";
        return name
            .trim()
            .charAt(0)
            .toUpperCase() || "♜";
    }
    /* =========================================================
       RENDER TEAM ITEM
       ========================================================= */
    function renderTeamItem(
        entry,
        position
    ) {
        const team =
            entry.team;
        const teamId =
            team.id ||
            "";
        const teamName =
            team.name ||
            "فريق Venus";
        const description =
            team.description ||
            "";
        const memberCount =
            getTeamMemberCount(team);
        return `
            <article
                class="ranking-item"
                data-team-id="${escapeHTML(
                    teamId
                )}"
            >
                <div class="ranking-position">
                    <span
                        class="${
                            position <= 3
                                ? "ranking-position-medal"
                                : ""
                        }"
                    >
                        ${getMedal(position)}
                    </span>
                </div>
                <div class="ranking-team-avatar">
                    ${escapeHTML(
                        getTeamAvatarLetter(team)
                    )}
                </div>
                <div class="ranking-content">
                    <span class="ranking-name">
                        ${escapeHTML(
                            teamName
                        )}
                    </span>
                    ${
                        description
                            ? `
                                <span class="ranking-team">
                                    ${escapeHTML(
                                        description
                                    )}
                                </span>
                            `
                            : ""
                    }
                    <span class="ranking-team-members">
                        ${memberCount}
                        ${memberCount === 1
                            ? "عضو"
                            : "أعضاء"}
                    </span>
                </div>
                <div class="ranking-stars">
                    <strong>
                        ${entry.stars}
                    </strong>
                    <span>
                        ★
                    </span>
                </div>
            </article>
        `;
    }
    /* =========================================================
       RENDER INDIVIDUAL LIST
       ========================================================= */
    function renderIndividualRanking() {
        const list =
            $("#individualRankingsList");
        const empty =
        $("#individualRankingsEmpty");
        if (!list) {
            return;
        }
        const ranking =
            buildIndividualRanking();
        const currentUser =
            getCurrentUser();
        const currentUserId =
            getUserId(currentUser);
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
        list.innerHTML =
            ranking
                .map(
                    (entry, index) =>
                        renderIndividualItem(
                            entry,
                            index + 1,
                            currentUserId
                        )
                )
                .join("");
    }
    /* =========================================================
       RENDER TEAM LIST
       ========================================================= */
    function renderTeamRanking() {
        const list =
            $("#teamRankingsList");
        const empty =
            $("#teamRankingsEmpty");
        if (!list) {
            return;
        }
        const ranking =
            buildTeamRanking();
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
        list.innerHTML =
            ranking
                .map(
                    (entry, index) =>
                        renderTeamItem(
                            entry,
                            index + 1
                        )
                )
                .join("");
    }
    /* =========================================================
       CURRENT USER SUMMARY
       ========================================================= */
    function renderCurrentUserSummary() {
        const user =
            getCurrentUser();
        const avatar =
            $("#rankingsUserAvatar");
        const initial =
            $("#rankingsUserInitial");
        const name =
            $("#rankingsUserName");
        const team =
            $("#rankingsUserTeam");
        const stars =
            $("#rankingsUserStars");
        const position =
            $("#rankingsUserPosition");
        if (!user) {
            if (name) {
                name.textContent =
                    " متطوع Venus";
            }
            if (team) {
                team.textContent =
                    "بدون فريق";
            }
            if (stars) {
                stars.textContent =
                    "0";
            }
            if (position) {
                position.textContent =
                    "—";
            }
            return;
        }
        const normalized =
            normalizeUser(user);
        const userId =
            getUserId(normalized);
        const userName =
            getUserName(normalized);
        const userStars =
            calculateUserStars(
                normalized
            );
        const teamName =
            getTeamNameForUser(
                normalized
            );
        if (name) {
            name.textContent =
                userName;
        }
        if (team) {
            team.textContent =
                teamName ||
                "بدون فريق";
        }
        if (stars) {
            stars.textContent =
                String(userStars);
        }
        if (avatar && initial) {
            const avatarSource =
                normalized.avatar ||
                normalized.photoURL ||
                normalized.photo ||
                "";
            if (avatarSource) {
                avatar.src =
                    avatarSource;
                avatar.style.display =
                    "block";
                initial.style.display =
                    "none";
                avatar.onerror = () => {
                    avatar.style.display =
                    "none";
                    initial.style.display =
                        "flex";
                };
            } else {
                avatar.removeAttribute(
                    "src"
                );
                avatar.style.display =
                    "none";
                initial.style.display =
                    "flex";
                initial.textContent =
                    getInitial(userName);
            }
        }
        /*
         * Find current user's position.
         */
        const ranking =
            buildIndividualRanking();
        const userIndex =
            ranking.findIndex(
                entry =>
                    String(
                        getUserId(entry.user)
                    ) ===
                    String(userId)
            );
        if (position) {
            position.textContent =
                userIndex >= 0
                    ? String(userIndex + 1)
                    : "—";
        }
    }
    /* =========================================================
       TABS
       ========================================================= */
    let activeRanking =
        "individual";
    function switchRanking(type) {
        activeRanking =
            type === "teams"
                ? "teams"
                : "individual";
        const individualSection =
            $("#individualRankingsSection");
        const teamSection =
            $("#teamRankingsSection");
        const tabs =
            $$(".rankings-tab");
        tabs.forEach(tab => {
            const isActive =
                tab.dataset.ranking ===
                activeRanking;
            tab.classList.toggle(
                "is-active",
                isActive
            );
            tab.setAttribute(
                "aria-selected",
                isActive
                    ? "true"
                    : "false"
            );
        });
        if (individualSection) {
            individualSection.hidden =
                activeRanking !==
                "individual";
        }
        if (teamSection) {
            teamSection.hidden =
                activeRanking !==
                "teams";
        }
        if (activeRanking === "teams") {
            renderTeamRanking();
        } else {
            renderIndividualRanking();
        }
    }
    /* =========================================================
       REFRESH
       ========================================================= */
    function refresh() {
        renderCurrentUserSummary();
        renderIndividualRanking();
        if (
            activeRanking ===
            "teams"
        ) {
            renderTeamRanking();
        }
    }
    /* =========================================================
       EVENT LISTENERS
       ========================================================= */
    function bindEvents() {
        $$(".rankings-tab")
            .forEach(tab => {
                tab.addEventListener(
                    "click",
                    () => {
                        switchRanking(
                            tab.dataset.ranking
                        );
                    }
                );
            });
        const refreshButton =
            $("#refreshRankings");
        if (refreshButton) {
            refreshButton.addEventListener(
                "click",
                refresh
            );
        }
        /*
         * React to feed changes.
         */
        window.addEventListener(
            "venus:feedUpdated",
            refresh
        );
        /*
         * React to ranking changes.
         */
        window.addEventListener(
            "venus:rankingsRefresh",
            refresh
        );
        /*
         * React to profile/user changes.
         */
        window.addEventListener(
            "venus:userUpdated",
            refresh
        );
        /*
         * React to team changes.
         */
        window.addEventListener(
            "venus:teamUpdated",
            refresh
        );
        /*
         * Local-storage updates.
         */
        window.addEventListener(
            "storage",
            event => {
                if (
                    !event.key ||
                    [
                        STORAGE_KEYS.currentUser,
                        STORAGE_KEYS.oldCurrentUser,
                        STORAGE_KEYS.users,
                        STORAGE_KEYS.teams,
                        STORAGE_KEYS.posts
                    ].includes(event.key)
                ) {
                    refresh();
                }
            }
        );
    }
    /* =========================================================
       PUBLIC API
       ========================================================= */
    window.VenusRankings = {
        getUsers,
        getTeams,
        getPosts,
        calculateUserStars,
        calculateTeamStars,
        buildIndividualRanking,
        buildTeamRanking,
        renderIndividualRanking,
        renderTeamRanking,
        renderCurrentUserSummary,
        switchRanking,
        refresh,
        getActiveRanking: () =>
            activeRanking
    };
    /* =========================================================
       INIT
       ========================================================= */
    bindEvents();
    refresh();
});
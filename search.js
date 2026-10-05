document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* =========================================================
       VENUS — SEARCH SYSTEM
       Local MVP
       ========================================================= */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        Array.from(parent.querySelectorAll(selector));

    const SEARCH_STORAGE_KEY = "venusSearchHistory";

    /* =========================================================
       HELPERS
       ========================================================= */

    const escapeHTML = (value) => {
        const div = document.createElement("div");
        div.textContent = String(value ?? "");
        return div.innerHTML;
    };

    const normalizeText = (value) => {
        return String(value ?? "")
            .trim()
            .toLowerCase()
            .replace(/[ًٌٍَُِّْـ]/g, "")
            .replace(/[أإآ]/g, "ا")
            .replace(/ى/g, "ي")
            .replace(/ة/g, "ه");
    };

    const getCurrentUser = () => {
        const keys = [
            "venusCurrentUser",
            "currentUser",
            "venusUser"
        ];

        for (const key of keys) {
            try {
                const value =
                    localStorage.getItem(key);

                if (value) {
                    return JSON.parse(value);
                }
            } catch (error) {
                console.warn(
                    `Venus: could not read ${key}`,
                    error
                );
            }
        }

        return null;
    };

    const getCurrentUserId = () => {
        const user = getCurrentUser();

        return (
            user?.id ||
            user?.userId ||
            user?.username ||
            "demo_stdent"
        );
    };

    /* =========================================================
       GENERIC STORAGE READER
       ========================================================= */

    const readArray = (keys) => {

        for (const key of keys) {
            try {
                const value =
                    localStorage.getItem(key);

                if (!value) {
                    continue;
                }

                const parsed =
                    JSON.parse(value);

                if (Array.isArray(parsed)) {
                    return parsed;
                }
            } catch (error) {
                console.warn(
                    `Venus: could not read ${key}`,
                    error
                );
            }
        }

        return [];
    };

    /* =========================================================
       USERS
       ========================================================= */

    const getUsers = () => {

        const users = readArray([
            "venusUsers",
            "users"
        ]);

        const currentUser =
            getCurrentUser();

        /*
         * The current user may not exist inside
         * venusUsers yet, so add them locally
         * to make profile/search work together.
         */

        if (currentUser) {

            const exists =
                users.some(
                    user =>
                        String(user.id) ===
                        String(currentUser.id)
                );

            if (!exists) {
                users.push(currentUser);
            }
        }

        /*
         * Demo profile so the local MVP is
         * never completely empty.
         */

        if (!users.length) {

            users.push({
                id: "demo_volunteer",
                name: " متطوع VENUS",
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
            });
        }

        return users;
    };

    /* =========================================================
       TEAMS
       ========================================================= */

    const getTeams = () => {

        /*
         * Prefer the existing VenusTeam system
         * because team.js already owns the team data.
         */

        if (
            window.VenusTeam &&
            typeof window.VenusTeam.getTeams ===
                "function"
        ) {
            const teams =
                window.VenusTeam.getTeams();

            if (Array.isArray(teams)) {
                return teams;
            }
        }

        return readArray([
            "venusTeams",
            "teams"
        ]);
    };

    /* =========================================================
       POSTS
       ========================================================= */

    const getPosts = () => {

        return readArray([
            "venusPosts",
            "posts"
        ]);
    };

    /* =========================================================
       PROJECTS
       ========================================================= */

    const getProjects = () => {

        return readArray([
            "venusProjects",
            "projects"
        ]);
    };

    /* =========================================================
       SEARCH HISTORY
       ========================================================= */

    const getSearchHistory = () => {

        try {
            const value =
                localStorage.getItem(
                    SEARCH_STORAGE_KEY
                );

            if (!value) {
                return [];
            }

            const parsed =
                JSON.parse(value);

            return Array.isArray(parsed)
                ? parsed
                : [];

        } catch {
            return [];
        }
    };

    const saveSearchHistory = (
        query
    ) => {

        const clean =
            String(query ?? "").trim();

        if (!clean) {
            return;
        }

        let history =
            getSearchHistory();

        history =
            history.filter(
                item =>
                    normalizeText(item) !==
                    normalizeText(clean)
            );

        history.unshift(clean);

        history =
            history.slice(0, 10);

        try {
            localStorage.setItem(
                SEARCH_STORAGE_KEY,
                JSON.stringify(history)
            );
        } catch {
            /* ignore storage errors */
        }
    };

    /* =========================================================
       NORMALIZE USER RESULT
       ========================================================= */

    const normalizeUser = (
        user
    ) => {

        return {
            id:
                user.id ||
                user.userId ||
                user.username ||
                `user_${Date.now()}`,

            name:
                user.name ||
                user.fullName ||
                "مستخدم Venus",

            username:
                user.username ||
                user.userName ||
                "",

            avatar:
                user.avatar ||
                user.image ||
                "",

            bio:
                user.bio ||
                "",

            school:
                user.school ||
                "",

            governorate:
                user.governorate ||
                "",

            stars:
                Number(user.stars) || 0,

            privacy:
                user.privacy ||
                "public"
        };
    };

    /* =========================================================
       NORMALIZE TEAM RESULT
       ========================================================= */

    const normalizeTeam = (
        team
    ) => {

        const members =
            Array.isArray(team.members)
                ? team.members
                : [];

        return {
            id:
                team.id ||
                team.teamId ||
                `team_${Date.now()}`,

            name:
                team.name ||
                "فريق Venus",

            description:
                team.description ||
                "",

            avatar:
                team.avatar ||
                "",

            privacy:
                team.privacy ||
                "public",

            members,

            stars:
                Number(team.stars) || 0,

            ownerId:
                team.ownerId ||
                team.createdBy ||
                ""
        };
    };

    /* =========================================================
       NORMALIZE POST
       ========================================================= */

    const normalizePost = (
        post
    ) => {

        return {
            id:
                post.id ||
                post.postId ||
                `post_${Date.now()}`,

            title:
                post.title ||
                post.text ||
                post.content ||
                "منشور Venus",

            content:
                post.content ||
                post.text ||
                "",

            authorName:
                post.authorName ||
                post.name ||
                "مستخدم Venus",

            username:
                post.username ||
                "",

            type:
                post.type ||
                "post"
        };
    };

    /* =========================================================
       NORMALIZE PROJECT
       ========================================================= */

    const normalizeProject = (
        project
    ) => {

        return {
            id:
                project.id ||
                project.projectId ||
                `project_${Date.now()}`,

            title:
                project.title ||
                project.name ||
                "مشروع Venus",

            description:
                project.description ||
                "",

            authorName:
                project.authorName ||
                project.name ||
                "مستخدم Venus",

            username:
                project.username ||
                "",

            type:
                project.type ||
                "project"
        };
    };

    /* =========================================================
       MATCH
       ========================================================= */

    const containsQuery = (
        values,
        query
    ) => {

        const normalizedQuery =
            normalizeText(query);

        if (!normalizedQuery) {
            return true;
        }

        return values.some(
            value =>
                normalizeText(value)
                    .includes(normalizedQuery)
        );
    };

    /* =========================================================
       SEARCH USERS
       ========================================================= */

    const searchUsers = (
        query
    ) => {

        return getUsers()
            .map(normalizeUser)
            .filter(user => {

                /*
                 * Respect private profiles in the
                 * local MVP unless it is the current user.
                 */

                const isCurrentUser =
                    String(user.id) ===
                    String(getCurrentUserId());

                if (
                    user.privacy === "private" &&
                    !isCurrentUser
                ) {
                    return false;
                }

                return containsQuery(
                    [
                        user.name,
                        user.username,
                        user.school,
                        user.governorate,
                        user.bio
                    ],
                    query
                );
            });
    };

    /* =========================================================
       SEARCH TEAMS
       ========================================================= */

    const searchTeams = (
        query
    ) => {

        return getTeams()
            .map(normalizeTeam)
            .filter(team => {

                return containsQuery(
                    [
                        team.name,
                        team.description
                    ],
                    query
                );
            });
    };

    /* =========================================================
       SEARCH POSTS
       ========================================================= */

    const searchPosts = (
        query
    ) => {

        return getPosts()
            .map(normalizePost)
            .filter(post => {

                return containsQuery(
                    [
                        post.title,
                        post.content,
                        post.authorName,
                        post.username,
                        post.type
                    ],
                    query
                );
            });
    };

    /* =========================================================
       SEARCH PROJECTS
       ========================================================= */

    const searchProjects = (
        query
    ) => {

        return getProjects()
            .map(normalizeProject)
            .filter(project => {

                return containsQuery(
                    [
                        project.title,
                        project.description,
                        project.authorName,
                        project.username,
                        project.type
                    ],
                    query
                );
            });
    };

    /* =========================================================
       SEARCH ALL
       ========================================================= */

    const searchAll = (
        query
    ) => {

        return {
            users:
                searchUsers(query),

            teams:
                searchTeams(query),

            posts:
                searchPosts(query),

            projects:
                searchProjects(query)
        };
    };

    /* =========================================================
       CURRENT FILTER
       ========================================================= */

    let currentFilter = "all";
    let currentQuery = "";

    /* =========================================================
       RESULT COUNT
       ========================================================= */

    const getResultCount = (
        results
    ) => {

        return (
            results.users.length +
            results.teams.length +
            results.posts.length +
            results.projects.length
        );
    };

    /* =========================================================
       AVATAR
       ========================================================= */

    const createAvatar = (
        item
    ) => {

        if (item.avatar) {

            return `
                <img
                    src="${escapeHTML(item.avatar)}"
                    alt=""
                >
            `;
        }

        const name =
            item.name ||
            item.title ||
            item.authorName ||
            "V";

        const first =
            String(name)
                .trim()
                .charAt(0) ||
            "V";

        return escapeHTML(first);
    };

    /* =========================================================
       USER CARD
       ========================================================= */

    const createUserCard = (
        user
    ) => {

        return `
            <article
                class="search-result-card"
                data-result-type="users"
                data-result-id="${escapeHTML(user.id)}"
            >

                <div class="search-result-avatar">
                    ${createAvatar(user)}
                </div>

                <div class="search-result-info">
                <h3 class="search-result-title">
                        ${escapeHTML(user.name)}
                    </h3>

                    <p class="search-result-subtitle">
                        ${
                            user.username
                                ? "@" +
                                  escapeHTML(
                                      user.username
                                  )
                                : "مستخدم Venus"
                        }
                    </p>

                    ${
                        user.bio
                            ? `
                                <p class="search-result-description">
                                    ${escapeHTML(
                                        user.bio
                                    )}
                                </p>
                            `
                            : ""
                    }

                </div>

                <span class="search-result-type">
                    شخص
                </span>

                <button
                    type="button"
                    class="search-result-action"
                    data-open-user
                >
                    عرض
                </button>

            </article>
        `;
    };

    /* =========================================================
       TEAM CARD
       ========================================================= */

    const createTeamCard = (
        team
    ) => {

        const memberCount =
            team.members.length;

        return `
            <article
                class="search-result-card"
                data-result-type="teams"
                data-result-id="${escapeHTML(team.id)}"
            >

                <div class="search-result-avatar">
                    ${createAvatar(team)}
                </div>

                <div class="search-result-info">

                    <h3 class="search-result-title">
                        ${escapeHTML(team.name)}
                    </h3>

                    <p class="search-result-subtitle">
                        ${memberCount} أعضاء
                        ${
                            team.stars
                                ? ` · ${team.stars} نجمة`
                                : ""
                        }
                    </p>

                    ${
                        team.description
                            ? `
                                <p class="search-result-description">
                                    ${escapeHTML(
                                        team.description
                                    )}
                                </p>
                            `
                            : ""
                    }

                </div>

                <span class="search-result-type">
                    فريق
                </span>

                <button
                    type="button"
                    class="search-result-action"
                    data-open-team
                >
                    عرض
                </button>

            </article>
        `;
    };

    /* =========================================================
       POST CARD
       ========================================================= */

    const createPostCard = (
        post
    ) => {

        return `
            <article
                class="search-result-card"
                data-result-type="posts"
                data-result-id="${escapeHTML(post.id)}"
            >

                <div class="search-result-avatar">
                    ✦
                </div>

                <div class="search-result-info">

                    <h3 class="search-result-title">
                        ${escapeHTML(post.title)}
                    </h3>

                    <p class="search-result-subtitle">
                        ${escapeHTML(
                            post.authorName
                        )}
                        ${
                        post.username
                                ? " · @" +
                                  escapeHTML(
                                      post.username
                                  )
                                : ""
                        }
                    </p>

                    ${
                        post.content
                            ? `
                                <p class="search-result-description">
                                    ${escapeHTML(
                                        post.content
                                    ).slice(0, 180)}
                                    ${
                                        post.content.length > 180
                                            ? "..."
                                            : ""
                                    }
                                </p>
                            `
                            : ""
                    }

                </div>

                <span class="search-result-type">
                    منشور
                </span>

                <button
                    type="button"
                    class="search-result-action"
                    data-open-post
                >
                    عرض
                </button>

            </article>
        `;
    };

    /* =========================================================
       PROJECT CARD
       ========================================================= */

    const createProjectCard = (
        project
    ) => {

        return `
            <article
                class="search-result-card"
                data-result-type="projects"
                data-result-id="${escapeHTML(project.id)}"
            >

                <div class="search-result-avatar">
                    ✧
                </div>

                <div class="search-result-info">

                    <h3 class="search-result-title">
                        ${escapeHTML(project.title)}
                    </h3>

                    <p class="search-result-subtitle">
                        ${escapeHTML(
                            project.authorName
                        )}
                        ${
                            project.username
                                ? " · @" +
                                  escapeHTML(
                                      project.username
                                  )
                                : ""
                        }
                    </p>

                    ${
                        project.description
                            ? `
                                <p class="search-result-description">
                                    ${escapeHTML(
                                        project.description
                                    ).slice(0, 180)}
                                    ${
                                        project.description.length > 180
                                            ? "..."
                                            : ""
                                    }
                                </p>
                            `
                            : ""
                    }

                </div>

                <span class="search-result-type">
                    مشروع
                </span>

                <button
                    type="button"
                    class="search-result-action"
                    data-open-project
                >
                    عرض
                </button>

            </article>
        `;
    };

    /* =========================================================
       RENDER RESULT GROUP
       ========================================================= */

    const renderGroup = (
        container,
        items,
        type,
        renderer
    ) => {

        if (!items.length) {
            return;
        }

        items.forEach(item => {

            container.insertAdjacentHTML(
                "beforeend",
                renderer(item)
            );
        });
    };

    /* =========================================================
       RENDER RESULTS
       ========================================================= */

    const renderResults = () => {

        const resultsContainer =
            $("#searchResults");

        const empty =
            $("#searchEmpty");

        const initial =
            $("#searchInitial");

        const status =
            $("#searchStatus");

        if (
            !resultsContainer ||
            !empty ||
            !initial ||
            !status
        ) {
            return;
        }

        resultsContainer.innerHTML = "";

        /*
         * No query:
         * show initial state.
         */

        if (!currentQuery.trim()) {

            initial.hidden = false;
            empty.hidden = true;

            status.textContent =
                "ابدأ البحث للعثور على النتائج.";

            return;
        }

        initial.hidden = true;

        const results =
            searchAll(currentQuery);

        let visibleCount = 0;

        if (
            currentFilter === "all" ||
            currentFilter === "users"
        ) {

            renderGroup(
                resultsContainer,
                results.users,
                "users",
                createUserCard
            );

            if (
                currentFilter === "users"
            ) {
                visibleCount =
                    results.users.length;
            }
        }

        if (
            currentFilter === "all" ||
            currentFilter === "teams"
        ) {

            renderGroup(
                resultsContainer,
                results.teams,
                "teams",
                createTeamCard
            );

            if (
                currentFilter === "teams"
            ) {
                visibleCount =
                    results.teams.length;
            }
        }

        if (
            currentFilter === "all" ||
            currentFilter === "posts"
        ) {

            renderGroup(
                resultsContainer,
                results.posts,
                "posts",
                createPostCard
            );

            if (
                currentFilter === "posts"
            ) {
                visibleCount =
                    results.posts.length;
            }
        }

        if (
            currentFilter === "all" ||
            currentFilter === "projects"
        ) {

            renderGroup(
                resultsContainer,
                results.projects,
                "projects",
                createProjectCard
            );

            if (
                currentFilter === "projects"
            ) {
                visibleCount =
                    results.projects.length;
            }
        }

        if (
            currentFilter === "all"
        ) {
            visibleCount =
                getResultCount(results);
        }

        empty.hidden =
            visibleCount !== 0;

        if (visibleCount === 0) {

            status.textContent =
                `لم نجد نتائج لـ "${currentQuery}".`;

            return;
        }

        const label =
            visibleCount === 1
                ? "نتيجة واحدة"
                : "نتائج";

        status.textContent =
            `تم العثور على ${visibleCount} ${label}.`;
    };

    /* =========================================================
       FORM
       ========================================================= */

    const setupForm = () => {

        const form =
            $("#venusSearchForm");

        const input =
            $("#venusSearchInput");

        const clearButton =
            $("#clearSearchButton");

        if (!form || !input) {
            return;
        }

        const updateClearButton = () => {

            if (!clearButton) {
                return;
            }

            clearButton.hidden =
                !input.value.trim();
        };

        form.addEventListener(
        "submit",
            event => {

                event.preventDefault();

                currentQuery =
                    input.value.trim();

                if (currentQuery) {
                    saveSearchHistory(
                        currentQuery
                    );
                }

                updateClearButton();

                renderResults();
            }
        );

        input.addEventListener(
            "input",
            () => {

                updateClearButton();

                /*
                 * Search live while typing.
                 */

                currentQuery =
                    input.value.trim();

                renderResults();
            }
        );

        if (clearButton) {

            clearButton.addEventListener(
                "click",
                () => {

                    input.value = "";

                    currentQuery = "";

                    updateClearButton();

                    input.focus();

                    renderResults();
                }
            );
        }

        updateClearButton();
    };

    /* =========================================================
       FILTERS
       ========================================================= */

    const setupFilters = () => {

        const buttons =
            $$(".search-filter");

        buttons.forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    currentFilter =
                        button.dataset
                            .searchFilter ||
                        "all";

                    buttons.forEach(
                        item => {

                            item.classList.toggle(
                                "active",
                                item === button
                            );
                        }
                    );

                    renderResults();
                }
            );
        });
    };

    /* =========================================================
       RESULT ACTIONS
       ========================================================= */

    const setupResultActions = () => {

        const container =
            $("#searchResults");

        if (!container) {
            return;
        }

        container.addEventListener(
            "click",
            event => {

                const card =
                    event.target.closest(
                        ".search-result-card"
                    );

                if (!card) {
                    return;
                }

                const type =
                    card.dataset.resultType;

                const id =
                    card.dataset.resultId;

                /*
                 * User
                 */

                if (
                    event.target.closest(
                        "[data-open-user]"
                    )
                ) {

                    const user =
                        getUsers()
                            .map(normalizeUser)
                            .find(
                                item =>
                                    String(item.id) ===
                                    String(id)
                            );

                    if (!user) {
                        return;
                    }

                    /*
                     * If a future profile route exists,
                     * this can be replaced by that route.
                     */

                    if (
                        user.id ===
                        getCurrentUserId()
                    ) {
                        window.location.href =
                            "profile.html";
                    }

                    return;
                }

                /*
                 * Team
                 */

                if (
                    event.target.closest(
                        "[data-open-team]"
                    )
                ) {
                if (
                        window.VenusTeam &&
                        typeof window.VenusTeam
                            .getTeamById ===
                            "function"
                    ) {

                        const team =
                            window.VenusTeam
                                .getTeamById(id);

                        if (
                            team &&
                            window.location.href
                        ) {

                            /*
                             * Keep team page compatible
                             * with the existing team system.
                             */

                            window.location.href =
                                `team.html?team=${encodeURIComponent(
                                    id
                                )}`;
                        }
                    }

                    return;
                }

                /*
                 * Posts / projects
                 *
                 * These remain ready for the future
                 * feed/project pages.
                 */

                if (
                    event.target.closest(
                        "[data-open-post]"
                    )
                ) {

                    window.dispatchEvent(
                        new CustomEvent(
                            "venus:openPost",
                            {
                                detail: {
                                    id
                                }
                            }
                        )
                    );

                    return;
                }

                if (
                    event.target.closest(
                        "[data-open-project]"
                    )
                ) {

                    window.dispatchEvent(
                        new CustomEvent(
                            "venus:openProject",
                            {
                                detail: {
                                    id
                                }
                            }
                        )
                    );
                }
            }
        );
    };

    /* =========================================================
       PUBLIC API
       ========================================================= */

    window.VenusSearch = {

        searchAll,

        searchUsers,

        searchTeams,

        searchPosts,

        searchProjects,

        getSearchHistory,

        saveSearchHistory,

        render: renderResults,

        refresh: renderResults,

        getCurrentQuery: () =>
            currentQuery,

        getCurrentFilter: () =>
            currentFilter

    };

    /* =========================================================
       INITIALIZE
       ========================================================= */

    setupForm();

    setupFilters();

    setupResultActions();

    renderResults();

});
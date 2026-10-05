/* =========================================================
   VENUS — HOME SCRIPT
   Local MVP
   Connects:
   Profile + Team + Notifications + Feed
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
    "use strict";
    /* =====================================================
       HELPERS
       ===================================================== */
    const $ = (selector, parent = document) =>
        parent.querySelector(selector);
    const $$ = (selector, parent = document) =>
        Array.from(parent.querySelectorAll(selector));
    const escapeHTML = (value) => {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
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
    /* =====================================================
       CURRENT USER
       ===================================================== */
    const getCurrentUser = () => {
        let user = null;
        const storageKeys = [
            "venusCurrentUser",
            "currentUser",
            "venusUser"
        ];
        for (const key of storageKeys) {
            try {
                const raw = localStorage.getItem(key);
                if (!raw) {
                    continue;
                }
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === "object") {
                    user = parsed;
                    break;
                }
            } catch (error) {
                console.warn(
                    `Venus Home: could not read ${key}`,
                    error
                );
            }
        }
        if (!user) {
            user = {
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
        }
        return normalizeUser(user);
    };
    const normalizeUser = (user) => {
        return {
            id: user.id || user.uid || "demo_volunteer",
            name:
                user.name ||
                user.displayName ||
                "متطوع Venus",
            username:
                user.username ||
                user.userName ||
                "venus_volunteer",
            age:
                user.age !== undefined &&
                user.age !== null &&
                user.age !== ""
                    ? Number(user.age)
                    : "",
            school: user.school || "",
            grade: user.grade || "",
            governorate: user.governorate || "",
            teamId:
                user.teamId ||
                null,
            teamName:
                user.teamName ||
                "",
            stars:
                Number(user.stars) || 0,
            avatar:
                user.avatar ||
                user.photoURL ||
                "",
            bio: user.bio || "",
            future: user.future || "",
            privacy:
                user.privacy ||
                "public",
            posts:
                Array.isArray(user.posts)
                    ? user.posts
                    : [],
            projects:
                Array.isArray(user.projects)
                    ? user.projects
                    : [],
            highlights:
                Array.isArray(user.
                highlights)
                    ? user.highlights
                    : []
        };
    };
    /* =====================================================
       PROFILE DATA
       ===================================================== */
    const loadProfileData = () => {
        const user = getCurrentUser();
        const nameElement = $("#homeUserName");
        const avatarElement = $("#homeUserAvatar");
        const avatarLetter = $("#homeUserAvatarLetter");
        if (nameElement) {
            nameElement.textContent = user.name;
        }
        if (avatarElement) {
            if (user.avatar) {
                avatarElement.innerHTML = `
                    <img
                        src="${escapeHTML(user.avatar)}"
                        alt="${escapeHTML(user.name)}"
                    >
                `;
            } else {
                avatarElement.innerHTML = `
                    <span id="homeUserAvatarLetter">
                        ${escapeHTML(getInitial(user.name))}
                    </span>
                `;
            }
        }
        const starsElement = $("#homeStars");
        const postsElement = $("#homePosts");
        const projectsElement = $("#homeProjects");
        const teamElement = $("#homeTeam");
        if (starsElement) {
            starsElement.textContent =
                Number(user.stars) || 0;
        }
        if (postsElement) {
            postsElement.textContent =
                Array.isArray(user.posts)
                    ? user.posts.length
                    : 0;
        }
        if (projectsElement) {
            projectsElement.textContent =
                Array.isArray(user.projects)
                    ? user.projects.length
                    : 0;
        }
        if (teamElement) {
            teamElement.textContent =
                user.teamName || "—";
        }
        return user;
    };
    /* =====================================================
       TEAM
       ===================================================== */
    const loadTeamData = (user) => {
        const emptyState = $("#homeTeamEmpty");
        const teamContent = $("#homeTeamContent");
        const teamNameElement = $("#homeTeamName");
        const teamDescriptionElement =
            $("#homeTeamDescription");
        const teamStarsElement =
            $("#homeTeamStars");
        let team = null;
        /*
         * Prefer the Venus Team API because team.js
         * is already loaded before this file.
         */
        if (
            window.VenusTeam &&
            typeof window.VenusTeam.getUserTeam === "function"
        ) {
            try {
                team =
                    window.VenusTeam.getUserTeam(
                        user.id
                    );
            } catch (error) {
                console.warn(
                    "Venus Home: could not load team from VenusTeam.",
                    error
                );
            }
        }
        /*
         * Fallback to the teamId stored on the user.
         */
        if (
            !team &&
            user.teamId &&
            window.VenusTeam &&
            typeof window.VenusTeam.getTeamById === "function"
        ) {
            try {
                team =
                    window.VenusTeam.getTeamById(
                        user.teamId
                    );
            } catch (error) {
                console.warn(
                    "Venus Home: could not find team by ID.",
                    error
                );
            }
        }
        if (!team) {
            if (emptyState) {
                emptyState.hidden = false;
            }
            if (teamContent) {
                teamContent.hidden = true;
            }
            return null;
        }
        if (emptyState) {
            emptyState.hidden = true;
        }
        if (teamContent) {
            teamContent.hidden = false;
        }
        if (teamNameElement) {
            teamNameElement.textContent =
                team.name || "فريق Venus";
        }
        if (teamDescriptionElement) {
            teamDescriptionElement.textContent =
                team.description ||
                "لا يوجد وصف لهذا الفريق حاليًا.";
        }
        if (teamStarsElement) {
            let stars = 0;
            if (
                window.VenusTeam &&
                typeof window.VenusTeam.calculateTeamStars === "function"
            ) {
                try {
                    stars =
                        Number(
                            window.VenusTeam.calculateTeamStars(
                                team
                            )
                        ) || 0;
                } catch (error) {
                    stars = Number(team.stars) || 0;
                }
            } else {
                stars = Number(team.stars) || 0;
            }
            teamStarsElement.textContent = stars;
        }
        return team;
    };
    /* =====================================================
       NOTIFICATIONS
       ===================================================== */
    const loadNotifications = () => {
        const badge =
            $("#homeNotificationBadge");
        if (!badge) {
            return;
        }
        let unreadCount = 0;
        if (
            window.VenusNotifications &&
            typeof window.VenusNotifications.getUnreadCount ===
                "function"
        ) {
            try {
                unreadCount =
                    Number(
                        window.VenusNotifications
                            .getUnreadCount()
                    ) || 0;
            } catch (error) {
                console.warn(
                    "Venus Home: could not read notifications.",
                    error
                );
            }
        } else {
            /*
             * Fallback for localStorage.
             */
            try {
                const raw =
                    localStorage.getItem(
                        "venusNotifications"
                    );
                const notifications =
                    raw
                        ? JSON.parse(raw)
                        : [];
                const user = getCurrentUser();
                unreadCount =
                    Array.isArray(notifications)
                        ? notifications.filter(
                            (notification) =>
                                (
                                    !notification.userId ||
                                    notification.userId === user.id
                                ) &&
                                !notification.read
                        ).length
                        : 0;
            } catch (error) {
                unreadCount = 0;
            }
        }
        if (unreadCount > 0) {
            badge.hidden = false;
            badge.textContent =
                unreadCount > 99
                    ? "99+"
                    : String(unreadCount);
        } else {
            badge.hidden = true;
            badge.textContent = "0";
        }
    };
    /* =====================================================
       FEED
       ===================================================== */
    const getFeedPosts = () => {
        if (
            window.VenusFeed &&
            typeof window.VenusFeed.getPosts === "function"
        ) {
            try {
                const posts =
                    window.VenusFeed.getPosts();
                return Array.isArray(posts)
                    ? posts
                    : [];
            } catch (error) {
                console.warn(
                    "Venus Home: could not read feed.",
                    error
                );
            }
        }
        try {
            const raw =
                localStorage.getItem("venusPosts");
            const posts =
                raw
                    ? JSON.parse(raw)
                    : [];
            return Array.isArray(posts)
                ? posts
                : [];
        } catch (error) {
            return [];
        }
        };
    const formatPostTime = (timestamp) => {
        if (!timestamp) {
            return "";
        }
        const date =
            new Date(timestamp);
        if (Number.isNaN(date.getTime())) {
            return "";
        }
        const now = new Date();
        const difference =
            now.getTime() -
            date.getTime();
        const seconds =
            Math.floor(difference / 1000);
        if (seconds < 60) {
            return "الآن";
        }
        const minutes =
            Math.floor(seconds / 60);
        if (minutes < 60) {
            return `منذ ${minutes} د`;
        }
        const hours =
            Math.floor(minutes / 60);
        if (hours < 24) {
            return `منذ ${hours} س`;
        }
        const days =
            Math.floor(hours / 24);
        if (days < 7) {
            return `منذ ${days} يوم`;
        }
        return date.toLocaleDateString(
            "ar-IQ",
            {
                day: "numeric",
                month: "short"
            }
        );
    };
    const getPostTypeInfo = (type) => {
        const types = {
            article: {
                label: "مقال",
                icon: "✎",
                stars: 1
            },
            volunteering: {
                label: "تطوع",
                icon: "♧",
                stars: 3
            },
            project: {
                label: "مشروع",
                icon: "◆",
                stars: 5
            },
            achievement: {
                label: "إنجاز",
                icon: "★",
                stars: 5
            }
        };
        return (
            types[type] ||
            {
                label: "منشور",
                icon: "◈",
                stars: 0
            }
        );
    };
    const normalizePost = (post) => {
        const typeInfo =
            getPostTypeInfo(
                post.type
            );
        return {
            id:
                post.id ||
                `post_${Date.now()}`,
            userId:
                post.userId ||
                post.authorId ||
                "",
            userName:
                post.userName ||
                post.authorName ||
                post.name ||
                "متطوع Venus",
            username:
                post.username ||
                post.authorUsername ||
                "venus_volunteer",
            avatar:
                post.avatar ||
                post.userAvatar ||
                post.authorAvatar ||
                "",
            type:
                post.type ||
                "article",
            typeInfo,
            title:
                post.title ||
                "منشور بدون عنوان",
            content:
                post.content ||
                post.text ||
                "",
            image:
                post.image ||
                "",
            createdAt:
                post.createdAt ||
                post.date ||
                post.timestamp ||
                Date.now(),
            stars:
                Number(post.starsEarned) ||
                Number(post.stars) ||
                typeInfo.stars ||
                0,
            likes:
                Array.isArray(post.likes)
                    ? post.likes
                    : []
        };
    };
    /* =====================================================
       RENDER RECENT POSTS
       ===================================================== */
    const renderRecentPosts = () => {
        const container =
            $("#homeRecentPosts");
        if (!container) {
            return;
        }
        const posts =
            getFeedPosts()
                .map(normalizePost)
                .sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                )
                .slice(0, 3);
        if (!posts.length) {
            container.innerHTML = `
                <div class="home-recent-empty" id="homeRecentEmpty">
                <span>◈</span>
                    <p>
                        لا توجد منشورات لعرضها حاليًا.
                    </p>
                    <a href="feed.html">
                        استكشاف المنشورات
                    </a>
                </div>
            `;
            return;
        }
        container.innerHTML =
            posts.map((post) => {
                const initial =
                    getInitial(
                        post.userName
                    );
                const avatarHTML =
                    post.avatar
                        ? `
                            <img
                                src="${escapeHTML(post.avatar)}"
                                alt="${escapeHTML(post.userName)}"
                            >
                        `
                        : `
                            <span>
                                ${escapeHTML(initial)}
                            </span>
                        `;
                const safeTitle =
                    escapeHTML(
                        post.title
                    );
                const safeContent =
                    escapeHTML(
                        post.content
                    );
                const preview =
                    safeContent.length > 150
                        ? `${safeContent.slice(0, 150)}…`
                        : safeContent;
                return `
                    <article
                        class="home-recent-card"
                        data-post-id="${escapeHTML(post.id)}"
                    >
                        <div class="home-recent-card-header">
                            <div class="home-recent-avatar">
                                ${avatarHTML}
                            </div>
                            <div class="home-recent-author">
                                <strong>
                                    ${escapeHTML(post.userName)}
                                </strong>
                                <span>
                                    @${escapeHTML(post.username)}
                                </span>
                            </div>
                            <span class="home-recent-type">
                                ${escapeHTML(post.typeInfo.icon)}
                                ${escapeHTML(post.typeInfo.label)}
                            </span>
                        </div>
                        <h3>
                            ${safeTitle}
                        </h3>
                        <p>
                            ${preview || "لا يوجد محتوى نصي لهذا المنشور."}
                        </p>
                        <div class="home-recent-footer">
                            <span>
                                ${escapeHTML(
                                    formatPostTime(
                                        post.createdAt
                                    )
                                )}
                            </span>
                            <span class="home-recent-stars">
                                ★ ${post.stars}
                            </span>
                        </div>
                    </article>
                `;
            }).join("");
        /*
         * Clicking a preview tries to open the same
         * post through VenusFeed.
         */
        $$(".home-recent-card", container)
            .forEach((card) => {
                card.addEventListener(
                    "click",
                    () => {
                        const postId =
                            card.dataset.postId;
                        const post =
                            posts.find(
                                (item) =>
                                    String(item.id) ===
                                    String(postId)
                            );
                        if (
                            post &&
                            window.VenusFeed &&
                            typeof window.VenusFeed.
                            openPostDetails ===
                                "function"
                        ) {
                            window.VenusFeed
                                .openPostDetails(
                                    post
                                );
                            return;
                        }
                        window.location.href =
                            "feed.html";
                    }
                );
            });
    };
    /* =====================================================
       QUICK CREATE PROJECT LINK
       ===================================================== */
    const handleCreateProjectLink = () => {
        const projectLink =
            document.querySelector(
                'a[href="feed.html?create=project"]'
            );
        if (!projectLink) {
            return;
        }
        projectLink.addEventListener(
            "click",
            (event) => {
                /*
                 * If feed.js is available on the current page,
                 * use its modal directly.
                 */
                if (
                    window.VenusFeed &&
                    typeof window.VenusFeed.openCreateModal ===
                        "function"
                ) {
                    event.preventDefault();
                    window.location.href =
                        "feed.html?create=project";
                }
            }
        );
    };
    /* =====================================================
       VENUS EVENTS
       ===================================================== */
    const connectVenusEvents = () => {
        window.addEventListener(
            "venus:feedUpdated",
            () => {
                renderRecentPosts();
                loadProfileData();
            }
        );
        window.addEventListener(
            "venus:rankingsRefresh",
            () => {
                loadProfileData();
                loadTeamData(
                    getCurrentUser()
                );
            }
        );
        window.addEventListener(
            "venus:notificationsUpdated",
            () => {
                loadNotifications();
            }
        );
        window.addEventListener(
            "storage",
            (event) => {
                if (
                    [
                        "venusCurrentUser",
                        "currentUser",
                        "venusUser"
                    ].includes(event.key)
                ) {
                    const user =
                        loadProfileData();
                    loadTeamData(user);
                }
                if (
                    event.key ===
                    "venusPosts"
                ) {
                    renderRecentPosts();
                }
                if (
                    event.key ===
                    "venusNotifications"
                ) {
                    loadNotifications();
                }
                if (
                    event.key ===
                    "venusTeams"
                ) {
                    loadTeamData(
                        getCurrentUser()
                    );
                }
            }
        );
    };
    /* =====================================================
       INITIALIZE
       ===================================================== */
    const initHome = () => {
        const homePage =
            $("[data-home-page]");
        if (!homePage) {
            return;
        }
        const user =
            loadProfileData();
        loadTeamData(user);
        loadNotifications();
        renderRecentPosts();
        handleCreateProjectLink();
        connectVenusEvents();
        /*
         * Small delayed refresh.
         * Useful when another script needs a moment to
         * finish its own local initialization.
         */
        setTimeout(() => {
            const refreshedUser =
                loadProfileData();
            loadTeamData(
                refreshedUser
            );
            loadNotifications();
            renderRecentPosts();
        }, 120);
    };
    /* =====================================================
       PUBLIC HOME API
       ===================================================== */
    window.VenusHome = {
        refresh: () => {
            const user =
                loadProfileData();
            loadTeamData(user);
            loadNotifications();
            renderRecentPosts();
        },
        getCurrentUser,
        loadProfileData,
        loadTeamData,
        loadNotifications,
        renderRecentPosts
    };
    initHome();
});
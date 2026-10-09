/* ==========================================
   VENUS — HOME FEED BRIDGE
   Working likes and comments
========================================== */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const POSTS_KEY = "venusPosts";
    const container = document.getElementById("feedContainer");

    if (!container) return;

    let activeFilter = "for-you";

    function readPosts() {
        try {
            const data = JSON.parse(localStorage.getItem(POSTS_KEY) || "[]");
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    }

    function savePosts(posts) {
        localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function getUser() {
        for (const key of ["venusProfile", "venusCurrentUser", "currentUser", "venusUser"]) {
            try {
                const user = JSON.parse(localStorage.getItem(key) || "null");
                if (user && typeof user === "object") return user;
            } catch {}
        }

        return { id: "local_user", username: "venus_user" };
    }

    function getUserId() {
        const user = getUser();
        return String(user.id || user.userId || user.username || "local_user");
    }

    function normalizeType(type) {
        const value = String(type || "post").toLowerCase();

        if (["volunteer", "volunteering"].includes(value)) return "volunteering";
        if (value === "article") return "article";
        if (value === "project") return "project";
        if (["achievement", "competition", "other"].includes(value)) return "achievement";

        return "post";
    }

    function typeLabel(type) {
        return ({
            post: "منشور",
            article: "مقال",
            volunteering: "عمل تطوعي",
            project: "مشروع",
            achievement: "إنجاز"
        })[normalizeType(type)];
    }

    function formatDate(value) {
        if (!value) return "منشور حديثًا";

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "منشور حديثًا";

        return date.toLocaleDateString("ar-IQ", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    function getVisiblePosts() {
        let posts = readPosts().filter(post =>
            String(post.privacy || "public").toLowerCase() !== "private"
        );

        if (activeFilter === "articles") {
            posts = posts.filter(post => normalizeType(post.type) === "article");
        } else if (activeFilter === "volunteers") {
            posts = posts.filter(post => normalizeType(post.type) === "volunteering");
        } else if (activeFilter === "teams") {
            posts = posts.filter(post => Boolean(post.teamId || post.teamName));
        }

        return posts.sort((a, b) =>
            (new Date(b.createdAt || b.date || 0).getTime() || 0) -
            (new Date(a.createdAt || a.date || 0).getTime() || 0)
        );
    }

    function renderPost(post) {
        const author = post.authorName || post.fullName || post.username || "VENUS User";
        const username = post.authorUsername || post.username || "";
        const avatar = post.authorAvatar || post.avatar || "";
        const content = post.content || post.description || "";
        const title = post.title || "";

        const likes = Array.isArray(post.likes) ? post.likes : [];
        const comments = Array.isArray(post.comments) ? post.comments : [];
        const liked = likes.some(item =>
            String(typeof item === "object" ? item.userId || item.id : item) === getUserId()
        );

        const imageHTML = post.image
            ? `<img class="venus-home-post-image"
                    src="${escapeHTML(post.image)}"
                    alt="صورة المنشور"
                    loading="lazy">`
            : "";
            const avatarHTML = avatar
            ? `<img src="${escapeHTML(avatar)}" alt=""
                    class="venus-home-avatar">`
            : <span class="venus-home-avatar venus-home-avatar-placeholder">✦</span>;

        const commentsHTML = comments.map(comment => {
            const commentText = typeof comment === "string"
                ? comment
                : comment.text || comment.content || "";

            const commentAuthor = typeof comment === "object"
                ? comment.authorName || comment.username || "VENUS User"
                : "VENUS User";

            return `
                <div class="venus-home-comment">
                    <strong>${escapeHTML(commentAuthor)}</strong>
                    <p>${escapeHTML(commentText)}</p>
                </div>
            `;
        }).join("");

        return `
            <article class="venus-home-post" data-home-post="${escapeHTML(post.id)}">
                <header class="venus-home-post-header">
                    ${avatarHTML}
                    <div class="venus-home-author">
                        <strong>${escapeHTML(author)}</strong>
                        <small>
                            ${username ? "@" + escapeHTML(username) + " · " : ""}
                            ${escapeHTML(formatDate(post.createdAt || post.date))}
                        </small>
                    </div>
                    <span class="venus-home-post-type">
                        ${escapeHTML(typeLabel(post.type))}
                    </span>
                </header>

                ${title ? <h3 class="venus-home-post-title">${escapeHTML(title)}</h3> : ""}
                ${content ? <p class="venus-home-post-content">${escapeHTML(content).replace(/\n/g, "<br>")}</p> : ""}
                ${imageHTML}

                <footer class="venus-home-post-footer">
                    <button type="button"
                        class="venus-home-action ${liked ? "is-liked" : ""}"
                        data-home-action="like"
                        data-post-id="${escapeHTML(post.id)}"
                        aria-pressed="${liked}">
                        ${liked ? "♥ أعجبني" : "♡ إعجاب"}
                        (${likes.length})
                    </button>

                    <button type="button"
                        class="venus-home-action"
                        data-home-action="comment"
                        data-post-id="${escapeHTML(post.id)}">
                        💬 التعليقات (${comments.length})
                    </button>

                    <span>✦ ${Number(post.stars || 0)} نجوم</span>
                </footer>

                <div class="venus-home-comments">
                    ${commentsHTML}
                </div>
            </article>
        `;
    }

    function renderFeed() {
        const posts = getVisiblePosts();

        if (!posts.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">✦</div>
                    <h3>مساحتك تبدأ هنا</h3>
                    <p>لا توجد منشورات ضمن هذا التصنيف حاليًا.</p>
                    <button class="primary-button" id="emptyCreateButton">
                        أنشئ أول منشور
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = posts.map(renderPost).join("");
    }

    // LIKE AND COMMENT BUTTONS
    container.addEventListener("click", event => {
        const button = event.target.closest("[data-home-action]");
        if (!button) return;

        const action = button.dataset.homeAction;
        const postId = button.dataset.postId;
        const posts = readPosts();

        const post = posts.find(item => String(item.id) === String(postId));
        if (!post) {
            alert("لم أتمكن من العثور على المنشور. حدّث الصفحة وحاول مجددًا.");
            return;
        }

        if (action === "like") {
            if (!Array.isArray(post.likes)) post.likes = [];
            const userId = getUserId();

            const index = post.likes.findIndex(item =>
                String(typeof item === "object" ? item.userId || item.id : item) === userId
            );

            if (index >= 0) {
                post.likes.splice(index, 1);
            } else {
                post.likes.push(userId);
            }

            post.likesCount = post.likes.length;
            savePosts(posts);
            renderFeed();
            return;
        }

        if (action === "comment") {
            const text = prompt("اكتب تعليقك على المنشور:");

            if (text === null || !text.trim()) return;

            if (!Array.isArray(post.comments)) post.comments = [];

            const user = getUser();

            post.comments.push({
                id: "comment_" + Date.now(),
                userId: getUserId(),
                authorName: user.name || user.fullName || user.username || "VENUS User",
                text: text.trim(),
                createdAt: new Date().toISOString()
            });

            post.commentsCount = post.comments.length;
            savePosts(posts);
            renderFeed();
        }
    });

    // FEED FILTERS
    document.querySelectorAll(".feed-filter[data-filter]").forEach(button => {
        button.addEventListener("click", () => {
            activeFilter = button.dataset.filter || "for-you";

            document.querySelectorAll(".feed-filter[data-filter]").forEach(item => {
                item.classList.toggle("active", item === button);
            });

            renderFeed();
        });
    });

    // OPEN CREATE POST PAGE
    document.addEventListener("click", event => {
        const button = event.target.closest(
            "#addPostButton, #emptyCreateButton, #emptyCreatePost, #feedEmptyCreateButton, #openCreatePost"
        );

        if (!button) return;

        event.preventDefault();
        window.location.href = "post.html";
    });

    window.addEventListener("pageshow", renderFeed);

    window.addEventListener("storage", event => {
        if (event.key === POSTS_KEY) renderFeed();
    });

    window.VenusHomeFeed = { refresh: renderFeed };

    renderFeed();

    console.log("VENUS Home Feed: likes and comments enabled ✦");
});
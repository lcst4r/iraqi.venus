/* ==========================================
   VENUS — HOME FEED BRIDGE
   Reads posts saved by post.js and displays
   them inside the main Home feed.
========================================== */
document.addEventListener("DOMContentLoaded", () => {
    "use strict";
    const POSTS_KEY = "venusPosts";
    const container = document.getElementById("feedContainer");
    if (!container) {
        console.warn("VENUS: feedContainer was not found.");
        return;
    }
    let activeFilter = "for-you";
    function readPosts() {
        try {
            const saved = JSON.parse(localStorage.getItem(POSTS_KEY) || "[]");
            return Array.isArray(saved) ? saved : [];
        } catch (error) {
            console.error("VENUS: Could not read posts.", error);
            return [];
        }
    }
    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }
    function normalizeType(type) {
        const value = String(type || "post").toLowerCase();
        if (["volunteer", "volunteering"].includes(value)) {
            return "volunteering";
        }
        if (["article"].includes(value)) {
            return "article";
        }
        if (["project"].includes(value)) {
            return "project";
        }
        if (["achievement", "competition", "other"].includes(value)) {
            return "achievement";
        }
        return "post";
    }
    function typeLabel(type) {
        const labels = {
            post: "منشور",
            article: "مقال",
            volunteering: "عمل تطوعي",
            project: "مشروع",
            achievement: "إنجاز"
        };
        return labels[normalizeType(type)] || "منشور";
    }
    function formatDate(value) {
        if (!value) return "منشور حديثًا";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "منشور حديثًا";
        }
        return date.toLocaleDateString("ar-IQ", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }
    function getVisiblePosts() {
        let posts = readPosts();
        // Newest posts first.
        posts.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.date || 0).getTime() || 0;
            const dateB = new Date(b.createdAt || b.date || 0).getTime() || 0;
            return dateB - dateA;
        });
        // Respect public/private settings.
        posts = posts.filter(post => {
            const privacy = String(post.privacy || "public").toLowerCase();
            return privacy !== "private";
        });
        if (activeFilter === "articles") {
            posts = posts.filter(post => normalizeType(post.type) === "article");
        } else if (activeFilter === "volunteers") {
            posts = posts.filter(post => normalizeType(post.type) === "volunteering");
        } else if (activeFilter === "teams") {
            posts = posts.filter(post => Boolean(post.teamId || post.teamName));
        }
        return posts;
    }
    function renderPost(post) {
        const title = post.title || "";
        const content = post.content || post.description || "";
        const author = post.authorName || post.fullName || post.username || "VENUS User";
        const postUsername = post.authorUsername || post.username || "";
        const avatar = post.authorAvatar || post.avatar || "";
        const type = normalizeType(post.type);
        const likes = Array.isArray(post.likes)
            ? post.likes.length
            : Number(post.likesCount || 0);
        const comments = Array.isArray(post.comments)
            ? post.comments.length
            : Number(post.commentsCount || 0);
        const imageHTML = post.image
            ? `<img class="venus-home-post-image"
                src="${escapeHTML(post.image)}"
                    alt="صورة المنشور"
                    loading="lazy">`
            : "";
        const avatarHTML = avatar
            ? `<img src="${escapeHTML(avatar)}" alt="" class="venus-home-avatar">`
            : `<span class="venus-home-avatar venus-home-avatar-placeholder">✦</span>`;
        return `
            <article class="venus-home-post">
                <header class="venus-home-post-header">
                    ${avatarHTML}
                    <div class="venus-home-author">
                        <strong>${escapeHTML(author)}</strong>
                        <small>
                            ${postUsername ? "@" + escapeHTML(postUsername) + " · " : ""}
                            ${escapeHTML(formatDate(post.createdAt || post.date))}
                        </small>
                    </div>
                    <span class="venus-home-post-type">
                        ${escapeHTML(typeLabel(type))}
                    </span>
                </header>
                ${title ? `<h3 class="venus-home-post-title">${escapeHTML(title)}</h3>` : ""}
                ${content ? `<p class="venus-home-post-content">${escapeHTML(content).replace(/\n/g, "<br>")}</p>` : ""}
                ${imageHTML}
                <footer class="venus-home-post-footer">
                    <span>♡ ${likes}</span>
                    <span>☏ ${comments}</span>
                    <span>✦ ${Number(post.stars || 0)} نجوم</span>
                </footer>
            </article>
        `;
    }
    function renderFeed() {
        const posts = getVisiblePosts();
        if (posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">✦</div>
                    <h3>مساحتك تبدأ هنا</h3>
                    <p>
                        ${activeFilter === "for-you"
                            ? "لا توجد منشورات حتى الآن. أنشئ أول منشور وابدأ مشاركة أفكارك!"
                            : "لا توجد منشورات ضمن هذا التصنيف حاليًا."}
                    </p>
                    <button class="primary-button" id="emptyCreateButton">
                        أنشئ أول منشور
                    </button>
                </div>
            `;
            return;
        }
        container.innerHTML = posts.map(renderPost).join("");
    }
    // Update the feed when a filter is selected.
    document.querySelectorAll(".feed-filter[data-filter]").forEach(button => {
        button.addEventListener("click", () => {
            activeFilter = button.dataset.filter || "for-you";
            document.querySelectorAll(".feed-filter[data-filter]").forEach(item => {
                item.classList.toggle("active", item === button);
            });
            renderFeed();
        });
    });
    // Re-render when the page becomes visible again.
    window.addEventListener("pageshow", renderFeed);
    // Another page or tab may have saved new posts.
    window.addEventListener("storage", event => {
        if (event.key === POSTS_KEY) {
            renderFeed();
        }
    });
    // Refresh the feed after a post is published.
    window.VenusHomeFeed = {
        refresh: renderFeed
    };
    renderFeed();
    console.log("VENUS Home Feed Bridge loaded ✦");
});
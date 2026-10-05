document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* =========================================================
       VENUS — FEED.JS
       Local MVP
       Matches the current feed.html exactly
       ========================================================= */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];

    const POSTS_KEY = "venusPosts";

    /* =========================================================
       POST TYPES
       ========================================================= */

    const POST_TYPES = {
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

    let currentFilter = "all";
    let selectedPostType = "article";
    let selectedImage = "";

    /* =========================================================
       STORAGE
       ========================================================= */

    function getPosts() {
        try {
            const saved = localStorage.getItem(POSTS_KEY);

            if (!saved) return [];

            const posts = JSON.parse(saved);

            return Array.isArray(posts) ? posts : [];
        } catch (error) {
            console.error("VENUS: Error loading posts:", error);
            return [];
        }
    }

    function savePosts(posts) {
        localStorage.setItem(
            POSTS_KEY,
            JSON.stringify(posts)
        );
    }

    /* =========================================================
       USER
       ========================================================= */

    function getCurrentUser() {
        const keys = [
            "venusCurrentUser",
            "currentUser",
            "venusUser"
        ];

        for (const key of keys) {
            try {
                const saved = localStorage.getItem(key);

                if (!saved) continue;

                const user = JSON.parse(saved);

                if (user && typeof user === "object") {
                    return user;
                }
            } catch (error) {
                console.warn(
                    `VENUS: Could not read ${key}`
                );
            }
        }

        return {
            id: "demo_student",
            name: "طالب Venus",
            username: "venus_student",
            avatar: "",
            stars: 0,
            teamId: null,
            teamName: ""
        };
    }

    function saveCurrentUser(user) {
        if (!user) return;

        const keys = [
            "venusCurrentUser",
            "currentUser",
            "venusUser"
        ];

        keys.forEach((key) => {
            try {
                localStorage.setItem(
                    key,
                    JSON.stringify(user)
                );
            } catch (error) {
                console.warn(
                    `VENUS: Could not save ${key}`
                );
            }
        });
    }

    /* =========================================================
       HELPERS
       ========================================================= */

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function generateId() {
        return (
            Date.now().toString(36) +
            Math.random()
                .toString(36)
                .substring(2, 9)
        );
    }

    function getType(type) {
        return (
            POST_TYPES[type] ||
            POST_TYPES.article
        );
    }
    function formatDate(date) {
        try {
            return new Intl.DateTimeFormat(
                "ar-IQ",
                {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit"
                }
            ).format(new Date(date));
        } catch {
            return "";
        }
    }

    /* =========================================================
       STARS
       ========================================================= */

    function addStarsToUser(amount) {
        const user = getCurrentUser();

        user.stars =
            Number(user.stars || 0) +
            Number(amount || 0);

        saveCurrentUser(user);

        window.dispatchEvent(
            new CustomEvent(
                "venus:starsUpdated",
                {
                    detail: {
                        amount,
                        total: user.stars
                    }
                }
            )
        );
    }

    function addStarsToTeam(amount) {
        const user = getCurrentUser();

        if (!user.teamId) return;

        if (
            window.VenusTeam &&
            typeof window.VenusTeam.addTeamStars ===
                "function"
        ) {
            try {
                window.VenusTeam.addTeamStars(
                    user.teamId,
                    Number(amount || 0)
                );
            } catch (error) {
                console.warn(
                    "VENUS: Could not update team stars."
                );
            }
        }
    }

    /* =========================================================
       CREATE POST
       ========================================================= */

    function createPost(data) {
        const user = getCurrentUser();

        const type =
            POST_TYPES[data.type]
                ? data.type
                : "article";

        const typeInfo = getType(type);

        const post = {
            id: generateId(),

            authorId:
                user.id ||
                "demo_student",

            authorName:
                user.name ||
                "طالب Venus",

            authorUsername:
                user.username ||
                "venus_student",

            authorAvatar:
                user.avatar ||
                "",

            type,

            title:
                String(data.title || "")
                    .trim(),

            content:
                String(data.content || "")
                    .trim(),

            image:
                data.image || "",

            privacy:
                data.privacy ||
                "public",

            stars:
                Number(typeInfo.stars || 0),

            likes: [],

            comments: [],

            createdAt:
                new Date().toISOString()
        };

        const posts = getPosts();

        posts.unshift(post);

        savePosts(posts);

        addStarsToUser(post.stars);
        addStarsToTeam(post.stars);

        window.dispatchEvent(
            new CustomEvent(
                "venus:postCreated",
                {
                    detail: post
                }
            )
        );

        return post;
    }

    /* =========================================================
       DELETE POST
       ========================================================= */

    function deletePost(postId) {
        const user = getCurrentUser();

        const posts = getPosts();

        const post = posts.find(
            (item) => item.id === postId
        );

        if (!post) return false;

        if (post.authorId !== user.id) {
            return false;
        }

        const updatedPosts =
            posts.filter(
                (item) => item.id !== postId
            );

        savePosts(updatedPosts);

        renderFeed();

        window.dispatchEvent(
            new CustomEvent(
                "venus:postDeleted",
                {
                detail: {
                        postId
                    }
                }
            )
        );

        return true;
    }

    /* =========================================================
       LIKE
       ========================================================= */

    function toggleLike(postId) {
        const posts = getPosts();

        const user = getCurrentUser();

        const post = posts.find(
            (item) => item.id === postId
        );

        if (!post) return;

        if (!Array.isArray(post.likes)) {
            post.likes = [];
        }

        const index =
            post.likes.indexOf(user.id);

        if (index === -1) {
            post.likes.push(user.id);
        } else {
            post.likes.splice(index, 1);
        }

        savePosts(posts);

        renderFeed();
    }

    /* =========================================================
       FILTERS
       ========================================================= */

    function getFilteredPosts() {
        const posts = getPosts();

        if (currentFilter === "all") {
            return posts;
        }

        return posts.filter(
            (post) =>
                post.type === currentFilter
        );
    }

    function setFilter(filter) {
        currentFilter =
            filter || "all";

        $$(".feed-filter").forEach(
            (button) => {
                button.classList.toggle(
                    "active",
                    (
                        button.dataset.feedFilter ||
                        "all"
                    ) === currentFilter
                );
            }
        );

        renderFeed();
    }

    /* =========================================================
       RENDER ONE POST
       ========================================================= */

    function renderPost(post) {
        const user = getCurrentUser();

        const type =
            getType(post.type);

        const likes =
            Array.isArray(post.likes)
                ? post.likes
                : [];

        const liked =
            likes.includes(user.id);

        const comments =
            Array.isArray(post.comments)
                ? post.comments.length
                : 0;

        const isOwner =
            post.authorId === user.id;

        return `
            <article
                class="feed-post-card"
                data-post-id="${escapeHTML(post.id)}"
                data-type="${escapeHTML(post.type)}"
            >

                <div class="feed-post-header">

                    <div class="feed-post-author">

                        <div class="feed-post-avatar">

                            ${
                                post.authorAvatar
                                    ? `
                                        <img
                                            src="${escapeHTML(post.authorAvatar)}"
                                            alt=""
                                        >
                                      `
                                    : `
                                        <span>
                                            ${escapeHTML(
                                                (
                                                    post.authorName ||
                                                    "V"
                                                ).charAt(0)
                                            )}
                                        </span>
                                      `
                            }

                        </div>

                        <div class="feed-post-author-info">

                            <strong>
                                ${escapeHTML(
                                    post.authorName
                                )}
                            </strong>

                            <span>
                                @${escapeHTML(
                                    post.authorUsername
                                    )}
                            </span>

                        </div>

                    </div>

                    <div class="feed-post-type">

                        <span>
                            ${type.icon}
                        </span>

                        <span>
                            ${escapeHTML(
                                type.label
                            )}
                        </span>

                    </div>

                </div>


                <div class="feed-post-meta">

                    <span>
                        ${formatDate(
                            post.createdAt
                        )}
                    </span>

                    <span>
                        ${
                            post.privacy === "private"
                                ? "🔒 خاص"
                                : "🌐 عام"
                        }
                    </span>

                </div>


                <div class="feed-post-content">

                    ${
                        post.title
                            ? `
                                <h3>
                                    ${escapeHTML(
                                        post.title
                                    )}
                                </h3>
                              `
                            : ""
                    }

                    ${
                        post.content
                            ? `
                                <p>
                                    ${escapeHTML(
                                        post.content
                                    )}
                                </p>
                              `
                            : ""
                    }

                    ${
                        post.image
                            ? `
                                <div class="feed-post-image">
                                    <img
                                        src="${escapeHTML(
                                            post.image
                                        )}"
                                        alt=""
                                    >
                                </div>
                              `
                            : ""
                    }

                </div>


                <div class="feed-post-reward">

                    <span>
                        ${type.icon}
                    </span>

                    <strong>
                        +${type.stars}
                    </strong>

                    <span>
                        نجوم
                    </span>

                </div>


                <div class="feed-post-actions">

                    <button
                        type="button"
                        class="feed-action-button ${
                            liked ? "liked" : ""
                        }"
                        data-action="like"
                        data-post-id="${escapeHTML(
                            post.id
                        )}"
                    >
                        <span>
                            ${liked ? "♥" : "♡"}
                        </span>

                        <span>
                            ${likes.length}
                        </span>
                    </button>


                    <button
                        type="button"
                        class="feed-action-button"
                        data-action="details"
                        data-post-id="${escapeHTML(
                            post.id
                        )}"
                    >
                        💬
                        ${comments}
                    </button>


                    <button
                        type="button"
                        class="feed-action-button"
                        data-action="details"
                        data-post-id="${escapeHTML(
                        post.id
                        )}"
                    >
                        عرض
                    </button>


                    ${
                        isOwner
                            ? `
                                <button
                                    type="button"
                                    class="feed-action-button feed-delete-button"
                                    data-action="delete"
                                    data-post-id="${escapeHTML(
                                        post.id
                                    )}"
                                >
                                    حذف
                                </button>
                              `
                            : ""
                    }

                </div>

            </article>
        `;
    }

    /* =========================================================
       RENDER FEED
       ========================================================= */

    function renderFeed() {
        const container =
            $("#feedPosts");

        if (!container) {
            console.error(
                "VENUS: #feedPosts not found."
            );

            return;
        }

        const posts =
            getFilteredPosts();

        const empty =
            $("#feedEmpty");

        if (!posts.length) {

            container.innerHTML = "";

            if (empty) {
                empty.hidden = false;
            }

            return;
        }

        if (empty) {
            empty.hidden = true;
        }

        container.innerHTML =
            posts
                .map(renderPost)
                .join("");
    }

    /* =========================================================
       CREATE MODAL
       ========================================================= */

    function getCreateModal() {
        return $("#createPostModal");
    }

    function openCreateModal(
        type = "article"
    ) {
        const modal =
            getCreateModal();

        if (!modal) {
            console.error(
                "VENUS: #createPostModal not found."
            );

            return;
        }

        selectedPostType =
            POST_TYPES[type]
                ? type
                : "article";

        selectedImage = "";

        /*
         * Reset fields
         */

        const title =
            $("#postTitle");

        const content =
            $("#postContent");

        const privacy =
            $("#postPrivacy");

        const image =
            $("#postImage");

        const message =
            $("#postFormMessage");

        const preview =
            $("#postImagePreview");

        if (title) {
            title.value = "";
        }

        if (content) {
            content.value = "";
        }

        if (privacy) {
            privacy.value = "public";
        }

        if (image) {
            image.value = "";
        }

        if (message) {
            message.textContent = "";
            message.className =
                "feed-form-message";
        }

        if (preview) {
            preview.hidden = true;
        }

        updateCharacterCount();

        /*
         * Select type
         */

        $$(
            "[data-create-type]"
        ).forEach((button) => {
            button.classList.toggle(
                "active",
                button.dataset.createType ===
                    selectedPostType
            );
        });

        /*
         * THIS IS IMPORTANT
         * The HTML has hidden="true"
         */

        modal.hidden = false;

        modal.classList.add("open");
        modal.classList.add("active");

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );

        /*
         * Focus
         */

        setTimeout(() => {
            if (title) {
                title.focus();
            }
        }, 50);
    }
    function closeCreateModal() {
        const modal =
            getCreateModal();

        if (!modal) return;

        modal.hidden = true;

        modal.classList.remove("open");
        modal.classList.remove("active");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-open"
        );
    }

    /* =========================================================
       SELECT POST TYPE
       ========================================================= */

    function selectPostType(type) {
        if (!POST_TYPES[type]) return;

        selectedPostType = type;

        $$(
            "[data-create-type]"
        ).forEach((button) => {
            button.classList.toggle(
                "active",
                button.dataset.createType ===
                    type
            );
        });
    }

    /* =========================================================
       CHARACTER COUNT
       ========================================================= */

    function updateCharacterCount() {
        const content =
            $("#postContent");

        const counter =
            $("#postCharacterCount");

        if (!content || !counter) {
            return;
        }

        counter.textContent =
            `${content.value.length} / 5000`;
    }

    /* =========================================================
       IMAGE
       ========================================================= */

    function handleImageChange(event) {
        const file =
            event.target.files &&
            event.target.files[0];

        const preview =
            $("#postImagePreview");

        const previewImg =
            $("#postImagePreviewImg");

        if (!preview || !previewImg) {
            return;
        }

        if (!file) {
            selectedImage = "";

            preview.hidden = true;

            previewImg.src = "";

            return;
        }

        if (!file.type.startsWith("image/")) {
            event.target.value = "";

            selectedImage = "";

            preview.hidden = true;

            previewImg.src = "";

            return;
        }

        const reader =
            new FileReader();

        reader.onload = (e) => {
            selectedImage =
                e.target.result;

            previewImg.src =
                selectedImage;

            preview.hidden = false;
        };

        reader.readAsDataURL(file);
    }

    function removeImage() {
        selectedImage = "";

        const image =
            $("#postImage");

        const preview =
            $("#postImagePreview");

        const previewImg =
            $("#postImagePreviewImg");

        if (image) {
            image.value = "";
        }

        if (preview) {
            preview.hidden = true;
        }

        if (previewImg) {
            previewImg.src = "";
        }
    }

    /* =========================================================
       PUBLISH
       ========================================================= */

    function handleCreatePost(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const title =
            $("#postTitle");

        const content =
            $("#postContent");

        const privacy =
            $("#postPrivacy");

        const message =
            $("#postFormMessage");

        const titleValue =
            title
                ? title.value.trim()
                : "";

        const contentValue =
            content
                ? content.value.trim()
                : "";

        const privacyValue =
            privacy
                ? privacy.value
                : "public";

        /*
         * Must have something
         */

        if (
            !titleValue &&
            !contentValue &&
            !selectedImage
        ) {
            if (message) {
                message.textContent =
                "اكتب عنوانًا أو محتوى أو أضف صورة قبل النشر.";

                message.className =
                    "feed-form-message error";
            }

            return;
        }

        /*
         * Create
         */

        const post =
            createPost({
                type:
                    selectedPostType,

                title:
                    titleValue,

                content:
                    contentValue,

                image:
                    selectedImage,

                privacy:
                    privacyValue
            });

        if (!post) return;

        /*
         * Close modal
         */

        closeCreateModal();

        /*
         * Refresh feed
         */

        renderFeed();

        /*
         * Success
         */

        window.dispatchEvent(
            new CustomEvent(
                "venus:showToast",
                {
                    detail: {
                        message:
                            "تم نشر المنشور بنجاح ✦"
                    }
                }
            )
        );
    }

    /* =========================================================
       DETAILS MODAL
       ========================================================= */

    function openPostDetails(postId) {
        const posts =
            getPosts();

        const post =
            posts.find(
                (item) =>
                    item.id === postId
            );

        if (!post) return;

        const modal =
            $("#postDetailsModal");

        const container =
            $("#postDetailsContainer");

        if (!modal || !container) {
            return;
        }

        const type =
            getType(post.type);

        const user =
            getCurrentUser();

        const likes =
            Array.isArray(post.likes)
                ? post.likes
                : [];

        const liked =
            likes.includes(user.id);

        container.innerHTML = `
            <div class="post-details-content">

                <div class="feed-post-type">
                    <span>
                        ${type.icon}
                    </span>

                    <span>
                        ${escapeHTML(
                            type.label
                        )}
                    </span>
                </div>

                <h2 id="postDetailsTitle">
                    ${escapeHTML(
                        post.title ||
                        type.label
                    )}
                </h2>

                <div class="post-details-author">

                    ${
                        post.authorAvatar
                            ? `
                                <img
                                    src="${escapeHTML(
                                        post.authorAvatar
                                    )}"
                                    alt=""
                                >
                              `
                            : `
                                <div>
                                    ${escapeHTML(
                                        (
                                            post.authorName ||
                                            "V"
                                        ).charAt(0)
                                    )}
                                </div>
                              `
                    }

                    <span>
                        ${escapeHTML(
                            post.authorName
                        )}
                    </span>

                </div>

                <p>
                    ${formatDate(
                        post.createdAt
                    )}
                </p>

                ${
                    post.content
                        ? `
                            <div>
                                ${escapeHTML(
                                    post.content
                                )}
                            </div>
                            `
                        : ""
                }

                ${
                    post.image
                        ? `
                            <div class="post-details-image">
                                <img
                                    src="${escapeHTML(
                                        post.image
                                    )}"
                                    alt=""
                                >
                            </div>
                          `
                        : ""
                }

                <div class="post-details-reward">
                    ${type.icon}
                    +${type.stars} نجوم
                </div>

                <button
                    type="button"
                    class="primary-feed-button"
                    data-details-like="${escapeHTML(
                        post.id
                    )}"
                >
                    ${liked ? "♥" : "♡"}
                    ${likes.length}
                </button>

            </div>
        `;

        modal.hidden = false;

        modal.classList.add("open");
        modal.classList.add("active");

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );
    }

    function closePostDetails() {
        const modal =
            $("#postDetailsModal");

        if (!modal) return;

        modal.hidden = true;

        modal.classList.remove("open");
        modal.classList.remove("active");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-open"
        );
    }

    /* =========================================================
       CLICK EVENTS
       ========================================================= */

    document.addEventListener(
        "click",
        (event) => {

            /*
             * MAIN CREATE BUTTON
             */

            const openButton =
                event.target.closest(
                    "#openCreatePost"
                );

            if (openButton) {
                event.preventDefault();

                openCreateModal(
                    "article"
                );

                return;
            }


            /*
             * QUICK POST BUTTONS
             */

            const quickButton =
                event.target.closest(
                    ".quick-post-button"
                );

            if (quickButton) {
                event.preventDefault();

                openCreateModal(
                    quickButton.dataset.postType ||
                    "article"
                );

                return;
            }


            /*
             * EMPTY STATE BUTTON
             */

            const emptyButton =
                event.target.closest(
                    "#emptyCreatePost"
                );

            if (emptyButton) {
                event.preventDefault();

                openCreateModal(
                    "article"
                );

                return;
            }


            /*
             * CREATE TYPE
             */

            const typeButton =
                event.target.closest(
                    "[data-create-type]"
                );

            if (typeButton) {
                event.preventDefault();

                selectPostType(
                    typeButton.dataset.createType
                );

                return;
            }


            /*
             * CLOSE CREATE
             */

            const closeCreate =
                event.target.closest(
                    "#closeCreatePost"
                );

            if (closeCreate) {
                event.preventDefault();

                closeCreateModal();

                return;
            }


            /*
             * CREATE OVERLAY
             */

            const createOverlay =
                event.target.
                closest(
                    "#closeCreatePostOverlay"
                );

            if (createOverlay) {
                event.preventDefault();

                closeCreateModal();

                return;
            }


            /*
             * CANCEL
             */

            const cancelCreate =
                event.target.closest(
                    "#cancelCreatePost"
                );

            if (cancelCreate) {
                event.preventDefault();

                closeCreateModal();

                return;
            }


            /*
             * REMOVE IMAGE
             */

            const removeImageButton =
                event.target.closest(
                    "#removePostImage"
                );

            if (removeImageButton) {
                event.preventDefault();

                removeImage();

                return;
            }


            /*
             * CLOSE DETAILS
             */

            const closeDetails =
                event.target.closest(
                    "#closePostDetails"
                );

            if (closeDetails) {
                event.preventDefault();

                closePostDetails();

                return;
            }


            /*
             * DETAILS OVERLAY
             */

            const detailsOverlay =
                event.target.closest(
                    "#closePostDetailsOverlay"
                );

            if (detailsOverlay) {
                event.preventDefault();

                closePostDetails();

                return;
            }


            /*
             * FEED FILTERS
             */

            const filterButton =
                event.target.closest(
                    ".feed-filter"
                );

            if (filterButton) {
                event.preventDefault();

                setFilter(
                    filterButton.dataset.feedFilter ||
                    "all"
                );

                return;
            }


            /*
             * POST ACTIONS
             */

            const actionButton =
                event.target.closest(
                    "[data-action]"
                );

            if (actionButton) {
                event.preventDefault();

                const action =
                    actionButton.dataset.action;

                const postId =
                    actionButton.dataset.postId;

                if (action === "like") {
                    toggleLike(postId);
                    return;
                }

                if (action === "details") {
                    openPostDetails(postId);
                    return;
                }

                if (action === "delete") {

                    const confirmed =
                        window.confirm(
                            "هل تريد حذف هذا المنشور؟"
                        );

                    if (confirmed) {
                        deletePost(postId);
                    }

                    return;
                }
            }


            /*
             * DETAILS LIKE
             */

            const detailsLike =
                event.target.closest(
                    "[data-details-like]"
                );

            if (detailsLike) {
                event.preventDefault();

                const postId =
                    detailsLike.dataset.detailsLike;

                toggleLike(postId);

                openPostDetails(postId);

                return;
            }
        }
    );

    /* =========================================================
       INPUT EVENTS
       ========================================================= */

    const content =
        $("#postContent");

    if (content) {
        content.addEventListener(
            "input",
            updateCharacterCount
        );
    }

    const image =
        $("#postImage");

    if (image) {
        image.addEventListener(
            "change",
            handleImageChange
        );
    }
    /* =========================================================
       PUBLISH BUTTON
       ========================================================= */

    const publishButton =
        $("#publishPostButton");

    if (publishButton) {
        publishButton.addEventListener(
            "click",
            handleCreatePost
        );
    }

    /* =========================================================
       ESCAPE
       ========================================================= */

    document.addEventListener(
        "keydown",
        (event) => {
            if (event.key !== "Escape") {
                return;
            }

            closeCreateModal();
            closePostDetails();
        }
    );

    /* =========================================================
       PUBLIC API
       ========================================================= */

    window.VenusFeed = {
        getPosts,

        getFilteredPosts,

        createPost,

        deletePost,

        toggleLike,

        render: renderFeed,

        refresh: renderFeed,

        openCreateModal,

        closeCreateModal,

        openPostDetails,

        closePostDetails,

        setFilter,

        getFilter: () =>
            currentFilter,

        getPostTypes: () =>
            ({ ...POST_TYPES })
    };

    /* =========================================================
       INITIALIZE
       ========================================================= */

    renderFeed();

    updateCharacterCount();

    console.log(
        "VENUS Feed loaded successfully ✦"
    );
});
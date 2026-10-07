/* =========================================================
   VENUS — POST.JS
   Create Post Page
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* =====================================================
       STORAGE
       ===================================================== */

    const POSTS_KEY = "venusPosts";
    const PROFILE_KEY = "venusProfile";

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];


    /* =====================================================
       ELEMENTS
       ===================================================== */

    const form = $("#postForm");
    const titleInput = $("#postTitle");
    const contentInput = $("#postContent");
    const characterCount = $("#postCharacterCount");

    const imageInput = $("#postImage");
    const imagePreview = $("#postImagePreview");
    const imagePreviewImg = $("#postImagePreviewImg");
    const removeImageButton = $("#removePostImage");

    const privacyInput = $("#postPrivacy");

    const messageBox = $("#postFormMessage");

    const publishButton = $("#publishPostButton");

    const backButton = $("#postBackButton");
    const cancelButton = $("#cancelPostButton");


    /* =====================================================
       CURRENT POST TYPE
       ===================================================== */

    let currentPostType = "article";

    let selectedImage = "";


    /* =====================================================
       STORAGE HELPERS
       ===================================================== */

    function getPosts() {
        try {
            const saved = localStorage.getItem(POSTS_KEY);

            if (!saved) {
                return [];
            }

            const posts = JSON.parse(saved);

            return Array.isArray(posts)
                ? posts
                : [];

        } catch (error) {
            console.error(
                "VENUS: Could not read posts.",
                error
            );

            return [];
        }
    }


    function savePosts(posts) {
        try {
            localStorage.setItem(
                POSTS_KEY,
                JSON.stringify(posts)
            );

            return true;

        } catch (error) {
            console.error(
                "VENUS: Could not save posts.",
                error
            );

            return false;
        }
    }


    function getProfile() {
        try {
            const saved =
                localStorage.getItem(PROFILE_KEY);

            if (!saved) {
                return {};
            }

            return JSON.parse(saved) || {};

        } catch (error) {
            console.error(
                "VENUS: Could not read profile.",
                error
            );

            return {};
        }
    }


    /* =====================================================
       ID
       ===================================================== */

    function createId() {
        return (
            "post_" +
            Date.now().toString(36) +
            "_" +
            Math.random()
                .toString(36)
                .slice(2, 9)
        );
    }


    /* =====================================================
       DATE
       ===================================================== */

    function getDate() {
        return new Date().toISOString();
    }


    /* =====================================================
       MESSAGE
       ===================================================== */

    function showMessage(
        text,
        type = "error"
    ) {
        if (!messageBox) {
            return;
        }

        messageBox.textContent = text;

        messageBox.classList.toggle(
            "success",
            type === "success"
        );

        messageBox.hidden = false;
    }


    function hideMessage() {
    if (!messageBox) {
            return;
        }

        messageBox.hidden = true;
        messageBox.textContent = "";

        messageBox.classList.remove(
            "success"
        );
    }


    /* =====================================================
       CHARACTER COUNT
       ===================================================== */

    function updateCharacterCount() {

        if (!contentInput || !characterCount) {
            return;
        }

        const length =
            contentInput.value.length;

        characterCount.textContent =
            `${length} / 5000`;
    }


    contentInput?.addEventListener(
        "input",
        updateCharacterCount
    );


    /* =====================================================
       POST TYPE
       ===================================================== */

    $$(".post-type").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                $$(".post-type").forEach(
                    item => {
                        item.classList.remove(
                            "active"
                        );
                    }
                );

                button.classList.add(
                    "active"
                );

                currentPostType =
                    button.dataset.postType ||
                    "article";

                updateFormForType();

                hideMessage();
            }
        );

    });


    /* =====================================================
       TYPE TEXT
       ===================================================== */

    function updateFormForType() {

        if (!titleInput) {
            return;
        }

        const placeholders = {

            article:
                "مثال: كيف بدأت بتعلم البرمجة؟",

            volunteering:
                "مثال: حملة تطوعية لتنظيف المدرسة",

            project:
                "مثال: مشروع لإعادة تدوير البلاستيك",

            achievement:
                "مثال: حصولي على المركز الأول"
        };

        titleInput.placeholder =
            placeholders[currentPostType] ||
            "اكتب عنوان المنشور...";
    }


    /* =====================================================
       IMAGE
       ===================================================== */

    imageInput?.addEventListener(
        "change",
        event => {

            const file =
                event.target.files?.[0];

            if (!file) {
                return;
            }

            if (
                !file.type.startsWith("image/")
            ) {

                showMessage(
                    "الملف المختار ليس صورة."
                );

                imageInput.value = "";

                return;
            }


            const reader =
                new FileReader();


            reader.onload = () => {

                selectedImage =
                    reader.result;

                if (imagePreviewImg) {
                    imagePreviewImg.src =
                        selectedImage;
                }

                if (imagePreview) {
                    imagePreview.hidden =
                        false;
                }
            };


            reader.onerror = () => {

                showMessage(
                    "تعذر قراءة الصورة."
                );

            };


            reader.readAsDataURL(file);

        }
    );


    /* =====================================================
       REMOVE IMAGE
       ===================================================== */

    removeImageButton?.addEventListener(
        "click",
        () => {

            selectedImage = "";

            if (imageInput) {
                imageInput.value = "";
            }

            if (imagePreviewImg) {
                imagePreviewImg.src = "";
            }

            if (imagePreview) {
                imagePreview.hidden = true;
            }

        }
    );


    /* =====================================================
       CREATE POST OBJECT
       ===================================================== */

    function createPostObject() {

        const profile =
            getProfile();


        const title =
            titleInput?.value.trim() || "";


        const content =
            contentInput?.value.trim() || "";


        const privacy =
            privacyInput?.value ||
            "public";


        const username =
            profile.username ||
            profile.nickname ||
            "venus_user";


        const name =
            profile.name ||
            profile.fullName ||
            "VENUS User";


        const avatar =
            profile.avatar ||
            "";


        const post = {

            id: createId(),

            type: currentPostType,

            title: title,

            content: content,

            image: selectedImage,

            privacy: privacy,

            authorId:
                profile.id ||
                profile.userId ||
                "local_user",

            authorName: name,

            authorUsername: username,

            authorAvatar: avatar,

            createdAt: getDate(),

            updatedAt: getDate(),

            likes: [],

            comments: [],

            reposts: [],

            likesCount: 0,

            commentsCount: 0,

            repostsCount: 0,

            stars: getStarsForType(
                currentPostType
            )

        };


        return post;
    }


    /* =====================================================
       STARS
       ===================================================== */

    function getStarsForType(type) {

        const stars = {

            article: 1,

            volunteering: 3,

            project: 5,

            achievement: 5
        };

        return stars[type] || 0;
    }


    /* =====================================================
       VALIDATION
       ===================================================== */

    function validatePost() {

        const title =
            titleInput?.value.trim() || "";


        const content =
            contentInput?.value.trim() || "";


        if (!title) {

            showMessage(
                "اكتب عنوان المنشور أولًا."
            );

            titleInput?.focus();

            return false;
        }


        if (title.length < 2) {

            showMessage(
                "عنوان المنشور قصير جدًا."
            );

            titleInput?.focus();

            return false;
        }


        if (!content) {

            showMessage(
                "اكتب محتوى المنشور أولًا."
            );

            contentInput?.focus();

            return false;
        }


        if (content.length < 3) {

            showMessage(
                "محتوى المنشور قصير جدًا."
            );

            contentInput?.focus();

            return false;
        }


        return true;
    }


    /* =====================================================
       PUBLISH
       ===================================================== */

    form?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            hideMessage();


            if (!validatePost()) {
                return;
            }


            if (publishButton) {
                publishButton.disabled =
                    true;

                publishButton.style.opacity =
                    "0.6";
            }


            try {

                const post =
                    createPostObject();


                const posts =
                    getPosts();


                posts.unshift(post);


                const saved =
                    savePosts(posts);


                if (!saved) {

                    throw new Error(
                        "Could not save post."
                    );

                }


                updateProfileStars(
                    post.stars
                );


                showMessage(
                    "تم نشر المنشور بنجاح ✦",
                    "success"
                );
                setTimeout(
                    () => {

                        window.location.href =
                            "index.html";

                    },
                    700
                );


            } catch (error) {

                console.error(
                    "VENUS: Publish failed.",
                    error
                );


                showMessage(
                    "حدث خطأ أثناء نشر المنشور."
                );


                if (publishButton) {

                    publishButton.disabled =
                        false;

                    publishButton.style.opacity =
                        "";

                }

            }

        }
    );


    /* =====================================================
       PROFILE STARS
       ===================================================== */

    function updateProfileStars(
        amount
    ) {

        if (!amount) {
            return;
        }


        try {

            const profile =
                getProfile();


            profile.stars =
                Number(profile.stars || 0) +
                Number(amount);


            localStorage.setItem(
                PROFILE_KEY,
                JSON.stringify(profile)
            );


            /*
             * Compatibility with the
             * older Venus storage system.
             */

            const oldProfile =
                localStorage.getItem(
                    "venusProfile"
                );


            if (oldProfile) {

                try {

                    const parsed =
                        JSON.parse(oldProfile);


                    parsed.stars =
                        Number(parsed.stars || 0) +
                        Number(amount);


                    localStorage.setItem(
                        "venusProfile",
                        JSON.stringify(parsed)
                    );

                } catch (error) {

                    console.warn(
                        "VENUS: Old profile sync skipped.",
                        error
                    );

                }

            }

        } catch (error) {

            console.warn(
                "VENUS: Could not update stars.",
                error
            );

        }

    }


    /* =====================================================
       BACK
       ===================================================== */

    function goBack() {

        if (
            document.referrer &&
            document.referrer.includes(
                window.location.hostname
            )
        ) {

            window.history.back();

            return;
        }


        window.location.href =
            "index.html";
    }


    backButton?.addEventListener(
        "click",
        goBack
    );


    cancelButton?.addEventListener(
        "click",
        goBack
    );


    /* =====================================================
       ESCAPE
       ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                goBack();

            }

        }
    );


    /* =====================================================
       INITIALIZE
       ===================================================== */

    updateCharacterCount();

    updateFormForType();


    console.log(
        "✦ VENUS post.js loaded successfully."
    );

});
document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* =========================================================
       VENUS — NOTIFICATIONS SYSTEM
       Local MVP
       ========================================================= */

    const STORAGE_KEY = "venusNotifications";

    /* =========================================================
       HELPERS
       ========================================================= */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        Array.from(parent.querySelectorAll(selector));

    const getCurrentUser = () => {
        const keys = [
            "venusCurrentUser",
            "currentUser",
            "venusUser"
        ];

        for (const key of keys) {
            try {
                const data = localStorage.getItem(key);

                if (data) {
                    return JSON.parse(data);
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

    const getUserId = () => {
        const user = getCurrentUser();

        return user?.id ||
            user?.userId ||
            user?.username ||
            "demo_volunteer";
    };

    const createId = () => {
        return (
            "notification_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .slice(2, 9)
        );
    };

    const escapeHTML = (value) => {
        const div = document.createElement("div");

        div.textContent = String(
            value ?? ""
        );

        return div.innerHTML;
    };

    /* =========================================================
       STORAGE
       ========================================================= */

    const getNotifications = () => {
        try {
            const data =
                localStorage.getItem(STORAGE_KEY);

            if (!data) {
                return [];
            }

            const parsed = JSON.parse(data);

            return Array.isArray(parsed)
                ? parsed
                : [];

        } catch (error) {
            console.warn(
                `Venus: could not read notifications.`,
                error
            );

            return [];
        }
    };

    const saveNotifications = (notifications) => {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(notifications)
            );

            return true;

        } catch (error) {
            console.warn(
                `Venus: could not save notifications.`,
                error
            );

            return false;
        }
    };

    /* =========================================================
       NORMALIZE
       ========================================================= */

    const normalizeNotification = (notification = {}) => {
        return {
            id:
                notification.id ||
                createId(),

            userId:
                notification.userId ||
                getUserId(),

            type:
                notification.type ||
                "activity",

            title:
                notification.title ||
                "إشعار جديد",

            message:
                notification.message ||
                "",

            icon:
                notification.icon ||
                "✦",

            time:
                notification.time ||
                new Date().toISOString(),

            read:
                Boolean(notification.read),

            link:
                notification.link ||
                "",

            actionText:
                notification.actionText ||
                "",

            createdAt:
                notification.createdAt ||
                new Date().toISOString()
        };
    };
    /* =========================================================
       USER NOTIFICATIONS
       ========================================================= */

    const getUserNotifications = () => {
        const userId = getUserId();

        return getNotifications()
            .map(normalizeNotification)
            .filter(
                notification =>
                    notification.userId === userId
            )
            .sort(
                (a, b) =>
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
            );
    };

    /* =========================================================
       ADD NOTIFICATION
       ========================================================= */

    const addNotification = ({
        userId = getUserId(),
        type = "activity",
        title = "إشعار جديد",
        message = "",
        icon = "✦",
        link = "",
        actionText = ""
    } = {}) => {

        const notifications =
            getNotifications();

        const notification =
            normalizeNotification({
                id: createId(),
                userId,
                type,
                title,
                message,
                icon,
                link,
                actionText,
                read: false,
                time: new Date().toISOString(),
                createdAt: new Date().toISOString()
            });

        notifications.push(notification);

        saveNotifications(notifications);

        return notification;
    };

    /* =========================================================
       MARK AS READ
       ========================================================= */

    const markAsRead = (notificationId) => {
        const notifications =
            getNotifications();

        let changed = false;

        const updated =
            notifications.map(notification => {

                if (
                    notification.id ===
                    notificationId
                ) {
                    changed = true;

                    return {
                        ...notification,
                        read: true
                    };
                }

                return notification;
            });

        if (changed) {
            saveNotifications(updated);
        }

        return changed;
    };

    /* =========================================================
       MARK ALL AS READ
       ========================================================= */

    const markAllAsRead = () => {
        const userId = getUserId();

        const notifications =
            getNotifications();

        let changed = false;

        const updated =
            notifications.map(notification => {

                if (
                    notification.userId === userId &&
                    !notification.read
                ) {
                    changed = true;

                    return {
                        ...notification,
                        read: true
                    };
                }

                return notification;
            });

        if (changed) {
            saveNotifications(updated);
        }

        return changed;
    };

    /* =========================================================
       DELETE NOTIFICATION
       ========================================================= */

    const deleteNotification = (
        notificationId
    ) => {

        const notifications =
            getNotifications();

        const updated =
            notifications.filter(
                notification =>
                    notification.id !==
                    notificationId
            );

        saveNotifications(updated);

        return true;
    };

    /* =========================================================
       DATE FORMAT
       ========================================================= */

    const formatTime = (dateValue) => {
        const date =
            new Date(dateValue);

        if (
            Number.isNaN(
            date.getTime()
            )
        ) {
            return "";
        }

        const now = new Date();

        const difference =
            Math.floor(
                (now - date) / 1000
            );

        if (difference < 60) {
            return "الآن";
        }

        const minutes =
            Math.floor(
                difference / 60
            );

        if (minutes < 60) {
            return `منذ ${minutes} دقيقة`;
        }

        const hours =
            Math.floor(
                minutes / 60
            );

        if (hours < 24) {
            return `منذ ${hours} ساعة`;
        }

        const days =
            Math.floor(
                hours / 24
            );

        if (days < 7) {
            return `منذ ${days} يوم`;
        }

        return date.toLocaleDateString(
            "ar-IQ",
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );
    };

    /* =========================================================
       FILTER STATE
       ========================================================= */

    let currentFilter = "all";

    /* =========================================================
       FILTER NOTIFICATIONS
       ========================================================= */

    const filterNotifications = (
        notifications
    ) => {

        switch (currentFilter) {

            case "unread":
                return notifications.filter(
                    notification =>
                        !notification.read
                );

            case "team":
                return notifications.filter(
                    notification =>
                        notification.type ===
                        "team"
                );

            case "competition":
                return notifications.filter(
                    notification =>
                        notification.type ===
                        "competition"
                );

            case "activity":
                return notifications.filter(
                    notification =>
                        notification.type ===
                        "activity"
                );

            case "all":
            default:
                return notifications;
        }
    };

    /* =========================================================
       RENDER EMPTY
       ========================================================= */

    const updateEmptyState = (
        notifications
    ) => {

        const empty =
            $("#notificationsEmpty");

        if (!empty) {
            return;
        }

        empty.hidden =
            notifications.length !== 0;
    };

    /* =========================================================
       RENDER NOTIFICATIONS
       ========================================================= */

    const renderNotifications = () => {

        const container =
            $("#notificationsContainer");

        if (!container) {
            return;
        }

        const allNotifications =
            getUserNotifications();

        const notifications =
            filterNotifications(
                allNotifications
            );

        container.innerHTML = "";

        updateEmptyState(
            notifications
        );

        if (!notifications.length) {
            return;
        }

        notifications.forEach(
            notification => {

                const card =
                    document.createElement("article");

                card.className =
                    "notification-card";

                if (!notification.read) {
                    card.classList.add("unread");
                }

                card.dataset.id =
                    notification.id;

                card.dataset.type =
                    notification.type;

                const safeTitle =
                    escapeHTML(
                        notification.title
                    );

                const safeMessage =
                escapeHTML(
                        notification.message
                    );

                const safeIcon =
                    escapeHTML(
                        notification.icon
                    );

                const safeTime =
                    escapeHTML(
                        formatTime(
                            notification.createdAt
                        )
                    );

                card.innerHTML = `
                    <div class="notification-icon">
                        ${safeIcon}
                    </div>

                    <div class="notification-content">

                        <h3 class="notification-title">
                            ${safeTitle}
                        </h3>

                        <p class="notification-message">
                            ${safeMessage}
                        </p>

                        <span class="notification-time">
                            ${safeTime}
                        </span>

                    </div>

                    ${
                        notification.actionText
                            ? `
                                <button
                                    type="button"
                                    class="notification-action"
                                    data-notification-action
                                >
                                    ${escapeHTML(
                                        notification.actionText
                                    )}
                                </button>
                            `
                            : ""
                    }
                `;

                container.appendChild(
                    card
                );
            }
        );
    };

    /* =========================================================
       FILTER BUTTONS
       ========================================================= */

    const setupFilters = () => {

        const buttons =
            $$(".notification-filter");

        buttons.forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    currentFilter =
                        button.dataset
                            .notificationFilter ||
                        "all";

                    buttons.forEach(
                        item => {
                            item.classList.toggle(
                                "active",
                                item === button
                            );
                        }
                    );

                    renderNotifications();
                }
            );
        });
    };

    /* =========================================================
       CARD CLICK
       ========================================================= */

    const setupNotificationClicks = () => {

        const container =
            $("#notificationsContainer");

        if (!container) {
            return;
        }

        container.addEventListener(
            "click",
            event => {

                const card =
                    event.target.closest(
                        ".notification-card"
                    );

                if (!card) {
                    return;
                }

                const notificationId =
                    card.dataset.id;

                const notification =
                    getUserNotifications()
                        .find(
                            item =>
                                item.id ===
                                notificationId
                        );

                if (!notification) {
                    return;
                }

                markAsRead(
                    notificationId
                );

                card.classList.remove(
                    "unread"
                );

                if (
                    event.target.closest(
                        "[data-notification-action]"
                        )
                ) {
                    if (
                        notification.link
                    ) {
                        window.location.href =
                            notification.link;
                    }

                    return;
                }

                if (
                    notification.link
                ) {
                    window.location.href =
                        notification.link;
                }
            }
        );
    };

    /* =========================================================
       MARK ALL BUTTON
       ========================================================= */

    const setupMarkAll = () => {

        const button =
            $("#markAllNotifications");

        if (!button) {
            return;
        }

        button.addEventListener(
            "click",
            () => {

                markAllAsRead();

                renderNotifications();
            }
        );
    };

    /* =========================================================
       DEMO NOTIFICATIONS
       ========================================================= */

    const createDemoNotifications = () => {

        const existing =
            getUserNotifications();

        if (existing.length > 0) {
            return;
        }

        const userId =
            getUserId();

        const demoNotifications = [

            {
                userId,
                type: "team",
                title: "مرحبًا في نظام الفرق",
                message:
                    "يمكنك الانضمام إلى فريق واحد فقط والمشاركة في نشاطاته.",
                icon: "♟",
                actionText: ""
            },

            {
                userId,
                type: "competition",
                title: "مسابقات Venus",
                message:
                    "تابع المسابقات والأنشطة الجديدة واحصل على النجوم من خلال مشاركاتك.",
                icon: "✦",
                actionText: ""
            },

            {
                userId,
                type: "activity",
                title: "أهلًا بك في Venus",
                message:
                    "هذه مساحة تجريبية للإشعارات. ستظهر هنا التحديثات المهمة الخاصة بحسابك.",
                icon: "♡",
                actionText: ""
            }

        ];

        const notifications =
            getNotifications();

        demoNotifications.forEach(
            data => {

                notifications.push(
                    normalizeNotification({
                        ...data,
                        id: createId(),
                        read: false,
                        createdAt:
                            new Date().toISOString(),
                        time:
                            new Date().toISOString()
                    })
                );
            }
        );

        saveNotifications(
            notifications
        );
    };

    /* =========================================================
       PUBLIC API
       ========================================================= */

    window.VenusNotifications = {

        getNotifications,
        getUserNotifications,

        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,

        render: renderNotifications,

        refresh: renderNotifications,

        getUnreadCount: () => {
            return getUserNotifications()
                .filter(
                    notification =>
                        !notification.read
                )
                .length;
        }

    };

    /* =========================================================
       INITIALIZE
       ========================================================= */

    createDemoNotifications();

    setupFilters();

    setupNotificationClicks();

    setupMarkAll();

    renderNotifications();

});
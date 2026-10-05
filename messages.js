/* =========================================================
   VENUS — MESSAGES
   Local MVP
   ========================================================= */

(() => {
  "use strict";

  const CHAT_KEY = "venusChats";
  const PROFILE_KEY = "venusProfile";

  /* ---------------------------------------------------------
     Helpers
  --------------------------------------------------------- */

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getProfile() {
    try {
      return JSON.parse(localStorage.getItem(PROFILE_KEY)) || null;
    } catch {
      return null;
    }
  }

  function saveChats(chats) {
    localStorage.setItem(CHAT_KEY, JSON.stringify(chats));
  }

  function getChats() {
    try {
      const chats = JSON.parse(localStorage.getItem(CHAT_KEY));
      return Array.isArray(chats) ? chats : [];
    } catch {
      return [];
    }
  }

  function makeId() {
    return "chat_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  }

  function makeMessageId() {
    return "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
  }

  function getTime() {
    return new Date().toLocaleTimeString("ar-IQ", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  /* ---------------------------------------------------------
     Demo data
  --------------------------------------------------------- */

  function createDemoChats() {
    let chats = getChats();

    if (chats.length === 0) {
      chats = [
        {
          id: makeId(),
          type: "user",
          name: "VENUS",
          username: "@venus",
          avatar: "✦",
          color: "#861c27",
          messages: [
            {
              id: makeMessageId(),
              sender: "venus",
              text: "Welcome to VENUS Messages ✦",
              time: getTime(),
              mine: false
            },
            {
              id: makeMessageId(),
              sender: "venus",
              text: "Your private conversations will appear here.",
              time: getTime(),
              mine: false
            }
          ]
        }
      ];

      saveChats(chats);
    }

    return chats;
  }

  /* ---------------------------------------------------------
     CSS
  --------------------------------------------------------- */

  function injectStyles() {
    if (document.getElementById("venusMessagesStyles")) return;

    const style = document.createElement("style");
    style.id = "venusMessagesStyles";

    style.textContent = `
      #venusMessagesPage {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background:
          radial-gradient(circle at top right, rgba(201,154,61,.12), transparent 30%),
          linear-gradient(135deg, #f7f0df, #efe2c7);
        display: flex;
        flex-direction: column;
        color: #35151a;
      }

      .venus-msg-topbar {
        height: 72px;
        background: linear-gradient(135deg, #4b0d13, #861c27);
        color: #fffaf0;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 0 22px;
        box-shadow: 0 4px 20px rgba(75,13,19,.22);
        flex-shrink: 0;
      }

      .venus-msg-back {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        border: 1px solid rgba(241,220,155,.35);
        background: rgba(255,255,255,.08);
        color: #f1dc9b;
        font-size: 21px;
        cursor: pointer;
      }

      .venus-msg-brand {
        font-family: Georgia, serif;
        font-size: 22px;
        color: #f1dc9b;
        letter-spacing: 1px;
      }

      .venus-msg-layout {
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: 360px 1fr;
        direction: ltr;
      }

      .venus-msg-sidebar {
        background: rgba(255,250,240,.94);
        border-right: 1px solid rgba(155,107,31,.25);
        display: flex;
        flex-direction: column;
        direction: rtl;
        min-width: 0;
      }

      .venus-msg-sidebar-head {
        padding: 18px;
        border-bottom: 1px solid #eadcc1;
      }

      .venus-msg-sidebar-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;
      }

      .venus-msg-sidebar-title h2 {
        margin: 0;
        font-family: Georgia, serif;
        color: #650f18;
        font-size: 24px;
      }

      .venus-new-chat {
        border: none;
        background: #861c27;
        color: #f1dc9b;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 5px 14px rgba(134,28,39,.2);
      }

      .venus-chat-search {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid #dccca9;
        background: #fffaf0;
        border-radius: 14px;
        padding: 11px 14px;
        outline: none;
        color: #35151a;
        font-family: inherit;
      }

      .venus-chat-search:focus {
        border-color: #c99a3d;
        box-shadow: 0 0 0 3px rgba(201,154,61,.12);
      }

      .venus-chat-list {
        flex: 1;
        overflow-y: auto;
      }

      .venus-chat-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        cursor: pointer;
        border-bottom: 1px solid rgba(220,204,169,.45);
        transition: .2s;
      }

      .venus-chat-item:hover {
        background: #f6ecd7;
      }

      .venus-chat-item.active {
        background: #efe0c1;
      }

      .venus-chat-avatar {
        width: 52px;
        height: 52px;
        min-width: 52px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: #861c27;
        color: #f1dc9b;
        font-family: Georgia, serif;
        font-size: 21px;
        border: 2px solid #c99a3d;
      }

      .venus-chat-info {
        flex: 1;
        min-width: 0;
      }

      .venus-chat-name {
        font-weight: 800;
        color: #4b0d13;
        margin-bottom: 5px;
      }

      .venus-chat-preview {
        color: #7c6b58;
        font-size: 13px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .venus-chat-window {
        direction: rtl;
        display: flex;
        flex-direction: column;
        min-width: 0;
        background:
          radial-gradient(circle at 20% 20%, rgba(201,154,61,.08), transparent 25%),
          #eadfc9;
      }

      .venus-chat-head {
        height: 72px;
        flex-shrink: 0;
        background: rgba(255,250,240,.96);
        border-bottom: 1px solid #d9c7a5;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 20px;
      }

      .venus-chat-head-avatar {
        width: 46px;
        height: 46px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: #861c27;
        color: #f1dc9b;
        border: 2px solid #c99a3d;
        font-family: Georgia, serif;
      }

      .venus-chat-head-name {
        font-weight: 900;
        color: #4b0d13;
      }

      .venus-chat-head-username {
        color: #88735a;
        font-size: 12px;
        margin-top: 3px;
      }

      .venus-chat-actions {
        margin-right: auto;
        display: flex;
        gap: 7px;
      }

      .venus-chat-action {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        border: 1px solid #d8c39a;
        background: #fffaf0;
        color: #650f18;
        cursor: pointer;
        font-size: 17px;
      }

      .venus-messages-area {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 9px;
      }

      .venus-message-row {
        display: flex;
        width: 100%;
      }

      .venus-message-row.mine {
        justify-content: flex-start;
      }

      .venus-message-row.theirs {
      justify-content: flex-end;
      }

      .venus-message-bubble {
        max-width: min(70%, 620px);
        padding: 10px 14px 7px;
        border-radius: 17px;
        box-shadow: 0 3px 10px rgba(50,30,20,.07);
        line-height: 1.6;
        word-wrap: break-word;
      }

      .venus-message-row.mine .venus-message-bubble {
        background: #861c27;
        color: #fffaf0;
        border-bottom-left-radius: 5px;
      }

      .venus-message-row.theirs .venus-message-bubble {
        background: #fffaf0;
        color: #35151a;
        border-bottom-right-radius: 5px;
      }

      .venus-message-time {
        display: block;
        text-align: left;
        margin-top: 4px;
        font-size: 10px;
        opacity: .65;
      }

      .venus-message-composer {
        flex-shrink: 0;
        background: rgba(255,250,240,.97);
        border-top: 1px solid #d9c7a5;
        padding: 12px 16px;
        display: flex;
        gap: 9px;
        align-items: flex-end;
      }

      .venus-composer-input {
        flex: 1;
        min-height: 45px;
        max-height: 130px;
        resize: none;
        border: 1px solid #d8c39a;
        background: #fffdf7;
        border-radius: 16px;
        padding: 12px 14px;
        outline: none;
        font-family: inherit;
        color: #35151a;
        box-sizing: border-box;
      }

      .venus-composer-input:focus {
        border-color: #c99a3d;
      }

      .venus-send-button {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: none;
        background: #861c27;
        color: #f1dc9b;
        cursor: pointer;
        font-size: 20px;
        flex-shrink: 0;
      }

      .venus-empty-chat {
        margin: auto;
        text-align: center;
        color: #806d56;
      }

      .venus-empty-chat-symbol {
        font-size: 55px;
        color: #c99a3d;
        margin-bottom: 8px;
      }

      /* New chat modal */

      .venus-new-chat-overlay {
        position: fixed;
        inset: 0;
        z-index: 10001;
        background: rgba(40,10,15,.62);
        display: grid;
        place-items: center;
        padding: 20px;
      }

      .venus-new-chat-modal {
        width: min(520px, 100%);
        background: #fffaf0;
        border: 1px solid #c99a3d;
        border-radius: 22px;
        padding: 24px;
        box-shadow: 0 25px 70px rgba(0,0,0,.3);
      }

      .venus-new-chat-modal h2 {
        margin: 0 0 7px;
        color: #650f18;
        font-family: Georgia, serif;
      }

      .venus-new-chat-modal p {
        margin: 0 0 18px;
        color: #806d56;
        font-size: 14px;
      }

      .venus-new-user-input {
        width: 100%;
        box-sizing: border-box;
        padding: 13px 15px;
        border-radius: 13px;
        border: 1px solid #d8c39a;
        background: white;
        outline: none;
        font-family: inherit;
      }

      .venus-new-user-results {
        margin-top: 12px;
        max-height: 260px;
        overflow-y: auto;
      }

      .venus-user-result {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: 13px;
        cursor: pointer;
        transition: .2s;
      }

      .venus-user-result:hover {
        background: #f2e6cd;
      }

      .venus-user-result-avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #861c27;
        color: #f1dc9b;
        display: grid;
        place-items: center;
        border: 1px solid #c99a3d;
      }

      .venus-new-chat-close {
        width: 100%;
        margin-top: 14px;
        border: 1px solid #c99a3d;
        background: transparent;
        color: #650f18;
        padding: 11px;
        border-radius: 12px;
        cursor: pointer;
        font-family: inherit;
      }

      @media (max-width: 800px) {
        .venus-msg-layout {
          grid-template-columns: 1fr;
        }

        .venus-msg-sidebar {
          display: flex;
        }

        .venus-chat-window {
          display: none;
          }

        .venus-msg-layout.mobile-chat-open .venus-msg-sidebar {
          display: none;
        }

        .venus-msg-layout.mobile-chat-open .venus-chat-window {
          display: flex;
        }

        .venus-message-bubble {
          max-width: 82%;
        }
      }

      @media (max-width: 520px) {
        .venus-msg-topbar {
          padding: 0 12px;
        }

        .venus-msg-brand {
          font-size: 19px;
        }

        .venus-chat-actions {
          display: none;
        }

        .venus-messages-area {
          padding: 14px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /* ---------------------------------------------------------
     Main page
  --------------------------------------------------------- */

  let currentChatId = null;

  function openMessagesPage() {
    const profile = getProfile();

    if (!profile) {
      if (typeof showMessage === "function") {
        showMessage(
          "أنشئ ملفك الشخصي أولاً",
          "حتى تقدر تستخدم الرسائل، أنشئ حسابك الشخصي في VENUS.",
          "✦"
        );
      }
      return;
    }

    injectStyles();
    createDemoChats();

    const oldPage = document.getElementById("venusMessagesPage");
    if (oldPage) oldPage.remove();

    const page = document.createElement("div");
    page.id = "venusMessagesPage";

    page.innerHTML = `
      <div class="venus-msg-topbar">
        <button class="venus-msg-back" id="venusMessagesBack">→</button>
        <div class="venus-msg-brand">✦ VENUS MESSAGES</div>
      </div>

      <div class="venus-msg-layout" id="venusMessagesLayout">

        <aside class="venus-msg-sidebar">

          <div class="venus-msg-sidebar-head">
            <div class="venus-msg-sidebar-title">
              <h2>الرسائل</h2>
              <button class="venus-new-chat" id="venusNewChatButton">+</button>
            </div>

            <input
              class="venus-chat-search"
              id="venusChatSearch"
              placeholder="ابحث في محادثاتك..."
            />
          </div>

          <div class="venus-chat-list" id="venusChatList"></div>

        </aside>

        <main class="venus-chat-window" id="venusChatWindow">

          <div class="venus-chat-head" id="venusChatHead">
            <div class="venus-chat-head-avatar">✦</div>

            <div>
              <div class="venus-chat-head-name">اختر محادثة</div>
              <div class="venus-chat-head-username"></div>
            </div>

            <div class="venus-chat-actions">
              <button class="venus-chat-action" id="venusPinChat">⌖</button>
              <button class="venus-chat-action" id="venusChatInfo">ⓘ</button>
            </div>
          </div>

          <div class="venus-messages-area" id="venusMessagesArea">
            <div class="venus-empty-chat">
              <div class="venus-empty-chat-symbol">✦</div>
              <div>اختَر محادثة من القائمة</div>
            </div>
          </div>

          <div class="venus-message-composer">
            <textarea
              class="venus-composer-input"
              id="venusMessageInput"
              placeholder="اكتب رسالة..."
              disabled
            ></textarea>

            <button class="venus-send-button" id="venusSendButton" disabled>
              ➤
            </button>
          </div>

        </main>
      </div>
    `;

    document.body.appendChild(page);

    renderChatList();

    document.getElementById("venusMessagesBack").onclick = () => {
      page.remove();
    };

    document.getElementById("venusNewChatButton").onclick = openNewChatModal;

    document.getElementById("venusChatSearch").addEventListener(
      "input",
      renderChatList
    );

    document.getElementById("venusSendButton").onclick = sendCurrentMessage;

    document.getElementById("venusMessageInput").addEventListener(
      "keydown",
      event => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          sendCurrentMessage();
        }
      }
    );
  }
  /* ---------------------------------------------------------
     Chat list
  --------------------------------------------------------- */

  function renderChatList() {
    const list = document.getElementById("venusChatList");
    if (!list) return;

    const search =
      document.getElementById("venusChatSearch")?.value
        ?.trim()
        .toLowerCase() || "";

    const chats = getChats();

    const filtered = chats.filter(chat => {
      return (
        chat.name.toLowerCase().includes(search) ||
        chat.username.toLowerCase().includes(search)
      );
    });

    list.innerHTML = "";

    if (!filtered.length) {
      list.innerHTML = `
        <div style="padding:30px;text-align:center;color:#806d56;">
          لا توجد محادثات
        </div>
      `;
      return;
    }

    filtered.forEach(chat => {
      const lastMessage =
        chat.messages?.length
          ? chat.messages[chat.messages.length - 1].text
          : "لا توجد رسائل بعد";

      const item = document.createElement("div");

      item.className =
        "venus-chat-item" +
        (chat.id === currentChatId ? " active" : "");

      item.innerHTML = `
        <div class="venus-chat-avatar">
          ${escapeHTML(chat.avatar || chat.name.charAt(0))}
        </div>

        <div class="venus-chat-info">
          <div class="venus-chat-name">
            ${escapeHTML(chat.name)}
          </div>

          <div class="venus-chat-preview">
            ${escapeHTML(lastMessage)}
          </div>
        </div>
      `;

      item.onclick = () => openChat(chat.id);

      list.appendChild(item);
    });
  }

  /* ---------------------------------------------------------
     Open chat
  --------------------------------------------------------- */

  function openChat(chatId) {
    const chats = getChats();
    const chat = chats.find(c => c.id === chatId);

    if (!chat) return;

    currentChatId = chatId;

    const layout = document.getElementById("venusMessagesLayout");

    if (window.innerWidth <= 800) {
      layout.classList.add("mobile-chat-open");
    }

    const head = document.getElementById("venusChatHead");

    head.innerHTML = `
      <button
        class="venus-chat-action"
        id="venusMobileBack"
        style="display:${window.innerWidth <= 800 ? "block" : "none"}"
      >←</button>

      <div class="venus-chat-head-avatar">
        ${escapeHTML(chat.avatar || chat.name.charAt(0))}
      </div>

      <div>
        <div class="venus-chat-head-name">
          ${escapeHTML(chat.name)}
        </div>

        <div class="venus-chat-head-username">
          ${escapeHTML(chat.username)}
        </div>
      </div>

      <div class="venus-chat-actions">
        <button class="venus-chat-action" id="venusPinChat">⌖</button>
        <button class="venus-chat-action" id="venusChatInfo">ⓘ</button>
      </div>
    `;

    const back = document.getElementById("venusMobileBack");

    if (back) {
      back.onclick = () => {
        layout.classList.remove("mobile-chat-open");
      };
    }

    const input = document.getElementById("venusMessageInput");
    const send = document.getElementById("venusSendButton");

    input.disabled = false;
    send.disabled = false;

    renderMessages(chat);
    renderChatList();
  }

  /* ---------------------------------------------------------
     Messages
  --------------------------------------------------------- */

  function renderMessages(chat) {
    const area = document.getElementById("venusMessagesArea");

    if (!area) return;

    area.innerHTML = "";

    if (!chat.messages || !chat.messages.length) {
      area.innerHTML = `
        <div class="venus-empty-chat">
          <div class="venus-empty-chat-symbol">✦</div>
          <div>ابدأ أول محادثة</div>
        </div>
      `;
      return;
    }

    chat.messages.forEach(message => {
      const row = document.createElement("div");

      row.className =
        "venus-message-row " +
        (message.mine ? "mine" : "theirs");

      row.innerHTML = `
        <div class="venus-message-bubble">
        ${escapeHTML(message.text).replace(/\n/g, "<br>")}
          <span class="venus-message-time">
            ${escapeHTML(message.time)}
          </span>
        </div>
      `;

      area.appendChild(row);
    });

    area.scrollTop = area.scrollHeight;
  }

  /* ---------------------------------------------------------
     Send message
  --------------------------------------------------------- */

  function sendCurrentMessage() {
    if (!currentChatId) return;

    const input = document.getElementById("venusMessageInput");

    const text = input.value.trim();

    if (!text) return;

    const chats = getChats();

    const chat = chats.find(c => c.id === currentChatId);

    if (!chat) return;

    chat.messages.push({
      id: makeMessageId(),
      sender: "me",
      text,
      time: getTime(),
      mine: true
    });

    saveChats(chats);

    input.value = "";

    renderMessages(chat);
    renderChatList();
  }

  /* ---------------------------------------------------------
     New chat modal
  --------------------------------------------------------- */

  function openNewChatModal() {
    const existing = document.getElementById("venusNewChatOverlay");

    if (existing) existing.remove();

    const overlay = document.createElement("div");

    overlay.id = "venusNewChatOverlay";
    overlay.className = "venus-new-chat-overlay";

    overlay.innerHTML = `
      <div class="venus-new-chat-modal">

        <h2>محادثة جديدة</h2>

        <p>
          ابحث عن طالب أو فريق باستخدام اسم المستخدم.
        </p>

        <input
          class="venus-new-user-input"
          id="venusNewUserInput"
          placeholder="@username"
          autocomplete="off"
        />

        <div
          class="venus-new-user-results"
          id="venusNewUserResults"
        ></div>

        <button
          class="venus-new-chat-close"
          id="venusNewChatClose"
        >
          إغلاق
        </button>

      </div>
    `;

    document.body.appendChild(overlay);

    const input = document.getElementById("venusNewUserInput");

    input.focus();

    input.addEventListener("input", searchUsers);

    document.getElementById("venusNewChatClose").onclick = () => {
      overlay.remove();
    };

    overlay.addEventListener("click", event => {
      if (event.target === overlay) {
        overlay.remove();
      }
    });

    searchUsers();
  }

  /* ---------------------------------------------------------
     Search users
  --------------------------------------------------------- */

  function searchUsers() {
    const results = document.getElementById("venusNewUserResults");
    const input = document.getElementById("venusNewUserInput");

    if (!results || !input) return;

    const query = input.value
      .trim()
      .replace(/^@/, "")
      .toLowerCase();

    const currentProfile = getProfile();

    const users = [];

    if (currentProfile) {
      users.push({
        name:
          currentProfile.fullName ||
          currentProfile.name ||
          "My Profile",

        username:
          currentProfile.username
            ? "@" + String(currentProfile.username).replace(/^@/, "")
            : "@myprofile",

        avatar: "✦"
      });
    }

    /*
      Demo users until Firebase is connected.
    */

    users.push(
      {
        name: "VENUS",
        username: "@venus",
        avatar: "✦"
      },
      {
        name: "Volunteer One",
        username: "@volunteer1",
        avatar: "V"
      },
      {
        name: "Creative Team",
        username: "@creative_team",
        avatar: "C"
      }
    );

    const filtered = users.filter(user => {
      if (!query) return true;

      return (
        user.name.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query)
      );
    });

    results.innerHTML = "";

    filtered.forEach(user => {
      const item = document.createElement("div");

      item.className = "venus-user-result";

      item.innerHTML = `
        <div class="venus-user-result-avatar">
        ${escapeHTML(user.avatar)}
        </div>

        <div>
          <div style="font-weight:800;color:#4b0d13;">
            ${escapeHTML(user.name)}
          </div>

          <div style="font-size:12px;color:#806d56;">
            ${escapeHTML(user.username)}
          </div>
        </div>
      `;

      item.onclick = () => createChatWithUser(user);

      results.appendChild(item);
    });

    if (!filtered.length) {
      results.innerHTML = `
        <div style="padding:18px;text-align:center;color:#806d56;">
          ما لقينا مستخدم بهذا الاسم.
        </div>
      `;
    }
  }

  /* ---------------------------------------------------------
     Create chat
  --------------------------------------------------------- */

  function createChatWithUser(user) {
    const chats = getChats();

    let chat = chats.find(
      c => c.username.toLowerCase() === user.username.toLowerCase()
    );

    if (!chat) {
      chat = {
        id: makeId(),
        type: "user",
        name: user.name,
        username: user.username,
        avatar: user.avatar || user.name.charAt(0),
        color: "#861c27",
        messages: []
      };

      chats.unshift(chat);

      saveChats(chats);
    }

    const modal = document.getElementById("venusNewChatOverlay");

    if (modal) modal.remove();

    openChat(chat.id);
  }

  /* ---------------------------------------------------------
     Global button
  --------------------------------------------------------- */

  function connectMessagesButton() {
    const button = document.getElementById("messagesButton");

    if (!button) return;

    button.onclick = openMessagesPage;
  }

  /* ---------------------------------------------------------
     Start
  --------------------------------------------------------- */

  document.addEventListener("DOMContentLoaded", () => {
    connectMessagesButton();
  });

  /*
    In case script.js is loaded after DOMContentLoaded.
  */

  connectMessagesButton();

  window.openMessagesPage = openMessagesPage;

})();
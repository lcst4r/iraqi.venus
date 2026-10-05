document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* =========================================================
       VENUS — TEAM.JS
       Team system — Local MVP
       ========================================================= */

    /* ---------------------------------------------------------
       HELPERS
       --------------------------------------------------------- */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];

    const getData = (key, fallback = null) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : fallback;
        } catch (error) {
            console.error(`VENUS: Could not read ${key}`, error);
            return fallback;
        }
    };

    const saveData = (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`VENUS: Could not save ${key}`, error);
        }
    };

    const getCurrentUser = () => {
        return (
            getData("venusCurrentUser") ||
            getData("currentUser") ||
            getData("venusUser") ||
            null
        );
    };

    /* ---------------------------------------------------------
       STORAGE
       --------------------------------------------------------- */

    let teams = getData("venusTeams", []);

    if (!Array.isArray(teams)) {
        teams = [];
    }

    /* ---------------------------------------------------------
       CURRENT USER
       --------------------------------------------------------- */

    const currentUser = getCurrentUser();

    const getUserId = () => {
        if (!currentUser) return null;

        return (
            currentUser.id ||
            currentUser.userId ||
            currentUser.username ||
            currentUser.nickname ||
            currentUser.name ||
            null
        );
    };

    const getUserName = () => {
        if (!currentUser) return "Venus User";

        return (
            currentUser.name ||
            currentUser.fullName ||
            currentUser.username ||
            currentUser.nickname ||
            "Venus User"
        );
    };

    const getUserUsername = () => {
        if (!currentUser) return "";

        return (
            currentUser.username ||
            currentUser.nickname ||
            ""
        );
    };

    /* ---------------------------------------------------------
       TEAM ID
       --------------------------------------------------------- */

    const createTeamId = () => {
        return (
            "team_" +
            Date.now() +
            "_" +
            Math.random().toString(36).substring(2, 8)
        );
    };

    /* ---------------------------------------------------------
       FIND TEAM
       --------------------------------------------------------- */

    const getTeamById = (teamId) => {
        return teams.find(team => team.id === teamId) || null;
    };

    const getUserTeam = (userId = getUserId()) => {
        if (!userId) return null;

        return (
            teams.find(team =>
                Array.isArray(team.members) &&
                team.members.some(member => member.id === userId)
            ) || null
        );
    };

    /* ---------------------------------------------------------
       TEAM NAME CHECK
       --------------------------------------------------------- */

    const teamNameExists = (name) => {
        const cleanName = String(name || "")
            .trim()
            .toLowerCase();

        return teams.some(team =>
            String(team.name || "")
                .trim()
                .toLowerCase() === cleanName
        );
    };

    /* ---------------------------------------------------------
       TEAM OWNER
       --------------------------------------------------------- */

    const createMemberObject = (user = currentUser) => {
    if (!user) return null;

        return {
            id:
                user.id ||
                user.userId ||
                user.username ||
                user.nickname ||
                user.name,

            name:
                user.name ||
                user.fullName ||
                user.username ||
                user.nickname ||
                "Venus User",

            username:
                user.username ||
                user.nickname ||
                "",

            avatar:
                user.avatar ||
                user.profilePicture ||
                user.image ||
                "",

            stars: Number(user.stars) || 0
        };
    };

    /* ---------------------------------------------------------
       CREATE TEAM
       --------------------------------------------------------- */

    const createTeam = ({
        name,
        description = "",
        avatar = "",
        privacy = "public"
    } = {}) => {

        const user = getCurrentUser();

        if (!user) {
            return {
                success: false,
                message: "You need to be logged in first."
            };
        }

        const userId = getUserId();

        if (!userId) {
            return {
                success: false,
                message: "Your account could not be identified."
            };
        }

        /* User can only belong to one team */
        const existingTeam = getUserTeam(userId);

        if (existingTeam) {
            return {
                success: false,
                message: "You are already a member of a team."
            };
        }

        const cleanName = String(name || "").trim();

        if (!cleanName) {
            return {
                success: false,
                message: "Please enter a team name."
            };
        }

        if (cleanName.length < 2) {
            return {
                success: false,
                message: "Team name is too short."
            };
        }

        if (cleanName.length > 40) {
            return {
                success: false,
                message: "Team name is too long."
            };
        }

        if (teamNameExists(cleanName)) {
            return {
                success: false,
                message: "This team name is already taken."
            };
        }

        const owner = createMemberObject(user);

        const newTeam = {
            id: createTeamId(),

            name: cleanName,

            description:
                String(description || "").trim(),

            avatar,

            privacy:
                privacy === "private"
                    ? "private"
                    : "public",

            createdBy: {
                id: owner.id,
                name: owner.name,
                username: owner.username
            },

            members: [
                owner
            ],

            stars: 0,

            createdAt: new Date().toISOString()
        };

        teams.push(newTeam);

        saveData("venusTeams", teams);

        /* Save team on user */
        const updatedUser = {
            ...user,

            teamId: newTeam.id,

            teamName: newTeam.name
        };

        saveData("venusCurrentUser", updatedUser);
        saveData("currentUser", updatedUser);

        return {
            success: true,
            team: newTeam
        };
    };

    /* ---------------------------------------------------------
       JOIN TEAM
       --------------------------------------------------------- */

    const joinTeam = (teamId) => {

        const user = getCurrentUser();

        if (!user) {
            return {
                success: false,
                message: "You need to be logged in first."
            };
        }

        const userId = getUserId();

        if (!userId) {
            return {
                success: false,
                message: "Your account could not be identified."
            };
        }

        /* One team only */
        const existingTeam = getUserTeam(userId);

        if (existingTeam) {
            return {
                success: false,
                message: "You can only belong to one team."
            };
        }

        const team = getTeamById(teamId);

        if (!team) {
            return {
                success: false,
                message: "Team not found."
            };
        }

        if (team.privacy === "private") {
            return {
                success: false,
                message: "This team is private."
            };
        }

        if (!Array.isArray(team.members)) {
            team.members = [];
        }

        const alreadyMember = team.members.some(
            member => member.id === userId
        );

        if (alreadyMember) {
            return {
                success: false,
                message: "You are already in this team."
            };
        }

        const member = createMemberObject(user);

        team.members.push(member);

        saveData("venusTeams", teams);

        const updatedUser = {
            ...user,

            teamId: team.id,

            teamName: team.name
        };

        saveData("venusCurrentUser", updatedUser);
        saveData("currentUser", updatedUser);

        return {
            success: true,
            team
        };
    };

    /* ---------------------------------------------------------
       LEAVE TEAM
       --------------------------------------------------------- */

    const leaveTeam = (teamId) => {

        const userId = getUserId();

        if (!userId) {
            return {
                success: false,
                message: "You need to be logged in first."
            };
        }

        const team = getTeamById(teamId);

        if (!team) {
            return {
                success: false,
                message: "Team not found."
            };
        }

        if (team.createdBy?.id === userId) {
            return {
                success: false,
                message:
                    "The team owner cannot leave the team. Transfer ownership or delete the team first."
            };
        }

        team.members = team.members.filter(
            member => member.id !== userId
        );

        saveData("venusTeams", teams);

        const user = getCurrentUser();

        if (user) {
            delete user.teamId;
            delete user.teamName;

            saveData("venusCurrentUser", user);
            saveData("currentUser", user);
        }

        return {
            success: true,
            team
        };
    };

    /* ---------------------------------------------------------
       DELETE TEAM
       --------------------------------------------------------- */

    const deleteTeam = (teamId) => {

        const userId = getUserId();

        if (!userId) {
            return {
                success: false,
                message: "You need to be logged in first."
            };
        }

        const team = getTeamById(teamId);

        if (!team) {
            return {
                success: false,
                message: "Team not found."
            };
        }

        if (team.createdBy?.id !== userId) {
            return {
                success: false,
                message: "Only the team owner can delete the team."
            };
        }

        teams = teams.filter(team => team.id !== teamId);

        saveData("venusTeams", teams);

        const user = getCurrentUser();

        if (user) {
            delete user.teamId;
            delete user.teamName;

            saveData("venusCurrentUser", user);
            saveData("currentUser", user);
        }

        return {
            success: true
        };
    };

    /* ---------------------------------------------------------
       ADD STARS
       --------------------------------------------------------- */

    const addTeamStars = (teamId, amount = 0) => {

        const team = getTeamById(teamId);

        if (!team) return false;
        const value = Number(amount);

        if (!Number.isFinite(value)) {
            return false;
        }

        team.stars = Math.max(
            0,
            Number(team.stars || 0) + value
        );

        saveData("venusTeams", teams);

        return true;
    };

    /* ---------------------------------------------------------
       GET TEAM STARS
       --------------------------------------------------------- */

    const calculateTeamStars = (team) => {

        if (!team) return 0;

        /*
         * The team leaderboard can later calculate stars
         * from the members' actual competition activity.
         *
         * For now we keep the stored team stars.
         */

        return Number(team.stars) || 0;
    };

    /* ---------------------------------------------------------
       SORT TEAMS
       --------------------------------------------------------- */

    const getTeamsByStars = () => {

        return [...teams].sort(
            (a, b) =>
                calculateTeamStars(b) -
                calculateTeamStars(a)
        );
    };

    /* ---------------------------------------------------------
       SEARCH TEAMS
       --------------------------------------------------------- */

    const searchTeams = (query = "") => {

        const cleanQuery =
            String(query)
                .trim()
                .toLowerCase();

        if (!cleanQuery) {
            return [...teams];
        }

        return teams.filter(team => {

            const name =
                String(team.name || "").toLowerCase();

            const description =
                String(team.description || "").toLowerCase();

            return (
                name.includes(cleanQuery) ||
                description.includes(cleanQuery)
            );
        });
    };

    /* ---------------------------------------------------------
       RENDER TEAM
       --------------------------------------------------------- */

    const renderTeam = (team, container) => {

        if (!team || !container) return;

        container.innerHTML = "";

        const card = document.createElement("div");

        card.className = "venus-team-card";

        const memberCount =
            Array.isArray(team.members)
                ? team.members.length
                : 0;

        card.innerHTML = `
            <div class="venus-team-card-avatar">
                ${
                    team.avatar
                        ? `<img src="${escapeHTML(team.avatar)}" alt="">`
                        : `<span>★</span>`
                }
            </div>

            <div class="venus-team-card-info">
                <h3>${escapeHTML(team.name)}</h3>

                ${team.description
                    ? `<p>${escapeHTML(team.description)}</p>`
                    : ""}

                <div class="venus-team-meta">
                    <span>${memberCount} member${memberCount === 1 ? "" : "s"}</span>
                    <span>★ ${calculateTeamStars(team)}</span>
                </div>

                <small>
                    Created by
                    ${escapeHTML(team.createdBy?.name || "Venus User")}
                </small>
            </div>
        `;

        container.appendChild(card);
    };

    /* ---------------------------------------------------------
       RENDER TEAM MEMBERS
       --------------------------------------------------------- */

    const renderMembers = (team, container) => {

        if (!team || !container) return;

        container.innerHTML = "";

        if (!Array.isArray(team.members)) {
            return;
        }

        team.members.forEach(member => {

            const item =
                document.createElement("div");

            item.className =
                "venus-team-member";

            const isOwner =
                team.createdBy?.id === member.id;

            item.innerHTML = `
                <div class="venus-member-avatar">
                    ${
                        member.avatar
                            ? `<img src="${escapeHTML(member.avatar)}" alt="">`
                            : `<span>♡</span>`
                    }
                </div>

                <div class="venus-member-info">
                    <strong>
                        ${escapeHTML(member.name || "Venus User")}
                    </strong>

                    ${
                        member.username
                            ? `<span>@${escapeHTML(member.username)}</span>`
                            : ""
                    }
                </div>

                ${
                    isOwner
                        ? `<span class="venus-team-owner">Owner</span>`
                        : ""
                }
            `;

            container.appendChild(item);
        });
    };

    /* ---------------------------------------------------------
       ESCAPE HTML
       --------------------------------------------------------- */

    const escapeHTML = (value) => {

        const div =
            document.createElement("div");

        div.textContent =
            String(value ?? "");

        return div.innerHTML;
    };

    /* ---------------------------------------------------------
       GLOBAL VENUS TEAM API
       --------------------------------------------------------- */

    window.VenusTeam = {

        /* Data */
        getTeams: () => [...teams],

        getTeamById,

        getUserTeam,

        /* Team actions */
        createTeam,

        joinTeam,

        leaveTeam,

        deleteTeam,

        /* Stars */
        addTeamStars,

        calculateTeamStars,

        getTeamsByStars,

        /* Search */
        searchTeams,

        /* Rendering */
        renderTeam,

        renderMembers,

        /* Current user */
        getCurrentUser,

        getUserId
    };

    /* ---------------------------------------------------------
       AUTO INITIALIZATION
       --------------------------------------------------------- */

    const teamPage = $("[data-team-page]");

    if (teamPage) {

        const teamId =
            teamPage.dataset.teamId;

        if (teamId) {

            const team =
                getTeamById(teamId);

            if (team) {

                const teamContainer =
                    $("[data-team-container]");

                const membersContainer =
                    $("[data-team-members]");

                renderTeam(
                    team,
                    teamContainer
                );

                renderMembers(
                    team,
                    membersContainer
                );
            }
        }
    }

    console.log(
        "VENUS Team System loaded successfully."
    );

});
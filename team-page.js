document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* =========================================================
       VENUS — TEAM PAGE.JS
       Connects team.html with team.js
       ========================================================= */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    /* ---------------------------------------------------------
       ELEMENTS
       --------------------------------------------------------- */

    const createTeamModal =
        $("#createTeamModal");

    const teamDetailsModal =
        $("#teamDetailsModal");

    const openCreateTeam =
        $("#openCreateTeam");

    const closeCreateTeam =
        $("#closeCreateTeam");

    const closeCreateTeamOverlay =
        $("#closeCreateTeamOverlay");

    const closeTeamDetails =
        $("#closeTeamDetails");

    const closeTeamDetailsOverlay =
        $("#closeTeamDetailsOverlay");

    const createTeamButton =
        $("#createTeamButton");

    const teamName =
        $("#teamName");

    const teamDescription =
        $("#teamDescription");

    const teamPrivacy =
        $("#teamPrivacy");

    const teamFormMessage =
        $("#teamFormMessage");

    const teamSearch =
        $("#teamSearch");

    const teamsContainer =
        $("#teamsContainer");

    const myTeamContainer =
        $("#myTeamContainer");

    const teamCount =
        $("#teamCount");

    const teamDetailsContainer =
        $("#teamDetailsContainer");

    const teamMembersContainer =
        $("#teamMembersContainer");

    const teamActions =
        $("#teamActions");


    /* ---------------------------------------------------------
       SAFETY CHECK
       --------------------------------------------------------- */

    if (!window.VenusTeam) {
        console.error(
            "VENUS: team.js must load before team-page.js"
        );

        return;
    }


    /* ---------------------------------------------------------
       MODAL HELPERS
       --------------------------------------------------------- */

    const openModal = (modal) => {

        if (!modal) return;

        modal.hidden = false;

        document.body.style.overflow = "hidden";
    };


    const closeModal = (modal) => {

        if (!modal) return;

        modal.hidden = true;

        document.body.style.overflow = "";
    };


    /* ---------------------------------------------------------
       FORM MESSAGE
       --------------------------------------------------------- */

    const showMessage = (
        message,
        type = "error"
    ) => {

        if (!teamFormMessage) return;

        teamFormMessage.textContent =
            message;

        teamFormMessage.className =
            `venus-form-message ${type}`;

        teamFormMessage.hidden = false;
    };


    const clearMessage = () => {

        if (!teamFormMessage) return;

        teamFormMessage.textContent = "";

        teamFormMessage.hidden = true;

        teamFormMessage.className =
            "venus-form-message";
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
       RENDER ALL TEAMS
       --------------------------------------------------------- */

    const renderTeams = (
        teams = VenusTeam.getTeams()
    ) => {

        if (!teamsContainer) return;

        teamsContainer.innerHTML = "";

        if (!teams.length) {

            teamsContainer.innerHTML = `
                <div class="venus-team-empty">

                    <h3>
                        لا توجد فرق بعد
                    </h3>

                    <p>
                        كن أول شخص ينشئ فريقًا في Venus.
                    </p>
                    </div>
            `;

            updateTeamCount(0);

            return;
        }


        teams.forEach(team => {

            const card =
                document.createElement("article");

            card.className =
                "venus-team-card";

            card.dataset.teamId =
                team.id;

            const members =
                Array.isArray(team.members)
                    ? team.members.length
                    : 0;

            card.innerHTML = `

                <div class="venus-team-card-avatar">

                    ${
                        team.avatar
                            ? `
                                <img
                                    src="${escapeHTML(team.avatar)}"
                                    alt=""
                                >
                            `
                            : `
                                <span>★</span>
                            `
                    }

                </div>


                <div class="venus-team-card-info">

                    <h3>
                        ${escapeHTML(team.name)}
                    </h3>

                    ${
                        team.description
                            ? `
                                <p>
                                    ${escapeHTML(team.description)}
                                </p>
                            `
                            : ""
                    }

                    <div class="venus-team-meta">

                        <span>
                            ${members}
                            ${members === 1 ? "عضو" : "أعضاء"}
                        </span>

                        <span>
                            ★
                            ${VenusTeam.calculateTeamStars(team)}
                        </span>

                    </div>

                    <small>
                        أنشأه
                        ${escapeHTML(
                            team.createdBy?.name ||
                            "Venus User"
                        )}
                    </small>

                </div>
            `;


            card.addEventListener(
                "click",
                () => openTeamDetails(team.id)
            );


            teamsContainer.appendChild(card);
        });


        updateTeamCount(teams.length);
    };


    /* ---------------------------------------------------------
       TEAM COUNT
       --------------------------------------------------------- */

    const updateTeamCount = (count) => {

        if (!teamCount) return;

        teamCount.textContent =
            `${count} ${count === 1 ? "فريق" : "فرق"}`;
    };


    /* ---------------------------------------------------------
       RENDER MY TEAM
       --------------------------------------------------------- */

    const renderMyTeam = () => {

        if (!myTeamContainer) return;

        const team =
            VenusTeam.getUserTeam();

        myTeamContainer.innerHTML = "";


        if (!team) {

            myTeamContainer.innerHTML = `
                <div class="venus-team-empty">

                    <h3>
                        ما عندك فريق حتى الآن
                    </h3>

                    <p>
                        أنشئ فريقك أو انضم إلى أحد الفرق الموجودة.
                    </p>

                </div>
            `;

            return;
        }


        const card =
            document.createElement("article");

        card.className =
            "venus-team-card";

        card.dataset.teamId =
            team.id;


        const memberCount =
            Array.isArray(team.members)
                ? team.members.length
                : 0;


        card.innerHTML = `

            <div class="venus-team-card-avatar">

                ${
                    team.avatar
                        ? `
                            <img
                                src="${escapeHTML(team.avatar)}"
                                alt=""
                                >
                        `
                        : `
                            <span>★</span>
                        `
                }

            </div>


            <div class="venus-team-card-info">

                <h3>
                    ${escapeHTML(team.name)}
                </h3>

                ${
                    team.description
                        ? `
                            <p>
                                ${escapeHTML(team.description)}
                            </p>
                        `
                        : ""
                }

                <div class="venus-team-meta">

                    <span>
                        ${memberCount}
                        ${memberCount === 1 ? "عضو" : "أعضاء"}
                    </span>

                    <span>
                        ★
                        ${VenusTeam.calculateTeamStars(team)}
                    </span>

                </div>

                <small>
                    فريقك الحالي
                </small>

            </div>
        `;


        card.addEventListener(
            "click",
            () => openTeamDetails(team.id)
        );


        myTeamContainer.appendChild(card);
    };


    /* ---------------------------------------------------------
       OPEN TEAM DETAILS
       --------------------------------------------------------- */

    const openTeamDetails = (teamId) => {

        const team =
            VenusTeam.getTeamById(teamId);

        if (!team) return;


        const currentUser =
            VenusTeam.getCurrentUser();

        const userId =
            VenusTeam.getUserId();


        const isMember =
            Array.isArray(team.members) &&
            team.members.some(
                member => member.id === userId
            );


        const isOwner =
            team.createdBy?.id === userId;


        /* Team information */

        teamDetailsContainer.innerHTML = `

            <div class="venus-team-details-header">

                <div class="venus-team-details-avatar">

                    ${
                        team.avatar
                            ? `
                                <img
                                    src="${escapeHTML(team.avatar)}"
                                    alt=""
                                >
                            `
                            : `
                                <span>★</span>
                            `
                    }

                </div>


                <div class="venus-team-details-title">

                    <h2>
                        ${escapeHTML(team.name)}
                    </h2>

                    <p>
                        أنشأه
                        ${escapeHTML(
                            team.createdBy?.name ||
                            "Venus User"
                        )}
                    </p>

                </div>

            </div>


            ${
                team.description
                    ? `
                        <p>
                            ${escapeHTML(team.description)}
                        </p>
                    `
                    : ""
            }


            <div class="venus-team-meta">

                <span>
                    ${
                        Array.isArray(team.members)
                            ? team.members.length
                            : 0
                    }
                    أعضاء
                </span>

                <span>
                    ★
                    ${VenusTeam.calculateTeamStars(team)}
                </span>

                <span>
                    ${
                        team.privacy === "private"
                            ? "خاص"
                            : "عام"
                    }
                </span>

            </div>
        `;


        /* Members */

        if (teamMembersContainer) {

            VenusTeam.renderMembers(
                team,
                teamMembersContainer
                );
        }


        /* Actions */

        if (teamActions) {

            teamActions.innerHTML = "";


            if (isOwner) {

                const deleteButton =
                    document.createElement("button");

                deleteButton.textContent =
                    "حذف الفريق";

                deleteButton.style.background =
                    "rgba(170, 20, 20, 0.18)";

                deleteButton.style.color =
                    "#fff";


                deleteButton.addEventListener(
                    "click",
                    () => {

                        const confirmed =
                            window.confirm(
                                "هل أنتِ متأكدة من حذف الفريق؟"
                            );

                        if (!confirmed) return;


                        const result =
                            VenusTeam.deleteTeam(team.id);


                        if (!result.success) {

                            alert(result.message);

                            return;
                        }


                        closeModal(teamDetailsModal);

                        renderMyTeam();

                        renderTeams();
                    }
                );


                teamActions.appendChild(
                    deleteButton
                );

            } else if (isMember) {

                const leaveButton =
                    document.createElement("button");

                leaveButton.textContent =
                    "مغادرة الفريق";

                leaveButton.style.background =
                    "rgba(170, 20, 20, 0.18)";

                leaveButton.style.color =
                    "#fff";


                leaveButton.addEventListener(
                    "click",
                    () => {

                        const result =
                            VenusTeam.leaveTeam(
                                team.id
                            );


                        if (!result.success) {

                            alert(result.message);

                            return;
                        }


                        closeModal(
                            teamDetailsModal
                        );

                        renderMyTeam();

                        renderTeams();
                    }
                );


                teamActions.appendChild(
                    leaveButton
                );

            } else {

                const joinButton =
                    document.createElement("button");

                joinButton.textContent =
                    team.privacy === "private"
                        ? "فريق خاص"
                        : "الانضمام للفريق";

                joinButton.style.background =
                    team.privacy === "private"
                        ? "rgba(255,255,255,0.08)"
                        : "#a31313";

                joinButton.style.color =
                    "#fff";


                if (team.privacy === "private") {

                    joinButton.disabled = true;

                } else {

                    joinButton.addEventListener(
                        "click",
                        () => {

                            const result =
                                VenusTeam.joinTeam(
                                    team.id
                                );


                            if (!result.success) {

                                alert(result.message);

                                return;
                            }


                            closeModal(
                                teamDetailsModal
                            );

                            renderMyTeam();

                            renderTeams();
                        }
                    );
                }


                teamActions.appendChild(
                    joinButton
                );
            }
        }


        openModal(teamDetailsModal);
    };
    /* ---------------------------------------------------------
       CREATE TEAM
       --------------------------------------------------------- */

    const handleCreateTeam = () => {

        clearMessage();


        const name =
            teamName?.value.trim() || "";

        const description =
            teamDescription?.value.trim() || "";

        const privacy =
            teamPrivacy?.value || "public";


        const result =
            VenusTeam.createTeam({
                name,
                description,
                privacy
            });


        if (!result.success) {

            showMessage(
                result.message,
                "error"
            );

            return;
        }


        showMessage(
            "تم إنشاء الفريق بنجاح ✦",
            "success"
        );


        setTimeout(() => {

            closeModal(
                createTeamModal
            );


            if (teamName)
                teamName.value = "";

            if (teamDescription)
                teamDescription.value = "";

            if (teamPrivacy)
                teamPrivacy.value = "public";


            renderMyTeam();

            renderTeams();

        }, 500);
    };


    /* ---------------------------------------------------------
       SEARCH
       --------------------------------------------------------- */

    const handleSearch = () => {

        const query =
            teamSearch?.value || "";

        const results =
            VenusTeam.searchTeams(query);

        renderTeams(results);
    };


    /* ---------------------------------------------------------
       EVENT LISTENERS
       --------------------------------------------------------- */

    openCreateTeam?.addEventListener(
        "click",
        () => {

            clearMessage();

            openModal(
                createTeamModal
            );
        }
    );


    closeCreateTeam?.addEventListener(
        "click",
        () =>
            closeModal(createTeamModal)
    );


    closeCreateTeamOverlay?.addEventListener(
        "click",
        () =>
            closeModal(createTeamModal)
    );


    closeTeamDetails?.addEventListener(
        "click",
        () =>
            closeModal(teamDetailsModal)
    );


    closeTeamDetailsOverlay?.addEventListener(
        "click",
        () =>
            closeModal(teamDetailsModal)
    );


    createTeamButton?.addEventListener(
        "click",
        handleCreateTeam
    );


    teamSearch?.addEventListener(
        "input",
        handleSearch
    );


    /* ---------------------------------------------------------
       ESCAPE KEY
       --------------------------------------------------------- */

    document.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Escape")
                return;

            closeModal(createTeamModal);

            closeModal(teamDetailsModal);
        }
    );


    /* ---------------------------------------------------------
       INITIAL RENDER
       --------------------------------------------------------- */

    renderMyTeam();

    renderTeams();


    console.log(
        "VENUS Team Page loaded successfully."
    );

});
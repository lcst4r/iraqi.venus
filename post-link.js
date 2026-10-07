/* =========================================================
   VENUS — POST LINK
   Connect all create-post buttons to post.html
   ========================================================= */

document.addEventListener("click", (event) => {
    "use strict";

    const target = event.target.closest(
        "#addPostButton, " +
        "#emptyCreateButton, " +
        "#emptyCreatePost, " +
        "#feedEmptyCreateButton, " +
        "#openCreatePost"
    );

    if (!target) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    window.location.href = "post.html";
});
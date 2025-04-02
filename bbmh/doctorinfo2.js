document.addEventListener("DOMContentLoaded", function () {
    const moreInfoBtn = document.getElementById("moreInfoBtn");

    if (moreInfoBtn) {
        moreInfoBtn.addEventListener("click", function () {
            window.location.href = "doctorinfoindex.html";
        });
    }
});
